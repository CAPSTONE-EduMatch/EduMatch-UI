// Forms
export { default as Button } from "./forms/Button";
export { FileValidationDisplay } from "../validation/FileValidationDisplay";
export { Label } from "./forms/label";

// Plan-based Components
export { ApplicationEligibilityBanner } from "./ApplicationEligibilityBanner";
export { ApplicationLimitIndicator } from "./ApplicationLimitIndicator";
export { ApplicationSuccessToast } from "./ApplicationSuccessToast";
export { PlanAwareApplicationButton } from "./PlanAwareApplicationButton";
export { PlanUpgradeModal } from "./PlanUpgradeModal";
export { SubscriptionProgressWidget } from "./SubscriptionProgressWidget";

// Alert Components
export { Alert, AlertDescription, AlertTitle } from "./alert";

// Inputs
export { Checkbox } from "./inputs/checkbox";
export { default as CheckboxSelect } from "./inputs/checkbox-select";
export { default as CustomSelect } from "./inputs/custom-select";
export { default as DateInput } from "./inputs/DateInput";
export { default as Input } from "./inputs/Input";
export { default as OTPInput } from "./inputs/OTPInput";
export { PhoneInput } from "./inputs/phone-input";
export { default as RichTextEditor } from "./inputs/RichTextEditor";
export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "./inputs/select";

// Cards
export { AIAssistantCard } from "./cards/AIAssistantCard";
export { Avatar, AvatarFallback, AvatarImage } from "./cards/avatar";
export { Badge, badgeVariants } from "./cards/badge";
export {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./cards/card";
export { ProgramCard } from "./cards/ProgramCard";
export { ResearchLabCard } from "./cards/ResearchLabCard";
export { ScholarshipCard } from "./cards/ScholarshipCard";

// Modals
export { default as ErrorModal } from "./modals/ErrorModal";
export { default as Modal } from "./modals/Modal";
export { default as SuccessModal } from "./modals/SuccessModal";
export { SimpleWarningModal as WarningModal } from "./modals/WarningModal";

// Navigation
export { Breadcrumb } from "./navigation/Breadcrumb";
export { Pagination } from "./navigation/Pagination";
export { SearchBar } from "./navigation/SearchBar";
export { SortDropdown } from "./navigation/Sort";
export type { SortOption } from "./navigation/Sort";
export { TabSelector } from "./navigation/TabSelector";

// Layout
export { default as FileUploadManager } from "./layout/file-upload-manager";
export { FilterSidebar } from "./layout/FilterSidebar";
export { Folder } from "./layout/folder";
export { default as FileUploadManagerWithOCR } from "./layout/file-upload-manager-with-ocr";
export { ImageManager } from "./layout/image-manager";

// Feedback
export { default as LoadingSpinner } from "./feedback/LoadingSpinner";
export { default as ResendCodeButton } from "./feedback/ResendCodeButton";
export { Tooltip } from "./feedback/tooltip";

// OCR
export { default as OCRResultsDisplayArea } from "../ocr/OCRResultsDisplayArea";
export type { OCRResult } from "../ocr/OCRResultsDisplayArea";
