import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode, UIEvent } from "react";
import { Link } from "react-router-dom";

import { Box, ButtonBase, useMediaQuery } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import SettingsIcon from "@mui/icons-material/Settings";

import { useFullscreen } from "../hooks/useFullscreen.js";
import { MOBILE_LANDSCAPE_QUERY } from "../hooks/useMobileLayout.js";
import HideNavbar from "./HideNavbar.js";
import ReaderSheet from "./ReaderSheet.js";
import StoryCorner from "./StoryCorner.js";
import type { StoryCornerProps } from "./StoryCorner.js";
import { END_BLACK_SX } from "./StoryEndCard.js";
import StoryLogSheet from "./StoryLogSheet.js";

// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// Layout

/** A phone on its side. Upright is the default, so every sideways rule sits under this key. */
const LANDSCAPE = `@media ${MOBILE_LANDSCAPE_QUERY}`;

/** The control rail's width on a phone on its side, in pixels. */
const RAIL_WIDTH = 48;

/** The narrowest the text column gets on a phone on its side, in pixels. The stage gives up width before the text does. */
const MIN_TEXT_WIDTH = 240;

/** How close to the transcript's bottom counts as reading the newest line, in pixels. */
const PIN_SLACK_PX = 24;

/** The Auto plate's icon turns while it runs. */
const SPIN = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

/**
 * The reader: a column upright, a row on its side. It is the element that goes fullscreen, so it carries no transform or containment. Its two
 * colours are CSS variables, so a site can set its own with one line of `sx`.
 */
const ROOT_SX = (theme: Theme) => ({
	"--reader-accent": theme.palette.primary.main,
	"--reader-pick": "#f0c36a",
	position: "relative",
	display: "flex",
	flexDirection: "column",
	width: "100%",
	height: "100%",
	minHeight: 0,
	overflow: "hidden",
	background: "#000",
	color: "#eef0f4",
	[LANDSCAPE]: { flexDirection: "row" }
});

/**
 * The scene's region, which a tap reads on from. Upright it is the full width, with the scene's box centred in it. On its side it takes the
 * reader's scene size of the height, and is as wide as 16:9 allows while the text column keeps its minimum.
 */
const STAGE_REGION_SX = {
	flex: "none",
	width: "100%",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	cursor: "pointer",
	userSelect: "none",
	touchAction: "manipulation",
	WebkitTapHighlightColor: "transparent",
	[LANDSCAPE]: {
		width: "auto",
		height: "calc(100% * var(--scene-size, 1))",
		alignSelf: "center",
		aspectRatio: "16 / 9",
		maxWidth: `calc((100% - ${RAIL_WIDTH + MIN_TEXT_WIDTH}px) * var(--scene-size, 1))`
	}
} satisfies SxProps<Theme>;

/**
 * The scene's own 16:9 box, which the site's scene fills. Upright it takes the reader's scene size of the width. It is a size container, so
 * the corner's text is measured against the scene.
 */
const STAGE_BOX_SX = {
	position: "relative",
	width: "calc(100% * var(--scene-size, 1))",
	aspectRatio: "16 / 9",
	overflow: "hidden",
	containerType: "size",
	[LANDSCAPE]: { width: "100%" }
} satisfies SxProps<Theme>;

/**
 * The controls: upright, a wrapping row of labelled plates along the bottom, clear of a phone's gesture bar. On its side, a thin rail of bare
 * icons, which `ALIGN_SX` places.
 */
const RAIL_SX = {
	order: 2,
	flex: "none",
	display: "flex",
	flexWrap: "wrap",
	justifyContent: "center",
	gap: 0.75,
	px: 1,
	pt: 1,
	pb: "calc(8px + env(safe-area-inset-bottom))",
	bgcolor: "rgba(0, 0, 0, 0.35)",
	borderTop: "1px solid",
	borderColor: "divider",
	[LANDSCAPE]: {
		flexDirection: "column",
		flexWrap: "nowrap",
		justifyContent: "flex-start",
		alignItems: "center",
		width: RAIL_WIDTH,
		height: "100%",
		overflowY: "auto",
		gap: 0.5,
		px: 0.5,
		py: 0.75,
		border: "none"
	}
} satisfies SxProps<Theme>;

