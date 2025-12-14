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
import { useDisciplinesContext } from '@/contexts/DisciplinesContext'
import { useSubscription } from '@/hooks/subscription/useSubscription'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui'
import { Crown, CreditCard } from 'lucide-react'

interface CreateResearchLabPageProps {
	onBack?: () => void
	onSubmit?: (data: any) => void
	initialData?: any
	editId?: string
}

export const CreateResearchLabPage: React.FC<CreateResearchLabPageProps> = ({
	onBack,
	onSubmit,
	initialData,
	editId,
}) => {
	const isEditMode = !!editId && !!initialData
	const router = useRouter()
	// Use shared disciplines context (loaded once at layout level, cached by React Query)
	const { subdisciplines = [] } = useDisciplinesContext()

	// Check subscription status
	const { subscriptions, loading: subscriptionLoading } = useSubscription()
	const hasActiveInstitutionSubscription = subscriptions.some(
		(sub) =>
			sub.status === 'active' &&
			(sub.plan === 'institution_monthly' || sub.plan === 'institution_yearly')
	)

	// Populate form with initialData when in edit mode
	useEffect(() => {
		if (initialData && isEditMode) {
			// Helper to format date from API format to dd/mm/yyyy
			const formatDateForInput = (dateString: string | Date | null) => {
				if (!dateString) return ''
				const date = new Date(dateString)
				const day = date.getDate().toString().padStart(2, '0')
				const month = (date.getMonth() + 1).toString().padStart(2, '0')
				const year = date.getFullYear()
				return `${day}/${month}/${year}`
			}

			// Get research fields from initialData
			// researchFields is an array of strings in the API response
			const researchFields = Array.isArray(initialData.researchFields)
				? initialData.researchFields
				: []

			setFormData({
				jobName: initialData.title || '',
				startDate: formatDateForInput(initialData.startDate),
				applicationDeadline: formatDateForInput(
					initialData.applicationDeadline || initialData.date
				),
				country: initialData.country || initialData.location || '',
				researchFields: researchFields,
				typeOfContract: initialData.contractType || '',
				attendance: initialData.attendance || '',
				jobType: initialData.jobType || '',
				professorName: initialData.professorName || '',
				salary: {
					min: initialData.salary?.split('-')[0]?.replace(/[^0-9]/g, '')
						? parseInt(
								initialData.salary.split('-')[0].replace(/[^0-9]/g, '')
							).toLocaleString('en-US')
						: '',
					max: initialData.salary?.split('-')[1]?.replace(/[^0-9]/g, '')
						? parseInt(
								initialData.salary.split('-')[1].replace(/[^0-9]/g, '')
							).toLocaleString('en-US')
						: '',
					description: initialData.salaryDescription || '',
				},
				benefit: initialData.benefit || '',
				mainResponsibility: initialData.mainResponsibility || '',
				qualificationRequirement: initialData.qualificationRequirement || '',
				experienceRequirement: initialData.experienceRequirement || '',
				assessmentCriteria: initialData.assessmentCriteria || '',
				otherRequirement: initialData.otherRequirement || '',
				labDescription: initialData.description || '',
				labType: initialData.labType || '',
				researchFocus: initialData.researchFocus || '',
				labFacilities: initialData.labFacilities || '',
				researchAreas: initialData.researchAreas || '',
				researchRequirements: {
					academicBackground: initialData.academicBackground || '',
					researchExperience: initialData.researchExperience || '',
					technicalSkills: initialData.technicalSkills || '',
				},
				applicationRequirements: {
					documents: initialData.applicationDocuments || '',
					researchProposal: initialData.researchProposal || '',
					recommendations: initialData.recommendations || '',
				},
				fileRequirements: {
					fileName:
						initialData.requiredDocuments?.[0]?.name || 'Required Documents',
					fileDescription:
						initialData.requiredDocuments?.[0]?.description || '',
				},
				additionalInformation: {
					content: initialData.otherInfo || '',
				},
			})
		}
	}, [initialData, isEditMode])

	const [formData, setFormData] = useState({
		// Overview Section
		jobName: '',
		startDate: '',
		applicationDeadline: '',
		country: '',
		researchFields: [],
		typeOfContract: '',
		attendance: '',
		jobType: '',
		professorName: '',

		// Offer Information Section
		salary: {
			min: '',
			max: '',
			description: '',
		},
		benefit: '',

		// Job Requirements Section
		mainResponsibility: '',
		qualificationRequirement: '',
		experienceRequirement: '',
		assessmentCriteria: '',
		otherRequirement: '',

		// Lab Details Section
		labDescription: '',
		labType: '',
		researchFocus: '',

		// Research Areas
		researchAreas: '',

		// Lab Facilities
		labFacilities: '',

		// Research Requirements
		researchRequirements: {
			academicBackground: '',
			researchExperience: '',
			technicalSkills: '',
		},

		// Application Requirements
		applicationRequirements: {
			documents: '',
			researchProposal: '',
			recommendations: '',
		},

		// File Requirements
		fileRequirements: {
			fileName: '',
			fileDescription: '',
		},

		// Additional Information
		additionalInformation: {
			content: '',
		},
	})

	// Modal states
	const [showSuccessModal, setShowSuccessModal] = useState(false)
	const [showErrorModal, setShowErrorModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const [createdResult, setCreatedResult] = useState<any>(null)

	const handleInputChange = (field: string, value: any) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}))
	}

	const handleSalaryChange = (field: string, value: string) => {
		// Only allow numbers for min and max salary fields
		if (field === 'min' || field === 'max') {
			// Remove all non-numeric characters (including commas)
			const numericValue = value.replace(/[^0-9]/g, '')
			// Format with thousand separators
			const formattedValue = numericValue
				? parseInt(numericValue).toLocaleString('en-US')
				: ''
			setFormData((prev) => ({
				...prev,
				salary: {
					...prev.salary,
					[field]: formattedValue,
				},
			}))
		} else {
			// For description field, allow any text
			setFormData((prev) => ({
				...prev,
				salary: {
					...prev.salary,
					[field]: value,
				},
			}))
		}
	}

	// Validation helper functions
	const getSalaryError = (): string | null => {
		const minValue = formData.salary.min.replace(/,/g, '')
		const maxValue = formData.salary.max.replace(/,/g, '')

		if (!minValue && !maxValue) return null // Both empty is OK

		if (minValue && maxValue) {
			const minNum = parseFloat(minValue)
			const maxNum = parseFloat(maxValue)

			if (isNaN(minNum) || isNaN(maxNum)) {
				return 'Salary values must be valid numbers'
			}

			if (minNum < 0 || maxNum < 0) {
				return 'Salary values must be positive numbers'
			}

			if (minNum > maxNum) {
				return 'Minimum salary must be less than or equal to maximum salary'
			}
		}

		return null
	}

	const handleResearchRequirementChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			researchRequirements: {
				...prev.researchRequirements,
				[field]: value,
			},
		}))
	}

	const handleApplicationChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			applicationRequirements: {
				...prev.applicationRequirements,
				[field]: value,
			},
		}))
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

	const handleAdditionalChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			additionalInformation: {
				...prev.additionalInformation,
				[field]: value,
			},
		}))
	}

	const handleSubmit = async (status: 'DRAFT' | 'SUBMITTED') => {
		// Check subscription before submitting (only for new posts, not drafts)
		if (
			!isEditMode &&
			status === 'SUBMITTED' &&
			!hasActiveInstitutionSubscription
		) {
			setErrorMessage(
				'You need an active subscription to publish posts. Please upgrade your plan to continue.'
			)
			setShowErrorModal(true)
			return
		}

		try {
			// Validate form data before submitting
			const salaryError = getSalaryError()
			if (salaryError) {
				setErrorMessage(salaryError)
				setShowErrorModal(true)
				return
			}

			// Convert dates from dd/mm/yyyy to yyyy-mm-dd format
			const convertDateFormat = (dateString: string) => {
				if (!dateString) return ''
				const [day, month, year] = dateString.split('/')
				return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
			}

			// Remove thousand separators from salary before submitting
			const salaryMinWithoutCommas = formData.salary.min
				? formData.salary.min.replace(/,/g, '')
				: ''
			const salaryMaxWithoutCommas = formData.salary.max
				? formData.salary.max.replace(/,/g, '')
				: ''

			const requestBody = {
				...formData,
				startDate: convertDateFormat(formData.startDate),
				applicationDeadline: convertDateFormat(formData.applicationDeadline),
				salary: {
					...formData.salary,
					min: salaryMinWithoutCommas,
					max: salaryMaxWithoutCommas,
				},
				status: status,
				...(isEditMode && editId && { postId: editId }),
			}

			const response = await fetch('/api/posts/research', {
				method: isEditMode ? 'PUT' : 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(
					errorData.error ||
						(isEditMode
							? 'Failed to update research lab post'
							: 'Failed to create research lab post')
				)
			}

			const result = await response.json()
			console.log(
				isEditMode
					? 'Research lab post updated:'
					: 'Research lab post created:',
				result
			)

			// Store result for onSubmit callback
			setCreatedResult(result)

			// Show success modal
			// onSubmit will be called when modal closes
			setShowSuccessModal(true)
		} catch (error) {
			console.error('Error creating research lab post:', error)
			const errorMsg =
				error instanceof Error
					? error.message
					: 'Failed to create research lab post. Please try again.'
			setErrorMessage(errorMsg)
			setShowErrorModal(true)
		}
	}

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-primary mb-2">
						{isEditMode ? 'Edit Research Lab' : 'Create Research Lab'}
					</h1>
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

			{/* Subscription Warning */}
			{!subscriptionLoading &&
				!hasActiveInstitutionSubscription &&
				!isEditMode && (
					<Alert className="border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
						<Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
						<AlertTitle className="text-amber-900 dark:text-amber-100 font-semibold mb-2">
							Subscription Required to Publish Posts
						</AlertTitle>
						<AlertDescription className="text-amber-800 dark:text-amber-200 space-y-3">
							<p>
								To publish and share your research labs with applicants, you
								need an active institution subscription. You can still save
								drafts without a subscription.
							</p>
							<div className="flex items-center gap-3 pt-2">
								<Button
									onClick={() => router.push('/institution/dashboard/payment')}
									variant="primary"
									size="sm"
									className="bg-amber-600 hover:bg-amber-700 text-white"
								>
									Upgrade Now
								</Button>
							</div>
						</AlertDescription>
					</Alert>
				)}

			{/* Overview Section */}
			<div className="border bg-white border-gray-200 rounded-xl p-6 space-y-6">
				<div className="">
					<h2 className="text-2xl font-bold text-primary mb-2">Overview</h2>
					<p className="text-muted-foreground">
						Please provide the basic information about your research lab.
					</p>
				</div>

				<div className="space-y-6">
					{/* Job Name */}
					<div className="space-y-2">
						<Label htmlFor="jobName">Job name*</Label>
						<Input
							id="jobName"
							placeholder="Enter job name"
							value={formData.jobName}
							onChange={(e) => handleInputChange('jobName', e.target.value)}
							inputSize="select"
						/>
					</div>

					{/* Left Column Fields */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="country">Country*</Label>
							<CustomSelect
								value={
									formData.country
										? getCountriesWithSvgFlags().find(
												(c) =>
													c.name.toLowerCase() ===
													formData.country.toLowerCase()
											)
										: null
								}
								onChange={(option) =>
									handleInputChange('country', option?.name || '')
								}
								placeholder="Choose country"
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
						<div className="space-y-2">
							<Label htmlFor="jobType">Job type*</Label>
							<CustomSelect
								value={
									formData.jobType
										? { value: formData.jobType, label: formData.jobType }
										: null
								}
								onChange={(option) =>
									handleInputChange('jobType', option?.value || '')
								}
								placeholder="Choose job type"
								options={[
									{ value: 'Research Assistant', label: 'Research Assistant' },
									{ value: 'Research Associate', label: 'Research Associate' },
									{
										value: 'Postdoctoral Researcher',
										label: 'Postdoctoral Researcher',
									},
									{ value: 'PhD Student', label: 'PhD Student' },
									{ value: 'Lab Technician', label: 'Lab Technician' },
									{ value: 'Research Scientist', label: 'Research Scientist' },
								]}
								variant="default"
								isClearable={false}
								className="w-full"
							/>
						</div>
					</div>

					{/* Professor Name */}
					<div className="space-y-2">
						<Label htmlFor="professorName">Professor name</Label>
						<Input
							id="professorName"
							placeholder="Enter professor name"
							value={formData.professorName}
							onChange={(e) =>
								handleInputChange('professorName', e.target.value)
							}
							inputSize="select"
						/>
					</div>

					{/* Right Column Fields */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="relative">
							<DateInput
								id="startDate"
								value={formData.startDate}
								onChange={(value) => handleInputChange('startDate', value)}
								label="Start date*"
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

						<div className="space-y-2">
							<Label htmlFor="typeOfContract">Type of contract*</Label>
							<CustomSelect
								value={
									formData.typeOfContract
										? {
												value: formData.typeOfContract,
												label: formData.typeOfContract,
											}
										: null
								}
								onChange={(option) =>
									handleInputChange('typeOfContract', option?.value || '')
								}
								placeholder="Choose type"
								options={[
									{ value: 'Full-time', label: 'Full-time' },
									{ value: 'Part-time', label: 'Part-time' },
									{ value: 'Contract', label: 'Contract' },
									{ value: 'Internship', label: 'Internship' },
									{ value: 'Volunteer', label: 'Volunteer' },
								]}
								variant="default"
								isClearable={false}
								className="w-full"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="relative">
							<DateInput
								id="applicationDeadline"
								value={formData.applicationDeadline}
								onChange={(value) =>
									handleInputChange('applicationDeadline', value)
								}
								label="Application deadline*"
								placeholder="dd/mm/yyyy"
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

						<div className="space-y-2">
							<Label htmlFor="attendance">Attendance*</Label>
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
									{ value: 'On-site', label: 'On-site' },
									{ value: 'Remote', label: 'Remote' },
									{ value: 'Hybrid', label: 'Hybrid' },
								]}
								variant="default"
								isClearable={false}
								className="w-full"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-1 gap-4">
						<div className="space-y-2">
							<Label htmlFor="researchFields">Research fields*</Label>
							<CustomSelect
								value={(formData.researchFields || []).map((v: string) => ({
									value: v,
									label: v,
								}))}
								onChange={(options) =>
									handleInputChange(
										'researchFields',
										Array.isArray(options)
											? options.map((o: any) => o?.value ?? o?.label)
											: []
									)
								}
								placeholder="Choose research fields"
								options={subdisciplines}
								variant="default"
								isMulti
								isSearchable
								isClearable={false}
								className="w-full"
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Offer Information Section */}
			<div className="border bg-white border-gray-200 rounded-xl p-6 space-y-6">
				<div className="">
					<h2 className="text-2xl font-bold text-primary mb-2">
						Offer information
					</h2>
					<p className="text-muted-foreground">
						Provide information about the compensation and benefits.
					</p>
				</div>

				<div className="space-y-6">
					{/* Salary */}
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Label htmlFor="salary" className="text-lg font-semibold">
								Salary*
							</Label>
							<button className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-300">
								<span className="text-xs">?</span>
							</button>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="minSalary">Min:</Label>
								<Input
									id="minSalary"
									placeholder="Enter min salary"
									value={formData.salary.min}
									onChange={(e) => handleSalaryChange('min', e.target.value)}
									inputSize="select"
								/>
								{getSalaryError() && (
									<p className="text-xs text-red-500 mt-1">
										{getSalaryError()}
									</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="maxSalary">Max:</Label>
								<Input
									id="maxSalary"
									placeholder="Enter max salary"
									value={formData.salary.max}
									onChange={(e) => handleSalaryChange('max', e.target.value)}
									inputSize="select"
								/>
							</div>
						</div>
					</div>

					{/* Salary Description */}
					<div className="space-y-2">
						<Label htmlFor="salaryDescription">Salary description</Label>
						<Input
							id="salaryDescription"
							placeholder="Enter salary description"
							value={formData.salary.description}
							onChange={(e) =>
								handleSalaryChange('description', e.target.value)
							}
							inputSize="select"
						/>
					</div>

					{/* Benefit */}
					<div className="space-y-2">
						<Label htmlFor="benefit">Benefit</Label>
						<RichTextEditor
							value={formData.benefit}
							onChange={(value) => handleInputChange('benefit', value)}
							placeholder="Enter body of content (example: Tuition fee reduction, Living expenses, Travel expenses)"
						/>
					</div>
				</div>
			</div>

			{/* Job Requirement Section */}
			<div className="border bg-white border-gray-200 rounded-xl p-6 space-y-6">
				<div className="">
					<h2 className="text-2xl font-bold text-primary mb-2">
						Job requirement
					</h2>
					<p className="text-muted-foreground">
						Specify the requirements and responsibilities for this position.
					</p>
				</div>

				<div className="space-y-6">
					{/* Main Responsibility */}
					<div className="space-y-2">
						<Label htmlFor="mainResponsibility">Main responsibility</Label>
						<RichTextEditor
							value={formData.mainResponsibility}
							onChange={(value) =>
								handleInputChange('mainResponsibility', value)
							}
							placeholder="Enter body of content"
						/>
					</div>

					{/* Qualification Requirement */}
					<div className="space-y-2">
						<Label htmlFor="qualificationRequirement">
							Qualification requirement
						</Label>
						<RichTextEditor
							value={formData.qualificationRequirement}
							onChange={(value) =>
								handleInputChange('qualificationRequirement', value)
							}
							placeholder="Enter body of content"
						/>
					</div>

					{/* Experience Requirement */}
					<div className="space-y-2">
						<Label htmlFor="experienceRequirement">
							Experience requirement
						</Label>
						<RichTextEditor
							value={formData.experienceRequirement}
							onChange={(value) =>
								handleInputChange('experienceRequirement', value)
							}
							placeholder="Enter body of content"
						/>
					</div>

					{/* Assessment Criteria */}
					<div className="space-y-2">
						<Label htmlFor="assessmentCriteria">Assessment criteria</Label>
						<RichTextEditor
							value={formData.assessmentCriteria}
							onChange={(value) =>
								handleInputChange('assessmentCriteria', value)
							}
							placeholder="Enter body of content"
						/>
					</div>

					{/* Other Requirement */}
					<div className="space-y-2">
						<Label htmlFor="otherRequirement">Other requirement</Label>
						<RichTextEditor
							value={formData.otherRequirement}
							onChange={(value) => handleInputChange('otherRequirement', value)}
							placeholder="Enter body of content"
						/>
					</div>
				</div>
			</div>

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

			{/* Additional Information Section */}
			<div className="border bg-white border-gray-200 rounded-xl p-6 space-y-6">
				<div className="">
					<h2 className="text-2xl font-bold text-primary mb-2">
						Additional Information
					</h2>
					<p className="text-muted-foreground">
						Provide any additional information about this research lab.
					</p>
				</div>

				<div className="space-y-6">
					{/* Content */}
					<div className="space-y-2">
						<Label className="text-lg font-semibold text-foreground">
							Content
						</Label>
						<RichTextEditor
							value={formData.additionalInformation.content}
							onChange={(value) => handleAdditionalChange('content', value)}
							placeholder="Enter additional information..."
						/>
					</div>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex justify-center gap-4">
				<Button onClick={() => handleSubmit('DRAFT')} variant="outline">
					Save as Draft
				</Button>
				{/* Only show Submit button if user has active subscription or is editing */}
				{(hasActiveInstitutionSubscription || isEditMode) && (
					<Button onClick={() => handleSubmit('SUBMITTED')} variant="primary">
						Submit
					</Button>
				)}
			</div>
			{/* Success Modal */}
			<SuccessModal
				isOpen={showSuccessModal}
				onClose={() => {
					setShowSuccessModal(false)
					// If onSubmit callback is provided, use it (stays on programs page)
					// Otherwise, redirect to explore (for backward compatibility)
					if (onSubmit) {
						onSubmit(createdResult)
					} else {
						router.replace('/explore?tab=programmes')
					}
				}}
				title="Success!"
				message={
					isEditMode
						? 'Your research lab post has been updated successfully.'
						: 'Your research lab post has been created successfully.'
				}
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
