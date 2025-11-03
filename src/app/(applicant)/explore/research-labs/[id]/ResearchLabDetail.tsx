'use client'
import { Breadcrumb, Button, Modal, ResearchLabCard } from '@/components/ui'

import { mockResearchLabs } from '@/data/utils'
import { useResearchLabDetail } from '@/hooks/explore/useResearchLabDetail'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const ResearchLabDetail = () => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const params = useParams()
	const [isWishlisted, setIsWishlisted] = useState(false)
	const [activeTab, setActiveTab] = useState('job-description')
	const [researchLabWishlist, setResearchLabWishlist] = useState<string[]>([])

	// Fetch research lab detail from API
	const labId = params.id as string
	const { researchLab, loading, error } = useResearchLabDetail(labId)
	const [isUploading, setIsUploading] = useState(false)
	const [hasApplied, setHasApplied] = useState(false)
	const [isApplying, setIsApplying] = useState(false)
	const [isCheckingApplication, setIsCheckingApplication] = useState(false)
	const [uploadProgress, setUploadProgress] = useState<any[]>([])

	// Dynamic info items based on current lab data
	const infoItems = [
		{ label: 'Salary', value: researchLab?.salary || 'Up to $2000' },
		{ label: 'Country', value: researchLab?.country || 'Italy' },
		{ label: 'Job type', value: researchLab?.jobType || 'Researcher' },
		{
			label: 'Application deadline',
			value: researchLab?.applicationDeadline || '07/07/2026',
		},
	]

	const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
	const [showManageModal, setShowManageModal] = useState(false)
	const [isClosing, setIsClosing] = useState(false)
	const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
	const [breadcrumbItems, setBreadcrumbItems] = useState<
		Array<{ label: string; href?: string }>
	>([{ label: 'Explore', href: '/explore' }, { label: 'Research Lab Detail' }])

	// Update breadcrumb when component mounts or research lab data changes
	useEffect(() => {
		const updateBreadcrumb = () => {
			const fromTab = searchParams.get('from') || 'research'

			// Preserve all original URL parameters except 'from'
			const currentParams = new URLSearchParams(searchParams.toString())
			currentParams.delete('from') // Remove 'from' as it's not needed in explore page
			const paramsString = currentParams.toString()
			const queryString = paramsString ? `?${paramsString}` : ''

			const labName = researchLab?.title || 'Research Lab Detail'

			let items: Array<{ label: string; href?: string }> = [
				{ label: 'Explore', href: `/explore${queryString}` },
			]

			// Add intermediate breadcrumb based on where we came from
			if (fromTab === 'programmes') {
				items.push({
					label: 'Programmes',
					href: `/explore?tab=programmes${paramsString ? `&${paramsString}` : ''}`,
				})
			} else if (fromTab === 'scholarships') {
				items.push({
					label: 'Scholarships',
					href: `/explore?tab=scholarships${paramsString ? `&${paramsString}` : ''}`,
				})
			} else {
				items.push({
					label: 'Research Labs',
					href: `/explore?tab=research${paramsString ? `&${paramsString}` : ''}`,
				})
			}

			// Add current page (non-clickable)
			items.push({ label: labName })

			setBreadcrumbItems(items)
		}

		updateBreadcrumb()
	}, [searchParams, researchLab?.title])

	const handleApply = async () => {
		// Add application logic here
		setIsApplying(true)
		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 2000))
			setHasApplied(true)
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Error submitting application:', error)
		} finally {
			setIsApplying(false)
		}
	}

	// Dynamic breadcrumb based on referrer and context
	useEffect(() => {
		const updateBreadcrumb = () => {
			// Get the 'from' parameter from search params to know which tab we came from
			const fromTab = searchParams.get('from') || 'research'

			const labName = researchLab?.title || 'AI Research Lab'

			let items: Array<{ label: string; href?: string }> = [
				{ label: 'Explore', href: '/explore' },
			]

			// Add intermediate breadcrumb based on where we came from
			if (fromTab === 'programmes') {
				items.push({
					label: 'Programmes',
					href: '/explore?tab=programmes',
				})
			} else if (fromTab === 'scholarships') {
				items.push({
					label: 'Scholarships',
					href: '/explore?tab=scholarships',
				})
			} else {
				items.push({
					label: 'Research Labs',
					href: '/explore?tab=research',
				})
			}

			// Add current page (non-clickable)
			items.push({ label: labName })

			setBreadcrumbItems(items)
		}

		updateBreadcrumb()
	}, [searchParams, researchLab?.title])

	const handleRResearchLabWishlistToggle = (id: string) => {
		setResearchLabWishlist((prev) =>
			prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
		)
	}

	const handleFileUpload = (
		event: React.ChangeEvent<HTMLInputElement>,
		documentType?: string
	) => {
		const files = event.target.files
		if (files) {
			const fileArray = Array.from(files).map((file, index) => ({
				id: Date.now() + index,
				name: file.name,
				size: file.size,
				type: file.type,
				file: file,
				documentType: documentType,
			}))
			setUploadedFiles((prev) => [...prev, ...fileArray])
		}
	}

	const removeFile = (fileId: number) => {
		setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId))
	}

	const removeAllFiles = () => {
		setUploadedFiles([])
		setShowDeleteConfirmModal(false)
	}

	const handleRemoveAllClick = () => {
		setShowDeleteConfirmModal(true)
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

	const handleResearchLabClick = (researchLabId: string) => {
		// Preserve current URL parameters to maintain filter state
		const currentParams = new URLSearchParams(searchParams.toString())
		currentParams.delete('from') // Remove 'from' as it will be added back
		const paramsString = currentParams.toString()

		// Navigate to research lab detail page
		router.push(
			`/explore/research-labs/${researchLabId}?from=research${paramsString ? `&${paramsString}` : ''}`
		)
	}

	const menuItems = [
		{ id: 'job-description', label: 'Job description' },
		{ id: 'offer-information', label: 'Offer information' },
		{ id: 'job-requirements', label: 'Job requirements' },
		{ id: 'other-information', label: 'Other information' },
	]

	const renderTabContent = () => {
		if (loading) {
			return (
				<div className="flex justify-center items-center py-8">
					<div className="text-gray-500">Loading...</div>
				</div>
			)
		}

		if (error) {
			return (
				<div className="flex justify-center items-center py-8">
					<div className="text-red-500">Error: {error}</div>
				</div>
			)
		}

		if (!researchLab) {
			return (
				<div className="flex justify-center items-center py-8">
					<div className="text-gray-500">Research lab not found</div>
				</div>
			)
		}

		switch (activeTab) {
			case 'job-description':
				return (
					<div className="space-y-4">
						<ol className="space-y-4">
							<li className="text-base">
								<span className="font-bold text-gray-900">
									1. Research Field:
								</span>
								<ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700">
									{researchLab.researchFields.length > 0 ? (
										researchLab.researchFields.map((field, index) => (
											<li key={index}>{field}</li>
										))
									) : (
										<li>Not specified</li>
									)}
								</ul>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">2. Start date:</span>{' '}
								<span className="text-gray-700">
									{researchLab.startDate || 'Not specified'}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">
									3. Application deadline:
								</span>{' '}
								<span className="text-gray-700">
									{researchLab.applicationDeadline || 'Not specified'}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">4. Country:</span>{' '}
								<span className="text-gray-700">
									{researchLab.country || 'Not specified'}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">
									5. Type of Contract:
								</span>{' '}
								<span className="text-gray-700">
									{researchLab.contractType || 'Not specified'}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">6. Attendance:</span>{' '}
								<span className="text-gray-700">
									{researchLab.attendance || 'Not specified'}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">7. Job type:</span>{' '}
								<span className="text-gray-700">
									{researchLab.jobType || 'Researcher'}
								</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">
									8. Detail description:
								</span>
								<div className="mt-2 text-gray-700">
									{researchLab.description ||
										researchLab.mainResponsibility ||
										'No description available'}
								</div>
							</li>
						</ol>
					</div>
				)

			case 'offer-information':
				return (
					<div className="space-y-6">
						<div>
							<p className="text-base mb-2">
								<span className="font-bold text-gray-900">Salary:</span>{' '}
								<span className="text-gray-700">{researchLab.salary}</span>
							</p>
							{researchLab.salaryDescription && (
								<p className="text-sm text-gray-600">
									{researchLab.salaryDescription}
								</p>
							)}
						</div>

						{researchLab.benefit && (
							<div>
								<p className="font-bold text-gray-900 mb-3">Benefit:</p>
								<div className="text-gray-700 whitespace-pre-line">
									{researchLab.benefit}
								</div>
							</div>
						)}

						{researchLab.labFacilities && (
							<div>
								<p className="font-bold text-gray-900 mb-3">Lab Facilities:</p>
								<div className="text-gray-700 whitespace-pre-line">
									{researchLab.labFacilities}
								</div>
							</div>
						)}
					</div>
				)

			case 'job-requirements':
				return (
					<div className="space-y-6">
						{researchLab.mainResponsibility && (
							<div>
								<p className="text-base mb-4">
									<span className="font-bold text-gray-900">
										1. Main responsibilities:
									</span>{' '}
									<span className="text-gray-700">
										{researchLab.mainResponsibility}
									</span>
								</p>
							</div>
						)}

						{researchLab.qualificationRequirement && (
							<div>
								<p className="font-bold text-gray-900 mb-3">
									2. Qualification requirements:
								</p>
								<div className="text-gray-700 whitespace-pre-line">
									{researchLab.qualificationRequirement}
								</div>
							</div>
						)}

						{researchLab.experienceRequirement && (
							<div>
								<p className="font-bold text-gray-900 mb-3">
									3. Experience requirements:
								</p>
								<div className="text-gray-700 whitespace-pre-line">
									{researchLab.experienceRequirement}
								</div>
							</div>
						)}

						{researchLab.assessmentCriteria && (
							<div>
								<p className="font-bold text-gray-900 mb-3">
									4. Assessment criteria:
								</p>
								<div className="text-gray-700 whitespace-pre-line">
									{researchLab.assessmentCriteria}
								</div>
							</div>
						)}

						{researchLab.otherRequirement && (
							<div>
								<p className="text-base">
									<span className="font-bold text-gray-900">
										5. Other requirements:
									</span>
								</p>
								<div className="mt-2 text-gray-700 whitespace-pre-line">
									{researchLab.otherRequirement}
								</div>
							</div>
						)}

						{researchLab.technicalSkills && (
							<div>
								<p className="font-bold text-gray-900 mb-3">
									Technical Skills:
								</p>
								<div className="text-gray-700 whitespace-pre-line">
									{researchLab.technicalSkills}
								</div>
							</div>
						)}

						{researchLab.academicBackground && (
							<div>
								<p className="font-bold text-gray-900 mb-3">
									Academic Background:
								</p>
								<div className="text-gray-700 whitespace-pre-line">
									{researchLab.academicBackground}
								</div>
							</div>
						)}
					</div>
				)

			case 'other-information':
				return (
					<div className="space-y-6">
						{(researchLab.labContactEmail || researchLab.labWebsite) && (
							<div>
								<p className="text-base mb-4">
									<span className="font-bold text-gray-900">1. Contact:</span>{' '}
									<span className="text-gray-700">
										For inquiries or collaboration opportunities, please reach
										out via{' '}
										{researchLab.labContactEmail && (
											<span className="text-gray-700">
												{researchLab.labContactEmail}
											</span>
										)}
										{researchLab.labWebsite && (
											<>
												{' '}
												or visit our website at{' '}
												<a
													href={researchLab.labWebsite}
													target="_blank"
													rel="noopener noreferrer"
													className="text-blue-600 hover:underline"
												>
													{researchLab.labWebsite}
												</a>
												.
											</>
										)}
									</span>
								</p>
							</div>
						)}

						{researchLab.location && (
							<div>
								<p className="text-base mb-4">
									<span className="font-bold text-gray-900">
										2. Work location:
									</span>{' '}
									<span className="text-gray-700">{researchLab.location}</span>
								</p>
							</div>
						)}

						{researchLab.labDirector && (
							<div>
								<p className="text-base mb-4">
									<span className="font-bold text-gray-900">
										3. Lab Director:
									</span>{' '}
									<span className="text-gray-700">
										{researchLab.labDirector}
									</span>
								</p>
							</div>
						)}

						{/* {researchLab.labWebsite && (
							<div>
								<p className="text-base mb-4">
									<span className="font-bold text-gray-900">
										4. Lab Website:
									</span>{' '}
									<a
										href={researchLab.labWebsite}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-600 hover:text-blue-800 underline"
									>
										{researchLab.labWebsite}
									</a>
								</p>
							</div>
						)} */}

						{researchLab.labCapacity > 0 && (
							<div>
								<p className="text-base mb-4">
									<span className="font-bold text-gray-900">
										4. Lab Capacity:
									</span>{' '}
									<span className="text-gray-700">
										{researchLab.labCapacity} researchers
									</span>
								</p>
							</div>
						)}

						{researchLab.labFacilities && (
							<div>
								<p className="text-base mb-4">
									<span className="font-bold text-gray-900">
										5. Lab Facilities:
									</span>{' '}
									<span className="text-gray-700">
										{researchLab.labFacilities}
									</span>
								</p>
							</div>
						)}

						{researchLab.recommendations && (
							<div>
								<p className="font-bold text-gray-900 mb-3">
									6. Recommendations:
								</p>
								<div className="text-gray-700 whitespace-pre-line">
									{researchLab.recommendations}
								</div>
							</div>
						)}

						{/* {researchLab.applicationDocuments && (
							<div>
								<p className="font-bold text-gray-900 mb-3">
									7. Application Documents:
								</p>
								<div className="text-gray-700 whitespace-pre-line">
									{researchLab.applicationDocuments}
								</div>
							</div>
						)} */}
					</div>
				)

			default:
				return null
		}
	}
	return (
		<div className="min-h-screen bg-background">
			{/* --------------------------------------------------------------------------------------------- */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="relative w-full"
			>
				<div className="mt-28 w-[1500px] mx-auto px-5 sm:px-7 lg:px-9">
					<Breadcrumb items={breadcrumbItems} />
				</div>

				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.2 }}
					className="w-full bg-[#F5F7FB] mt-5 px-10 py-5 flex justify-center"
				>
					<div className="w-[1500px] flex justify-center items-center gap-10 mx-auto px-4 sm:px-6 lg:px-8 py-8">
						<div className="flex flex-col justify-center items-center w-1/2">
							<h1 className="text-3xl font-bold mb-2">
								{researchLab?.title || "Job's name"}
							</h1>
							<p className="text-gray-600 mb-6">
								Provided by: {researchLab?.organization || "Lab's name"}
							</p>

							<div className="flex items-center gap-3 mb-4">
								<Button className="">Visit website</Button>
								{/* <Button className="">Apply</Button> */}
								<motion.button
									onClick={(e) => {
										e.preventDefault()
										e.stopPropagation()
										setIsWishlisted(!isWishlisted)
									}}
									className="p-2 rounded-full transition-all duration-200 hover:bg-gray-50"
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.9 }}
								>
									<Heart
										className={`w-6 h-6 transition-all duration-200 ${
											isWishlisted
												? 'fill-red-500 text-red-500'
												: 'text-gray-400 hover:text-red-500'
										}`}
									/>
								</motion.button>
							</div>

							<p className="text-sm text-gray-500">
								Number of applications: {researchLab?.applicationCount || 0}
							</p>
						</div>
						<div className="w-1/2 grid grid-cols-2 gap-4">
							{infoItems.map((item, index) => (
								<div
									key={index}
									className="border border-[#116E63] p-5 rounded-xl flex flex-col justify-start"
								>
									<span className="text-md text-gray-500">{item.label}</span>
									<span className="text-xl text-black font-bold">
										{item.value}
									</span>
								</div>
							))}
						</div>
					</div>
				</motion.div>
			</motion.div>
			{/* --------------------------------------------------------------------------------------------- */}
			<motion.div
				className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="bg-white py-6 shadow-xl border"
				>
					<div className="container mx-auto px-4">
						<div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-8 lg:gap-40 text-center lg:text-left">
							{infoItems.map((item, index) => (
								<div key={index}>
									<p className="text-sm text-gray-500 mb-1">{item.label}</p>
									<p className="font-semibold text-gray-900">{item.value}</p>
								</div>
							))}
						</div>
					</div>
				</motion.div>

				{/* About Content */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="p-8 bg-white py-6 shadow-xl border"
				>
					<h2 className="text-3xl font-bold mb-6">About</h2>

					{loading ? (
						<div className="flex justify-center items-center py-8">
							<div className="text-gray-500">Loading...</div>
						</div>
					) : error ? (
						<div className="flex justify-center items-center py-8">
							<div className="text-red-500">Error: {error}</div>
						</div>
					) : researchLab ? (
						<div className="prose max-w-none text-gray-700 space-y-4">
							<p>
								{researchLab.description ||
									researchLab.institution.about ||
									'The research lab focuses on cutting-edge developments and brings together world-class researchers, graduate students, and industry partners to tackle challenging problems.'}
							</p>

							{researchLab.researchFocus && (
								<div>
									<p className="font-semibold">Research Focus:</p>
									<p>{researchLab.researchFocus}</p>
								</div>
							)}

							{researchLab.researchFields.length > 0 && (
								<div>
									<p className="font-semibold">Research Areas:</p>
									<ul className="list-disc pl-5 space-y-2">
										{researchLab.researchFields.map((field, index) => (
											<li key={index}>{field}</li>
										))}
									</ul>
								</div>
							)}

							{researchLab.institution.website && (
								<div>
									<p className="font-semibold">Institution:</p>
									<p>
										{researchLab.institution.name} -{' '}
										{researchLab.institution.country}
									</p>
									<a
										href={researchLab.institution.website}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-600 hover:text-blue-800 underline"
									>
										Visit Institution Website
									</a>
								</div>
							)}
						</div>
					) : (
						<div className="text-gray-500">Research lab not found</div>
					)}
				</motion.div>

				{/* Overview Content */}
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-8 p-8 bg-white py-6 shadow-xl border">
					{/* Left Sidebar Menu */}
					<motion.aside
						initial={{ x: -20, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						transition={{ delay: 0.4 }}
						className="lg:col-span-1"
					>
						<div className="space-y-2 border-r h-full border-gray-200 pr-4">
							{menuItems.map((item) => (
								<button
									key={item.id}
									onClick={() => setActiveTab(item.id)}
									className={`w-full text-left px-6 py-3 rounded-full transition-all ${
										activeTab === item.id
											? 'bg-teal-100 text-teal-700 font-semibold'
											: 'text-gray-700 hover:bg-gray-100 font-medium'
									}`}
								>
									{item.label}
								</button>
							))}
						</div>
					</motion.aside>

					{/* Right Content - Dynamic Tab Content */}
					<motion.div
						initial={{ x: 20, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						transition={{ delay: 0.5 }}
						className="lg:col-span-3"
					>
						<AnimatePresence mode="wait">
							<motion.div
								key={activeTab}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={{ duration: 0.2 }}
								className=""
							>
								{renderTabContent()}
							</motion.div>
						</AnimatePresence>
					</motion.div>
				</div>

				{/* Apply Content - Always show */}
				{/* -----------------------------------------------Apply Content---------------------------------------------- */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className=" p-8  bg-white py-6 shadow-xl border"
				>
					<h2 className="text-3xl font-bold mb-6">Apply here !</h2>

					<div className="text-gray-600 mb-6">
						{researchLab?.requiredDocuments &&
						researchLab.requiredDocuments.length > 0 ? (
							<div className="space-y-3">
								{researchLab.requiredDocuments.map((doc: any) => (
									<p key={doc.id}>
										{/* <span className="font-medium">{doc.name}:</span>{' '} */}
										{doc.description}
									</p>
								))}
							</div>
						) : (
							<p>
								You can upload required documents here. We will send documents
								and your academic information to university.
							</p>
						)}
					</div>

					{/* File Upload Area */}
					<div className="w-full mb-6">
						{researchLab?.requiredDocuments &&
							researchLab.requiredDocuments.length > 0 &&
							researchLab.requiredDocuments.map((doc: any) => {
								const filesForThisType = uploadedFiles.filter(
									(file) => file.documentType === doc.id
								)
								return (
									<div key={doc.id} className="space-y-2">
										<label className="text-sm font-medium text-gray-700">
											{doc.name}
											{filesForThisType.length > 0 && (
												<span className="ml-2 text-xs text-green-600">
													({filesForThisType.length} file
													{filesForThisType.length !== 1 ? 's' : ''})
												</span>
											)}
										</label>
										{/* {doc.description && (
																			<p className="text-xs text-gray-500 mb-2">
																				{doc.description}
																			</p>
																		)} */}
										<div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
											<div className="text-4xl mb-4">📁</div>
											<div className="space-y-2">
												<input
													type="file"
													multiple
													onChange={(e) => handleFileUpload(e, doc.id)}
													className="hidden"
													id={`file-upload-${doc.id}`}
												/>
												<label
													htmlFor={`file-upload-${doc.id}`}
													className="text-sm text-[#126E64] cursor-pointer hover:underline block"
												>
													Click here to upload file
												</label>
											</div>
										</div>

										{/* Show uploaded files for this document type */}
										{/* {filesForThisType.length > 0 && (
																			<div className="space-y-1">
																				{filesForThisType.map((file) => (
																					<div
																						key={file.id}
																						className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
																					>
																						<span className="truncate flex-1">{file.name}</span>
																						<button
																							onClick={() => removeFile(file.id)}
																							className="text-red-500 hover:text-red-700 ml-2"
																						>
																							✕
																						</button>
																					</div>
																				))}
																			</div>
																		)} */}
									</div>
								)
							})}
					</div>

					{/* File Management */}
					{(uploadedFiles.length > 0 || isUploading) && (
						<div className="bg-gray-50 rounded-lg p-4 mb-6">
							<div className="flex items-center justify-between mb-4">
								<span className="font-medium">
									{isUploading
										? 'Uploading files...'
										: `Manage files: ${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''}`}
								</span>
								{uploadedFiles.length > 0 && (
									<Button
										variant="outline"
										onClick={handleOpenModal}
										className="text-[#126E64] border-[#126E64] hover:bg-teal-50"
									>
										Manage Files
									</Button>
								)}
							</div>

							{/* Upload Progress */}
							{isUploading && uploadProgress.length > 0 && (
								<div className="space-y-2 mb-4">
									{uploadProgress.map((progress) => (
										<div key={progress.fileIndex} className="space-y-1">
											<div className="flex justify-between text-sm">
												<span>File {progress.fileIndex + 1}</span>
												<span>{progress.progress}%</span>
											</div>
											<div className="w-full bg-gray-200 rounded-full h-2">
												<div
													className="bg-[#126E64] h-2 rounded-full transition-all duration-300"
													style={{ width: `${progress.progress}%` }}
												></div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					<div className="flex gap-3 justify-center">
						{uploadedFiles.length > 0 && (
							<Button
								variant="outline"
								onClick={handleRemoveAllClick}
								className="text-red-500 border-red-500 hover:bg-red-50"
							>
								Remove all
							</Button>
						)}
						<Button
							className={
								hasApplied
									? 'bg-green-600 hover:bg-green-700 text-white'
									: 'bg-[#126E64] hover:bg-teal-700 text-white'
							}
							onClick={handleApply}
							disabled={
								hasApplied || isApplying || isUploading || isCheckingApplication
							}
						>
							{hasApplied ? (
								'✓ Application Submitted'
							) : isApplying ? (
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									Submitting...
								</div>
							) : isUploading ? (
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									Uploading Files...
								</div>
							) : isCheckingApplication ? (
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									Checking...
								</div>
							) : (
								'Submit Application'
							)}
						</Button>
					</div>
				</motion.div>

				{/* Recommended Scholarships - Only show when data is loaded */}
				{!loading && !error && researchLab && (
					<motion.div
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ delay: 0.3 }}
						className="p-8 bg-white py-6 shadow-xl border"
					>
						<h2 className="text-3xl font-bold mb-6">Related Research Labs</h2>

						{mockResearchLabs.length > 0 ? (
							<div className="relative h-[900px] overflow-y-auto overflow-x-hidden">
								{mockResearchLabs.slice(0, 9).map((researchLab, index) => (
									<div key={researchLab.id} className="">
										<div className="mb-7">
											<ResearchLabCard
												lab={researchLab}
												index={index}
												isWishlisted={researchLabWishlist.includes(
													researchLab.id
												)}
												onWishlistToggle={handleRResearchLabWishlistToggle}
												onClick={handleResearchLabClick}
											/>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8">
								<p className="text-gray-600">No research labs available</p>
							</div>
						)}
					</motion.div>
				)}
			</motion.div>

			{/* Manage Files Side Panel */}
			{showManageModal && (
				<div
					className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l z-50 transition-transform duration-300 ease-out ${
						isClosing ? 'translate-x-full' : 'translate-x-0'
					}`}
					style={{
						animation:
							showManageModal && !isClosing
								? 'slideInFromRight 0.3s ease-out'
								: 'none',
					}}
				>
					<div className="p-6 border-b">
						<div className="flex items-center justify-between">
							<h2 className="text-xl font-semibold">Manage Documents</h2>
							<Button
								variant="outline"
								onClick={handleCloseModal}
								className="rounded-full"
							>
								✕
							</Button>
						</div>
					</div>

					<div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
						<div className="space-y-8">
							{/* Uploaded Files Section */}
							{uploadedFiles.length > 0 && (
								<div className="space-y-4">
									<h3 className="text-lg font-medium text-foreground border-b pb-2">
										Uploaded Files ({uploadedFiles.length})
									</h3>
									<div className="grid grid-cols-1 gap-4">
										{uploadedFiles.map((file) => (
											<div
												key={file.id}
												className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
											>
												<div className="text-2xl">📄</div>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium text-foreground truncate">
														{file.name}
													</p>
													<p className="text-xs text-muted-foreground">
														{(file.size / 1024).toFixed(1)} KB
													</p>
												</div>
												<div className="flex gap-2">
													<Button
														variant="outline"
														onClick={() => {
															// Create a download link for the file
															const url = URL.createObjectURL(file.file)
															const a = document.createElement('a')
															a.href = url
															a.download = file.name
															a.click()
															URL.revokeObjectURL(url)
														}}
													>
														View
													</Button>
													<Button
														variant="outline"
														onClick={() => removeFile(file.id)}
														className="text-red-500 hover:text-red-700"
													>
														Delete
													</Button>
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Empty State */}
							{uploadedFiles.length === 0 && (
								<div className="text-center py-8">
									<div className="text-4xl mb-4">📁</div>
									<p className="text-muted-foreground">
										No documents uploaded yet
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			<Modal
				isOpen={showDeleteConfirmModal}
				onClose={() => setShowDeleteConfirmModal(false)}
				title="Delete All Files"
				maxWidth="sm"
			>
				<div className="space-y-6">
					<p className="text-gray-600">
						Do you want to delete all files? This action cannot be undone.
					</p>

					<div className="flex gap-3 justify-end">
						<Button
							variant="outline"
							onClick={() => setShowDeleteConfirmModal(false)}
							className="text-gray-600 border-gray-300 hover:bg-gray-50"
						>
							Cancel
						</Button>
						<Button
							onClick={removeAllFiles}
							className="bg-red-500 hover:bg-red-600 text-white"
						>
							Delete All
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	)
}

export default ResearchLabDetail