/**
 * One control plate. 48px tall upright, the smallest target a thumb hits reliably, and 36px wide, so nine plates, Settings and fullscreen
 * included, share one row at 412px. The label is 9px and closed up a little, so "Settings" fits inside the border.
 */
const CONTROL_SX = {
	flexDirection: "column",
	width: 36,
	height: 48,
	px: 0,
	py: 0.25,
	color: "common.white",
	border: "1px solid rgba(255, 255, 255, 0.53)",
	bgcolor: "rgba(0, 0, 0, 0.35)",
	borderRadius: "3px",
	lineHeight: 1,
	"& .reader-label": { fontSize: 9, lineHeight: 1.1, mt: 0.25, letterSpacing: "-0.02em", whiteSpace: "nowrap" },
	"&.Mui-disabled": { opacity: 0.35 },
	"&:hover": { borderColor: "common.white", bgcolor: "rgba(0, 0, 0, 0.6)" },
	[LANDSCAPE]: { width: RAIL_WIDTH - 8, height: "auto", flex: "0 1 44px", minHeight: 34, "& .reader-label": { display: "none" }, "& .MuiSvgIcon-root": { fontSize: 20 } }
} satisfies SxProps<Theme>;

/** A plate that starts a new group: a gap before it, so navigation and playback read as separate sets. */
const GROUP_SX = { ml: 1, [LANDSCAPE]: { ml: 0, mt: 0.75 } } satisfies SxProps<Theme>;

/** A control that stays on after it is pressed, such as Auto: a dashed edge in the accent colour. */
const ACTIVE_SX = { borderStyle: "dashed", borderColor: "var(--reader-accent)", color: "var(--reader-accent)" } satisfies SxProps<Theme>;

/** A control whose icon turns while it runs. */
const SPIN_SX = { "& .MuiSvgIcon-root": { animation: `${SPIN} 2.4s linear infinite` } } satisfies SxProps<Theme>;

/** The text column. Upright, the current line's box sits under the scene with the transcript below it. On its side, the transcript is over the box. */
const TEXT_COLUMN_SX = {
	order: 1,
	flex: 1,
	minHeight: 0,
	minWidth: 0,
	display: "flex",
	flexDirection: "column-reverse",
	gap: 1,
	px: 1.5,
	py: 1,
	[LANDSCAPE]: { flexDirection: "column", height: "100%", minWidth: MIN_TEXT_WIDTH, px: 1.25, py: 1 }
} satisfies SxProps<Theme>;

/**
 * The transcript: every earlier line. Upright the newest sits at the top, just under the box, and older lines run down to a fade. On its side
 * the newest sits at the bottom, just over the box, and older lines run up to a fade. Upright, the browser's scroll anchoring keeps a reader who
 * has scrolled back on the line they are reading as new lines land above it.
 */
const TRANSCRIPT_SX = {
	flex: "1 1 auto",
	minHeight: 0,
	overflowY: "auto",
	overscrollBehavior: "contain",
	maskImage: "linear-gradient(to top, transparent 0, #000 1.4em)",
	[LANDSCAPE]: { maskImage: "linear-gradient(to bottom, transparent 0, #000 1.4em)" }
} satisfies SxProps<Theme>;

/**
 * The transcript's lines: newest first upright, pushed to the bottom on its side while there are too few to fill it. The lines are plain elements
 * styled once here, since a long chapter holds hundreds of them and each would otherwise carry its own styles.
 */
