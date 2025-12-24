'use client'
import { Program, Scholarship, ResearchLab } from '@/types/api/explore-api'
import { ProgramCard, ScholarshipCard, ResearchLabCard } from '@/components/ui'
import { motion } from 'framer-motion'
import { Heart, BookOpen, Award, Microscope } from 'lucide-react'

interface WishlistTabProps {
	programs: Program[]
	scholarships: Scholarship[]
	researchLabs: ResearchLab[]
	loading?: boolean
	// eslint-disable-next-line no-unused-vars
	isInWishlist?: (id: string) => boolean
	// eslint-disable-next-line no-unused-vars
	onWishlistToggle?: (id: string) => void
}

const WishlistTab = ({
	programs,
	scholarships,
	researchLabs,
	loading,
	isInWishlist = () => true, // Default to true since these are wishlist items
	onWishlistToggle = () => {}, // Default empty function
}: WishlistTabProps) => {
	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="flex flex-col items-center gap-3">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#116E63]"></div>
					<p className="text-gray-600 text-sm">Loading your wishlist...</p>
				</div>
			</div>
		)
	}

	const totalItems = programs.length + scholarships.length + researchLabs.length

	if (totalItems === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
					<Heart className="w-12 h-12 text-gray-400" />
				</div>
				<h3 className="text-xl font-semibold text-gray-900 mb-2">
					Your wishlist is empty
				</h3>
				<p className="text-gray-600 mb-6 max-w-md">
					Start exploring programs, scholarships, and research opportunities to
					build your wishlist.
				</p>
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					className="bg-[#116E63] text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors"
					onClick={() => (window.location.href = '/explore')}
				>
					Start Exploring
				</motion.button>
			</div>
		)
	}

	return (
		<div className="space-y-8">
			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
				>
					<div className="flex items-center gap-3 mb-3">
						<div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
							<BookOpen className="w-5 h-5 text-blue-600" />
						</div>
						<h3 className="text-lg font-semibold text-gray-900">Programs</h3>
					</div>
					<p className="text-3xl font-bold text-blue-600">{programs.length}</p>
					<p className="text-sm text-gray-600">Saved programs</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
				>
					<div className="flex items-center gap-3 mb-3">
						<div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
							<Award className="w-5 h-5 text-green-600" />
						</div>
						<h3 className="text-lg font-semibold text-gray-900">
							Scholarships
						</h3>
					</div>
					<p className="text-3xl font-bold text-green-600">
						{scholarships.length}
					</p>
					<p className="text-sm text-gray-600">Saved scholarships</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
					className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
				>
					<div className="flex items-center gap-3 mb-3">
						<div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
							<Microscope className="w-5 h-5 text-purple-600" />
						</div>
						<h3 className="text-lg font-semibold text-gray-900">
							Research Labs
						</h3>
					</div>
					<p className="text-3xl font-bold text-purple-600">
						{researchLabs.length}
					</p>
					<p className="text-sm text-gray-600">Saved research positions</p>
				</motion.div>
			</div>

			{/* Programs Section */}
			{programs.length > 0 && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="space-y-4"
				>
					<div className="flex items-center gap-3 mb-6">
						<BookOpen className="w-6 h-6 text-blue-600" />
						<h2 className="text-xl font-semibold text-gray-900">
							Saved Programs
						</h2>
						<span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
							{programs.length}
						</span>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{programs.map((program, index) => (
							<motion.div
								key={program.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.5 + index * 0.1 }}
							>
								<ProgramCard
									program={program}
									index={index}
									isWishlisted={isInWishlist(program.id)}
									onWishlistToggle={() => onWishlistToggle(program.id)}
								/>
							</motion.div>
						))}
					</div>
				</motion.div>
			)}

			{/* Scholarships Section */}
			{scholarships.length > 0 && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
					className="space-y-4"
				>
					<div className="flex items-center gap-3 mb-6">
						<Award className="w-6 h-6 text-green-600" />
						<h2 className="text-xl font-semibold text-gray-900">
							Saved Scholarships
						</h2>
						<span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
							{scholarships.length}
						</span>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{scholarships.map((scholarship, index) => (
							<motion.div
								key={scholarship.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.7 + index * 0.1 }}
							>
								<ScholarshipCard
									scholarship={scholarship}
									index={index}
									isWishlisted={isInWishlist(scholarship.id)}
									onWishlistToggle={() => onWishlistToggle(scholarship.id)}
								/>
							</motion.div>
						))}
					</div>
				</motion.div>
			)}

			{/* Research Labs Section */}
			{researchLabs.length > 0 && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.8 }}
					className="space-y-4"
				>
					<div className="flex items-center gap-3 mb-6">
						<Microscope className="w-6 h-6 text-purple-600" />
						<h2 className="text-xl font-semibold text-gray-900">
							Saved Research Positions
						</h2>
						<span className="bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
							{researchLabs.length}
						</span>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{researchLabs.map((lab, index) => (
							<motion.div
								key={lab.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.9 + index * 0.1 }}
							>
								<ResearchLabCard
									lab={lab}
									index={index}
									isWishlisted={isInWishlist(lab.id)}
									onWishlistToggle={() => onWishlistToggle(lab.id)}
								/>
							</motion.div>
						))}
					</div>
				</motion.div>
			)}
		</div>
	)
}

export { WishlistTab }
