// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// Build-time entry point

// Reached as `archive-kit/config`, separately from the main barrel. Everything here runs in Node during a build, never in a browser, which is
// why it is a second entry point rather than part of `archive-kit` itself.

export { baseTrailingSlash, routePages, spaFallback } from "./plugins.js";
