import { useCallback, useEffect } from "react";
import type { RefObject } from "react";

import type { UseZoomPanOptions } from "./useZoomPan.js";

/**
 * Pan limits for full art drawn with `containArtSx` inside a zoomable stage.
 *
 * Zoomed past the stage, the art's edge may be dragged to the middle of the screen. Smaller than the stage, as when fitted,
 * its centre may be dragged to the screen's edge, leaving half of it on screen. Both are half of the larger of art and stage.
 *
 * @param artRef Ref to the art element, which fills the stage so its box is the stage's size.
 * @returns A stable `panBounds` callback for `useZoomPan`.
 */
export function useArtPanBounds(artRef: RefObject<HTMLImageElement | null>): NonNullable<UseZoomPanOptions["panBounds"]> {
	return useCallback(
		(scale: number) => {
			const art = artRef.current;
			if (!art) {
				return { x: 0, y: 0 };
			}
			// Before the art loads its natural size is 0, so it is treated as a square until then.
			const fit = Math.min(art.clientWidth / (art.naturalWidth || 1), art.clientHeight / (art.naturalHeight || 1));
			const width = (art.naturalWidth || 1) * fit * scale;
			const height = (art.naturalHeight || 1) * fit * scale;
			return { x: Math.max(width, art.clientWidth) / 2, y: Math.max(height, art.clientHeight) / 2 };
		},
		[artRef]
	);
}

/**
 * Run `close` when the Escape key is pressed anywhere on the page. With `first`, it hears the key before the page's own key handlers and
 * keeps it from them, so closing a panel does not also run a page shortcut bound to Escape.
 *
 * @param close Closes the viewer or panel.
 * @param first Whether to take Escape before anything else on the page.
 */
export function useCloseOnEscape(close: () => void, first = false): void {
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				if (first) {
					event.stopPropagation();
				}
				close();
			}
		};
		window.addEventListener("keydown", onKey, first);
		return () => window.removeEventListener("keydown", onKey, first);
	}, [close, first]);
}
