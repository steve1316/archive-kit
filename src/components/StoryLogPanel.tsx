import { memo, useCallback, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";

import { Box, IconButton, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { useCloseOnEscape } from "../hooks/useArtViewer.js";
import { useCloseOnOutsidePress } from "../hooks/useCloseOnOutsidePress.js";
import { stopClick } from "../lib/events.js";
import type { StoryLine } from "./MobileStoryReader.js";
import { LOG_LINES_SX, LogLines } from "./StoryLogSheet.js";

/** The header's background, solid so the lines scrolling under it do not bleed through. */
const HEADER_BG = "#08090d";

/**
 * The panel: a drawer over the right of the player, which lets the story show faintly through. Absolute rather than portalled, so it stays
 * inside a fullscreen player, and above a site's chrome, choices and end. Its two colours are the reader's variables, so a site sets its own with `sx`.
 */
const PANEL_SX = (theme: Theme) => ({
	"--reader-accent": theme.palette.primary.main,
	"--reader-pick": "#f0c36a",
	position: "absolute",
	top: 0,
	bottom: 0,
	right: 0,
	width: { xs: "100%", md: "40%" },
	background: "rgba(8, 10, 14, 0.95)",
	borderLeft: "1px solid #2a303c",
	px: 2,
	pb: 2,
	overflowY: "auto",
	overscrollBehavior: "contain",
	color: "#eef0f4",
	textAlign: "left",
	cursor: "default",
	zIndex: 7,
	...LOG_LINES_SX
});

/** The pinned header: the title and the close button. */
const HEADER_SX = { position: "sticky", top: 0, zIndex: 1, background: HEADER_BG, pt: 2, pb: 1.5, mb: 0.5, display: "flex", alignItems: "center", gap: 1 } satisfies SxProps<Theme>;

/** The title, which takes the row's spare width. */
const TITLE_SX = { flex: 1 } satisfies SxProps<Theme>;

/** Props for StoryLogPanel. */
export interface StoryLogPanelProps {
	/** The panel's title, such as "Log" or "Backlog". */
	title: string;
	/** Everything read so far, oldest first: lines, picks and track starts. */
	lines: readonly StoryLine[];
	/** Called to close the panel: by Escape, the close button or a click outside it. */
	onClose: () => void;
	/** The player the panel sits in. A click elsewhere in it is spent on closing, so it never also reads on. A click outside it still works. */
	container: RefObject<HTMLElement | null>;
	/** Extra styles, such as the site's own `--reader-accent` and `--reader-pick`. */
	sx?: SxProps<Theme>;
}

/**
 * A desktop player's Log: a drawer over the right of the player listing every line, pick and track start so far, under a pinned title. It is
 * drawn inside the player, so it shows in fullscreen. It opens at the newest line, and Escape, the close button or a click outside closes it.
 *
 * @param props Component props.
 * @returns The panel.
 */
function StoryLogPanel({ title, lines, onClose, container, sx }: StoryLogPanelProps) {
	const panel = useRef<HTMLDivElement>(null);
	const inPlayer = useCallback((target: Element) => container.current?.contains(target) === true, [container]);

	// Open at the newest line, before the first paint, so the panel never shows its top first.
	useLayoutEffect(() => {
		if (panel.current) {
			panel.current.scrollTop = panel.current.scrollHeight;
		}
	}, []);

	// Taken before the page's own keys, so closing the panel does not also run a shortcut bound to Escape.
	useCloseOnEscape(onClose, true);
	useCloseOnOutsidePress(panel, onClose, inPlayer);

	return (
		<Box ref={panel} sx={[PANEL_SX, ...(Array.isArray(sx) ? sx : [sx ?? false])]} onClick={stopClick} role="dialog" aria-label={title} data-region="story-log">
			<Box sx={HEADER_SX}>
				<Typography component="h2" variant="h6" sx={TITLE_SX}>
					{title}
				</Typography>
				<IconButton aria-label={`Close the ${title.toLowerCase()}`} onClick={onClose} size="small">
					<CloseIcon />
				</IconButton>
			</Box>
			<LogLines lines={lines} />
		</Box>
	);
}

export default memo(StoryLogPanel);
