import { memo } from "react";

import { GlobalStyles } from "@mui/material";

/** The attribute the navbar's bar and its spacer carry, which `HideNavbar` hides them by. A site with its own navbar can mark it the same way. */
export const NAVBAR_ATTRIBUTE = "data-archive-navbar";

/** Props for HideNavbar. */
interface HideNavbarProps {
	/** The media query to hide the navbar under, such as a phone on its side. */
	query: string;
}

/**
 * Hide the navbar and its spacer while this is mounted and the screen matches `query`, so a page such as a story reader gets the whole screen.
 * It is a plain style rule, so turning the phone never waits on a render, and the navbar comes back as soon as the page leaves.
 *
 * @param props Component props.
 * @returns The style rule.
 */
function HideNavbar({ query }: HideNavbarProps) {
	// Important, since a bar's own display rule weighs the same as this selector and is often inserted later, which would win the tie.
	return <GlobalStyles styles={{ [`@media ${query}`]: { [`[${NAVBAR_ATTRIBUTE}]`]: { display: "none !important" } } }} />;
}

export default memo(HideNavbar);
