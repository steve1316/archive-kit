import { useCallback, useMemo, useRef, useState } from "react";

/** How a sound is started through the gate. */
export interface AudioGatePlayOptions {
	/** Whether a refused sound waits for the reader's next click, as a looping one always does. Use it for a music intro, which does not loop. */
	keep?: boolean;
}

/** Starts sounds, and holds the ones the browser refused until the reader clicks. */
export interface AudioGate {
	/** Whether the browser refused a sound because it wants a click first. Cleared by the next sound that plays, or by `resume`. */
	blocked: boolean;
	/** Starts a sound. Resolves true once it plays, or false when it could not start. A refused one-shot is dropped, since it would be stale. */
	play: (audio: HTMLMediaElement, options?: AudioGatePlayOptions) => Promise<boolean>;
	/** Lets refused sounds start, from the reader's click: plays each waiting sound that is still paused and has not ended. */
	resume: () => void;
	/** Drops a sound from the waiting list, such as one fading out or stopped, so a click does not start it again. */
	forget: (audio: HTMLMediaElement) => void;
}

/**
 * Start every held sound that is still paused and has not ended, and empty the list. A sound refused again is held again by `start`.
 *
 * @param held The held sounds.
 * @param start Starts one sound.
 */
function releaseHeld(held: Set<HTMLMediaElement>, start: (audio: HTMLMediaElement) => void) {
	const ready = [...held];
	held.clear();
	for (const audio of ready) {
		if (audio.paused && !audio.ended) {
			start(audio);
		}
	}
}

/**
 * A gate for a story's sound. A browser may refuse to play before the reader has clicked, which it reports as a `NotAllowedError`. The gate
 * notes that as `blocked`, keeps the looping sounds and any started with `keep` waiting, and plays them on the reader's next click through
 * `resume`, or as soon as any sound plays. A one-shot is dropped rather than kept, since it would be stale by the time it could play.
 *
 * @returns The gate.
 */
export function useAudioGate(): AudioGate {
	const [blocked, setBlocked] = useState(false);
	const waiting = useRef(new Set<HTMLMediaElement>());
	// Sounds dropped since their last play, so a refusal that lands after `forget` does not put them back.
	const forgotten = useRef(new WeakSet<HTMLMediaElement>());

	const play = useCallback((audio: HTMLMediaElement, options?: AudioGatePlayOptions): Promise<boolean> => {
		forgotten.current.delete(audio);
		let started: Promise<void>;
		try {
			started = audio.play();
		} catch (error) {
			started = Promise.reject(error);
		}
		return started.then(
			() => {
				waiting.current.delete(audio);
				setBlocked(false);
				// Sound is allowed now, so the held sounds start too, as a click would start them.
				releaseHeld(waiting.current, (held) => void play(held, { keep: true }));
				return true;
			},
			(error: unknown) => {
				if (error instanceof DOMException && error.name === "NotAllowedError") {
					setBlocked(true);
					if ((audio.loop || options?.keep === true) && !forgotten.current.has(audio)) {
						waiting.current.add(audio);
					}
				}
				return false;
			}
		);
	}, []);

	const forget = useCallback((audio: HTMLMediaElement) => {
		waiting.current.delete(audio);
		forgotten.current.add(audio);
	}, []);

	const resume = useCallback(() => {
		// The reader's click lets sound play from here on. Anything refused again sets `blocked` back.
		setBlocked(false);
		releaseHeld(waiting.current, (audio) => void play(audio, { keep: true }));
	}, [play]);

	return useMemo(() => ({ blocked, play, resume, forget }), [blocked, play, resume, forget]);
}
