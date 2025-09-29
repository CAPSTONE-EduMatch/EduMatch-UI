import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { FileUploadManager } from '@/components/ui/file-upload-manager'
import { ImageManager } from '@/components/ui/image-manager'
import { CustomSelect } from '@/components/ui/custom-select'
import { getCountriesWithSvgFlags } from '@/data/countries'
import { FileItem } from '@/lib/file-utils'
import { ProfileFormData } from '@/types/profile'
import { useState, useEffect } from 'react'

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

// Custom styles for AcademicInfoStep - matches BasicInfoStep sizing
const academicCustomStyles = {
	control: (provided: any) => ({
		...provided,
		minHeight: '40px',
		height: '40px',
		border: '1px solid #e5e7eb',
		borderRadius: '20px',
		backgroundColor: '#F5F7FB',
		fontSize: '14px',
		padding: '0 16px',
		display: 'flex',
		alignItems: 'center',
		'&:hover': {
			border: '1px solid #e5e7eb',
		},
		'&:focus-within': {
			border: '1px solid transparent',
			boxShadow: '0 0 0 2px #126E64',
		},
	}),
	placeholder: (provided: any) => ({
		...provided,
		color: '#9ca3af',
		fontWeight: 'normal',
		fontSize: '14px',
	}),
	singleValue: (provided: any) => ({
		...provided,
		color: '#374151',
		fontWeight: 'normal',
		fontSize: '14px',
	}),
	menu: (provided: any) => ({
		...provided,
		fontSize: '14px',
		position: 'fixed',
		top: '50%',
		left: '50%',
		transform: 'translate(-50%, -50%)',
		width: '400px',
		maxHeight: '400px',
		zIndex: 9999,
		boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
		border: '1px solid #e5e7eb',
		borderRadius: '12px',
		backgroundColor: 'white',
	}),
	menuList: (provided: any) => ({
		...provided,
		fontSize: '14px',
		maxHeight: '350px',
		overflowY: 'auto',
	}),
	menuPortal: (provided: any) => ({
		...provided,
		zIndex: 9999,
	}),
	option: (provided: any) => ({
		...provided,
		fontSize: '14px',
		padding: '8px 12px',
	}),
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
					<div className="flex items-center gap-8">
						<h3 className="text-lg font-semibold text-foreground">Graduated</h3>

						{/* Graduation Status Radio Buttons */}
						<div className="flex items-center gap-6">
							<div className="flex items-center space-x-2">
								<input
									type="radio"
									id="not-yet"
									name="graduationStatus"
									checked={formData.graduationStatus === 'not-yet'}
									onChange={() => onInputChange('graduationStatus', 'not-yet')}
									className="w-4 h-4 text-green-600 border-2 border-green-600 focus:ring-green-600 focus:ring-2"
									style={{
										accentColor: '#16a34a',
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
									className="w-4 h-4 text-green-600 border-2 border-green-600 focus:ring-green-600 focus:ring-2"
									style={{
										accentColor: '#16a34a',
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
					{formData.graduationStatus === 'graduated' && (
						<div className="space-y-4">
							<div className="flex items-end gap-4">
								<div>
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
										styles={{
											...academicCustomStyles,
											control: (provided: any) => ({
												...academicCustomStyles.control(provided),
												backgroundColor: 'rgba(17, 110, 99, 0.7)', // custom green with 70% opacity
												borderColor: 'rgba(17, 110, 99, 0.7)',
												color: 'white',
												width: '180px',
											}),
											singleValue: (provided: any) => ({
												...provided,
												color: '#ffffff',
												fontWeight: '500',
											}),
											placeholder: (provided: any) => ({
												...provided,
												color: '#ffffff',
												fontWeight: '400',
											}),
										}}
										menuPortalTarget={document.body}
										isClearable={false}
									/>
								</div>
								<span className="text-gray-400 text-xl pb-2">|</span>
								<div>
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
										styles={{
											...academicCustomStyles,
											control: (provided: any) => ({
												...academicCustomStyles.control(provided),
												borderColor: '#e5e7eb',
												color: '#374151',
												width: '250px',
											}),
										}}
										menuPortalTarget={document.body}
										isClearable={false}
									/>
								</div>
								<div className="flex items-center gap-2">
									<div className="bg-[rgba(17,110,99,0.7)] text-white px-3 py-2 rounded-full text-sm font-medium">
										GPA
									</div>
									<span className="text-gray-400 text-xl pb-1">|</span>
									<Input
										placeholder="Score"
										value={formData.scoreValue || ''}
										onChange={(e) =>
											onInputChange('scoreValue', e.target.value)
										}
										inputSize="select"
										fullWidth={false}
										width="w-24"
									/>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Foreign Language Section */}
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
									checked={formData.hasForeignLanguage === 'yes'}
									onChange={() => onInputChange('hasForeignLanguage', 'yes')}
									className="w-4 h-4 text-green-600 border-2 border-green-600 focus:ring-green-600 focus:ring-2"
									style={{
										accentColor: '#16a34a',
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
									className="w-4 h-4 text-green-600 border-2 border-green-600 focus:ring-green-600 focus:ring-2"
									style={{
										accentColor: '#16a34a',
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
												lang.language
													? { value: lang.language, label: lang.language }
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
												{ value: 'Vietnamese', label: 'Vietnamese' },
												{ value: 'English', label: 'English' },
												{ value: 'Spanish', label: 'Spanish' },
												{ value: 'French', label: 'French' },
												{ value: 'German', label: 'German' },
												{ value: 'Chinese', label: 'Chinese' },
												{ value: 'Japanese', label: 'Japanese' },
												{ value: 'Korean', label: 'Korean' },
											]}
											menuPortalTarget={document.body}
											className="w-full"
										/>
									</div>
									<div className="space-y-2 md:col-span-2">
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
											styles={{
												...academicCustomStyles,
												control: (provided: any) => ({
													...academicCustomStyles.control(provided),
													backgroundColor: 'rgba(17, 110, 99, 0.7)', // custom green with 70% opacity
													borderColor: 'rgba(17, 110, 99, 0.7)',
													color: 'white',
												}),
												singleValue: (provided: any) => ({
													...provided,
													color: '#ffffff',
													fontWeight: '500',
												}),
												placeholder: (provided: any) => ({
													...provided,
													color: '#ffffff',
													fontWeight: '400',
												}),
											}}
											menuPortalTarget={document.body}
										/>
									</div>
									<div className="space-y-2 md:col-span-1">
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
											width="w-32"
										/>
									</div>
									{/* Delete Button */}
									<div className="space-y-2 md:col-span-1 flex items-end justify-center">
										<button
											type="button"
											onClick={() => {
												const newLanguages = formData.languages.filter(
													(_, i) => i !== index
												)
												onInputChange('languages', newLanguages)
											}}
											className="text-red-500 hover:text-red-700 transition-colors p-1"
											title="Delete language certification"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-5 w-5"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
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
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
						<div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
									<Label className="text-sm font-medium text-foreground">
										Disciplines
									</Label>
									<div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto">
										<div className="grid grid-cols-1 gap-2">
											{[
												'Computer Science',
												'Business Administration',
												'Engineering',
												'Medicine',
												'Law',
												'Arts',
												'Sciences',
												'Mathematics',
												'Physics',
												'Chemistry',
												'Biology',
												'Psychology',
												'Sociology',
												'Economics',
												'Political Science',
											].map((discipline) => {
												const selectedDisciplines = paper.discipline
													? paper.discipline
															.split(',')
															.map((d: string) => d.trim())
													: []
												const isSelected =
													selectedDisciplines.includes(discipline)

												return (
													<label
														key={discipline}
														className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
													>
														<input
															type="checkbox"
															checked={isSelected}
															onChange={() => {
																const newPapers = [
																	...(formData.researchPapers || []),
																]
																const currentDisciplines = paper.discipline
																	? paper.discipline
																			.split(',')
																			.map((d: string) => d.trim())
																	: []

																let updatedDisciplines
																if (isSelected) {
																	// Remove discipline
																	updatedDisciplines =
																		currentDisciplines.filter(
																			(d) => d !== discipline
																		)
																} else {
																	// Add discipline
																	updatedDisciplines = [
																		...currentDisciplines,
																		discipline,
																	]
																}

																newPapers[index] = {
																	...newPapers[index],
																	discipline: updatedDisciplines.join(', '),
																}
																onInputChange('researchPapers', newPapers)
															}}
															className="w-4 h-4 text-primary border-2 border-gray-300 rounded focus:ring-primary focus:ring-2"
														/>
														<span className="text-sm text-gray-700">
															{discipline}
														</span>
													</label>
												)
											})}
										</div>
									</div>
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
			<div className="flex justify-between">
				<Button variant="outline" onClick={onBack} size="sm">
					Back
				</Button>
				<div className="flex gap-2">
					<Button variant="outline" size="sm">
						Create later
					</Button>
					<Button onClick={onNext} size="sm">
						Next
					</Button>
				</div>
			</div>
		</div>
	)
}
