import { useEffect } from "react";

/** What a phone's media controls show while the page plays sound. */
export interface MediaSessionInfo {
	/** The main line, such as a story's title. */
	title: string;
	/** The line under it, such as the story's chapter. */
	artist?: string;
	/** The third line, such as the site's name. */
	album?: string;
	/** The picture's URL, such as the scene on screen, or null for none. */
	artwork?: string | null;
	/** The picture's media type. Defaults to WebP. */
	artworkType?: string;
}

/**
 * Show a title, a subtitle and a picture in the phone's media controls, rather than the site's icon and address. The metadata is cleared when the
 * page leaves, and nothing happens in a browser without media sessions.
 *
 * @param info What to show.
 */
export function useMediaSession({ title, artist, album, artwork, artworkType = "image/webp" }: MediaSessionInfo): void {
	useEffect(() => {
		if (!("mediaSession" in navigator)) {
			return;
		}
		navigator.mediaSession.metadata = new MediaMetadata({ title, artist, album, artwork: artwork ? [{ src: artwork, type: artworkType }] : [] });
		return () => {
			navigator.mediaSession.metadata = null;
		};
	}, [title, artist, album, artwork, artworkType]);
}