const TRANSCRIPT_INNER_SX = {
	minHeight: "100%",
	display: "flex",
	flexDirection: "column-reverse",
	justifyContent: "flex-end",
	"& .reader-line": { fontSize: 14, lineHeight: 1.55, color: "text.secondary", mb: 0.75 },
	"& .reader-speaker": { fontWeight: 700, color: "text.primary" },
	"& .reader-choice": { color: "var(--reader-pick)" },
	"& .reader-track": { fontStyle: "italic", opacity: 0.8 },
	[LANDSCAPE]: { flexDirection: "column", "& .reader-line": { fontSize: 13, lineHeight: 1.5 } }
} satisfies SxProps<Theme>;

/** The current line's box, which a tap reads on from. Its height is capped, so a long line scrolls rather than squeezing out the transcript. */
const BOX_SX = {
	flex: "none",
	maxHeight: "45%",
	overflowY: "auto",
	cursor: "pointer",
	touchAction: "manipulation",
	WebkitTapHighlightColor: "transparent",
	[LANDSCAPE]: { maxHeight: "60%" }
} satisfies SxProps<Theme>;

/** The default frame around the box: a dark panel with an accent edge. A site can draw its own with `frame`. */
const PANEL_SX = {
	minHeight: 96,
	background: "rgba(18, 21, 28, 0.96)",
	border: "1px solid #2a303c",
	borderLeft: "3px solid var(--reader-accent)",
	borderRadius: 1,
	p: "10px 14px",
	[LANDSCAPE]: { minHeight: 80 }
} satisfies SxProps<Theme>;

/**
 * The default frame around the choices: the same panel, with the choices centred in it rather than hanging from its top. The left padding gives
 * back the accent edge's extra 2px, so the choices sit centred across the whole panel.
 */
const CHOICES_PANEL_SX = { ...PANEL_SX, display: "flex", flexDirection: "column", justifyContent: "center", pl: "12px" } satisfies SxProps<Theme>;

/** The speaker's name. Its line is always there, so narration does not make the text jump up. */
const SPEAKER_SX = { color: "var(--reader-accent)", fontWeight: 600, fontSize: 14, lineHeight: 1.45, minHeight: "1.45em" } satisfies SxProps<Theme>;

/** The current line. */
const TEXT_SX = { fontSize: 16, lineHeight: 1.5, [LANDSCAPE]: { fontSize: 14 } } satisfies SxProps<Theme>;

/** The caret after a line that is still typing. */
const CARET_SX = { opacity: 0.6, ml: "1px" } satisfies SxProps<Theme>;

/** The choices, one full-width button each. */
const CHOICES_SX = { display: "grid", gap: 1 } satisfies SxProps<Theme>;

/** One choice. */
const CHOICE_SX = {
	justifyContent: "center",
	color: "#fff",
	border: "1px solid rgba(255, 255, 255, 0.6)",
	bgcolor: "rgba(30, 30, 32, 0.92)",
	fontSize: 15,
	fontFamily: "inherit",
	lineHeight: 1.4,
	p: "10px 14px",
	"&:hover": { bgcolor: "rgba(60, 60, 64, 0.95)" }
} satisfies SxProps<Theme>;

/** The letterbox beside a centred stage on a phone on its side, for whatever the site puts there. Hidden upright. */
const ASIDE_SX = { display: "none", [LANDSCAPE]: { display: "block", order: -1, flex: 1, minWidth: 0, height: "100%", overflowY: "auto" } } satisfies SxProps<Theme>;

/** Where the rail and the text column sit on a phone on its side, for each place the stage can take. */
const ALIGN_SX = {
	left: { rail: { [LANDSCAPE]: { order: -1, borderRight: "1px solid", borderColor: "divider" } }, text: { [LANDSCAPE]: { order: 1 } } },
	right: { rail: { [LANDSCAPE]: { order: 2, borderLeft: "1px solid", borderColor: "divider" } }, text: { [LANDSCAPE]: { order: -1 } } },
	center: { rail: { [LANDSCAPE]: { order: -2, borderRight: "1px solid", borderColor: "divider" } }, text: { [LANDSCAPE]: { order: 1 } } }
} satisfies Record<"left" | "center" | "right", { rail: SxProps<Theme>; text: SxProps<Theme> }>;

// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// Types

/** One control: a plate with a label upright, a bare icon on a phone on its side. */
export interface StoryControl {
	/** A stable key for the plate. */
	key: string;
	/** The plate's label, shown under the icon upright and read out as its name. */
	label: string;
	/** The plate's icon, such as an MUI icon element. */
	icon: ReactNode;
	/** Called when the plate is pressed. */
	onClick?: () => void;
	/** A route to open instead, such as the story list. */
	to?: string;
	/** A fuller name for screen readers, when the label alone is too terse. */
	ariaLabel?: string;
	/** Whether the control is on, such as Auto while it runs. */
	active?: boolean;
	/** Whether the icon turns while the control is on. */
	spin?: boolean;
	/** Whether the plate is disabled. */
	disabled?: boolean;
	/** Whether the plate starts a new group, which opens a gap before it. */
	group?: boolean;
}

/** One line read so far, for the transcript and the Log. */
export interface StoryLine {
	/** The speaker's name, or null for narration. */
	speaker: string | null;
	/** The text, which may carry styled runs. For a track, its title. */
	text: ReactNode;
	/** A line, a choice the reader picked, or a track that started. Defaults to a line. */
	kind?: "line" | "choice" | "track";
}

/** The line in the box. */
export interface StoryCurrentLine {
	/** The speaker's name, or null for narration. */
	speaker: string | null;
	/** The text typed so far, which may carry styled runs. */
	text: ReactNode;
	/** Whether the line is still typing, which shows a caret and holds a screen reader back until it is done. */
	typing?: boolean;
}

/** One choice the reader can pick. */
export interface StoryChoice {
	/** A stable key for the choice. */
	key: string;
	/** What the choice says. */
	label: ReactNode;
	/** Called when the reader picks it. */
	onPick: () => void;
}

/** The root's inline style: the scene size as a custom property, so moving the slider never adds a new class. */
type SceneSizeStyle = CSSProperties & { "--scene-size": number };

/** Props for MobileStoryReader. */
export interface MobileStoryReaderProps {
	/** The site's scene, which fills a 16:9 box: background, sprites and effects, with no text or controls of its own. */
	scene: ReactNode;
	/** The scene's corner: the line count, and a track's title as it starts. Left out, the corner stays empty. */
	corner?: StoryCornerProps;
	/** The controls, in order. Memoise the list, since the reader re-renders on every typed character. */
	controls: readonly StoryControl[];
	/**
	 * Every line and choice read so far, oldest first. While `current` is set, the last entry must be that line: the transcript shows all but it,
	 * and the Log shows all of it. Leave out anything not yet read.
	 */
	lines: readonly StoryLine[];
	/** The line in the box, or null while choices or the end fill it. */
	current: StoryCurrentLine | null;
	/** The choices to pick from, which take the box's place. */
	choices?: readonly StoryChoice[] | null;
	/** What shows at the story's end, usually an inline `StoryEndCard`, under the current line. The scene fades to black while it is set. */
	end?: ReactNode;
	/** Called when the reader taps the scene or the box to read on. */
	onAdvance: () => void;
	/** Called first on any tap in the reader, such as to let blocked sound start. */
	onInteract?: () => void;
	/** Whether the full Log is open. */
	logOpen: boolean;
	/** Called to close the Log. */
	onCloseLog: () => void;
	/** The Log's title. Defaults to "Log". */
	logTitle?: string;
	/**
	 * The reader's settings, usually a `StorySettingsPanel`. When set, a Settings plate joins fullscreen at the end of the controls and opens
	 * them in a sheet over the reader.
	 */
	settings?: ReactNode;
	/** Called with true when the Settings sheet opens and false when it closes, so the site can pause its keys and AUTO behind it. */
	onPanelChange?: (open: boolean) => void;
	/** How much of its full size the scene takes, 0.6 to 1, from the reader's settings. Defaults to 1. */
	sceneSize?: number;
	/** Draws the box's frame around its content, for a site with its own dialogue frame. Defaults to a plain panel. */
	frame?: (content: ReactNode, kind: "line" | "choices") => ReactNode;
	/** Where the stage sits on a phone on its side. Left puts the rail beside it and gives the text the rest. Defaults to left. */
	landscapeAlign?: "left" | "center" | "right";
	/** What fills the letterbox on the rail's side when the stage is centred. */
	landscapeAside?: ReactNode;
	/** Anything drawn over the whole reader, such as a site's own menu. Kept inside, so it shows in fullscreen too. */
	overlay?: ReactNode;
	/** Extra styles for the reader, such as the story font. The accent and the picked-choice colour are `--reader-accent` and `--reader-pick`. */
	sx?: SxProps<Theme>;
}

// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// Parts

/**
 * Keep a tap from reaching the scene or the box, which would read on.
 *
 * @param event The click.
 */
function stopTap(event: MouseEvent) {
	event.stopPropagation();
}

/**
 * The default frame: the box's content in a plain dark panel, with choices centred in it.
 *
 * @param content The box's content.
 * @param kind Whether the box holds a line or choices.
 * @returns The framed content.
 */
function plainFrame(content: ReactNode, kind: "line" | "choices"): ReactNode {
	return <Box sx={kind === "choices" ? CHOICES_PANEL_SX : PANEL_SX}>{content}</Box>;
}

/** Props for ControlRail. */
interface ControlRailProps {
	/** The controls, in order. */
	controls: readonly StoryControl[];
	/** Where the rail sits on a phone on its side. */
	alignSx: (typeof ALIGN_SX)[keyof typeof ALIGN_SX]["rail"];
}

/**
 * The control plates. Memoised, so the typewriter's ticks leave it alone.
 *
 * @param props Component props.
 * @returns The rail.
 */
const ControlRail = memo(function ControlRail({ controls, alignSx }: ControlRailProps) {
	return (
		<Box sx={[RAIL_SX, alignSx]} role="toolbar" aria-label="Story controls">
			{controls.map((control) => {
				const sx = [CONTROL_SX, !!control.group && GROUP_SX, !!control.active && ACTIVE_SX, !!(control.active && control.spin) && SPIN_SX];
				const content = (
					<>
						{control.icon}
						<span className="reader-label">{control.label}</span>
					</>
				);
				return control.to ? (
					<ButtonBase key={control.key} component={Link} to={control.to} sx={sx} aria-label={control.ariaLabel ?? control.label} title={control.label}>
						{content}
					</ButtonBase>
				) : (
					<ButtonBase
						key={control.key}
						sx={sx}
						onClick={control.onClick}
						disabled={control.disabled}
						aria-label={control.ariaLabel ?? control.label}
						aria-pressed={control.active}
						title={control.label}
					>
						{content}
					</ButtonBase>
				);
			})}
		</Box>
	);
});

/**
 * Scroll the transcript to its newest line: the top upright, the bottom on its side.
 *
 * @param element The transcript's scroller.
 * @param sideways Whether the phone is on its side.
 */
function toNewest(element: HTMLElement, sideways: boolean) {
	element.scrollTop = sideways ? element.scrollHeight : 0;
}

/**
 * Every line before the one in the box, newest first upright and newest last on its side. It keeps to the newest line as lines arrive while the
 * reader is there, and stays put while they scroll back through earlier lines. Memoised, so the typewriter's ticks leave it alone.
 *
 * @param props Component props.
 * @param props.lines The lines to show, oldest first.
 * @returns The transcript.
 */
