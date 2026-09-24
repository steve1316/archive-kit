import { useMediaQuery } from "@mui/material";

/** A touch screen held upright, such as a phone or an upright tablet. Keyed on the pointer as well, so a narrowed desktop window stays a desktop. */
const MOBILE_PORTRAIT_QUERY = "(pointer: coarse) and (max-aspect-ratio: 1/1)";

/** A touch screen on its side that is too short for a desktop layout, which is a phone rather than a tablet. */
export const MOBILE_LANDSCAPE_QUERY = "(pointer: coarse) and (min-aspect-ratio: 1001/1000) and (max-height: 500px)";

/** Either phone layout. */
export const MOBILE_QUERY = `${MOBILE_PORTRAIT_QUERY}, ${MOBILE_LANDSCAPE_QUERY}`;

/**
 * Whether the screen calls for a phone layout rather than the desktop one. It follows the screen, so turning a phone or docking a tablet switches
 * it at once.
 *
 * @returns True on a phone, upright or on its side, and on an upright tablet.
 */
export function useIsMobile(): boolean {
	return useMediaQuery(MOBILE_QUERY, { noSsr: true });
}
