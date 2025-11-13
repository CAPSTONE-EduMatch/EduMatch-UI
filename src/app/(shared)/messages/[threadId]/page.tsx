'use client'

import { MessageDialog } from '@/components/message/MessageDialog'
import { AuthWrapper } from '@/components/auth/AuthWrapper'
import { useUserProfile } from '@/hooks/profile/useUserProfile'
import { EduMatchHeader } from '@/components/layout/header'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface MessagesThreadPageProps {
	params: {
		threadId: string
	}
}

export default function MessagesThreadPage({
	params,
}: MessagesThreadPageProps) {
	const { profile, isLoading: profileLoading } = useUserProfile()
	const router = useRouter()

	// Determine layout based on user role
	const isInstitution = profile?.role === 'institution'
	const isApplicant = profile?.role === 'applicant'

	// Redirect institutions to their own messages route inside dashboard
	// This ensures they get the sidebar, ProfileProvider, and full profile data
	useEffect(() => {
		if (isInstitution) {
			router.replace(`/institution/dashboard/messages/${params.threadId}`)
		}
	}, [isInstitution, router, params.threadId])

	// Different layouts for different user types
	if (isInstitution) {
		return null // Will redirect via useEffect
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
