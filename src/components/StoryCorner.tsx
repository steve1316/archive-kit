import { memo, useCallback, useEffect, useRef, useState } from "react";

import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

import { stopClick } from "../lib/events.js";

/** How long a track's title shows after the track starts, in milliseconds. */
const SHOW_MS = 3000;

/** How long the title stays once the pointer leaves the corner, in milliseconds. */
const LINGER_MS = 1500;

/** How long the title takes to slide in or out, in seconds. */
const SLIDE_S = 0.45;

/**
 * When each play was first shown, keyed by the site's track object. A corner that remounts mid-play, such as when a site re-keys its stage,
 * shows what is left of the play's seconds rather than starting them again.
 */
const ANNOUNCED = new WeakMap<object, number>();

/**
 * The corner: one small line in the scene's bottom right, on its own dark backing so it reads on a white scene. Its size follows the nearest
 * size container, which is the scene, and never drops under 9px. Only the title can be selected, so a triple click copies the title alone.
 */
const CORNER_SX = {
	position: "absolute",
	right: "1.3%",
	bottom: "1.4%",
	zIndex: 5,
	display: "flex",
	alignItems: "baseline",
	maxWidth: "70%",
	px: "6px",
	borderRadius: "3px",
	bgcolor: "rgba(0, 0, 0, 0.45)",
	color: "rgba(255, 255, 255, 0.85)",
	fontSize: "max(9px, 1.35cqh)",
	lineHeight: 1.6,
	whiteSpace: "nowrap",
	userSelect: "none",
	cursor: "default",
	"& .corner-title": { userSelect: "text", cursor: "text" }
} satisfies SxProps<Theme>;

/** The track's part of the line, which opens to the left of the count. It is hidden only once it has slid shut. */
const NOTE_SX = {
	display: "inline-block",
	overflow: "hidden",
	textOverflow: "ellipsis",
	verticalAlign: "bottom",
	maxWidth: 0,
	opacity: 0,
	visibility: "hidden",
	transition: `max-width ${SLIDE_S}s ease, opacity ${SLIDE_S}s ease, visibility 0s linear ${SLIDE_S}s`
} satisfies SxProps<Theme>;

/** The track's part while it shows. */
const NOTE_SHOWN_SX = { ...NOTE_SX, maxWidth: "24em", opacity: 1, visibility: "visible", transition: `max-width ${SLIDE_S}s ease, opacity ${SLIDE_S}s ease` } satisfies SxProps<Theme>;

/** Props for StoryCorner. */
export interface StoryCornerProps {
	/** Where the reader is in the scene: the line on screen, 1 or more, and how many lines the whole scene holds. Null leaves the count out. */
	progress: { at: number; total: number } | null;
	/** The track that started, or null for none. A new object is a new play, even of the same track, and shows its title again. */
	track: { title: string } | null;
}

/**
 * The scene's corner: "Line N of M", and for 3 seconds after a track starts, its title before the count. The title slides in and out, stays
 * while the pointer is over the corner, and lingers a moment after it leaves. Memoised, so the typewriter's ticks leave it alone.
 *
 * @param props Component props.
 * @returns The corner, or nothing with no count and no title showing.
 */
function StoryCorner({ progress, track }: StoryCornerProps) {
	// The last title shown, kept while it slides out.
	const [title, setTitle] = useState<string | null>(null);
	const [shown, setShown] = useState(false);
	const hovered = useRef(false);
	const timer = useRef<number | undefined>(undefined);

	useEffect(() => () => window.clearTimeout(timer.current), []);

	const hideAfter = useCallback((ms: number) => {
		window.clearTimeout(timer.current);
		timer.current = window.setTimeout(() => {
			if (!hovered.current) {
				setShown(false);
			}
		}, ms);
	}, []);

	// A new play shows its title, replacing any still showing, for 3 seconds from when it started. A silence or an untitled track closes it.
	useEffect(() => {
		window.clearTimeout(timer.current);
		if (!track || !track.title) {
			setShown(false);
			return;
		}
		const now = Date.now();
		const started = ANNOUNCED.get(track) ?? now;
		ANNOUNCED.set(track, started);
		const left = SHOW_MS - (now - started);
		if (left <= 0) {
			setShown(false);
			return;
		}
		setTitle(track.title);
		setShown(true);
		hideAfter(left);
	}, [track, hideAfter]);

	const hold = useCallback(() => {
		hovered.current = true;
		window.clearTimeout(timer.current);
	}, []);

	const release = useCallback(() => {
		hovered.current = false;
		hideAfter(LINGER_MS);
	}, [hideAfter]);

	if (!progress && !shown) {
		return null;
	}
	return (
		<Box sx={CORNER_SX} onClick={stopClick} onPointerEnter={hold} onPointerLeave={release} data-region="story-corner">
			{title ? (
				<Box component="span" className="corner-note" sx={shown ? NOTE_SHOWN_SX : NOTE_SX} aria-hidden={!shown}>
					{"\u266a "}
					<span className="corner-title">{title}</span>
					{progress ? " \u00b7 " : ""}
				</Box>
			) : null}
			{progress ? <span className="corner-progress">{`Line ${progress.at} of ${progress.total}`}</span> : null}
		</Box>
	);
}

export default memo(StoryCorner);
