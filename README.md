# archive-kit

The shared front-end framework behind a family of static game-archive sites, starting with
[Griffin Archive](https://github.com/steve1316/gfl-archive) (Girls' Frontline) and an Arknights archive.

Every one of those sites is the same shape: a filterable index of hundreds of units, a detail page per unit,
a zoomable art viewer, a search box in the navbar, and a dark MUI theme. This package holds the parts that do
not care which game they are showing, so a second archive is a data pipeline and a set of pages rather than a
second codebase.

## Installing

It is consumed as a git dependency, not from npm:

```jsonc
{
	"dependencies": {
		"archive-kit": "github:steve1316/archive-kit#v0.1.0"
	}
}
```

pnpm clones the tag and runs `prepare` to build it. The consuming app supplies `react`, `react-dom`,
`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled` and `react-router-dom`, which are
peer dependencies here so exactly one copy of React and MUI ends up in the bundle.

## What is in it

- **Presentational components** - filter chips, rows and panels, an index summary bar, a card grid, a name
  highlighter, a lazily-mounted section, an error boundary and load-error notice, scroll helpers, art
  placeholder and zoom controls, a page backdrop, a level slider, a star-rank picker and a rank bar.
- **A navbar** that takes its search sources and destinations as props.
- **Hooks** for zoom and pan, and for an art viewer.
- **Pure helpers** for name search and match spans, art layout, release-date formatting, and templated skill
  text.
- **A theme factory** that takes a palette and domain colour maps and returns a configured dark MUI theme.
- **Data primitives** - a retry-safe fetch and cache layer, and a shard resolver, both taking their URLs from
  the app.
- **An asset URL builder factory**, so the host stays switchable.

## What is deliberately not in it

Anything that reads `import.meta.glob`, `import.meta.env`, an asset manifest, or a particular game's types.
Those are compile-time or game-specific concerns and belong to each app. A Vite glob written inside a package
resolves against the package's own folder once it is installed, so it cannot live here.

## Licence

GPL-3.0-or-later, the same as the sites built on it.
