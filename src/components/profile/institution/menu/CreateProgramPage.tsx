'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'
import { DateInput, CustomSelect, RichTextEditor } from '@/components/ui'
import { getCountriesWithSvgFlags, Country } from '@/data/countries'

interface CreateProgramPageProps {
	onBack?: () => void
	onSubmit?: (data: unknown) => void
}

export const CreateProgramPage: React.FC<CreateProgramPageProps> = ({
	onBack,
	onSubmit,
}) => {
	const [formData, setFormData] = useState({
		// Overview Section
		programTitle: 'International Business and Intercultural Management',
		startDate: '01/01/2001',
		applicationDeadline: '01/01/2001',
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
		professorName: '',

		// Admission Requirements
		academicRequirements: {
			gpa: '',
			gre: '',
			gmat: '',
		},
		languageRequirements: {
			language: 'English',
			certificate: 'IELTS',
			score: '7.0',
		},

		// File Requirements
		fileRequirements: {
			fileName: '',
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

	const handleLanguageRequirementChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			languageRequirements: {
				...prev.languageRequirements,
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

	const handleSubmit = () => {
		onSubmit?.(formData)
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
							/>
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
							/>
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
								options={[
									{ value: 'Information system', label: 'Information system' },
									{ value: 'Computer Science', label: 'Computer Science' },
									{ value: 'Data Science', label: 'Data Science' },
									{
										value: 'Software Engineering',
										label: 'Software Engineering',
									},
								]}
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

					{/* Professor's Name */}
					<div className="relative space-y-2">
						<Label htmlFor="professorName">Professor&apos;s name</Label>
						<Input
							id="professorName"
							placeholder="Enter name of professor that in charge for this program"
							value={formData.professorName}
							onChange={(e) =>
								handleInputChange('professorName', e.target.value)
							}
							inputSize="select"
						/>
					</div>
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
										onChange={(e) =>
											handleAcademicRequirementChange('gpa', e.target.value)
										}
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
										placeholder="Score"
										value={formData.academicRequirements.gre}
										onChange={(e) =>
											handleAcademicRequirementChange('gre', e.target.value)
										}
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
										placeholder="Score"
										value={formData.academicRequirements.gmat}
										onChange={(e) =>
											handleAcademicRequirementChange('gmat', e.target.value)
										}
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
							<div className="flex flex-col lg:flex-row gap-2">
								<div className="space-y-1 flex-1">
									<Label className="text-sm font-medium text-foreground">
										Language
									</Label>
									<CustomSelect
										value={
											formData.languageRequirements.language
												? {
														value: formData.languageRequirements.language,
														label: formData.languageRequirements.language,
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
																	langOption.value ===
																	formData.languageRequirements.language
															)?.flag || '🌐',
													}
												: null
										}
										onChange={(option) =>
											handleLanguageRequirementChange(
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
								<div className="space-y-1 flex-1">
									<Label className="text-sm font-medium text-foreground">
										Certificate
									</Label>
									<CustomSelect
										value={
											formData.languageRequirements.certificate
												? {
														value: formData.languageRequirements.certificate,
														label: formData.languageRequirements.certificate,
													}
												: null
										}
										onChange={(option) =>
											handleLanguageRequirementChange(
												'certificate',
												option?.value || ''
											)
										}
										placeholder="Select certificate"
										variant="green"
										className="w-full"
										options={[
											{ value: 'IELTS', label: 'IELTS' },
											{ value: 'TOEFL', label: 'TOEFL' },
											{ value: 'TOEIC', label: 'TOEIC' },
											{ value: 'Cambridge', label: 'Cambridge' },
											{ value: 'PTE', label: 'PTE Academic' },
											{ value: 'Duolingo', label: 'Duolingo English Test' },
										]}
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
								<div className="space-y-1 flex-1">
									<Label className="text-sm font-medium text-foreground">
										Score
									</Label>
									<Input
										placeholder="Score"
										value={formData.languageRequirements.score}
										onChange={(e) =>
											handleLanguageRequirementChange('score', e.target.value)
										}
										inputSize="select"
										fullWidth={false}
										width="w-full"
									/>
								</div>
							</div>
						</div>
						<div className="flex justify-end">
							<button
								type="button"
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
								console.log('Add new required file')
							}}
							className="bg-primary hover:bg-primary/90 text-white px-6 py-2"
						>
							Add new required file
						</Button>
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
						value={formData.tuitionFee?.description || ''}
						onChange={(value) => handleTuitionFeeChange('description', value)}
						label="Description"
						placeholder="Enter body of content (example: 180 alternative credits)"
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
				<Button onClick={onBack} variant="outline">
					Save to draft
				</Button>
				<Button onClick={handleSubmit} variant="primary">
					Submit
				</Button>
			</div>
		</div>
	)
}
