'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ProgressBar } from '@/components/profile/ProgressBar'
import { RoleSelectionStep } from '@/components/profile/RoleSelectionStep'
import { BasicInfoStep } from '@/components/profile/BasicInfoStep'
import { AcademicInfoStep } from '@/components/profile/AcademicInfoStep'
import { CompletionStep } from '@/components/profile/CompletionStep'
import { FormData } from '@/types/profile'
import Button from '@/components/ui/Button'

export default function CreateProfile() {
	const [currentStep, setCurrentStep] = useState(1)
	const [isTransitioning, setIsTransitioning] = useState(false)
	const [showManageModal, setShowManageModal] = useState(false)
	const [isClosing, setIsClosing] = useState(false)
	const [formData, setFormData] = useState<FormData>({
		role: '',
		firstName: '',
		lastName: '',
		gender: '',
		birthday: '',
		email: '',
		nationality: '',
		phoneNumber: '',
		countryCode: '+84',
		interests: [],
		favoriteCountries: [],
		profilePhoto: '',
		// Academic fields
		graduationStatus: '',
		degree: '',
		fieldOfStudy: '',
		university: '',
		graduationYear: '',
		gpa: '',
		countryOfStudy: '',
		scoreType: '',
		scoreValue: '',
		// Foreign Language fields
		hasForeignLanguage: '',
		languages: [],
		researchPapers: [],
		// File upload fields
		cvFile: '',
		certificateFile: '',
		uploadedFiles: [],
		cvFiles: [],
		languageCertFiles: [],
		degreeFiles: [],
		transcriptFiles: [],
	})

	const handleNext = () => {
		if (currentStep < 4 && !isTransitioning) {
			setIsTransitioning(true)
			setTimeout(() => {
				setCurrentStep(currentStep + 1)
				setIsTransitioning(false)
			}, 300)
		}
	}

	const handleBack = () => {
		if (currentStep > 1 && !isTransitioning) {
			setIsTransitioning(true)
			setTimeout(() => {
				setCurrentStep(currentStep - 1)
				setIsTransitioning(false)
			}, 300)
		}
	}

	const handleRoleSelect = (role: 'applicant' | 'institution') => {
		setFormData({ ...formData, role })
	}

	const handleInputChange = (
		field: keyof FormData,
		value:
			| string
			| Array<{ language: string; certificate: string; score: string }>
			| Array<{ title: string; discipline: string; files: any[] }>
	) => {
		setFormData({ ...formData, [field]: value })
	}

	const handleInputChangeEvent =
		(field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
			handleInputChange(field, e.target.value)
		}

	const handleSelectChange = (field: keyof FormData) => (value: string) => {
		handleInputChange(field, value)
	}

	const handleMultiSelectChange =
		(field: 'interests' | 'favoriteCountries') => (value: string[]) => {
			setFormData({ ...formData, [field]: value })
		}

	const handleFilesUploaded = (files: any[]) => {
		setFormData({ ...formData, uploadedFiles: files })
	}

	const getAllFiles = () => {
		return [
			...(formData.cvFiles || []),
			...(formData.languageCertFiles || []),
			...(formData.degreeFiles || []),
			...(formData.transcriptFiles || []),
		]
	}

	const handleCloseModal = () => {
		setIsClosing(true)
		setTimeout(() => {
			setShowManageModal(false)
			setIsClosing(false)
		}, 300) // Match the animation duration
	}

	const handleOpenModal = () => {
		setShowManageModal(true)
		setIsClosing(false)
	}

	const handleCheckboxChange =
		(field: keyof FormData) => (checked: boolean) => {
			if (field === 'graduationStatus') {
				// This will be handled by the AcademicInfoStep component directly
				// We just need to provide the function signature
			}
		}

	const handleGetStarted = () => {
		window.location.href = '/'
	}

	return (
		<div className="profile-background flex items-center justify-center p-4 overflow-x-hidden">
			<Card className="w-full max-w-3xl bg-white backdrop-blur-sm">
				<CardContent className="p-8">
					<div className="text-center mb-6">
						<h1 className="text-3xl font-bold text-primary">Create Profile</h1>
					</div>

					<ProgressBar currentStep={currentStep} totalSteps={4} />

					<div className={`relative ${currentStep === 4 ? 'min-h-0' : 'min-h-[300px]'}`}>
						<div
							className={`transition-all duration-500 ease-in-out ${
								isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
							}`}
						>
							{currentStep === 1 && (
								<div className="animate-in fade-in-0 slide-in-from-right-4 duration-500">
									<RoleSelectionStep
										formData={formData}
										onRoleSelect={handleRoleSelect}
										onNext={handleNext}
									/>
								</div>
							)}
							{currentStep === 2 && (
								<div className="animate-in fade-in-0 slide-in-from-right-4 duration-500">
									<BasicInfoStep
										formData={formData}
										onInputChange={handleInputChange}
										onInputChangeEvent={handleInputChangeEvent}
										onSelectChange={handleSelectChange}
										onMultiSelectChange={handleMultiSelectChange}
										onBack={handleBack}
										onNext={handleNext}
									/>
								</div>
							)}
							{currentStep === 3 && (
								<div className="animate-in fade-in-0 slide-in-from-right-4 duration-500">
									<AcademicInfoStep
										formData={formData}
										onInputChange={handleInputChange}
										onInputChangeEvent={handleInputChangeEvent}
										onSelectChange={handleSelectChange}
										onCheckboxChange={handleCheckboxChange}
										onFilesUploaded={handleFilesUploaded}
										onBack={handleBack}
										onNext={handleNext}
										onShowManageModal={handleOpenModal}
									/>
								</div>
							)}
							{currentStep === 4 && (
								<div className="animate-in fade-in-0 slide-in-from-right-4 duration-500">
									<CompletionStep onGetStarted={handleGetStarted} />
								</div>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Manage Files Side Panel */}
			{showManageModal && (
				<div
					className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l z-50 transition-transform duration-300 ease-out ${
						isClosing ? 'translate-x-full' : 'translate-x-0'
					}`}
					style={{
						animation:
							showManageModal && !isClosing
								? 'slideInFromRight 0.3s ease-out'
								: 'none',
					}}
				>
					<div className="p-6 border-b">
						<div className="flex items-center justify-between">
							<h2 className="text-xl font-semibold">Manage Documents</h2>
							<Button
								variant="outline"
								onClick={handleCloseModal}
								className="rounded-full"
							>
								✕
							</Button>
						</div>
					</div>

					<div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
						<div className="space-y-8">
							{/* CV/Resume Section */}
							{formData.cvFiles && formData.cvFiles.length > 0 && (
								<div className="space-y-4">
									<h3 className="text-lg font-medium text-foreground border-b pb-2">
										CV / Resume ({formData.cvFiles.length})
									</h3>
									<div className="grid grid-cols-1 gap-4">
										{formData.cvFiles.map((file) => (
											<div
												key={file.id}
												className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
											>
												<div className="text-2xl">📄</div>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium text-foreground truncate">
														{file.name || file.originalName}
													</p>
													<p className="text-xs text-muted-foreground">
														{(file.size / 1024).toFixed(1)} KB
													</p>
												</div>
												<Button
													variant="outline"
													onClick={() => window.open(file.url, '_blank')}
												>
													View
												</Button>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Foreign Language Certificate Section */}
							{formData.languageCertFiles &&
								formData.languageCertFiles.length > 0 && (
									<div className="space-y-4">
										<h3 className="text-lg font-medium text-foreground border-b pb-2">
											Foreign Language Certificates (
											{formData.languageCertFiles.length})
										</h3>
										<div className="grid grid-cols-1 gap-4">
											{formData.languageCertFiles.map((file) => (
												<div
													key={file.id}
													className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
												>
													<div className="text-2xl">
														{file.category === 'image' ? '🖼️' : '📄'}
													</div>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-medium text-foreground truncate">
															{file.name || file.originalName}
														</p>
														<p className="text-xs text-muted-foreground">
															{(file.size / 1024).toFixed(1)} KB
														</p>
													</div>
													<Button
														variant="outline"
														onClick={() => window.open(file.url, '_blank')}
													>
														View
													</Button>
												</div>
											))}
										</div>
									</div>
								)}

							{/* Degree Certificate Section */}
							{formData.degreeFiles && formData.degreeFiles.length > 0 && (
								<div className="space-y-4">
									<h3 className="text-lg font-medium text-foreground border-b pb-2">
										Degree Certificates ({formData.degreeFiles.length})
									</h3>
									<div className="grid grid-cols-1 gap-4">
										{formData.degreeFiles.map((file) => (
											<div
												key={file.id}
												className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
											>
												<div className="text-2xl">
													{file.category === 'image' ? '🖼️' : '📄'}
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium text-foreground truncate">
														{file.name || file.originalName}
													</p>
													<p className="text-xs text-muted-foreground">
														{(file.size / 1024).toFixed(1)} KB
													</p>
												</div>
												<Button
													variant="outline"
													onClick={() => window.open(file.url, '_blank')}
												>
													View
												</Button>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Academic Transcript Section */}
							{formData.transcriptFiles &&
								formData.transcriptFiles.length > 0 && (
									<div className="space-y-4">
										<h3 className="text-lg font-medium text-foreground border-b pb-2">
											Academic Transcripts ({formData.transcriptFiles.length})
										</h3>
										<div className="grid grid-cols-1 gap-4">
											{formData.transcriptFiles.map((file) => (
												<div
													key={file.id}
													className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
												>
													<div className="text-2xl">
														{file.category === 'image' ? '🖼️' : '📄'}
													</div>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-medium text-foreground truncate">
															{file.name || file.originalName}
														</p>
														<p className="text-xs text-muted-foreground">
															{(file.size / 1024).toFixed(1)} KB
														</p>
													</div>
													<Button
														variant="outline"
														onClick={() => window.open(file.url, '_blank')}
													>
														View
													</Button>
												</div>
											))}
										</div>
									</div>
								)}

							{/* Empty State */}
							{getAllFiles().length === 0 && (
								<div className="text-center py-8">
									<div className="text-4xl mb-4">📁</div>
									<p className="text-muted-foreground">
										No documents uploaded yet
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
