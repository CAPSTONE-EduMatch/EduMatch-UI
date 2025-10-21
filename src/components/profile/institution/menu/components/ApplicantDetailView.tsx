'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui'
import {
	Download,
	User,
	FileText,
	ArrowLeft,
	Check,
	X,
	Edit,
	Send,
} from 'lucide-react'
import {
	InfoSection,
	ProfileCard,
	DocumentPanel,
	TwoPanelLayout,
} from '@/components/shared'
import type { Applicant } from './ApplicantsTable'

interface ApplicantDetailViewProps {
	applicant: Applicant
	onBack: () => void
	onContact: (applicant: Applicant) => void
	onApprove: (applicant: Applicant) => void
	onReject: (applicant: Applicant) => void
	onRequireUpdate: (applicant: Applicant) => void
}

interface Document {
	id: string
	name: string
	size: string
	uploadDate: string
	type: 'cv' | 'certificate' | 'degree' | 'transcript' | 'research'
}

export const ApplicantDetailView: React.FC<ApplicantDetailViewProps> = ({
	applicant,
	onBack,
	onContact,
	onApprove,
	onReject,
	onRequireUpdate,
}) => {
	const [activeTab, setActiveTab] = useState<'academic' | 'requirements'>(
		'academic'
	)
	const [showUpdateBox, setShowUpdateBox] = useState(false)
	const [updateDescription, setUpdateDescription] = useState('')

	// Mock document data - replace with actual API calls
	const documents: Document[] = [
		{
			id: '1',
			name: 'CV_John_Doe.pdf',
			size: '200 KB',
			uploadDate: '01/01/2025 17:00:00',
			type: 'cv',
		},
		{
			id: '2',
			name: 'Resume_John_Doe.docx',
			size: '150 KB',
			uploadDate: '01/01/2025 16:30:00',
			type: 'cv',
		},
		{
			id: '3',
			name: 'IELTS_Certificate.pdf',
			size: '300 KB',
			uploadDate: '02/01/2025 10:15:00',
			type: 'certificate',
		},
		{
			id: '4',
			name: 'TOEFL_Score.pdf',
			size: '250 KB',
			uploadDate: '02/01/2025 10:20:00',
			type: 'certificate',
		},
		{
			id: '5',
			name: 'Bachelor_Degree.pdf',
			size: '400 KB',
			uploadDate: '03/01/2025 14:00:00',
			type: 'degree',
		},
		{
			id: '6',
			name: 'Master_Degree.pdf',
			size: '450 KB',
			uploadDate: '03/01/2025 14:05:00',
			type: 'degree',
		},
		{
			id: '7',
			name: 'Transcript_2023.pdf',
			size: '180 KB',
			uploadDate: '04/01/2025 09:30:00',
			type: 'transcript',
		},
		{
			id: '8',
			name: 'Research_Paper_AI.pdf',
			size: '2.1 MB',
			uploadDate: '05/01/2025 11:45:00',
			type: 'research',
		},
	]

	const getDocumentsByType = (type: Document['type']) => {
		return documents.filter((doc) => doc.type === type)
	}

	const getDocumentTypeLabel = (type: Document['type']) => {
		switch (type) {
			case 'cv':
				return 'CV / Resume'
			case 'certificate':
				return 'Foreign Language Certificate'
			case 'degree':
				return 'Degrees'
			case 'transcript':
				return 'Transcript'
			case 'research':
				return 'Research paper'
			default:
				return type
		}
	}

	const handleDownloadAll = () => {
		console.log('Downloading all documents for:', applicant.name)
		// TODO: Implement download all functionality
	}

	const handleDownloadFolder = (type: Document['type']) => {
		console.log('Downloading folder for type:', type)
		// TODO: Implement download folder functionality
	}

	const handlePreviewFile = (document: Document) => {
		console.log('Previewing file:', document.name)
		// TODO: Implement file preview functionality
	}

	const handleDownloadFile = (document: Document) => {
		console.log('Downloading file:', document.name)
		// TODO: Implement file download functionality
	}

	const handleUpdateToggle = () => {
		setShowUpdateBox(!showUpdateBox)
		if (showUpdateBox) {
			setUpdateDescription('')
		}
	}

	const handleSendUpdate = () => {
		if (updateDescription.trim()) {
			console.log(
				'Sending update to applicant:',
				applicant.name,
				'Message:',
				updateDescription
			)
			// TODO: Implement sending update to applicant
			onRequireUpdate(applicant)
			setUpdateDescription('')
			setShowUpdateBox(false)
		}
	}

	// Prepare data for shared components
	const academicDetails = [
		{
			label: 'Program',
			value: `${applicant.degreeLevel} of ${applicant.subDiscipline}`,
		},
		{ label: 'GPA', value: '3.7' },
		{ label: 'Status', value: 'Graduated', className: 'text-green-600' },
		{ label: 'University', value: 'Bach Khoa University' },
	]

	const contactInfo = [
		{ label: 'Email', value: 'example123@gmail.com' },
		{ label: 'Phone', value: '(+84) 09090909090' },
		{ label: 'Nationality', value: 'Vietnam' },
	]

	const tabs = [
		{
			id: 'academic',
			label: 'Academic Profile',
			content: (
				<div className="h-full flex flex-col">
					{/* Documents List - Scrollable */}
					<div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
						<div className="pt-4 space-y-6">
							{['cv', 'certificate', 'degree', 'transcript', 'research'].map(
								(type) => {
									const typeDocs = getDocumentsByType(type as Document['type'])
									if (typeDocs.length === 0) return null

									return (
										<div
											key={type}
											className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
										>
											<div className="flex justify-between items-center mb-4">
												<h3 className="text-lg font-semibold">
													{getDocumentTypeLabel(type as Document['type'])}
												</h3>
												<button
													onClick={() =>
														handleDownloadFolder(type as Document['type'])
													}
													className="text-primary hover:text-primary/80 text-sm font-medium underline"
												>
													Download folder
												</button>
											</div>

											{/* Files List */}
											<div className="space-y-3 max-h-64 overflow-y-auto">
												{typeDocs.map((doc) => (
													<div
														key={doc.id}
														className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
													>
														<div className="flex items-center gap-3">
															<span className="text-2xl">📄</span>
															<div>
																<p className="font-medium text-sm">
																	{doc.name}
																</p>
																<p className="text-xs text-muted-foreground">
																	{doc.size} • {doc.uploadDate}
																</p>
															</div>
														</div>
														<div className="flex items-center gap-2">
															<button
																onClick={() => handlePreviewFile(doc)}
																className="text-primary hover:text-primary/80 text-sm font-medium"
															>
																View
															</button>
															<button
																onClick={() => handleDownloadFile(doc)}
																className="text-gray-400 hover:text-gray-600 p-1"
															>
																<Download className="h-4 w-4" />
															</button>
														</div>
													</div>
												))}
											</div>
										</div>
									)
								}
							)}
						</div>

						{/* Download All Button */}
						<div className="mt-6 pt-6 border-t border-gray-200">
							<button
								onClick={handleDownloadAll}
								className="w-full text-primary hover:text-primary/80 text-sm font-medium underline text-center py-2"
							>
								Download all documents
							</button>
						</div>
					</div>
				</div>
			),
		},
		{
			id: 'requirements',
			label: 'Program requirements',
			content: (
				<div className="p-4">
					<div className="text-center py-8">
						<FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
						<p className="text-gray-500 mb-4">
							Program requirements will be displayed here
						</p>
					</div>
				</div>
			),
		},
	]

	return (
		<div className="space-y-6">
			{/* Back Button */}
			<div className="flex items-center">
				<Button
					variant="outline"
					onClick={onBack}
					className="flex items-center gap-2"
					size="sm"
				>
					<ArrowLeft className="w-4 h-4" />
					Back to Applications
				</Button>
			</div>

			<TwoPanelLayout
				leftPanel={
					<ProfileCard
						header={{
							avatar: (
								<div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
									<User className="w-8 h-8 text-gray-400" />
								</div>
							),
							title: applicant.name,
							subtitle: '01/01/2000 - Male',
						}}
						sections={[
							<InfoSection
								key="academic"
								title="Academic Details"
								items={academicDetails}
							/>,
							<InfoSection
								key="contact"
								title="Contact Information"
								items={contactInfo}
							/>,
						]}
						actions={
							<div className="space-y-3 w-full">
								<Button
									onClick={() => onContact(applicant)}
									className="w-full bg-orange-500 hover:bg-orange-600 text-white"
									size="md"
								>
									Contact Applicant
								</Button>

								<div className="grid grid-cols-3 gap-2">
									<Button
										onClick={() => onApprove(applicant)}
										className="bg-green-500 hover:bg-green-600 text-white"
										size="sm"
									>
										Approve
									</Button>

									<Button
										onClick={() => onReject(applicant)}
										variant="outline"
										className="border-red-500 text-red-500 hover:bg-red-50"
										size="sm"
									>
										Reject
									</Button>

									<Button
										onClick={handleUpdateToggle}
										variant="outline"
										className="border-blue-500 text-blue-500 hover:bg-blue-50"
										size="sm"
									>
										Update
									</Button>
								</div>

								{/* Update Description Box */}
								{showUpdateBox && (
									<div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
										<div className="space-y-3">
											<label className="block text-sm font-medium text-gray-700">
												Message to Applicant
											</label>
											<textarea
												value={updateDescription}
												onChange={(e) => setUpdateDescription(e.target.value)}
												placeholder="Enter the information you need from the applicant..."
												className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
												rows={3}
											/>
											<div className="flex justify-end gap-2">
												<Button
													onClick={handleUpdateToggle}
													variant="outline"
													size="sm"
												>
													Cancel
												</Button>
												<Button
													onClick={handleSendUpdate}
													disabled={!updateDescription.trim()}
													className="bg-blue-500 hover:bg-blue-600 text-white"
													size="sm"
												>
													Send Update
												</Button>
											</div>
										</div>
									</div>
								)}
							</div>
						}
					/>
				}
				rightPanel={
					<DocumentPanel
						tabs={tabs}
						activeTab={activeTab}
						onTabChange={(tabId) =>
							setActiveTab(tabId as 'academic' | 'requirements')
						}
					/>
				}
			/>
		</div>
	)
}
