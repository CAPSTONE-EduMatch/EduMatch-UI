'use client'
import { Button } from '@/components/ui'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import Modal from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { ProgramCard } from '@/components/ui/ProgramCard'
import { ScholarshipCard } from '@/components/ui/ScholarshipCard'
import { mockPrograms, mockScholarships } from '@/data/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, GraduationCap, Heart } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'

const infoItems = [
	{ label: 'Tuition fee', value: '100000000$/ year' },
	{ label: 'Duration', value: '2 years' },
	{ label: 'Application deadline', value: '11/12/2024' },
	{ label: 'Start Date', value: '11/12/2024' },
	{ label: 'Location', value: 'Bangkok, Thailand' },
]

const ProgramDetail = () => {
	const router = useRouter()
	const [isWishlisted, setIsWishlisted] = useState(false)
	const [activeTab, setActiveTab] = useState('overview')
	const [scholarshipWishlist, setScholarshipWishlist] = useState<number[]>([])
	const [currentPage, setCurrentPage] = useState(1)
	const [programWishlist, setProgramWishlist] = useState<number[]>([])
	const [carouselIndex, setCarouselIndex] = useState(0)
	const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
	const [showManageModal, setShowManageModal] = useState(false)
	const [isClosing, setIsClosing] = useState(false)
	const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
	const [breadcrumbItems, setBreadcrumbItems] = useState<
		Array<{ label: string; href?: string }>
	>([{ label: 'Explore', href: '/explore' }, { label: 'Program Detail' }])
	const itemsPerPage = 3
	const totalPages = Math.ceil(mockScholarships.length / itemsPerPage)
	const programsPerPage = 3
	const totalPrograms = mockPrograms.length

	// Dynamic breadcrumb based on referrer and context
	useEffect(() => {
		const updateBreadcrumb = () => {
			const referrer = document.referrer
			const programName = 'Information Technology' // This should come from props or API data

			let items: Array<{ label: string; href?: string }> = [
				{ label: 'Explore', href: '/explore' },
			]

			// Check if came from a specific tab in explore
			if (referrer.includes('/explore')) {
				const urlParams = new URLSearchParams(window.location.search)
				const fromTab = urlParams.get('from') || 'programmes'

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
			}

			// Add current page (non-clickable)
			items.push({ label: programName })

			setBreadcrumbItems(items)
		}

		updateBreadcrumb()
	}, [])

	const handleWishlistToggle = (scholarshipId: number) => {
		setScholarshipWishlist((prev) =>
			prev.includes(scholarshipId)
				? prev.filter((id) => id !== scholarshipId)
				: [...prev, scholarshipId]
		)
	}

	const handleProgramWishlistToggle = (programId: number) => {
		setProgramWishlist((prev) =>
			prev.includes(programId)
				? prev.filter((id) => id !== programId)
				: [...prev, programId]
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

	const handleProgramClick = (programId: number) => {
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
										isWishlisted={scholarshipWishlist.includes(scholarship.id)}
										onWishlistToggle={handleWishlistToggle}
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
						<h1 className="text-3xl font-bold mb-2">Information Technology</h1>
						<p className="text-gray-600 mb-6">Army West University (AWU)</p>

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
						{[1, 2, 3].map((index) => (
							<div key={index} className="space-y-2">
								<label className="text-sm font-medium text-gray-700">
									Essay
								</label>
								<div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
									<div className="text-4xl mb-4">📁</div>
									<div className="space-y-2">
										{/* <p className="text-sm text-[#126E64] cursor-pointer hover:underline">
											Click here to upload file
										</p> */}
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
						))}
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

					{uploadedFiles.length === 0 && (
						<div className="flex gap-3 justify-center">
							<Button
								variant="outline"
								onClick={handleRemoveAllClick}
								className="text-red-500 border-red-500 hover:bg-red-50"
							>
								Remove all
							</Button>
							<Button className="bg-[#126E64] hover:bg-teal-700 text-white">
								Submit
							</Button>
						</div>
					)}

					{uploadedFiles.length > 0 && (
						<div className="flex gap-3 justify-center">
							<Button
								variant="outline"
								onClick={handleRemoveAllClick}
								className="text-red-500 border-red-500 hover:bg-red-50"
							>
								Remove all
							</Button>
							<Button className="bg-[#126E64] hover:bg-teal-700 text-white">
								Submit
							</Button>
						</div>
					)}
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
												isWishlisted={programWishlist.includes(program.id)}
												onWishlistToggle={handleProgramWishlistToggle}
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

export default ProgramDetail