const Transcript = memo(function Transcript({ lines }: { lines: readonly StoryLine[] }) {
	const scroller = useRef<HTMLDivElement>(null);
	const sideways = useMediaQuery(MOBILE_LANDSCAPE_QUERY, { noSsr: true });
	// Whether the reader is at the newest line, so new lines and a turned phone keep them there.
	const pinned = useRef(true);

	// The two orientations run the lines in opposite directions, so a scroll position means nothing after a turn. Go back to the newest line.
	useLayoutEffect(() => {
		pinned.current = true;
		if (scroller.current) {
			toNewest(scroller.current, sideways);
		}
	}, [sideways]);

	useLayoutEffect(() => {
		const element = scroller.current;
		if (element && pinned.current) {
			toNewest(element, sideways);
		}
	}, [lines, sideways]);

	useEffect(() => {
		const element = scroller.current;
		if (!element) {
			return;
		}
		const observer = new ResizeObserver(() => {
			if (pinned.current) {
				toNewest(element, sideways);
			}
		});
		observer.observe(element);
		return () => observer.disconnect();
	}, [sideways]);

	const onScroll = useCallback(
		(event: UIEvent<HTMLDivElement>) => {
			const element = event.currentTarget;
			const fromNewest = sideways ? element.scrollHeight - element.scrollTop - element.clientHeight : element.scrollTop;
			pinned.current = fromNewest < PIN_SLACK_PX;
		},
		[sideways]
	);

	return (
		<Box ref={scroller} sx={TRANSCRIPT_SX} onScroll={onScroll}>
			<Box sx={TRANSCRIPT_INNER_SX}>
				{lines.map((line, index) =>
					line.kind === "choice" ? (
						<div key={index} className="reader-line reader-choice">
							{"> "}
							{line.text}
						</div>
					) : line.kind === "track" ? (
						<div key={index} className="reader-line reader-track">
							{"\u266a Now Playing: "}
							{line.text}
						</div>
					) : (
						<div key={index} className="reader-line">
							{line.speaker ? <span className="reader-speaker">{line.speaker}: </span> : null}
							{line.text}
						</div>
					)
				)}
			</Box>
		</Box>
	);
});

// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// Reader

/**
 * The shared phone reader for a story. Upright: the scene, the current line's box under it, the transcript newest first below that, and the
 * controls along the bottom. On its side: a thin rail of icons, the scene at full height, then the transcript and the box in the widest column, with
 * the navbar hidden. The site brings the scene, the lines and the controls. The reader lays them out and keeps the transcript and the Log. At
 * the end of the controls it adds Settings, where the site gives a panel, and fullscreen, where the browser can go fullscreen.
 *
 * @param props Component props.
 * @returns The reader.
 */
