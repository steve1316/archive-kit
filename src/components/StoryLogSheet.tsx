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
 * One read line, pick or track start, as the transcript or the Log renders it. `prefix` picks the class names, `reader-*` for the transcript
 * and `log-*` for the Log. `speaker` picks how a line's speaker shows: inline before the text for the transcript, or its own span for the
 * Log, where CSS alone puts it on its own line.
 *
 * @param line The line, pick or track start.
 * @param index Its place among the lines shown, used as the React key.
 * @param prefix The class prefix: `reader` for the transcript, `log` for the Log.
 * @param speaker How the speaker renders: `inline` folds "Name: " into the line's own text, `block` gives it its own span.
 * @returns The line's markup.
 */
export function renderStoryLine(line: StoryLine, index: number, prefix: "reader" | "log", speaker: "inline" | "block") {
	return line.kind === "choice" ? (
		<div key={index} className={`${prefix}-line ${prefix}-choice`}>
			{"> "}
			{line.text}
		</div>
	) : line.kind === "track" ? (
		<div key={index} className={`${prefix}-line ${prefix}-track`}>
			{"\u266a Now Playing: "}
			{line.text}
		</div>
	) : (
		<div key={index} className={`${prefix}-line`}>
			{line.speaker ? <span className={`${prefix}-speaker`}>{speaker === "inline" ? `${line.speaker}: ` : line.speaker}</span> : null}
			{line.text}
		</div>
	);
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
	return <>{lines.map((line, index) => renderStoryLine(line, index, "log", "block"))}</>;
}

/**
 * The full Log over the whole reader: every line, pick and track start so far. It opens scrolled to the newest line, and Escape or the close button shuts it.
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
