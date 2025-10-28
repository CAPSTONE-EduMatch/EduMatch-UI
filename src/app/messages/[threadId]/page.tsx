'use client'

import { MessageDialog } from '@/components/message/MessageDialog'
import { AuthWrapper } from '@/components/auth/AuthWrapper'
import { useUserProfile } from '@/hooks/useUserProfile'
import { EduMatchHeader } from '@/components/layout/header'
interface MessagesThreadPageProps {
	params: {
		threadId: string
	}
}

export default function MessagesThreadPage({
	params,
}: MessagesThreadPageProps) {
	const { profile, isLoading: profileLoading } = useUserProfile()

	// Determine layout based on user role
	const isInstitution = profile?.role === 'institution'
	const isApplicant = profile?.role === 'applicant'

	// Different layouts for different user types
	if (isInstitution) {
		// Institution layout - no header/footer, full screen
		return (
			<AuthWrapper
				pageTitle="Messages"
				pageDescription="Please sign in to view your messages"
			>
				<div className="min-h-screen bg-gray-50">
					<div className="h-screen">
						<MessageDialog threadId={params.threadId} />
					</div>
				</div>
			</AuthWrapper>
		)
	}

	if (isApplicant) {
		// Applicant layout - with header, no footer
		return (
			<AuthWrapper
				pageTitle="Messages"
				pageDescription="Please sign in to view your messages"
			>
				<div className="min-h-screen bg-gray-50 pt-20">
					<div className="h-[calc(100vh-5rem)]">
						<MessageDialog threadId={params.threadId} />
					</div>
				</div>
			</AuthWrapper>
		)
	}

	// Loading state
	if (profileLoading) {
		return (
			<AuthWrapper
				pageTitle="Messages"
				pageDescription="Please sign in to view your messages"
			>
				<div className="min-h-screen bg-gray-50 flex items-center justify-center">
					<div className="text-center">
						<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
						<p className="mt-4 text-muted-foreground">Loading messages...</p>
					</div>
				</div>
			</AuthWrapper>
		)
	}

	// Default layout for unknown roles
	return (
		<AuthWrapper
			pageTitle="Messages"
			pageDescription="Please sign in to view your messages"
		>
			<EduMatchHeader />
			<div className="h-screen pt-24">
				<MessageDialog threadId={params.threadId} />
			</div>
		</AuthWrapper>
	)
}
