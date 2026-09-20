import { memo } from "react";

import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

import { CARD_ASPECT, PLACEHOLDER_SX } from "../lib/artLayout.js";

/** Props for ArtPlaceholder. */
interface ArtPlaceholderProps {
	/** The subject's name, used in the accessible label. */
	name: string;
	/** The box's shape, as a CSS `aspect-ratio`. Defaults to the tall card shape GFL's art uses, so a game with a different one passes its own. */
	aspect?: string;
	/** Styles laid over everything else. */
	sx?: SxProps<Theme>;
}

/**
 * A card-art-shaped box shown in place of art that is not hosted yet, reshaped through `aspect` where the art is not card-shaped.
 *
 * @param props Component props.
 * @returns The placeholder box.
 */
export default memo(function ArtPlaceholder({ name, aspect = CARD_ASPECT, sx }: ArtPlaceholderProps) {
	return (
		<Box sx={[PLACEHOLDER_SX, { aspectRatio: aspect }, ...(sx === undefined ? [] : Array.isArray(sx) ? sx : [sx])]} role="img" aria-label={`${name} - art not available yet`}>
			<Typography sx={{ fontSize: "0.75rem", color: "text.secondary", px: 1, textAlign: "center" }}>Art not available yet</Typography>
		</Box>
	);
});
