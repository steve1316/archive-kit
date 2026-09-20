// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// The data store

/** Options for `createDataStore`. */
export interface DataStoreOptions {
	/**
	 * Hosted URL of every data file, keyed by the name callers will ask for.
	 *
	 * The app builds this from its own `import.meta.glob`, because a Vite macro written inside an installed package globs the package's folder
	 * rather than the app's. A glob's keys are paths, so an app usually re-keys them to bare names first:
	 *
	 * `Object.fromEntries(Object.entries(glob).map(([path, url]) => [path.replace(/^.*\/|\.json$/g, ""), url]))`
	 */
	urls: Readonly<Record<string, string>>;
}

/** What an archive gets back from `createDataStore`. */
export interface DataStore {
	/**
	 * Fetch and parse one data file, every time it is called.
	 *
	 * @param name The file's name, as `urls` keys it.
	 * @returns The parsed JSON.
	 * @throws When the name is not in `urls`, the request fails, the response is not OK, or the body is not JSON. Every message names the file.
	 */
	fetchFile<T>(name: string): Promise<T>;
	/**
	 * Run a load at most once per key, and forget a failed one so a retry actually retries.
	 *
	 * The in-flight promise is what gets cached, not its result, so two callers racing for the same key share one request. A rejection is
	 * dropped from the cache, because caching it would make a transient network failure permanent for the life of the page.
	 *
	 * Keys here are the caller's own namespace. `loadFile` prefixes its keys with `file:`, so caching a processed value under the same name as
	 * the file it came from - which is what GFL's `loadShard` does - cannot collide with the raw file.
	 *
	 * Dropping the rejection needs an internal `catch`, which marks the promise handled. A caller that ignores the returned promise therefore
	 * gets no unhandled-rejection warning, so failures have to be handled at the call site to be seen at all.
	 *
	 * @param key What to cache under.
	 * @param make Starts the load. Only called when the key is not already cached.
	 * @returns The cached or freshly started load.
	 */
	loadOnce<T>(key: string, make: () => Promise<T>): Promise<T>;
	/**
	 * Fetch one data file at most once. `loadOnce` over `fetchFile`, which is what most callers want.
	 *
	 * @param name The file's name, as `urls` keys it.
	 * @returns The parsed JSON.
	 * @throws Everything `fetchFile` throws, on the first call for a name.
	 */
	loadFile<T>(name: string): Promise<T>;
	/** Forget every cached load, so the next call fetches again. */
	clear(): void;
}

/**
 * Build an archive's data layer: fetching, and caching that survives a failure.
 *
 * This carries GFL's `fetchData` and `cacheUntilFailure` with the globs left behind. The globs are the whole reason the kit cannot own this
 * outright - see invariant 1 - so the URL map arrives as an argument and nothing here knows a path convention or a file extension.
 *
 * @param options The URL map.
 * @returns The store.
 */
export function createDataStore({ urls }: DataStoreOptions): DataStore {
	// Values are promises of unknown, since one cache holds loads of many different shapes. `loadOnce` casts on the way out, which is safe as
	// long as a key is always used for the same load. `loadFile` namespaces its own keys so it cannot break that on the caller's behalf.
	const cache = new Map<string, Promise<unknown>>();

	const fetchFile = async <T>(name: string): Promise<T> => {
		// `hasOwn` rather than an undefined check, or an inherited name such as `toString` resolves to a function off `Object.prototype` and
		// gets handed to `fetch`. An empty entry is rejected too: in a browser `fetch("")` re-fetches the current page and answers 200.
		const url = Object.hasOwn(urls, name) ? urls[name] : undefined;
		if (url === undefined || url === "") {
			throw new Error(`${name} is not a known data file`);
		}
		let response: Response;
		try {
			response = await fetch(url);
		} catch (cause) {
			throw new Error(`${name} could not be fetched from ${url}`, { cause });
		}
		if (!response.ok) {
			throw new Error(`${name} failed to load with HTTP ${response.status}`);
		}
		try {
			return (await response.json()) as T;
		} catch (cause) {
			// A static host with an SPA fallback answers an unknown path with index.html and HTTP 200, so this is the shape a missing data file
			// actually takes in production. Without the file name the reader sees only a bare SyntaxError about a `<`.
			throw new Error(`${name} loaded from ${url} but did not parse as JSON`, { cause });
		}
	};

	const loadOnce = <T>(key: string, make: () => Promise<T>): Promise<T> => {
		const cached = cache.get(key);
		if (cached !== undefined) {
			return cached as Promise<T>;
		}
		const pending = make();
		cache.set(key, pending);
		pending.catch(() => {
			if (cache.get(key) === pending) {
				cache.delete(key);
			}
		});
		return pending;
	};

	return {
		fetchFile,
		loadOnce,
		// Prefixed so a processed value an app caches under a file's own name cannot alias the raw file. See `loadOnce`.
		loadFile: <T>(name: string): Promise<T> => loadOnce(`file:${name}`, () => fetchFile<T>(name)),
		clear: () => cache.clear()
	};
}
