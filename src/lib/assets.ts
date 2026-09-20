// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// Asset URLs

/** What an archive gets back from `createAssetUrls`. */
export interface AssetUrls {
	/** The base the URLs are built against, with any trailing slashes removed. */
	readonly base: string;
	/**
	 * Absolute URL for one file on the asset host.
	 *
	 * @param path Unencoded path relative to the base, such as `tdolls/65/card.webp`.
	 * @returns The absolute, percent-encoded URL.
	 */
	url(path: string): string;
	/**
	 * Absolute URL for a folder on the asset host, ending in a slash.
	 *
	 * A Spine atlas names its page images by bare filename, so a runtime needs the folder to resolve them against.
	 *
	 * @param path Unencoded folder path relative to the base.
	 * @returns The absolute, percent-encoded URL, ending in a slash.
	 */
	dir(path: string): string;
}

/**
 * Build the two URL primitives an archive derives all its asset paths from.
 *
 * The kit stops here on purpose. Every named builder above this - a card, a skill icon, a Spine rig - encodes one game's published folder
 * layout, so those belong to the app. What the kit owns is the part that is the same everywhere: the host, and encoding each path segment so
 * a name with a space or an ampersand survives the trip.
 *
 * `baseUrl` is a parameter rather than a read of `import.meta.env`, because a Vite macro inside an installed package resolves against the
 * package's own folder. That is invariant 1, and it is why this is a factory at all.
 *
 * @param baseUrl The asset host, with or without a trailing slash.
 * @returns The `url` and `dir` builders, bound to that host.
 */
export function createAssetUrls(baseUrl: string): AssetUrls {
	const base = baseUrl.replace(/\/+$/, "");
	const url = (path: string): string => `${base}/${path.split("/").map(encodeURIComponent).join("/")}`;
	return {
		base,
		url,
		dir: (path: string): string => {
			// A trailing slash on the way in would otherwise double up. GFL guarded this at each call site, so a rig with no subfolder did not
			// end up at `spine/65//`, which is exactly the case this method exists for.
			const trimmed = path.replace(/\/+$/, "");
			return trimmed === "" ? `${base}/` : `${url(trimmed)}/`;
		}
	};
}
