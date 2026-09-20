import type { ReactNode } from "react";

// MaterialUI imports
import { Grid } from "@mui/material";

/** How many of the twelve grid columns one card takes at each breakpoint. Fractions are allowed, so `2.4` gives five across. */
export interface CardGridSize {
	/** Columns on a phone, below 600px. */
	xs?: number;
	/** Columns from 600px up. */
	sm?: number;
	/** Columns from 900px up. */
	md?: number;
	/** Columns from 1200px up. */
	lg?: number;
	/** Columns from 1536px up. */
	xl?: number;
}

/**
 * Two across on a phone, three then four as it widens, five on a wide screen.
 *
 * GFL's five index pages all agree on `xs`, `sm` and `md`. They differ only at `lg`, where three of the five take `2.4` for five across, one
 * takes `2` for six, and one stops at `md`. The majority wins the default, and a page wanting six across passes its own `size`.
 */
const DEFAULT_SIZE: CardGridSize = { xs: 6, sm: 4, md: 3, lg: 2.4 };

/** Props for CardGrid. */
interface CardGridProps<T> {
	/** The items to lay out, already filtered and sorted. */
	items: readonly T[];
	/** A stable, unique key for one item. React needs it, and the grid cannot guess where an id lives. */
	getKey: (item: T) => string | number;
	/** Renders one item's card. The grid owns the cell, the caller owns what goes in it. */
	renderItem: (item: T) => ReactNode;
	/** Columns one card takes at each breakpoint. Defaults to five across on a wide screen. */
	size?: CardGridSize;
	/** Gap between cards, in theme spacing units. */
	spacing?: number;
}

/**
 * A responsive grid of cards.
 *
 * GFL never factored this out, so all five of its index pages wrote the same `Grid container` / `Grid size={...}` pair around their own card,
 * differing only in the breakpoints. That duplication is the thing that makes a second archive expensive, so the layout lives here and the
 * card stays with the app, which is the only part that knows what a doll or an operator looks like.
 *
 * @param props Component props.
 * @returns The grid.
 */
export default function CardGrid<T>({ items, getKey, renderItem, size = DEFAULT_SIZE, spacing = 4 }: CardGridProps<T>) {
	return (
		<Grid container spacing={spacing}>
			{items.map((item) => (
				<Grid key={getKey(item)} size={size}>
					{renderItem(item)}
				</Grid>
			))}
		</Grid>
	);
}
