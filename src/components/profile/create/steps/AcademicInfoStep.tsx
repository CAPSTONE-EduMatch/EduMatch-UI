import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'
import { FileUploadManager } from '@/components/ui'
import { CustomSelect } from '@/components/ui'
import { ErrorModal } from '@/components/ui'
import { FileItem } from '@/lib/file-utils'
import { ProfileFormData } from '@/lib/profile-service'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getCountriesWithSvgFlags } from '@/data/countries'
import { ApiService } from '@/lib/axios-config'

interface AcademicInfoStepProps {
	formData: ProfileFormData
	onInputChange: (
		field: keyof ProfileFormData,
		value:
			| string
			| Array<{ language: string; certificate: string; score: string }>
			| Array<{ title: string; discipline: string; files: any[] }>
	) => void
	onInputChangeEvent: (
		field: keyof ProfileFormData
	) => (e: React.ChangeEvent<HTMLInputElement>) => void
	onSelectChange: (field: keyof ProfileFormData) => (value: string) => void
	onCheckboxChange: (field: keyof ProfileFormData) => (checked: boolean) => void
	onFilesUploaded: (files: FileItem[]) => void
	onBack: () => void
	onNext: () => void
	onShowManageModal: () => void
}

export function AcademicInfoStep({
	formData,
	onInputChange,
	onInputChangeEvent,
	onSelectChange,
	onCheckboxChange,
	onFilesUploaded,
	onBack,
	onNext,
	onShowManageModal,
}: AcademicInfoStepProps) {
	const [showErrorModal, setShowErrorModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')

	// State for subdisciplines loaded from database
	const [subdisciplines, setSubdisciplines] = useState<
		Array<{ value: string; label: string; discipline: string }>
	>([])

	// Load subdisciplines from database
	useEffect(() => {
		const loadSubdisciplines = async () => {
			try {
				const response = await ApiService.getSubdisciplines()
				if (response.success) {
					setSubdisciplines(response.subdisciplines)
				}
			} catch (error) {
				console.error('Failed to load subdisciplines:', error)
			}
		}
		loadSubdisciplines()
	}, [])

	// Add default research paper when component mounts
	useEffect(() => {
		if (formData.researchPapers?.length === 0) {
			onInputChange('researchPapers', [
				{ title: '', discipline: '', files: [] },
			])
		}
	}, [])

	// Add default language certification when foreign language is set to "yes"
	useEffect(() => {
		if (
			formData.hasForeignLanguage === 'yes' &&
			formData.languages?.length === 0
		) {
			onInputChange('languages', [{ language: '', certificate: '', score: '' }])
		}
	}, [formData.hasForeignLanguage])

	// Clear languages when user selects "no"
	useEffect(() => {
		if (formData.hasForeignLanguage === 'no' && formData.languages?.length) {
			onInputChange('languages', [] as any)
		}
	}, [formData.hasForeignLanguage])
	const handleCategoryFilesUploaded = (category: string, files: FileItem[]) => {
		try {
			// Get existing files for this category
			const existingFiles =
				(formData[category as keyof ProfileFormData] as FileItem[]) || []

			// Merge new files with existing files
			const mergedFiles = [...existingFiles, ...files]

			// Store merged file metadata in form state
			onInputChange(category as keyof ProfileFormData, mergedFiles as any)
		} catch (error) {
			setErrorMessage('Failed to process uploaded files. Please try again.')
			setShowErrorModal(true)
		}
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

	// Function to validate and format GPA score (4.0 scale)
	const handleGpaInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value

		// Allow empty string
		if (value === '') {
			onInputChange('gpa', '')
			return
		}

		// Allow typing decimal separators and numbers
		let cleanValue = value.replace(/[^0-9.,]/g, '')

		// Allow partial input like "3." or "3," while typing
		if (cleanValue.endsWith('.') || cleanValue.endsWith(',')) {
			onInputChange('gpa', cleanValue)
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
			onInputChange('gpa', cleanValue)
		} else if (
			cleanValue === '0' ||
			cleanValue === '1' ||
			cleanValue === '2' ||
			cleanValue === '3' ||
			cleanValue === '4'
		) {
			// Allow single digits 0-4
			onInputChange('gpa', cleanValue)
		}
	}

	const getAllFiles = () => {
		// Process research paper files with context
		const researchPaperFiles =
			formData.researchPapers?.flatMap((paper, paperIndex) =>
				(paper.files || []).map((file) => ({
					...file,
					// Add research paper context for better display
					researchPaperTitle: paper.title || `Research Paper ${paperIndex + 1}`,
					researchPaperDiscipline:
						paper.discipline || 'No discipline specified',
					researchPaperIndex: paperIndex,
					// Enhanced display name
					displayName: `${file.name} (${paper.title || `Paper ${paperIndex + 1}`})`,
					// Enhanced category with context
					category: `research-paper-${paperIndex}-${paper.title?.replace(/\s+/g, '-').toLowerCase() || 'untitled'}`,
				}))
			) || []

		const allFiles = [
			...(formData.cvFiles || []),
			...(formData.languageCertFiles || []),
			...(formData.degreeFiles || []),
			...(formData.transcriptFiles || []),
			...researchPaperFiles,
		]

		return allFiles
	}
	return (
		<div className="space-y-6 relative">
			<div className="text-center">
				<h2 className="text-2xl font-bold text-primary mb-2">
					Academic Information
				</h2>
				<p className="text-muted-foreground max-w-md mx-auto">
					Tell us about your educational background and academic achievements.
				</p>
			</div>

			<div className="space-y-8">
				{/* Graduated Section */}
				<div className="space-y-4">
					<div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
						<h3 className="text-lg font-semibold text-foreground">Graduated</h3>

						{/* Graduation Status Radio Buttons */}
						<div className="flex items-center gap-4 sm:gap-6">
							<div className="flex items-center space-x-2">
								<input
									type="radio"
									id="not-yet"
									name="graduationStatus"
									checked={formData.graduationStatus === 'not-yet'}
									onChange={() => onInputChange('graduationStatus', 'not-yet')}
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
									checked={formData.graduationStatus === 'graduated'}
									onChange={() =>
										onInputChange('graduationStatus', 'graduated')
									}
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

					{/* Academic Details - Show for both graduated and not-yet */}
					<div className="space-y-4">
						{/* Level and Discipline Row */}
						<div className="flex flex-col lg:flex-row lg:items-end gap-4">
							<div className="flex-1">
								<CustomSelect
									value={
										formData.degree
											? { value: formData.degree, label: formData.degree }
											: null
									}
									onChange={(option) =>
										onSelectChange('degree')(option?.value || '')
									}
									placeholder="Level"
									options={[
										{ value: 'High School', label: 'High School' },
										{ value: 'Associate', label: 'Associate' },
										{ value: "Bachelor's", label: "Bachelor's" },
										{ value: "Master's", label: "Master's" },
										{ value: 'PhD', label: 'PhD' },
										{ value: 'Professional', label: 'Professional' },
									]}
									variant="green"
									menuPortalTarget={document.body}
									isClearable={false}
									className="w-60"
								/>
							</div>
							<div className="hidden lg:block text-gray-400 text-xl pb-2">
								|
							</div>
							<div className="flex-1">
								<CustomSelect
									value={
										formData.fieldOfStudy
											? {
													value: formData.fieldOfStudy,
													label: formData.fieldOfStudy,
												}
											: null
									}
									onChange={(option) =>
										onSelectChange('fieldOfStudy')(option?.value || '')
									}
									placeholder="Choose discipline"
									options={subdisciplines}
									variant="default"
									menuPortalTarget={document.body}
									isClearable={false}
									isSearchable
									className="w-60"
								/>
							</div>
							{/* GPA Row */}
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
										value={formData.gpa || ''}
										onChange={handleGpaInput}
										inputSize="select"
										fullWidth={false}
										width="w-24"
									/>
								</div>
							</div>
						</div>
						{/* Additional fields - University and Country of Study */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<Label className="text-sm font-medium text-foreground">
									University
								</Label>
								<Input
									placeholder="e.g., Harvard University"
									value={formData.university || ''}
									onChange={(e) => onInputChange('university', e.target.value)}
									inputSize="select"
								/>
							</div>
							<div>
								<Label className="text-sm font-medium text-foreground">
									Country of Study
								</Label>
								<CustomSelect
									value={
										formData.countryOfStudy
											? getCountriesWithSvgFlags().find(
													(c) => c.name === formData.countryOfStudy
												)
											: null
									}
									onChange={(option) =>
										onSelectChange('countryOfStudy')(option?.name || '')
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
									variant="default"
									menuPortalTarget={document.body}
									isSearchable
									filterOption={(option, inputValue) => {
										const country = option.data
										return country.name
											.toLowerCase()
											.includes(inputValue.toLowerCase())
									}}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Foreign Language Section */}
				<div className="space-y-4">
					<div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
						<h3 className="text-lg font-semibold text-foreground">
							Foreign Language
						</h3>

						{/* Foreign Language Status Radio Buttons */}
						<div className="flex items-center gap-4 sm:gap-6">
							<div className="flex items-center space-x-2">
								<input
									type="radio"
									id="language-yes"
									name="hasForeignLanguage"
									checked={formData.hasForeignLanguage === 'yes'}
									onChange={() => onInputChange('hasForeignLanguage', 'yes')}
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
									checked={formData.hasForeignLanguage === 'no'}
									onChange={() => onInputChange('hasForeignLanguage', 'no')}
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
					{formData.hasForeignLanguage === 'yes' && (
						<div className="space-y-4">
							{formData.languages.map((lang, index) => (
								<div key={index} className="flex flex-col lg:flex-row gap-2">
									<div className="space-y-1 flex-1">
										<Label className="text-sm font-medium text-foreground">
											Language
										</Label>
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
												const newLanguages = [...formData.languages]
												newLanguages[index] = {
													...newLanguages[index],
													language: option?.value || '',
												}
												onInputChange('languages', newLanguages)
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
												lang.certificate
													? { value: lang.certificate, label: lang.certificate }
													: null
											}
											onChange={(option) => {
												const newLanguages = [...formData.languages]
												newLanguages[index] = {
													...newLanguages[index],
													certificate: option?.value || '',
												}
												onInputChange('languages', newLanguages)
											}}
											placeholder="Select certificate"
											variant="green"
											className="w-full"
											options={getCertificateOptions(lang.language)}
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
											value={lang.score}
											onChange={(e) => {
												const newLanguages = [...formData.languages]
												newLanguages[index] = {
													...newLanguages[index],
													score: e.target.value,
												}
												onInputChange('languages', newLanguages)
											}}
											inputSize="select"
											fullWidth={false}
											width="w-full"
										/>
									</div>
								</div>
							))}

							{/* Add Language Certification Button - Only show if less than 3 */}
							{formData.languages.length < 3 && (
								<div className="flex justify-end">
									<button
										type="button"
										onClick={() => {
											const newLanguages = [
												...formData.languages,
												{ language: '', certificate: '', score: '' },
											]
											onInputChange('languages', newLanguages)
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
			</div>

			{/* File Upload Section */}
			<div className="space-y-6">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* CV/Resume Upload */}
					<div className="space-y-3">
						<Label className="text-sm font-medium text-foreground">
							CV / Resume
						</Label>
						<FileUploadManager
							onFilesUploaded={(files) =>
								handleCategoryFilesUploaded('cvFiles', files)
							}
							category="cv-resume"
							acceptedTypes={[
								'application/pdf',
								'application/msword',
								'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
							]}
							maxSize={10}
							showPreview={false}
						/>
						{formData.cvFiles && formData.cvFiles.length > 0 && (
							<div className="text-xs text-green-600">
								{formData.cvFiles.length} file(s) uploaded
							</div>
						)}
					</div>

					{/* Foreign Language Certificate Upload */}
					<div className="space-y-3">
						<Label className="text-sm font-medium text-foreground">
							Foreign Language Certificate
						</Label>
						<FileUploadManager
							onFilesUploaded={(files) =>
								handleCategoryFilesUploaded('languageCertFiles', files)
							}
							category="language-certificates"
							acceptedTypes={[
								'application/pdf',
								'image/jpeg',
								'image/png',
								'image/jpg',
							]}
							maxSize={10}
							showPreview={false}
						/>
						{formData.languageCertFiles &&
							formData.languageCertFiles.length > 0 && (
								<div className="text-xs text-green-600">
									{formData.languageCertFiles.length} file(s) uploaded
								</div>
							)}
					</div>

					{/* Degree Upload */}
					<div className="space-y-3">
						<Label className="text-sm font-medium text-foreground">
							Degree Certificate
						</Label>
						<FileUploadManager
							onFilesUploaded={(files) =>
								handleCategoryFilesUploaded('degreeFiles', files)
							}
							category="degree-certificates"
							acceptedTypes={[
								'application/pdf',
								'image/jpeg',
								'image/png',
								'image/jpg',
							]}
							maxSize={10}
							showPreview={false}
						/>
						{formData.degreeFiles && formData.degreeFiles.length > 0 && (
							<div className="text-xs text-green-600">
								{formData.degreeFiles.length} file(s) uploaded
							</div>
						)}
					</div>

					{/* Transcript Upload */}
					<div className="space-y-3">
						<Label className="text-sm font-medium text-foreground">
							Academic Transcript
						</Label>
						<FileUploadManager
							onFilesUploaded={(files) =>
								handleCategoryFilesUploaded('transcriptFiles', files)
							}
							category="transcripts"
							acceptedTypes={[
								'application/pdf',
								'image/jpeg',
								'image/png',
								'image/jpg',
							]}
							maxSize={10}
							showPreview={false}
						/>
						{formData.transcriptFiles &&
							formData.transcriptFiles.length > 0 && (
								<div className="text-xs text-green-600">
									{formData.transcriptFiles.length} file(s) uploaded
								</div>
							)}
					</div>
				</div>
			</div>
			<div className="space-y-4">
				<div className="flex items-center gap-8">
					<h3 className="text-lg font-semibold text-foreground">
						Research Papers
					</h3>
				</div>

				<div className="space-y-6">
					{formData.researchPapers?.map((paper, index) => (
						<div key={index} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
							{/* Left side - Title and Discipline */}
							<div className="space-y-4">
								<div className="space-y-2">
									<Label className="text-sm font-medium text-foreground">
										Paper Title
									</Label>
									<Input
										placeholder="Enter research paper title"
										value={paper.title}
										onChange={(e) => {
											const newPapers = [...(formData.researchPapers || [])]
											newPapers[index] = {
												...newPapers[index],
												title: e.target.value,
											}
											onInputChange('researchPapers', newPapers)
										}}
										inputSize="select"
									/>
								</div>
								<div className="space-y-2">
									<Label>Disciplines</Label>
									<CustomSelect
										value={
											paper.discipline
												? paper.discipline
														.split(',')
														.map((d: string) => d.trim())
														.map((discipline) => ({
															value: discipline,
															label: discipline,
														}))
												: []
										}
										onChange={(options) => {
											const newPapers = [...(formData.researchPapers || [])]
											const selectedDisciplines = options
												? options.map((option: any) => option.value)
												: []
											newPapers[index] = {
												...newPapers[index],
												discipline: selectedDisciplines.join(', '),
											}
											onInputChange('researchPapers', newPapers)
										}}
										placeholder="Choose disciplines"
										options={subdisciplines}
										isMulti
										isSearchable
										isClearable
										maxSelectedHeight="120px"
									/>
								</div>
							</div>

							{/* Right side - File Upload */}
							<div className="space-y-3">
								<Label className="text-sm font-medium text-foreground">
									Research Paper Files
								</Label>
								<FileUploadManager
									onFilesUploaded={(files) => {
										try {
											// Get current paper info for context
											const currentPaper = formData.researchPapers?.[index]
											const paperTitle =
												currentPaper?.title || `Research Paper ${index + 1}`
											const paperDiscipline =
												currentPaper?.discipline || 'No discipline specified'

											// Enhance files with research paper context
											const processedFiles = files.map((file) => ({
												...file,
												// Add research paper context
												researchPaperTitle: paperTitle,
												researchPaperDiscipline: paperDiscipline,
												researchPaperIndex: index,
												// Enhanced display name
												displayName: `${file.name} (${paperTitle})`,
												// Enhanced category with context
												category: `research-paper-${index}-${paperTitle.replace(/\s+/g, '-').toLowerCase()}`,
											}))

											const newPapers = [...(formData.researchPapers || [])]
											const existingFiles = newPapers[index]?.files || []

											newPapers[index] = {
												...newPapers[index],
												files: [...existingFiles, ...processedFiles],
											}

											// Update the research papers
											onInputChange('researchPapers', newPapers)
										} catch (error) {
											setErrorMessage(
												'Failed to upload research paper files. Please try again.'
											)
											setShowErrorModal(true)
										}
									}}
									category={`research-paper-${index}`}
									acceptedTypes={[
										'application/pdf',
										'application/msword',
										'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
									]}
									maxSize={10}
									showPreview={false}
								/>
								{paper.files && paper.files.length > 0 && (
									<div className="text-xs text-green-600">
										{paper.files.length} file(s) uploaded
									</div>
								)}
							</div>
						</div>
					))}

					{/* Add Research Paper Button */}
					<div className="flex justify-end">
						<button
							type="button"
							onClick={() => {
								const newPapers = [
									...(formData.researchPapers || []),
									{ title: '', discipline: '', files: [] },
								]
								onInputChange('researchPapers', newPapers)
							}}
							className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
						>
							<span className="underline">Add research paper</span>
							<div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
								<span className="text-white text-sm font-bold">+</span>
							</div>
						</button>
					</div>
				</div>

				{/* Manage Files Button - Final Section */}
				{getAllFiles().length > 0 && (
					<div className="flex justify-center pt-6">
						<Button variant="outline" onClick={onShowManageModal} size="sm">
							Manage Files ({getAllFiles().length})
						</Button>
					</div>
				)}
			</div>
			<div className="flex flex-col sm:flex-row justify-between gap-4">
				<Button
					variant="outline"
					onClick={onBack}
					size="sm"
					className="w-full sm:w-auto"
				>
					Back
				</Button>
				<Button
					onClick={() => {
						// Filter out empty language entries before proceeding
						if (formData.hasForeignLanguage === 'yes' && formData.languages) {
							const cleaned = formData.languages.filter(
								(l) =>
									l.language?.trim() || l.certificate?.trim() || l.score?.trim()
							)
							if (cleaned.length !== formData.languages.length) {
								onInputChange('languages', cleaned as any)
							}
						}
						onNext()
					}}
					size="sm"
					className="w-full sm:w-auto"
				>
					Next
				</Button>
			</div>

			{/* Error Modal - Rendered via Portal to blur entire page */}
			{showErrorModal &&
				createPortal(
					<ErrorModal
						isOpen={showErrorModal}
						onClose={() => setShowErrorModal(false)}
						title="Upload Failed"
						message={errorMessage}
						buttonText="Try Again"
					/>,
					document.body
				)}
		</div>
	)
}
