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

**pnpm 12 will refuse that install until the package is allowlisted.** A git-hosted dependency that runs
build scripts needs an entry in the app's `pnpm-workspace.yaml`, and the key is the resolved tarball URL
including the commit, not the package name:

```yaml
allowBuilds:
  archive-kit@https://codeload.github.com/steve1316/archive-kit/tar.gz/<commit-sha>: true
```

Without it the install stops at `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`. Run `pnpm install` once and copy the
key out of the error, which prints the exact line to paste. Because the key carries a commit, it has to be
updated whenever the pinned tag moves - the same install error is how you find out.

## What is in it

- **Presentational components** - filter chips, rows and panels, an index summary bar, a card grid, a name
  highlighter, a lazily-mounted section, an error boundary and load-error notice, scroll helpers, art
  placeholder and zoom controls, a page backdrop, a level slider, a star-rank picker and a rank bar.
- **A navbar** that takes its search sources and destinations as props, and that a page can hide under a media query.
- **A mobile story reader** - the shared phone layout for reading a story, upright or on its side. The site brings
  its scene, lines and controls. The reader lays them out and keeps the transcript, the Log and fullscreen.
- **Hooks** for zoom and pan, an art viewer, fullscreen, the phone's media controls, and telling a phone from a desktop.
- **Pure helpers** for name search and match spans, art layout, release-date formatting, and templated skill
  text.
- **A theme factory** that takes an archive's palette and returns a dark MUI theme carrying the kit's type scale and component defaults.
- **Data primitives** - a retry-safe fetch and cache layer, and a shard resolver, both taking their URLs from
  the app.
- **An asset URL builder factory**, so the host stays switchable.
- **Build-time presets**, under a second entry point - see below.

## Build-time presets

Everything above is imported from `archive-kit` and runs in the browser. The build-time pieces sit behind
`archive-kit/config` instead, so `vite` never enters an app's client bundle graph:

```ts
import { spaFallback, routePages, baseTrailingSlash } from "archive-kit/config";
```

`spaFallback()` copies the built `index.html` to `404.html`, which is how a static host with no rewrite rules
still serves a deep route. `routePages(() => paths)` goes one step further for the routes you list, such as
`operator/10`: it writes a copy at `operator/10.html`, so GitHub Pages answers that route with a 200 rather
than a 404 that happens to render. `baseTrailingSlash()` redirects the bare base path to the base path in the dev and
preview servers. Both read the resolved Vite config rather than guessing, so a custom `base` or `outDir` is
honoured.

Three files are shipped to copy rather than import:

| Path | What it is |
|---|---|
| `archive-kit/tsconfig.base.json` | The app-side TypeScript config, meant for `extends` |
| `archive-kit/presets/deploy.yml` | The GitHub Pages workflow |
| `archive-kit/presets/Dockerfile` | A root-path build, for checking the site before a push |
| `archive-kit/presets/nginx.conf` | What that image serves with |
| `archive-kit/presets/docker-compose.yml` | Brings the image up on port 8088 |
| `archive-kit/presets/dockerignore` | Copy to `.dockerignore`; shipped without the dot so it is visible |

The Dockerfile is worth reading before writing your own: `node:22-alpine` ships no git, and this package
installs from a git URL and builds itself at install time, so the build stage needs `apk add --no-cache git`
or the install fails with `sh: git: not found`.
It also copies `pnpm-workspace.yaml` before installing, since that is where the `allowBuilds` entry lives, and
without it the install fails with `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`.

## What is deliberately not in it

Anything that reads `import.meta.glob`, `import.meta.env`, an asset manifest, or a particular game's types.
Those are compile-time or game-specific concerns and belong to each app. A Vite glob written inside a package
resolves against the package's own folder once it is installed, so it cannot live here.

This is enforced rather than merely intended: the package's own `tsconfig.json` sets `"types": []`, so both
macros are type errors anywhere in `src/`. `tsconfig.base.json`, which is for apps, keeps `vite/client` and
so allows them.

## Licence

GPL-3.0-or-later, the same as the sites built on it.
