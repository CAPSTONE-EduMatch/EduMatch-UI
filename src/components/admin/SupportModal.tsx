'use client'

import Modal from '@/components/ui/modals/Modal'
import { motion } from 'framer-motion'
import { Calendar, Mail, MessageSquare, Phone, Send, User } from 'lucide-react'
import { useState } from 'react'

interface SupportRequest {
	id: string
	name: string
	email: string
	contact: string
	sendDate: string
	status: 'Replied' | 'Pending'
	subject?: string
	message?: string
}

interface SupportModalProps {
	isOpen: boolean
	onClose: () => void
	request: SupportRequest | null
	mode: 'view' | 'reply'
	// eslint-disable-next-line no-unused-vars
	onSendReply: (replyMessage: string) => void
}

const SupportModal = ({
	isOpen,
	onClose,
	request,
	mode,
	onSendReply,
}: SupportModalProps) => {
	const [replyMessage, setReplyMessage] = useState('')
	const [isSending, setIsSending] = useState(false)

	if (!request) return null

	const handleSendReply = async () => {
		if (!replyMessage.trim()) return

		setIsSending(true)
		try {
			await onSendReply(replyMessage)
			setReplyMessage('')
		} catch (error) {
			// Handle error silently for now
		} finally {
			setIsSending(false)
		}
	}

	const handleClose = () => {
		setReplyMessage('')
		onClose()
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title={
				mode === 'view' ? 'Support Request Details' : 'Reply to Support Request'
			}
			maxWidth="lg"
		>
			<div className="space-y-4">
				{/* Request Information */}
				<div className="bg-gray-50 rounded-xl p-4">
					<h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
						<User className="w-4 h-4 text-[#126E64]" />
						Request Information
					</h3>

					<div className="grid grid-cols-2 gap-3">
						<div className="flex items-center gap-2">
							<User className="w-3 h-3 text-gray-500" />
							<div>
								<p className="text-xs text-gray-500">Name</p>
								<p className="text-sm font-medium text-gray-900">
									{request.name}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-2">
							<Mail className="w-3 h-3 text-gray-500" />
							<div>
								<p className="text-xs text-gray-500">Email</p>
								<p className="text-sm font-medium text-gray-900">
									{request.email}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-2">
							<Phone className="w-3 h-3 text-gray-500" />
							<div>
								<p className="text-xs text-gray-500">Contact</p>
								<p className="text-sm font-medium text-gray-900">
									{request.contact}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-2">
							<Calendar className="w-3 h-3 text-gray-500" />
							<div>
								<p className="text-xs text-gray-500">Send Date</p>
								<p className="text-sm font-medium text-gray-900">
									{request.sendDate}
								</p>
							</div>
						</div>
					</div>

					<div className="mt-3 pt-3 border-t border-gray-200">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium text-gray-700">Status</span>
							<span
								className={`px-2 py-1 rounded-full text-xs font-medium ${
									request.status === 'Replied'
										? 'bg-[#126E64] text-white'
										: 'bg-orange-500 text-white'
								}`}
							>
								{request.status}
							</span>
						</div>
					</div>
				</div>

				{/* Original Message */}
				<div className="space-y-2">
					<h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
						<MessageSquare className="w-4 h-4 text-[#126E64]" />
						Original Message
					</h3>

					{request.subject && (
						<div className="bg-white border border-gray-200 rounded-lg p-3">
							<p className="text-xs font-medium text-gray-700 mb-1">Subject:</p>
							<p className="text-sm text-gray-900">{request.subject}</p>
						</div>
					)}

					<div className="bg-white border border-gray-200 rounded-lg p-3">
						<p className="text-xs font-medium text-gray-700 mb-1">Message:</p>
						<p className="text-sm text-gray-900 leading-relaxed">
							{request.message || 'No message content available.'}
						</p>
					</div>
				</div>

				{/* Reply Section */}
				{mode === 'reply' && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="space-y-2"
					>
						<h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
							<Send className="w-4 h-4 text-[#126E64]" />
							Your Reply
						</h3>

						<div className="space-y-3">
							<div>
								<textarea
									value={replyMessage}
									onChange={(e) => setReplyMessage(e.target.value)}
									placeholder="Type your reply message here..."
									rows={4}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#126E64] focus:border-transparent resize-none text-sm"
								/>
							</div>

							<div className="flex items-center justify-end gap-2">
								<motion.button
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									onClick={handleClose}
									className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
								>
									Cancel
								</motion.button>

								<motion.button
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									onClick={handleSendReply}
									disabled={!replyMessage.trim() || isSending}
									className="px-4 py-2 bg-[#126E64] text-white rounded-lg hover:bg-[#0f5a52] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1 text-sm"
								>
									<Send className="w-3 h-3" />
									{isSending ? 'Sending...' : 'Send Reply'}
								</motion.button>
							</div>
						</div>
					</motion.div>
				)}

				{/* View Mode Footer */}
				{mode === 'view' && (
					<div className="flex justify-end">
						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							onClick={handleClose}
							className="px-4 py-2 bg-[#126E64] text-white rounded-lg hover:bg-[#0f5a52] transition-colors font-medium text-sm"
						>
							Close
						</motion.button>
					</div>
				)}
			</div>
		</Modal>
	)
}

export { SupportModal }
export default SupportModal
