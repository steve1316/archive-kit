// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// MUI theme augmentation

// Extra palette slots the kit's own components read. This has to be a real `.ts` module rather than a `.d.ts`, because `tsc` does not copy
// hand-written declaration files into `dist` - a `.d.ts` here would typecheck locally and simply not exist for a consumer.

/** A domain colour map: a game's own keys, such as a rarity or a class, mapped to the colour the palette shows for it. */
export type DomainColours<K extends PropertyKey = number> = Record<K, string>;

declare module "@mui/material/styles" {
	interface Palette {
		/** Chip and star colours keyed by a unit's rarity. The app supplies it, since each game numbers its rarities its own way. */
		rarity: DomainColours;
	}

	interface PaletteOptions {
		/** Chip and star colours keyed by a unit's rarity. The app supplies it, since each game numbers its rarities its own way. */
		rarity?: DomainColours;
	}
}
