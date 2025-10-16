import { useState, useCallback } from "react";

interface UseSimpleWarningOptions {
	hasUnsavedChanges: boolean;
	onSave?: () => Promise<void> | void;
	onCancel?: () => void;
}

export const useSimpleWarning = ({
	hasUnsavedChanges,
	onSave,
	onCancel,
}: UseSimpleWarningOptions) => {
	const [showWarningModal, setShowWarningModal] = useState(false);
	const [pendingNavigation, setPendingNavigation] = useState<string | null>(
		null
	);
	const [isSaving, setIsSaving] = useState(false);

	const handleNavigationAttempt = useCallback(
		(targetSection: string) => {
			console.log(
				"useSimpleWarning - Navigation attempt to:",
				targetSection
			);
			console.log(
				"useSimpleWarning - Has unsaved changes:",
				hasUnsavedChanges
			);
			if (hasUnsavedChanges) {
				console.log("useSimpleWarning - Showing warning modal");
				setPendingNavigation(targetSection);
				setShowWarningModal(true);
				return false; // Prevent navigation
			}
			console.log("useSimpleWarning - Allowing navigation");
			return true; // Allow navigation
		},
		[hasUnsavedChanges]
	);

	const handleSaveAndContinue = async () => {
		if (onSave) {
			setIsSaving(true);
			try {
				await onSave();
				setShowWarningModal(false);
				// Trigger the pending navigation
				if (pendingNavigation) {
					// This will be handled by the parent component
					window.dispatchEvent(
						new CustomEvent("navigateToSection", {
							detail: { section: pendingNavigation },
						})
					);
				}
			} catch (error) {
				console.error("Save failed:", error);
			} finally {
				setIsSaving(false);
			}
		}
	};

	const handleDiscardChanges = () => {
		if (onCancel) {
			onCancel();
		}
		setShowWarningModal(false);
		// Trigger the pending navigation
		if (pendingNavigation) {
			window.dispatchEvent(
				new CustomEvent("navigateToSection", {
					detail: { section: pendingNavigation },
				})
			);
		}
	};

	const handleCancelNavigation = () => {
		setShowWarningModal(false);
		setPendingNavigation(null);
	};

	// Function to manually show the warning modal (for cancel button)
	const showWarning = () => {
		setShowWarningModal(true);
	};

	// Debug modal state
	console.log("useSimpleWarning - Modal state:", {
		showWarningModal,
		hasUnsavedChanges,
		isSaving,
	});

	return {
		showWarningModal,
		handleNavigationAttempt,
		handleSaveAndContinue,
		handleDiscardChanges,
		handleCancelNavigation,
		showWarning,
		isSaving,
	};
};
