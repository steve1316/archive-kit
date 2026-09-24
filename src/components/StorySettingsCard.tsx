import { useEffect, useRef } from "react";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";

import { Box, IconButton, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { useCloseOnEscape } from "../hooks/useArtViewer.js";

/** The card: a small dark panel over the player, placed by the site's `sx`. It scrolls rather than running off a short player. */
const CARD_SX = {
	position: "absolute",
	zIndex: 30,
	width: 280,
	maxWidth: "calc(100vw - 32px)",
	maxHeight: "min(440px, 85vh)",
	overflowY: "auto",
	p: "6px 14px 14px",
	background: "rgba(12, 14, 19, 0.97)",
	border: "1px solid rgba(255, 255, 255, 0.18)",
	borderRadius: 1,
	boxShadow: 8,
	color: "#eef0f4",
	textAlign: "left",
	cursor: "default"
} satisfies SxProps<Theme>;

/** The title row: "Settings" and the close button. */
const TITLE_ROW_SX = { display: "flex", alignItems: "center", gap: 1, mb: 0.5 } satisfies SxProps<Theme>;

/** The title, which takes the row's spare width. */
const TITLE_SX = { flex: 1 } satisfies SxProps<Theme>;

/** Props for StorySettingsCard. */
export interface StorySettingsCardProps {
	/** Whether the card is open. */
	open: boolean;
	/** Called to close it: by Escape, the close button or a press outside it. */
	onClose: () => void;
	/** Where the card sits, such as `{ top: "100%", left: 0 }`. It is placed against its nearest positioned ancestor. */
	sx?: SxProps<Theme>;
	/** The card's content, usually a `StorySettingsPanel`. */
	children: ReactNode;
}

/**
 * Keep a click inside the card from reaching the player under it, which would read on.
 *
 * @param event The click.
 */
function stopClick(event: ReactMouseEvent) {
	event.stopPropagation();
}

/**
 * The open card. It holds the listeners, so they exist only while the card shows.
 *
 * @param props Component props.
 * @returns The card.
 */
function OpenCard({ onClose, sx, children }: Omit<StorySettingsCardProps, "open">) {
	const card = useRef<HTMLDivElement>(null);
	// Read through a ref, so a new `onClose` on a re-render does not reset a press that is still going on.
	const close = useRef(onClose);
	useEffect(() => {
		close.current = onClose;
	}, [onClose]);

	// Taken before the page's own keys, so closing the card does not also run a page shortcut bound to Escape.
	useCloseOnEscape(onClose, true);

	// A click outside is spent here, the way a menu's is, so it never also reads on. It closes the card, unless the press began inside, such as
	// a slider drag released outside, which leaves the card open.
	useEffect(() => {
		let pressedInside = false;
		const inside = (target: EventTarget | null) => target instanceof Node && card.current?.contains(target) === true;
		const onDown = (event: PointerEvent) => {
			pressedInside = inside(event.target);
		};
		const onClick = (event: MouseEvent) => {
			const began = pressedInside;
			pressedInside = false;
			if (inside(event.target)) {
				return;
			}
			event.stopPropagation();
			event.preventDefault();
			if (!began) {
				close.current();
			}
		};
		window.addEventListener("pointerdown", onDown, true);
		window.addEventListener("click", onClick, true);
		return () => {
			window.removeEventListener("pointerdown", onDown, true);
			window.removeEventListener("click", onClick, true);
		};
	}, []);

	return (
		<Box ref={card} sx={[CARD_SX, ...(Array.isArray(sx) ? sx : [sx ?? false])]} onClick={stopClick} role="dialog" aria-label="Settings">
			<Box sx={TITLE_ROW_SX}>
				<Typography component="h2" variant="subtitle1" sx={TITLE_SX}>
					Settings
				</Typography>
				<IconButton aria-label="Close the settings" onClick={onClose} size="small">
					<CloseIcon fontSize="small" />
				</IconButton>
			</Box>
			{children}
		</Box>
	);
}

/**
 * A small Settings card for a desktop story player, usually holding a `StorySettingsPanel`. It is drawn where it sits rather than portalled,
 * so it still shows when the player is fullscreen. Escape, the close button or a press outside it closes it.
 *
 * @param props Component props.
 * @returns The card, or nothing while it is closed.
 */
function StorySettingsCard({ open, ...rest }: StorySettingsCardProps) {
	return open ? <OpenCard {...rest} /> : null;
}

export default StorySettingsCard;
