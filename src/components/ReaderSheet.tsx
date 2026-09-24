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

/** The pinned header: the title, the close button and whatever the sheet pins under them. */
const HEADER_SX = { position: "sticky", top: 0, zIndex: 1, background: SHEET_BG, pt: 2, pb: 1.5, mb: 0.5 } satisfies SxProps<Theme>;

/** The title row. */
const TITLE_ROW_SX = { display: "flex", alignItems: "center", gap: 1 } satisfies SxProps<Theme>;

/** The title row with something pinned under it. */
const TITLE_ROW_SPACED_SX = { ...TITLE_ROW_SX, mb: 1 } satisfies SxProps<Theme>;

/** The title, which takes the row's spare width. */
const TITLE_SX = { flex: 1 } satisfies SxProps<Theme>;

/** Props for ReaderSheet. */
interface ReaderSheetProps {
	/** The sheet's title, such as "Log" or "Settings". */
	title: string;
	/** Anything pinned under the title, such as a name field. */
	header?: ReactNode;
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
function ReaderSheet({ title, header, openAtEnd = false, sx, onClose, children }: ReaderSheetProps) {
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
				<Box sx={header ? TITLE_ROW_SPACED_SX : TITLE_ROW_SX}>
					<Typography component="h2" variant="h6" sx={TITLE_SX}>
						{title}
					</Typography>
					<IconButton aria-label={`Close the ${title.toLowerCase()}`} onClick={onClose} size="small">
						<CloseIcon />
					</IconButton>
				</Box>
				{header}
			</Box>
			{children}
		</Box>
	);
}

export default ReaderSheet;
