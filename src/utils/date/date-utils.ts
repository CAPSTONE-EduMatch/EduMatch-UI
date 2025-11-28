import {
	formatUTCDateToLocal,
	getDateInTimezone,
	getUserTimezone,
} from "./timezone-utils";

/**
 * Formats a date string from database format (YYYY-MM-DD) to display format (DD/MM/YYYY)
 * Now timezone-aware: converts UTC dates to user's local timezone
 * @param dateString - Date string in YYYY-MM-DD or ISO format (UTC)
 * @returns Formatted date string in DD/MM/YYYY format or original string if invalid
 */
export const formatDateForDisplay = (dateString: string): string => {
	if (!dateString) return "Not provided";

	// Check if it's already in DD/MM/YYYY format
	if (dateString.includes("/")) {
		return dateString;
	}

	try {
		// Parse date (assumes UTC from database)
		const date = new Date(dateString);
		if (isNaN(date.getTime())) {
			return dateString; // Return original if invalid
		}

		// Use timezone-aware formatting
		return formatUTCDateToLocal(date);
	} catch (error) {
		// Fallback to original behavior if timezone utils not available
		const date = new Date(dateString);
		if (isNaN(date.getTime())) {
			return dateString;
		}

		const day = date.getDate().toString().padStart(2, "0");
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const year = date.getFullYear();

		return `${day}/${month}/${year}`;
	}
};

/**
 * Converts a date string from DD/MM/YYYY format to YYYY-MM-DD format for database storage
 * @param dateString - Date string in DD/MM/YYYY format
 * @returns Date string in YYYY-MM-DD format or empty string if invalid
 */
export const formatDateForDatabase = (dateString: string): string => {
	if (!dateString) return "";

	// Check if it's already in YYYY-MM-DD format
	if (dateString.includes("-") && !dateString.includes("/")) {
		return dateString;
	}

	// Parse DD/MM/YYYY format
	const parts = dateString.split("/");
	if (parts.length !== 3) return "";

	const day = parts[0];
	const month = parts[1];
	const year = parts[2];

	// Validate the parts
	if (day.length !== 2 || month.length !== 2 || year.length !== 4) {
		return "";
	}

	return `${year}-${month}-${day}`;
};

/**
 * Calculates the number of days remaining from today to a target date
 * Now timezone-aware: uses user's local timezone for accurate day calculation
 * @param dateString - Date string in YYYY-MM-DD or ISO format (UTC)
 * @returns Number of days left (0 if date has passed or is invalid)
 */
export const calculateDaysLeft = (dateString: string): number => {
	if (!dateString) return 0;

	try {
		// Parse UTC date from database
		const utcDate = new Date(dateString);
		if (isNaN(utcDate.getTime())) {
			return 0;
		}

		// Get date components in user's local timezone for accurate day calculation
		const timezone = getUserTimezone();
		const targetDateComponents = getDateInTimezone(utcDate, timezone);
		const todayComponents = getDateInTimezone(new Date(), timezone);

		// Create date objects for comparison (using local timezone components)
		// These represent the same moment but allow us to compare days correctly
		const targetDate = new Date(
			targetDateComponents.year,
			targetDateComponents.month - 1,
			targetDateComponents.day,
			0,
			0,
			0
		);
		const today = new Date(
			todayComponents.year,
			todayComponents.month - 1,
			todayComponents.day,
			0,
			0,
			0
		);

		const diffTime = targetDate.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		return Math.max(0, diffDays);
	} catch (error) {
		// Fallback to original behavior
		const targetDate = new Date(dateString);
		const today = new Date();

		if (isNaN(targetDate.getTime())) {
			return 0;
		}

		today.setHours(0, 0, 0, 0);
		targetDate.setHours(0, 0, 0, 0);

		const diffTime = targetDate.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		return Math.max(0, diffDays);
	}
};

/**
 * Formats a date string to dd-MM-yyyy format
 * Now timezone-aware: converts UTC dates to user's local timezone
 * @param dateString - Date string in YYYY-MM-DD or ISO format (UTC)
 * @returns Formatted date string in dd-MM-yyyy format or original string if invalid
 */
export const formatDateToDDMMYYYY = (dateString: string): string => {
	if (!dateString) return "Not provided";

	try {
		// Parse date (assumes UTC from database)
		const date = new Date(dateString);
		if (isNaN(date.getTime())) {
			return dateString; // Return original if invalid
		}

		// Use timezone-aware formatting - get date components in user's timezone
		const timezone = getUserTimezone();
		const dateComponents = getDateInTimezone(date, timezone);

		const day = dateComponents.day.toString().padStart(2, "0");
		const month = dateComponents.month.toString().padStart(2, "0");
		const year = dateComponents.year;

		return `${day}-${month}-${year}`;
	} catch (error) {
		// Fallback to original behavior if timezone utils fail
		const date = new Date(dateString);
		if (isNaN(date.getTime())) {
			return dateString;
		}

		const day = date.getDate().toString().padStart(2, "0");
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const year = date.getFullYear();

		return `${day}-${month}-${year}`;
	}
};
