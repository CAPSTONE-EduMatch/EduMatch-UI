'use client'

import {
	Search,
	RefreshCw,
	DollarSign,
	GraduationCap,
	Globe,
	Clock,
	BookOpen,
	Users,
	FileText,
	Briefcase,
	Building,
	ChevronDown,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { TabType } from '@/types/explore'
import { AIAssistantCard } from './AIAssistantCard'

interface FilterSidebarProps {
	activeTab: TabType
}

export function FilterSidebar({ activeTab }: FilterSidebarProps) {
	const [selectedFilters, setSelectedFilters] = useState<
		Record<string, string[]>
	>({
		discipline: [],
		country: ['America', 'Cambodia'],
		duration: ['Less than 1 year', 'More than 2 years'],
		degreeLevel: ['Master'],
		attendance: ['Online'],
	})

	const [selectedDiscipline, setSelectedDiscipline] = useState<string>('')
	const [showSubdisciplines, setShowSubdisciplines] = useState(false)

	const [feeRange, setFeeRange] = useState({ min: 234567, max: 1234567 })
	const [searchTerms, setSearchTerms] = useState({
		discipline: '',
		country: '',
		researchField: '',
	})

	const [collapsedSections, setCollapsedSections] = useState<
		Record<string, boolean>
	>({
		discipline: true,
		researchField: true,
		country: true,
		fee: true,
		salary: true,
		duration: true,
		degreeLevel: true,
		essayRequired: true,
		attendance: true,
		contractType: true,
		jobType: true,
	})

	const handleFilterChange = (category: string, value: string) => {
		setSelectedFilters((prev) => ({
			...prev,
			[category]: prev[category]?.includes(value)
				? prev[category].filter((item) => item !== value)
				: [...(prev[category] || []), value],
		}))
	}

	const handleDisciplineSelect = (discipline: string) => {
		setSelectedDiscipline(discipline)
		setShowSubdisciplines(true)
	}

	const handleSubdisciplineSelect = (subdiscipline: string) => {
		setSelectedFilters((prev) => ({
			...prev,
			discipline: prev.discipline?.includes(subdiscipline)
				? prev.discipline.filter((item) => item !== subdiscipline)
				: [...(prev.discipline || []), subdiscipline],
		}))
	}

	const handleBackToDisciplines = () => {
		setShowSubdisciplines(false)
		setSelectedDiscipline('')
	}

	const handleRefresh = () => {
		setSelectedFilters({})
		setFeeRange({ min: 234567, max: 1234567 })
		setSearchTerms({ discipline: '', country: '', researchField: '' })
		setSelectedDiscipline('')
		setShowSubdisciplines(false)
	}

	const toggleSection = (sectionKey: string) => {
		setCollapsedSections((prev) => ({
			...prev,
			[sectionKey]: !prev[sectionKey],
		}))
	}

	const getFilterSections = (): {
		disciplines?: string[]
		subdisciplines?: Record<string, string[]>
		countries?: string[]
		durations?: string[]
		degreeLevels?: string[]
		attendanceTypes?: string[]
		researchFields?: string[]
		salaryRanges?: string[]
		contractTypes?: string[]
		jobTypes?: string[]
		essayRequired?: string[]
		sections: readonly string[]
	} => {
		switch (activeTab) {
			case 'programmes':
				return {
					disciplines: [
						'Engineering',
						'Computer Science',
						'Business',
						'Medicine',
						'Arts & Humanities',
						'Natural Sciences',
						'Social Sciences',
					],
					subdisciplines: {
						Engineering: [
							'Software Engineering',
							'Civil Engineering',
							'Mechanical Engineering',
							'Electrical Engineering',
							'Chemical Engineering',
							'Aerospace Engineering',
						],
						'Computer Science': [
							'Artificial Intelligence',
							'Machine Learning',
							'Cybersecurity',
							'Data Science',
							'Software Development',
							'Computer Vision',
						],
						Business: [
							'Business Administration',
							'Finance',
							'Marketing',
							'Management',
							'Economics',
							'Entrepreneurship',
						],
						Medicine: [
							'General Medicine',
							'Nursing',
							'Pharmacy',
							'Dentistry',
							'Public Health',
							'Medical Research',
						],
						'Arts & Humanities': [
							'Literature',
							'History',
							'Philosophy',
							'Fine Arts',
							'Music',
							'Languages',
						],
						'Natural Sciences': [
							'Physics',
							'Chemistry',
							'Biology',
							'Mathematics',
							'Environmental Science',
							'Geology',
						],
						'Social Sciences': [
							'Psychology',
							'Sociology',
							'Political Science',
							'Anthropology',
							'International Relations',
							'Law',
						],
					},
					countries: [
						'America',
						'Angola',
						'Brazil',
						'China',
						'Cambodia',
						'England',
						'Korea',
					],
					durations: [
						'Less than 1 year',
						'1 year',
						'1.5 years',
						'2 years',
						'More than 2 years',
					],
					degreeLevels: ['Master', 'PhD'],
					attendanceTypes: ['Online', 'At campus', 'Hybrid'],
					sections: [
						'discipline',
						'country',
						'fee',
						'duration',
						'degreeLevel',
						'attendance',
					] as const,
				}

			case 'scholarships':
				return {
					disciplines: [
						'Engineering',
						'Computer Science',
						'Business',
						'Medicine',
						'Arts',
						'Sciences',
						'Law',
					],
					countries: [
						'America',
						'Canada',
						'UK',
						'Australia',
						'Germany',
						'France',
						'Japan',
					],
					degreeLevels: ['Bachelor', 'Master', 'PhD'],
					essayRequired: ['Yes', 'No'],
					sections: [
						'discipline',
						'country',
						'degreeLevel',
						'essayRequired',
					] as const,
				}

			case 'research':
				return {
					researchFields: [
						'Artificial Intelligence',
						'Machine Learning',
						'Computer Vision',
						'Natural Language Processing',
						'Robotics',
						'Data Science',
						'Cybersecurity',
					],
					countries: [
						'America',
						'UK',
						'Germany',
						'Japan',
						'Singapore',
						'Canada',
						'Australia',
					],
					salaryRanges: [
						'$50,000 - $70,000',
						'$70,000 - $90,000',
						'$90,000 - $120,000',
						'$120,000+',
					],
					degreeLevels: ['Master', 'PhD', 'Postdoc'],
					attendanceTypes: ['On-site', 'Remote', 'Hybrid'],
					contractTypes: ['Full-time', 'Part-time', 'Contract'],
					jobTypes: [
						'Research Assistant',
						'PhD Position',
						'Postdoc',
						'Research Scientist',
					],
					sections: [
						'researchField',
						'country',
						'salary',
						'degreeLevel',
						'attendance',
						'contractType',
						'jobType',
					] as const,
				}

			default:
				return {
					disciplines: [],
					countries: [],
					sections: [] as const,
				}
		}
	}

	const filterConfig = getFilterSections()

	return (
		<motion.div
			className="w-72 space-y-6"
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.5 }}
		>
			{/* Selected Filters Header */}
			<motion.div
				className="bg-white rounded-3xl border-2 border-[#116E63] p-6 shadow-sm"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
			>
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-lg font-semibold text-gray-900">
						Selected filters
					</h3>
					<motion.button
						onClick={handleRefresh}
						className="p-2 hover:bg-gray-100 rounded-full transition-colors"
						whileHover={{ rotate: 180 }}
						whileTap={{ scale: 0.9 }}
					>
						<RefreshCw className="w-5 h-5 text-gray-600" />
					</motion.button>
				</div>

				{/* Dynamic sections based on active tab */}
				{filterConfig.sections.includes('discipline') && (
					<div className="mb-3">
						<div
							className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
							onClick={() => toggleSection('discipline')}
						>
							<div className="flex items-center gap-2">
								<BookOpen className="w-5 h-5 text-[#116E63]" />
								<h4 className="font-medium text-[#116E63]">Discipline</h4>
							</div>
							<motion.div
								className="p-1"
								animate={{ rotate: collapsedSections.discipline ? -90 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<ChevronDown className="w-4 h-4 text-[#116E63]" />
							</motion.div>
						</div>

						<AnimatePresence>
							{!collapsedSections.discipline && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: 0.3 }}
								>
									{!showSubdisciplines ? (
										// Main disciplines view
										<div>
											<p className="text-sm text-gray-600 mb-3">
												Select a discipline
											</p>
											<div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
												{filterConfig.disciplines?.map((discipline) => (
													<motion.button
														key={discipline}
														onClick={() => handleDisciplineSelect(discipline)}
														className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-[#116E63] hover:bg-[#116E63]/5 transition-colors text-sm"
														whileHover={{ x: 2 }}
													>
														<span className="font-medium text-gray-700">
															{discipline}
														</span>
													</motion.button>
												))}
											</div>
										</div>
									) : (
										// Subdisciplines view
										<div>
											<div className="flex items-center gap-2 mb-3">
												<button
													onClick={handleBackToDisciplines}
													className="text-[#116E63] hover:text-[#0d5a52] text-sm font-medium"
												>
													← Back to disciplines
												</button>
											</div>
											<p className="text-sm text-gray-600 mb-3">
												{selectedDiscipline} subdisciplines
											</p>
											<div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
												{filterConfig.subdisciplines?.[selectedDiscipline]?.map(
													(subdiscipline) => (
														<motion.label
															key={subdiscipline}
															className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-2"
															whileHover={{ x: 2 }}
														>
															<input
																type="checkbox"
																checked={
																	selectedFilters.discipline?.includes(
																		subdiscipline
																	) || false
																}
																onChange={() =>
																	handleSubdisciplineSelect(subdiscipline)
																}
																className="w-4 h-4 text-[#116E63] focus:ring-teal-500 rounded"
															/>
															<span className="text-sm text-gray-700">
																{subdiscipline}
															</span>
														</motion.label>
													)
												)}
											</div>
											{/* {selectedFilters.discipline &&
												selectedFilters.discipline.length > 0 && (
													<div className="mt-3 p-2 bg-[#116E63]/10 rounded-lg">
														<p className="text-sm text-[#116E63] font-medium mb-1">
															Selected subdisciplines:
														</p>
														<div className="flex flex-wrap gap-1">
															{selectedFilters.discipline.map((sub) => (
																<span
																	key={sub}
																	className="inline-block px-2 py-1 bg-[#116E63] text-white text-xs rounded-full"
																>
																	{sub}
																</span>
															))}
														</div>
													</div>
												)} */}
										</div>
									)}
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				)}

				{/* Research Field Section (for research labs) */}
				{filterConfig.sections.includes('researchField') && (
					<div className="mb-3">
						<div
							className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
							onClick={() => toggleSection('researchField')}
						>
							<div className="flex items-center gap-2">
								<BookOpen className="w-5 h-5 text-[#116E63]" />
								<h4 className="font-medium text-[#116E63]">Research field</h4>
							</div>
							<motion.div
								className="p-1"
								animate={{ rotate: collapsedSections.researchField ? -90 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<ChevronDown className="w-4 h-4 text-[#116E63]" />
							</motion.div>
						</div>

						<AnimatePresence>
							{!collapsedSections.researchField && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: 0.3 }}
								>
									<div className="relative mb-3">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
										<input
											type="text"
											placeholder="Search research field..."
											value={searchTerms.researchField}
											onChange={(e) =>
												setSearchTerms((prev) => ({
													...prev,
													researchField: e.target.value,
												}))
											}
											className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
										/>
										<button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#116E63] text-white p-1 rounded">
											<Search className="w-4 h-4" />
										</button>
									</div>

									<div className="max-h-52 overflow-y-auto border border-gray-200 rounded-lg p-2">
										{filterConfig.researchFields?.map((field) => (
											<motion.label
												key={field}
												className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-2"
												whileHover={{ x: 2 }}
											>
												<input
													type="checkbox"
													checked={
														selectedFilters.researchField?.includes(field) ||
														false
													}
													onChange={() =>
														handleFilterChange('researchField', field)
													}
													className="w-4 h-4 text-[#116E63] rounded focus:ring-teal-500"
												/>
												<span className="text-sm text-gray-700">{field}</span>
											</motion.label>
										))}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				)}

				{/* Country Section */}
				{filterConfig.sections.includes('country') && (
					<div className="mb-3">
						<div
							className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
							onClick={() => toggleSection('country')}
						>
							<div className="flex items-center gap-2">
								<Globe className="w-5 h-5 text-[#116E63]" />
								<h4 className="font-medium text-[#116E63]">Country</h4>
							</div>
							<motion.div
								className="p-1"
								animate={{ rotate: collapsedSections.country ? -90 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<ChevronDown className="w-4 h-4 text-[#116E63]" />
							</motion.div>
						</div>

						<AnimatePresence>
							{!collapsedSections.country && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: 0.3 }}
								>
									<div className="relative mb-3">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
										<input
											type="text"
											placeholder="Search country..."
											value={searchTerms.country}
											onChange={(e) =>
												setSearchTerms((prev) => ({
													...prev,
													country: e.target.value,
												}))
											}
											className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
										/>
										<button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#116E63] text-white p-1 rounded">
											<Search className="w-4 h-4" />
										</button>
									</div>

									<div className="max-h-52 overflow-y-auto border border-gray-200 rounded-lg p-2">
										{filterConfig.countries?.map((country) => (
											<motion.label
												key={country}
												className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-2"
												whileHover={{ x: 2 }}
											>
												<input
													type="checkbox"
													checked={
														selectedFilters.country?.includes(country) || false
													}
													onChange={() =>
														handleFilterChange('country', country)
													}
													className="w-4 h-4 text-[#116E63] rounded focus:ring-teal-500"
												/>
												<span className="text-sm text-gray-700">{country}</span>
											</motion.label>
										))}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				)}

				{/* Fee Section (for programs) */}
				{filterConfig.sections.includes('fee') && (
					<div className="mb-3">
						<div
							className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
							onClick={() => toggleSection('fee')}
						>
							<div className="flex items-center gap-2">
								<DollarSign className="w-5 h-5 text-[#116E63]" />
								<h4 className="font-medium text-[#116E63]">Fee</h4>
							</div>
							<motion.div
								className="p-1"
								animate={{ rotate: collapsedSections.fee ? -90 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<ChevronDown className="w-4 h-4 text-[#116E63]" />
							</motion.div>
						</div>

						<AnimatePresence>
							{!collapsedSections.fee && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: 0.3 }}
								>
									<div className="space-y-4">
										{/* Range Display */}
										{/* <div className="flex justify-between items-center">
											<div className="text-center">
												<div className="text-xs text-gray-500 mb-1">Min</div>
												<div className="text-lg font-semibold text-[#116E63]">
													${feeRange.min.toLocaleString()}
												</div>
											</div>
											<div className="text-center">
												<div className="text-xs text-gray-500 mb-1">Max</div>
												<div className="text-lg font-semibold text-[#116E63]">
													${feeRange.max.toLocaleString()}
												</div>
											</div>
										</div> */}

										{/* Dual Range Slider */}
										<div className="space-y-2">
											<label className="text-sm font-medium text-gray-700">
												Fee Range
											</label>
											<div className="relative">
												{/* Min slider */}
												<input
													type="range"
													min="0"
													max="2000000"
													step="1000"
													value={feeRange.min}
													onChange={(e) => {
														const newMin = Number.parseInt(e.target.value)
														setFeeRange((prev) => ({
															...prev,
															min: Math.min(newMin, prev.max - 1000),
														}))
													}}
													className="absolute w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer z-10"
													style={{
														background: 'transparent',
														WebkitAppearance: 'none',
													}}
												/>
												{/* Max slider */}
												<input
													type="range"
													min="0"
													max="2000000"
													step="1000"
													value={feeRange.max}
													onChange={(e) => {
														const newMax = Number.parseInt(e.target.value)
														setFeeRange((prev) => ({
															...prev,
															max: Math.max(newMax, prev.min + 1000),
														}))
													}}
													className="absolute w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer z-20"
													style={{
														background: 'transparent',
														WebkitAppearance: 'none',
													}}
												/>
												{/* Track background */}
												<div className="relative h-2 bg-gray-200 rounded-lg">
													{/* Active range */}
													<div
														className="absolute h-2 bg-[#116E63] rounded-lg"
														style={{
															left: `${(feeRange.min / 2000000) * 100}%`,
															right: `${100 - (feeRange.max / 2000000) * 100}%`,
														}}
													/>
												</div>
											</div>
										</div>

										{/* Manual Input Fields */}
										<div className="grid grid-cols-2 gap-3">
											<div className="space-y-1">
												<label className="text-xs text-gray-500">Min ($)</label>
												<input
													type="number"
													value={feeRange.min}
													onChange={(e) => {
														const newMin = Number.parseInt(e.target.value) || 0
														setFeeRange((prev) => ({
															...prev,
															min: Math.min(
																Math.max(newMin, 0),
																prev.max - 1000
															),
														}))
													}}
													className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#116E63] focus:border-[#116E63]"
													min="0"
													max="2000000"
												/>
											</div>
											<div className="space-y-1">
												<label className="text-xs text-gray-500">Max ($)</label>
												<input
													type="number"
													value={feeRange.max}
													onChange={(e) => {
														const newMax = Number.parseInt(e.target.value) || 0
														setFeeRange((prev) => ({
															...prev,
															max: Math.max(
																Math.min(newMax, 2000000),
																prev.min + 1000
															),
														}))
													}}
													className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#116E63] focus:border-[#116E63]"
													min="0"
													max="2000000"
												/>
											</div>
										</div>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				)}

				{/* Salary Section (for research labs) */}
				{filterConfig.sections.includes('salary') && (
					<div className="mb-3">
						<div
							className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
							onClick={() => toggleSection('salary')}
						>
							<div className="flex items-center gap-2">
								<DollarSign className="w-5 h-5 text-[#116E63]" />
								<h4 className="font-medium text-[#116E63]">Salary</h4>
							</div>
							<motion.div
								className="p-1"
								animate={{ rotate: collapsedSections.salary ? -90 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<ChevronDown className="w-4 h-4 text-[#116E63]" />
							</motion.div>
						</div>

						<AnimatePresence>
							{!collapsedSections.salary && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: 0.3 }}
								>
									<div className="space-y-2">
										{filterConfig.salaryRanges?.map((range) => (
											<motion.label
												key={range}
												className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1"
												whileHover={{ x: 2 }}
											>
												<input
													type="checkbox"
													checked={
														selectedFilters.salary?.includes(range) || false
													}
													onChange={() => handleFilterChange('salary', range)}
													className="w-4 h-4 text-[#116E63] rounded focus:ring-teal-500"
												/>
												<span className="text-sm text-gray-700">{range}</span>
											</motion.label>
										))}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				)}

				{/* Duration Section (for programs) */}
				{filterConfig.sections.includes('duration') && (
					<div className="mb-3">
						<div
							className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
							onClick={() => toggleSection('duration')}
						>
							<div className="flex items-center gap-2">
								<Clock className="w-5 h-5 text-[#116E63]" />
								<h4 className="font-medium text-[#116E63]">Duration</h4>
							</div>
							<motion.div
								className="p-1"
								animate={{ rotate: collapsedSections.duration ? -90 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<ChevronDown className="w-4 h-4 text-[#116E63]" />
							</motion.div>
						</div>

						<AnimatePresence>
							{!collapsedSections.duration && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: 0.3 }}
								>
									<div className="space-y-2">
										{filterConfig.durations?.map((duration) => (
											<motion.label
												key={duration}
												className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1"
												whileHover={{ x: 2 }}
											>
												<input
													type="checkbox"
													checked={
														selectedFilters.duration?.includes(duration) ||
														false
													}
													onChange={() =>
														handleFilterChange('duration', duration)
													}
													className="w-4 h-4 text-[#116E63] rounded focus:ring-teal-500"
												/>
												<span className="text-sm text-gray-700">
													{duration}
												</span>
											</motion.label>
										))}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				)}

				{/* Degree Level Section */}
				{filterConfig.sections.includes('degreeLevel') && (
					<div className="mb-3">
						<div
							className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
							onClick={() => toggleSection('degreeLevel')}
						>
							<div className="flex items-center gap-2">
								<GraduationCap className="w-5 h-5 text-[#116E63]" />
								<h4 className="font-medium text-[#116E63]">Degree level</h4>
							</div>
							<motion.div
								className="p-1"
								animate={{ rotate: collapsedSections.degreeLevel ? -90 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<ChevronDown className="w-4 h-4 text-[#116E63]" />
							</motion.div>
						</div>

						<AnimatePresence>
							{!collapsedSections.degreeLevel && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: 0.3 }}
								>
									<div className="space-y-2">
										{filterConfig.degreeLevels?.map((level) => (
											<motion.label
												key={level}
												className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1"
												whileHover={{ x: 2 }}
											>
												<input
													type="checkbox"
													checked={
														selectedFilters.degreeLevel?.includes(level) ||
														false
													}
													onChange={() =>
														handleFilterChange('degreeLevel', level)
													}
													className="w-4 h-4 text-[#116E63] rounded focus:ring-teal-500"
												/>
												<span className="text-sm text-gray-700">{level}</span>
											</motion.label>
										))}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				)}

				{/* Essay Required Section (for scholarships) */}
				{filterConfig.sections.includes('essayRequired') && (
					<div className="mb-3">
						<div
							className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
							onClick={() => toggleSection('essayRequired')}
						>
							<div className="flex items-center gap-2">
								<FileText className="w-5 h-5 text-[#116E63]" />
								<h4 className="font-medium text-[#116E63]">Essay required</h4>
							</div>
							<motion.div
								className="p-1"
								animate={{ rotate: collapsedSections.essayRequired ? -90 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<ChevronDown className="w-4 h-4 text-[#116E63]" />
							</motion.div>
						</div>

						<AnimatePresence>
							{!collapsedSections.essayRequired && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: 0.3 }}
								>
									<div className="space-y-2">
										{filterConfig.essayRequired?.map((option) => (
											<motion.label
												key={option}
												className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1"
												whileHover={{ x: 2 }}
											>
												<input
													type="checkbox"
													checked={
														selectedFilters.essayRequired?.includes(option) ||
														false
													}
													onChange={() =>
														handleFilterChange('essayRequired', option)
													}
													className="w-4 h-4 text-[#116E63] rounded focus:ring-teal-500"
												/>
												<span className="text-sm text-gray-700">{option}</span>
											</motion.label>
										))}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				)}

				{/* Attendance Section */}
				{filterConfig.sections.includes('attendance') && (
					<div className="mb-3">
						<div
							className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
							onClick={() => toggleSection('attendance')}
						>
							<div className="flex items-center gap-2">
								<Users className="w-5 h-5 text-[#116E63]" />
								<h4 className="font-medium text-[#116E63]">Attendance</h4>
							</div>
							<motion.div
								className="p-1"
								animate={{ rotate: collapsedSections.attendance ? -90 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<ChevronDown className="w-4 h-4 text-[#116E63]" />
							</motion.div>
						</div>

						<AnimatePresence>
							{!collapsedSections.attendance && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: 0.3 }}
								>
									<div className="space-y-2">
										{filterConfig.attendanceTypes?.map((type) => (
											<motion.label
												key={type}
												className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1"
												whileHover={{ x: 2 }}
											>
												<input
													type="checkbox"
													checked={
														selectedFilters.attendance?.includes(type) || false
													}
													onChange={() =>
														handleFilterChange('attendance', type)
													}
													className="w-4 h-4 text-[#116E63] rounded focus:ring-teal-500"
												/>
												<span className="text-sm text-gray-700">{type}</span>
											</motion.label>
										))}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				)}

				{/* Contract Type Section (for research labs) */}
				{filterConfig.sections.includes('contractType') && (
					<div className="mb-3">
						<div
							className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
							onClick={() => toggleSection('contractType')}
						>
							<div className="flex items-center gap-2">
								<Briefcase className="w-5 h-5 text-[#116E63]" />
								<h4 className="font-medium text-[#116E63]">Type of Contract</h4>
							</div>
							<motion.div
								className="p-1"
								animate={{ rotate: collapsedSections.contractType ? -90 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<ChevronDown className="w-4 h-4 text-[#116E63]" />
							</motion.div>
						</div>

						<AnimatePresence>
							{!collapsedSections.contractType && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: 0.3 }}
								>
									<div className="space-y-2">
										{filterConfig.contractTypes?.map((type) => (
											<motion.label
												key={type}
												className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1"
												whileHover={{ x: 2 }}
											>
												<input
													type="checkbox"
													checked={
														selectedFilters.contractType?.includes(type) ||
														false
													}
													onChange={() =>
														handleFilterChange('contractType', type)
													}
													className="w-4 h-4 text-[#116E63] rounded focus:ring-teal-500"
												/>
												<span className="text-sm text-gray-700">{type}</span>
											</motion.label>
										))}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				)}

				{/* Job Type Section (for research labs) */}
				{filterConfig.sections.includes('jobType') && (
					<div className="mb-3">
						<div
							className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
							onClick={() => toggleSection('jobType')}
						>
							<div className="flex items-center gap-2">
								<Building className="w-5 h-5 text-[#116E63]" />
								<h4 className="font-medium text-[#116E63]">Job type</h4>
							</div>
							<motion.div
								className="p-1"
								animate={{ rotate: collapsedSections.jobType ? -90 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<ChevronDown className="w-4 h-4 text-[#116E63]" />
							</motion.div>
						</div>

						<AnimatePresence>
							{!collapsedSections.jobType && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: 0.3 }}
								>
									<div className="space-y-2">
										{filterConfig.jobTypes?.map((type) => (
											<motion.label
												key={type}
												className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1"
												whileHover={{ x: 2 }}
											>
												<input
													type="checkbox"
													checked={
														selectedFilters.jobType?.includes(type) || false
													}
													onChange={() => handleFilterChange('jobType', type)}
													className="w-4 h-4 text-[#116E63] rounded focus:ring-teal-500"
												/>
												<span className="text-sm text-gray-700">{type}</span>
											</motion.label>
										))}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				)}
			</motion.div>

			<AIAssistantCard />
		</motion.div>
	)
}
