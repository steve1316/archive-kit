import React from "react";
import type { ErrorInfo, ReactNode } from "react";

/** Props for ErrorBoundary. */
interface ErrorBoundaryProps {
	/** The subtree to guard. */
	children: ReactNode;
	/** Shown in place of `children` once a descendant has thrown. Nothing is rendered when it is left out, since wording and routes are the app's. */
	fallback?: ReactNode;
}

/** State for ErrorBoundary. */
interface ErrorBoundaryState {
	/** Whether a descendant has thrown. */
	hasError: boolean;
	/** The error that was caught, kept for logging. */
	error: Error | null;
}

/**
 * Catches a throw from anywhere in a subtree, most often a reader landing on a detail page whose id does not exist.
 *
 * The kit has no opinion on what to show instead. Each archive words its own message and links to its own index, so the replacement arrives as
 * `fallback` rather than being written here.
 */
export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	state: ErrorBoundaryState = { hasError: false, error: null };

	/**
	 * Move the component into its error state.
	 *
	 * @param error The error a descendant threw.
	 * @returns The next state.
	 */
	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	/**
	 * Log what was caught.
	 *
	 * @param error The error a descendant threw.
	 * @param errorInfo React's component stack for the error.
	 */
	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.log("ErrorBoundary - error: ", error);
		console.log("ErrorBoundary - error info: ", errorInfo);
	}

	/**
	 * @returns The fallback when a descendant threw, otherwise the children.
	 */
	render() {
		if (this.state.hasError) {
			return this.props.fallback ?? null;
		}

		return this.props.children;
	}
}
