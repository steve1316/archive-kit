import { memo, useCallback, useId, useMemo } from "react";
import type { ReactNode } from "react";

import { Box, Slider, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

import { STORY_SETTING_RANGES } from "../hooks/useStorySettings.js";
import type { StorySettingRange, StorySettingsState, StorySliderKey } from "../hooks/useStorySettings.js";

// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// Layout

/** The panel: one setting under another, with the site's own settings last. */
const PANEL_SX = { display: "grid", gap: 1.5 } satisfies SxProps<Theme>;

/** A setting's label and its readout, on one line over the slider. */
const HEAD_SX = { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 1 } satisfies SxProps<Theme>;

/** The readout, such as "1x" or "80%", in figures that keep their width as they change. */
const READOUT_SX = { color: "text.secondary", fontVariantNumeric: "tabular-nums" } satisfies SxProps<Theme>;

/** The slider, inset a little so its thumb stays inside the panel at either end. */
const SLIDER_SX = { display: "block", width: "auto", mx: 0.75 } satisfies SxProps<Theme>;

/** The sliders, in the order they show. The scene size is the phone reader's alone. */
const ROWS: readonly SettingRow[] = [
	{ key: "speed", label: "Text speed", format: formatSpeed, setter: (settings) => settings.setSpeed },
	{ key: "bgm", label: "BGM volume", format: formatShare, setter: (settings) => settings.setBgm },
	{ key: "sfx", label: "SFX volume", format: formatShare, setter: (settings) => settings.setSfx },
	{ key: "sceneSize", label: "Scene size", format: formatShare, setter: (settings) => settings.setSceneSize }
];

// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// Types

/** One slider in the panel. */
interface SettingRow {
	/** The setting it changes. */
	key: StorySliderKey;
	/** The label over it. */
	label: string;
	/** Turns a value into the readout beside the label. */
	format: (value: number) => string;
	/** Picks this setting's setter from the settings. */
	setter: (value: StorySettingsState) => (next: number) => void;
}

/** Props for StorySettingsPanel. */
export interface StorySettingsPanelProps {
	/** The settings and their setters, from `useStorySettings`. */
	value: StorySettingsState;
	/** Whether to show the scene-size slider, which only the phone reader uses. */
	sceneSize?: boolean;
	/** Extra settings drawn under the standard ones, such as a site's own name field. */
	children?: ReactNode;
}

/** Props for SettingSlider. */
interface SettingSliderProps {
	/** The label over the slider. */
	label: string;
	/** The current value. */
	value: number;
	/** The setting's range, step and normal value. */
	range: StorySettingRange;
	/** Turns a value into its readout. */
	format: (value: number) => string;
	/** Called with the new value as the slider moves. */
	onChange: (value: number) => void;
}

// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// Panel

/**
 * A speed as a multiplier, such as "1.25x".
 *
 * @param value The speed.
 * @returns The readout.
 */
function formatSpeed(value: number): string {
	return `${value}x`;
}

/**
 * A share as a percentage, such as "80%".
 *
 * @param value The share, 0 to 1.
 * @returns The readout.
 */
function formatShare(value: number): string {
	return `${Math.round(value * 100)}%`;
}

/**
 * One setting: its label and readout over a slider, with a mark at the normal value to show the way back to it. Memoised, so moving one
 * slider leaves the others alone.
 *
 * @param props Component props.
 * @returns The setting.
 */
const SettingSlider = memo(function SettingSlider({ label, value, range, format, onChange }: SettingSliderProps) {
	const labelId = useId();
	const marks = useMemo(() => [{ value: range.normal }], [range.normal]);
	const handleChange = useCallback((_event: Event, next: number | number[]) => onChange(Array.isArray(next) ? (next[0] ?? range.normal) : next), [onChange, range.normal]);
	return (
		<Box>
			<Box sx={HEAD_SX}>
				<Typography id={labelId} variant="body2">
					{label}
				</Typography>
				<Typography variant="body2" sx={READOUT_SX}>
					{format(value)}
				</Typography>
			</Box>
			<Slider
				size="small"
				aria-labelledby={labelId}
				getAriaValueText={format}
				value={value}
				min={range.min}
				max={range.max}
				step={range.step}
				shiftStep={range.step * 2}
				marks={marks}
				onChange={handleChange}
				sx={SLIDER_SX}
			/>
		</Box>
	);
});

/**
 * The reader's story settings as sliders: text speed, BGM and SFX volume, and on a phone the scene's size, then whatever the site adds. It
 * has no title or close button, since the sheet or card around it supplies those.
 *
 * @param props Component props.
 * @returns The panel.
 */
function StorySettingsPanel({ value, sceneSize = false, children }: StorySettingsPanelProps) {
	return (
		<Box sx={PANEL_SX}>
			{ROWS.map((row) =>
				row.key === "sceneSize" && !sceneSize ? null : (
					<SettingSlider key={row.key} label={row.label} value={value[row.key]} range={STORY_SETTING_RANGES[row.key]} format={row.format} onChange={row.setter(value)} />
				)
			)}
			{children}
		</Box>
	);
}

export default memo(StorySettingsPanel);
