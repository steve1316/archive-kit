import { memo, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";

import { Box, IconButton, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { useCloseOnEscape } from "../hooks/useArtViewer.js";
import type { StoryLine } from "./MobileStoryReader.js";

/** The sheet's background, solid so the scene never bleeds through the text. */
const SHEET_BG = "#08090d";

/**
 * The sheet: the whole reader, above everything in it. Absolute rather than fixed, and never portalled, so it stays inside the reader when the
 * reader is fullscreen. Its lines are plain elements styled once here, since a long chapter holds hundreds of them.
 */
const SHEET_SX = {
	position: "absolute",
	inset: 0,
	zIndex: 20,
	background: SHEET_BG,
	overflowY: "auto",
	overscrollBehavior: "contain",
	px: 2,
	pb: 2,
	cursor: "default",
	"& .log-line": { mb: 1.25, fontSize: 14, lineHeight: 1.45 },
	"& .log-speaker": { display: "block", fontSize: 12, color: "var(--reader-accent)" },
	"& .log-choice": { color: "var(--reader-pick)" }
} satisfies SxProps<Theme>;

/** The pinned header: the title, the close button and whatever the site adds, such as a name field. */
const HEADER_SX = { position: "sticky", top: 0, zIndex: 1, background: SHEET_BG, pt: 2, pb: 1.5, mb: 0.5 } satisfies SxProps<Theme>;

/** Props for StoryLogSheet. */
interface StoryLogSheetProps {
	/** The sheet's title, such as "Log" or "Backlog". */
	title: string;
	/** Everything read so far, oldest first. */
	lines: readonly StoryLine[];
	/** Anything the site pins under the title, such as the reader's name field. */
	header?: ReactNode;
	/** Called to close the sheet. */
	onClose: () => void;
}

/**
 * The full Log over the whole reader: every line and choice read so far. It opens scrolled to the newest line, and Escape or the close button
 * shuts it.
 *
 * @param props Component props.
 * @returns The sheet.
 */
function StoryLogSheet({ title, lines, header, onClose }: StoryLogSheetProps) {
	const sheet = useRef<HTMLDivElement>(null);

	// Open at the newest line, before the first paint, so the sheet never shows the top first.
	useLayoutEffect(() => {
		if (sheet.current) {
			sheet.current.scrollTop = sheet.current.scrollHeight;
		}
	}, []);

	useCloseOnEscape(onClose);

	return (
		<Box ref={sheet} sx={SHEET_SX} role="dialog" aria-label={title}>
			<Box sx={HEADER_SX}>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: header ? 1 : 0 }}>
					<Typography component="h2" variant="h6" sx={{ flex: 1 }}>
						{title}
					</Typography>
					<IconButton aria-label={`Close the ${title.toLowerCase()}`} onClick={onClose} size="small">
						<CloseIcon />
					</IconButton>
				</Box>
				{header}
			</Box>
			{lines.map((line, index) =>
				line.kind === "choice" ? (
					<div key={index} className="log-line log-choice">
						{"> "}
						{line.text}
					</div>
				) : (
					<div key={index} className="log-line">
						{line.speaker ? <span className="log-speaker">{line.speaker}</span> : null}
						{line.text}
					</div>
				)
			)}
		</Box>
	);
}

export default memo(StoryLogSheet);
