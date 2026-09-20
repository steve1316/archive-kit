/** Rendering a templated description with its values filled in, wherever a game writes skill or talent text with placeholders. */

import type { ReactNode } from "react";

// MaterialUI imports
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

/** How a filled-in value is picked out from the surrounding text. */
const VALUE_SX: SxProps<Theme> = { color: "primary.main", fontWeight: 700 };

/** Patterns that have already passed `checkPattern`, so a description does not pay for the check on every render. */
const CHECKED_PATTERNS = new WeakSet<RegExp>();

/** How to find the placeholders in a description and what to put in their place. */
export interface TemplateOptions {
	/** Matches one placeholder, with the key to look up as its one and only capture group, and never matching an empty string. */
	pattern: RegExp;
	/**
	 * Turns a captured key into the value to show. Return null or undefined to leave the placeholder empty.
	 *
	 * The key arrives exactly as captured, so a numeric one is still a string. Coerce it if the lookup needs a number, since `#01` and `#1`
	 * capture differently.
	 */
	resolve: (key: string) => string | number | null | undefined;
}

/**
 * Reject a pattern `String.split` cannot use, since the wrong shape corrupts the text silently rather than failing.
 *
 * A pattern with no capture group drops the text between placeholders. One with two groups leaks the extra capture into the output as literal
 * text. One that can match an empty string splits between every character.
 *
 * @param pattern The caller's placeholder pattern.
 */
function checkPattern(pattern: RegExp): void {
	if (CHECKED_PATTERNS.has(pattern)) {
		return;
	}
	// Adding an empty alternative makes the pattern match anything, so the result's length reports the group count. Flags are dropped so a
	// sticky or global pattern cannot skew the probe or have its `lastIndex` moved.
	const probe = new RegExp(`${pattern.source}|`).exec("");
	const groups = probe === null ? 0 : probe.length - 1;
	if (groups !== 1) {
		throw new Error(`describeTemplate needs a pattern with exactly one capture group, but ${String(pattern)} has ${groups}.`);
	}
	if (new RegExp(pattern.source).test("")) {
		throw new Error(`describeTemplate needs a pattern that cannot match an empty string, but ${String(pattern)} can.`);
	}
	CHECKED_PATTERNS.add(pattern);
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
 * @throws When `pattern` does not have exactly one capture group, or can match an empty string.
 */
export function describeTemplate(description: string, { pattern, resolve }: TemplateOptions): ReactNode[] {
	checkPattern(pattern);
	// Split with a capture group puts the captured keys at odd indexes. A key is undefined when the group sat in a branch that did not match,
	// which `String.split`'s own type does not admit, so it is checked rather than handed to `resolve`.
	return description.split(pattern).map((part: string | undefined, index) =>
		index % 2 === 1 ? (
			<Box component="span" key={index} sx={VALUE_SX}>
				{part === undefined ? "" : (resolve(part) ?? "")}
			</Box>
		) : (
			part
		)
	);
}
