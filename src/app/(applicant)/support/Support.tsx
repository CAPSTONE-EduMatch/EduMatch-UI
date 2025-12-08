'use client'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/inputs/select'
import Button from '@/components/ui/forms/Button'
import { AnimatePresence, motion } from 'framer-motion'
import {
	ChevronDown,
	ChevronUp,
	User,
	BookOpen,
	CreditCard,
	Info,
	Paperclip,
	Send,
	Loader2,
	FolderOpen,
} from 'lucide-react'
import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslations } from 'next-intl'

const Support = () => {
	const { isAuthenticated, user } = useAuth()
	const tHeader = useTranslations('support_page.header')
	const tTabs = useTranslations('support_page.tabs')
	const tFaq = useTranslations('support_page.faq')
	const tFaqs = useTranslations('support_page.faqs')
	const tContact = useTranslations('support_page.contact')
	const tFileValidation = useTranslations('support_page.file_validation')
	const tFileModal = useTranslations('support_page.file_modal')

	const [activeTab, setActiveTab] = useState('account')
	const [expandedFaqs, setExpandedFaqs] = useState<
		Record<string, number | null>
	>({
		account: null,
		application: null,
		subscription: null,
		other: null,
	})
	const [problemType, setProblemType] = useState('application')
	const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
	const [question, setQuestion] = useState('')
	const [showManageModal, setShowManageModal] = useState(false)
	const [isClosing, setIsClosing] = useState(false)
	const [email, setEmail] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [submitMessage, setSubmitMessage] = useState<string | null>(null)
	const [submitError, setSubmitError] = useState<string | null>(null)

	const menuItems = [
		{
			id: 'account',
			label: tTabs('account'),
			icon: User,
		},
		{
			id: 'application',
			label: tTabs('application'),
			icon: BookOpen,
		},
		{
			id: 'subscription',
			label: tTabs('subscription'),
			icon: CreditCard,
		},
		{
			id: 'other',
			label: tTabs('other'),
			icon: Info,
		},
	]

	const toggleFaq = (index: number) => {
		setExpandedFaqs((prev) => ({
			...prev,
			[activeTab]: prev[activeTab] === index ? null : index,
		}))
	}

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files
		if (files) {
			const newFiles = Array.from(files).filter((file) => {
				// Check file type and size restrictions
				const fileType = file.type.toLowerCase()
				const fileSize = file.size / 1024 / 1024 // Convert to MB

				// Image files (PNG, JPEG) - max 5MB
				if (
					fileType.includes('png') ||
					fileType.includes('jpeg') ||
					fileType.includes('jpg')
				) {
					if (fileSize > 5) {
						alert(tFileValidation('image_too_large', { filename: file.name }))
						return false
					}
					return true
				}

				// Document files (PDF, DOC, DOCX) - max 10MB
				if (
					fileType.includes('pdf') ||
					fileType.includes('doc') ||
					fileType.includes('msword') ||
					fileType.includes('document')
				) {
					if (fileSize > 10) {
						alert(
							tFileValidation('document_too_large', { filename: file.name })
						)
						return false
					}
					return true
				}

				// Unsupported file type
				alert(tFileValidation('unsupported_type', { filename: file.name }))
				return false
			})

			setUploadedFiles((prev) => [...prev, ...newFiles])

			// Open manage modal when files are uploaded
			if (newFiles.length > 0) {
				handleOpenModal()
			}
		}
	}

	const removeFile = (index: number) => {
		setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
	}

	const handleCloseModal = () => {
		setIsClosing(true)
		setTimeout(() => {
			setShowManageModal(false)
			setIsClosing(false)
		}, 300)
	}

	const handleOpenModal = () => {
		setShowManageModal(true)
		setIsClosing(false)
	}

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault()
		setSubmitMessage(null)
		setSubmitError(null)
		if (!question.trim()) {
			setSubmitError(tContact('submit_error'))
			return
		}
		if (!isAuthenticated && !email.trim()) {
			setSubmitError(tContact('email_required'))
			return
		}
		setSubmitting(true)
		try {
			let res: Response
			if (uploadedFiles.length > 0) {
				const form = new FormData()
				form.append('problemType', problemType)
				form.append('question', question)
				form.append('email', isAuthenticated ? user?.email : email)
				uploadedFiles.forEach((file) => form.append('files', file))
				res = await fetch('/api/support', {
					method: 'POST',
					body: form,
				})
			} else {
				res = await fetch('/api/support', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						problemType,
						question,
						email: isAuthenticated ? user?.email : email,
					}),
				})
			}
			if (!res.ok) {
				const data = await res.json().catch(() => ({}))
				throw new Error(data?.error || tContact('generic_error'))
			}
			setSubmitMessage(tContact('submit_success'))
			setQuestion('')
			if (!isAuthenticated) setEmail('')
			setUploadedFiles([])
		} catch (err: any) {
			setSubmitError(err?.message || tContact('generic_error'))
		} finally {
			setSubmitting(false)
		}
	}

	const renderTabContent = () => {
		// Get translated FAQs for the active tab
		const currentFaqs =
			(tFaqs.raw(activeTab) as Array<{ question: string; answer: string }>) ||
			[]

		return (
			<div className="space-y-4">
				{currentFaqs.map((faq, index) => (
					<div
						key={index}
						className="border border-gray-200 rounded-lg overflow-hidden"
					>
						<button
							onClick={() => toggleFaq(index)}
							className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
						>
							<span className="text-gray-900 font-medium">{faq.question}</span>
							{expandedFaqs[activeTab] === index ? (
								<ChevronUp className="w-5 h-5 text-gray-500" />
							) : (
								<ChevronDown className="w-5 h-5 text-gray-500" />
							)}
						</button>
						<AnimatePresence>
							{expandedFaqs[activeTab] === index && (
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: 'auto', opacity: 1 }}
									exit={{ height: 0, opacity: 0 }}
									transition={{ duration: 0.2 }}
									className="overflow-hidden"
								>
									<div className="px-6 pb-4 text-gray-700 leading-relaxed bg-gray-50">
										{faq.answer}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				))}
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Header Section */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="relative w-full"
			>
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.2 }}
					className="w-full bg-[#F5F7FB] mt-28 px-10 py-12 flex justify-center"
				>
					<div className="w-[1500px] text-center mx-auto px-4 sm:px-6 lg:px-8">
						<h1 className="text-4xl font-bold mb-4 text-gray-900">
							{tHeader('title')}
						</h1>
						<p className="text-xl text-gray-600 max-w-3xl mx-auto">
							{tHeader('subtitle')}
						</p>
					</div>
				</motion.div>
			</motion.div>

			{/* Main Content */}
			<motion.div
				className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				{/* Quick Stats */}
				{/* <motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="bg-white py-6 shadow-xl border mb-10"
				>
					<div className="container mx-auto px-4">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
							<div>
								<p className="text-3xl font-bold text-[#126E64]">24/7</p>
								<p className="text-sm text-gray-600">Support Available</p>
							</div>
							<div>
								<p className="text-3xl font-bold text-[#126E64]">&lt; 2h</p>
								<p className="text-sm text-gray-600">Average Response</p>
							</div>
							<div>
								<p className="text-3xl font-bold text-[#126E64]">50+</p>
								<p className="text-sm text-gray-600">Help Articles</p>
							</div>
							<div>
								<p className="text-3xl font-bold text-[#126E64]">98%</p>
								<p className="text-sm text-gray-600">Satisfaction Rate</p>
							</div>
						</div>
					</div>
				</motion.div> */}

				{/* Main Support Content - FAQ Section */}
				<div className="bg-white shadow-xl border rounded-lg overflow-hidden">
					<div className="p-8">
						<h2 className="text-2xl font-bold text-gray-900 mb-6">
							{tFaq('title')}
						</h2>

						<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
							{/* Left Sidebar Menu */}
							<div className="lg:col-span-1">
								<div className="space-y-2">
									{menuItems.map((item) => (
										<button
											key={item.id}
											onClick={() => setActiveTab(item.id)}
											className={`w-full text-left px-4 py-3 rounded-lg transition-all text-sm font-medium ${
												activeTab === item.id
													? 'bg-teal-100 text-teal-700'
													: 'text-gray-700 hover:bg-gray-100'
											}`}
										>
											{item.label}
										</button>
									))}
								</div>
							</div>

							{/* Right Content - Dynamic Tab Content */}
							<div className="lg:col-span-3">
								<AnimatePresence mode="wait">
									<motion.div
										key={activeTab}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										transition={{ duration: 0.2 }}
									>
										{renderTabContent()}
									</motion.div>
								</AnimatePresence>
							</div>
						</div>
					</div>
				</div>

				{/* Divider */}
				<div className="flex items-center justify-center py-8">
					<div className="flex-grow border-t border-gray-300"></div>
					<div className="flex-shrink-0 px-4">
						<div className="w-8 h-8 bg-[#126E64] rounded-full flex items-center justify-center">
							<span className="text-white text-sm font-bold">?</span>
						</div>
					</div>
					<div className="flex-grow border-t border-gray-300"></div>
				</div>

				{/* Contact Us Section */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.6 }}
					className="bg-white shadow-xl border rounded-lg overflow-hidden"
				>
					<div className="p-8">
						<h2 className="text-2xl font-bold text-gray-900 mb-4">
							{tContact('title')}
						</h2>
						<p className="text-gray-600 mb-6">{tContact('subtitle')}</p>

						<form onSubmit={handleSubmit} className="space-y-6">
							{!isAuthenticated && (
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										{tContact('email_label')}
									</label>
									<input
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#126E64] focus:border-transparent"
										placeholder={tContact('email_placeholder')}
										required
									/>
								</div>
							)}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									{tContact('problem_type_label')}
								</label>
								<Select value={problemType} onValueChange={setProblemType}>
									<SelectTrigger className="w-full">
										<SelectValue
											placeholder={tContact('problem_type_placeholder')}
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="application">
											{tContact('problem_types.application')}
										</SelectItem>
										<SelectItem value="account">
											{tContact('problem_types.account')}
										</SelectItem>
										<SelectItem value="subscription">
											{tContact('problem_types.subscription')}
										</SelectItem>
										<SelectItem value="technical">
											{tContact('problem_types.technical')}
										</SelectItem>
										<SelectItem value="other">
											{tContact('problem_types.other')}
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div>
								<div className="relative">
									<textarea
										rows={6}
										value={question}
										onChange={(e) => setQuestion(e.target.value)}
										className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#126E64] focus:border-transparent resize-none"
										placeholder={tContact('question_placeholder')}
									/>
									<div className="absolute bottom-3 right-3 flex gap-2">
										<label htmlFor="file-upload" className="cursor-pointer">
											<Paperclip className="w-5 h-5 text-gray-400 hover:text-gray-600" />
											<input
												id="file-upload"
												type="file"
												multiple
												className="hidden"
												onChange={handleFileUpload}
												accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
											/>
										</label>
										<button
											type="submit"
											className={`text-[#126E64] hover:text-teal-700 ${submitting ? 'opacity-60 pointer-events-none' : ''}`}
											disabled={submitting}
										>
											{submitting ? (
												<Loader2 className="w-5 h-5 animate-spin" />
											) : (
												<Send className="w-5 h-5" />
											)}
										</button>
									</div>
								</div>

								{submitting && (
									<div
										className="flex items-center gap-2 text-sm text-gray-600 mt-3"
										aria-live="polite"
									>
										<Loader2 className="w-4 h-4 animate-spin" />
										<span>{tContact('sending')}</span>
									</div>
								)}

								{submitError && (
									<p className="text-sm text-red-600 mt-3">{submitError}</p>
								)}
								{submitMessage && (
									<p className="text-sm text-green-600 mt-3">{submitMessage}</p>
								)}

								{/* File Upload Note */}
								<p className="text-xs text-gray-500 mt-2">
									<strong>{tContact('note_label')}</strong> {tContact('note')}
								</p>

								{/* Uploaded Files Display */}
								{uploadedFiles.length > 0 && (
									<div className="mt-4 space-y-2">
										<div className="flex items-center justify-between bg-gray-200 py-3 px-4 rounded-md">
											<p className="text-sm font-medium text-gray-700">
												{tContact('uploaded_files_label', {
													count: uploadedFiles.length,
												})}
											</p>
											<Button
												variant="outline"
												onClick={handleOpenModal}
												className="text-xs px-5 flex items-center gap-3 py-1 h-auto bg-white"
											>
												<FolderOpen className="w-3 h-3 mr-1" />
												<span>{tContact('manage_files_button')}</span>
											</Button>
										</div>
										{/* {uploadedFiles.slice(0, 3).map((file, index) => (
											<div
												key={index}
												className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
											>
												<div className="flex items-center gap-2">
													<Paperclip className="w-4 h-4 text-gray-500" />
													<span className="text-sm text-gray-700">
														{file.name}
													</span>
													<span className="text-xs text-gray-500">
														({(file.size / 1024 / 1024).toFixed(2)} MB)
													</span>
												</div>
												<button
													type="button"
													onClick={() => removeFile(index)}
													className="text-red-500 hover:text-red-700"
												>
													<X className="w-4 h-4" />
												</button>
											</div>
										))} */}
										{uploadedFiles.length > 3 && (
											<p className="text-xs text-gray-500 text-center">
												{tContact('more_files_text', {
													count: uploadedFiles.length - 3,
												})}
											</p>
										)}
									</div>
								)}
							</div>
						</form>
					</div>
				</motion.div>
			</motion.div>

			{/* Manage Files Side Panel */}
			{showManageModal && (
				<div
					className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l z-50 transition-transform duration-300 ease-out ${
						isClosing ? 'translate-x-full' : 'translate-x-0'
					}`}
				>
					<div className="p-6 border-b">
						<div className="flex items-center justify-between">
							<h2 className="text-xl font-semibold">{tFileModal('title')}</h2>
							<Button
								variant="outline"
								onClick={handleCloseModal}
								className="rounded-full text-gray-500 hover:text-gray-700"
							>
								{tFileModal('close_button')}
							</Button>
						</div>
					</div>

					<div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
						<div className="space-y-8">
							{/* Uploaded Files Section */}
							{uploadedFiles.length > 0 && (
								<div className="space-y-6">
									<h3 className="text-lg font-medium text-foreground border-b pb-2">
										{tFileModal('uploaded_section_title', {
											count: uploadedFiles.length,
										})}
									</h3>
									<div className="space-y-3">
										<div className="grid grid-cols-1 gap-3">
											{uploadedFiles.map((file, index) => (
												<div
													key={index}
													className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
												>
													<div className="text-2xl">
														{file.type.includes('pdf')
															? tFileModal('file_icons.pdf')
															: file.type.includes('image')
																? tFileModal('file_icons.image')
																: tFileModal('file_icons.default')}
													</div>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-medium text-foreground truncate">
															{file.name}
														</p>
														<p className="text-xs text-muted-foreground">
															{(file.size / 1024 / 1024).toFixed(2)} MB
														</p>
													</div>
													<div className="flex gap-2">
														<Button
															variant="outline"
															onClick={() => removeFile(index)}
															className="text-red-500 hover:text-red-700 text-xs px-2 py-1 h-auto"
														>
															{tFileModal('delete_button')}
														</Button>
													</div>
												</div>
											))}
										</div>
									</div>
								</div>
							)}

							{/* Empty State */}
							{uploadedFiles.length === 0 && (
								<div className="text-center py-8">
									<div className="text-4xl mb-4">
										{tFileModal('empty_icon')}
									</div>
									<p className="text-muted-foreground">
										{tFileModal('empty_state')}
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default Support
