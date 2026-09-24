import { memo } from "react";

import type { SxProps, Theme } from "@mui/material";

import type { StoryLine } from "./MobileStoryReader.js";
import ReaderSheet from "./ReaderSheet.js";

/** The Log's lines: plain elements styled once here, since a long chapter holds hundreds of them. The desktop Log panel uses them too. */
export const LOG_LINES_SX = {
	"& .log-line": { mb: 1.25, fontSize: 14, lineHeight: 1.45 },
	"& .log-speaker": { display: "block", fontSize: 12, color: "var(--reader-accent)" },
	"& .log-choice": { color: "var(--reader-pick)" },
	"& .log-track": { fontStyle: "italic", fontSize: 13, color: "text.secondary" }
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
 * Every line, pick and track start read so far, as a Log shows them: a speaker over each line, a pick as "> " and its text in the pick
 * colour, and a track start as "Now Playing" and its title, quieter than the lines around it.
 *
 * @param props Component props.
 * @param props.lines The lines, oldest first.
 * @returns The lines.
 */
export function LogLines({ lines }: { lines: readonly StoryLine[] }) {
	return (
		<>
			{lines.map((line, index) =>
				line.kind === "choice" ? (
					<div key={index} className="log-line log-choice">
						{"> "}
						{line.text}
					</div>
				) : line.kind === "track" ? (
					<div key={index} className="log-line log-track">
						{"\u266a Now Playing: "}
						{line.text}
					</div>
				) : (
					<div key={index} className="log-line">
						{line.speaker ? <span className="log-speaker">{line.speaker}</span> : null}
						{line.text}
					</div>
				)
			)}
		</>
	);
}

/**
 * The full Log over the whole reader: every line, pick and track start so far. It opens scrolled to the newest line, and Escape or the close
 * button shuts it.
 *
 * @param props Component props.
 * @returns The sheet.
 */
function StoryLogSheet({ title, lines, onClose }: StoryLogSheetProps) {
	return (
		<ReaderSheet title={title} openAtEnd sx={LOG_LINES_SX} onClose={onClose}>
			<LogLines lines={lines} />
		</ReaderSheet>
	);
}

export default memo(StoryLogSheet);
