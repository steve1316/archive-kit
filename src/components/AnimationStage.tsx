import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";

import { Box, Fab, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

import { useZoomPan } from "../hooks/useZoomPan.js";
import ErrorBoundary from "./ErrorBoundary.js";

// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// Constants

/** Longest step one frame may take, in seconds, so a stall is not played back as one jump. */
const MAX_DELTA = 0.1;

/** Shown while the runtime or a source loads. */
const LOADING_TEXT = "Loading...";

/** Shown when the runtime or a source fails to load, or a frame throws. */
const FAILED_TEXT = "Couldn't load this animation.";

/** The stage box. Messages sit centred in it and the gesture surface covers it. A site's `sx` sizes it. */
const BOX_SX = { position: "relative", overflow: "hidden", display: "grid", placeItems: "center" } satisfies SxProps<Theme>;

/** The gesture surface over the whole box. It holds the runtime's canvas and takes the clicks, wheel and drags. */
const SURFACE_SX = { position: "absolute", inset: 0 } satisfies SxProps<Theme>;

/** The element a runtime draws into. Its canvas fills it, and the runtime sizes the backing store. */
const HOST_SX = { position: "absolute", inset: 0, "& > canvas": { display: "block", width: "100%", height: "100%" } } satisfies SxProps<Theme>;

/** A message drawn by the stage itself. */
const MESSAGE_SX = { px: 2, textAlign: "center" } satisfies SxProps<Theme>;

/** The reset button, in either bottom corner. */
const RESET_SX: Record<"left" | "right", SxProps<Theme>> = {
	left: { position: "absolute", left: 8, bottom: 8, opacity: 0.9 },
	right: { position: "absolute", right: 8, bottom: 8, opacity: 0.9 }
};

/** The caption under the stage, naming the playing animation. While nothing plays it is hidden but keeps its height, so the stage does not jump. */
const CAPTION_SX = { flex: "none", mt: 0.875, textAlign: "center" } satisfies SxProps<Theme>;

/** The caption line. A block, so its height is its own line height rather than the surrounding body text's. */
const CAPTION_TEXT_SX = { display: "block" } satisfies SxProps<Theme>;

/** Hides the caption without taking its height away. */
const HIDDEN_STYLE: CSSProperties = { visibility: "hidden" };

// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// Types

/** One animation a tap can step to. */
export interface StageEntry {
	/** Handed to `StageRuntime.play`. Unique within the list. */
	key: string;
	/** Shown in the caption. */
	label: string;
}

/** What kind of message the stage shows in place of the animation: a site's or runtime's notice, or a failure. */
export type StageMessageKind = "notice" | "error";

/** A site's animation runtime, built inside the stage. `S` is whatever the site loads, such as a rig's URLs. */
export interface StageRuntime<S> {
	/**
	 * Loads a source and poses its first frame. The stage aborts `signal` once a newer source replaces this one.
	 *
	 * @param source What to load.
	 * @param signal Aborted once the stage no longer wants this source.
	 * @returns Null once it can play, or a message to show instead, such as "This animation isn't supported yet.".
	 */
	load(source: S, signal: AbortSignal): Promise<string | null>;
	/**
	 * Plays an entry, looping.
	 *
	 * @param key The entry's key.
	 */
	play(key: string): void;
	/**
	 * The stage box changed size. The runtime picks its own pixel ratio.
	 *
	 * @param width Width in CSS pixels.
	 * @param height Height in CSS pixels.
	 */
	resize(width: number, height: number): void;
	/**
	 * Zooms and pans inside the renderer, so the art stays sharp. The meaning matches a CSS `translate(x, y) scale(scale)` about the box's centre,
	 * which is what `useZoomPan` describes.
	 *
	 * @param scale The zoom, 1 when fitted.
	 * @param x Horizontal pan in CSS pixels.
	 * @param y Vertical pan in CSS pixels.
	 */
	setView(scale: number, x: number, y: number): void;
	/**
	 * Advances the animation and draws one frame.
	 *
	 * @param seconds Time since the last frame, at most 0.1.
	 */
	update(seconds: number): void;
	/** Frees the renderer and its WebGL context. */
	dispose(): void;
}

/** Props for AnimationStage. */
export interface AnimationStageProps<S> {
	/** Builds the site's runtime inside the given element, the first time there is a source to play. Must be stable, such as a module-level function. */
	runtime: (host: HTMLElement) => Promise<StageRuntime<S>>;
	/** What to load, such as a rig's URLs, or null when there is nothing to play. Handed to `StageRuntime.load` unread. */
	source: S | null;
	/** The identity of `source`. A new key loads the new source. Null means there is none. */
	sourceKey: string | null;
	/** What a tap steps through, in order. The first plays after each load and whenever this list changes, so keep it memoised. */
	entries: readonly StageEntry[];
	/** Shown in place of the stage while set, such as "No animation for this form.". */
	notice?: string | null;
	/** False for a fixed preview: it plays the first entry, draws no caption, and a tap does not step. Zoom still works. Defaults to true. */
	interactive?: boolean;
	/** The animation's accessible name. */
	label: string;
	/** Draws a notice or a failure, such as a placeholder with the subject's icon. Defaults to centred secondary text. */
	renderMessage?: (message: string, kind: StageMessageKind) => ReactNode;
	/** Told the key of the entry playing now, or null while nothing plays, such as for a dialogue line that belongs to a motion. */
	onEntryChange?: (key: string | null) => void;
	/** Drawn inside the stage box over the animation, such as a link to a full-page viewer. The site positions it. */
	overlay?: ReactNode;
	/** The bottom corner the reset button sits in. Defaults to right. Use left when `overlay` already takes the bottom right. */
	resetCorner?: "left" | "right";
	/** Sizes and styles the stage box, such as a square up to 340px or a card's remaining height. */
	sx?: SxProps<Theme>;
}

/** How the last load of a source ended. */
interface LoadResult {
	/** The source key the result belongs to. A result for any other key is stale. */
	key: string;
	/** The load the result belongs to. A result from any earlier load is stale, even for the same source. */
	load: number;
	/** Null once the source plays, or what to show instead. */
	message: StageMessage | null;
}

/** A message the stage shows in place of the animation. */
interface StageMessage {
	/** What to say. */
	text: string;
	/** Whether it is a notice or a failure. */
	kind: StageMessageKind;
}

// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// Helpers

/**
 * The message the stage draws when a site brings none of its own: centred secondary text.
 *
 * @param message What to say.
 * @returns The message.
 */
function defaultMessage(message: string): ReactNode {
	return (
		<Typography variant="body2" color="text.secondary" sx={MESSAGE_SX}>
			{message}
		</Typography>
	);
}

/**
 * Keeps an event on the reset button from reaching the stage, so pressing it neither starts a pan nor steps the animation.
 *
 * @param event The pointer or click event.
 */
function stopPropagation(event: { stopPropagation: () => void }): void {
	event.stopPropagation();
}

// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// Components

/**
 * The stage itself. See `AnimationStage`.
 *
 * @param props Component props.
 * @returns The stage box and, when interactive, the caption under it.
 */
function LiveStage<S>({
	runtime: createRuntime,
	source,
	sourceKey,
	entries,
	notice = null,
	interactive = true,
	label,
	renderMessage = defaultMessage,
	onEntryChange,
	overlay,
	resetCorner = "right",
	sx
}: AnimationStageProps<S>) {
	const hostRef = useRef<HTMLDivElement | null>(null);
	const mounted = useRef(true);
	const started = useRef(false);
	// Counts loads, so a result can be told apart from one an earlier load of the same source left behind.
	const loadCount = useRef(0);
	// Read by the load effect, which is keyed by `sourceKey` rather than by the object's identity.
	const sourceRef = useRef(source);
	sourceRef.current = source;
	const [runtime, setRuntime] = useState<StageRuntime<S> | null>(null);
	const [runtimeFailed, setRuntimeFailed] = useState(false);
	const [result, setResult] = useState<LoadResult | null>(null);
	const [index, setIndex] = useState(0);
	const [onScreen, setOnScreen] = useState(false);
	const zoom = useZoomPan<HTMLDivElement>({ minScale: 1, maxScale: 4, doubleClickZoom: false });
	const { containerRef: surfaceRef, reset: resetZoom, wasDragged } = zoom;
	// Read by the frame loop, so a zoom or pan never restarts it.
	const transformRef = useRef(zoom.transform);
	transformRef.current = zoom.transform;

	const wanted = source !== null && sourceKey !== null && !notice;
	const current = result !== null && result.key === sourceKey && result.load === loadCount.current ? result : null;
	const ready = wanted && runtime !== null && current !== null && current.message === null;
	const entry = entries[index];

	// Why no animation plays, or null while one plays or is still loading.
	let message: StageMessage | null = null;
	if (notice) {
		message = { text: notice, kind: "notice" };
	} else if (runtimeFailed) {
		message = { text: FAILED_TEXT, kind: "error" };
	} else if (current !== null) {
		message = current.message;
	}
	const loading = message === null && !ready;

	// Marks the current load as failed, which swaps in the failure message. Read through a ref by the observers and the frame loop.
	const fail = useCallback(() => {
		if (sourceKey !== null) {
			setResult({ key: sourceKey, load: loadCount.current, message: { text: FAILED_TEXT, kind: "error" } });
		}
	}, [sourceKey]);
	const failRef = useRef(fail);
	failRef.current = fail;

	// Tracks whether the stage is mounted, so a runtime that finishes building after unmount is disposed at once.
	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);

	// Disposes the runtime on unmount. It is set once and never replaced, so this runs only then.
	useEffect(() => () => runtime?.dispose(), [runtime]);

	// Builds the runtime the first time there is something to play, so a page that never has a source never downloads it.
	useEffect(() => {
		const host = hostRef.current;
		if (!wanted || started.current || !host) {
			return;
		}
		started.current = true;
		createRuntime(host).then(
			(made) => {
				if (!mounted.current) {
					made.dispose();
					return;
				}
				setRuntime(made);
			},
			() => {
				if (mounted.current) {
					setRuntimeFailed(true);
				}
			}
		);
	}, [wanted, createRuntime]);

	// Loads each new source with the zoom back at fitted. A newer source aborts the older load, and a result from any earlier load is dropped.
	useEffect(() => {
		resetZoom();
		const load = ++loadCount.current;
		setResult(null);
		const next = sourceRef.current;
		if (!runtime || !wanted || sourceKey === null || next === null) {
			return;
		}
		const controller = new AbortController();
		Promise.resolve()
			.then(() => runtime.load(next, controller.signal))
			.then(
				(outcome) => {
					if (!controller.signal.aborted) {
						setResult({ key: sourceKey, load, message: outcome === null ? null : { text: outcome, kind: "notice" } });
					}
				},
				() => {
					if (!controller.signal.aborted) {
						setResult({ key: sourceKey, load, message: { text: FAILED_TEXT, kind: "error" } });
					}
				}
			);
		return () => controller.abort();
	}, [runtime, wanted, sourceKey, resetZoom]);

	// Starts over at the first entry whenever a source becomes ready or the entries change, such as a Live2D model's motions arriving after it.
	useEffect(() => {
		setIndex(0);
		const first = entries[0];
		if (!ready || !runtime || !first) {
			return;
		}
		try {
			runtime.play(first.key);
		} catch {
			failRef.current();
		}
	}, [ready, runtime, entries]);

	useEffect(() => {
		onEntryChange?.(ready ? (entries[index]?.key ?? null) : null);
	}, [onEntryChange, ready, entries, index]);

	// Tracks whether the stage is on screen, so the frame loop can stop while it is scrolled away.
	useEffect(() => {
		const surface = surfaceRef.current;
		if (!surface) {
			return;
		}
		const observer = new IntersectionObserver((observed) => {
			const latest = observed[observed.length - 1];
			if (latest) {
				setOnScreen(latest.isIntersecting);
			}
		});
		observer.observe(surface);
		return () => observer.disconnect();
	}, [surfaceRef]);

	// Hands every size the box takes to the runtime, starting with its first. A sub-pixel change reports the same whole-pixel size, so it is skipped.
	useEffect(() => {
		const host = hostRef.current;
		if (!runtime || !host) {
			return;
		}
		let lastWidth = 0;
		let lastHeight = 0;
		const observer = new ResizeObserver(() => {
			const width = host.clientWidth;
			const height = host.clientHeight;
			if (width === 0 || height === 0 || (width === lastWidth && height === lastHeight)) {
				return;
			}
			lastWidth = width;
			lastHeight = height;
			try {
				runtime.resize(width, height);
			} catch {
				failRef.current();
			}
		});
		observer.observe(host);
		return () => observer.disconnect();
	}, [runtime]);

	// The frame loop: runs while a source plays, the stage is on screen and the tab is visible.
	useEffect(() => {
		if (!runtime || !ready || !onScreen) {
			return;
		}
		let frame: number | null = null;
		let last: number | null = null;
		const tick = (now: number) => {
			const delta = last === null ? 0 : Math.min((now - last) / 1000, MAX_DELTA);
			last = now;
			const transform = transformRef.current;
			try {
				runtime.setView(transform.scale, transform.x, transform.y);
				runtime.update(delta);
			} catch {
				frame = null;
				failRef.current();
				return;
			}
			frame = requestAnimationFrame(tick);
		};
		const start = () => {
			if (frame === null && !document.hidden) {
				// A fresh start takes a zero step, so time spent hidden or off screen is never played back as one jump.
				last = null;
				frame = requestAnimationFrame(tick);
			}
		};
		const stop = () => {
			if (frame !== null) {
				cancelAnimationFrame(frame);
				frame = null;
			}
		};
		const handleVisibility = () => (document.hidden ? stop() : start());
		document.addEventListener("visibilitychange", handleVisibility);
		start();
		return () => {
			stop();
			document.removeEventListener("visibilitychange", handleVisibility);
		};
	}, [runtime, ready, onScreen]);

	// A drag ends in a click, so only a click that never moved steps to the next entry. Every entry loops, so the cycle never stalls.
	const handleClick = useCallback(() => {
		if (!interactive || !runtime || !ready || wasDragged()) {
			return;
		}
		const next = (index + 1) % entries.length;
		const nextEntry = entries[next];
		if (!nextEntry) {
			return;
		}
		try {
			runtime.play(nextEntry.key);
			setIndex(next);
		} catch {
			failRef.current();
		}
	}, [interactive, runtime, ready, wasDragged, entries, index]);

	const handleReset = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			event.stopPropagation();
			resetZoom();
		},
		[resetZoom]
	);

	return (
		<>
			<Box sx={[BOX_SX, ...(Array.isArray(sx) ? sx : [sx ?? false])]} data-region="animation-stage">
				<Box ref={surfaceRef} sx={SURFACE_SX} style={{ ...zoom.containerStyle, visibility: ready ? "visible" : "hidden" }} onPointerDown={zoom.handlers.onPointerDown} onClick={handleClick}>
					<Box ref={hostRef} sx={HOST_SX} role="img" aria-label={label} />
				</Box>
				{message !== null ? renderMessage(message.text, message.kind) : null}
				{loading ? (
					<Typography variant="body2" color="text.secondary" role="status" sx={MESSAGE_SX}>
						{LOADING_TEXT}
					</Typography>
				) : null}
				{ready && zoom.isZoomed ? (
					<Fab size="small" color="primary" aria-label="Reset zoom" onPointerDown={stopPropagation} onClick={handleReset} sx={RESET_SX[resetCorner]}>
						<RestartAltIcon />
					</Fab>
				) : null}
				{overlay}
			</Box>
			{interactive && entries.length > 0 ? (
				<Box sx={CAPTION_SX} style={ready && entry ? undefined : HIDDEN_STYLE}>
					<Typography variant="caption" color="text.primary" aria-live="polite" sx={CAPTION_TEXT_SX}>
						{ready && entry ? `${entry.label} - ${index + 1} / ${entries.length}` : "\u00a0"}
					</Typography>
				</Box>
			) : null}
		</>
	);
}

/**
 * The shared stage for a chibi animation. Each archive draws with its own runtime, since each game ships its own Spine or Live2D version, so
 * the runtime arrives through `StageRuntime` and this owns everything around it: sizing, zoom and pan with a reset button, a tap stepping
 * through `entries`, the caption, loading and error messages, a frame loop that stops off screen or in a hidden tab, and cleanup. It renders
 * the stage box and then the caption, as two siblings, so it slots into a card's column. A throw the stage's own handling misses shows the
 * failure message instead of taking down the page, and the next source clears it.
 *
 * @param props Component props.
 * @returns The stage box and, when interactive, the caption under it.
 */
export default function AnimationStage<S>(props: AnimationStageProps<S>) {
	const renderMessage = props.renderMessage ?? defaultMessage;
	const sx = props.sx;
	const fallback = (
		<Box sx={[BOX_SX, ...(Array.isArray(sx) ? sx : [sx ?? false])]} data-region="animation-stage">
			{renderMessage(FAILED_TEXT, "error")}
		</Box>
	);
	return (
		<ErrorBoundary resetKey={props.sourceKey} fallback={fallback}>
			<LiveStage {...props} />
		</ErrorBoundary>
	);
}
