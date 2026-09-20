import { memo, useCallback, useMemo, useState } from "react";
import type { FormEvent, HTMLAttributes, Key, SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

// MaterialUI imports
import { Box, AppBar, Toolbar, IconButton, Typography, Drawer, List, ListItemButton, ListItemIcon, ListItemText, alpha, Divider, TextField, useMediaQuery, useTheme } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

// Autocomplete imports
import Autocomplete from "@mui/material/Autocomplete";
import type { AutocompleteRenderInputParams } from "@mui/material/Autocomplete";
import type { FilterOptionsState } from "@mui/material/useAutocomplete";

// MaterialUI icon imports
import MenuIcon from "@mui/icons-material/Menu";
import HomeGlyphIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import HighlightedName from "./HighlightedName.js";
import { findNameMatch, matchesAnyName, normaliseName } from "../lib/nameSearch.js";

/** One entry the search box can match and open. */
export interface SearchOption {
	/** The page this option opens, such as `/tdoll/65`. Also what tells two subjects with the same name or id apart. */
	path: string;
	/** The name shown in the dropdown and matched against. */
	name: string;
	/** The name and any aliases, each already passed through `normaliseName`, which the typed text is matched against. */
	keys: string[];
	/** A short tag shown after the name for anything that is not the archive's main subject, such as `HOC`. */
	tag?: string;
}

/** One destination in the navigation drawer. */
export interface NavItem {
	/** The label. */
	title: string;
	/** The route it opens. */
	link: string;
	/** URL of the icon shown beside it. The app builds this, since the kit does not know the asset host. */
	icon: string;
}

/** A search option with its dropdown heading worked out. */
interface GroupedOption extends SearchOption {
	/** The heading this option groups under: a letter, or `0-9` for names starting with a digit. */
	firstLetter: string;
}

/**
 * Styles for the navigation bar, as `sx` entries.
 *
 * `search` reads the theme, which `sx` supplies through a callback, and `title` uses the responsive object form in place of a media query.
 */
const styles = {
	root: { flexGrow: 1 },
	homeButton: { mr: 2 },
	optionTag: { ml: 1, fontSize: "0.7rem", fontWeight: 700, color: "text.secondary" },
	title: { flexGrow: 1 },
	search: (theme: Theme) => ({
		position: "relative",
		width: "100%",
		marginLeft: 0,
		marginRight: theme.spacing(2),
		[theme.breakpoints.up("sm")]: {
			marginLeft: theme.spacing(3),
			width: "auto"
		}
	}),
	drawerPaper: { width: "inherit" },
	/**
	 * One drawer icon.
	 *
	 * `block` rather than the inline default, or the image sits on the text baseline three pixels down from the top of its slot. `contain`
	 * because a game's own icons come at many shapes, and stretching each one into a square squashes the tall ones.
	 */
	navIcon: { display: "block", width: 25, height: 25, objectFit: "contain" },
	link: { textDecoration: "none", color: "text.primary" }
} satisfies Record<string, SxProps<Theme>>;

/**
 * The heading a search option groups under.
 *
 * @param option The option.
 * @returns Its leading letter, or `0-9`.
 */
const groupByLetter = (option: GroupedOption) => option.firstLetter;

/**
 * The text a search option shows and is matched on.
 *
 * @param option The option.
 * @returns The name.
 */
const optionLabel = (option: GroupedOption) => option.name;

/**
 * Narrow the dropdown to options whose name or alias holds the typed text, ignoring case, spaces and punctuation.
 *
 * @param list Every option.
 * @param state MUI's filter state, carrying the typed text.
 * @returns The matching options, in their original order.
 */
const filterByName = (list: GroupedOption[], state: FilterOptionsState<GroupedOption>) => {
	const needle = normaliseName(state.inputValue);
	return needle ? list.filter((option) => matchesAnyName(option.keys, needle)) : list;
};

/**
 * Whether two options are the same subject. Names repeat across forms and ids overlap between categories, so options are compared by page.
 *
 * @param option An option.
 * @param value The selected value.
 * @returns True when both open the same page.
 */
const sameOption = (option: GroupedOption, value: GroupedOption) => option.path === value.path;

/**
 * One row of the search dropdown, with the matched text in bold.
 *
 * The match comes from `findNameMatch`, the same helper the cards use, so the dropdown bolds exactly what the filter matched on. GFL used a
 * separate library here that needed a word boundary, which left most rows in the list with nothing bolded at all.
 *
 * @param optionProps Props MUI supplies for the row, including its key.
 * @param option The option to render.
 * @param state MUI's render state, carrying the typed text.
 * @returns The row.
 */
const renderSearchOption = (optionProps: HTMLAttributes<HTMLLIElement> & { key: Key }, option: GroupedOption, state: { inputValue: string }) => {
	const { key, ...rest } = optionProps;
	return (
		<li key={key} {...rest}>
			<HighlightedName name={option.name} match={findNameMatch(option.name, state.inputValue)} />
			{option.tag && (
				<Box component="span" sx={styles.optionTag}>
					{option.tag}
				</Box>
			)}
		</li>
	);
};

/**
 * The search field's pill styling.
 *
 * @param theme The theme.
 * @returns The sx for the field.
 */
const searchFieldSx = (theme: Theme) => ({
	"& .MuiOutlinedInput-root": {
		borderRadius: "999px",
		backgroundColor: alpha(theme.palette.common.white, 0.11),
		"&:hover": { backgroundColor: alpha(theme.palette.common.white, 0.17) },
		"& fieldset": { borderColor: "transparent" },
		"&:hover fieldset": { borderColor: "transparent" },
		"&.Mui-focused fieldset": { borderColor: theme.palette.secondary.main, borderWidth: 2 }
	},
	// The secondary text colour reads 3.6:1 on the pill, under the 4.5:1 minimum for text this size.
	"& .MuiInputLabel-root:not(.Mui-focused):not(.Mui-error)": { color: alpha(theme.palette.text.primary, 0.7) }
});

/** Props for NavList. */
interface NavListProps {
	/** The destinations, in bar order. */
	navItems: readonly NavItem[];
	/** Called when a destination is picked, to close the drawer. */
	onNavigate: () => void;
}

/**
 * The drawer's list of destinations.
 *
 * Memoised because the navbar re-renders on every keystroke in the search field, which would otherwise rebuild this list too.
 *
 * @param props Component props.
 * @returns The list.
 */
const NavList = memo(function NavList({ navItems, onNavigate }: NavListProps) {
	return (
		<List>
			{navItems.map((item) => (
				<div key={item.title}>
					<Box component={Link} to={item.link} sx={styles.link} onClick={onNavigate}>
						<ListItemButton>
							{/* Not MUI's `Icon`, which exists for icon fonts: it is a 24px box with `overflow: hidden`, and the 25px image
							    inside it loses four pixels off the bottom of every entry. */}
							<ListItemIcon>
								<Box component="img" src={item.icon} alt="" sx={styles.navIcon} />
							</ListItemIcon>
							<ListItemText primary={item.title} />
						</ListItemButton>
					</Box>
					<Divider />
				</div>
			))}
		</List>
	);
});

/** Props for ArchiveNavbar. */
interface ArchiveNavbarProps {
	/** The archive's name, shown at the left of the bar. */
	title: string;
	/** The drawer's destinations, in order. */
	navItems: readonly NavItem[];
	/** Everything the search box can match, built by the app from its own search indexes. Sorting and grouping are done here. */
	searchOptions: readonly SearchOption[];
	/** Where the home button goes. */
	homeLink?: string;
	/** The search field's resting label. */
	searchLabel?: string;
	/** The search field's label after a submit that matched nothing. */
	noMatchLabel?: string;
}

/**
 * The top bar: drawer trigger, title and search.
 *
 * Its only couplings to a game were the option list and the drawer items, so both arrive as props. Everything else - the narrow-screen search
 * fold, the grouped dropdown, submit-without-picking - is the same on any archive.
 *
 * @param props Component props.
 * @returns The application bar and its navigation drawer.
 */
export default function ArchiveNavbar({ title, navItems, searchOptions, homeLink = "/", searchLabel = "Search...", noMatchLabel = "No match found" }: ArchiveNavbarProps) {
	const navigate = useNavigate();
	const theme = useTheme();
	// The bar cannot hold a title and a search field at once on a phone, so below `sm` the field is folded behind an icon.
	const isNarrow = useMediaQuery(theme.breakpoints.down("sm"));
	const [searchOpen, setSearchOpen] = useState(false);

	const [drawerOpen, setDrawerOpen] = useState(false);
	const [searchValue, setSearchValue] = useState("");
	const [hasError, setHasError] = useState(false);

	// Grouped and sorted once per option list rather than per render, since the navbar re-renders on every keystroke. MUI's `groupBy` only
	// reads correctly when the list is already in heading order, so the sort is not optional.
	const options = useMemo(
		() =>
			searchOptions
				.map((option): GroupedOption => {
					const firstLetter = option.name.charAt(0).toUpperCase();
					return { ...option, firstLetter: /[0-9]/.test(firstLetter) ? "0-9" : firstLetter };
				})
				.sort((a, b) => a.firstLetter.localeCompare(b.firstLetter) || a.name.localeCompare(b.name)),
		[searchOptions]
	);

	// Every handler is stable, so the memoised drawer list and the Autocomplete's callback props do not change identity on every keystroke.
	const handleDrawerToggle = useCallback(() => setDrawerOpen((open) => !open), []);
	const closeDrawer = useCallback(() => setDrawerOpen(false), []);
	const openSearch = useCallback(() => setSearchOpen(true), []);
	const closeSearch = useCallback(() => setSearchOpen(false), []);

	// Send the reader to a subject and leave search mode. Shared by picking a suggestion and by submitting the form, so both behave alike.
	const goTo = useCallback(
		(option: SearchOption) => {
			// Collapse the field again, or the reader lands on the page with the bar still in search mode.
			setSearchOpen(false);
			void navigate(option.path);
		},
		[navigate]
	);

	// Submitting without picking a suggestion. An exact name or alias wins, otherwise the first option the typed text appears in, which is the
	// row the dropdown would have had highlighted.
	const handleSubmit = useCallback(
		(event?: FormEvent) => {
			event?.preventDefault();
			const typed = normaliseName(searchValue);
			if (typed === "") {
				return;
			}
			const selected = options.find((option) => option.keys.includes(typed)) ?? options.find((option) => matchesAnyName(option.keys, typed));
			if (!selected) {
				setHasError(true);
				return;
			}
			goTo(selected);
		},
		[searchValue, goTo, options]
	);

	const handleInputChange = useCallback((_event: SyntheticEvent, newInputValue: string) => {
		setSearchValue(newInputValue);
		// Without this the failed-search label stays until the next successful submit.
		setHasError(false);
	}, []);

	const handleOptionChange = useCallback(
		(_event: SyntheticEvent, option: GroupedOption | null) => {
			if (option) {
				goTo(option);
			}
		},
		[goTo]
	);

	const renderSearchInput = useCallback(
		(params: AutocompleteRenderInputParams) => <TextField {...params} color="secondary" label={hasError ? noMatchLabel : searchLabel} variant="outlined" sx={searchFieldSx} />,
		[hasError, noMatchLabel, searchLabel]
	);

	const searchField = (
		<form onSubmit={handleSubmit} style={{ width: "100%" }}>
			<Autocomplete
				options={options}
				groupBy={groupByLetter}
				getOptionLabel={optionLabel}
				filterOptions={filterByName}
				size="small"
				sx={{ width: "100%", minWidth: { xs: 0, sm: 300 } }}
				inputValue={searchValue}
				onInputChange={handleInputChange}
				onChange={handleOptionChange}
				isOptionEqualToValue={sameOption}
				// MUI swallows the first Enter to select the highlighted row, so without a row highlighted the reader had to press Enter twice.
				autoHighlight
				blurOnSelect
				clearOnEscape
				renderInput={renderSearchInput}
				renderOption={renderSearchOption}
			/>
		</form>
	);

	return (
		<Box component="div" sx={styles.root}>
			<AppBar position="fixed">
				<Toolbar>
					{isNarrow && searchOpen ? (
						<>
							<IconButton edge="start" onClick={closeSearch} color="inherit" aria-label="close search" size="large">
								<ArrowBackIcon />
							</IconButton>
							{searchField}
						</>
					) : (
						<>
							<IconButton edge="start" onClick={handleDrawerToggle} color="inherit" aria-label="menu" size="large">
								<MenuIcon />
							</IconButton>
							<IconButton component={Link} to={homeLink} sx={styles.homeButton} color="inherit" aria-label="home" size="large">
								<HomeGlyphIcon />
							</IconButton>
							<Typography variant="h6" sx={styles.title} noWrap>
								{title}
							</Typography>
							{isNarrow ? (
								<IconButton onClick={openSearch} color="inherit" aria-label="search" size="large">
									<SearchIcon />
								</IconButton>
							) : (
								<Box component="div" sx={styles.search}>
									{searchField}
								</Box>
							)}
						</>
					)}
				</Toolbar>
			</AppBar>

			{/* Takes its height from the bar itself, so a page never has to guess a top margin against a bar that is 56, 64 or 48px. */}
			<Toolbar />

			<Drawer style={{ width: "200px" }} anchor="left" open={drawerOpen} onClose={handleDrawerToggle} variant="temporary" slotProps={{ paper: { sx: styles.drawerPaper } }}>
				<NavList navItems={navItems} onNavigate={closeDrawer} />
			</Drawer>
		</Box>
	);
}
