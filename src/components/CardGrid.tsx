import { Grid } from "@mui/material";
import type { ReactNode } from "react";

/** How many of the twelve grid columns one card takes at each breakpoint. Matches MUI's `Grid` `size` prop. */
export type CardGridSize = { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };

/** Six across on a wide screen, two on a phone, which is what every GFL index settled on independently. */
const DEFAULT_SIZE: CardGridSize = { xs: 6, sm: 4, md: 3, lg: 2 };

/** Props for CardGrid. */
interface CardGridProps<T> {
	/** The items to lay out, already filtered and sorted. */
	items: readonly T[];
	/** A stable, unique key for one item. React needs it, and the grid cannot guess where an id lives. */
	getKey: (item: T) => string | number;
	/** Renders one item's card. The grid owns the cell, the caller owns what goes in it. */
	renderItem: (item: T) => ReactNode;
	/** Columns one card takes at each breakpoint. Defaults to six across on a wide screen. */
	size?: CardGridSize;
	/** Gap between cards, in theme spacing units. */
	spacing?: number;
}

/**
 * A responsive grid of cards.
 *
 * GFL never factored this out, so all four of its index pages wrote the same `Grid container` / `Grid size={...}` pair around their own card,
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
