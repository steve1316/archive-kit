import { memo } from "react";

import type { SxProps, Theme } from "@mui/material";

import type { StoryLine } from "./MobileStoryReader.js";
import ReaderSheet from "./ReaderSheet.js";

/** The Log's lines: plain elements styled once here, since a long chapter holds hundreds of them. */
const LOG_SX = {
	"& .log-line": { mb: 1.25, fontSize: 14, lineHeight: 1.45 },
	"& .log-speaker": { display: "block", fontSize: 12, color: "var(--reader-accent)" },
	"& .log-choice": { color: "var(--reader-pick)" }
} satisfies SxProps<Theme>;

/** Props for StoryLogSheet. */
interface StoryLogSheetProps {
	/** The sheet's title, such as "Log" or "Backlog". */
	title: string;
	/** Everything read so far, oldest first. */
	lines: readonly StoryLine[];
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
function StoryLogSheet({ title, lines, onClose }: StoryLogSheetProps) {
	return (
		<ReaderSheet title={title} openAtEnd sx={LOG_SX} onClose={onClose}>
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
		</ReaderSheet>
	);
}

export default memo(StoryLogSheet);
