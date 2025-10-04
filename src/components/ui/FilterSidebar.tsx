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
		discipline: ['Artificial Intelligence', 'Machine Learning'],
		country: ['America', 'Cambodia'],
		duration: ['Less than 1 year', 'More than 2 years'],
		degreeLevel: ['Master'],
		attendance: ['Online'],
	})

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

	const handleRefresh = () => {
		setSelectedFilters({})
		setFeeRange({ min: 234567, max: 1234567 })
		setSearchTerms({ discipline: '', country: '', researchField: '' })
	}

	const toggleSection = (sectionKey: string) => {
		setCollapsedSections((prev) => ({
			...prev,
			[sectionKey]: !prev[sectionKey],
		}))
	}

	const getFilterSections = (): {
		disciplines?: string[]
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
						'Artificial Intelligence',
						'Cybersecurity',
						'DevOps',
						'Data Engineering',
						'Machine Learning',
						'Software Development',
						'Software Testing',
					],
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
				<div className="flex items-center justify-between mb-6">
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
					<div className="mb-6">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2">
								<BookOpen className="w-5 h-5 text-[#116E63]" />
								<h4 className="font-medium text-[#116E63]">Discipline</h4>
							</div>
							<motion.button
								onClick={() => toggleSection('discipline')}
								className="p-1 hover:bg-gray-100 rounded-full transition-colors"
								animate={{ rotate: collapsedSections.discipline ? -90 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<ChevronDown className="w-4 h-4 text-[#116E63]" />
							</motion.button>
						</div>

						<AnimatePresence>
							{!collapsedSections.discipline && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: 0.3 }}
								>
									<p className="text-sm text-gray-600 mb-3">All disciplines</p>

									<div className="relative mb-3">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
										<input
											type="text"
											placeholder="Search in Engineering ....."
											value={searchTerms.discipline}
											onChange={(e) =>
												setSearchTerms((prev) => ({
													...prev,
													discipline: e.target.value,
												}))
											}
											className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
										/>
										<button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#116E63] text-white p-1 rounded">
											<Search className="w-4 h-4" />
										</button>
									</div>

									<div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
										{filterConfig.disciplines?.map((discipline) => (
											<motion.label
												key={discipline}
												className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-2"
												whileHover={{ x: 2 }}
											>
												<input
													type="checkbox"
													checked={
														selectedFilters.discipline?.includes(discipline) ||
														false
													}
													onChange={() =>
														handleFilterChange('discipline', discipline)
													}
													className="w-4 h-4 text-[#116E63] rounded focus:ring-teal-500"
												/>
												<span className="text-sm text-gray-700">
													{discipline}
												</span>
											</motion.label>
										))}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				)}

				{/* Research Field Section (for research labs) */}
				{filterConfig.sections.includes('researchField') && (
					<div className="mb-6">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2">
								<BookOpen className="w-5 h-5 text-[#116E63]" />
								<h4 className="font-medium text-[#116E63]">Research field</h4>
							</div>
							<motion.button
								onClick={() => toggleSection('researchField')}
								className="p-1 hover:bg-gray-100 rounded-full transition-colors"
								animate={{ rotate: collapsedSections.researchField ? -90 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<ChevronDown className="w-4 h-4 text-[#116E63]" />
							</motion.button>
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

									<div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
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
					<div className="mb-6">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2">
								<Globe className="w-5 h-5 text-[#116E63]" />
								<h4 className="font-medium text-[#116E63]">Country</h4>
							</div>
							<motion.button
								onClick={() => toggleSection('country')}
								className="p-1 hover:bg-gray-100 rounded-full transition-colors"
								animate={{ rotate: collapsedSections.country ? -90 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<ChevronDown className="w-4 h-4 text-[#116E63]" />
							</motion.button>
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

									<div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
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
					<div className="mb-6">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2">
								<DollarSign className="w-5 h-5 text-[#116E63]" />
								<h4 className="font-medium text-[#116E63]">Fee</h4>
							</div>
							<motion.button
								onClick={() => toggleSection('fee')}
								className="p-1 hover:bg-gray-100 rounded-full transition-colors"
								animate={{ rotate: collapsedSections.fee ? -90 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<ChevronDown className="w-4 h-4 text-[#116E63]" />
							</motion.button>
						</div>

						<AnimatePresence>
							{!collapsedSections.fee && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: 0.3 }}
								>
									<div className="space-y-3">
										<div className="text-center text-lg font-semibold text-[#116E63]">
											{feeRange.min.toLocaleString()}
										</div>
										<div className="relative">
											<input
												type="range"
												min="0"
												max="2000000"
												value={feeRange.min}
												onChange={(e) =>
													setFeeRange((prev) => ({
														...prev,
														min: Number.parseInt(e.target.value),
													}))
												}
												className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
											/>
										</div>
										<div className="text-center text-lg font-semibold text-gray-700">
											{feeRange.max.toLocaleString()}
										</div>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				)}

				{/* Salary Section (for research labs) */}
				{filterConfig.sections.includes('salary') && (
					<div className="mb-6">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2">
								<DollarSign className="w-5 h-5 text-[#116E63]" />
								<h4 className="font-medium text-[#116E63]">Salary</h4>
							</div>
							<motion.button
								onClick={() => toggleSection('salary')}
								className="p-1 hover:bg-gray-100 rounded-full transition-colors"
								animate={{ rotate: collapsedSections.salary ? -90 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<ChevronDown className="w-4 h-4 text-[#116E63]" />
							</motion.button>
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
					<div className="mb-6">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2">
								<Clock className="w-5 h-5 text-[#116E63]" />
								<h4 className="font-medium text-[#116E63]">Duration</h4>
							</div>
							<motion.button
								onClick={() => toggleSection('duration')}
								className="p-1 hover:bg-gray-100 rounded-full transition-colors"
								animate={{ rotate: collapsedSections.duration ? -90 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<ChevronDown className="w-4 h-4 text-[#116E63]" />
							</motion.button>
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
					<div className="mb-6">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2">
								<GraduationCap className="w-5 h-5 text-[#116E63]" />
								<h4 className="font-medium text-[#116E63]">Degree level</h4>
							</div>
							<motion.button
								onClick={() => toggleSection('degreeLevel')}
								className="p-1 hover:bg-gray-100 rounded-full transition-colors"
								animate={{ rotate: collapsedSections.degreeLevel ? -90 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<ChevronDown className="w-4 h-4 text-[#116E63]" />
							</motion.button>
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
					<div className="mb-6">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2">
								<FileText className="w-5 h-5 text-[#116E63]" />
								<h4 className="font-medium text-[#116E63]">Essay required</h4>
							</div>
							<motion.button
								onClick={() => toggleSection('essayRequired')}
								className="p-1 hover:bg-gray-100 rounded-full transition-colors"
								animate={{ rotate: collapsedSections.essayRequired ? -90 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<ChevronDown className="w-4 h-4 text-[#116E63]" />
							</motion.button>
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
					<div className="mb-6">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2">
								<Users className="w-5 h-5 text-[#116E63]" />
								<h4 className="font-medium text-[#116E63]">Attendance</h4>
							</div>
							<motion.button
								onClick={() => toggleSection('attendance')}
								className="p-1 hover:bg-gray-100 rounded-full transition-colors"
								animate={{ rotate: collapsedSections.attendance ? -90 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<ChevronDown className="w-4 h-4 text-[#116E63]" />
							</motion.button>
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
					<div className="mb-6">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2">
								<Briefcase className="w-5 h-5 text-[#116E63]" />
								<h4 className="font-medium text-[#116E63]">Type of Contract</h4>
							</div>
							<motion.button
								onClick={() => toggleSection('contractType')}
								className="p-1 hover:bg-gray-100 rounded-full transition-colors"
								animate={{ rotate: collapsedSections.contractType ? -90 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<ChevronDown className="w-4 h-4 text-[#116E63]" />
							</motion.button>
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
					<div className="mb-6">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2">
								<Building className="w-5 h-5 text-[#116E63]" />
								<h4 className="font-medium text-[#116E63]">Job type</h4>
							</div>
							<motion.button
								onClick={() => toggleSection('jobType')}
								className="p-1 hover:bg-gray-100 rounded-full transition-colors"
								animate={{ rotate: collapsedSections.jobType ? -90 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<ChevronDown className="w-4 h-4 text-[#116E63]" />
							</motion.button>
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
