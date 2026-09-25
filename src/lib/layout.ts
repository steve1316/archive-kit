/**
 * A size that fills the screen under the kit's navbar at every breakpoint. The navbar's spacer is MUI's `Toolbar`, so each `minHeight` in the
 * toolbar mixin, whatever breakpoint or orientation it sits under, becomes the same rule on `prop` with that height taken off `100dvh`.
 * `dvh` follows a phone's address bar, so nothing below the fold hides behind it. A height given as a number is in pixels.
 *
 * @param toolbar The theme's toolbar mixin, `theme.mixins.toolbar`.
 * @param prop The property to set.
 * @returns The style rules, to spread into an `sx` object.
 */
export function fillBelowNavbar(toolbar: object, prop: "height" | "minHeight"): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(toolbar).map(([key, value]) => {
			if (key === "minHeight") {
				return [prop, `calc(100dvh - ${typeof value === "number" ? `${value}px` : String(value)})`];
			}
			return [key, typeof value === "object" && value !== null ? fillBelowNavbar(value, prop) : value];
		})
	);
}
