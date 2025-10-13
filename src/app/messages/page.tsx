import { MessageDialog } from '@/components/message/MessageDialog'

export default function MessagesPage() {
	return (
		<div className="min-h-screen bg-gray-50 pt-20">
			<div className="h-[calc(100vh-5rem)]">
				<MessageDialog />
			</div>
		</div>
	)
}
