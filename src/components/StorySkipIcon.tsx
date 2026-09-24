import { createSvgIcon } from "@mui/material/utils";

/**
 * Skip to the next choice: the fast-forward arrows with a bar at their tip, like a media player's skip-to-next button. Shared, so every archive's
 * reader shows the same control.
 */
const StorySkipIcon = createSvgIcon(<path d="M2 18l7.5-6L2 6zm8 0 7.5-6L10 6zm8.5-12h2v12h-2z" />, "StorySkip");

export default StorySkipIcon;
