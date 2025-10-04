'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { CustomSelect } from '@/components/ui/custom-select'
import { Upload, Edit3, Save, X } from 'lucide-react'
import { getCountriesWithSvgFlags } from '@/data/countries'
import SuccessModal from '@/components/ui/SuccessModal'
import ErrorModal from '@/components/ui/ErrorModal'

interface AcademicSectionProps {
	profile: any
	onProfileUpdate?: () => void
}

export const AcademicSection: React.FC<AcademicSectionProps> = ({
	profile,
	onProfileUpdate,
}) => {
	const [isEditing, setIsEditing] = useState(false)
	const [editedProfile, setEditedProfile] = useState(profile)
	const [isUploading, setIsUploading] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [showSuccessModal, setShowSuccessModal] = useState(false)
	const [showErrorModal, setShowErrorModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')

	const handleSave = async () => {
		setIsSaving(true)
		try {
			const { ApiService } = await import('@/lib/axios-config')

			const profileData = {
				graduationStatus: editedProfile?.graduationStatus || '',
				degree: editedProfile?.degree || '',
				fieldOfStudy: editedProfile?.fieldOfStudy || '',
				university: editedProfile?.university || '',
				graduationYear: editedProfile?.graduationYear || '',
				gpa: editedProfile?.gpa || '',
				countryOfStudy: editedProfile?.countryOfStudy || '',
				scoreType: editedProfile?.scoreType || '',
				scoreValue: editedProfile?.scoreValue || '',
				hasForeignLanguage: editedProfile?.hasForeignLanguage || '',
				languages: editedProfile?.languages || [],
				researchPapers: editedProfile?.researchPapers || [],
				cvFiles: editedProfile?.cvFiles || [],
				languageCertFiles: editedProfile?.languageCertFiles || [],
				degreeFiles: editedProfile?.degreeFiles || [],
				transcriptFiles: editedProfile?.transcriptFiles || [],
			}

			await ApiService.updateProfile(profileData)

			// Refresh profile data if callback is provided
			if (onProfileUpdate) {
				onProfileUpdate()
			}

			setShowSuccessModal(true)
			setIsEditing(false)
		} catch (error: any) {
			console.error('Error saving academic information:', error)
			setErrorMessage(
				error.response?.data?.error ||
					'Failed to save academic information. Please try again.'
			)
			setShowErrorModal(true)
		} finally {
			setIsSaving(false)
		}
	}

	const handleCancel = () => {
		setEditedProfile(profile)
		setIsEditing(false)
	}

	const handleFieldChange = (field: string, value: string | any[]) => {
		setEditedProfile((prev: any) => ({
			...prev,
			[field]: value,
		}))
	}

	const handleFileSelect = async (
		event: React.ChangeEvent<HTMLInputElement>,
		category: string,
		researchPaperIndex?: number
	) => {
		const files = Array.from(event.target.files || [])
		if (files.length === 0) return

		// Validate files
		for (const file of files) {
			if (
				!file.type.startsWith('image/') &&
				!file.type.includes('pdf') &&
				!file.type.includes('doc')
			) {
				setErrorMessage('Please select image, PDF, or document files')
				setShowErrorModal(true)
				return
			}

			if (file.size > 10 * 1024 * 1024) {
				setErrorMessage('File size must be less than 10MB')
				setShowErrorModal(true)
				return
			}
		}

		setIsUploading(true)

		try {
			const { ApiService } = await import('@/lib/axios-config')

			// Upload all files
			const uploadPromises = files.map((file) => ApiService.uploadFile(file))
			const results = await Promise.all(uploadPromises)

			// Process uploaded files
			const newFiles = results.map((result, index) => ({
				id: result.id, // Temporary ID for form state management
				category: category,
				name: result.originalName || files[index].name,
				originalName: result.originalName || files[index].name,
				fileName: result.fileName,
				size: result.fileSize || files[index].size,
				fileSize: result.fileSize || files[index].size,
				url: result.url,
				fileType: result.fileType || files[index].type,
			}))

			if (category === 'researchPaper' && researchPaperIndex !== undefined) {
				// Add to specific research paper
				const newPapers = [...(editedProfile?.researchPapers || [])]
				newPapers[researchPaperIndex] = {
					...newPapers[researchPaperIndex],
					files: [...(newPapers[researchPaperIndex]?.files || []), ...newFiles],
				}
				handleFieldChange('researchPapers', newPapers)
			} else {
				// Add to category files
				const fieldName = `${category}Files`
				setEditedProfile((prev: any) => ({
					...prev,
					[fieldName]: [...(prev[fieldName] || []), ...newFiles],
				}))
			}
		} catch (error) {
			setErrorMessage('Failed to upload files. Please try again.')
			setShowErrorModal(true)
		} finally {
			setIsUploading(false)
		}
	}

	const handleRemoveFile = (index: number, category: string) => {
		const fieldName = `${category}Files`
		setEditedProfile((prev: any) => ({
			...prev,
			[fieldName]: prev[fieldName].filter((_: any, i: number) => i !== index),
		}))
	}

	const handleRemoveResearchPaperFile = (
		paperIndex: number,
		fileIndex: number
	) => {
		const newPapers = [...(editedProfile?.researchPapers || [])]
		newPapers[paperIndex] = {
			...newPapers[paperIndex],
			files: newPapers[paperIndex].files.filter(
				(_: any, i: number) => i !== fileIndex
			),
		}
		handleFieldChange('researchPapers', newPapers)
	}

	if (profile?.role !== 'applicant') {
		return (
			<div className="text-center py-12">
				<div className="text-6xl mb-4">🏫</div>
				<h2 className="text-2xl font-bold mb-2">Academic Information</h2>
				<p className="text-muted-foreground">
					This section is only available for student accounts.
				</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold mb-2">Academic Information</h2>
					<p className="text-muted-foreground">
						Your educational background and academic achievements
					</p>
				</div>
				{!isEditing ? (
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsEditing(true)}
						className="flex items-center gap-2"
					>
						<Edit3 className="h-4 w-4" />
						Edit
					</Button>
				) : (
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleCancel}
							className="flex items-center gap-2"
						>
							<X className="h-4 w-4" />
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSave}
							disabled={isSaving}
							className="flex items-center gap-2"
						>
							<Save className="h-4 w-4" />
							{isSaving ? 'Saving...' : 'Save'}
						</Button>
					</div>
				)}
			</div>

			{/* Graduated Section */}
			<Card>
				<CardContent className="p-6">
					<div className="space-y-4">
						<div className="flex items-center gap-8">
							<h3 className="text-lg font-semibold text-foreground">
								Graduated
							</h3>

							{/* Graduation Status Radio Buttons */}
							<div className="flex items-center gap-6">
								<div className="flex items-center space-x-2">
									<input
										type="radio"
										id="not-yet"
										name="graduationStatus"
										checked={
											isEditing
												? editedProfile?.graduationStatus === 'not-yet'
												: profile?.graduationStatus === 'not-yet'
										}
										onChange={() =>
											handleFieldChange('graduationStatus', 'not-yet')
										}
										disabled={!isEditing}
										className="w-4 h-4 text-primary border-2 border-primary focus:outline-none"
										style={{
											accentColor: '#126E64',
										}}
									/>
									<Label
										htmlFor="not-yet"
										className="text-sm font-normal cursor-pointer"
									>
										Not yet
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<input
										type="radio"
										id="graduated"
										name="graduationStatus"
										checked={
											isEditing
												? editedProfile?.graduationStatus === 'graduated'
												: profile?.graduationStatus === 'graduated'
										}
										onChange={() =>
											handleFieldChange('graduationStatus', 'graduated')
										}
										disabled={!isEditing}
										className="w-4 h-4 text-primary border-2 border-primary focus:outline-none"
										style={{
											accentColor: '#126E64',
										}}
									/>
									<Label
										htmlFor="graduated"
										className="text-sm font-normal cursor-pointer"
									>
										Graduated
									</Label>
								</div>
							</div>
						</div>

						{/* Academic Details - Only show if graduated */}
						{(isEditing
							? editedProfile?.graduationStatus
							: profile?.graduationStatus) === 'graduated' && (
							<div className="space-y-4">
								{/* Additional fields */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="university">University</Label>
										{isEditing ? (
											<Input
												id="university"
												value={editedProfile?.university || ''}
												onChange={(e) =>
													handleFieldChange('university', e.target.value)
												}
												placeholder="e.g., Harvard University"
												inputSize="select"
											/>
										) : (
											<p className="text-sm">
												{profile?.university || 'Not provided'}
											</p>
										)}
									</div>
									<div>
										<Label htmlFor="countryOfStudy">Country of Study</Label>
										{isEditing ? (
											<CustomSelect
												value={
													editedProfile?.countryOfStudy
														? getCountriesWithSvgFlags().find(
																(c) => c.name === editedProfile.countryOfStudy
															)
														: null
												}
												onChange={(option) =>
													handleFieldChange(
														'countryOfStudy',
														option?.name || ''
													)
												}
												placeholder="Select country"
												options={getCountriesWithSvgFlags()}
												formatOptionLabel={(option: any) => (
													<div className="flex items-center space-x-2">
														<span className="text-lg">{option.flag}</span>
														<span>{option.name}</span>
													</div>
												)}
												getOptionValue={(option: any) => option.name}
												menuPortalTarget={document.body}
												isSearchable
												isClearable
												filterOption={(option, inputValue) => {
													const country = option.data
													return country.name
														.toLowerCase()
														.includes(inputValue.toLowerCase())
												}}
											/>
										) : (
											<div className="flex items-center space-x-2">
												{(() => {
													const countryData = getCountriesWithSvgFlags().find(
														(c) => c.name === profile?.countryOfStudy
													)
													return (
														<>
															<span className="text-lg">
																{countryData?.flag || '🌐'}
															</span>
															<span className="text-sm font-medium">
																{profile?.countryOfStudy || 'Not provided'}
															</span>
														</>
													)
												})()}
											</div>
										)}
									</div>
								</div>
								<div className="flex items-end gap-4">
									<div>
										<Label className="text-sm font-medium text-foreground">
											Level
										</Label>
										{isEditing ? (
											<CustomSelect
												value={
													editedProfile?.degree
														? {
																value: editedProfile.degree,
																label: editedProfile.degree,
															}
														: null
												}
												onChange={(option) =>
													handleFieldChange('degree', option?.value || '')
												}
												placeholder="Level"
												options={[
													{
														value: 'High School',
														label: 'High School',
													},
													{
														value: 'Associate',
														label: 'Associate',
													},
													{
														value: "Bachelor's",
														label: "Bachelor's",
													},
													{
														value: "Master's",
														label: "Master's",
													},
													{ value: 'PhD', label: 'PhD' },
													{
														value: 'Professional',
														label: 'Professional',
													},
												]}
												menuPortalTarget={document.body}
												isClearable={false}
												variant="green"
												className="w-sm"
											/>
										) : (
											<p className="text-sm font-medium">
												{profile?.degree || 'Not provided'}
											</p>
										)}
									</div>
									<span className="text-gray-400 text-xl pb-2">|</span>
									<div>
										<Label className="text-sm font-medium text-foreground">
											Discipline
										</Label>
										{isEditing ? (
											<CustomSelect
												value={
													editedProfile?.fieldOfStudy
														? {
																value: editedProfile.fieldOfStudy,
																label: editedProfile.fieldOfStudy,
															}
														: null
												}
												onChange={(option) =>
													handleFieldChange('fieldOfStudy', option?.value || '')
												}
												placeholder="Choose discipline"
												options={[
													{
														value: 'Computer Science',
														label: 'Computer Science',
													},
													{
														value: 'Business Administration',
														label: 'Business Administration',
													},
													{
														value: 'Engineering',
														label: 'Engineering',
													},
													{
														value: 'Medicine',
														label: 'Medicine',
													},
													{ value: 'Law', label: 'Law' },
													{ value: 'Arts', label: 'Arts' },
													{
														value: 'Sciences',
														label: 'Sciences',
													},
												]}
												menuPortalTarget={document.body}
												isClearable={false}
												className="w-sm"
											/>
										) : (
											<p className="text-sm">
												{profile?.fieldOfStudy || 'Not provided'}
											</p>
										)}
									</div>
									<div className="flex items-center gap-2">
										<div className="bg-[rgba(17,110,99,0.7)] text-white px-3 py-2 rounded-full text-sm font-medium">
											GPA
										</div>
										<span className="text-gray-400 text-xl pb-1">|</span>
										{isEditing ? (
											<Input
												placeholder="Score"
												value={editedProfile?.gpa || ''}
												onChange={(e) =>
													handleFieldChange('gpa', e.target.value)
												}
												inputSize="select"
												fullWidth={false}
												width="w-32"
											/>
										) : (
											<p className="text-sm font-medium">
												{profile?.gpa || 'Not provided'}
											</p>
										)}
									</div>
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
			{/* Foreign Language Section */}
			<Card>
				<CardContent className="p-6">
					<div className="space-y-4">
						<div className="flex items-center gap-8">
							<h3 className="text-lg font-semibold text-foreground">
								Foreign Language
							</h3>

							{/* Foreign Language Status Radio Buttons */}
							<div className="flex items-center gap-6">
								<div className="flex items-center space-x-2">
									<input
										type="radio"
										id="language-yes"
										name="hasForeignLanguage"
										checked={
											isEditing
												? editedProfile?.hasForeignLanguage === 'yes'
												: profile?.hasForeignLanguage === 'yes'
										}
										onChange={() =>
											handleFieldChange('hasForeignLanguage', 'yes')
										}
										disabled={!isEditing}
										className="w-4 h-4 text-primary border-2 border-primary focus:outline-none"
										style={{
											accentColor: '#126E64',
										}}
									/>
									<Label
										htmlFor="language-yes"
										className="text-sm font-normal cursor-pointer"
									>
										Yes
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<input
										type="radio"
										id="language-no"
										name="hasForeignLanguage"
										checked={
											isEditing
												? editedProfile?.hasForeignLanguage === 'no'
												: profile?.hasForeignLanguage === 'no'
										}
										onChange={() =>
											handleFieldChange('hasForeignLanguage', 'no')
										}
										disabled={!isEditing}
										className="w-4 h-4 text-primary border-2 border-primary focus:outline-none"
										style={{
											accentColor: '#126E64',
										}}
									/>
									<Label
										htmlFor="language-no"
										className="text-sm font-normal cursor-pointer"
									>
										No
									</Label>
								</div>
							</div>
						</div>

						{/* Language Certifications - Only show if Yes */}
						{(isEditing
							? editedProfile?.hasForeignLanguage
							: profile?.hasForeignLanguage) === 'yes' && (
							<div className="space-y-4">
								{(isEditing
									? editedProfile?.languages
									: profile?.languages
								)?.map((lang: any, index: number) => (
									<div
										key={index}
										className="grid grid-cols-1 md:grid-cols-6 gap-4"
									>
										<div className="space-y-2 md:col-span-2">
											<Label className="text-sm font-medium text-foreground">
												Language
											</Label>
											{isEditing ? (
												<CustomSelect
													value={
														lang.language
															? {
																	value: lang.language,
																	label: lang.language,
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
																				langOption.value === lang.language
																		)?.flag || '🌐',
																}
															: null
													}
													onChange={(option) => {
														const newLanguages = [
															...(editedProfile?.languages || []),
														]
														newLanguages[index] = {
															...newLanguages[index],
															language: option?.value || '',
														}
														handleFieldChange('languages', newLanguages)
													}}
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
												/>
											) : (
												<div className="flex items-center space-x-2">
													<span className="text-lg">
														{[
															{ value: 'Vietnamese', flag: '🇻🇳' },
															{ value: 'English', flag: '🇺🇸' },
															{ value: 'Spanish', flag: '🇪🇸' },
															{ value: 'French', flag: '🇫🇷' },
															{ value: 'German', flag: '🇩🇪' },
															{ value: 'Chinese', flag: '🇨🇳' },
															{ value: 'Japanese', flag: '🇯🇵' },
															{ value: 'Korean', flag: '🇰🇷' },
														].find(
															(langOption) => langOption.value === lang.language
														)?.flag || '🌐'}
													</span>
													<span className="text-sm font-medium">
														{lang.language}
													</span>
												</div>
											)}
										</div>
										<div className="space-y-2 md:col-span-2">
											<Label className="text-sm font-medium text-foreground">
												Certificate
											</Label>
											{isEditing ? (
												<CustomSelect
													value={
														lang.certificate
															? {
																	value: lang.certificate,
																	label: lang.certificate,
																}
															: null
													}
													onChange={(option) => {
														const newLanguages = [
															...(editedProfile?.languages || []),
														]
														newLanguages[index] = {
															...newLanguages[index],
															certificate: option?.value || '',
														}
														handleFieldChange('languages', newLanguages)
													}}
													placeholder="Select certificate"
													options={[
														{ value: 'IELTS', label: 'IELTS' },
														{ value: 'TOEFL', label: 'TOEFL' },
														{ value: 'TOEIC', label: 'TOEIC' },
														{ value: 'Cambridge', label: 'Cambridge' },
														{ value: 'DELE', label: 'DELE' },
														{ value: 'DELF', label: 'DELF' },
														{ value: 'HSK', label: 'HSK' },
														{ value: 'JLPT', label: 'JLPT' },
													]}
													menuPortalTarget={document.body}
													variant="green"
												/>
											) : (
												<p className="text-sm text-muted-foreground">
													{lang.certificate}
												</p>
											)}
										</div>
										<div className="space-y-2 md:col-span-1">
											<Label className="text-sm font-medium text-foreground">
												Score
											</Label>
											{isEditing ? (
												<Input
													placeholder="Score"
													value={lang.score}
													onChange={(e) => {
														const newLanguages = [
															...(editedProfile?.languages || []),
														]
														newLanguages[index] = {
															...newLanguages[index],
															score: e.target.value,
														}
														handleFieldChange('languages', newLanguages)
													}}
													inputSize="select"
													fullWidth={false}
													width="w-32"
												/>
											) : (
												<p className="text-sm font-medium">{lang.score}</p>
											)}
										</div>
										{/* Delete Button */}
										{isEditing && (
											<div className="space-y-2 md:col-span-1 flex items-end">
												<button
													type="button"
													onClick={() => {
														const newLanguages = (
															editedProfile?.languages || []
														).filter((_: any, i: number) => i !== index)
														handleFieldChange('languages', newLanguages)
													}}
													className="text-red-500 hover:text-red-700 transition-colors p-1"
													title="Delete language certification"
												>
													<X className="h-5 w-5" />
												</button>
											</div>
										)}
									</div>
								))}

								{/* Add Language Certification Button - Only show if less than 3 and editing */}
								{isEditing && (editedProfile?.languages || []).length < 3 && (
									<div className="flex justify-end">
										<button
											type="button"
											onClick={() => {
												const newLanguages = [
													...(editedProfile?.languages || []),
													{ language: '', certificate: '', score: '' },
												]
												handleFieldChange('languages', newLanguages)
											}}
											className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
										>
											<span className="underline">
												Add language certification
											</span>
											<div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
												<span className="text-white text-sm font-bold">+</span>
											</div>
										</button>
									</div>
								)}
							</div>
						)}
					</div>
				</CardContent>
			</Card>
			{/* CV / Resume Files */}
			<Card>
				<CardContent className="p-6">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-lg font-semibold">CV / Resume</h3>
						{isEditing && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									const input = document.createElement('input')
									input.type = 'file'
									input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png'
									input.multiple = true
									input.onchange = (e) => handleFileSelect(e as any, 'cv')
									input.click()
								}}
								disabled={isUploading}
								className="flex items-center gap-2"
							>
								<Upload className="h-4 w-4" />
								{isUploading ? 'Uploading...' : 'Add More'}
							</Button>
						)}
					</div>

					{/* Files List */}
					<div className="space-y-3 max-h-64 overflow-y-auto">
						{(isEditing ? editedProfile?.cvFiles : profile?.cvFiles)?.length >
						0 ? (
							(isEditing ? editedProfile?.cvFiles : profile?.cvFiles).map(
								(file: any, index: number) => (
									<div
										key={index}
										className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
									>
										<div className="flex items-center gap-3">
											<span className="text-2xl">📄</span>
											<div>
												<p className="font-medium text-sm">
													{file.name || file.originalName}
												</p>
												<p className="text-xs text-muted-foreground">
													{((file.size || file.fileSize) / 1024).toFixed(1)} KB
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<button
												onClick={() => window.open(file.url, '_blank')}
												className="text-primary hover:text-primary/80 text-sm font-medium"
											>
												View
											</button>
											{isEditing && (
												<button
													onClick={() => handleRemoveFile(index, 'cv')}
													className="text-red-500 hover:text-red-700 p-1"
												>
													<X className="h-4 w-4" />
												</button>
											)}
										</div>
									</div>
								)
							)
						) : (
							<div className="text-center py-8 text-muted-foreground">
								<p>No files uploaded yet</p>
								{isEditing && (
									<p className="text-sm mt-1">
										Click &quot;Add More&quot; to upload files
									</p>
								)}
							</div>
						)}
					</div>
				</CardContent>
			</Card>
			{/* Foreign Language Certificate Files */}
			<Card>
				<CardContent className="p-6">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-lg font-semibold">
							Foreign Language Certificate
						</h3>
						{isEditing && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									const input = document.createElement('input')
									input.type = 'file'
									input.accept = '.pdf,.jpg,.jpeg,.png'
									input.multiple = true
									input.onchange = (e) =>
										handleFileSelect(e as any, 'languageCert')
									input.click()
								}}
								disabled={isUploading}
								className="flex items-center gap-2"
							>
								<Upload className="h-4 w-4" />
								{isUploading ? 'Uploading...' : 'Add More'}
							</Button>
						)}
					</div>

					{/* Files List */}
					<div className="space-y-3 max-h-64 overflow-y-auto">
						{(isEditing
							? editedProfile?.languageCertFiles
							: profile?.languageCertFiles
						)?.length > 0 ? (
							(isEditing
								? editedProfile?.languageCertFiles
								: profile?.languageCertFiles
							).map((file: any, index: number) => (
								<div
									key={index}
									className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
								>
									<div className="flex items-center gap-3">
										<span className="text-2xl">📄</span>
										<div>
											<p className="font-medium text-sm">
												{file.name || file.originalName}
											</p>
											<p className="text-xs text-muted-foreground">
												{((file.size || file.fileSize) / 1024).toFixed(1)} KB
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<button
											onClick={() => window.open(file.url, '_blank')}
											className="text-primary hover:text-primary/80 text-sm font-medium"
										>
											View
										</button>
										{isEditing && (
											<button
												onClick={() => handleRemoveFile(index, 'languageCert')}
												className="text-red-500 hover:text-red-700 p-1"
											>
												<X className="h-4 w-4" />
											</button>
										)}
									</div>
								</div>
							))
						) : (
							<div className="text-center py-8 text-muted-foreground">
								<p>No files uploaded yet</p>
								{isEditing && (
									<p className="text-sm mt-1">
										Click &quot;Add More&quot; to upload files
									</p>
								)}
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Degree Certificate Files */}
			<Card>
				<CardContent className="p-6">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-lg font-semibold">Degree Certificate</h3>
						{isEditing && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									const input = document.createElement('input')
									input.type = 'file'
									input.accept = '.pdf,.jpg,.jpeg,.png'
									input.multiple = true
									input.onchange = (e) => handleFileSelect(e as any, 'degree')
									input.click()
								}}
								disabled={isUploading}
								className="flex items-center gap-2"
							>
								<Upload className="h-4 w-4" />
								{isUploading ? 'Uploading...' : 'Add More'}
							</Button>
						)}
					</div>

					{/* Files List */}
					<div className="space-y-3 max-h-64 overflow-y-auto">
						{(isEditing ? editedProfile?.degreeFiles : profile?.degreeFiles)
							?.length > 0 ? (
							(isEditing
								? editedProfile?.degreeFiles
								: profile?.degreeFiles
							).map((file: any, index: number) => (
								<div
									key={index}
									className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
								>
									<div className="flex items-center gap-3">
										<span className="text-2xl">📄</span>
										<div>
											<p className="font-medium text-sm">
												{file.name || file.originalName}
											</p>
											<p className="text-xs text-muted-foreground">
												{((file.size || file.fileSize) / 1024).toFixed(1)} KB
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<button
											onClick={() => window.open(file.url, '_blank')}
											className="text-primary hover:text-primary/80 text-sm font-medium"
										>
											View
										</button>
										{isEditing && (
											<button
												onClick={() => handleRemoveFile(index, 'degree')}
												className="text-red-500 hover:text-red-700 p-1"
											>
												<X className="h-4 w-4" />
											</button>
										)}
									</div>
								</div>
							))
						) : (
							<div className="text-center py-8 text-muted-foreground">
								<p>No files uploaded yet</p>
								{isEditing && (
									<p className="text-sm mt-1">
										Click &quot;Add More&quot; to upload files
									</p>
								)}
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Transcript Files */}
			<Card>
				<CardContent className="p-6">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-lg font-semibold">Academic Transcript</h3>
						{isEditing && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									const input = document.createElement('input')
									input.type = 'file'
									input.accept = '.pdf,.jpg,.jpeg,.png'
									input.multiple = true
									input.onchange = (e) =>
										handleFileSelect(e as any, 'transcript')
									input.click()
								}}
								disabled={isUploading}
								className="flex items-center gap-2"
							>
								<Upload className="h-4 w-4" />
								{isUploading ? 'Uploading...' : 'Add More'}
							</Button>
						)}
					</div>

					{/* Files List */}
					<div className="space-y-3 max-h-64 overflow-y-auto">
						{(isEditing
							? editedProfile?.transcriptFiles
							: profile?.transcriptFiles
						)?.length > 0 ? (
							(isEditing
								? editedProfile?.transcriptFiles
								: profile?.transcriptFiles
							).map((file: any, index: number) => (
								<div
									key={index}
									className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
								>
									<div className="flex items-center gap-3">
										<span className="text-2xl">📄</span>
										<div>
											<p className="font-medium text-sm">
												{file.name || file.originalName}
											</p>
											<p className="text-xs text-muted-foreground">
												{((file.size || file.fileSize) / 1024).toFixed(1)} KB
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<button
											onClick={() => window.open(file.url, '_blank')}
											className="text-primary hover:text-primary/80 text-sm font-medium"
										>
											View
										</button>
										{isEditing && (
											<button
												onClick={() => handleRemoveFile(index, 'transcript')}
												className="text-red-500 hover:text-red-700 p-1"
											>
												<X className="h-4 w-4" />
											</button>
										)}
									</div>
								</div>
							))
						) : (
							<div className="text-center py-8 text-muted-foreground">
								<p>No files uploaded yet</p>
								{isEditing && (
									<p className="text-sm mt-1">
										Click &quot;Add More&quot; to upload files
									</p>
								)}
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Research Papers */}
			<Card>
				<CardContent className="p-6">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-lg font-semibold">Research Papers</h3>
						{isEditing && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									const newPapers = [
										...(editedProfile?.researchPapers || []),
										{ title: '', discipline: '', files: [] },
									]
									handleFieldChange('researchPapers', newPapers)
								}}
								className="flex items-center gap-2"
							>
								<Upload className="h-4 w-4" />
								Add Research Paper
							</Button>
						)}
					</div>

					{/* Research Papers List */}
					<div className="space-y-6">
						{(isEditing
							? editedProfile?.researchPapers
							: profile?.researchPapers
						)?.length > 0 ? (
							(isEditing
								? editedProfile?.researchPapers
								: profile?.researchPapers
							).map((paper: any, index: number) => (
								<div key={index} className="border rounded-lg p-4">
									<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
										{/* Left side - Title and Discipline */}
										<div className="space-y-4">
											<div className="space-y-2">
												<Label className="text-sm font-medium text-foreground">
													Paper Title
												</Label>
												{isEditing ? (
													<Input
														placeholder="Enter research paper title"
														value={paper.title}
														onChange={(e) => {
															const newPapers = [
																...(editedProfile?.researchPapers || []),
															]
															newPapers[index] = {
																...newPapers[index],
																title: e.target.value,
															}
															handleFieldChange('researchPapers', newPapers)
														}}
														inputSize="select"
													/>
												) : (
													<p className="text-sm font-medium">
														{paper.title || 'Not provided'}
													</p>
												)}
											</div>
											<div className="space-y-2">
												<Label>Disciplines</Label>
												{isEditing ? (
													<CustomSelect
														value={
															paper.discipline
																? paper.discipline
																		.split(',')
																		.map((d: string) => d.trim())
																		.map((discipline: string) => ({
																			value: discipline,
																			label: discipline,
																		}))
																: []
														}
														onChange={(options) => {
															const newPapers = [
																...(editedProfile?.researchPapers || []),
															]
															const selectedDisciplines = options
																? options.map((option: any) => option.value)
																: []
															newPapers[index] = {
																...newPapers[index],
																discipline: selectedDisciplines.join(', '),
															}
															handleFieldChange('researchPapers', newPapers)
														}}
														placeholder="Choose disciplines"
														options={[
															{
																value: 'Computer Science',
																label: 'Computer Science',
															},
															{
																value: 'Business Administration',
																label: 'Business Administration',
															},
															{ value: 'Engineering', label: 'Engineering' },
															{ value: 'Medicine', label: 'Medicine' },
															{ value: 'Law', label: 'Law' },
															{ value: 'Arts', label: 'Arts' },
															{ value: 'Sciences', label: 'Sciences' },
															{ value: 'Mathematics', label: 'Mathematics' },
															{ value: 'Physics', label: 'Physics' },
															{ value: 'Chemistry', label: 'Chemistry' },
															{ value: 'Biology', label: 'Biology' },
															{ value: 'Psychology', label: 'Psychology' },
															{ value: 'Sociology', label: 'Sociology' },
															{ value: 'Economics', label: 'Economics' },
															{
																value: 'Political Science',
																label: 'Political Science',
															},
														]}
														isMulti
														isSearchable
														isClearable
													/>
												) : (
													<p className="text-sm">
														{paper.discipline || 'Not provided'}
													</p>
												)}
											</div>
										</div>

										{/* Right side - File Upload */}
										<div className="space-y-3">
											<Label className="text-sm font-medium text-foreground">
												Research Paper Files
											</Label>
											{isEditing && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														const input = document.createElement('input')
														input.type = 'file'
														input.accept = '.pdf,.doc,.docx'
														input.multiple = true
														input.onchange = (e) =>
															handleFileSelect(e as any, 'researchPaper', index)
														input.click()
													}}
													disabled={isUploading}
													className="flex items-center gap-2"
												>
													<Upload className="h-4 w-4" />
													{isUploading ? 'Uploading...' : 'Upload Files'}
												</Button>
											)}

											{/* Files List for this research paper */}
											<div className="space-y-2 max-h-32 overflow-y-auto">
												{paper.files && paper.files.length > 0 ? (
													paper.files.map((file: any, fileIndex: number) => (
														<div
															key={fileIndex}
															className="flex items-center justify-between bg-gray-50 rounded-lg p-2"
														>
															<div className="flex items-center gap-2">
																<span className="text-lg">📄</span>
																<div>
																	<p className="font-medium text-xs">
																		{file.name || file.originalName}
																	</p>
																	<p className="text-xs text-muted-foreground">
																		{(
																			(file.size || file.fileSize) / 1024
																		).toFixed(1)}{' '}
																		KB
																	</p>
																</div>
															</div>
															<div className="flex items-center gap-1">
																<button
																	onClick={() =>
																		window.open(file.url, '_blank')
																	}
																	className="text-primary hover:text-primary/80 text-xs font-medium"
																>
																	View
																</button>
																{isEditing && (
																	<button
																		onClick={() =>
																			handleRemoveResearchPaperFile(
																				index,
																				fileIndex
																			)
																		}
																		className="text-red-500 hover:text-red-700 p-1"
																	>
																		<X className="h-3 w-3" />
																	</button>
																)}
															</div>
														</div>
													))
												) : (
													<p className="text-xs text-muted-foreground">
														No files uploaded
													</p>
												)}
											</div>
										</div>
									</div>

									{/* Delete Research Paper Button */}
									{isEditing && (
										<div className="flex justify-end mt-4">
											<button
												onClick={() => {
													const newPapers = (
														editedProfile?.researchPapers || []
													).filter((_: any, i: number) => i !== index)
													handleFieldChange('researchPapers', newPapers)
												}}
												className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
											>
												<X className="h-4 w-4" />
												Delete Research Paper
											</button>
										</div>
									)}
								</div>
							))
						) : (
							<div className="text-center py-8 text-muted-foreground">
								<p>No research papers uploaded yet</p>
								{isEditing && (
									<p className="text-sm mt-1">
										Click &quot;Add Research Paper&quot; to get started
									</p>
								)}
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Success Modal */}
			<SuccessModal
				isOpen={showSuccessModal}
				onClose={() => setShowSuccessModal(false)}
				title="Success!"
				message="Your academic information has been updated successfully."
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
