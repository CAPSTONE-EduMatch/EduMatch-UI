'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'
import { DateInput, CustomSelect, RichTextEditor } from '@/components/ui'
import { getCountriesWithSvgFlags, Country } from '@/data/countries'

interface CreateResearchLabPageProps {
	onBack?: () => void
	onSubmit?: (data: any) => void
}

export const CreateResearchLabPage: React.FC<CreateResearchLabPageProps> = ({
	onBack,
	onSubmit,
}) => {
	const [formData, setFormData] = useState({
		// Overview Section
		jobName: 'International Business and Intercultural Management',
		startDate: '',
		applicationDeadline: '',
		country: 'Vietnam',
		researchFields: ['data science', 'information system'],
		typeOfContract: 'Full-time',
		attendance: 'On-site',
		jobType: 'Research Assistant',

		// Offer Information Section
		salary: {
			min: '',
			max: '',
			description: '',
		},
		benefit: `<p>Comprehensive benefits package including:</p>
<ul>
<li>Health insurance coverage</li>
<li>Professional development opportunities</li>
<li>Research funding support</li>
<li>Conference travel allowance</li>
</ul>`,

		// Job Requirements Section
		mainResponsibility: `<p>Key responsibilities include:</p>
<ul>
<li>Conducting independent research</li>
<li>Collaborating with research team</li>
<li>Publishing research findings</li>
<li>Mentoring junior researchers</li>
</ul>`,
		qualificationRequirement: `<p>Required qualifications:</p>
<ul>
<li>PhD in relevant field</li>
<li>Strong research background</li>
<li>Excellent analytical skills</li>
<li>Proficiency in research methodologies</li>
</ul>`,
		experienceRequirement: `<p>Experience requirements:</p>
<ul>
<li>3+ years of research experience</li>
<li>Published research papers</li>
<li>Experience with research tools</li>
<li>Collaborative research experience</li>
</ul>`,
		assessmentCriteria: `<p>Assessment criteria:</p>
<ul>
<li>Research quality and impact</li>
<li>Publication record</li>
<li>Collaboration skills</li>
<li>Innovation and creativity</li>
</ul>`,
		otherRequirement: `<p>Additional requirements:</p>
<ul>
<li>Strong communication skills</li>
<li>Ability to work independently</li>
<li>Commitment to research excellence</li>
<li>Flexibility in research focus</li>
</ul>`,

		// Lab Details Section
		labDescription: `<p>The Advanced AI Research Laboratory is a cutting-edge research facility dedicated to advancing artificial intelligence technologies.</p>
<p>Our research focuses on:</p>
<ul>
<li>Machine Learning and Deep Learning</li>
<li>Natural Language Processing</li>
<li>Computer Vision</li>
<li>Robotics and Autonomous Systems</li>
</ul>`,
		labType: 'Academic',
		researchFocus: 'Artificial Intelligence',
		labCapacity: '20',

		// Research Areas
		researchAreas: `<p>Our laboratory conducts research in the following key areas:</p>
<ul>
<li>Machine Learning Algorithms</li>
<li>Neural Networks and Deep Learning</li>
<li>Natural Language Processing</li>
<li>Computer Vision and Image Recognition</li>
<li>Robotics and Automation</li>
</ul>`,

		// Lab Facilities
		labFacilities: `<p>State-of-the-art facilities include:</p>
<ul>
<li>High-performance computing clusters</li>
<li>GPU workstations for deep learning</li>
<li>Robotics testing environment</li>
<li>Data visualization lab</li>
<li>Collaborative workspace</li>
</ul>`,

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

		// Lab Information
		labInformation: {
			director: '',
			contactEmail: '',
			website: '',
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

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}))
	}

	const handleSalaryChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			salary: {
				...prev.salary,
				[field]: value,
			},
		}))
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

	const handleLabInformationChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			labInformation: {
				...prev.labInformation,
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
		try {
			// Convert dates from dd/mm/yyyy to yyyy-mm-dd format
			const convertDateFormat = (dateString: string) => {
				if (!dateString) return ''
				const [day, month, year] = dateString.split('/')
				return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
			}

			const response = await fetch('/api/posts/research', {
				method: 'POST',
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
				throw new Error('Failed to create research lab post')
			}

			const result = await response.json()
			console.log('Research lab post created:', result)

			// Call the onSubmit callback with the result
			onSubmit?.(result)
		} catch (error) {
			console.error('Error creating research lab post:', error)
			// You might want to show an error message to the user here
		}
	}

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-primary mb-2">
						Create Research Lab
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
								value={formData.researchFields}
								onChange={(options) =>
									handleInputChange('researchFields', options || [])
								}
								placeholder="Choose research fields"
								options={[
									{ value: 'Data Science', label: 'Data Science' },
									{ value: 'Data Engineer', label: 'Data Engineer' },
									{ value: 'Information System', label: 'Information System' },
									{
										value: 'Artificial Intelligence',
										label: 'Artificial Intelligence',
									},
									{ value: 'Machine Learning', label: 'Machine Learning' },
									{ value: 'Computer Vision', label: 'Computer Vision' },
									{
										value: 'Natural Language Processing',
										label: 'Natural Language Processing',
									},
									{ value: 'Robotics', label: 'Robotics' },
									{ value: 'Biotechnology', label: 'Biotechnology' },
									{ value: 'Materials Science', label: 'Materials Science' },
								]}
								variant="default"
								isMulti
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
					{/* File Name */}
					<div className="space-y-2">
						<Label htmlFor="fileName">File name</Label>
						<Input
							id="fileName"
							placeholder="Enter file name"
							value={formData.fileRequirements?.fileName || ''}
							onChange={(e) =>
								handleFileRequirementChange('fileName', e.target.value)
							}
							inputSize="select"
						/>
					</div>

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

					{/* Add File Button */}
					<div className="flex justify-end">
						<Button
							onClick={() => {
								// TODO: Implement add file functionality
								// eslint-disable-next-line no-console
								console.log('Add new required file')
							}}
							className="bg-primary hover:bg-primary/90 text-white px-6 py-2"
						>
							Add new required file
						</Button>
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
				<Button onClick={() => handleSubmit('SUBMITTED')} variant="primary">
					Submit
				</Button>
			</div>
		</div>
	)
}
