'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui'
import { SearchBar } from '@/components/ui'
import { SortDropdown, SortOption } from '@/components/ui'
import { Pagination } from '@/components/ui'
import { Heart, Calendar, FileText, Globe, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'

interface ApplicationSectionProps {
	profile: any
}

interface ApplicationItem {
	id: number
	university: string
	program: string
	degree: string
	country: string
	deadline: string
	status: 'submitted' | 'under-review' | 'accepted' | 'rejected' | 'cancelled'
	field: string
	attendance: string
	funding: string
	logo: string
	description: string
	daysLeft: number
}

export const ApplicationSection: React.FC<ApplicationSectionProps> = () => {
	const [currentPage, setCurrentPage] = useState(1)
	const [sortBy, setSortBy] = useState<SortOption>('newest')
	const [searchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [favoriteItems, setFavoriteItems] = useState<Set<number>>(new Set())

	// Mock data for applications - replace with actual API calls
	const allApplicationItems: ApplicationItem[] = useMemo(
		() => [
			{
				id: 1,
				university: 'Harvard University',
				program: 'Computer Science',
				degree: 'Master of Science',
				country: 'United States',
				deadline: '2025-01-15',
				status: 'submitted',
				field: 'Information System',
				attendance: 'Hybrid',
				funding: '234,567 USD / year',
				logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Harvard_University_logo.svg/1200px-Harvard_University_logo.svg.png',
				description:
					"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s Lorem Ipsum is simply dummy text of the printing....",
				daysLeft: 15,
			},
			{
				id: 2,
				university: 'Stanford University',
				program: 'Data Science',
				degree: 'Master of Science',
				country: 'United States',
				deadline: '2025-01-30',
				status: 'under-review',
				field: 'Data Analytics',
				attendance: 'On-campus',
				funding: '198,500 USD / year',
				logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Stanford_University_logo_%28seal%29.svg/1200px-Stanford_University_logo_%28seal%29.svg.png',
				description:
					"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s Lorem Ipsum is simply dummy text of the printing....",
				daysLeft: 30,
			},
			{
				id: 3,
				university: 'University of Cambridge',
				program: 'Artificial Intelligence',
				degree: 'Master of Philosophy',
				country: 'United Kingdom',
				deadline: '2025-02-15',
				status: 'accepted',
				field: 'Computer Science',
				attendance: 'Online',
				funding: '156,000 GBP / year',
				logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/University_of_Cambridge_coat_of_arms.svg/1200px-University_of_Cambridge_coat_of_arms.svg.png',
				description:
					"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s Lorem Ipsum is simply dummy text of the printing....",
				daysLeft: 45,
			},
			{
				id: 4,
				university: 'MIT',
				program: 'Machine Learning',
				degree: 'Master of Science',
				country: 'United States',
				deadline: '2024-12-01',
				status: 'rejected',
				field: 'Computer Science',
				attendance: 'On-campus',
				funding: '245,000 USD / year',
				logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/MIT_Seal.svg/1200px-MIT_Seal.svg.png',
				description:
					"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s Lorem Ipsum is simply dummy text of the printing....",
				daysLeft: 0,
			},
			{
				id: 5,
				university: 'Oxford University',
				program: 'Computer Science',
				degree: 'Master of Science',
				country: 'United Kingdom',
				deadline: '2025-01-20',
				status: 'cancelled',
				field: 'Information Technology',
				attendance: 'Hybrid',
				funding: '178,000 GBP / year',
				logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/University_of_Oxford.svg/1200px-University_of_Oxford.svg.png',
				description:
					"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s Lorem Ipsum is simply dummy text of the printing....",
				daysLeft: 20,
			},
			{
				id: 6,
				university: 'ETH Zurich',
				program: 'Data Science',
				degree: 'Master of Science',
				country: 'Switzerland',
				deadline: '2025-02-01',
				status: 'cancelled',
				field: 'Data Analytics',
				attendance: 'On-campus',
				funding: '89,000 CHF / year',
				logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/ETH_Zurich_logo.svg/1200px-ETH_Zurich_logo.svg.png',
				description:
					"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s Lorem Ipsum is simply dummy text of the printing....",
				daysLeft: 31,
			},
			{
				id: 7,
				university: 'University of Toronto',
				program: 'Computer Science',
				degree: 'Master of Science',
				country: 'Canada',
				deadline: '2025-01-10',
				status: 'rejected',
				field: 'Software Engineering',
				attendance: 'Hybrid',
				funding: '125,000 CAD / year',
				logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/University_of_Toronto_crest.svg/1200px-University_of_Toronto_crest.svg.png',
				description:
					"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s Lorem Ipsum is simply dummy text of the printing....",
				daysLeft: 10,
			},
			{
				id: 8,
				university: 'Imperial College London',
				program: 'Artificial Intelligence',
				degree: 'Master of Science',
				country: 'United Kingdom',
				deadline: '2025-02-28',
				status: 'cancelled',
				field: 'Machine Learning',
				attendance: 'On-campus',
				funding: '167,000 GBP / year',
				logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Imperial_College_London_crest.svg/1200px-Imperial_College_London_crest.svg.png',
				description:
					"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s Lorem Ipsum is simply dummy text of the printing....",
				daysLeft: 58,
			},
			{
				id: 9,
				university: 'Carnegie Mellon University',
				program: 'Machine Learning',
				degree: 'Master of Science',
				country: 'United States',
				deadline: '2025-01-25',
				status: 'cancelled',
				field: 'Computer Science',
				attendance: 'Hybrid',
				funding: '212,000 USD / year',
				logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Carnegie_Mellon_University_seal.svg/1200px-Carnegie_Mellon_University_seal.svg.png',
				description:
					"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s Lorem Ipsum is simply dummy text of the printing....",
				daysLeft: 25,
			},
		],
		[]
	)

	const ITEMS_PER_PAGE = 9

	// Filter and sort application items
	const filteredAndSortedItems = useMemo(() => {
		let filtered = allApplicationItems

		// Filter by search query
		if (searchQuery) {
			filtered = filtered.filter(
				(item) =>
					item.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
					item.program.toLowerCase().includes(searchQuery.toLowerCase()) ||
					item.country.toLowerCase().includes(searchQuery.toLowerCase())
			)
		}

		// Filter by status
		if (statusFilter !== 'all') {
			filtered = filtered.filter((item) => item.status === statusFilter)
		}

		// Sort items
		switch (sortBy) {
			case 'newest':
				filtered = [...filtered].sort(
					(a, b) =>
						new Date(b.deadline).getTime() - new Date(a.deadline).getTime()
				)
				break
			case 'oldest':
				filtered = [...filtered].sort(
					(a, b) =>
						new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
				)
				break
			case 'deadline':
				filtered = [...filtered].sort((a, b) => a.daysLeft - b.daysLeft)
				break
			default:
				break
		}

		return filtered
	}, [allApplicationItems, searchQuery, statusFilter, sortBy])

	// Paginate items
	const paginatedItems = useMemo(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
		return filteredAndSortedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE)
	}, [filteredAndSortedItems, currentPage])

	const totalPages = Math.ceil(filteredAndSortedItems.length / ITEMS_PER_PAGE)

	const toggleFavorite = (id: number) => {
		setFavoriteItems((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(id)) {
				newSet.delete(id)
			} else {
				newSet.add(id)
			}
			return newSet
		})
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'submitted':
				return 'text-blue-600'
			case 'under-review':
				return 'text-orange-600'
			case 'accepted':
				return 'text-green-600'
			case 'rejected':
				return 'text-red-600'
			case 'cancelled':
				return 'text-gray-600'
			default:
				return 'text-gray-600'
		}
	}

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'submitted':
				return 'Submitted'
			case 'under-review':
				return 'Under Review'
			case 'accepted':
				return 'Accepted'
			case 'rejected':
				return 'Rejected'
			case 'cancelled':
				return 'Cancelled'
			default:
				return status
		}
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header Section */}
				<div className="mb-6">
					<h2 className="text-2xl font-bold text-gray-900 mb-4">Application</h2>
					<SearchBar />
				</div>

				{/* Filter and Sort Section */}
				<div className="flex justify-between items-center mb-6">
					<div className="flex gap-4">
						<Button
							variant={statusFilter === 'all' ? 'primary' : 'outline'}
							onClick={() => setStatusFilter('all')}
							className="rounded-full px-4 py-2 text-sm"
						>
							All
						</Button>
						<Button
							variant={statusFilter === 'submitted' ? 'primary' : 'outline'}
							onClick={() => setStatusFilter('submitted')}
							className="rounded-full px-4 py-2 text-sm"
						>
							Submitted
						</Button>
						<Button
							variant={statusFilter === 'under-review' ? 'primary' : 'outline'}
							onClick={() => setStatusFilter('under-review')}
							className="rounded-full px-4 py-2 text-sm"
						>
							Under Review
						</Button>
						<Button
							variant={statusFilter === 'accepted' ? 'primary' : 'outline'}
							onClick={() => setStatusFilter('accepted')}
							className="rounded-full px-4 py-2 text-sm"
						>
							Accepted
						</Button>
					</div>
					<div className="flex gap-4">
						<SortDropdown value={sortBy} onChange={setSortBy} />
						<Button variant="outline" className="flex items-center gap-2">
							<span>Status</span>
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
								/>
							</svg>
						</Button>
					</div>
				</div>

				{/* Results Count */}
				<div className="text-sm text-gray-600 mb-4">
					{filteredAndSortedItems.length} results
				</div>

				{/* Applications Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
					{paginatedItems.map((item, index) => (
						<motion.div
							key={item.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: index * 0.1 }}
							whileHover={{ y: -5 }}
							className="flex flex-col h-full bg-white rounded-3xl border border-gray-400 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
						>
							{/* Header with logo and favorite */}
							<div className="flex justify-between items-start mb-4 gap-4">
								<div className="flex-1">
									<Image
										src={item.logo}
										alt={item.university}
										width={120}
										height={40}
										className="rounded-lg object-contain"
									/>
								</div>
								<motion.button
									onClick={(e) => {
										e.preventDefault()
										e.stopPropagation()
										toggleFavorite(item.id)
									}}
									className="p-2 rounded-full transition-all duration-200 hover:bg-gray-50"
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.9 }}
								>
									<Heart
										className={`w-6 h-6 transition-all duration-200 ${
											favoriteItems.has(item.id)
												? 'fill-red-500 text-red-500'
												: 'text-gray-400 hover:text-red-500'
										}`}
									/>
								</motion.button>
							</div>

							{/* Title */}
							<h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
								Lorem Ipsum is simply dummy text of Lorem Ipsum has been the
								industry&apos;s standard dummy text ever since.....
							</h3>

							{/* Description */}
							<p className="text-gray-500 mb-6 line-clamp-3 text-sm leading-relaxed flex-shrink-0">
								{item.description}
							</p>

							{/* Tags */}
							<div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
								<span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium">
									<FileText className="w-4 h-4" />
									{item.field}
								</span>
								<span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium">
									<Globe className="w-4 h-4" />
									{item.country}
								</span>
							</div>

							<div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
								<span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium">
									<Calendar className="w-4 h-4" />
									{new Date(item.deadline).toLocaleDateString()}{' '}
									<span className="text-red-500 font-semibold">
										({item.daysLeft} days left)
									</span>
								</span>
							</div>

							<div className="flex flex-wrap gap-2 mb-6 flex-shrink-0">
								<span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium">
									<span className="inline-flex items-center gap-1">
										📱 {item.attendance}
									</span>
								</span>
								<span className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium">
									<span className="inline-flex items-center gap-1">
										<DollarSign className="w-4 h-4" />
										Funding available
									</span>
								</span>
							</div>

							{/* Price */}
							<div className="text-center mb-6 flex-grow flex items-end justify-center min-h-[60px]">
								<div className="text-2xl font-bold text-gray-900">
									{item.funding}
								</div>
							</div>

							{/* Status */}
							<div className="mt-auto">
								<div className="text-sm text-gray-600">
									Status:{' '}
									<span
										className={`font-semibold ${getStatusColor(item.status)}`}
									>
										{getStatusLabel(item.status)}
									</span>
								</div>
							</div>
						</motion.div>
					))}
				</div>

				{/* Pagination */}
				{totalPages > 1 && (
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						onPageChange={setCurrentPage}
					/>
				)}
			</div>
		</div>
	)
}
