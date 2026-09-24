import { useEffect, useRef } from "react";
import type { RefObject } from "react";

/**
 * Close a panel on a click outside it. A click that `swallow` accepts is spent on closing alone, so it never also presses what sits under it,
 * while any other outside click closes the panel and still does its own job, such as a navbar link. A press that began inside the panel, such
 * as a slider drag released outside, leaves it open.
 *
 * @param panel The panel's element.
 * @param onClose Called to close the panel. Read through a ref, so a new function on a re-render does not reset a press still going on.
 * @param swallow Whether an outside click on this element is spent on closing alone. Read through a ref as well.
 */
export function useCloseOnOutsidePress(panel: RefObject<HTMLElement | null>, onClose: () => void, swallow: (target: Element) => boolean): void {
	const handlers = useRef({ onClose, swallow });
	useEffect(() => {
		handlers.current = { onClose, swallow };
	}, [onClose, swallow]);

	useEffect(() => {
		let pressedInside = false;
		const inside = (target: EventTarget | null) => target instanceof Node && panel.current?.contains(target) === true;
		const onDown = (event: PointerEvent) => {
			pressedInside = inside(event.target);
		};
		const onClick = (event: MouseEvent) => {
			const began = pressedInside;
			pressedInside = false;
			if (inside(event.target)) {
				return;
			}
			if (event.target instanceof Element && handlers.current.swallow(event.target)) {
				event.stopPropagation();
				event.preventDefault();
			}
			if (!began) {
				handlers.current.onClose();
			}
		};
		window.addEventListener("pointerdown", onDown, true);
		window.addEventListener("click", onClick, true);
		return () => {
			window.removeEventListener("pointerdown", onDown, true);
			window.removeEventListener("click", onClick, true);
		};
	}, [panel]);
}
