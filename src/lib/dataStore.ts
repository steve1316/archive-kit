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
	 * @throws When the name is not in `urls`, or the response is not OK.
	 */
	fetchFile<T>(name: string): Promise<T>;
	/**
	 * Run a load at most once per key, and forget a failed one so a retry actually retries.
	 *
	 * The in-flight promise is what gets cached, not its result, so two callers racing for the same key share one request. A rejection is
	 * dropped from the cache, because caching it would make a transient network failure permanent for the life of the page.
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
	// long as a key is always used for the same load - the same contract a caller already has with any keyed cache.
	const cache = new Map<string, Promise<unknown>>();

	const fetchFile = async <T>(name: string): Promise<T> => {
		const url = urls[name];
		if (url === undefined) {
			throw new Error(`${name} is not a known data file`);
		}
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`${name} failed to load with HTTP ${response.status}`);
		}
		return (await response.json()) as T;
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
		loadFile: <T>(name: string): Promise<T> => loadOnce(name, () => fetchFile<T>(name)),
		clear: () => cache.clear()
	};
}
