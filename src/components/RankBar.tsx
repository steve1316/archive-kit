import type { ReactElement } from "react";

// MaterialUI imports
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

/** One unfilled segment. A single shared object, so every segment hands the `sx` resolver the same reference. */
const EMPTY_SEGMENT: SxProps<Theme> = { flex: 1, height: 4, borderRadius: 1, bgcolor: "action.disabledBackground" };

/** One filled segment. */
const FILLED_SEGMENT: SxProps<Theme> = { flex: 1, height: 4, borderRadius: 1, bgcolor: "primary.main" };

const styles = {
	track: { display: "flex", gap: "2px", alignItems: "center" }
} satisfies Record<string, SxProps<Theme>>;

/** Bar bodies already built, keyed by the segment count they were built for. Each game sets its own scale, so there is one table per count. */
const SEGMENT_CACHE = new Map<number, ReactElement[][]>();

/**
 * Round a count down to a whole, non-negative number of segments. `max` and `value` arrive as props, so unlike GFL's fixed constant they can be
 * fractional, negative or NaN, each of which would otherwise index the table with a key it does not have and render an empty bar with no error.
 *
 * @param count The raw count from a prop.
 * @returns The count as a whole number, at least 0.
 */
function wholeCount(count: number): number {
	return Number.isFinite(count) ? Math.max(Math.floor(count), 0) : 0;
}

/**
 * Every bar body there can be for one segment count, indexed by value. An index page draws several bars on each of its tiles, so building them
 * per render meant thousands of throwaway elements and `sx` arrays for a handful of distinct results. The table is built once per count instead,
 * and sharing one element array across every bar at that count also lets React skip the subtree.
 *
 * @param segments How many segments the bar has, already whole and non-negative.
 * @returns The bar bodies, indexed by how many segments are filled.
 */
function segmentsFor(segments: number): ReactElement[][] {
	let table = SEGMENT_CACHE.get(segments);
	if (!table) {
		table = Array.from({ length: segments + 1 }, (_unused, value) =>
			Array.from({ length: segments }, (_unusedSegment, index) => <Box key={index} sx={index < value ? FILLED_SEGMENT : EMPTY_SEGMENT} />)
		);
		SEGMENT_CACHE.set(segments, table);
	}
	return table;
}

/** Props for RankBar. */
interface RankBarProps {
	/** How many segments are filled, from 0 up to `max`. Anything outside that range is clamped into it. */
	value: number;
	/** The highest this bar goes, which is also how many segments are drawn. Each game sets its own scale. */
	max: number;
	/** What the bar measures, read out to assistive technology since the segments themselves carry no text. */
	label: string;
}

/**
 * One of an archive's rank bars, drawn as filled segments rather than a number because that is how the games show it.
 *
 * @param props Component props.
 * @returns The bar.
 */
export default function RankBar({ value, max, label }: RankBarProps) {
	const segments = wholeCount(max);
	const filled = Math.min(wholeCount(value), segments);
	return (
		<Box sx={styles.track} role="img" aria-label={`${label}: ${filled} of ${segments}`}>
			{segmentsFor(segments)[filled]}
		</Box>
	);
}
