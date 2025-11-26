"use client";

import { useState, useEffect } from "react";
import {
	getUserTimezone,
	setUserTimezone,
	getTimezoneOffset,
} from "@/utils/date/timezone-utils";

/**
 * Hook for managing user timezone
 * Detects timezone from browser and allows manual override
 */
export function useTimezone() {
	const [timezone, setTimezoneState] = useState<string>("UTC");
	const [offset, setOffset] = useState<number>(0);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Detect timezone on mount
		const detectedTimezone = getUserTimezone();
		setTimezoneState(detectedTimezone);

		// Calculate offset
		const timezoneOffset = getTimezoneOffset(detectedTimezone);
		setOffset(timezoneOffset);

		setIsLoading(false);
	}, []);

	/**
	 * Update user's timezone preference
	 */
	const updateTimezone = (newTimezone: string) => {
		setUserTimezone(newTimezone);
		setTimezoneState(newTimezone);

		// Recalculate offset
		const timezoneOffset = getTimezoneOffset(newTimezone);
		setOffset(timezoneOffset);
	};

	/**
	 * Reset to browser's detected timezone
	 */
	const resetToBrowserTimezone = () => {
		if (typeof window !== "undefined") {
			localStorage.removeItem("userTimezone");
			const detectedTimezone = getUserTimezone();
			updateTimezone(detectedTimezone);
		}
	};

	return {
		timezone,
		offset,
		isLoading,
		updateTimezone,
		resetToBrowserTimezone,
	};
}
