'use client'
import {
	Breadcrumb,
	Button,
	FilterSidebar,
	Modal,
	Pagination,
	ProgramCard,
	ScholarshipCard,
} from '@/components/ui'

import { mockPrograms, mockScholarships } from '@/data/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const ScholarshipDetail = () => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const params = useParams()
	const [isWishlisted, setIsWishlisted] = useState(false)
	const [activeTab, setActiveTab] = useState('detail')
	const [scholarshipWishlist, setScholarshipWishlist] = useState<string[]>([])
	const [programWishlist, setProgramWishlist] = useState<string[]>([])
	const [eligibilityProgramsPage, setEligibilityProgramsPage] = useState(1)
	const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
	const [showManageModal, setShowManageModal] = useState(false)
	const [isClosing, setIsClosing] = useState(false)
	const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
	const [currentScholarship, setCurrentScholarship] = useState<any>(null)
	const [breadcrumbItems, setBreadcrumbItems] = useState<
		Array<{ label: string; href?: string }>
	>([{ label: 'Explore', href: '/explore' }, { label: 'Scholarship Detail' }])

	// Dynamic info items based on current scholarship data
	const infoItems = [
		{
			label: 'Tuition fee',
			value: currentScholarship?.tuitionFee || '100000000$/ year',
		},
		{ label: 'Duration', value: currentScholarship?.duration || '2 years' },
		{
			label: 'Application deadline',
			value: currentScholarship?.applicationDeadline || '11/12/2024',
		},
		{
			label: 'Start Date',
			value: currentScholarship?.startDate || '11/12/2024',
		},
		{
			label: 'Location',
			value: currentScholarship?.location || 'Bangkok, Thailand',
		},
	]

	const eligibilityProgramsPerPage = 6
	const totalEligibilityPages = Math.ceil(
		mockPrograms.length / eligibilityProgramsPerPage
	)

	// Dynamic breadcrumb based on referrer and context
	useEffect(() => {
		const updateBreadcrumb = () => {
			// Get scholarship ID from URL params
			const scholarshipId = params.id as string

			// Get the 'from' parameter from search params to know which tab we came from
			const fromTab = searchParams.get('from') || 'scholarships'

			// Find the scholarship data (in real app, this would be an API call)
			const foundScholarship = mockScholarships.find(
				(scholarship) => scholarship.id.toString() === scholarshipId
			)

			if (foundScholarship) {
				setCurrentScholarship(foundScholarship)
			}

			const scholarshipName =
				foundScholarship?.title || 'Information Technology'

			let items: Array<{ label: string; href?: string }> = [
				{ label: 'Explore', href: '/explore' },
			]

			// Add intermediate breadcrumb based on where we came from
			if (fromTab === 'programmes') {
				items.push({
					label: 'Programmes',
					href: '/explore?tab=programmes',
				})
			} else if (fromTab === 'research') {
				items.push({
					label: 'Research Labs',
					href: '/explore?tab=research',
				})
			} else {
				items.push({
					label: 'Scholarships',
					href: '/explore?tab=scholarships',
				})
			}

			// Add current page (non-clickable)
			items.push({ label: scholarshipName })

			setBreadcrumbItems(items)
		}

		updateBreadcrumb()
	}, [params.id, searchParams])

	const handleProgramWishlistToggle = (id: string) => {
		setProgramWishlist((prev) =>
			prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
		)
	}

	const handleScholarshipWishlistToggle = (id: string) => {
		setScholarshipWishlist((prev) =>
			prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
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

	const handleProgramClick = (programId: string) => {
		// Navigate to programmes detail page
		router.push(`/explore/programmes/${programId}?from=scholarships`)
	}

	const handleScholarshipClick = (scholarshipId: string) => {
		// Navigate to scholarship detail page
		router.push(`/explore/scholarships/${scholarshipId}`)
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

			case 'eligibilty':
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

							<p className="text-sm text-gray-500">
								Number of applications: 30
							</p>
						</div>
						<div className="  w-1/2 grid grid-cols-2 gap-4">
							<div className="border border-[#116E63] p-5 rounded-xl flex flex-col justify-start">
								<span className="text-md text-gray-500">Grant</span>
								<span className="text-xl text-black font-bold">
									Various benefit
								</span>
							</div>
							<div className="border border-[#116E63] p-5 rounded-xl flex flex-col justify-start">
								<span className="text-md text-gray-500">Country</span>
								<span className="text-xl text-black font-bold">
									Various benefit
								</span>
							</div>
							<div className="border border-[#116E63] p-5 rounded-xl flex flex-col justify-start">
								<span className="text-md text-gray-500">Discipline</span>
								<span className="text-xl text-black font-bold">
									Various benefit
								</span>
							</div>
							<div className="border border-[#116E63] p-5 rounded-xl flex flex-col justify-start">
								<span className="text-md text-gray-500">
									Application deadline
								</span>
								<span className="text-xl text-black font-bold">
									Various benefit
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
						<FilterSidebar activeTab="programmes" />

						{/* Programs Content */}
						<div className="flex-1">
							{/* Results Count */}
							<div className="mb-4">
								<p className="text-gray-600">
									Showing {mockPrograms.length} programmes
								</p>
							</div>

							{/* Programs Grid */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
								{mockPrograms
									.slice(
										(eligibilityProgramsPage - 1) * eligibilityProgramsPerPage,
										eligibilityProgramsPage * eligibilityProgramsPerPage
									)
									.map((program, index) => (
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
							{mockPrograms.length === 0 && (
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
							{mockPrograms.length > 0 && (
								<Pagination
									currentPage={eligibilityProgramsPage}
									totalPages={totalEligibilityPages}
									onPageChange={setEligibilityProgramsPage}
								/>
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
					<p className="text-gray-600 mb-6">
						You can upload required documents here. We will send documents and
						your academic information to university.
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
		</div>
	)
}

export default ScholarshipDetail
