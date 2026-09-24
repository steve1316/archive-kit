import type { MouseEvent } from "react";

/**
 * Stop a click inside a panel from reaching the stage or player under it.
 *
 * @param event The click.
 */
export function stopClick(event: MouseEvent): void {
	event.stopPropagation();
}
