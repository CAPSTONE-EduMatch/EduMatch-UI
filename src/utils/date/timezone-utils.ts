/**
 * Timezone-aware date utilities
 *
 * Architecture:
 * - All dates in database are stored in UTC (PostgreSQL Timestamptz)
 * - Dates are converted to user's local timezone for display
 * - User timezone is detected from browser or can be set manually
 */

/**
 * Get user's timezone from browser
 * @returns IANA timezone string (e.g., "America/New_York", "Asia/Ho_Chi_Minh")
 */
export const getUserTimezone = (): string => {
	if (typeof window === "undefined") {
		// Server-side: default to UTC
		return "UTC";
	}

	// Try to get from localStorage first (user preference)
	const storedTimezone = localStorage.getItem("userTimezone");
	if (storedTimezone) {
		return storedTimezone;
	}

	// Fallback to browser's timezone
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone;
	} catch (error) {
		// Fallback to UTC if timezone detection fails
		return "UTC";
	}
};

/**
 * Set user's preferred timezone
 * @param timezone - IANA timezone string
 */
export const setUserTimezone = (timezone: string): void => {
	if (typeof window !== "undefined") {
		localStorage.setItem("userTimezone", timezone);
	}
};

/**
 * Get date components in a specific timezone
 * Useful for date comparisons where you need to compare dates in the same timezone
 * @param utcDate - UTC date string (ISO format) or Date object
 * @param timezone - Optional timezone override (defaults to user's timezone)
 * @returns Object with date components in the target timezone
 */
export const getDateInTimezone = (
	utcDate: string | Date,
	timezone?: string
): {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
	second: number;
} => {
	if (!utcDate) {
		throw new Error("Date is required");
	}

	const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;

	if (isNaN(date.getTime())) {
		throw new Error("Invalid date");
	}

	// If timezone is provided, use it; otherwise use user's timezone
	const targetTimezone = timezone || getUserTimezone();

	// Create a formatter for the target timezone
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: targetTimezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});

	// Format the UTC date in the target timezone
	const parts = formatter.formatToParts(date);

	return {
		year: parseInt(parts.find((p) => p.type === "year")?.value || "0"),
		month: parseInt(parts.find((p) => p.type === "month")?.value || "1"),
		day: parseInt(parts.find((p) => p.type === "day")?.value || "1"),
		hour: parseInt(parts.find((p) => p.type === "hour")?.value || "0"),
		minute: parseInt(parts.find((p) => p.type === "minute")?.value || "0"),
		second: parseInt(parts.find((p) => p.type === "second")?.value || "0"),
	};
};

/**
 * Convert UTC date to a Date object representing the same moment in target timezone
 * Note: JavaScript Date objects are always UTC internally. This creates a Date that,
 * when formatted in the target timezone, shows the correct local time.
 * @param utcDate - UTC date string (ISO format) or Date object
 * @param timezone - Optional timezone override (defaults to user's timezone)
 * @returns Date object (for use in comparisons - formatting handles timezone display)
 */
export const utcToLocal = (utcDate: string | Date, timezone?: string): Date => {
	if (!utcDate) {
		throw new Error("Date is required");
	}

	const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;

	if (isNaN(date.getTime())) {
		throw new Error("Invalid date");
	}

	// JavaScript Date objects are always UTC internally
	// The timezone conversion happens during formatting
	// For date comparisons, we can use getDateInTimezone to get components
	return date;
};

/**
 * Convert local date to UTC for database storage
 * @param localDate - Date in user's local timezone
 * @returns Date object in UTC
 */
export const localToUTC = (localDate: Date | string): Date => {
	if (!localDate) {
		throw new Error("Date is required");
	}

	const date =
		typeof localDate === "string" ? new Date(localDate) : localDate;

	if (isNaN(date.getTime())) {
		throw new Error("Invalid date");
	}

	// Return UTC date (JavaScript Date objects are always in UTC internally)
	return new Date(date.toISOString());
};

/**
 * Format UTC date to user's local timezone with custom format
 * @param utcDate - UTC date string (ISO format) or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @param timezone - Optional timezone override
 * @returns Formatted date string
 */
