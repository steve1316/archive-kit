/** Rendering a templated description with its values filled in, wherever a game writes skill or talent text with placeholders. */

import type { ReactNode } from "react";

// MaterialUI imports
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

/** How a filled-in value is picked out from the surrounding text. */
const VALUE_SX: SxProps<Theme> = { color: "primary.main", fontWeight: 700 };

/** How to find the placeholders in a description and what to put in their place. */
export interface TemplateOptions {
	/** Matches one placeholder, with the key to look up as its one and only capture group. `String.split` relies on that single group. */
	pattern: RegExp;
	/** Turns a captured key into the value to show. Return null or undefined to leave the placeholder empty. */
	resolve: (key: string) => string | number | null | undefined;
}

/**
 * A description with each placeholder replaced by its value, the values picked out from the surrounding text.
 *
 * The games write these differently - GFL uses `#1` against a `stat1` array, Arknights uses `{key}` against a blackboard - so the pattern and
 * the lookup come from the caller and only the splitting and the styling live here.
 *
 * @param description The text, with placeholders still in it.
 * @param options The placeholder pattern and the lookup.
 * @returns The description as plain text and highlighted values.
 */
export function describeTemplate(description: string, { pattern, resolve }: TemplateOptions): ReactNode[] {
	return description.split(pattern).map((part, index) =>
		// Split with a capture group puts the captured keys at odd indexes.
		index % 2 === 1 ? (
			<Box component="span" key={index} sx={VALUE_SX}>
				{resolve(part) ?? ""}
			</Box>
		) : (
			part
		)
	);
}
