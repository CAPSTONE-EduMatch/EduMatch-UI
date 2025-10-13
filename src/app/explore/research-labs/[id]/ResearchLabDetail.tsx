'use client'
import { Button } from '@/components/ui'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { FilterSidebar } from '@/components/ui/FilterSidebar'
import Modal from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { ProgramCard } from '@/components/ui/ProgramCard'
import { ResearchLabCard } from '@/components/ui/ResearchLabCard'
import { ScholarshipCard } from '@/components/ui/ScholarshipCard'
import { mockPrograms, mockResearchLabs, mockScholarships } from '@/data/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const infoItems = [
	{ label: 'Salary', value: 'Up to $2000' },
	{ label: 'Country', value: 'Italy' },
	{ label: 'Job type', value: 'Researcher' },
	{ label: 'Application deadline', value: '07/07/2026' },
	{ label: 'Work location', value: 'District 3, Ho Chi Minh City, Viet Nam' },
]

const ResearchLabDetail = () => {
	const router = useRouter()
	const [isWishlisted, setIsWishlisted] = useState(false)
	const [activeTab, setActiveTab] = useState('job-description')
	const [researchLabWishlist, setResearchLabWishlist] = useState<number[]>([])

	const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
	const [showManageModal, setShowManageModal] = useState(false)
	const [isClosing, setIsClosing] = useState(false)
	const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
	const [breadcrumbItems, setBreadcrumbItems] = useState<
		Array<{ label: string; href?: string }>
	>([{ label: 'Explore', href: '/explore' }, { label: 'Research Lab Detail' }])

	// Dynamic breadcrumb based on referrer and context
	useEffect(() => {
		const updateBreadcrumb = () => {
			const referrer = document.referrer
			const labName = 'AI Research Lab' // This should come from props or API data

			let items: Array<{ label: string; href?: string }> = [
				{ label: 'Explore', href: '/explore' },
			]

			// Check if came from a specific tab in explore
			if (referrer.includes('/explore')) {
				const urlParams = new URLSearchParams(window.location.search)
				const fromTab = urlParams.get('from') || 'research'

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
			}

			// Add current page (non-clickable)
			items.push({ label: labName })

			setBreadcrumbItems(items)
		}

		updateBreadcrumb()
	}, [])

	const handleRResearchLabWishlistToggle = (researchLabId: number) => {
		setResearchLabWishlist((prev) =>
			prev.includes(researchLabId)
				? prev.filter((id) => id !== researchLabId)
				: [...prev, researchLabId]
		)
	}

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files
		if (files) {
			const fileArray = Array.from(files).map((file, index) => ({
				id: Date.now() + index,
				name: file.name,
				size: file.size,
				type: file.type,
				file: file,
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

	const handleResearchLabClick = (researchLabId: number) => {
		// Navigate to research lab detail page
		router.push(`/explore/research-labs/${researchLabId}?from=research`)
	}

	const menuItems = [
		{ id: 'job-description', label: 'Job description' },
		{ id: 'offer-information', label: 'Offer information' },
		{ id: 'job-requirements', label: 'Job requirements' },
		{ id: 'other-information', label: 'Other information' },
	]

	const renderTabContent = () => {
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
									<li>Nutrition researcher</li>
									<li>Healthcare researcher</li>
								</ul>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">2. Start date:</span>{' '}
								<span className="text-gray-700">01/01/2026</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">
									3. Application deadline:
								</span>{' '}
								<span className="text-gray-700">01/02/2026</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">4. Country:</span>{' '}
								<span className="text-gray-700">Italy</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">
									5. Type of Contract:
								</span>{' '}
								<span className="text-gray-700">Temporary</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">6. Attendance:</span>{' '}
								<span className="text-gray-700">Full-time</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">7. Job type:</span>{' '}
								<span className="text-gray-700">Researcher</span>
							</li>
							<li className="text-base">
								<span className="font-bold text-gray-900">
									8. Detail description:
								</span>
								<ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700">
									<li>
										Hỗ trợ Viện trưởng trong công tác quản lý, điều hành hoạt
										động chung của Viện;
									</li>
									<li>
										Phụ trách, chỉ đạo các mảng công tác được Viện trưởng phân
										công, bao gồm nghiên cứu khoa học, đào tạo sau đại học, hợp
										tác quốc tế:
									</li>
									<ul className="list-disc pl-5 mt-1 space-y-1">
										<li>
											Xây dựng và triển khai các chiến lược phát triển chuyên
											môn của Viện;
										</li>
										<li>
											Đại diện Viện trong các hoạt động hợp tác học thuật trong
											và ngoài nước;
										</li>
										<li>
											Thực hiện các nhiệm vụ khác theo phân công của Viện trưởng
											và quy định của Đại học.
										</li>
									</ul>
								</ul>
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
								<span className="text-gray-700">Up to $2000</span>
							</p>
						</div>

						<div>
							<p className="font-bold text-gray-900 mb-3">Benefit:</p>
							<ul className="list-disc pl-5 space-y-2 text-gray-700">
								<li>
									With us, you will experience the dynamic interaction between
									higher education and research that makes Stockholm University
									an exciting and creative environment. You will work in an
									international environment and get favourable conditions. The
									university is located in the National City Park with good
									transport links to the city.
								</li>
								<li>
									Stockholm University strives to be a workplace free from
									discrimination and with equal opportunities for all.
								</li>
							</ul>
						</div>
					</div>
				)

			case 'job-requirements':
				return (
					<div className="space-y-6">
						<div>
							<p className="text-base mb-4">
								<span className="font-bold text-gray-900">
									1. Main responsibilities:
								</span>{' '}
								<span className="text-gray-700">
									The observational projects will involve analysis of both
									imaging and spectroscopic data obtained from JWST, HST, and
									other observatories. The theoretical projects will involve
									hydrodynamical studies of galaxies or modelling of the
									intergalactic medium.
								</span>
							</p>
						</div>

						<div>
							<p className="font-bold text-gray-900 mb-3">
								2. Qualification requirements:
							</p>
							<ul className="list-disc pl-5 space-y-2 text-gray-700">
								<li>
									For employment as a postdoctoral researcher, applicants are
									required to hold a Swedish doctoral degree or an equivalent
									relevant degree from another country. The degree must have
									been completed within the employment decision is made.
								</li>
								<li>Required Level: Recognised Researcher (R2)</li>
							</ul>
						</div>

						<div>
							<p className="font-bold text-gray-900 mb-3">
								3. Experience requirements:
							</p>
							<p className="text-gray-700">
								Have more than 2 years experience in research field.
							</p>
						</div>

						<div>
							<p className="font-bold text-gray-900 mb-3">
								4. Assessment criteria:
							</p>
							<ul className="list-disc pl-5 space-y-2 text-gray-700">
								<li>
									It is considered an advantage to have demonstrated research
									independence for no more than three years prior to the
									application deadline. Under special circumstances, older
									degree may also be an advantage. Special circumstances refer
									to sick leave, parental leave, military service, clinical
									attachment or service assignments relevant to the subject
									area.
								</li>
								<li>
									In the appointment process, special attention will be given to
									research skills. Expertise concerning galaxies in the early
									universe or numerical simulations would be an advantage.
								</li>
							</ul>
						</div>

						<div>
							<p className="text-base">
								<span className="font-bold text-gray-900">
									5. Other requirements:
								</span>
							</p>
							<ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700">
								<li>Have a good health</li>
								<li>Can receive stress</li>
							</ul>
						</div>
					</div>
				)

			case 'other-information':
				return (
					<div className="space-y-6">
						<div>
							<p className="text-base mb-4">
								<span className="font-bold text-gray-900">1. Contact:</span>{' '}
								<span className="text-gray-700">
									Further information about the position can be obtained from
									Professor Garrelt Mellema, garrelt.mellema@astro.su.se and Dr.
									Angela Adamo, angela.adamo@astro.su.se
								</span>
							</p>
						</div>

						<div>
							<p className="text-base">
								<span className="font-bold text-gray-900">
									2. Work location:
								</span>{' '}
								<span className="text-gray-700">
									111 Street D1, District 3, Ho Chi Minh City, Viet Nam
								</span>
							</p>
						</div>
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
							<h1 className="text-3xl font-bold mb-2">Job&apos;s name</h1>
							<p className="text-gray-600 mb-6">Provided by: Lab&apos;s name</p>

							<div className="flex items-center gap-3 mb-4">
								<Button className="">Visit website</Button>
								<Button className="">Apply</Button>
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

							<p className="text-sm text-gray-500">Number of applications: 0</p>
						</div>
						<div className="w-1/2 grid grid-cols-2 gap-4">
							<div className="border border-[#116E63] p-5 rounded-xl flex flex-col justify-start">
								<span className="text-md text-gray-500">Salary</span>
								<span className="text-xl text-black font-bold">
									Up to $2000
								</span>
							</div>
							<div className="border border-[#116E63] p-5 rounded-xl flex flex-col justify-start">
								<span className="text-md text-gray-500">Country</span>
								<span className="text-xl text-black font-bold">Italy</span>
							</div>
							<div className="border border-[#116E63] p-5 rounded-xl flex flex-col justify-start">
								<span className="text-md text-gray-500">Job type</span>
								<span className="text-xl text-black font-bold">Researcher</span>
							</div>
							<div className="border border-[#116E63] p-5 rounded-xl flex flex-col justify-start">
								<span className="text-md text-gray-500">
									Application deadline
								</span>
								<span className="text-xl text-black font-bold">07/07/2026</span>
							</div>
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

				{/* About Content */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="p-8 bg-white py-6 shadow-xl border"
				>
					<h2 className="text-3xl font-bold mb-6">About</h2>

					<div className="prose max-w-none text-gray-700 space-y-4">
						<p>
							The AI Research Lab at Cambridge University is a leading center
							for artificial intelligence research, focusing on cutting-edge
							developments in machine learning, computer vision, and natural
							language processing. Our lab brings together world-class
							researchers, graduate students, and industry partners to tackle
							some of the most challenging problems in AI.
						</p>

						<p className="font-semibold">Research Opportunities:</p>

						<ul className="list-disc pl-5 space-y-2">
							<li>
								Work with state-of-the-art equipment including NVIDIA DGX
								systems and high-performance computing clusters to develop
								next-generation AI algorithms.
							</li>
							<li>
								Collaborate with industry partners including Google, Microsoft,
								and IBM on real-world AI applications that have immediate impact
								on society.
							</li>
							<li>
								Our researchers publish regularly in top-tier venues such as
								NeurIPS, ICML, ICLR, and Nature journals, ensuring your work
								reaches the global AI community.
							</li>
						</ul>
					</div>
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

				{/* Apply Content */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="p-8 bg-white py-6 shadow-xl border"
				>
					<h2 className="text-3xl font-bold mb-6">Join our Research!</h2>
					<p className="text-gray-600 mb-6">
						Submit your research proposal and CV. We will review your
						application and contact you for potential research opportunities.
					</p>

					{/* File Upload Area */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
						{['Research Proposal', 'CV/Resume', 'Portfolio'].map(
							(label, index) => (
								<div key={index} className="space-y-2">
									<label className="text-sm font-medium text-gray-700">
										{label}
									</label>
									<div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
										<div className="text-4xl mb-4">📁</div>
										<div className="space-y-2">
											<input
												type="file"
												multiple
												onChange={handleFileUpload}
												className="hidden"
												id={`file-upload-${index}`}
											/>
											<label
												htmlFor={`file-upload-${index}`}
												className="text-sm text-[#126E64] cursor-pointer hover:underline block"
											>
												Click here to upload file
											</label>
										</div>
									</div>
								</div>
							)
						)}
					</div>

					{/* File Management */}
					{uploadedFiles.length > 0 && (
						<div className="bg-gray-50 rounded-lg p-4 mb-6">
							<div className="flex items-center justify-between mb-4">
								<span className="font-medium">
									Manage files: {uploadedFiles.length} file
									{uploadedFiles.length !== 1 ? 's' : ''}
								</span>
								<Button
									variant="outline"
									onClick={handleOpenModal}
									className="text-[#126E64] border-[#126E64] hover:bg-teal-50"
								>
									Manage Files
								</Button>
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
						<Button className="bg-[#126E64] hover:bg-teal-700 text-white">
							Submit Application
						</Button>
					</div>
				</motion.div>

				{/* Recommended Scholarships */}
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
