import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { FileUploadManager } from '@/components/ui/file-upload-manager'
import { CustomSelect } from '@/components/ui/custom-select'
import { FileItem } from '@/lib/file-utils'
import { ProfileFormData } from '@/types/profile'
import { useEffect } from 'react'
import { getCountriesWithSvgFlags } from '@/data/countries'

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
	// Add default research paper when component mounts
	useEffect(() => {
		if (formData.researchPapers?.length === 0) {
			onInputChange('researchPapers', [
				{ title: '', discipline: '', files: [] },
			])
		}
	}, [])
	const handleCategoryFilesUploaded = (category: string, files: FileItem[]) => {
		// Store file metadata in form state (S3-only approach)
		onInputChange(category as keyof ProfileFormData, files as any)
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
									className="w-full"
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
									options={[
										{ value: 'Computer Science', label: 'Computer Science' },
										{
											value: 'Business Administration',
											label: 'Business Administration',
										},
										{ value: 'Engineering', label: 'Engineering' },
										{ value: 'Medicine', label: 'Medicine' },
										{ value: 'Law', label: 'Law' },
										{ value: 'Arts', label: 'Arts' },
										{ value: 'Sciences', label: 'Sciences' },
									]}
									variant="default"
									menuPortalTarget={document.body}
									isClearable={false}
									className="w-full"
								/>
							</div>
						</div>

						{/* GPA Row */}
						<div className="flex flex-col sm:flex-row sm:items-center gap-4">
							<div className="flex items-center gap-2">
								<div className="bg-[rgba(17,110,99,0.7)] text-white px-3 py-2 rounded-full text-sm font-medium">
									GPA
								</div>
								<span className="hidden sm:block text-gray-400 text-xl">|</span>
								<Input
									placeholder="Score"
									value={formData.scoreValue || ''}
									onChange={(e) => onInputChange('scoreValue', e.target.value)}
									inputSize="select"
									fullWidth={false}
									width="w-24"
								/>
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
									isClearable
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
											placeholder="Certificate"
											variant="green"
											className="w-full"
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
											width="w-full max-w-32"
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
							maxFiles={3}
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
							maxFiles={5}
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
							maxFiles={3}
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
							maxFiles={3}
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
										options={[
											{ value: 'Computer Science', label: 'Computer Science' },
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
								</div>
							</div>

							{/* Right side - File Upload */}
							<div className="space-y-3">
								<Label className="text-sm font-medium text-foreground">
									Research Paper Files
								</Label>
								<FileUploadManager
									onFilesUploaded={(files) => {
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
									}}
									category={`research-paper-${index}`}
									maxFiles={5}
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
				<div className="flex flex-col sm:flex-row gap-2">
					<Button variant="outline" size="sm" className="w-full sm:w-auto">
						Create later
					</Button>
					<Button onClick={onNext} size="sm" className="w-full sm:w-auto">
						Next
					</Button>
				</div>
			</div>
		</div>
	)
}
