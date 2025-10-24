import { ProfileWrapper } from '@/components/auth/ProfileWrapper'

export default function InstitutionLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<ProfileWrapper
			pageTitle="Profile Required"
			pageDescription="Please create your profile to access institution features"
			redirectTo="/profile/create"
		>
			{children}
		</ProfileWrapper>
	)
}
