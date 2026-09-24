import { useCallback, useEffect, useState } from "react";
import type { RefObject } from "react";

/** Whether an element is fullscreen, whether the browser can do it at all, and a way to switch. */
export interface FullscreenState {
	/** Whether the element is the one the browser shows fullscreen now. */
	active: boolean;
	/** Whether the browser can put an element fullscreen. iPhone Safari cannot, so a control for it should be left out there. */
	supported: boolean;
	/** Puts the element fullscreen, or leaves fullscreen when anything is. */
	toggle: () => void;
}

/**
 * Put an element fullscreen and follow whether it is. It follows the browser rather than its own state, since the back gesture or `Esc` also
 * leaves fullscreen.
 *
 * @param ref The element to put fullscreen.
 * @returns The state and the switch.
 */
export function useFullscreen(ref: RefObject<HTMLElement | null>): FullscreenState {
	const [active, setActive] = useState(false);

	useEffect(() => {
		const sync = () => setActive(document.fullscreenElement !== null && document.fullscreenElement === ref.current);
		sync();
		document.addEventListener("fullscreenchange", sync);
		return () => document.removeEventListener("fullscreenchange", sync);
	}, [ref]);

	const toggle = useCallback(() => {
		if (document.fullscreenElement) {
			void document.exitFullscreen().catch(() => {});
		} else {
			void ref.current?.requestFullscreen().catch(() => {});
		}
	}, [ref]);

	return { active, supported: typeof document !== "undefined" && document.fullscreenEnabled, toggle };
}