function MobileStoryReader({
	scene,
	corner,
	controls,
	lines,
	current,
	choices,
	end,
	onAdvance,
	onInteract,
	logOpen,
	onCloseLog,
	logTitle = "Log",
	settings,
	onPanelChange,
	sceneSize = 1,
	frame = plainFrame,
	landscapeAlign = "left",
	landscapeAside,
	overlay,
	sx
}: MobileStoryReaderProps) {
	const root = useRef<HTMLDivElement>(null);
	const fullscreen = useFullscreen(root);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const hasSettings = !!settings;
	const hasCurrent = current !== null;
	// The line in the box is the last one read, so the transcript leaves it out while it shows there.
	const earlier = useMemo(() => (hasCurrent ? lines.slice(0, -1) : lines), [lines, hasCurrent]);
	const align = ALIGN_SX[landscapeAlign];
	const picking = !!choices?.length;
	const openSettings = useCallback(() => setSettingsOpen(true), []);
	const closeSettings = useCallback(() => setSettingsOpen(false), []);
	// The site hears when the Settings sheet covers the story, so its keys and AUTO can wait. A reader that goes away with the sheet open says
	// it closed.
	const panelChange = useRef(onPanelChange);
	useEffect(() => {
		panelChange.current = onPanelChange;
	}, [onPanelChange]);
	useEffect(() => {
		if (!settingsOpen) {
			return;
		}
		panelChange.current?.(true);
		return () => panelChange.current?.(false);
	}, [settingsOpen]);
	const rootStyle = useMemo<SceneSizeStyle>(() => ({ "--scene-size": sceneSize }), [sceneSize]);
	// The site's controls, then Settings where the site gives a panel and fullscreen where the browser can go fullscreen, as a group of their
	// own. iPhone Safari cannot go fullscreen, so it has no Full plate.
	const allControls = useMemo<readonly StoryControl[]>(() => {
		const tail: StoryControl[] = [];
		if (hasSettings) {
			tail.push({ key: "settings", label: "Settings", icon: <SettingsIcon />, onClick: openSettings, group: true });
		}
		if (fullscreen.supported) {
			tail.push({
				key: "fullscreen",
				label: fullscreen.active ? "Exit" : "Full",
				ariaLabel: fullscreen.active ? "Leave fullscreen" : "Fill the screen",
				icon: fullscreen.active ? <FullscreenExitIcon /> : <FullscreenIcon />,
				onClick: fullscreen.toggle,
				group: !hasSettings
			});
		}
		return tail.length > 0 ? [...controls, ...tail] : controls;
	}, [controls, hasSettings, openSettings, fullscreen.supported, fullscreen.active, fullscreen.toggle]);

	const content = picking ? (
		<Box sx={CHOICES_SX}>
			{choices.map((choice) => (
				<ButtonBase key={choice.key} sx={CHOICE_SX} onClick={choice.onPick}>
					{choice.label}
				</ButtonBase>
			))}
		</Box>
	) : (
		<>
			{current ? (
				<>
					<Box sx={SPEAKER_SX}>{current.speaker ?? ""}</Box>
					<Box sx={TEXT_SX} aria-live="polite" aria-busy={current.typing}>
						{current.text}
						{current.typing ? (
							<Box component="span" sx={CARET_SX}>
								|
							</Box>
						) : null}
					</Box>
				</>
			) : null}
			{end ? <Box onClick={stopTap}>{end}</Box> : null}
		</>
	);

	return (
		<Box ref={root} sx={[ROOT_SX, ...(Array.isArray(sx) ? sx : [sx ?? false])]} style={rootStyle} onClickCapture={onInteract} data-region="story-reader">
			<HideNavbar query={MOBILE_LANDSCAPE_QUERY} />
			<Box sx={STAGE_REGION_SX} onClick={onAdvance}>
				<Box sx={STAGE_BOX_SX} data-region="reader-scene">
					{scene}
					{end ? <Box sx={END_BLACK_SX} data-region="story-end-black" /> : null}
					{corner ? <StoryCorner progress={corner.progress} track={corner.track} /> : null}
				</Box>
			</Box>
			<ControlRail controls={allControls} alignSx={align.rail} />
			{landscapeAlign === "center" && landscapeAside ? <Box sx={ASIDE_SX}>{landscapeAside}</Box> : null}
			<Box sx={[TEXT_COLUMN_SX, align.text]} data-region="reader-text">
				<Transcript lines={earlier} />
				<Box sx={BOX_SX} onClick={picking ? undefined : onAdvance}>
					{frame(content, picking ? "choices" : "line")}
				</Box>
			</Box>
			{logOpen ? <StoryLogSheet title={logTitle} lines={lines} onClose={onCloseLog} /> : null}
			{settingsOpen && hasSettings ? (
				<ReaderSheet title="Settings" onClose={closeSettings}>
					{settings}
				</ReaderSheet>
			) : null}
			{overlay}
		</Box>
	);
}

export default MobileStoryReader;
