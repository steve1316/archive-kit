// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// MUI theme augmentation

// Extra palette slots the kit's own components read. This has to be a real `.ts` module rather than a `.d.ts`, because `tsc` does not copy
// hand-written declaration files into `dist` - a `.d.ts` here would typecheck locally and simply not exist for a consumer.

// MUI's documented pattern for an augmentation. It imports nothing, and only makes the module being augmented resolvable on its own, so this
// file still compiles in a program that happens not to pull `@mui/material` in some other way.
import type {} from "@mui/material/styles";

/** A domain colour map: a game's own keys, such as a rarity or a class, mapped to the colour the palette shows for it. */
export type DomainColours<K extends PropertyKey = number> = Record<K, string>;

declare module "@mui/material/styles" {
	interface Palette {
		// Optional on purpose. `createTheme` fills defaults for MUI's own slots but never for an added one, so a required type here would
		// promise something nothing delivers and turn a forgotten slot into a runtime crash instead of a type error. `createArchiveTheme`
		// requires them in its own options type, which is where the guarantee belongs.
		/** One step above `background.paper`, for panels that sit on top of a card. The kit's card, tooltip and app bar defaults paint with it. */
		raised?: string;
		/** Chip and star colours keyed by a unit's rarity. The app supplies it, since each game numbers its rarities its own way. */
		rarity?: DomainColours;
	}

	interface PaletteOptions {
		/** See `Palette.raised`. */
		raised?: string;
		/** See `Palette.rarity`. */
		rarity?: DomainColours;
	}
}
