'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'
import {
	DateInput,
	CustomSelect,
	RichTextEditor,
	SuccessModal,
	ErrorModal,
} from '@/components/ui'
import { getCountriesWithSvgFlags, Country } from '@/data/countries'
import { ApiService } from '@/lib/axios-config'

interface CreateProgramPageProps {
	onBack?: () => void
	onSubmit?: () => void
}

export const CreateProgramPage: React.FC<CreateProgramPageProps> = ({
	onBack,
	onSubmit,
}) => {
	const router = useRouter()

	// Handle back navigation with URL cleanup
	const handleBack = () => {
		// Remove action and type from URL when going back
		const url = new URL(window.location.href)
		url.searchParams.delete('action')
		url.searchParams.delete('type')
		router.replace(url.pathname + url.search, { scroll: false })
		onBack?.()
	}
	// State for subdisciplines loaded from database
	const [subdisciplines, setSubdisciplines] = useState<
		Array<{ value: string; label: string; discipline: string }>
	>([])

	// Modal states
	const [showSuccessModal, setShowSuccessModal] = useState(false)
	const [showErrorModal, setShowErrorModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')

	// Load subdisciplines from database
	useEffect(() => {
		const loadSubdisciplines = async () => {
			try {
				const response = await ApiService.getSubdisciplines()
				if (response.success) {
					setSubdisciplines(response.subdisciplines)
				}
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('Failed to load subdisciplines:', error)
			}
		}
		loadSubdisciplines()
	}, [])

	const [formData, setFormData] = useState({
		// Overview Section
		programTitle: 'International Business and Intercultural Management',
		startDate: '',
		applicationDeadline: '',
		subdiscipline: 'Information system',
		duration: 'More than 2 years',
		degreeLevel: 'Master',
		attendance: 'At campus',
		location: 'Vietnam',

		// Programme Structure
		courseInclude: `<ul>
<li>Strategy and Governance in IT</li>
<li>Project Management</li>
<li>Information Security</li>
<li>Digital Design and Development</li>
<li>Group Software Development Project</li>
<li>Cloud Computing</li>
</ul>`,
		description: '',

		// Admission Requirements
		academicRequirements: {
			gpa: '',
			gre: '',
			gmat: '',
		},
		languageRequirements: [
			{
				language: 'English',
				certificate: 'IELTS',
				score: '7.0',
			},
		],

		// File Requirements
		fileRequirements: {
			fileName: 'Required Documents',
			fileDescription: '',
		},

		// Tuition Fee
		tuitionFee: {
			international: '',
			description: '',
		},

		// Scholarship
		scholarship: {
			information: '',
		},

		// Other Information
		otherInformation: {
			content: '',
		},
	})

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}))
	}

	const handleAcademicRequirementChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			academicRequirements: {
				...prev.academicRequirements,
				[field]: value,
			},
		}))
	}

	const handleLanguageRequirementChange = (
		index: number,
		field: string,
		value: string
	) => {
		setFormData((prev) => ({
			...prev,
			languageRequirements: prev.languageRequirements.map((req, i) =>
				i === index ? { ...req, [field]: value } : req
			),
		}))
	}

	const addLanguageRequirement = () => {
		setFormData((prev) => ({
			...prev,
			languageRequirements: [
				...prev.languageRequirements,
				{ language: '', certificate: '', score: '' },
			],
		}))
	}

	const removeLanguageRequirement = (index: number) => {
		setFormData((prev) => ({
			...prev,
			languageRequirements: prev.languageRequirements.filter(
				(_, i) => i !== index
			),
		}))
	}

	// Function to get certificate options based on selected language
	const getCertificateOptions = (language: string) => {
		switch (language) {
			case 'English':
				return [
					{ value: 'IELTS', label: 'IELTS' },
					{ value: 'TOEFL', label: 'TOEFL' },
					{ value: 'TOEIC', label: 'TOEIC' },
					{ value: 'Cambridge', label: 'Cambridge' },
					{ value: 'PTE', label: 'PTE Academic' },
					{ value: 'Duolingo', label: 'Duolingo English Test' },
				]
			case 'Spanish':
				return [
					{ value: 'DELE', label: 'DELE' },
					{ value: 'SIELE', label: 'SIELE' },
					{ value: 'CELU', label: 'CELU' },
				]
			case 'French':
				return [
					{ value: 'DELF', label: 'DELF' },
					{ value: 'DALF', label: 'DALF' },
					{ value: 'TCF', label: 'TCF' },
					{ value: 'TEF', label: 'TEF' },
				]
			case 'German':
				return [
					{ value: 'Goethe', label: 'Goethe-Zertifikat' },
					{ value: 'TestDaF', label: 'TestDaF' },
					{ value: 'DSH', label: 'DSH' },
				]
			case 'Chinese':
				return [
					{ value: 'HSK', label: 'HSK' },
					{ value: 'TOCFL', label: 'TOCFL' },
					{ value: 'BCT', label: 'BCT' },
				]
			case 'Japanese':
				return [
					{ value: 'JLPT', label: 'JLPT' },
					{ value: 'J-Test', label: 'J-Test' },
					{ value: 'NAT-TEST', label: 'NAT-TEST' },
				]
			case 'Korean':
				return [
					{ value: 'TOPIK', label: 'TOPIK' },
					{ value: 'KLAT', label: 'KLAT' },
				]
			case 'Vietnamese':
				return [
					{ value: 'VSTEP', label: 'VSTEP' },
					{ value: 'Other', label: 'Other Vietnamese Certificate' },
				]
			default:
				return [{ value: 'Other', label: 'Other Certificate' }]
		}
	}

	const handleFileRequirementChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			fileRequirements: {
				...prev.fileRequirements,
				[field]: value,
			},
		}))
	}

	const handleTuitionFeeChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			tuitionFee: {
				...prev.tuitionFee,
				[field]: value,
			},
		}))
	}

	const handleScholarshipChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			scholarship: {
				...prev.scholarship,
				[field]: value,
			},
		}))
	}

	const handleOtherInformationChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			otherInformation: {
				...prev.otherInformation,
				[field]: value,
			},
		}))
	}

	// Function to validate and format GPA score (0.0-4.0 scale)
	const handleGpaInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value

		// Allow empty string
		if (value === '') {
			handleAcademicRequirementChange('gpa', '')
			return
		}

		// Allow typing decimal separators and numbers
		let cleanValue = value.replace(/[^0-9.,]/g, '')

		// Allow partial input like "3." or "3," while typing
		if (cleanValue.endsWith('.') || cleanValue.endsWith(',')) {
			handleAcademicRequirementChange('gpa', cleanValue)
			return
		}

		// Replace comma with period for consistent decimal separator
		cleanValue = cleanValue.replace(',', '.')

		// Ensure only one decimal point
		const decimalParts = cleanValue.split('.')
		if (decimalParts.length > 2) {
			cleanValue = decimalParts[0] + '.' + decimalParts.slice(1).join('')
		}

		// Convert to number and validate range (0.0 to 4.0)
		const numValue = parseFloat(cleanValue)
		if (!isNaN(numValue) && numValue >= 0 && numValue <= 4.0) {
			// Format to max 2 decimal places
			cleanValue = numValue.toFixed(2).replace(/\.?0+$/, '')
			handleAcademicRequirementChange('gpa', cleanValue)
		} else if (
			cleanValue === '0' ||
			cleanValue === '1' ||
			cleanValue === '2' ||
			cleanValue === '3' ||
			cleanValue === '4'
		) {
			// Allow single digits 0-4
			handleAcademicRequirementChange('gpa', cleanValue)
		}
	}

	// Function to validate and format GRE score (130-170 range)
	const handleGreInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value

		// Allow empty string
		if (value === '') {
			handleAcademicRequirementChange('gre', '')
			return
		}

		// Allow only numbers
		let cleanValue = value.replace(/[^0-9]/g, '')

		// Convert to number and validate range (130-170)
		const numValue = parseInt(cleanValue)
		if (!isNaN(numValue) && numValue >= 130 && numValue <= 170) {
			handleAcademicRequirementChange('gre', cleanValue)
		} else if (cleanValue.length <= 3) {
			// Allow partial input while typing (e.g., "1", "13", "130")
			handleAcademicRequirementChange('gre', cleanValue)
		}
	}

	// Function to validate and format GMAT score (200-800 range)
	const handleGmatInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value

		// Allow empty string
		if (value === '') {
			handleAcademicRequirementChange('gmat', '')
			return
		}

		// Allow only numbers
		let cleanValue = value.replace(/[^0-9]/g, '')

		// Convert to number and validate range (200-800)
		const numValue = parseInt(cleanValue)
		if (!isNaN(numValue) && numValue >= 200 && numValue <= 800) {
			handleAcademicRequirementChange('gmat', cleanValue)
		} else if (cleanValue.length <= 3) {
			// Allow partial input while typing (e.g., "2", "20", "200")
			handleAcademicRequirementChange('gmat', cleanValue)
		}
	}

	const handleSubmit = async (status: 'DRAFT' | 'SUBMITTED') => {
		try {
			// Convert dates from dd/mm/yyyy to yyyy-mm-dd format
			const convertDateFormat = (dateString: string) => {
				if (!dateString) return ''
				const [day, month, year] = dateString.split('/')
				return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
			}

			const response = await fetch('/api/posts/programs', {
				method: 'POST',
				credentials: 'include', // Include cookies for authentication
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...formData,
					startDate: convertDateFormat(formData.startDate),
					applicationDeadline: convertDateFormat(formData.applicationDeadline),
					status: status,
				}),
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Failed to create program post')
			}

			const result = await response.json()
			// eslint-disable-next-line no-console
			console.log('Program post created:', result)

			// Call the onSubmit callback
			onSubmit?.()

			// Show success modal
			setShowSuccessModal(true)
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Error creating program post:', error)
			// Show specific error message to user
			const errorMsg =
				error instanceof Error
					? error.message
					: 'Failed to create program post. Please try again.'
			setErrorMessage(errorMsg)
			setShowErrorModal(true)
		}
	}

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-primary mb-2">Create Post</h1>
				</div>
				{onBack && (
					<Button
						variant="outline"
						onClick={onBack}
						className="text-gray-600 hover:text-gray-800"
					>
						Back to Posts
					</Button>
				)}
			</div>

			{/* Overview Section */}
			<div className="border bg-white border-gray-200 rounded-xl p-6 space-y-6">
				<div className="">
					<h2 className="text-2xl font-bold text-primary mb-2">Overview</h2>
					<p className="text-muted-foreground">
						Please provide the basic information about your program.
					</p>
				</div>

				<div className="space-y-6">
					{/* Program Title */}
					<div className="space-y-2">
						<Label htmlFor="programTitle">Program title</Label>
						<Input
							id="programTitle"
							placeholder="Enter program title"
							value={formData.programTitle}
							onChange={(e) =>
								handleInputChange('programTitle', e.target.value)
							}
							inputSize="select"
						/>
					</div>

					{/* Date Fields */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="relative">
							<DateInput
								id="startDate"
								value={formData.startDate}
								onChange={(value) => handleInputChange('startDate', value)}
								label="Start date"
								placeholder="dd/mm/yyyy"
								minDate={new Date().toISOString().split('T')[0]}
								maxDate="2030-12-31"
							/>
							{formData.startDate &&
								formData.applicationDeadline &&
								(() => {
									const [startDay, startMonth, startYear] =
										formData.startDate.split('/')
									const [deadlineDay, deadlineMonth, deadlineYear] =
										formData.applicationDeadline.split('/')
									const startDate = new Date(
										`${startYear}-${startMonth.padStart(2, '0')}-${startDay.padStart(2, '0')}`
									)
									const deadlineDate = new Date(
										`${deadlineYear}-${deadlineMonth.padStart(2, '0')}-${deadlineDay.padStart(2, '0')}`
									)
									return startDate >= deadlineDate ? (
										<p className="text-xs text-red-500 mt-1">
											Start date must be before application deadline
										</p>
									) : null
								})()}
						</div>

						<div className="relative">
							<DateInput
								id="applicationDeadline"
								value={formData.applicationDeadline}
								onChange={(value) =>
									handleInputChange('applicationDeadline', value)
								}
								label="Application deadline"
								placeholder="dd/mm/yyyy"
								minDate={new Date().toISOString().split('T')[0]}
								maxDate="2030-12-31"
							/>
							{formData.startDate &&
								formData.applicationDeadline &&
								(() => {
									const [startDay, startMonth, startYear] =
										formData.startDate.split('/')
									const [deadlineDay, deadlineMonth, deadlineYear] =
										formData.applicationDeadline.split('/')
									const startDate = new Date(
										`${startYear}-${startMonth.padStart(2, '0')}-${startDay.padStart(2, '0')}`
									)
									const deadlineDate = new Date(
										`${deadlineYear}-${deadlineMonth.padStart(2, '0')}-${deadlineDay.padStart(2, '0')}`
									)
									return startDate >= deadlineDate ? (
										<p className="text-xs text-red-500 mt-1">
											Application deadline must be after start date
										</p>
									) : null
								})()}
						</div>
					</div>

					{/* Selection Fields */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="subdiscipline">Subdiscipline</Label>
							<CustomSelect
								value={
									formData.subdiscipline
										? {
												value: formData.subdiscipline,
												label: formData.subdiscipline,
											}
										: null
								}
								onChange={(option) =>
									handleInputChange('subdiscipline', option?.value || '')
								}
								placeholder="Choose subdiscipline"
								options={subdisciplines}
								variant="default"
								isClearable={false}
								className="w-full"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="duration">Duration</Label>
							<CustomSelect
								value={
									formData.duration
										? { value: formData.duration, label: formData.duration }
										: null
								}
								onChange={(option) =>
									handleInputChange('duration', option?.value || '')
								}
								placeholder="Choose duration"
								options={[
									{ value: 'Less than 1 year', label: 'Less than 1 year' },
									{ value: '1 year', label: '1 year' },
									{ value: '2 years', label: '2 years' },
									{ value: 'More than 2 years', label: 'More than 2 years' },
								]}
								variant="default"
								isClearable={false}
								className="w-full"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="degreeLevel">Degree level</Label>
							<CustomSelect
								value={
									formData.degreeLevel
										? {
												value: formData.degreeLevel,
												label: formData.degreeLevel,
											}
										: null
								}
								onChange={(option) =>
									handleInputChange('degreeLevel', option?.value || '')
								}
								placeholder="Choose degree level"
								options={[
									{ value: 'Bachelor', label: 'Bachelor' },
									{ value: 'Master', label: 'Master' },
									{ value: 'PhD', label: 'PhD' },
									{ value: 'Certificate', label: 'Certificate' },
								]}
								variant="default"
								isClearable={false}
								className="w-full"
							/>
						</div>

						<div className="relative space-y-2">
							<Label htmlFor="attendance">Attendance</Label>
							<CustomSelect
								value={
									formData.attendance
										? { value: formData.attendance, label: formData.attendance }
										: null
								}
								onChange={(option) =>
									handleInputChange('attendance', option?.value || '')
								}
								placeholder="Choose attendance"
								options={[
									{ value: 'At campus', label: 'At campus' },
									{ value: 'Online', label: 'Online' },
									{ value: 'Hybrid', label: 'Hybrid' },
								]}
								variant="default"
								isClearable={false}
								className="w-full"
							/>
						</div>
					</div>

					{/* Location */}
					<div className="space-y-2">
						<Label htmlFor="location">Location</Label>
						<CustomSelect
							value={
								formData.location
									? getCountriesWithSvgFlags().find(
											(c) =>
												c.name.toLowerCase() === formData.location.toLowerCase()
										)
									: null
							}
							onChange={(option) =>
								handleInputChange('location', option?.name || '')
							}
							placeholder="Choose location"
							options={getCountriesWithSvgFlags()}
							formatOptionLabel={(option: any) => (
								<div className="flex items-center space-x-2">
									<span className="text-lg">{option.flag}</span>
									<span>{option.name}</span>
								</div>
							)}
							getOptionValue={(option: any) => option.name}
							isSearchable
							filterOption={(option, inputValue) => {
								const country = option.data as Country
								return country.name
									.toLowerCase()
									.includes(inputValue.toLowerCase())
							}}
							variant="default"
							isClearable={false}
							className="w-full"
						/>
					</div>
				</div>
			</div>

			{/* Programme Structure Section */}
			<div className="border bg-white border-gray-200 rounded-xl p-6 space-y-6">
				<div className="">
					<h2 className="text-2xl font-bold text-primary mb-2">
						Programme structure
					</h2>
					<p className="text-muted-foreground">
						Provide details about the program structure and courses.
					</p>
				</div>

				<div className="space-y-6">
					{/* Course Include */}
					<RichTextEditor
						value={formData.courseInclude}
						onChange={(value) => handleInputChange('courseInclude', value)}
						label="Course include"
						placeholder="Enter course details..."
					/>
				</div>
			</div>

			{/* Admission Requirements Section */}
			<div className="border bg-white border-gray-200 rounded-xl p-6 space-y-6">
				<div className="">
					<h2 className="text-2xl font-bold text-primary mb-2">
						Admission requirements
					</h2>
					<p className="text-muted-foreground">
						Specify the academic and language requirements for this program.
					</p>
				</div>

				<div className="space-y-6">
					{/* Academic Requirements */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold text-foreground">
							Academic requirement
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="flex flex-col sm:flex-row sm:items-center gap-4">
								<div className="flex items-center gap-2">
									<div className="bg-[rgba(17,110,99,0.7)] text-white px-3 py-2 rounded-full text-sm font-medium">
										GPA
									</div>
									<span className="hidden sm:block text-gray-400 text-xl">
										|
									</span>
									<Input
										placeholder="0.0-4.0"
										value={formData.academicRequirements.gpa}
										onChange={handleGpaInput}
										inputSize="select"
										fullWidth={false}
										width="w-24"
									/>
								</div>
							</div>
							<div className="flex flex-col sm:flex-row sm:items-center gap-4">
								<div className="flex items-center gap-2">
									<div className="bg-[rgba(17,110,99,0.7)] text-white px-3 py-2 rounded-full text-sm font-medium">
										GRE
									</div>
									<span className="hidden sm:block text-gray-400 text-xl">
										|
									</span>
									<Input
										placeholder="130-170"
										value={formData.academicRequirements.gre}
										onChange={handleGreInput}
										inputSize="select"
										fullWidth={false}
										width="w-24"
									/>
								</div>
							</div>
							<div className="flex flex-col sm:flex-row sm:items-center gap-4">
								<div className="flex items-center gap-2">
									<div className="bg-[rgba(17,110,99,0.7)] text-white px-3 py-2 rounded-full text-sm font-medium">
										GMAT
									</div>
									<span className="hidden sm:block text-gray-400 text-xl">
										|
									</span>
									<Input
										placeholder="200-800"
										value={formData.academicRequirements.gmat}
										onChange={handleGmatInput}
										inputSize="select"
										fullWidth={false}
										width="w-24"
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Language Requirements */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold text-foreground">
							Language requirement
						</h3>
						<div className="space-y-4">
							{formData.languageRequirements.map((req, index) => (
								<div
									key={index}
									className="grid grid-cols-1 md:grid-cols-6 gap-4"
								>
									<div className="space-y-2 md:col-span-2">
										<Label className="text-sm font-medium text-foreground">
											Language
										</Label>
										<CustomSelect
											value={
												req.language
													? {
															value: req.language,
															label: req.language,
															flag:
																[
																	{ value: 'Vietnamese', flag: '🇻🇳' },
																	{ value: 'English', flag: '🇺🇸' },
																	{ value: 'Spanish', flag: '🇪🇸' },
																	{ value: 'French', flag: '🇫🇷' },
																	{ value: 'German', flag: '🇩🇪' },
																	{ value: 'Chinese', flag: '🇨🇳' },
																	{ value: 'Japanese', flag: '🇯🇵' },
																	{ value: 'Korean', flag: '🇰🇷' },
																].find(
																	(langOption) =>
																		langOption.value === req.language
																)?.flag || '🌐',
														}
													: null
											}
											onChange={(option) =>
												handleLanguageRequirementChange(
													index,
													'language',
													option?.value || ''
												)
											}
											placeholder="Language"
											options={[
												{
													value: 'Vietnamese',
													label: 'Vietnamese',
													flag: '🇻🇳',
												},
												{
													value: 'English',
													label: 'English',
													flag: '🇺🇸',
												},
												{
													value: 'Spanish',
													label: 'Spanish',
													flag: '🇪🇸',
												},
												{
													value: 'French',
													label: 'French',
													flag: '🇫🇷',
												},
												{
													value: 'German',
													label: 'German',
													flag: '🇩🇪',
												},
												{
													value: 'Chinese',
													label: 'Chinese',
													flag: '🇨🇳',
												},
												{
													value: 'Japanese',
													label: 'Japanese',
													flag: '🇯🇵',
												},
												{
													value: 'Korean',
													label: 'Korean',
													flag: '🇰🇷',
												},
											]}
											formatOptionLabel={(option: any) => (
												<div className="flex items-center space-x-2">
													<span className="text-lg">{option.flag}</span>
													<span>{option.label}</span>
												</div>
											)}
											menuPortalTarget={document.body}
											className="w-full"
											isSearchable
											filterOption={(option, inputValue) => {
												const language = option.data
												return language.label
													.toLowerCase()
													.includes(inputValue.toLowerCase())
											}}
										/>
									</div>
									<div className="space-y-2 md:col-span-2">
										<Label className="text-sm font-medium text-foreground">
											Certificate
										</Label>
										<CustomSelect
											value={
												req.certificate
													? {
															value: req.certificate,
															label: req.certificate,
														}
													: null
											}
											onChange={(option) =>
												handleLanguageRequirementChange(
													index,
													'certificate',
													option?.value || ''
												)
											}
											placeholder="Select certificate"
											variant="green"
											className="w-full"
											options={getCertificateOptions(req.language)}
											menuPortalTarget={document.body}
											isSearchable
											filterOption={(option, inputValue) => {
												const certificate = option.data
												return certificate.label
													.toLowerCase()
													.includes(inputValue.toLowerCase())
											}}
										/>
									</div>
									<div className="space-y-2 md:col-span-1">
										<Label className="text-sm font-medium text-foreground">
											Score
										</Label>
										<Input
											placeholder="Score"
											value={req.score}
											onChange={(e) =>
												handleLanguageRequirementChange(
													index,
													'score',
													e.target.value
												)
											}
											inputSize="select"
											fullWidth={false}
											width="w-full"
										/>
									</div>
									{/* Delete Button */}
									<div className="space-y-2 md:col-span-1 flex items-end">
										<button
											type="button"
											onClick={() => removeLanguageRequirement(index)}
											className="text-red-500 hover:text-red-700 transition-colors p-1"
											title="Delete language requirement"
										>
											<svg
												className="h-5 w-5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</button>
									</div>
								</div>
							))}
						</div>
						<div className="flex justify-end">
							<button
								type="button"
								onClick={addLanguageRequirement}
								className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
							>
								<span className="underline">Add certificate</span>
								<div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
									<span className="text-white text-sm font-bold">+</span>
								</div>
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* File Requirements Section */}
			<div className="border bg-white border-gray-200 rounded-xl p-6 space-y-6">
				<div className="">
					<div className="flex items-center gap-2 mb-2">
						<h2 className="text-2xl font-bold text-primary">
							File requirements
						</h2>
					</div>
					<p className="text-muted-foreground">
						Specify the required documents for this program.
					</p>
				</div>

				<div className="space-y-6">
					{/* File Description */}
					<div className="space-y-2">
						<Label htmlFor="fileDescription">File description</Label>
						<Input
							id="fileDescription"
							placeholder="Enter file description"
							value={formData.fileRequirements?.fileDescription || ''}
							onChange={(e) =>
								handleFileRequirementChange('fileDescription', e.target.value)
							}
							inputSize="select"
						/>
					</div>
				</div>
			</div>

			{/* Tuition Fee Section */}
			<div className="border bg-white border-gray-200 rounded-xl p-6 space-y-6">
				<div className="">
					<div className="flex items-center gap-2 mb-2">
						<h2 className="text-2xl font-bold text-primary">Tuition fee</h2>
					</div>
					<p className="text-muted-foreground">
						Specify the tuition fees for this program.
					</p>
				</div>

				<div className="space-y-6">
					{/* International Student Tuition Fee */}
					<div className="space-y-2">
						<Label htmlFor="internationalTuition">International student:</Label>
						<div className="flex items-center gap-2">
							<span className="text-gray-700 font-medium">$</span>
							<Input
								id="internationalTuition"
								placeholder="Enter tuition fee"
								value={formData.tuitionFee?.international || ''}
								onChange={(e) =>
									handleTuitionFeeChange('international', e.target.value)
								}
								inputSize="select"
								className="flex-1"
							/>
							<span className="text-gray-700 font-medium">/ year</span>
						</div>
					</div>

					{/* Description */}
					<RichTextEditor
						value={formData.description}
						onChange={(value) => handleInputChange('description', value)}
						label="Description"
						placeholder="Enter program description..."
					/>
				</div>
			</div>

			{/* Scholarship Section */}
			<div className="border bg-white border-gray-200 rounded-xl p-6 space-y-6">
				<div className="">
					<h2 className="text-2xl font-bold text-primary mb-2">Scholarship</h2>
					<p className="text-muted-foreground">
						Provide information about available scholarships for this program.
					</p>
				</div>

				<div className="space-y-6">
					{/* Scholarship Information */}
					<div className="space-y-2">
						<Label className="text-lg font-semibold text-foreground">
							Scholarship information
						</Label>
						<RichTextEditor
							value={formData.scholarship?.information || ''}
							onChange={(value) =>
								handleScholarshipChange('information', value)
							}
							placeholder="Enter body of content (example: 180 alternative credits)"
						/>
					</div>
				</div>
			</div>

			{/* Other Information Section */}
			<div className="border bg-white border-gray-200 rounded-xl p-6 space-y-6">
				<div className="">
					<h2 className="text-2xl font-bold text-primary mb-2">
						Other information
					</h2>
					<p className="text-muted-foreground">
						Provide any additional information about this program.
					</p>
				</div>

				<div className="space-y-6">
					{/* Content */}
					<div className="space-y-2">
						<Label className="text-lg font-semibold text-foreground">
							Content
						</Label>
						<RichTextEditor
							value={formData.otherInformation?.content || ''}
							onChange={(value) =>
								handleOtherInformationChange('content', value)
							}
							placeholder="Enter body of content (example: 180 alternative credits)"
						/>
					</div>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex justify-center gap-4">
				<Button onClick={() => handleSubmit('DRAFT')} variant="outline">
					Save as Draft
				</Button>
				<Button onClick={() => handleSubmit('SUBMITTED')} variant="primary">
					Submit
				</Button>
			</div>

			{/* Success Modal */}
			<SuccessModal
				isOpen={showSuccessModal}
				onClose={() => {
					setShowSuccessModal(false)
					router.replace('/explore?tab=programmes')
				}}
				title="Success!"
				message="Your program post has been created successfully."
				buttonText="Continue"
			/>

			{/* Error Modal */}
			<ErrorModal
				isOpen={showErrorModal}
				onClose={() => setShowErrorModal(false)}
				title="Error"
				message={errorMessage}
				buttonText="Try Again"
			/>
		</div>
	)
}
