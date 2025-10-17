'use client'
import {
	Breadcrumb,
	Button,
	Modal,
	Pagination,
	ProgramCard,
	ScholarshipCard,
} from '@/components/ui'

import { mockPrograms, mockScholarships } from '@/data/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, GraduationCap, Heart } from 'lucide-react'
import Image from 'next/image'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { applicationService } from '@/lib/application-service'
import { useWishlist } from '@/hooks/useWishlist'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useNotification } from '@/contexts/NotificationContext'
import { useApiWrapper } from '@/lib/api-wrapper'

const ProgramDetail = () => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const params = useParams()
	const [activeTab, setActiveTab] = useState('overview')
	const [currentPage, setCurrentPage] = useState(1)
	const [carouselIndex, setCarouselIndex] = useState(0)
	const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
	const [showManageModal, setShowManageModal] = useState(false)
	const [isClosing, setIsClosing] = useState(false)
	const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)

	// Document type categories
	const documentTypes = [
		{
			id: 'research-proposal',
			label: 'Research Proposal',
			key: 'research-proposal',
		},
		{ id: 'cv-resume', label: 'CV/Resume', key: 'cv-resume' },
		{ id: 'portfolio', label: 'Portfolio', key: 'portfolio' },
	]

	// S3 File upload functionality
	const { uploadFiles, isUploading, uploadProgress } = useFileUpload({
		category: 'application-documents',
		onProgress: (progress) => {
			console.log('Upload progress:', progress)
		},
	})
	const [currentProgram, setCurrentProgram] = useState<any>(null)
	const [breadcrumbItems, setBreadcrumbItems] = useState<
		Array<{ label: string; href?: string }>
	>([{ label: 'Explore', href: '/explore' }, { label: 'Program Detail' }])

	// Application state
	const [hasApplied, setHasApplied] = useState(false)
	const [isApplying, setIsApplying] = useState(false)
	const [isCheckingApplication, setIsCheckingApplication] = useState(false)

	// Wishlist functionality
	const { isInWishlist, toggleWishlistItem } = useWishlist()

	// Notification system
	const { showSuccess, showError } = useNotification()
	const apiWrapper = useApiWrapper()

	// Dynamic info items based on current program data
	const infoItems = [
		{
			label: 'Tuition fee',
			value: currentProgram?.tuitionFee || '100000000$/ year',
		},
		{ label: 'Duration', value: currentProgram?.duration || '2 years' },
		{
			label: 'Application deadline',
			value: currentProgram?.applicationDeadline || '11/12/2024',
		},
		{ label: 'Start Date', value: currentProgram?.startDate || '11/12/2024' },
		{
			label: 'Location',
			value: currentProgram?.location || 'Bangkok, Thailand',
		},
	]

	const itemsPerPage = 3
	const totalPages = Math.ceil(mockScholarships.length / itemsPerPage)
	const programsPerPage = 3
	const totalPrograms = mockPrograms.length

	// Dynamic breadcrumb based on referrer and context
	useEffect(() => {
		const updateBreadcrumb = () => {
			// Get program ID from URL params
			const programId = params.id as string

			// Get the 'from' parameter from search params to know which tab we came from
			const fromTab = searchParams.get('from') || 'programmes'

			// Find the program data (in real app, this would be an API call)
			const foundProgram = mockPrograms.find(
				(program) => program.id.toString() === programId
			)

			if (foundProgram) {
				setCurrentProgram(foundProgram)
			}

			const programName = foundProgram?.title || 'Information Technology'

			let items: Array<{ label: string; href?: string }> = [
				{ label: 'Explore', href: '/explore' },
			]

			// Add intermediate breadcrumb based on where we came from
			if (fromTab === 'scholarships') {
				items.push({
					label: 'Scholarships',
					href: '/explore?tab=scholarships',
				})
			} else if (fromTab === 'research') {
				items.push({
					label: 'Research Labs',
					href: '/explore?tab=research',
				})
			} else {
				items.push({
					label: 'Programmes',
					href: '/explore?tab=programmes',
				})
			}

			// Add current page (non-clickable)
			items.push({ label: programName })

			setBreadcrumbItems(items)
		}

		updateBreadcrumb()
	}, [params.id, searchParams])

	// Check for existing application when component loads
	useEffect(() => {
		const programId = currentProgram?.id || params.id
		if (programId) {
			checkExistingApplication(programId as string)
		}
	}, [currentProgram, params.id])

	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
		documentType: string
	) => {
		const files = event.target.files
		if (files && files.length > 0) {
			try {
				// Upload files to S3
				const uploadedFileData = await uploadFiles(Array.from(files))

				// Add uploaded files to state with document type
				if (uploadedFileData) {
					const filesWithType = uploadedFileData.map((file) => ({
						...file,
						documentType: documentType,
					}))
					setUploadedFiles((prev) => [...prev, ...filesWithType])
				}
				showSuccess(
					'Files Uploaded Successfully',
					`${uploadedFileData?.length || 0} file(s) have been uploaded successfully.`
				)
			} catch (error) {
				console.error('❌ Failed to upload files to S3:', error)
				showError(
					'Upload Failed',
					'Failed to upload files. Please try again.',
					{
						onRetry: () => handleFileUpload(event, documentType),
						showRetry: true,
						retryText: 'Retry Upload',
					}
				)
			}
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

	const nextSlide = () => {
		setCarouselIndex((prev) =>
			prev + programsPerPage >= totalPrograms ? 0 : prev + programsPerPage
		)
	}

	const prevSlide = () => {
		setCarouselIndex((prev) =>
			prev - programsPerPage < 0
				? Math.max(0, totalPrograms - programsPerPage)
				: prev - programsPerPage
		)
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
		// Get current tab context from referrer or default to programmes
		const referrer = document.referrer
		let fromTab = 'programmes'
		if (referrer.includes('tab=scholarships')) {
			fromTab = 'scholarships'
		} else if (referrer.includes('tab=research')) {
			fromTab = 'research'
		}

		router.push(`/explore/${programId}?from=${fromTab}`)
	}

	const handleScholarshipClick = (scholarshipId: string) => {
		router.push(`/explore/scholarships/${scholarshipId}?from=scholarships`)
	}

	// Check if user has already applied to this post
	const checkExistingApplication = async (programId: string) => {
		try {
			setIsCheckingApplication(true)
			const response = await applicationService.getApplications({
				page: 1,
				limit: 100, // Get more applications to search through
			})

			if (
				response.success &&
				response.applications &&
				response.applications.length > 0
			) {
				// Check if any application is for this specific post
				const existingApplication = response.applications.find(
					(app) => app.postId === programId
				)

				if (existingApplication) {
					setHasApplied(true)
					return true
				}
			}
			return false
		} catch (error) {
			console.error('Failed to check existing application:', error)
			return false
		} finally {
			setIsCheckingApplication(false)
		}
	}

	// Handle application submission
	const handleApply = async () => {
		// Use program ID from URL params as fallback
		const programId = currentProgram?.id || params.id
		if (!programId) {
			console.log('❌ No program ID found')
			return
		}

		// Check if already applied
		if (hasApplied) {
			showError(
				'Already Applied',
				'You have already applied to this program. You cannot submit multiple applications.',
				{
					showRetry: false,
				}
			)
			return
		}

		try {
			setIsApplying(true)

			const response = await applicationService.submitApplication({
				postId: programId,
				documents: uploadedFiles.map((file) => ({
					documentTypeId: file.documentType || getDocumentType(file.name), // Use stored document type or fallback to filename detection
					name: file.name,
					url: file.url, // S3 URL from upload
					size: file.size,
				})),
			})

			if (response.success) {
				setHasApplied(true)
				showSuccess(
					'Application Submitted!',
					'Your application has been submitted successfully. You will receive updates via email.'
				)
			} else {
				showError(
					'Application Failed',
					response.error || 'Failed to submit application. Please try again.',
					{
						onRetry: handleApply,
						showRetry: true,
						retryText: 'Retry',
					}
				)
			}
		} catch (error: any) {
			console.error('Failed to submit application:', error)

			// Handle specific "already applied" error
			if (error.message && error.message.includes('already applied')) {
				setHasApplied(true)
				showError(
					'Already Applied',
					'You have already applied to this program. You cannot submit multiple applications.',
					{
						showRetry: false,
					}
				)
			} else {
				showError(
					'Application Error',
					'An unexpected error occurred. Please try again.',
					{
						onRetry: handleApply,
						showRetry: true,
						retryText: 'Retry',
					}
				)
			}
		} finally {
			setIsApplying(false)
		}
	}

	// Handle wishlist toggle
	const handleWishlistToggle = async () => {
		const programId = currentProgram?.id || params.id
		if (!programId) return

		try {
			await toggleWishlistItem(programId)
			const isWishlisted = isInWishlist(programId)
			showSuccess(
				isWishlisted ? 'Added to Wishlist' : 'Removed from Wishlist',
				isWishlisted
					? 'This program has been added to your wishlist.'
					: 'This program has been removed from your wishlist.'
			)
		} catch (error) {
			console.error('Failed to toggle wishlist item:', error)
			showError(
				'Wishlist Error',
				'Failed to update wishlist. Please try again.',
				{
					onRetry: handleWishlistToggle,
					showRetry: true,
					retryText: 'Retry',
				}
			)
		}
	}

	// Helper function to determine document type based on file name
	const getDocumentType = (fileName: string): string => {
		const lowerName = fileName.toLowerCase()

		if (lowerName.includes('cv') || lowerName.includes('resume')) {
			return 'cv-resume'
		} else if (
			lowerName.includes('transcript') ||
			lowerName.includes('academic')
		) {
			return 'transcript'
		} else if (
			lowerName.includes('certificate') ||
			lowerName.includes('cert')
		) {
			return 'certificate'
		} else if (
			lowerName.includes('proposal') ||
			lowerName.includes('research')
		) {
			return 'research-proposal'
		} else if (lowerName.includes('portfolio')) {
			return 'portfolio'
		} else if (
			lowerName.includes('letter') ||
			lowerName.includes('recommendation')
		) {
			return 'recommendation-letter'
		} else if (
			lowerName.includes('statement') ||
			lowerName.includes('motivation')
		) {
			return 'personal-statement'
		} else {
			return 'application-document'
		}
	}

	const menuItems = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'structure', label: 'Programme structure' },
		{ id: 'admission', label: 'Admission requirements' },
		{ id: 'fee', label: 'Fee and funding' },
		{ id: 'scholarship', label: 'Scholarship' },
		{ id: 'other', label: 'Other information' },
	]

	const renderTabContent = () => {
		switch (activeTab) {
			case 'overview':
				return (
					<div className="space-y-4">
						<ol className="space-y-4">
							<li className="text-base">
								<span className="font-bold text-gray-900">1. Duration:</span>{' '}
								<span className="text-gray-700">2 years</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">2. Start dates:</span>{' '}
								<span className="text-gray-700">October 2025</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">
									3. Application deadlines:
								</span>{' '}
								<span className="text-gray-700">before Sep 2025</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">
									4. Subdiscipline:
								</span>{' '}
								<span className="text-gray-700">Information system</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">5. Attendance:</span>{' '}
								<span className="text-gray-700">At campus</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">6. Location:</span>{' '}
								<span className="text-gray-700">Jerusalem, Israel</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">
									7. Degree level:
								</span>{' '}
								<span className="text-gray-700">Master</span>
							</li>
						</ol>
					</div>
				)

			case 'structure':
				return (
					<div className="space-y-6">
						<div>
							<p className="text-base mb-2">
								<span className="font-bold text-gray-900">Subdiscipline:</span>{' '}
								<span className="text-gray-700">Information system</span>
							</p>
						</div>

						<div>
							<p className="font-bold text-gray-900 mb-3">Courses include:</p>
							<ul className="list-disc pl-5 space-y-2 text-gray-700">
								<li>Strategy and Governance in IT</li>
								<li>Project Management</li>
								<li>Information Security</li>
								<li>Digital Design and Development</li>
								<li>Group Software Development Project</li>
								<li>Cloud Computing</li>
							</ul>
						</div>

						<div>
							<p className="text-base">
								<span className="font-bold text-gray-900">Credits:</span>{' '}
								<span className="text-gray-700">180 alternative credits</span>
							</p>
						</div>
					</div>
				)

			case 'admission':
				return (
					<div className="space-y-6">
						<div>
							<p className="font-bold text-gray-900 mb-3">
								Academic requirements:
							</p>
							<ul className="list-disc pl-5 space-y-1 text-gray-700">
								<li>GPA: 3.0</li>
								<li>GRE: 170</li>
							</ul>
						</div>

						<div>
							<p className="font-bold text-gray-900 mb-3">
								Language requirements:
							</p>
							<ul className="list-disc pl-5 space-y-1 text-gray-700">
								<li>
									English:
									<ul className="list-disc pl-5 mt-1">
										<li>IELTS: 6.0</li>
										<li>TOEFL: 78</li>
									</ul>
								</li>
								<li>Chinese: HSK 3</li>
							</ul>
						</div>

						<div>
							<p className="font-bold text-gray-900 mb-3">
								Other requirements:
							</p>
							<ul className="list-disc pl-5 space-y-2 text-gray-700">
								<li>We normally require an honours degree of 2.2 or above.</li>
								<li>
									You need to have some knowledge of computing, either from your
									first degree or work/voluntary experience, which you should
									outline in your application.
								</li>
								<li>
									If you do not meet the above grade requirements but have at
									least 12 months relevant professional experience and/ or
									equivalent qualifications, we will consider you on an
									individual basis.
								</li>
								<li>
									International and EU applicants are required to have a minimum
									overall IELTS (Academic) score of 6.5 with 5.5 in each
									component (or approved equivalent*).
								</li>
							</ul>
						</div>

						<div>
							<p className="font-bold text-gray-900 mb-3">Student insurance:</p>
							<p className="text-gray-700 mb-3">
								Make sure to cover your health, travel, and stay while studying
								abroad. Even global coverages can miss important items, so make
								sure your student insurance ticks all the following:
							</p>
							<ul className="list-disc pl-5 space-y-1 text-gray-700">
								<li>Additional medical costs (i.e. dental)</li>
								<li>
									Repatriation, if something happens to you or your family
								</li>
								<li>Liability</li>
								<li>Home contents and baggage</li>
								<li>Accidents</li>
								<li>Legal aid</li>
							</ul>
							<p className="text-gray-700 mt-3">
								<span className="font-semibold">
									Remember, countries and universities may have specific
									insurance requirements.
								</span>{' '}
								To learn more about how student insurance work at UWE Bristol
								(University of the West of England) and/or in United Kingdom
							</p>
						</div>
					</div>
				)

			case 'fee':
				return (
					<div className="space-y-6">
						<div>
							<p className="font-bold text-gray-900 mb-2">Tuition Fee:</p>
							<ul className="list-disc pl-5 text-gray-700">
								<li>International: 615,708,011 VND/year</li>
							</ul>
						</div>

						<div>
							<p className="font-bold text-gray-900 mb-2">
								Living costs for Bristol:{' '}
								<span className="font-normal text-gray-700">
									26,769,914-44,973,455 VND/month
								</span>
							</p>
							<p className="text-gray-700">
								<span className="font-semibold">Living costs:</span> The living
								costs include the total expenses per month, covering
								accommodation, public transportation, utilities (electricity,
								internet), books and groceries.
							</p>
						</div>
					</div>
				)

			case 'scholarship':
				const startIndex = (currentPage - 1) * itemsPerPage
				const endIndex = startIndex + itemsPerPage
				const currentScholarships = mockScholarships.slice(startIndex, endIndex)

				return (
					<div className="space-y-6">
						<div>
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								Scholarships Information:
							</h3>
							<p className="text-gray-700 mb-6">
								Lorem Ipsum is simply dummy text of the printing and typesetting
								industry. Lorem Ipsum has been the industry&apos;s standard
								dummy text ever since the 1500s Lorem Ipsum is simply dummy text
								of the printing and typesetting industry. Lorem Ipsum has been
								the industry&apos;s standard dummy text ever since the 1500s.
							</p>
						</div>

						<div>
							<h4 className="text-lg font-bold text-gray-900 mb-4">
								Available Scholarships:
							</h4>
							<p className="text-sm text-gray-600 mb-4">
								You are eligible to apply for these scholarships but a selection
								process will still be applied by the provider.
							</p>

							<div className="space-y-4">
								{currentScholarships.map((scholarship, index) => (
									<ScholarshipCard
										key={scholarship.id}
										scholarship={scholarship}
										index={index}
										isWishlisted={isInWishlist(scholarship.id)}
										onWishlistToggle={() => toggleWishlistItem(scholarship.id)}
										onClick={handleScholarshipClick}
									/>
								))}
							</div>

							{totalPages > 1 && (
								<div className="mt-6">
									<Pagination
										currentPage={currentPage}
										totalPages={totalPages}
										onPageChange={setCurrentPage}
									/>
								</div>
							)}
						</div>
					</div>
				)

			case 'other':
				return (
					<div className="space-y-6">
						<div>
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								Contact Information:
							</h3>
							<p className="text-gray-700 mb-6">
								Lorem Ipsum is simply dummy text of the printing and typesetting
								industry. Lorem Ipsum has been the industry&apos;s standard
								dummy text ever since the 1500s Lorem Ipsum is simply dummy text
								of the printing and typesetting industry. Lorem Ipsum has been
								the industry&apos;s standard dummy text ever since the 1500s.
							</p>
						</div>
					</div>
				)

			default:
				return null
		}
	}

	return (
		<div className="min-h-screen  bg-background">
			{/* --------------------------------------------------------------------------------------------- */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="relative h-[500px] w-full"
			>
				<Image
					src="https://vcdn1-vnexpress.vnecdn.net/2023/07/28/hoc-vien3-1690476448-4686-1690477817.jpg?w=1200&h=0&q=100&dpr=1&fit=crop&s=T1naMvwNebHJRgrlo54Jbw"
					alt="Army West University"
					fill
					className="object-cover"
					priority
				/>

				<div className="container mx-auto px-4 h-full relative">
					<motion.div
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ delay: 0.2 }}
						className="absolute bottom-0 right-4 translate-y-1/3 bg-white rounded-2xl shadow-xl p-8 max-w-lg flex flex-col justify-center items-center"
					>
						<h1 className="text-3xl font-bold mb-2">
							{currentProgram?.title || 'Information Technology'}
						</h1>
						<p className="text-gray-600 mb-6">
							{currentProgram?.university || 'Army West University (AWU)'}
						</p>

						<div className="flex items-center gap-3 mb-4">
							<Button className="">Visit website</Button>
							{/* <Button
								className={
									hasApplied
										? 'bg-green-600 hover:bg-green-700'
										: 'bg-[#116E63] hover:bg-teal-700'
								}
								onClick={handleApply}
								disabled={hasApplied || isApplying}
							>
								{hasApplied ? (
									'✓ Applied'
								) : isApplying ? (
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
										Applying...
									</div>
								) : (
									'Apply'
								)}
							</Button> */}
							<motion.button
								onClick={(e) => {
									e.preventDefault()
									e.stopPropagation()
									handleWishlistToggle()
								}}
								className="p-2 rounded-full transition-all duration-200 hover:bg-gray-50"
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.9 }}
							>
								<Heart
									className={`w-6 h-6 transition-all duration-200 ${
										isInWishlist(currentProgram?.id || params.id)
											? 'fill-red-500 text-red-500'
											: 'text-gray-400 hover:text-red-500'
									}`}
								/>
							</motion.button>
						</div>

						<p className="text-sm text-gray-500">Number of applications: 30</p>
					</motion.div>
				</div>
			</motion.div>
			{/* --------------------------------------------------------------------------------------------- */}
			<motion.div
				className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<div className="mb-6">
					<Breadcrumb items={breadcrumbItems} />
				</div>
				<motion.div
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
				</motion.div>
				{/* -----------------------------------------------About Content---------------------------------------------- */}

				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className=" p-8  bg-white py-6 shadow-xl border"
				>
					<h2 className="text-3xl font-bold mb-6">About</h2>

					<div className="prose max-w-none text-gray-700 space-y-4">
						<p>
							Throughout the Information Technology -MSc programme from UWE
							Bristol (University of the West of England), will develop the
							knowledge and skills necessary to collate information, define,
							design and build or select the most appropriate IT solutions and
							develop a deeper understanding of how those solutions apply to
							professional contexts.
						</p>

						<p className="font-semibold">Career opportunities:</p>

						<ul className="list-disc pl-5 space-y-2">
							<li>
								UWE Bristol monitors its employment trends closely, and since
								1986, we have ensured graduates of this course are equipped for
								the demands of the real world and are highly regarded by
								potential employers.
							</li>
							<li>
								There is a growing need for creative IT graduates who can work
								with an ever-widening range of technologies and can meet
								organisational needs in business, education and health. This
								newly designed course tackles the challenges of technology in
								modern business and society, head on.
							</li>
							<li>
								Our award-winning careers service helps you develop your
								employment potential through career coaching, a vacancy service
								for internships, placements, jobs, global opportunities,
								volunteering and community activity plus support for
								entrepreneurial activity, and access to employer events.
							</li>
						</ul>

						<p className="flex items-center gap-2 text-[#126E64] font-medium mt-6">
							<GraduationCap className="w-5 h-5" />
							Supervisor: Tran Thanh Nguyen
						</p>
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
					className=" p-8  bg-white py-6 shadow-xl border"
				>
					<h2 className="text-3xl font-bold mb-6">Apply here !</h2>
					<p className="text-gray-600 mb-6">
						You can upload required documents here. We will send documents and
						your academic information to university.
					</p>

					{/* File Upload Area */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
						{documentTypes.map((docType, index) => {
							const filesForThisType = uploadedFiles.filter(
								(file) => file.documentType === docType.id
							)
							return (
								<div key={docType.id} className="space-y-2">
									<label className="text-sm font-medium text-gray-700">
										{docType.label}
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
												onChange={(e) => handleFileUpload(e, docType.id)}
												className="hidden"
												id={`file-upload-${docType.id}`}
											/>
											<label
												htmlFor={`file-upload-${docType.id}`}
												className="text-sm text-[#126E64] cursor-pointer hover:underline block"
											>
												Click here to upload file
											</label>
										</div>
									</div>

									{/* Show uploaded files for this document type */}
									{filesForThisType.length > 0 && (
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
									)}
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
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className=" p-8  bg-white py-6 shadow-xl border"
				>
					<h2 className="text-3xl font-bold mb-6">Recommend for you</h2>

					{/* Carousel */}
					<div className="relative">
						{/* Navigation Buttons */}
						<button
							onClick={prevSlide}
							className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
							disabled={carouselIndex === 0}
						>
							<ChevronLeft className="w-6 h-6 text-gray-600" />
						</button>

						<button
							onClick={nextSlide}
							className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
							disabled={carouselIndex + programsPerPage >= totalPrograms}
						>
							<ChevronRight className="w-6 h-6 text-gray-600" />
						</button>

						{/* Programs Grid */}
						<div className="overflow-hidden px-12 py-5">
							<div
								className="flex transition-transform duration-300 ease-in-out"
								style={{
									transform: `translateX(-${(carouselIndex / programsPerPage) * 100}%)`,
								}}
							>
								{mockPrograms.map((program, index) => (
									<div key={program.id} className="w-1/3 flex-shrink-0 px-3">
										<div className="h-[600px]">
											<ProgramCard
												program={program}
												index={index}
												isWishlisted={isInWishlist(program.id)}
												onWishlistToggle={() => toggleWishlistItem(program.id)}
												onClick={handleProgramClick}
											/>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Dots Indicator */}
						<div className="flex justify-center mt-6 gap-2">
							{Array.from({
								length: Math.ceil(totalPrograms / programsPerPage),
							}).map((_, index) => (
								<button
									key={index}
									onClick={() => setCarouselIndex(index * programsPerPage)}
									className={`w-3 h-3 rounded-full transition-colors ${
										Math.floor(carouselIndex / programsPerPage) === index
											? 'bg-[#126E64]'
											: 'bg-gray-300'
									}`}
								/>
							))}
						</div>
					</div>
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
							{/* Uploaded Files Section - Grouped by Document Type */}
							{uploadedFiles.length > 0 && (
								<div className="space-y-6">
									<h3 className="text-lg font-medium text-foreground border-b pb-2">
										Uploaded Files ({uploadedFiles.length})
									</h3>
									{documentTypes.map((docType) => {
										const filesForThisType = uploadedFiles.filter(
											(file) => file.documentType === docType.id
										)
										if (filesForThisType.length === 0) return null

										return (
											<div key={docType.id} className="space-y-3">
												<h4 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-1">
													{docType.label} ({filesForThisType.length})
												</h4>
												<div className="grid grid-cols-1 gap-3">
													{filesForThisType.map((file) => (
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
																	size="sm"
																	onClick={() => {
																		// Open S3 file URL in new tab
																		window.open(file.url, '_blank')
																	}}
																>
																	View
																</Button>
																<Button
																	variant="outline"
																	size="sm"
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
										)
									})}
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

export default ProgramDetail
