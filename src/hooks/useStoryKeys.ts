import { useEffect, useRef } from "react";

/** Elements that take typing, where the arrow keys move the caret. */
const TEXT_SELECTOR = "input, textarea, select, [contenteditable='true']";

/** Elements that keep their own Space and Enter: fields, buttons, links and editable text. */
const CONTROL_SELECTOR = `${TEXT_SELECTOR}, button, a`;

/** The keys a story player answers, for `useStoryKeys`. */
export interface StoryKeys {
	/** Reads on. Space, Enter and the right arrow call it. */
	next: () => void;
	/** Steps back. The left arrow calls it. */
	back: () => void;
	/** Whether a panel covers the story, such as the Log or Settings. No key acts while one does. */
	paused: boolean;
	/** The site's own shortcuts, by `KeyboardEvent.key`, such as `{ a: toggleAuto, Escape: toggleMenu }`. A letter matches in either case. */
	extra?: Readonly<Record<string, () => void>>;
}

/**
 * Whether a key press landed on a control that keeps the key for itself, such as a text field, a focused button or a link. Page-wide key
 * handlers check this so Space and Enter still type, press and follow.
 *
 * @param target The key event's target.
 * @returns True when the target is, or sits inside, such a control.
 */
export function isControlTarget(target: EventTarget | null): boolean {
	return target instanceof Element && target.closest(CONTROL_SELECTOR) !== null;
}

/**
 * Whether a key press landed on a field that takes typing, where the arrow keys belong to the field. A focused button does not count, so the
 * arrow keys still work after the reader clicks one.
 *
 * @param target The key event's target.
 * @returns True when the target is, or sits inside, such a field.
 */
export function isTextTarget(target: EventTarget | null): boolean {
	return target instanceof Element && target.closest(TEXT_SELECTOR) !== null;
}

/**
 * A story player's keys: Space, Enter and the right arrow read on, the left arrow steps back, and the site adds its own shortcuts. A focused
 * button or link keeps Space and Enter, a field keeps every key, and nothing acts while a panel covers the story or with Alt, Ctrl or Meta
 * held. The handlers are read through a ref, so the typewriter's ticks never re-attach the listener.
 *
 * @param keys The handlers, whether the story is paused, and the site's own shortcuts.
 */
export function useStoryKeys({ next, back, paused, extra }: StoryKeys): void {
	const current = useRef({ next, back, paused, extra });
	useEffect(() => {
		current.current = { next, back, paused, extra };
	});

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			const keys = current.current;
			if (keys.paused || event.altKey || event.ctrlKey || event.metaKey) {
				return;
			}
			let run: (() => void) | undefined;
			if (event.key === " " || event.key === "Enter") {
				run = isControlTarget(event.target) ? undefined : keys.next;
			} else if (isTextTarget(event.target)) {
				run = undefined;
			} else if (event.key === "ArrowRight") {
				run = keys.next;
			} else if (event.key === "ArrowLeft") {
				run = keys.back;
			} else {
				run = keys.extra?.[event.key] ?? keys.extra?.[event.key.toLowerCase()];
			}
			if (run) {
				event.preventDefault();
				run();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
}
