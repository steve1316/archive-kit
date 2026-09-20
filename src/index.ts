// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// Public API

// The single entry point consumers import from. The `exports` map exposes only this file, so nothing reaches an app by a deep import.

// Imported for its `declare module` alone, which is what puts the kit's extra palette slots on MUI's `Palette` for a consumer. A side-effect
// import survives declaration emit and cannot be tidied away by a later refactor, which a lone type re-export can.
import "./theme/augmentation.js";

// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// Components

export { default as ArtPlaceholder } from "./components/ArtPlaceholder.js";
export { default as ArtZoomControls } from "./components/ArtZoomControls.js";
export { default as ErrorBoundary } from "./components/ErrorBoundary.js";
export { default as FilterChip } from "./components/FilterChip.js";
export { default as FilterPanel } from "./components/FilterPanel.js";
export { default as HighlightedName } from "./components/HighlightedName.js";
export { default as IndexSummaryBar } from "./components/IndexSummaryBar.js";
export { default as LazySection } from "./components/LazySection.js";
export { default as LevelSlider } from "./components/LevelSlider.js";
export { default as LoadError } from "./components/LoadError.js";
export { default as PageBackdrop } from "./components/PageBackdrop.js";
export { default as RankBar } from "./components/RankBar.js";
export { default as ScrollToTop } from "./components/ScrollToTop.js";
export { default as ScrollToTopOnNavigate } from "./components/ScrollToTopOnNavigate.js";
export { default as StarRankPicker } from "./components/StarRankPicker.js";

// `FilterRows` ships three named parts rather than a default, since a filter panel composes them.
export { ChipRow, ChipRowDivider, RarityChipRow } from "./components/FilterRows.js";
export type { RarityFilterEntry, SimpleFilterEntry } from "./components/FilterRows.js";

export type { ActiveFilter, SortOption } from "./components/IndexSummaryBar.js";

// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// Theme

export type { DomainColours } from "./theme/augmentation.js";

// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// Hooks

export { useArtPanBounds, useCloseOnEscape } from "./hooks/useArtViewer.js";
export { useZoomPan } from "./hooks/useZoomPan.js";
export type { UseZoomPanOptions, UseZoomPanResult, ZoomPanTransform } from "./hooks/useZoomPan.js";
