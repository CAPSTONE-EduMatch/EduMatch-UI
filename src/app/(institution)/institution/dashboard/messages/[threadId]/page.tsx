'use client'

import { MessageDialog } from '@/components/message/MessageDialog'
import { useProfileContext } from '../../ProfileContext'

interface MessagesThreadPageProps {
	params: {
		threadId: string
	}
}

export default function InstitutionMessagesThreadPage({
	params,
}: MessagesThreadPageProps) {
	const { profile } = useProfileContext()

	return (
		<div className="h-screen">
			<MessageDialog threadId={params.threadId} />
		</div>
	)
}
