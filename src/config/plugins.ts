// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// Vite plugins

// These are the only files in the kit that import from `vite`, and they are reachable solely through the `archive-kit/config` subpath. Keeping
// them out of the main barrel is what stops `vite` from entering an app's client bundle graph.

// `tsconfig.json` sets `"types": []` so no ambient package can hand the component tree `import.meta.env` or `import.meta.glob` - invariant 1.
// This file runs in Node during a build and genuinely needs `fs` and `path`, so it asks for those types itself rather than the tree being
// opened up for it. Never add `vite/client` this way: the browser globals are exactly what the empty `types` list exists to keep out.
/// <reference types="node" />

import { copyFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Connect, Plugin } from "vite";

/**
 * Copy the built `index.html` to `404.html`.
 *
 * GitHub Pages has no rewrite rules, so a direct visit to a route such as `/operator/char_002_amiya` gets its 404 page. Serving the app as that
 * 404 page lets the router take over and render the route.
 *
 * The output folder is read from the resolved Vite config rather than from `__dirname`, which is what GFL used. `__dirname` inside an installed
 * package points at the package, not the app, so it would copy the wrong file or none at all - the same trap as a Vite macro, in a different
 * shape. Reading the config also means a custom `build.outDir` is honoured for free.
 *
 * @returns The Vite plugin.
 */
export function spaFallback(): Plugin {
	let outDir = "";
	return {
		name: "spa-fallback",
		apply: "build",
		configResolved(config) {
			outDir = resolve(config.root, config.build.outDir);
		},
		closeBundle() {
			copyFileSync(resolve(outDir, "index.html"), resolve(outDir, "404.html"));
		}
	};
}

/**
 * Redirect the base path without its trailing slash to the base path, in the dev and preview servers.
 *
 * Vite answers `/ak-archive` with a "did you mean /ak-archive/" notice instead of the app, and the router writes that slash-less address when it
 * navigates home. GitHub Pages already redirects it, so this only brings the local servers in line.
 *
 * The base is read from the resolved config rather than taken as an argument, so it cannot drift from the `base` Vite is actually using.
 *
 * @returns The Vite plugin.
 */
export function baseTrailingSlash(): Plugin {
	let base = "/";
	let bare = "";
	const redirect: Connect.NextHandleFunction = (req, res, next) => {
		const url = req.url ?? "";
		const queryStart = url.indexOf("?");
		const path = queryStart === -1 ? url : url.slice(0, queryStart);
		if (bare === "" || path !== bare) {
			next();
			return;
		}
		res.statusCode = 302;
		res.setHeader("Location", `${base}${queryStart === -1 ? "" : url.slice(queryStart)}`);
		res.end();
	};
	return {
		name: "base-trailing-slash",
		configResolved(config) {
			base = config.base;
			bare = config.base.replace(/\/$/, "");
		},
		configureServer(server) {
			server.middlewares.use(redirect);
		},
		configurePreviewServer(server) {
			server.middlewares.use(redirect);
		}
	};
}
