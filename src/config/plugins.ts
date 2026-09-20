// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// Vite plugins

// These are the only files in the kit that import from `vite`, and they are reachable solely through the `archive-kit/config` subpath. Keeping
// them out of the main barrel is what stops `vite` from entering an app's client bundle graph.

// This file runs in Node during a build and needs `fs` and `path`. The directive is program-wide, which is fine: it adds `process` and `Buffer`,
// not the browser globals. Never reach for `vite/client` the same way - `import.meta.env` and `import.meta.glob` staying unavailable is
// invariant 1, and `tsconfig.json` sets `"types": []` to keep it that way.
/// <reference types="node" />

import { copyFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Connect, Plugin } from "vite";

/**
 * Build the middleware that redirects a bare base path to the base path.
 *
 * @param base The resolved Vite base, which always ends in a slash.
 * @returns Connect middleware that redirects the base path without its trailing slash, and passes everything else through.
 */
function redirectToBase(base: string): Connect.NextHandleFunction {
	const bare = base.replace(/\/$/, "");
	return (req, res, next) => {
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
}

/**
 * Copy the built `index.html` to `404.html`.
 *
 * GitHub Pages has no rewrite rules, so a direct visit to a route such as `/operator/char_002_amiya` gets its 404 page. Serving the app as that
 * 404 page lets the router take over and render the route.
 *
 * The copy happens in `writeBundle` rather than GFL's `closeBundle`, and reads the output folder off the hook rather than off `__dirname`.
 * Both matter once this ships to someone else's build. `__dirname` inside an installed package points at the package, not the app. And Vite
 * calls `closeBundle` from a `finally` after a build error is rethrown, by which point `index.html` has already been cleared - so the copy threw
 * `ENOENT` and that replaced the real error, leaving every failed build reporting a missing file instead of its actual cause.
 *
 * @returns The Vite plugin.
 */
export function spaFallback(): Plugin {
	return {
		name: "spa-fallback",
		apply: "build",
		writeBundle(options, bundle) {
			// A library build, an SSR environment or a differently named entry page all reach here with no `index.html`. There is nothing to
			// fall back to in those, so this is a no-op rather than an error.
			if (options.dir === undefined || !Object.hasOwn(bundle, "index.html")) {
				return;
			}
			copyFileSync(resolve(options.dir, "index.html"), resolve(options.dir, "404.html"));
		}
	};
}

/**
 * Redirect the base path without its trailing slash to the base path, in the dev and preview servers.
 *
 * Vite answers `/ak-archive` with a "did you mean /ak-archive/" notice instead of the app, and the router writes that slash-less address when it
 * navigates home. GitHub Pages already redirects it, so this only brings the local servers in line.
 *
 * The base is read off each server's own resolved config rather than captured, so one plugin instance shared by two servers cannot serve the
 * wrong base, and a default base of `/` correctly does nothing.
 *
 * @returns The Vite plugin.
 */
export function baseTrailingSlash(): Plugin {
	return {
		name: "base-trailing-slash",
		apply: "serve",
		configureServer(server) {
			server.middlewares.use(redirectToBase(server.config.base));
		},
		configurePreviewServer(server) {
			server.middlewares.use(redirectToBase(server.config.base));
		}
	};
}
