import type { MouseEvent } from "react";

/**
 * Stop a click inside a panel from reaching the stage or player under it.
 *
 * @param event The click.
 */
export function stopClick(event: MouseEvent): void {
	event.stopPropagation();
}

/**
 * Whether a click landed on the words of a line, or ended a drag that selected some.
 *
 * The words sit in inline `SelectableText` spans, so the browser's own hit test tells a click on them from one on the space around them. A
 * player reads on only when this is false, which leaves a double click free to select a word.
 *
 * @param event The click.
 * @returns Whether the click belongs to the text rather than to the scene.
 */
export function isTextClick(event: MouseEvent): boolean {
	const selected = window.getSelection()?.isCollapsed === false;
	return selected || (event.target instanceof Element && event.target.closest("[data-selectable]") !== null);
}
