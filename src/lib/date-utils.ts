/**
 * Formats a date string from database format (YYYY-MM-DD) to display format (DD/MM/YYYY)
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted date string in DD/MM/YYYY format or original string if invalid
 */
export const formatDateForDisplay = (dateString: string): string => {
	if (!dateString) return "Not provided";

	// Check if it's already in DD/MM/YYYY format
	if (dateString.includes("/")) {
		return dateString;
	}

	// Parse YYYY-MM-DD format
	const date = new Date(dateString);
	if (isNaN(date.getTime())) {
		return dateString; // Return original if invalid
	}

	const day = date.getDate().toString().padStart(2, "0");
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const year = date.getFullYear();

	return `${day}/${month}/${year}`;
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
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Number of days left (0 if date has passed or is invalid)
 */
export const calculateDaysLeft = (dateString: string): number => {
	if (!dateString) return 0;

	const targetDate = new Date(dateString);
	const today = new Date();

	// Reset time to start of day for accurate day calculation
	today.setHours(0, 0, 0, 0);
	targetDate.setHours(0, 0, 0, 0);

	const diffTime = targetDate.getTime() - today.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	return Math.max(0, diffDays);
};

/**
 * Formats a date string to dd-MM-yyyy format
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted date string in dd-MM-yyyy format or original string if invalid
 */
export const formatDateToDDMMYYYY = (dateString: string): string => {
	if (!dateString) return "Not provided";

	const date = new Date(dateString);
	if (isNaN(date.getTime())) {
		return dateString; // Return original if invalid
	}

	const day = date.getDate().toString().padStart(2, "0");
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const year = date.getFullYear();

	return `${day}-${month}-${year}`;
};
