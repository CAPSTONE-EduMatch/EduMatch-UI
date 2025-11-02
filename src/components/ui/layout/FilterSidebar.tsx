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
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { TabType } from '@/types/explore'
import { Program, Scholarship, ResearchLab } from '@/types/explore-api'

interface FilterSidebarProps {
	activeTab: TabType
	onFiltersChange?: (filters: Record<string, string[]>) => void
}

interface DisciplineData {
	disciplines: Array<{
		id: string
		name: string
		subdisciplines: Array<{
			id: string
			name: string
		}>
	}>
	subdisciplines: Array<{
		id: string
		name: string
		disciplineName: string
	}>
	subdisciplinesByDiscipline: Record<string, string[]>
}

export function FilterSidebar({
	activeTab,
	onFiltersChange,
}: FilterSidebarProps) {
	const searchParams = useSearchParams()

	// State to track if filters have been initialized from URL
	const [filtersInitialized, setFiltersInitialized] = useState(false)

	// Separate filter states for each tab
	const [tabFilters, setTabFilters] = useState<
		Record<string, Record<string, string[]>>
	>({
		programmes: {
			discipline: [],
			country: [],
			duration: [],
			degreeLevel: [],
			attendance: [],
		},
		scholarships: {
			discipline: [],
			country: [],
			degreeLevel: [],
			essayRequired: [],
		},
		research: {
			researchField: [],
			country: [],
			degreeLevel: [],
			attendance: [],
			contractType: [],
			jobType: [],
		},
	})

	// Separate ranges for each tab
	const [tabRanges, setTabRanges] = useState<
		Record<
			string,
			{
				fee?: { min: number; max: number }
				salary?: { min: number; max: number }
			}
		>
	>({
		programmes: {
			fee: { min: 0, max: 1000000 },
		},
		scholarships: {},
		research: {
			salary: { min: 0, max: 200000 },
		},
	})

	// Separate discipline navigation for each tab
	const [tabDisciplineState, setTabDisciplineState] = useState<
		Record<string, { selectedDiscipline: string; showSubdisciplines: boolean }>
	>({
		programmes: { selectedDiscipline: '', showSubdisciplines: false },
		scholarships: { selectedDiscipline: '', showSubdisciplines: false },
		research: { selectedDiscipline: '', showSubdisciplines: false },
	})

	// Separate search terms for each tab
	const [tabSearchTerms, setTabSearchTerms] = useState<
		Record<string, Record<string, string>>
	>({
		programmes: {
			discipline: '',
			subdiscipline: '',
			country: '',
		},
		scholarships: {
			discipline: '',
			subdiscipline: '',
			country: '',
		},
		research: {
			researchField: '',
			country: '',
		},
	})

	// Get current tab's data
	const selectedFilters = tabFilters[activeTab] || {}
	const selectedDiscipline =
		tabDisciplineState[activeTab]?.selectedDiscipline || ''
	const showSubdisciplines =
		tabDisciplineState[activeTab]?.showSubdisciplines || false
	const searchTerms = tabSearchTerms[activeTab] || {}
	const feeRange = tabRanges[activeTab]?.fee || { min: 0, max: 1000000 }
	const salaryRange = tabRanges[activeTab]?.salary || { min: 0, max: 200000 }

	// Dynamic filter data
	const [dynamicFilters, setDynamicFilters] = useState<{
		countries: string[]
		disciplines: string[]
		researchFields: string[]
		degreeLevels: string[]
		attendanceTypes: string[]
		essayRequired: string[]
		jobTypes: string[]
		contractTypes: string[]
		subdisciplines: Record<string, string[]>
	}>({
		countries: [],
		disciplines: [],
		researchFields: [],
		degreeLevels: [],
		attendanceTypes: [],
		essayRequired: [],
		jobTypes: [],
		contractTypes: [],
		subdisciplines: {},
	})

	const [isLoadingFilters, setIsLoadingFilters] = useState(false)

	// Store all disciplines data
	const [allDisciplinesData, setAllDisciplinesData] =
		useState<DisciplineData | null>(null)

	// Helper function to serialize filters to URL with tab prefix
	const serializeFiltersToURL = useCallback(
		(filters: Record<string, string[]>, ranges: any) => {
			const params = new URLSearchParams(searchParams.toString())

			// Add tab to URL
			params.set('tab', activeTab)

			// Clear previous filters for current tab
			const filterKeys = [
				'discipline',
				'country',
				'duration',
				'degreeLevel',
				'attendance',
				'researchField',
				'essayRequired',
				'contractType',
				'jobType',
			]
			filterKeys.forEach((key) => {
				params.delete(`${activeTab}_${key}`)
			})
			params.delete(`${activeTab}_feeMin`)
			params.delete(`${activeTab}_feeMax`)
			params.delete(`${activeTab}_salaryMin`)
			params.delete(`${activeTab}_salaryMax`)

			// Add filters to URL with tab prefix
			Object.entries(filters).forEach(([key, values]) => {
				if (values && values.length > 0) {
					params.set(`${activeTab}_${key}`, values.join(','))
				}
			})

			// Add ranges to URL with tab prefix
			if (ranges.fee) {
				if (ranges.fee.min !== 0 || ranges.fee.max !== 1000000) {
					params.set(`${activeTab}_feeMin`, ranges.fee.min.toString())
					params.set(`${activeTab}_feeMax`, ranges.fee.max.toString())
				}
			}
			if (ranges.salary) {
				if (ranges.salary.min !== 0 || ranges.salary.max !== 200000) {
					params.set(`${activeTab}_salaryMin`, ranges.salary.min.toString())
					params.set(`${activeTab}_salaryMax`, ranges.salary.max.toString())
				}
			}

			return params.toString()
		},
		[activeTab, searchParams]
	)

	// Helper function to parse filters from URL with tab prefix
	const parseFiltersFromURL = useCallback(() => {
		const filters: Record<string, string[]> = {}
		const ranges: any = {}

		// Parse regular filters with tab prefix
		const filterKeys = [
			'discipline',
			'country',
			'duration',
			'degreeLevel',
			'attendance',
			'researchField',
			'essayRequired',
			'contractType',
			'jobType',
		]
		filterKeys.forEach((key) => {
			const value = searchParams.get(`${activeTab}_${key}`)
			if (value) {
				filters[key] = value.split(',')
			}
		})

		// Parse ranges with tab prefix
		const feeMin = searchParams.get(`${activeTab}_feeMin`)
		const feeMax = searchParams.get(`${activeTab}_feeMax`)
		if (feeMin || feeMax) {
			ranges.fee = {
				min: feeMin ? parseInt(feeMin) : 0,
				max: feeMax ? parseInt(feeMax) : 1000000,
			}
		}

		const salaryMin = searchParams.get(`${activeTab}_salaryMin`)
		const salaryMax = searchParams.get(`${activeTab}_salaryMax`)
		if (salaryMin || salaryMax) {
			ranges.salary = {
				min: salaryMin ? parseInt(salaryMin) : 0,
				max: salaryMax ? parseInt(salaryMax) : 200000,
			}
		}

		return { filters, ranges }
	}, [searchParams, activeTab])

	// Parse all tabs' filters from URL on component mount
	useEffect(() => {
		const parseAllTabFiltersFromURL = () => {
			const newTabFilters = {
				programmes: {
					discipline: [],
					country: [],
					duration: [],
					degreeLevel: [],
					attendance: [],
				},
				scholarships: {
					discipline: [],
					country: [],
					degreeLevel: [],
					essayRequired: [],
				},
				research: {
					researchField: [],
					country: [],
					degreeLevel: [],
					attendance: [],
					contractType: [],
					jobType: [],
				},
			}
			const newTabRanges = {
				programmes: {
					fee: { min: 0, max: 1000000 },
				},
				scholarships: {},
				research: {
					salary: { min: 0, max: 200000 },
				},
			}

			const tabs = ['programmes', 'scholarships', 'research']

			tabs.forEach((tab) => {
				const filters: Record<string, string[]> = {}
				const ranges: any = {}

				// Parse filters for this tab
				const filterKeys = [
					'discipline',
					'country',
					'duration',
					'degreeLevel',
					'attendance',
					'researchField',
					'essayRequired',
					'contractType',
					'jobType',
				]
				filterKeys.forEach((key) => {
					const value = searchParams.get(`${tab}_${key}`)
					if (value) {
						filters[key] = value.split(',')
					}
				})

				// Parse ranges for this tab
				const feeMin = searchParams.get(`${tab}_feeMin`)
				const feeMax = searchParams.get(`${tab}_feeMax`)
				if (feeMin || feeMax) {
					ranges.fee = {
						min: feeMin ? parseInt(feeMin) : 0,
						max: feeMax ? parseInt(feeMax) : 1000000,
					}
				}

				const salaryMin = searchParams.get(`${tab}_salaryMin`)
				const salaryMax = searchParams.get(`${tab}_salaryMax`)
				if (salaryMin || salaryMax) {
					ranges.salary = {
						min: salaryMin ? parseInt(salaryMin) : 0,
						max: salaryMax ? parseInt(salaryMax) : 200000,
					}
				}

				// Update state if there are filters for this tab
				if (Object.keys(filters).length > 0) {
					;(newTabFilters as any)[tab] = {
						...(newTabFilters as any)[tab],
						...filters,
					}
				}

				if (Object.keys(ranges).length > 0) {
					;(newTabRanges as any)[tab] = {
						...(newTabRanges as any)[tab],
						...ranges,
					}
				}
			})

			setTabFilters(newTabFilters)
			setTabRanges(newTabRanges)

			// Mark filters as initialized
			setFiltersInitialized(true)
		}

		// Only parse on initial mount (when searchParams is first available)
		if (searchParams && searchParams.toString()) {
			parseAllTabFiltersFromURL()
		} else {
			// If no search params, mark as initialized with empty filters
			setFiltersInitialized(true)
		}
	}, [searchParams]) // Remove activeTab and onFiltersChange to prevent unnecessary re-runs

	// Initialize filters from URL when tab changes
	useEffect(() => {
		const urlData = parseFiltersFromURL()

		// Always update the current tab's filters from URL (even if empty to reset)
		setTabFilters((prev) => ({
			...prev,
			[activeTab]: {
				...prev[activeTab],
				...urlData.filters,
			},
		}))

		setTabRanges((prev) => ({
			...prev,
			[activeTab]: {
				...prev[activeTab],
				...urlData.ranges,
			},
		}))
	}, [activeTab]) // Only depend on activeTab, not parseFiltersFromURL or filtersInitialized

	// Ensure filters are initialized when component mounts or when switching tabs
	useEffect(() => {
		if (!filtersInitialized) {
			setFiltersInitialized(true)
		}
	}, [filtersInitialized])

	// Update URL when filters change
	useEffect(() => {
		const currentFilters = tabFilters[activeTab] || {}
		const currentRanges = tabRanges[activeTab] || {}

		const urlString = serializeFiltersToURL(currentFilters, currentRanges)
		const newURL = `${window.location.pathname}${urlString ? `?${urlString}` : ''}`

		// Only update URL if it's different to avoid infinite loops
		if (window.location.search !== `?${urlString}`) {
			window.history.replaceState({}, '', newURL)
		}
	}, [tabFilters, tabRanges, activeTab]) // Remove serializeFiltersToURL to prevent infinite loops

	// Fetch all disciplines data once on mount
	useEffect(() => {
		const fetchAllDisciplines = async () => {
			try {
				const response = await fetch('/api/disciplines')
				const data = await response.json()
				setAllDisciplinesData(data)
			} catch (error) {
				if (process.env.NODE_ENV === 'development') {
					// eslint-disable-next-line no-console
					console.error('Error fetching all disciplines:', error)
				}
			}
		}

		fetchAllDisciplines()
	}, [])

	// Call onFiltersChange when selectedFilters or ranges change (only after initialization)
	useEffect(() => {
		// Only trigger onFiltersChange after filters have been initialized from URL
		if (onFiltersChange && filtersInitialized) {
			const currentFilters = tabFilters[activeTab] || {}
			const currentRanges = tabRanges[activeTab] || {}

			// Include fee range and salary range in the filters
			const filtersWithRanges = {
				...currentFilters,
				...(currentRanges.fee && {
					feeRange: [`${currentRanges.fee.min}-${currentRanges.fee.max}`],
				}),
				...(currentRanges.salary && {
					salaryRange: [
						`${currentRanges.salary.min}-${currentRanges.salary.max}`,
					],
				}),
			}
			onFiltersChange(filtersWithRanges)
		}
	}, [tabFilters, tabRanges, activeTab, filtersInitialized]) // Remove onFiltersChange to prevent infinite loops

	// Fetch filter data when tab changes
	useEffect(() => {
		const fetchFilterData = async () => {
			setIsLoadingFilters(true)
			try {
				let endpoint = ''
				switch (activeTab) {
					case 'programmes':
						endpoint = '/api/explore/programs'
						break
					case 'scholarships':
						endpoint = '/api/explore/scholarships'
						break
					case 'research':
						endpoint = '/api/explore/research'
						break
					default:
						return
				}

				const response = await fetch(`${endpoint}?limit=1000`)
				const data = await response.json()

				if (data.availableFilters) {
					// Use available filters from API response
					setDynamicFilters({
						countries: data.availableFilters.countries || [],
						disciplines: data.availableFilters.disciplines || [],
						researchFields: data.availableFilters.researchFields || [],
						degreeLevels: data.availableFilters.degreeLevels || [],
						attendanceTypes: data.availableFilters.attendanceTypes || [],
						essayRequired: data.availableFilters.essayRequired || [],
						jobTypes: data.availableFilters.jobTypes || [],
						contractTypes: data.availableFilters.contractTypes || [],
						subdisciplines: data.availableFilters.subdisciplines || {},
					})
				} else if (data.data) {
					// Fallback to extracting from data if availableFilters not provided
					const extractedFilters = extractFilterOptions(data.data, activeTab)
					setDynamicFilters({
						...extractedFilters,
						subdisciplines: {},
					})
				}
			} catch (error) {
				if (process.env.NODE_ENV === 'development') {
					// eslint-disable-next-line no-console
					console.error('Error fetching filter data:', error)
				}
			} finally {
				setIsLoadingFilters(false)
			}
		}

		fetchFilterData()
	}, [activeTab])

	// Extract filter options from API data
	const extractFilterOptions = (
		data: Program[] | Scholarship[] | ResearchLab[],
		tab: TabType
	) => {
		const countries = Array.from(
			new Set(data.map((item) => item.country).filter(Boolean))
		).sort()

		let disciplines: string[] = []
		let researchFields: string[] = []
		let degreeLevels: string[] = []
		let attendanceTypes: string[] = []
		let essayRequired: string[] = []
		let jobTypes: string[] = []
		let contractTypes: string[] = []

		if (tab === 'programmes') {
			const programs = data as Program[]
			disciplines = Array.from(
				new Set(programs.map((p) => p.field).filter(Boolean))
			).sort()
			degreeLevels = Array.from(
				new Set(
					programs
						.map((p) => {
							// Extract degree level from field or other properties
							const field = p.field.toLowerCase()
							if (
								field.includes('master') ||
								field.includes('msc') ||
								field.includes('ma')
							)
								return 'Master'
							if (field.includes('phd') || field.includes('doctorate'))
								return 'PhD'
							if (
								field.includes('bachelor') ||
								field.includes('bsc') ||
								field.includes('ba')
							)
								return 'Bachelor'
							return 'Other'
						})
						.filter(Boolean)
				)
			).sort()
			attendanceTypes = Array.from(
				new Set(programs.map((p) => p.attendance).filter(Boolean))
			).sort()
		} else if (tab === 'scholarships') {
			const scholarships = data as Scholarship[]
			disciplines = Array.from(
				new Set(
					scholarships
						.map((s) => {
							// Extract disciplines from description or other fields
							const desc = s.description.toLowerCase()
							if (desc.includes('engineering')) return 'Engineering'
							if (desc.includes('computer') || desc.includes('technology'))
								return 'Computer Science'
							if (desc.includes('business') || desc.includes('management'))
								return 'Business'
							if (desc.includes('medicine') || desc.includes('health'))
								return 'Medicine'
							if (desc.includes('art') || desc.includes('humanities'))
								return 'Arts & Humanities'
							if (desc.includes('science')) return 'Sciences'
							if (desc.includes('law')) return 'Law'
							return 'Other'
						})
						.filter(Boolean)
				)
			).sort()
			degreeLevels = Array.from(
				new Set(
					scholarships
						.map((s) => {
							const desc = s.description.toLowerCase()
							if (
								desc.includes('master') ||
								desc.includes('msc') ||
								desc.includes('ma')
							)
								return 'Master'
							if (desc.includes('phd') || desc.includes('doctorate'))
								return 'PhD'
							if (
								desc.includes('bachelor') ||
								desc.includes('bsc') ||
								desc.includes('ba')
							)
								return 'Bachelor'
							return 'Other'
						})
						.filter(Boolean)
				)
			).sort()
			essayRequired = Array.from(
				new Set(scholarships.map((s) => s.essayRequired).filter(Boolean))
			).sort()
		} else if (tab === 'research') {
			const research = data as ResearchLab[]
			researchFields = Array.from(
				new Set(research.map((r) => r.field).filter(Boolean))
			).sort()
			jobTypes = Array.from(
				new Set(research.map((r) => r.position).filter(Boolean))
			).sort()
			degreeLevels = Array.from(
				new Set(
					research
						.map((r) => {
							const pos = r.position.toLowerCase()
							if (pos.includes('phd')) return 'PhD'
							if (pos.includes('postdoc')) return 'Postdoc'
							if (pos.includes('master')) return 'Master'
							return 'Other'
						})
						.filter(Boolean)
				)
			).sort()
			contractTypes = Array.from(
				new Set(
					research
						.map((r) => {
							const desc = r.description.toLowerCase()
							if (desc.includes('full-time') || desc.includes('fulltime'))
								return 'Full-time'
							if (desc.includes('part-time') || desc.includes('parttime'))
								return 'Part-time'
							if (desc.includes('contract')) return 'Contract'
							return 'Full-time' // default
						})
						.filter(Boolean)
				)
			).sort()
		}

		return {
			countries,
			disciplines,
			researchFields,
			degreeLevels,
			attendanceTypes,
			essayRequired,
			jobTypes,
			contractTypes,
		}
	}

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
		setTabFilters((prev) => ({
			...prev,
			[activeTab]: {
				...prev[activeTab],
				[category]: prev[activeTab]?.[category]?.includes(value)
					? prev[activeTab][category].filter((item) => item !== value)
					: [...(prev[activeTab]?.[category] || []), value],
			},
		}))
	}

	const handleDisciplineSelect = (discipline: string) => {
		setTabDisciplineState((prev) => ({
			...prev,
			[activeTab]: {
				...prev[activeTab],
				selectedDiscipline: discipline,
				showSubdisciplines: true,
			},
		}))
		// Reset discipline search when selecting a discipline
		setTabSearchTerms((prev) => ({
			...prev,
			[activeTab]: {
				...prev[activeTab],
				discipline: '',
			},
		}))
	}

	const handleSubdisciplineSelect = (subdiscipline: string) => {
		setTabFilters((prev) => ({
			...prev,
			[activeTab]: {
				...prev[activeTab],
				discipline: prev[activeTab]?.discipline?.includes(subdiscipline)
					? prev[activeTab].discipline.filter((item) => item !== subdiscipline)
					: [...(prev[activeTab]?.discipline || []), subdiscipline],
			},
		}))
	}

	const handleBackToDisciplines = () => {
		setTabDisciplineState((prev) => ({
			...prev,
			[activeTab]: {
				...prev[activeTab],
				showSubdisciplines: false,
				selectedDiscipline: '',
			},
		}))
		// Reset subdiscipline search when going back
		setTabSearchTerms((prev) => ({
			...prev,
			[activeTab]: {
				...prev[activeTab],
				subdiscipline: '',
			},
		}))
	}

	const handleRefresh = () => {
		// Check if there are any active filters before refreshing
		const currentFilters = tabFilters[activeTab] || {}
		const currentRanges = tabRanges[activeTab] || {}
		const currentSearchTerms = tabSearchTerms[activeTab] || {}
		const currentDisciplineState = tabDisciplineState[activeTab] || {}

		// Check if any filters are active
		const hasActiveFilters =
			Object.values(currentFilters).some((arr) => arr.length > 0) ||
			Object.values(currentSearchTerms).some((term) => term !== '') ||
			currentDisciplineState.selectedDiscipline !== '' ||
			currentDisciplineState.showSubdisciplines ||
			(currentRanges.fee &&
				(currentRanges.fee.min !== 0 || currentRanges.fee.max !== 1000000)) ||
			(currentRanges.salary &&
				(currentRanges.salary.min !== 0 || currentRanges.salary.max !== 200000))

		// Only refresh if there are active filters
		if (!hasActiveFilters) return

		// Reset filters for current tab only
		switch (activeTab) {
			case 'programmes':
				setTabFilters((prev) => ({
					...prev,
					[activeTab]: {
						discipline: [],
						country: [],
						duration: [],
						degreeLevel: [],
						attendance: [],
					},
				}))
				setTabRanges((prev) => ({
					...prev,
					[activeTab]: {
						...prev[activeTab],
						fee: { min: 0, max: 1000000 },
					},
				}))
				setTabSearchTerms((prev) => ({
					...prev,
					[activeTab]: {
						discipline: '',
						subdiscipline: '',
						country: '',
					},
				}))
				break

			case 'scholarships':
				setTabFilters((prev) => ({
					...prev,
					[activeTab]: {
						discipline: [],
						country: [],
						degreeLevel: [],
						essayRequired: [],
					},
				}))
				setTabSearchTerms((prev) => ({
					...prev,
					[activeTab]: {
						discipline: '',
						subdiscipline: '',
						country: '',
					},
				}))
				break

			case 'research':
				setTabFilters((prev) => ({
					...prev,
					[activeTab]: {
						researchField: [],
						country: [],
						degreeLevel: [],
						attendance: [],
						contractType: [],
						jobType: [],
					},
				}))
				setTabRanges((prev) => ({
					...prev,
					[activeTab]: {
						...prev[activeTab],
						salary: { min: 0, max: 200000 },
					},
				}))
				setTabSearchTerms((prev) => ({
					...prev,
					[activeTab]: {
						researchField: '',
						country: '',
					},
				}))
				break
		}

		// Always reset discipline/subdiscipline navigation for current tab
		setTabDisciplineState((prev) => ({
			...prev,
			[activeTab]: {
				selectedDiscipline: '',
				showSubdisciplines: false,
			},
		}))
	}

	// Helper functions for range updates
	const updateFeeRange = (newMin?: number, newMax?: number) => {
		setTabRanges((prev) => ({
			...prev,
			[activeTab]: {
				...prev[activeTab],
				fee: {
					min: newMin !== undefined ? newMin : prev[activeTab]?.fee?.min || 0,
					max:
						newMax !== undefined
							? newMax
							: prev[activeTab]?.fee?.max || 1000000,
				},
			},
		}))
	}

	const updateSalaryRange = (newMin?: number, newMax?: number) => {
		setTabRanges((prev) => ({
			...prev,
			[activeTab]: {
				...prev[activeTab],
				salary: {
					min:
						newMin !== undefined ? newMin : prev[activeTab]?.salary?.min || 0,
					max:
						newMax !== undefined
							? newMax
							: prev[activeTab]?.salary?.max || 200000,
				},
			},
		}))
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
					// Use ALL disciplines from database instead of just from current programs
					disciplines: allDisciplinesData?.disciplines.map((d) => d.name) || [],
					subdisciplines: allDisciplinesData?.subdisciplinesByDiscipline || {},
					countries: dynamicFilters.countries,
					durations: [
						'Less than 1 year',
						'1 year',
						'1.5 years',
						'2 years',
						'More than 2 years',
					],
					degreeLevels: dynamicFilters.degreeLevels,
					attendanceTypes: dynamicFilters.attendanceTypes,
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
					// Use ALL disciplines from database
					disciplines: allDisciplinesData?.disciplines.map((d) => d.name) || [],
					subdisciplines: allDisciplinesData?.subdisciplinesByDiscipline || {},
					countries: dynamicFilters.countries,
					degreeLevels: dynamicFilters.degreeLevels,
					essayRequired: dynamicFilters.essayRequired,
					sections: [
						'discipline',
						'country',
						'degreeLevel',
						'essayRequired',
					] as const,
				}

			case 'research':
				return {
					researchFields: dynamicFilters.researchFields,
					countries: dynamicFilters.countries,
					salaryRanges: [
						'$50,000 - $70,000',
						'$70,000 - $90,000',
						'$90,000 - $120,000',
						'$120,000+',
					],
					degreeLevels: dynamicFilters.degreeLevels,
					attendanceTypes: dynamicFilters.attendanceTypes,
					contractTypes: dynamicFilters.contractTypes,
					jobTypes: dynamicFilters.jobTypes,
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

	// Helper function to filter options based on search term
	const filterOptions = (options: string[], searchTerm: string) => {
		if (!searchTerm) return options
		return options.filter((option) =>
			option.toLowerCase().includes(searchTerm.toLowerCase())
		)
	}

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
											<div className="relative mb-3">
												<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
												<input
													type="text"
													placeholder="Search discipline..."
													value={searchTerms.discipline}
													onChange={(e) =>
														setTabSearchTerms((prev) => ({
															...prev,
															[activeTab]: {
																...prev[activeTab],
																discipline: e.target.value,
															},
														}))
													}
													className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
												/>
												<button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#116E63] text-white p-1 rounded">
													<Search className="w-4 h-4" />
												</button>
											</div>
											<p className="text-sm text-gray-600 mb-3">
												Select a discipline
											</p>
											<div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
												{!allDisciplinesData ? (
													<div className="flex items-center justify-center py-4">
														<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#116E63]"></div>
														<span className="ml-2 text-sm text-gray-600">
															Loading disciplines...
														</span>
													</div>
												) : filterConfig.disciplines &&
												  filterConfig.disciplines.length > 0 ? (
													filterOptions(
														filterConfig.disciplines,
														searchTerms.discipline
													).length > 0 ? (
														filterOptions(
															filterConfig.disciplines,
															searchTerms.discipline
														).map((discipline) => (
															<motion.button
																key={discipline}
																onClick={() =>
																	handleDisciplineSelect(discipline)
																}
																className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-[#116E63] hover:bg-[#116E63]/5 transition-colors text-sm"
																whileHover={{ x: 2 }}
															>
																<span className="font-medium text-gray-700">
																	{discipline}
																</span>
																<span className="text-xs text-gray-500 block">
																	{filterConfig.subdisciplines?.[discipline]
																		?.length || 0}{' '}
																	subdisciplines
																</span>
															</motion.button>
														))
													) : (
														<div className="flex items-center justify-center py-8 text-gray-500">
															<div className="text-center">
																<div className="text-2xl mb-2">🔍</div>
																<p className="text-sm">
																	No disciplines match your search
																</p>
															</div>
														</div>
													)
												) : (
													<div className="flex items-center justify-center py-8 text-gray-500">
														<div className="text-center">
															<div className="text-2xl mb-2">📚</div>
															<p className="text-sm">
																No disciplines available
															</p>
															<p className="text-xs mt-1">
																Check back later or contact support
															</p>
														</div>
													</div>
												)}
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
											<div className="relative mb-3">
												<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
												<input
													type="text"
													placeholder="Search subdiscipline..."
													value={searchTerms.subdiscipline}
													onChange={(e) =>
														setTabSearchTerms((prev) => ({
															...prev,
															[activeTab]: {
																...prev[activeTab],
																subdiscipline: e.target.value,
															},
														}))
													}
													className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
												/>
												<button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#116E63] text-white p-1 rounded">
													<Search className="w-4 h-4" />
												</button>
											</div>
											<p className="text-sm text-gray-600 mb-3">
												{selectedDiscipline} subdisciplines
											</p>
											<div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
												{filterOptions(
													filterConfig.subdisciplines?.[selectedDiscipline] ||
														[],
													searchTerms.subdiscipline
												).map((subdiscipline) => (
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
												))}
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
												setTabSearchTerms((prev) => ({
													...prev,
													[activeTab]: {
														...prev[activeTab],
														researchField: e.target.value,
													},
												}))
											}
											className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
										/>
										<button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#116E63] text-white p-1 rounded">
											<Search className="w-4 h-4" />
										</button>
									</div>

									<div className="max-h-52 overflow-y-auto border border-gray-200 rounded-lg p-2">
										{isLoadingFilters ? (
											<div className="flex items-center justify-center py-4">
												<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#116E63]"></div>
												<span className="ml-2 text-sm text-gray-600">
													Loading...
												</span>
											</div>
										) : (
											filterOptions(
												filterConfig.researchFields || [],
												searchTerms.researchField
											).map((field) => (
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
											))
										)}
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
												setTabSearchTerms((prev) => ({
													...prev,
													[activeTab]: {
														...prev[activeTab],
														country: e.target.value,
													},
												}))
											}
											className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
										/>
										<button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#116E63] text-white p-1 rounded">
											<Search className="w-4 h-4" />
										</button>
									</div>

									<div className="max-h-52 overflow-y-auto border border-gray-200 rounded-lg p-2">
										{isLoadingFilters ? (
											<div className="flex items-center justify-center py-4">
												<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#116E63]"></div>
												<span className="ml-2 text-sm text-gray-600">
													Loading...
												</span>
											</div>
										) : (
											filterOptions(
												filterConfig.countries || [],
												searchTerms.country
											).map((country) => (
												<motion.label
													key={country}
													className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-2"
													whileHover={{ x: 2 }}
												>
													<input
														type="checkbox"
														checked={
															selectedFilters.country?.includes(country) ||
															false
														}
														onChange={() =>
															handleFilterChange('country', country)
														}
														className="w-4 h-4 text-[#116E63] rounded focus:ring-teal-500"
													/>
													<span className="text-sm text-gray-700">
														{country}
													</span>
												</motion.label>
											))
										)}
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
														updateFeeRange(
															Math.min(newMin, feeRange.max - 1000)
														)
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
														updateFeeRange(
															undefined,
															Math.max(newMax, feeRange.min + 1000)
														)
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
														updateFeeRange(
															Math.min(Math.max(newMin, 0), feeRange.max - 1000)
														)
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
														updateFeeRange(
															undefined,
															Math.max(
																Math.min(newMax, 2000000),
																feeRange.min + 1000
															)
														)
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
									<div className="space-y-4">
										{/* Dual Range Slider */}
										<div className="space-y-2">
											<label className="text-sm font-medium text-gray-700">
												Salary Range
											</label>
											<div className="relative">
												{/* Min slider */}
												<input
													type="range"
													min="0"
													max="300000"
													step="5000"
													value={salaryRange.min}
													onChange={(e) => {
														const newMin = Number.parseInt(e.target.value)
														updateSalaryRange(
															Math.min(newMin, salaryRange.max - 5000)
														)
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
													max="300000"
													step="5000"
													value={salaryRange.max}
													onChange={(e) => {
														const newMax = Number.parseInt(e.target.value)
														updateSalaryRange(
															undefined,
															Math.max(newMax, salaryRange.min + 5000)
														)
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
															left: `${(salaryRange.min / 300000) * 100}%`,
															right: `${100 - (salaryRange.max / 300000) * 100}%`,
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
													value={salaryRange.min}
													onChange={(e) => {
														const newMin = Number.parseInt(e.target.value) || 0
														updateSalaryRange(
															Math.min(
																Math.max(newMin, 0),
																salaryRange.max - 5000
															)
														)
													}}
													className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#116E63] focus:border-[#116E63]"
													min="0"
													max="300000"
												/>
											</div>
											<div className="space-y-1">
												<label className="text-xs text-gray-500">Max ($)</label>
												<input
													type="number"
													value={salaryRange.max}
													onChange={(e) => {
														const newMax = Number.parseInt(e.target.value) || 0
														updateSalaryRange(
															undefined,
															Math.max(
																Math.min(newMax, 300000),
																salaryRange.min + 5000
															)
														)
													}}
													className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#116E63] focus:border-[#116E63]"
													min="0"
													max="300000"
												/>
											</div>
										</div>
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
										{(filterConfig.degreeLevels || []).map((level) => (
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
										{isLoadingFilters ? (
											<div className="flex items-center justify-center py-4">
												<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#116E63]"></div>
												<span className="ml-2 text-sm text-gray-600">
													Loading...
												</span>
											</div>
										) : (
											filterConfig.essayRequired?.map((option) => (
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
													<span className="text-sm text-gray-700">
														{option}
													</span>
												</motion.label>
											))
										)}
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
										{(filterConfig.attendanceTypes || []).map((type) => (
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
										{(filterConfig.contractTypes || []).map((type) => (
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
										{(filterConfig.jobTypes || []).map((type) => (
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
		</motion.div>
	)
}
