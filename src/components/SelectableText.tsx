import { Box } from "@mui/material";
import type { ReactNode } from "react";

/**
 * The words can be selected, and the text cursor over them says a click there will not read on. They take the pointer even inside a
 * layer that ignores it, since a player often lays its text over the stage that way.
 */
const SELECTABLE_SX = { userSelect: "text", cursor: "text", pointerEvents: "auto" } as const;

/** Props for SelectableText. */
interface SelectableTextProps {
	/** The words, inline. Anything block-level inside would widen the area that no longer reads on. */
	children: ReactNode;
}

/**
 * Words a reader can select inside a story player. An inline span, so a click on the space around it still lands on the player.
 *
 * @param props The component's props.
 * @returns The words in a selectable span.
 */
export default function SelectableText({ children }: SelectableTextProps) {
	return (
		<Box component="span" sx={SELECTABLE_SX} data-selectable>
			{children}
		</Box>
	);
}
