export { ProgressBar } from "./create/steps/ProgressBar";
export { BasicInfoStep } from "./create/steps/BasicInfoStep";
export { RoleSelectionStep } from "./create/steps/RoleSelectionStep";
export { AcademicInfoStep } from "./create/steps/AcademicInfoStep";
export { InstitutionInfoStep } from "./create/steps/InstitutionInfoStep";
export { InstitutionDetailsStep } from "./create/steps/InstitutionDetailsStep";
export { CompletionStep } from "./create/steps/CompletionStep";

// Profile View Layout Components
export { ProfileLayoutBase } from "./layout/ProfileLayoutBase";
export type { NavItem, ProfileSection } from "./layout/ProfileLayoutBase";

export {
	InstitutionProfileLayout,
	type InstitutionProfileSection,
} from "./layout/InstitutionProfileLayout";

export {
	ApplicantProfileLayout,
	type ApplicantProfileSection,
} from "./applicant/sections/ApplicantProfileLayout";

// Profile View Section Components
export { ProfileInfoSection } from "./applicant/sections/ProfileInfoSection";
export { AcademicSection } from "./applicant/sections/AcademicSection";
export { WishlistSection } from "./applicant/sections/WishlistSection";
export { ApplicationSection } from "./applicant/sections/ApplicationSection";
export { PaymentSection } from "./applicant/sections/PaymentSection";
export { SettingsSection } from "./applicant/sections/SettingsSection";
