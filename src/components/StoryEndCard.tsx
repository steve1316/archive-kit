import { memo } from "react";
import { Link } from "react-router-dom";

import { Box, Button, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { keyframes } from "@mui/material/styles";

import { stopClick } from "../lib/events.js";

/** How long the scene takes to fade to black, in seconds. */
const BLACK_S = 1.2;

/** How long the card takes to fade in once the scene is black, in seconds. */
const CARD_S = 0.5;

/** The stage end's layer. A site control that must stay above the end's black goes at `STORY_END_Z + 1` or higher. */
export const STORY_END_Z = 3;

/** A fade in from nothing. */
const FADE_IN = keyframes`from { opacity: 0; } to { opacity: 1; }`;

/** The card's fade in. Hidden until it starts, so its buttons take no click or focus while the scene is still going to black. */
const CARD_IN = keyframes`from { opacity: 0; visibility: hidden; } to { opacity: 1; visibility: visible; }`;

/**
 * The black the scene fades to at its end. The phone reader lays it over its own scene too. It takes no clicks, so the scene's own handlers still get theirs.
 */
export const END_BLACK_SX = { position: "absolute", inset: 0, zIndex: 4, bgcolor: "#000", pointerEvents: "none", animation: `${FADE_IN} ${BLACK_S}s ease-out both` } satisfies SxProps<Theme>;

/** The end over a desktop stage: the whole stage, under the site's own controls, which stay usable over the black. */
const STAGE_SX = { position: "absolute", inset: 0, zIndex: STORY_END_Z, display: "grid", placeItems: "center", cursor: "default" } satisfies SxProps<Theme>;

/** The card, centred on the black, fading in once the scene has gone. */
const CARD_SX = {
	position: "relative",
	zIndex: 5,
	display: "grid",
	gap: "max(8px, 1.5cqh)",
	width: "min(420px, 80%)",
	textAlign: "center",
	color: "#eef0f4",
	animation: `${CARD_IN} ${CARD_S}s ease-out ${BLACK_S}s both`
} satisfies SxProps<Theme>;

/** "End of story" on the stage, sized against it. */
const STAGE_HEADING_SX = { fontFamily: "inherit", fontSize: "max(16px, 3cqh)", lineHeight: 1.3 } satisfies SxProps<Theme>;

/** The scene's name under it, small and dimmed. */
const STAGE_TITLE_SX = { fontFamily: "inherit", fontSize: "max(12px, 1.9cqh)", opacity: 0.65, mt: "-0.5cqh" } satisfies SxProps<Theme>;

/** The phone's end, under the last line. */
const INLINE_SX = { display: "grid", gap: 1, mt: 1 } satisfies SxProps<Theme>;

/** "End of story" under the last line. */
const INLINE_HEADING_SX = { fontFamily: "inherit", color: "text.secondary" } satisfies SxProps<Theme>;

/** The scene's name under it. */
const INLINE_TITLE_SX = { fontFamily: "inherit", fontSize: 13, color: "text.secondary", opacity: 0.7, mt: -0.75 } satisfies SxProps<Theme>;

/** Back and Read again, side by side, sharing the row. */
const ROW_SX = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 } satisfies SxProps<Theme>;

/** Every button in the card: the story's own font. */
const BUTTON_SX = { fontFamily: "inherit" } satisfies SxProps<Theme>;

/** Back: a quiet white outline, so the way on and Read again stand out. */
const BACK_SX = { ...BUTTON_SX, color: "#fff", borderColor: "rgba(255, 255, 255, 0.45)", "&:hover": { borderColor: "#fff", bgcolor: "rgba(255, 255, 255, 0.08)" } } satisfies SxProps<Theme>;

/** One way on from the end, as a link. */
export interface StoryEndLink {
	/** What the button reads, such as "Next: 0-1 Collapse". */
	label: string;
	/** The route it opens. */
	to: string;
	/** Router state carried with it, such as a flag that opens the next scene at its start. */
	state?: unknown;
}

/** Props for StoryEndCard. */
export interface StoryEndCardProps {
	/** The scene's name, shown under "End of story". */
	title: string;
	/** The next scene, left out on a group's last one. */
	next?: StoryEndLink;
	/** The way back to the list. */
	back: StoryEndLink;
	/** Starts the scene again from its first line. */
	onRestart: () => void;
	/** Where it sits: over a desktop stage, which it fades to black, or under the phone reader's last line. */
	variant: "stage" | "inline";
	/** The palette colour of Next and Read again, the site's accent. Defaults to primary. */
	color?: "primary" | "secondary";
}

/**
 * The end of a scene: "End of story" and the scene's name, a wide Next, then Back and Read again side by side. On a desktop stage the scene
 * fades to black over 1.2 seconds and the card fades in after it, centred, under the site's own controls. On a phone it sits under the last
 * line, and the reader fades its scene to black.
 *
 * @param props Component props.
 * @returns The end.
 */
function StoryEndCard({ title, next, back, onRestart, variant, color = "primary" }: StoryEndCardProps) {
	const buttons = (
		<>
			{next ? (
				<Button component={Link} to={next.to} state={next.state} variant="contained" color={color} sx={BUTTON_SX} fullWidth>
					{next.label}
				</Button>
			) : null}
			<Box sx={ROW_SX}>
				<Button component={Link} to={back.to} state={back.state} variant="outlined" sx={BACK_SX}>
					{back.label}
				</Button>
				<Button variant="outlined" color={color} sx={BUTTON_SX} onClick={onRestart}>
					Read again
				</Button>
			</Box>
		</>
	);
	if (variant === "inline") {
		return (
			<Box sx={INLINE_SX} data-region="story-end">
				<Typography sx={INLINE_HEADING_SX}>End of story</Typography>
				<Typography sx={INLINE_TITLE_SX}>{title}</Typography>
				{buttons}
			</Box>
		);
	}
	return (
		<Box sx={STAGE_SX} onClick={stopClick} data-region="story-end">
			<Box sx={END_BLACK_SX} data-region="story-end-black" />
			<Box sx={CARD_SX}>
				<Typography sx={STAGE_HEADING_SX}>End of story</Typography>
				<Typography sx={STAGE_TITLE_SX}>{title}</Typography>
				{buttons}
			</Box>
		</Box>
	);
}

export default memo(StoryEndCard);