export const formatUTCDate = (
	utcDate: string | Date,
	options: Intl.DateTimeFormatOptions = {},
	timezone?: string
): string => {
	if (!utcDate) return "";

	try {
		const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;

		if (isNaN(date.getTime())) {
			return "Invalid date";
		}

		const targetTimezone = timezone || getUserTimezone();

		return new Intl.DateTimeFormat("en-US", {
			...options,
			timeZone: targetTimezone,
		}).format(date);
	} catch (error) {
		return "Invalid date";
	}
};

/**
 * Format UTC date to user's local date string (DD/MM/YYYY)
 * @param utcDate - UTC date string (ISO format) or Date object
 * @param timezone - Optional timezone override
 * @returns Formatted date string in DD/MM/YYYY format
 */
export const formatUTCDateToLocal = (
	utcDate: string | Date,
	timezone?: string
): string => {
	return formatUTCDate(
		utcDate,
		{
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		},
		timezone
	);
};

/**
 * Format UTC date to user's local time string (HH:MM)
 * @param utcDate - UTC date string (ISO format) or Date object
 * @param timezone - Optional timezone override
 * @returns Formatted time string in HH:MM format
 */
export const formatUTCTimeToLocal = (
	utcDate: string | Date,
	timezone?: string
): string => {
	return formatUTCDate(
		utcDate,
		{
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		},
		timezone
	);
};

/**
 * Format UTC date to user's local date and time string
 * @param utcDate - UTC date string (ISO format) or Date object
 * @param timezone - Optional timezone override
 * @returns Formatted date and time string
 */
export const formatUTCDateTimeToLocal = (
	utcDate: string | Date,
	timezone?: string
): string => {
	return formatUTCDate(
		utcDate,
		{
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		},
		timezone
	);
};

/**
 * Format UTC date to relative time (e.g., "2 hours ago", "3 days ago")
 * @param utcDate - UTC date string (ISO format) or Date object
 * @param timezone - Optional timezone override
 * @returns Relative time string
 */
export const formatUTCRelativeTime = (
	utcDate: string | Date,
	timezone?: string
): string => {
	if (!utcDate) return "Unknown time";

	try {
		const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;

		if (isNaN(date.getTime())) {
			return "Invalid date";
		}

		const targetTimezone = timezone || getUserTimezone();
		const now = new Date();

		// Convert both dates to target timezone for accurate comparison
		const localDate = utcToLocal(date, targetTimezone);
		const localNow = utcToLocal(now, targetTimezone);

		const diffInSeconds = Math.floor(
			(localNow.getTime() - localDate.getTime()) / 1000
		);
		const diffInMinutes = Math.floor(diffInSeconds / 60);
		const diffInHours = Math.floor(diffInMinutes / 60);
		const diffInDays = Math.floor(diffInHours / 24);

		if (diffInSeconds < 60) {
			return "Just now";
		} else if (diffInMinutes < 60) {
			return `${diffInMinutes}m ago`;
		} else if (diffInHours < 24) {
			return `${diffInHours}h ago`;
		} else if (diffInDays < 7) {
			return `${diffInDays}d ago`;
		} else {
			// For older dates, show formatted date
			return formatUTCDateToLocal(date, targetTimezone);
		}
	} catch (error) {
		return "Invalid date";
	}
};

/**
 * Ensure date is stored as UTC in database
 * Converts any date input to UTC ISO string
 * @param date - Date in any format
 * @returns ISO string in UTC
 */
export const ensureUTC = (
	date: Date | string | null | undefined
): string | null => {
	if (!date) return null;

	try {
		const dateObj = typeof date === "string" ? new Date(date) : date;

		if (isNaN(dateObj.getTime())) {
			throw new Error("Invalid date");
		}

		// Return ISO string (always in UTC)
		return dateObj.toISOString();
	} catch (error) {
		return null;
	}
};

/**
 * Get timezone offset in minutes for a given timezone
 * @param timezone - IANA timezone string
 * @param date - Optional date to check offset for (defaults to now)
 * @returns Offset in minutes from UTC
 */
export const getTimezoneOffset = (
	timezone: string = getUserTimezone(),
	date: Date = new Date()
): number => {
	try {
		const utcDate = new Date(
			date.toLocaleString("en-US", { timeZone: "UTC" })
		);
		const tzDate = new Date(
			date.toLocaleString("en-US", { timeZone: timezone })
		);
		return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
	} catch (error) {
		return 0;
	}
};
