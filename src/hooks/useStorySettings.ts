import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** The settings a slider sets, each a number with a range. */
export type StorySliderKey = "speed" | "bgm" | "sfx" | "sceneSize";

/** The settings that are on or off, each with its own control on the player rather than a slider. */
type StoryFlagKey = "auto" | "muted";

/** Each slider setting's range, step and normal value. The normal values are how each site read before settings existed. */
export const STORY_SETTING_RANGES = {
	speed: { min: 0.25, max: 2, step: 0.25, normal: 1 },
	bgm: { min: 0, max: 1, step: 0.05, normal: 1 },
	sfx: { min: 0, max: 1, step: 0.05, normal: 1 },
	sceneSize: { min: 0.6, max: 1, step: 0.1, normal: 1 }
} as const satisfies Record<StorySliderKey, StorySettingRange>;

/** The reader's own story preferences, shared by the phone reader and a site's desktop player. */
export interface StorySettings {
	/** Text speed multiplier, 0.25 to 2. 1 is the site's own normal speed. */
	speed: number;
	/** Music volume, 0 to 1. Multiplies the site's own music balance, so 1 sounds as it did before settings existed. */
	bgm: number;
	/** Sound effect volume, 0 to 1. Multiplies the site's own effect balance. */
	sfx: number;
	/** How much of its full size the phone reader's scene takes, 0.6 to 1. */
	sceneSize: number;
	/** Whether AUTO reads on by itself. Off until the reader turns it on. */
	auto: boolean;
	/** Whether the story's sound is muted. */
	muted: boolean;
}

/** The settings with a setter for each. The object keeps its identity until a value changes, so it can feed a memoised panel. */
export interface StorySettingsState extends StorySettings {
	/** Sets the text speed. Every slider setter clamps the value to its range and snaps it to its step. */
	setSpeed: (value: number) => void;
	/** Sets the music volume. */
	setBgm: (value: number) => void;
	/** Sets the sound effect volume. */
	setSfx: (value: number) => void;
	/** Sets the phone scene's size. */
	setSceneSize: (value: number) => void;
	/** Turns AUTO on or off. */
	setAuto: (value: boolean) => void;
	/** Mutes or unmutes the story. */
	setMuted: (value: boolean) => void;
}

/** One setting's range. */
export interface StorySettingRange {
	/** The lowest value. */
	min: number;
	/** The highest value. */
	max: number;
	/** The step between values. */
	step: number;
	/** The value before the reader changes it. */
	normal: number;
}

/**
 * Bring a value into a slider setting's range and onto its step. Anything that is not a finite number becomes the normal value.
 *
 * @param key The setting.
 * @param value The value, such as one read back from storage.
 * @returns The value, clamped and snapped.
 */
function normaliseSetting(key: StorySliderKey, value: unknown): number {
	const { min, max, step, normal } = STORY_SETTING_RANGES[key];
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return normal;
	}
	const snapped = min + Math.round((value - min) / step) * step;
	// Rounded to drop floating-point dust, so 0.6 plus three steps reads back as 0.9 rather than 0.9000000000000001.
	return Number(Math.min(max, Math.max(min, snapped)).toFixed(4));
}

/**
 * Bring an on/off value back from storage. Anything that is not `true` is off.
 *
 * @param value The value, such as one read back from storage.
 * @returns Whether it is on.
 */
function normaliseFlag(value: unknown): boolean {
	return value === true;
}

/**
 * Read the saved settings. A field the saved object lacks, such as one added after it was written, or every field when nothing is saved,
 * comes from `initial` instead.
 *
 * @param storageKey The site's storage key.
 * @param initial Values for anything not saved yet.
 * @returns The settings, each clamped, snapped or normalised.
 */
function loadSettings(storageKey: string, initial: Partial<StorySettings> | undefined): StorySettings {
	let saved: unknown = null;
	try {
		const raw = localStorage.getItem(storageKey);
		saved = raw === null ? null : JSON.parse(raw);
	} catch {
		// Blocked storage, or a value that is not JSON. The settings start from `initial` instead.
		saved = null;
	}
	// Every field is checked on the way in, so a saved object of any shape is safe to read from.
	const stored = (saved !== null && typeof saved === "object" ? saved : {}) as Partial<Record<keyof StorySettings, unknown>>;
	const from = (key: keyof StorySettings): unknown => (stored[key] !== undefined ? stored[key] : initial?.[key]);
	return {
		speed: normaliseSetting("speed", from("speed")),
		bgm: normaliseSetting("bgm", from("bgm")),
		sfx: normaliseSetting("sfx", from("sfx")),
		sceneSize: normaliseSetting("sceneSize", from("sceneSize")),
		auto: normaliseFlag(from("auto")),
		muted: normaliseFlag(from("muted"))
	};
}

/**
 * The reader's story settings, saved per browser under the site's own key. The archives share one origin, so each passes its own key. Saved
 * values are clamped and snapped as they are read, so a damaged one cannot break the player.
 *
 * @param storageKey The site's localStorage key, such as `ak.storySettings`.
 * @param initial Values for anything not saved yet, such as a setting carried over from an older control. Read on the first render.
 * @returns The settings and their setters.
 */
export function useStorySettings(storageKey: string, initial?: Partial<StorySettings>): StorySettingsState {
	const [settings, setSettings] = useState(() => loadSettings(storageKey, initial));
	// The settings as loaded, so only a change is written back and an untouched reader keeps nothing saved.
	const loaded = useRef(settings);

	useEffect(() => {
		if (settings === loaded.current) {
			return;
		}
		try {
			localStorage.setItem(storageKey, JSON.stringify(settings));
		} catch {
			// Blocked storage, such as in a private window. The settings then last for this visit only.
		}
	}, [storageKey, settings]);

	const update = useCallback((key: StorySliderKey, value: number) => {
		setSettings((current) => {
			const next = normaliseSetting(key, value);
			return next === current[key] ? current : { ...current, [key]: next };
		});
	}, []);
	const setFlag = useCallback((key: StoryFlagKey, value: boolean) => {
		setSettings((current) => {
			const next = normaliseFlag(value);
			return next === current[key] ? current : { ...current, [key]: next };
		});
	}, []);
	const setSpeed = useCallback((value: number) => update("speed", value), [update]);
	const setBgm = useCallback((value: number) => update("bgm", value), [update]);
	const setSfx = useCallback((value: number) => update("sfx", value), [update]);
	const setSceneSize = useCallback((value: number) => update("sceneSize", value), [update]);
	const setAuto = useCallback((value: boolean) => setFlag("auto", value), [setFlag]);
	const setMuted = useCallback((value: boolean) => setFlag("muted", value), [setFlag]);

	return useMemo(() => ({ ...settings, setSpeed, setBgm, setSfx, setSceneSize, setAuto, setMuted }), [settings, setSpeed, setBgm, setSfx, setSceneSize, setAuto, setMuted]);
}
