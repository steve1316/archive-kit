import type { MouseEvent, PointerEvent } from "react";

/**
 * Stop a click inside a panel from reaching the stage or player under it.
 *
 * @param event The click.
 */
export function stopClick(event: MouseEvent): void {
	event.stopPropagation();
}

/**
 * Whether an event happened on the words of a line, which sit in `SelectableText` spans.
 *
 * @param target The event's target.
 * @returns Whether the target is inside a line's words.
 */
function onWords(target: EventTarget | null): boolean {
	return target instanceof Element && target.closest("[data-selectable]") !== null;
}

/**
 * Drop a selection left over from earlier when a press lands away from the words.
 *
 * A player is `user-select: none` around its words, and a press there leaves an existing selection standing. `isTextClick` would then
 * take every later click for the end of a drag, and the player would never read on. A press on the words keeps it, since a drag starts there.
 *
 * @param event The press.
 */
function dropStaleSelection(event: PointerEvent): void {
	if (!onWords(event.target)) window.getSelection()?.removeAllRanges();
}

/**
 * Whether a click landed on the words of a line, or ended a drag that selected some.
 *
 * The words sit in inline `SelectableText` spans, so the browser's own hit test tells a click on them from one on the space around them. A
 * player reads on only when this is false, which leaves a double click free to select a word. Players take it through {@link readOnHandlers}.
 *
 * @param event The click.
 * @returns Whether the click belongs to the text rather than to the scene.
 */
export function isTextClick(event: MouseEvent): boolean {
	return window.getSelection()?.isCollapsed === false || onWords(event.target);
}

/**
 * The handlers a story player spreads onto itself, so a click reads on unless it belongs to the line's words.
 *
 * The two come as a pair. Without the press handler, a selection made earlier would hold every later click.
 *
 * @param advance Moves the story on.
 * @returns `onPointerDown` and `onClick` for the player's element.
 */
export function readOnHandlers(advance: () => void) {
	return {
		onPointerDown: dropStaleSelection,
		onClick: (event: MouseEvent) => {
			if (!isTextClick(event)) advance();
		}
	};
}
