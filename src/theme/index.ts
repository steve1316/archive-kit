// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// The theme factory

import { createTheme } from "@mui/material";
import type { PaletteOptions, Theme, ThemeOptions } from "@mui/material";

import { archiveTypography } from "./typography.js";

/** The kit's corner radius, used when a caller does not override `shape`. */
const DEFAULT_SHAPE: ThemeOptions["shape"] = { borderRadius: 8 };

/**
 * Component defaults, so a card looks the same on a detail page as it does on an index without either file saying so.
 *
 * These are the whole reason the factory exists rather than each archive calling `createTheme` itself. They read `palette.raised` and
 * `palette.divider`, which is why `ArchivePaletteOptions` requires the former.
 */
const ARCHIVE_COMPONENTS: ThemeOptions["components"] = {
	// Stat figures have to line up down a column, and proportional digits do not.
	MuiTableCell: {
		styleOverrides: {
			root: ({ theme }) => ({
				borderBottomColor: theme.palette.divider,
				fontVariantNumeric: "tabular-nums"
			})
		}
	},
	// A card lifts off the page rather than being outlined. On a dark ground a shadow alone reads weakly, so most of the lift comes from the
	// lighter surface and the shadow only softens the edge.
	MuiCard: {
		defaultProps: { elevation: 0 },
		styleOverrides: {
			root: ({ theme }) => ({
				backgroundColor: theme.palette.raised,
				backgroundImage: "none",
				boxShadow: "0 2px 5px rgba(0, 0, 0, 0.4), 0 8px 18px rgba(0, 0, 0, 0.3)"
			})
		}
	},
	// MUI lightens dark surfaces with an overlay gradient as elevation rises, which fights a palette that already says what each surface is.
	MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
	MuiChip: { styleOverrides: { root: { fontWeight: 650 } } },
	MuiTooltip: {
		styleOverrides: {
			tooltip: ({ theme }) => ({
				backgroundColor: theme.palette.raised,
				color: theme.palette.text.primary,
				border: `1px solid ${theme.palette.divider}`,
				fontSize: "0.78rem"
			})
		}
	},
	MuiAppBar: {
		defaultProps: { elevation: 0 },
		styleOverrides: {
			root: ({ theme }) => ({
				backgroundColor: theme.palette.raised,
				backgroundImage: "none",
				borderBottom: `1px solid ${theme.palette.divider}`,
				color: theme.palette.text.primary
			})
		}
	}
};

/** The palette an archive supplies. `raised` is required here, unlike on MUI's `Palette`, because the kit's own component defaults paint with it. */
export interface ArchivePaletteOptions extends PaletteOptions {
	/** One step above `background.paper`, for panels that sit on top of a card. */
	raised: string;
}

/** Options for createArchiveTheme. */
export interface ArchiveThemeOptions {
	/** The archive's colours, including any domain colour maps such as `rarity`. Dark only - light mode is a settled won't-do. */
	palette: ArchivePaletteOptions;
	/** Replaces the kit's type scale outright. Left out, `archiveTypography` is used. */
	typography?: ThemeOptions["typography"];
	/** Merged over the kit's component defaults, one whole component entry at a time. Naming a component replaces the kit's entry for it rather than merging into it. */
	components?: ThemeOptions["components"];
	/** Replaces the kit's 8px corner radius. */
	shape?: ThemeOptions["shape"];
}

/**
 * Build an archive's MUI theme: the caller's colours, the kit's type scale and the kit's component defaults.
 *
 * GFL exports one fixed theme because it is one site. The kit cannot, so everything a game decides for itself arrives here and everything the
 * kit has an opinion about is baked in.
 *
 * @param options The archive's palette, and anything it overrides.
 * @returns The configured theme.
 */
export function createArchiveTheme({ palette, typography = archiveTypography, components, shape = DEFAULT_SHAPE }: ArchiveThemeOptions): Theme {
	return createTheme({
		palette,
		typography,
		shape,
		components: { ...ARCHIVE_COMPONENTS, ...components }
	});
}
