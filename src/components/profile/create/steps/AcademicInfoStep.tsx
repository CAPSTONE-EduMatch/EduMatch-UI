import {
	Button,
	CustomSelect,
	ErrorModal,
	FileUploadManagerWithOCR,
	Input,
	Label,
} from '@/components/ui'
import { Tooltip } from '@/components/ui/feedback/tooltip'
// import { FileValidationResult } from '@/services/ai/file-validation-service'
import { FileValidationNotification } from '@/components/validation/FileValidationNotification'
import { useDisciplinesContext } from '@/contexts/DisciplinesContext'
import { getCountriesWithSvgFlags } from '@/data/countries'
import { FileValidationResult } from '@/services/ai/ollama-file-validation-service'
import { ProfileFormData } from '@/services/profile/profile-service'
import { FileItem } from '@/utils/file/file-utils'
import { Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

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
	onSelectChange,
	onBack,
	onNext,
	onShowManageModal,
}: AcademicInfoStepProps) {
	const t = useTranslations('create_profile.academic_info')
	const [showErrorModal, setShowErrorModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const [isAnyFileUploading, setIsAnyFileUploading] = useState(false)

	// Use shared disciplines context (loaded once at layout level, cached by React Query)
	const { subdisciplines = [] } = useDisciplinesContext()

	// State for validation notifications
	interface ValidationNotification {
		id: string
		validation: FileValidationResult
		fileName: string
		expectedFileType: string
	}
	const [validationNotifications, setValidationNotifications] = useState<
		ValidationNotification[]
	>([])

	// Add default research paper when component mounts
	useEffect(() => {
		if (formData.researchPapers?.length === 0) {
			onInputChange('researchPapers', [
				{ title: '', discipline: '', files: [] },
			])
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// Add default language certification when foreign language is set to "yes"
	useEffect(() => {
		if (
			formData.hasForeignLanguage === 'yes' &&
			formData.languages?.length === 0
		) {
			onInputChange('languages', [{ language: '', certificate: '', score: '' }])
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [formData.hasForeignLanguage])

	// Clear languages when user selects "no"
	useEffect(() => {
		if (formData.hasForeignLanguage === 'no' && formData.languages?.length) {
			onInputChange('languages', [] as any)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [formData.hasForeignLanguage])
	const handleCategoryFilesUploaded = (category: string, files: FileItem[]) => {
		// eslint-disable-next-line no-console
		console.log('handleCategoryFilesUploaded called:', category, files)

		try {
			// Get existing files for this category
			const existingFiles =
				(formData[category as keyof ProfileFormData] as FileItem[]) || []

			// Merge new files with existing files
			const mergedFiles = [...existingFiles, ...files]

			// Store merged file metadata in form state
			onInputChange(category as keyof ProfileFormData, mergedFiles as any)
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Error in handleCategoryFilesUploaded:', error)
			setErrorMessage(t('errors.message'))
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

	// Function to handle validation completion from new flow
	const handleValidationComplete = (
		fileId: string,
		validation: FileValidationResult
	) => {
		// Show validation notification if file is invalid or needs reupload
		if (!validation.isValid || validation.action === 'reupload') {
			// Get file info to determine category and name
			let fileName = `File ${fileId.slice(-8)}`
			let category = 'unknown'

			// Find file info from form data
			const allFiles = getAllFiles()
			const file = allFiles.find((f) => f.id === fileId)
			if (file) {
				fileName = file.name || file.originalName || fileName
				// Determine category based on file location in form data
				if (formData.cvFiles?.some((f) => f.id === fileId)) {
					category = 'cv-resume'
				} else if (formData.languageCertFiles?.some((f) => f.id === fileId)) {
					category = 'language-certificates'
				} else if (formData.degreeFiles?.some((f) => f.id === fileId)) {
					category = 'degree-certificates'
				} else if (formData.transcriptFiles?.some((f) => f.id === fileId)) {
					category = 'academic-transcripts'
				} else {
					// Check research papers
					formData.researchPapers?.forEach((p, index) => {
						if (p.files?.some((f) => f.id === fileId)) {
							category = `research-paper-${index}`
						}
					})
				}
			}

			// eslint-disable-next-line no-console
			console.log(
				'Adding validation notification for:',
				fileName,
				'category:',
				category
			)

			const notification: ValidationNotification = {
				id: `${fileId}-${Date.now()}`,
				validation,
				fileName,
				expectedFileType: category,
			}

			setValidationNotifications((prev) => {
				// Remove any existing notification for this file and add new one
				const filtered = prev.filter((n) => !n.id.startsWith(fileId))
				return [...filtered, notification]
			})

			// Auto-dismiss notification after 10 seconds for low confidence valid files
			if (validation.isValid && validation.confidence < 0.7) {
				setTimeout(() => {
					setValidationNotifications((prev) =>
						prev.filter((n) => n.id !== notification.id)
					)
				}, 10000)
			}
		}
	}

	// Function to handle OCR completion - only for autofill
	const handleOCRComplete = async (fileId: string, extractedText: string) => {
		// Get file info from form data to determine category
		let category = 'unknown'
		let file

		// Check CV files
		file = formData.cvFiles?.find((f) => f.id === fileId)
		if (file) category = 'cv-resume'

		// Check language cert files
		if (!file) {
			file = formData.languageCertFiles?.find((f) => f.id === fileId)
			if (file) category = 'language-certificates'
		}

		// Check degree files
		if (!file) {
			file = formData.degreeFiles?.find((f) => f.id === fileId)
			if (file) category = 'degree-certificates'
		}

		// Check transcript files
		if (!file) {
			file = formData.transcriptFiles?.find((f) => f.id === fileId)
			if (file) category = 'transcripts'
		}

		// Autofill based on category
		if (category === 'cv-resume') {
			autofillFromCV(extractedText)
		} else if (category === 'language-certificates') {
			autofillLanguageInfo(extractedText)
		} else if (category === 'degree-certificates') {
			autofillDegreeInfo(extractedText)
		} else if (category === 'transcripts') {
			autofillTranscriptInfo(extractedText)
		}
	}

	// Function to dismiss validation notification
	const dismissValidationNotification = (notificationId: string) => {
		setValidationNotifications((prev) =>
			prev.filter((n) => n.id !== notificationId)
		)
	}

	// Auto-fill from CV
	const autofillFromCV = (text: string) => {
		const universityPatterns = [
			/university of ([^\n,]+)/i,
			/([^\n,]+) university/i,
			/([^\n,]+) college/i,
		]

		for (const pattern of universityPatterns) {
			const match = text.match(pattern)
			if (match && match[1] && !formData.university) {
				onInputChange('university', match[1].trim())
				break
			}
		}
	}

	// Auto-fill language information
	const autofillLanguageInfo = (text: string) => {
		const ieltsMatch = text.match(/ielts[:\s]*(\d+\.?\d*)/i)
		const toeflMatch = text.match(/toefl[:\s]*(\d+)/i)
		const toeicMatch = text.match(/toeic[:\s]*(\d+)/i)

		if (formData.languages && formData.languages.length > 0) {
			const updatedLanguages = [...formData.languages]
			if (ieltsMatch && !updatedLanguages[0].score) {
				updatedLanguages[0].score = ieltsMatch[1]
				if (!updatedLanguages[0].certificate) {
					updatedLanguages[0].certificate = 'IELTS'
				}
				if (!updatedLanguages[0].language) {
					updatedLanguages[0].language = 'English'
				}
				onInputChange('languages', updatedLanguages)
			} else if (toeflMatch && !updatedLanguages[0].score) {
				updatedLanguages[0].score = toeflMatch[1]
				if (!updatedLanguages[0].certificate) {
					updatedLanguages[0].certificate = 'TOEFL'
				}
				if (!updatedLanguages[0].language) {
					updatedLanguages[0].language = 'English'
				}
				onInputChange('languages', updatedLanguages)
			} else if (toeicMatch && !updatedLanguages[0].score) {
				updatedLanguages[0].score = toeicMatch[1]
				if (!updatedLanguages[0].certificate) {
					updatedLanguages[0].certificate = 'TOEIC'
				}
				if (!updatedLanguages[0].language) {
					updatedLanguages[0].language = 'English'
				}
				onInputChange('languages', updatedLanguages)
			}
		}
	}

	// Auto-fill degree information
	const autofillDegreeInfo = (text: string) => {
		const lowerText = text.toLowerCase()

		if (!formData.degree) {
			if (lowerText.includes('bachelor') || lowerText.includes('b.')) {
				onInputChange('degree', "Bachelor's")
			} else if (lowerText.includes('master') || lowerText.includes('m.')) {
				onInputChange('degree', "Master's")
			} else if (lowerText.includes('phd') || lowerText.includes('doctor')) {
				onInputChange('degree', 'PhD')
			}
		}

		const universityPatterns = [
			/university of ([^\n,]+)/i,
			/([^\n,]+) university/i,
			/([^\n,]+) college/i,
		]

		for (const pattern of universityPatterns) {
			const match = text.match(pattern)
			if (match && match[1] && !formData.university) {
				onInputChange('university', match[1].trim())
				break
			}
		}
	}

	// Auto-fill transcript information
	const autofillTranscriptInfo = (text: string) => {
		const gpaPatterns = [
			/gpa[:\s]*(\d+\.?\d*)/i,
			/grade point average[:\s]*(\d+\.?\d*)/i,
			/cumulative[:\s]*(\d+\.?\d*)/i,
		]

		for (const pattern of gpaPatterns) {
			const match = text.match(pattern)
			if (match && match[1] && !formData.gpa) {
				const gpaValue = parseFloat(match[1])
				if (gpaValue >= 0 && gpaValue <= 4.0) {
					onInputChange('gpa', match[1])
					break
				}
			}
		}
	}

	return (
		<div className="space-y-6 relative">
			<div className="text-center">
				<h2 className="text-2xl font-bold text-primary mb-2">{t('title')}</h2>
				<p className="text-muted-foreground max-w-md mx-auto">
					{t('subtitle')}
				</p>
			</div>

			{/* Validation Notifications */}
			{validationNotifications.length > 0 && (
				<div className="space-y-3">
					{validationNotifications.map((notification) => (
						<FileValidationNotification
							key={notification.id}
							validation={notification.validation}
							fileName={notification.fileName}
							expectedFileType={notification.expectedFileType}
							onDismiss={() => dismissValidationNotification(notification.id)}
						/>
					))}
				</div>
			)}

			<div className="space-y-8">
				{/* Graduated Section */}
				<div className="space-y-4">
					<div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
						<h3 className="text-lg font-semibold text-foreground">
							{t('graduated.label')}
						</h3>

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
									{t('graduated.options.no')}
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
									{t('graduated.options.yes')}
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
									placeholder={t('level.placeholder')}
									options={[
										{
											value: 'High School',
											label: t('level.options.high_school'),
										},
										{ value: 'Associate', label: t('level.options.associate') },
										{ value: "Bachelor's", label: t('level.options.bachelor') },
										{ value: "Master's", label: t('level.options.master') },
										{ value: 'PhD', label: t('level.options.phd') },
										{
											value: 'Professional',
											label: t('level.options.professional'),
										},
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
									placeholder={t('discipline.placeholder')}
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
										{t('gpa.label')}
									</div>
									<span className="hidden sm:block text-gray-400 text-xl">
										|
									</span>
									<Input
										placeholder={t('gpa.placeholder')}
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
									{t('university.label')}
								</Label>
								<Input
									placeholder={t('university.placeholder')}
									value={formData.university || ''}
									onChange={(e) => onInputChange('university', e.target.value)}
									inputSize="select"
								/>
							</div>
							<div>
								<Label className="text-sm font-medium text-foreground">
									{t('country_of_study.label')}
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
									placeholder={t('country_of_study.placeholder')}
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
							{t('foreign_language.title')}
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
									{t('foreign_language.yes')}
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
									{t('foreign_language.no')}
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
											{t('foreign_language.language.label')}
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
												const newLanguage = option?.value || ''
												const currentLanguage = lang.language || ''
												// Reset certificate and score only when language actually changes
												if (newLanguage !== currentLanguage) {
													newLanguages[index] = {
														...newLanguages[index],
														language: newLanguage,
														certificate: '', // Reset certificate when language changes
														score: '', // Reset score when language changes
													}
												} else {
													// Just update the language if it's the same
													newLanguages[index] = {
														...newLanguages[index],
														language: newLanguage,
													}
												}
												onInputChange('languages', newLanguages)
											}}
											placeholder={t('foreign_language.language.placeholder')}
											options={[
												{
													value: 'Vietnamese',
													label: t(
														'foreign_language.language.options.vietnamese'
													),
													flag: '🇻🇳',
												},
												{
													value: 'English',
													label: t('foreign_language.language.options.english'),
													flag: '🇺🇸',
												},
												{
													value: 'Spanish',
													label: t('foreign_language.language.options.spanish'),
													flag: '🇪🇸',
												},
												{
													value: 'French',
													label: t('foreign_language.language.options.french'),
													flag: '🇫🇷',
												},
												{
													value: 'German',
													label: t('foreign_language.language.options.german'),
													flag: '🇩🇪',
												},
												{
													value: 'Chinese',
													label: t('foreign_language.language.options.chinese'),
													flag: '🇨🇳',
												},
												{
													value: 'Japanese',
													label: t(
														'foreign_language.language.options.japanese'
													),
													flag: '🇯🇵',
												},
												{
													value: 'Korean',
													label: t('foreign_language.language.options.korean'),
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
											{t('foreign_language.certificate.label')}
										</Label>
										<CustomSelect
											key={`certificate-${index}-${lang.language}`}
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
											placeholder={t(
												'foreign_language.certificate.placeholder'
											)}
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
											{t('foreign_language.score.label')}
										</Label>
										<Input
											key={`score-${index}-${lang.language}`}
											placeholder={t('foreign_language.score.placeholder')}
											value={lang.score || ''}
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
											{t('foreign_language.add')}
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
						<div className="flex items-center gap-1">
							<Label className="text-sm font-medium text-foreground">
								{t('files.cv.label')}
							</Label>
							<Tooltip
								content={t('files.cv.tooltip')}
								maxWidth={320}
								align="left"
							>
								<Info className="h-4 w-4" />
							</Tooltip>
						</div>
						<FileUploadManagerWithOCR
							onFilesUploaded={(files) => {
								handleCategoryFilesUploaded('cvFiles', files)
								setIsAnyFileUploading(false)
							}}
							onFileSelectionStart={() => setIsAnyFileUploading(true)}
							onProcessingComplete={() => setIsAnyFileUploading(false)}
							isGloballyDisabled={isAnyFileUploading}
							category="cv-resume"
							acceptedTypes={[
								'application/pdf',
								'application/msword',
								'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
							]}
							maxSize={10}
							showPreview={true}
							enableOCR={true}
							onOCRComplete={(fileId, extractedText) => {
								handleOCRComplete(fileId, extractedText)
							}}
							onValidationComplete={handleValidationComplete}
						/>
						{formData.cvFiles && formData.cvFiles.length > 0 && (
							<div className="text-xs text-green-600">
								{t('files.uploaded', { count: formData.cvFiles.length })}
							</div>
						)}
					</div>

					{/* Foreign Language Certificate Upload */}
					<div className="space-y-3">
						<div className="flex items-center gap-1">
							<Label className="text-sm font-medium text-foreground ">
								{t('files.language_cert.label')}
							</Label>
							<Tooltip
								content={t('files.language_cert.tooltip')}
								maxWidth={5700}
								align="left"
							>
								<Info className="h-4 w-4" />
							</Tooltip>
						</div>
						<FileUploadManagerWithOCR
							onFilesUploaded={(files) => {
								handleCategoryFilesUploaded('languageCertFiles', files)
								setIsAnyFileUploading(false)
							}}
							onFileSelectionStart={() => setIsAnyFileUploading(true)}
							onProcessingComplete={() => setIsAnyFileUploading(false)}
							isGloballyDisabled={isAnyFileUploading}
							category="language-certificates"
							acceptedTypes={[
								'application/pdf',
								'image/jpeg',
								'image/png',
								'image/jpg',
							]}
							maxSize={10}
							showPreview={true}
							enableOCR={true}
							onOCRComplete={(fileId, extractedText) => {
								handleOCRComplete(fileId, extractedText)
							}}
							onValidationComplete={handleValidationComplete}
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
						<div className="flex items-center gap-1">
							<Label className="text-sm font-medium text-foreground">
								{t('files.degree.label')}
							</Label>
							<Tooltip
								content={t('files.degree.tooltip')}
								maxWidth={370}
								align="left"
							>
								<Info className="h-4 w-4" />
							</Tooltip>
						</div>
						<FileUploadManagerWithOCR
							onFilesUploaded={(files) => {
								handleCategoryFilesUploaded('degreeFiles', files)
								setIsAnyFileUploading(false)
							}}
							onFileSelectionStart={() => setIsAnyFileUploading(true)}
							onProcessingComplete={() => setIsAnyFileUploading(false)}
							isGloballyDisabled={isAnyFileUploading}
							category="degree-certificates"
							acceptedTypes={[
								'application/pdf',
								'image/jpeg',
								'image/png',
								'image/jpg',
							]}
							maxSize={10}
							showPreview={true}
							enableOCR={true}
							onOCRComplete={(fileId, extractedText) => {
								handleOCRComplete(fileId, extractedText)
							}}
							onValidationComplete={handleValidationComplete}
						/>
						{formData.degreeFiles && formData.degreeFiles.length > 0 && (
							<div className="text-xs text-green-600">
								{t('files.uploaded', { count: formData.degreeFiles.length })}
							</div>
						)}
					</div>

					{/* Transcript Upload */}
					<div className="space-y-3">
						<div className="flex items-center gap-1">
							<Label className="text-sm font-medium text-foreground">
								{t('files.transcript.label')}
							</Label>
							<Tooltip
								content={t('files.transcript.tooltip')}
								maxWidth={370}
								align="left"
							>
								<Info className="h-4 w-4" />
							</Tooltip>
						</div>
						<FileUploadManagerWithOCR
							onFilesUploaded={(files) => {
								handleCategoryFilesUploaded('transcriptFiles', files)
								setIsAnyFileUploading(false)
							}}
							onFileSelectionStart={() => setIsAnyFileUploading(true)}
							onProcessingComplete={() => setIsAnyFileUploading(false)}
							isGloballyDisabled={isAnyFileUploading}
							category="academic-transcripts"
							acceptedTypes={[
								'application/pdf',
								'image/jpeg',
								'image/png',
								'image/jpg',
							]}
							maxSize={10}
							showPreview={true}
							enableOCR={true}
							onOCRComplete={(fileId, extractedText) => {
								handleOCRComplete(fileId, extractedText)
							}}
							onValidationComplete={handleValidationComplete}
						/>
						{formData.transcriptFiles &&
							formData.transcriptFiles.length > 0 && (
								<div className="text-xs text-green-600">
									{t('files.uploaded', {
										count: formData.transcriptFiles.length,
									})}
								</div>
							)}
					</div>
				</div>
			</div>
			<div className="space-y-4">
				<div className="flex items-center gap-8">
					<h3 className="text-lg font-semibold text-foreground">
						{t('research_papers.title')}
					</h3>
				</div>

				<div className="space-y-6">
					{formData.researchPapers?.map((paper, index) => (
						<div key={index} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
							{/* Left side - Title and Discipline */}
							<div className="space-y-4">
								<div className="space-y-2">
									<Label className="text-sm font-medium text-foreground">
										{t('research_papers.paper_title.label')}
									</Label>
									<Input
										placeholder={t('research_papers.paper_title.placeholder')}
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
									<Label>{t('research_papers.disciplines.label')}</Label>
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
										placeholder={t('research_papers.disciplines.placeholder')}
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
								<div className="flex items-center gap-1">
									<Label className="text-sm font-medium text-foreground">
										{t('research_papers.files.label')}
									</Label>
									<Tooltip
										content={t('research_papers.files.tooltip')}
										maxWidth={370}
										align="left"
									>
										<Info className="h-4 w-4" />
									</Tooltip>
								</div>
								<FileUploadManagerWithOCR
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
											setIsAnyFileUploading(false)
										} catch (error) {
											setErrorMessage(t('errors.research_paper_upload_failed'))
											setShowErrorModal(true)
											setIsAnyFileUploading(false)
										}
									}}
									onFileSelectionStart={() => setIsAnyFileUploading(true)}
									onProcessingComplete={() => setIsAnyFileUploading(false)}
									isGloballyDisabled={isAnyFileUploading}
									category={`research-paper-${index}`}
									acceptedTypes={['application/pdf', 'image/jpeg', 'image/png']}
									maxSize={10}
									showPreview={true}
									enableOCR={true}
									onOCRComplete={(fileId, extractedText) => {
										handleOCRComplete(fileId, extractedText)
									}}
									onValidationComplete={handleValidationComplete}
								/>
								{paper.files && paper.files.length > 0 && (
									<div className="text-xs text-green-600">
										{t('research_papers.uploaded', {
											count: paper.files.length,
										})}
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
							<span className="underline">{t('research_papers.add')}</span>
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
							{t('manage_files', { count: getAllFiles().length })}
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
					{t('back')}
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
					{t('next')}
				</Button>
			</div>

			{/* Error Modal - Rendered via Portal to blur entire page */}
			{showErrorModal &&
				createPortal(
					<ErrorModal
						isOpen={showErrorModal}
						onClose={() => setShowErrorModal(false)}
						title={t('errors.upload_failed')}
						message={errorMessage}
						buttonText={t('errors.try_again')}
					/>,
					document.body
				)}
		</div>
	)
}
