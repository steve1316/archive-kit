/** How precisely a release date is known. `unreleased` marks a subject that never reached the region. */
export type ReleasePrecision = "day" | "month" | "launch" | "unknown" | "unreleased";

/** When a subject arrived on the region the archive covers. Each game's own data maps onto this shape rather than the kit knowing about it. */
export interface Release {
	/** `YYYY-MM-DD` for `day`, `YYYY-MM` for `month` and `launch`, and null for `unknown` and `unreleased`. */
	date: string | null;
	/** How precise `date` is. `launch` marks the subjects on the region's launch roster. */
	precision: ReleasePrecision;
}

/** English month abbreviations, fixed so the output never depends on the reader's locale. */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** The region named in the output when a caller does not say. Both archives cover the English release, which each game calls Global. */
const DEFAULT_REGION = "Global";

/**
 * Turn a `YYYY-MM` prefix into a short month and year, such as `Sep 2024`.
 *
 * @param date A `YYYY-MM` or `YYYY-MM-DD` date.
 * @returns The month and year, or null when the month is not 1 to 12.
 */
function monthYear(date: string): string | null {
	const month = MONTHS[Number(date.slice(5, 7)) - 1];
	return month ? `${month} ${date.slice(0, 4)}` : null;
}

/**
 * Format a release date at the precision it is known.
 *
 * @param release The release date and precision.
 * @param region What the game calls the region, used in the launch and unreleased wording. Defaults to `Global`.
 * @returns `25 Jul 2023` for a day, `Sep 2024` for a month, `Global launch (May 2018)` for the launch roster, `Not released on Global` for a
 *   subject that never arrived, and `Unknown` otherwise.
 */
export function formatRelease(release: Release, region: string = DEFAULT_REGION): string {
	if (release.precision === "unreleased") {
		return `Not released on ${region}`;
	}
	const date = release.date;
	const shortMonth = date === null ? null : monthYear(date);
	if (date === null || shortMonth === null || release.precision === "unknown") {
		return "Unknown";
	}
	if (release.precision === "launch") {
		return `${region} launch (${shortMonth})`;
	}
	if (release.precision === "month") {
		return shortMonth;
	}
	const day = Number(date.slice(8, 10));
	return day >= 1 && day <= 31 ? `${day} ${shortMonth}` : shortMonth;
}
