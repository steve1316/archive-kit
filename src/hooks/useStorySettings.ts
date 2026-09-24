import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Each setting's range, step and normal value. The normal values are how each site read before settings existed. */
export const STORY_SETTING_RANGES = {
	speed: { min: 0.25, max: 2, step: 0.25, normal: 1 },
	bgm: { min: 0, max: 1, step: 0.05, normal: 1 },
	sfx: { min: 0, max: 1, step: 0.05, normal: 1 },
	sceneSize: { min: 0.6, max: 1, step: 0.1, normal: 1 }
} as const satisfies Record<keyof StorySettings, StorySettingRange>;

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
}

/** The settings with a setter for each. The object keeps its identity until a value changes, so it can feed a memoised panel. */
export interface StorySettingsState extends StorySettings {
	/** Sets the text speed. Every setter clamps the value to its range and snaps it to its step. */
	setSpeed: (value: number) => void;
	/** Sets the music volume. */
	setBgm: (value: number) => void;
	/** Sets the sound effect volume. */
	setSfx: (value: number) => void;
	/** Sets the phone scene's size. */
	setSceneSize: (value: number) => void;
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
 * Bring a value into a setting's range and onto its step. Anything that is not a finite number becomes the normal value.
 *
 * @param key The setting.
 * @param value The value, such as one read back from storage.
 * @returns The value, clamped and snapped.
 */
function normaliseSetting(key: keyof StorySettings, value: unknown): number {
	const { min, max, step, normal } = STORY_SETTING_RANGES[key];
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return normal;
	}
	const snapped = min + Math.round((value - min) / step) * step;
	// Rounded to drop floating-point dust, so 0.6 plus three steps reads back as 0.9 rather than 0.9000000000000001.
	return Number(Math.min(max, Math.max(min, snapped)).toFixed(4));
}

/**
 * Read the saved settings, or start from `initial` when nothing is saved yet.
 *
 * @param storageKey The site's storage key.
 * @param initial Values to start from when nothing is saved.
 * @returns The settings, each clamped and snapped.
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
	// Every field is checked by `normaliseSetting`, so a saved object of any shape is safe to read from.
	const source = (saved !== null && typeof saved === "object" ? saved : (initial ?? {})) as Partial<Record<keyof StorySettings, unknown>>;
	return {
		speed: normaliseSetting("speed", source.speed),
		bgm: normaliseSetting("bgm", source.bgm),
		sfx: normaliseSetting("sfx", source.sfx),
		sceneSize: normaliseSetting("sceneSize", source.sceneSize)
	};
}

/**
 * The reader's story settings, saved per browser under the site's own key. The archives share one origin, so each passes its own key. Saved
 * values are clamped and snapped as they are read, so a damaged one cannot break the player.
 *
 * @param storageKey The site's localStorage key, such as `ak.storySettings`.
 * @param initial Values to start from when nothing is saved yet, such as a setting carried over from an older control. Read on the first render.
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

	const update = useCallback((key: keyof StorySettings, value: number) => {
		setSettings((current) => {
			const next = normaliseSetting(key, value);
			return next === current[key] ? current : { ...current, [key]: next };
		});
	}, []);
	const setSpeed = useCallback((value: number) => update("speed", value), [update]);
	const setBgm = useCallback((value: number) => update("bgm", value), [update]);
	const setSfx = useCallback((value: number) => update("sfx", value), [update]);
	const setSceneSize = useCallback((value: number) => update("sceneSize", value), [update]);

	return useMemo(() => ({ ...settings, setSpeed, setBgm, setSfx, setSceneSize }), [settings, setSpeed, setBgm, setSfx, setSceneSize]);
}
