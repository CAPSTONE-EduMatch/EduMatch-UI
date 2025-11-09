'use client'
import {
	Breadcrumb,
	Button,
	FilterSidebar,
	Modal,
	Pagination,
	ProgramCard,
	ScholarshipCard,
	ErrorModal,
} from '@/components/ui'

import { mockScholarships } from '@/data/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useWishlist } from '@/hooks/wishlist/useWishlist'
import { useAuthCheck } from '@/hooks/auth/useAuthCheck'

const ScholarshipDetail = () => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const params = useParams()
	const { isAuthenticated } = useAuthCheck()
	const [showAuthModal, setShowAuthModal] = useState(false)

	// Wishlist functionality
	const { isInWishlist, toggleWishlistItem } = useWishlist({
		autoFetch: true,
		initialParams: {
			page: 1,
			limit: 100,
			status: 1,
		},
	})

	const [activeTab, setActiveTab] = useState('detail')
	const [scholarshipWishlist, setScholarshipWishlist] = useState<string[]>([])
	const [programWishlist, setProgramWishlist] = useState<string[]>([])
	const [eligibilityProgramsPage, setEligibilityProgramsPage] = useState(1)
	const [eligibilityPrograms, setEligibilityPrograms] = useState<any[]>([])
	const [eligibilityProgramsLoading, setEligibilityProgramsLoading] =
		useState(false)
	const [eligibilityProgramsTotalPages, setEligibilityProgramsTotalPages] =
		useState(1)
	const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
	const [showManageModal, setShowManageModal] = useState(false)
	const [isClosing, setIsClosing] = useState(false)
	const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
	const [currentScholarship, setCurrentScholarship] = useState<any>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isUploading, setIsUploading] = useState(false)
	const [hasApplied, setHasApplied] = useState(false)
	const [isApplying, setIsApplying] = useState(false)
	const [eligibilityFilters, setEligibilityFilters] = useState<
		Record<string, string[]>
	>({})

	const [breadcrumbItems, setBreadcrumbItems] = useState<
		Array<{ label: string; href?: string }>
	>([{ label: 'Explore', href: '/explore' }, { label: 'Scholarship Detail' }])

	// Dynamic info items based on current scholarship data
	// const infoItems = [
	// 	{
	// 		label: 'Tuition fee',
	// 		value: currentScholarship?.tuitionFee || 'N/A',
	// 	},
	// 	{ label: 'Duration', value: currentScholarship?.duration || 'N/A' },
	// 	{
	// 		label: 'Application deadline',
	// 		value: currentScholarship?.applicationDeadline || 'N/A',
	// 	},
	// 	{
	// 		label: 'Start Date',
	// 		value: currentScholarship?.startDate || 'N/A',
	// 	},
	// 	{
	// 		label: 'Location',
	// 		value: currentScholarship?.location || 'N/A',
	// 	},
	// ]

	const eligibilityProgramsPerPage = 6

	// Dynamic breadcrumb based on referrer and context
	useEffect(() => {
		const fetchScholarshipDetail = async () => {
			setLoading(true)
			setError(null)
			try {
				const scholarshipId = params.id as string
				const response = await fetch(
					`/api/explore/scholarships/scholarship-detail?id=${scholarshipId}`
				)
				if (!response.ok) {
					throw new Error('Failed to fetch scholarship details')
				}
				const data = await response.json()
				if (data.success) {
					setCurrentScholarship(data.data)
				} else {
					throw new Error(data.message || 'Failed to fetch data')
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : 'An error occurred')
			} finally {
				setLoading(false)
			}
		}

		const updateBreadcrumb = () => {
			const fromTab = searchParams.get('from') || 'scholarships'

			// Preserve all original URL parameters except 'from'
			const currentParams = new URLSearchParams(searchParams.toString())
			currentParams.delete('from') // Remove 'from' as it's not needed in explore page
			const paramsString = currentParams.toString()
			const queryString = paramsString ? `?${paramsString}` : ''

			const scholarshipName = currentScholarship?.title || 'Scholarship Detail'

			let items: Array<{ label: string; href?: string }> = [
				{ label: 'Explore', href: `/explore${queryString}` },
			]

			// Add intermediate breadcrumb based on where we came from
			if (fromTab === 'programmes') {
				items.push({
					label: 'Programmes',
					href: `/explore?tab=programmes${paramsString ? `&${paramsString}` : ''}`,
				})
			} else if (fromTab === 'research') {
				items.push({
					label: 'Research Labs',
					href: `/explore?tab=research${paramsString ? `&${paramsString}` : ''}`,
				})
			} else {
				items.push({
					label: 'Scholarships',
					href: `/explore?tab=scholarships${paramsString ? `&${paramsString}` : ''}`,
				})
			}

			// Add current page (non-clickable)
			items.push({ label: scholarshipName })

			setBreadcrumbItems(items)
		}

		fetchScholarshipDetail()
		updateBreadcrumb()
	}, [params.id, searchParams, currentScholarship?.title])

	// Fetch eligibility programs when scholarship data is available
	useEffect(() => {
		const fetchEligibilityPrograms = async () => {
			if (!currentScholarship) {
				// eslint-disable-next-line no-console
				console.log('No current scholarship data available')
				return
			}

			// eslint-disable-next-line no-console
			console.log(
				'Fetching eligibility programs for scholarship:',
				currentScholarship.id
			)
			// eslint-disable-next-line no-console
			console.log('Current filters:', eligibilityFilters)

			setEligibilityProgramsLoading(true)
			try {
				const params = new URLSearchParams()

				// Apply eligibility filters only
				Object.entries(eligibilityFilters).forEach(([key, values]) => {
					if (values && values.length > 0) {
						if (key === 'feeRange') {
							// Parse feeRange as minFee and maxFee
							const range = values[0]
							if (range && range !== '0-1000000') {
								const [min, max] = range.split('-').map(Number)
								if (!isNaN(min) && !isNaN(max)) {
									params.append('minFee', min.toString())
									params.append('maxFee', max.toString())
									// eslint-disable-next-line no-console
									console.log(`Added fee range: minFee=${min}, maxFee=${max}`)
								}
							}
						} else {
							params.append(key, values.join(','))
							// eslint-disable-next-line no-console
							console.log(`Added filter: ${key} = ${values.join(',')}`)
						}
					}
				})

				// Don't auto-apply scholarship data as filters - let user choose manually
				// This prevents overly restrictive filtering that returns no results

				// Add pagination with 6 items per page
				params.append('page', eligibilityProgramsPage.toString())
				params.append('limit', eligibilityProgramsPerPage.toString())

				// eslint-disable-next-line no-console
				console.log('API URL:', `/api/explore/programs?${params.toString()}`)

				const response = await fetch(
					`/api/explore/programs?${params.toString()}`
				)
				if (!response.ok) {
					throw new Error('Failed to fetch eligibility programs')
				}
				const data = await response.json()

				// eslint-disable-next-line no-console
				console.log('API Response:', data)
				if (data.data && data.data.length >= 0) {
					setEligibilityPrograms(data.data)
					setEligibilityProgramsTotalPages(data.meta?.totalPages || 1)
				} else {
					setEligibilityPrograms([])
					setEligibilityProgramsTotalPages(1)
				}
			} catch (err) {
				// eslint-disable-next-line no-console
				console.error('Error fetching eligibility programs:', err)
				setEligibilityPrograms([])
				setEligibilityProgramsTotalPages(1)
			} finally {
				setEligibilityProgramsLoading(false)
			}
		}

		fetchEligibilityPrograms()
	}, [
		currentScholarship,
		eligibilityProgramsPage,
		eligibilityProgramsPerPage,
		eligibilityFilters,
	])

	// Reset pagination when scholarship changes
	useEffect(() => {
		if (currentScholarship?.id) {
			setEligibilityProgramsPage(1)
		}
	}, [currentScholarship?.id])

	const handleProgramWishlistToggle = (id: string) => {
		setProgramWishlist((prev) =>
			prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
		)
	}

	const handleScholarshipWishlistToggle = async (id: string) => {
		// Check if user is authenticated before attempting to toggle
		if (!isAuthenticated) {
			setShowAuthModal(true)
			return
		}

		try {
			await toggleWishlistItem(id)
			// Update local state to reflect the change
			setScholarshipWishlist((prev) =>
				prev.includes(id)
					? prev.filter((itemId) => itemId !== id)
					: [...prev, id]
			)
		} catch (error) {
			// Check if error is due to authentication
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error'
			if (
				errorMessage.includes('Authentication required') ||
				errorMessage.includes('not authenticated') ||
				errorMessage.includes('401')
			) {
				setShowAuthModal(true)
			} else {
				// eslint-disable-next-line no-console
				console.error('Failed to toggle wishlist item:', error)
			}
		}
	}

	const handleEligibilityFiltersChange = (
		filters: Record<string, string[]>
	) => {
		setEligibilityFilters(filters)
		// Reset to page 1 when filters change
		setEligibilityProgramsPage(1)
	}

	// Handle sign in navigation
	const handleSignIn = () => {
		setShowAuthModal(false)
		router.push('/signin')
	}

	// Handle sign up navigation
	const handleSignUp = () => {
		setShowAuthModal(false)
		router.push('/signup')
	}

	const handleFileUpload = (
		event: React.ChangeEvent<HTMLInputElement>,
		documentType?: string
	) => {
		const files = event.target.files
		if (files) {
			setIsUploading(true)

			const fileArray = Array.from(files).map((file, index) => ({
				id: Date.now() + index,
				name: file.name,
				size: file.size,
				type: file.type,
				file: file,
				documentType: documentType,
				status: 'uploaded',
				extractedData: null,
			}))

			// Add files to state immediately
			setUploadedFiles((prev) => [...prev, ...fileArray])
			setIsUploading(false)
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

	const handleProgramClick = (programId: string) => {
		// Preserve current URL parameters to maintain filter state
		const currentParams = new URLSearchParams(searchParams.toString())
		currentParams.delete('from') // Remove 'from' as it will be added back
		const paramsString = currentParams.toString()

		// Navigate to programmes detail page
		router.push(
			`/explore/programmes/${programId}?from=scholarships${paramsString ? `&${paramsString}` : ''}`
		)
	}

	const handleScholarshipClick = (scholarshipId: string) => {
		// Preserve current URL parameters to maintain filter state
		const currentParams = new URLSearchParams(searchParams.toString())
		currentParams.delete('from') // Remove 'from' as it will be added back
		const paramsString = currentParams.toString()

		// Navigate to scholarship detail page
		router.push(
			`/explore/scholarships/${scholarshipId}?from=scholarships${paramsString ? `&${paramsString}` : ''}`
		)
	}

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

	const menuItems = [
		{ id: 'detail', label: 'Detail' },
		{ id: 'eligibility', label: 'Eligibility' },
		{ id: 'other', label: 'Other information' },
	]

	const renderTabContent = () => {
		switch (activeTab) {
			case 'detail':
				return (
					<div className="space-y-4">
						<div>
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								Description
							</h3>
							<p
								className="text-gray-700 mb-6 prose prose-content"
								dangerouslySetInnerHTML={{
									__html:
										currentScholarship?.description ||
										'No description available for this scholarship.',
								}}
							/>
						</div>

						<div>
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								Scholarship Details
							</h3>
							<ol className="space-y-4">
								<li className="text-base">
									<span className="font-bold text-gray-900">1. Amount:</span>{' '}
									<span
										className="text-gray-700 prose prose-content"
										dangerouslySetInnerHTML={{
											__html: currentScholarship?.amount || 'N/A',
										}}
									/>
								</li>
								<li className="text-base">
									<span className="font-bold text-gray-900">2. Type:</span>{' '}
									<span className="text-gray-700">
										{currentScholarship?.type || 'N/A'}
									</span>
								</li>
								<li className="text-base">
									<span className="font-bold text-gray-900">3. Coverage:</span>{' '}
									<span
										className="text-gray-700 prose prose-content"
										dangerouslySetInnerHTML={{
											__html: currentScholarship?.scholarshipCoverage || 'N/A',
										}}
									/>
								</li>
								<li className="text-base">
									<span className="font-bold text-gray-900">
										4. Essay Required:
									</span>{' '}
									<span className="text-gray-700">
										{currentScholarship?.essayRequired || 'N/A'}
									</span>
								</li>
								<li className="text-base">
									<span className="font-bold text-gray-900">
										5. Number Available:
									</span>{' '}
									<span className="text-gray-700">
										{currentScholarship?.number || 'N/A'}
									</span>
								</li>
								<li className="text-base">
									<span className="font-bold text-gray-900">6. Days Left:</span>{' '}
									<span className="text-gray-700">
										{currentScholarship?.daysLeft || 0} days
									</span>
								</li>
								<li className="text-base">
									<span className="font-bold text-gray-900">
										7. Match Percentage:
									</span>{' '}
									<span className="text-gray-700">
										{currentScholarship?.match || 'N/A'}
									</span>
								</li>
							</ol>
						</div>
					</div>
				)

			case 'eligibility':
				return (
					<div className="space-y-6">
						<div>
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								Eligibility Requirements
							</h3>
							<p className="text-gray-700 mb-6">
								{currentScholarship?.eligibility ||
									'No specific eligibility requirements listed.'}
							</p>
						</div>

						{currentScholarship?.subdisciplines &&
							currentScholarship.subdisciplines.length > 0 && (
								<div>
									<p className="font-bold text-gray-900 mb-3">
										Related Subdisciplines:
									</p>
									<ul className="list-disc pl-5 space-y-2 text-gray-700">
										{currentScholarship.subdisciplines.map(
											(subdiscipline: any) => (
												<li key={subdiscipline.id}>{subdiscipline.name}</li>
											)
										)}
									</ul>
								</div>
							)}

						{currentScholarship?.requiredDocuments &&
							currentScholarship.requiredDocuments.length > 0 && (
								<div>
									<p className="font-bold text-gray-900 mb-3">
										Required Documents:
									</p>
									<ul className="list-disc pl-5 space-y-2 text-gray-700">
										{currentScholarship.requiredDocuments.map((doc: any) => (
											<li key={doc.id}>
												<strong>{doc.name}</strong>
												{doc.description && ` - ${doc.description}`}
											</li>
										))}
									</ul>
								</div>
							)}

						{/* Eligibility Programs Section */}
						{/* <div>
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								Eligibility Programmes
							</h3>
							<p className="text-gray-700 mb-6">
								Programmes you may be eligible for based on this
								scholarship&apos;s requirements.
							</p>

							{eligibilityProgramsLoading ? (
								<div className="flex justify-center py-8">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
								</div>
							) : eligibilityPrograms.length > 0 ? (
								<>
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
										{eligibilityPrograms.map((program, index) => (
											<ProgramCard
												key={program.id}
												program={program}
												index={index}
												onWishlistToggle={() =>
													handleProgramWishlistToggle(program.id)
												}
												isWishlisted={programWishlist.includes(program.id)}
												onClick={() => handleProgramClick(program.id)}
											/>
										))}
									</div>

									{eligibilityProgramsTotalPages > 1 && (
										<div className="flex justify-center">
											<Pagination
												currentPage={eligibilityProgramsPage}
												totalPages={eligibilityProgramsTotalPages}
												onPageChange={setEligibilityProgramsPage}
											/>
										</div>
									)}
								</>
							) : (
								<div className="text-center py-8 text-gray-500">
									No eligible programmes found for this scholarship.
								</div>
							)}
						</div> */}
					</div>
				)

			case 'other':
				return (
					<div className="space-y-6">
						{currentScholarship?.institution && (
							<div>
								<h3 className="text-xl font-bold text-gray-900 mb-4">
									Institution Information
								</h3>
								<div className="space-y-2">
									<p className="text-gray-700">
										<strong>Name:</strong> {currentScholarship.institution.name}
									</p>
									{currentScholarship.institution.abbreviation && (
										<p className="text-gray-700">
											<strong>Abbreviation:</strong>{' '}
											{currentScholarship.institution.abbreviation}
										</p>
									)}
									<p className="text-gray-700">
										<strong>Country:</strong>{' '}
										{currentScholarship.institution.country}
									</p>
									{currentScholarship.institution.website && (
										<p className="text-gray-700">
											<strong>Website:</strong>{' '}
											<a
												href={currentScholarship.institution.website}
												target="_blank"
												rel="noopener noreferrer"
												className="text-blue-600 hover:underline"
											>
												{currentScholarship.institution.website}
											</a>
										</p>
									)}
									{/* {currentScholarship.institution.about && (
										<div className="mt-4">
											<strong>About:</strong>
											<p
												className="text-gray-700 mt-2"
												dangerouslySetInnerHTML={{
													__html: currentScholarship.institution.about,
												}}
											/>
										</div>
									)} */}
								</div>
							</div>
						)}

						{/* <div>
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								Application Statistics
							</h3>
							<p className="text-gray-700">
								<strong>Current Applications:</strong>{' '}
								{currentScholarship?.applicationCount || 0}
							</p>
						</div> */}
					</div>
				)

			default:
				return null
		}
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading scholarship details...</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-600 text-lg">Error: {error}</p>
					<button
						onClick={() => window.location.reload()}
						className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
					>
						Retry
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen  bg-background">
			{/* --------------------------------------------------------------------------------------------- */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="relative  w-full"
			>
				<div className="mt-28 w-[1500px] mx-auto px-5 sm:px-7 lg:px-9 ">
					<Breadcrumb items={breadcrumbItems} />
				</div>
				{/* <Image
					src="https://vcdn1-vnexpress.vnecdn.net/2023/07/28/hoc-vien3-1690476448-4686-1690477817.jpg?w=1200&h=0&q=100&dpr=1&fit=crop&s=T1naMvwNebHJRgrlo54Jbw"
					alt="Army West University"
					fill
					className="object-cover"
					priority
				/> */}

				{/* <div className="container mx-auto px-4 h-full relative"> */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.2 }}
					className="w-full bg-[#F5F7FB]  mt-5 px-10 py-5 flex justify-center"
				>
					<div className="w-[1500px] flex justify-center items-center gap-10 mx-auto px-4 sm:px-6 lg:px-8 py-8 ">
						<div className=" flex flex-col justify-center items-center w-1/2">
							<h1 className="text-3xl font-bold mb-2">
								{currentScholarship?.title || 'Information Technology'}
							</h1>
							<p className="text-gray-600 mb-6">
								{currentScholarship?.university || 'Army West University (AWU)'}
							</p>

							<div className="flex items-center gap-3 mb-4">
								{currentScholarship?.institution?.website && (
									<Button
										className=""
										onClick={() =>
											window.open(
												currentScholarship.institution.website,
												'_blank'
											)
										}
									>
										Visit website
									</Button>
								)}
								{/* <Button className="">Apply</Button> */}
								<motion.button
									onClick={(e) => {
										e.preventDefault()
										e.stopPropagation()
										const scholarshipId = currentScholarship?.id || params.id
										if (scholarshipId) {
											handleScholarshipWishlistToggle(scholarshipId as string)
										}
									}}
									className="p-2 rounded-full transition-all duration-200 hover:bg-gray-50"
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.9 }}
								>
									<Heart
										className={`w-6 h-6 transition-all duration-200 ${
											isInWishlist(currentScholarship?.id || params.id)
												? 'fill-red-500 text-red-500'
												: 'text-gray-400 hover:text-red-500'
										}`}
									/>
								</motion.button>
							</div>

							<p className="text-sm text-gray-500">
								Number of applications:{' '}
								{currentScholarship?.applicationCount || 0}
							</p>
						</div>
						<div className="  w-1/2 grid grid-cols-2 gap-4">
							<div className="border border-[#116E63] p-5 rounded-xl flex flex-col justify-start">
								<span className="text-md text-gray-500">Grant</span>
								<span className="text-xl text-black font-bold">
									{currentScholarship?.amount || 'N/A'}
								</span>
							</div>
							<div className="border border-[#116E63] p-5 rounded-xl flex flex-col justify-start">
								<span className="text-md text-gray-500">Country</span>
								<span className="text-xl text-black font-bold">
									{currentScholarship?.country || 'N/A'}
								</span>
							</div>
							<div className="border border-[#116E63] p-5 rounded-xl flex flex-col justify-start">
								<span className="text-md text-gray-500">Insitutuion Type</span>
								<span className="text-xl text-black font-bold">
									{currentScholarship?.institution.type || 'N/A'}
								</span>
							</div>
							<div className="border border-[#116E63] p-5 rounded-xl flex flex-col justify-start">
								<span className="text-md text-gray-500">
									Application deadline
								</span>
								<span className="text-xl text-black font-bold">
									{currentScholarship?.applicationDeadline || 'N/A'}
								</span>
							</div>
						</div>
					</div>
				</motion.div>
				{/* </div> */}
			</motion.div>
			{/* --------------------------------------------------------------------------------------------- */}
			<motion.div
				className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				{/* <div className="mb-6">
					<Breadcrumb items={breadcrumbItems} />
				</div> */}
				{/* <motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="bg-white py-6 shadow-xl border "
				>
					<div className="container mx-auto px-4">
						<div className="grid grid-cols-2 md:grid-cols-5 gap-6">
							{infoItems.map((item, index) => (
								<div key={index} className="text-center md:text-left">
									<p className="text-sm text-gray-500 mb-1">{item.label}</p>
									<p className="font-semibold text-gray-900">{item.value}</p>
								</div>
							))}
						</div>
					</div>
				</motion.div> */}
				{/* -----------------------------------------------About Content---------------------------------------------- */}

				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className=" p-8  bg-white py-6 shadow-xl border"
				>
					<h2 className="text-3xl font-bold mb-6">About</h2>

					<div className="prose max-w-none text-gray-700 space-y-4">
						{currentScholarship?.institution?.about && (
							<p
								dangerouslySetInnerHTML={{
									__html: currentScholarship.institution.about,
								}}
							/>
						)}
					</div>
				</motion.div>
				{/* -----------------------------------------------Overview Content---------------------------------------------- */}

				<div className="grid grid-cols-1 lg:grid-cols-4 gap-8 p-8  bg-white py-6 shadow-xl border">
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

				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="p-8 bg-white py-6 shadow-xl border"
				>
					<h2 className="text-3xl font-bold mb-6">Eligibility programmes</h2>

					<div className="flex gap-8">
						{/* Filter Sidebar */}
						<FilterSidebar
							activeTab="programmes"
							onFiltersChange={handleEligibilityFiltersChange}
						/>

						{/* Programs Content */}
						<div className="flex-1">
							{/* Results Count */}
							<div className="mb-4">
								<p className="text-gray-600">
									Showing {eligibilityPrograms.length} programmes
									{eligibilityProgramsTotalPages > 1 && (
										<span>
											{' '}
											(Page {eligibilityProgramsPage} of{' '}
											{eligibilityProgramsTotalPages})
										</span>
									)}
								</p>
							</div>

							{eligibilityProgramsLoading ? (
								<div className="flex justify-center py-8">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
								</div>
							) : (
								<>
									{/* Programs Grid */}
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
										{eligibilityPrograms.map((program, index) => (
											<ProgramCard
												key={program.id}
												program={program}
												index={index}
												isWishlisted={programWishlist.includes(program.id)}
												onWishlistToggle={handleProgramWishlistToggle}
												onClick={handleProgramClick}
											/>
										))}
									</div>

									{/* No Results */}
									{eligibilityPrograms.length === 0 && (
										<div className="text-center py-12">
											<p className="text-gray-500 text-lg mb-2">
												No programmes found
											</p>
											<p className="text-gray-400 text-sm">
												Try adjusting your filters
											</p>
										</div>
									)}

									{/* Pagination */}
									{eligibilityProgramsTotalPages > 1 && (
										<Pagination
											currentPage={eligibilityProgramsPage}
											totalPages={eligibilityProgramsTotalPages}
											onPageChange={setEligibilityProgramsPage}
										/>
									)}
								</>
							)}
						</div>
					</div>
				</motion.div>
				{/* -----------------------------------------------Apply Content---------------------------------------------- */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className=" p-8  bg-white py-6 shadow-xl border"
				>
					<h2 className="text-3xl font-bold mb-6">Apply here !</h2>

					<div className="text-gray-600 mb-6">
						{currentScholarship?.requiredDocuments &&
						currentScholarship.requiredDocuments.length > 0 ? (
							<div className="space-y-3">
								{currentScholarship.requiredDocuments.map((doc: any) => (
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
						{currentScholarship?.requiredDocuments &&
						currentScholarship.requiredDocuments.length > 0 ? (
							// Show specific upload areas for each required document
							currentScholarship.requiredDocuments.map((doc: any) => {
								const filesForThisType = uploadedFiles.filter(
									(file) => file.documentType === doc.id
								)
								return (
									<div key={doc.id} className="space-y-2 mb-4">
										<label className="text-sm font-medium text-gray-700">
											{doc.name}
											{filesForThisType.length > 0 && (
												<span className="ml-2 text-xs text-green-600">
													({filesForThisType.length} file
													{filesForThisType.length !== 1 ? 's' : ''})
												</span>
											)}
										</label>
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
													Click here to upload {doc.name}
												</label>
											</div>
										</div>
									</div>
								)
							})
						) : (
							// Show general upload area when no specific documents required
							<div className="space-y-2">
								<label className="text-sm font-medium text-gray-700">
									Upload Documents
									{uploadedFiles.length > 0 && (
										<span className="ml-2 text-xs text-green-600">
											({uploadedFiles.length} file
											{uploadedFiles.length !== 1 ? 's' : ''})
										</span>
									)}
								</label>
								<div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
									<div className="text-4xl mb-4">📁</div>
									<div className="space-y-2">
										<input
											type="file"
											multiple
											onChange={(e) => handleFileUpload(e)}
											className="hidden"
											id="file-upload-general"
										/>
										<label
											htmlFor="file-upload-general"
											className="text-sm text-[#126E64] cursor-pointer hover:underline block"
										>
											Click here to upload files
										</label>
										<p className="text-xs text-gray-500">
											Upload any supporting documents for your application
										</p>
									</div>
								</div>
							</div>
						)}
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
							disabled={hasApplied || isApplying || isUploading}
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
							) : (
								'Submit Application'
							)}
						</Button>
					</div>
				</motion.div>
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className=" p-8  bg-white py-6 shadow-xl border"
				>
					<h2 className="text-3xl font-bold mb-6">Recommend for you</h2>

					{mockScholarships.length > 0 ? (
						<div className="relative h-[800px] overflow-y-auto overflow-x-hidden">
							{/* Navigation Buttons */}
							{/* Programs Grid */}{' '}
							{mockScholarships.slice(0, 9).map((scholarship, index) => (
								<div key={scholarship.id} className="">
									<div className="mb-7">
										<ScholarshipCard
											scholarship={scholarship}
											index={index}
											isWishlisted={scholarshipWishlist.includes(
												scholarship.id
											)}
											onWishlistToggle={handleScholarshipWishlistToggle}
											onClick={handleScholarshipClick}
										/>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-8">
							<p className="text-gray-600">No recommendations available</p>
						</div>
					)}
				</motion.div>
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

			{/* Authentication Required Modal */}
			<ErrorModal
				isOpen={showAuthModal}
				onClose={() => setShowAuthModal(false)}
				title="Authentication Required"
				message="You need to sign in to add items to your wishlist. Please sign in to your account or create a new one."
				buttonText="Sign In"
				onButtonClick={handleSignIn}
				showSecondButton={true}
				secondButtonText="Sign Up"
				onSecondButtonClick={handleSignUp}
				showCloseButton={true}
			/>
		</div>
	)
}

export default ScholarshipDetail
