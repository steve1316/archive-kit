import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";

import { Box, IconButton, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { useCloseOnEscape } from "../hooks/useArtViewer.js";

/** The sheet's background, solid so the scene never bleeds through. */
const SHEET_BG = "#08090d";

/** The sheet: the whole reader, above everything in it. Absolute rather than fixed, and never portalled, so it stays inside a fullscreen reader. */
const SHEET_SX = {
	position: "absolute",
	inset: 0,
	zIndex: 20,
	background: SHEET_BG,
	overflowY: "auto",
	overscrollBehavior: "contain",
	px: 2,
	pb: 2,
	cursor: "default"
} satisfies SxProps<Theme>;

/** The pinned header: the title and the close button. */
const HEADER_SX = { position: "sticky", top: 0, zIndex: 1, background: SHEET_BG, pt: 2, pb: 1.5, mb: 0.5 } satisfies SxProps<Theme>;

/** The title row. */
const TITLE_ROW_SX = { display: "flex", alignItems: "center", gap: 1 } satisfies SxProps<Theme>;

/** The title, which takes the row's spare width. */
const TITLE_SX = { flex: 1 } satisfies SxProps<Theme>;

/** Props for SheetTitle. */
interface SheetTitleProps {
	/** The title shown, and read out by the close button's label. */
	title: string;
	/** Called to close the sheet or panel. */
	onClose: () => void;
}

/**
 * The title row shared by a sheet and the desktop Log panel: the title as an h6, and a close button labelled "Close the " plus the lowercased
 * title. Kept out of the index, since it is a building block for the kit's own story panels rather than something a site uses on its own.
 *
 * @param props Component props.
 * @returns The title and its close button.
 */
export function SheetTitle({ title, onClose }: SheetTitleProps) {
	return (
		<>
			<Typography component="h2" variant="h6" sx={TITLE_SX}>
				{title}
			</Typography>
			<IconButton aria-label={`Close the ${title.toLowerCase()}`} onClick={onClose} size="small">
				<CloseIcon />
			</IconButton>
		</>
	);
}

/** Props for ReaderSheet. */
interface ReaderSheetProps {
	/** The sheet's title, such as "Log" or "Settings". */
	title: string;
	/** Whether the sheet opens scrolled to its end, as the Log does to show the newest line. */
	openAtEnd?: boolean;
	/** Extra styles for the sheet, such as the classes of its content. */
	sx?: SxProps<Theme>;
	/** Called to close the sheet. */
	onClose: () => void;
	/** The sheet's content. */
	children: ReactNode;
}

/**
 * A sheet over the whole phone reader, with a pinned title and close button. Escape or the close button shuts it, and Escape goes to the
 * sheet before the page's own keys.
 *
 * @param props Component props.
 * @returns The sheet.
 */
function ReaderSheet({ title, openAtEnd = false, sx, onClose, children }: ReaderSheetProps) {
	const sheet = useRef<HTMLDivElement>(null);

	// Open at the end before the first paint, so the sheet never shows its top first.
	useLayoutEffect(() => {
		if (openAtEnd && sheet.current) {
			sheet.current.scrollTop = sheet.current.scrollHeight;
		}
	}, [openAtEnd]);

	useCloseOnEscape(onClose, true);

	return (
		<Box ref={sheet} sx={[SHEET_SX, ...(Array.isArray(sx) ? sx : [sx ?? false])]} role="dialog" aria-label={title}>
			<Box sx={HEADER_SX}>
				<Box sx={TITLE_ROW_SX}>
					<SheetTitle title={title} onClose={onClose} />
				</Box>
			</Box>
			{children}
		</Box>
	);
}

export default ReaderSheet;
