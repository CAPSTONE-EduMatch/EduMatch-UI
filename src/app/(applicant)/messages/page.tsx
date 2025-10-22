import { MessageDialog } from '@/components/message/MessageDialog'
import { AuthWrapper } from '@/components/auth/AuthWrapper'

export default function MessagesPage() {
	return (
		<AuthWrapper
			pageTitle="Messages"
			pageDescription="Please sign in to view your messages"
		>
			<div className="min-h-screen bg-gray-50 pt-20">
				<div className="h-[calc(100vh-5rem)]">
					<MessageDialog />
				</div>
			</div>
		</AuthWrapper>
	)
}
