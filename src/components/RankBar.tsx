// MaterialUI imports
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

import type { ReactElement } from "react";

/** One unfilled segment. A single shared object, so every segment hands the `sx` resolver the same reference. */
const EMPTY_SEGMENT: SxProps<Theme> = { flex: 1, height: 4, borderRadius: 1, bgcolor: "action.disabledBackground" };

/** One filled segment. */
const FILLED_SEGMENT: SxProps<Theme> = { flex: 1, height: 4, borderRadius: 1, bgcolor: "primary.main" };

const styles = {
	track: { display: "flex", gap: "2px", alignItems: "center" }
} satisfies Record<string, SxProps<Theme>>;

/** Bar bodies already built, keyed by the `max` they were built for. Each game sets its own scale, so there is one table per max in use. */
const SEGMENT_CACHE = new Map<number, ReactElement[][]>();

/**
 * Every bar body there can be for one `max`, indexed by value. An index page draws several bars on each of its tiles, so building them per
 * render meant thousands of throwaway elements and `sx` arrays for a handful of distinct results. The table is built once per `max` instead.
 *
 * @param max The highest a bar goes.
 * @returns The bar bodies, indexed by how many segments are filled.
 */
function segmentsFor(max: number): ReactElement[][] {
	let table = SEGMENT_CACHE.get(max);
	if (!table) {
		table = Array.from({ length: max + 1 }, (_unused, value) => Array.from({ length: max }, (_segment, index) => <Box key={index} sx={index < value ? FILLED_SEGMENT : EMPTY_SEGMENT} />));
		SEGMENT_CACHE.set(max, table);
	}
	return table;
}

/** Props for RankBar. */
interface RankBarProps {
	/** How many segments are filled, from 0 up to `max`. */
	value: number;
	/** The highest this bar goes, which is also how many segments are drawn. GFL's enemy ranks top out at 7. */
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
	return (
		<Box sx={styles.track} role="img" aria-label={`${label}: ${value} of ${max}`}>
			{segmentsFor(max)[Math.min(Math.max(value, 0), max)]}
		</Box>
	);
}
