'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { ProgressBar } from '@/components/profile/create/steps/ProgressBar'
import { RoleSelectionStep } from '@/components/profile/create/steps/RoleSelectionStep'
import { BasicInfoStep } from '@/components/profile/create/steps/BasicInfoStep'
import { AcademicInfoStep } from '@/components/profile/create/steps/AcademicInfoStep'
import { InstitutionInfoStep } from '@/components/profile/create/steps/InstitutionInfoStep'
import { InstitutionDetailsStep } from '@/components/profile/create/steps/InstitutionDetailsStep'
import { CompletionStep } from '@/components/profile/create/steps/CompletionStep'
import { ProfileFormData } from '@/types/profile'
import Button from '@/components/ui/Button'
import { useAuthCheck } from '@/hooks/useAuthCheck'
import { AuthRequiredModal } from '@/components/auth'

export default function CreateProfile() {
	const router = useRouter()
	const [currentStep, setCurrentStep] = useState(1)
	const [isTransitioning, setIsTransitioning] = useState(false)
	const [showManageModal, setShowManageModal] = useState(false)
	const [isClosing, setIsClosing] = useState(false)
	const [hasExistingProfile, setHasExistingProfile] = useState(false)
	const [isCheckingProfile, setIsCheckingProfile] = useState(true)

	// Use the authentication check hook
	const {
		isAuthenticated,
		showAuthModal,
		handleCloseModal: closeAuthModal,
		isLoading,
		user,
	} = useAuthCheck()

	// Check if user already has a profile
	useEffect(() => {
		const checkExistingProfile = async () => {
			console.log('Checking profile, isAuthenticated:', isAuthenticated) // Debug log
			if (!isAuthenticated) {
				console.log('Not authenticated, stopping profile check') // Debug log
				setIsCheckingProfile(false)
				return
			}

			try {
				console.log('Making API call to /api/profile') // Debug log
				const response = await fetch('/api/profile')
				console.log('Profile API response status:', response.status) // Debug log

				if (response.ok) {
					const profileData = await response.json()
					console.log('Profile data:', profileData) // Debug log
					if (profileData && profileData.profile && profileData.profile.id) {
						// User already has a profile, redirect to view profile
						console.log('User has existing profile, redirecting') // Debug log
						setHasExistingProfile(true)
						router.push('/profile/view')
						return
					}
				} else if (response.status === 404) {
					// Profile not found, user can create one
					console.log('No existing profile found, user can create one')
				} else {
					// Other error, still allow creation
					console.log('Error checking profile, allowing creation')
				}
			} catch (error) {
				console.error('Error checking existing profile:', error)
				// On error, allow creation
			} finally {
				console.log('Setting isCheckingProfile to false') // Debug log
				setIsCheckingProfile(false)
			}
		}

		checkExistingProfile()
	}, [isAuthenticated, router])

	const [formData, setFormData] = useState<ProfileFormData>({
		role: '',
		// Student fields
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
		// Institution fields
		institutionName: '',
		institutionAbbreviation: '',
		institutionHotline: '',
		institutionHotlineCode: '+1',
		institutionType: '',
		institutionWebsite: '',
		institutionEmail: '',
		institutionCountry: '',
		institutionAddress: '',
		campuses: [],
		representativeName: '',
		representativeAppellation: '',
		representativePosition: '',
		representativeEmail: '',
		representativePhone: '',
		representativePhoneCode: '+1',
		aboutInstitution: '',
		// Institution Details fields
		institutionDisciplines: [],
		institutionCoverImage: '',
		institutionVerificationDocuments: [],
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

	// Pre-fill email if user is authenticated
	useEffect(() => {
		if (isAuthenticated && user?.email && !formData.email) {
			setFormData((prev) => ({
				...prev,
				email: user.email,
			}))
		}
	}, [isAuthenticated, user, formData.email])

	const handleNext = () => {
		const maxStep = formData.role === 'applicant' ? 4 : 4
		if (currentStep < maxStep && !isTransitioning) {
			setIsTransitioning(true)
			// Auto-close modal if leaving Academic Info step (step 3)
			if (currentStep === 3 && showManageModal) {
				setShowManageModal(false)
				setIsClosing(false)
			}
			setTimeout(() => {
				setCurrentStep(currentStep + 1)
				setIsTransitioning(false)
			}, 300)
		}
	}

	const handleBack = () => {
		if (currentStep > 1 && !isTransitioning) {
			setIsTransitioning(true)
			// Auto-close modal if leaving Academic Info step (step 3)
			if (currentStep === 3 && showManageModal) {
				setShowManageModal(false)
				setIsClosing(false)
			}
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
		field: keyof ProfileFormData,
		value:
			| string
			| Array<{ language: string; certificate: string; score: string }>
			| Array<{ title: string; discipline: string; files: any[] }>
	) => {
		setFormData({ ...formData, [field]: value })
	}

	const handleInputChangeEvent =
		(field: keyof ProfileFormData) =>
		(e: React.ChangeEvent<HTMLInputElement>) => {
			handleInputChange(field, e.target.value)
		}

	const handleSelectChange =
		(field: keyof ProfileFormData) => (value: string) => {
			handleInputChange(field, value)
		}

	const handleMultiSelectChange =
		(field: keyof ProfileFormData) => (value: string[]) => {
			setFormData({ ...formData, [field]: value })
		}

	const handleFilesUploaded = (files: any[]) => {
		// Check if files are verification documents
		const verificationDocs = files.filter(
			(file) => file.category === 'verification'
		)
		if (verificationDocs.length > 0) {
			setFormData({
				...formData,
				institutionVerificationDocuments: [
					...(formData.institutionVerificationDocuments || []),
					...verificationDocs,
				],
			})
		} else {
			setFormData({ ...formData, uploadedFiles: files })
		}
	}

	const getAllFiles = () => {
		const researchPaperFiles =
			formData.researchPapers?.flatMap((paper) => paper.files || []) || []
		return [
			...(formData.cvFiles || []),
			...(formData.languageCertFiles || []),
			...(formData.degreeFiles || []),
			...(formData.transcriptFiles || []),
			...researchPaperFiles,
			...(formData.institutionVerificationDocuments || []),
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
		(field: keyof ProfileFormData) => (_checked: boolean) => {
			if (field === 'graduationStatus') {
				// This will be handled by the AcademicInfoStep component directly
				// We just need to provide the function signature
			}
		}

	const handleGetStarted = async () => {
		// Validate research papers before saving
		const incompleteResearchPapers =
			formData.researchPapers?.filter(
				(paper: any) =>
					(!paper.title ||
						paper.title.trim() === '' ||
						!paper.discipline ||
						paper.discipline.trim() === '') &&
					paper.files &&
					paper.files.length > 0
			) || []

		if (incompleteResearchPapers.length > 0) {
			alert(
				'Please provide both title and discipline for all research papers before uploading files.'
			)
			return
		}

		try {
			// Save profile to database
			const { ApiService } = await import('@/lib/axios-config')
			await ApiService.createProfile(formData)

			// Profile saved successfully
			// Redirect to home page
			window.location.href = '/'
		} catch (error: any) {
			// Error saving profile
			alert(
				error.response?.data?.error ||
					'Failed to save profile. Please try again.'
			)
		}
	}

	// Show loading state while checking profile or auth
	if (isCheckingProfile || isLoading) {
		return (
			<div className="profile-background flex items-center justify-center p-4 overflow-x-hidden">
				<Card className="w-full max-w-3xl bg-white backdrop-blur-sm">
					<CardContent className="p-8">
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
							<p className="text-muted-foreground">
								Checking profile status...
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	// Show authentication modal if user is not authenticated
	if (!isAuthenticated) {
		return (
			<div className="profile-background flex items-center justify-center p-4 overflow-x-hidden">
				<Card className="w-full max-w-3xl bg-white backdrop-blur-sm">
					<CardContent className="p-8">
						<div className="text-center mb-6">
							<h1 className="text-3xl font-bold text-primary">
								Create Profile
							</h1>
						</div>

						<ProgressBar
							currentStep={currentStep}
							totalSteps={4}
							onStepClick={(step) => {
								if (step <= currentStep || step === 1) {
									setCurrentStep(step)
								}
							}}
						/>

						<div className="min-h-[300px]">
							<div className="animate-in fade-in-0 slide-in-from-right-4 duration-500">
								<RoleSelectionStep
									formData={formData}
									onRoleSelect={handleRoleSelect}
									onNext={handleNext}
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Authentication Required Modal */}
				<AuthRequiredModal isOpen={showAuthModal} onClose={closeAuthModal} />
			</div>
		)
	}

	// Don't render the form if user already has a profile
	if (hasExistingProfile) {
		return null
	}

	return (
		<div className="profile-background flex items-center justify-center p-4 overflow-x-hidden">
			<Card className="w-full max-w-3xl bg-white backdrop-blur-sm">
				<CardContent className="p-8">
					<div className="text-center mb-6">
						<h1 className="text-3xl font-bold text-primary">Create Profile</h1>
					</div>

					<ProgressBar
						currentStep={currentStep}
						totalSteps={formData.role === 'applicant' ? 4 : 4}
						onStepClick={(step) => {
							if (step <= currentStep || step === 1) {
								// Auto-close modal if leaving Academic Info step (step 3)
								if (currentStep === 3 && showManageModal && step !== 3) {
									setShowManageModal(false)
									setIsClosing(false)
								}
								setCurrentStep(step)
							}
						}}
					/>

					<div
						className={`relative ${(currentStep === 4 && formData.role === 'applicant') || (currentStep === 3 && formData.role === 'institution') ? 'min-h-0' : 'min-h-[200px]'}`}
					>
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
									{formData.role === 'applicant' ? (
										<BasicInfoStep
											formData={formData}
											onInputChange={handleInputChange}
											onInputChangeEvent={handleInputChangeEvent}
											onSelectChange={handleSelectChange}
											onMultiSelectChange={handleMultiSelectChange}
											onBack={handleBack}
											onNext={handleNext}
											user={user}
										/>
									) : (
										<InstitutionInfoStep
											formData={formData}
											onInputChange={handleInputChange}
											onInputChangeEvent={handleInputChangeEvent}
											onSelectChange={handleSelectChange}
											onBack={handleBack}
											onNext={handleNext}
											onShowManageModal={handleOpenModal}
											user={user}
										/>
									)}
								</div>
							)}
							{currentStep === 3 && formData.role === 'applicant' && (
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
							{currentStep === 3 && formData.role === 'institution' && (
								<div className="animate-in fade-in-0 slide-in-from-right-4 duration-500">
									<InstitutionDetailsStep
										formData={formData}
										onInputChange={handleInputChange}
										onMultiSelectChange={handleMultiSelectChange}
										onFilesUploaded={handleFilesUploaded}
										onBack={handleBack}
										onNext={handleNext}
										onShowManageModal={handleOpenModal}
									/>
								</div>
							)}
							{currentStep === 4 && formData.role === 'applicant' && (
								<div className="animate-in fade-in-0 slide-in-from-right-4 duration-500">
									<CompletionStep onGetStarted={handleGetStarted} />
								</div>
							)}
							{currentStep === 4 && formData.role === 'institution' && (
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
												<div className="flex gap-2">
													<Button
														variant="outline"
														onClick={() => window.open(file.url, '_blank')}
													>
														View
													</Button>
													<Button
														variant="outline"
														onClick={() => {
															const updatedFiles = formData.cvFiles.filter(
																(f) => f.id !== file.id
															)
															setFormData({
																...formData,
																cvFiles: updatedFiles,
															})
														}}
														className="text-red-500 hover:text-red-700"
													>
														Delete
													</Button>
												</div>
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
													<div className="flex gap-2">
														<Button
															variant="outline"
															onClick={() => window.open(file.url, '_blank')}
														>
															View
														</Button>
														<Button
															variant="outline"
															onClick={() => {
																const updatedFiles =
																	formData.languageCertFiles.filter(
																		(f) => f.id !== file.id
																	)
																setFormData({
																	...formData,
																	languageCertFiles: updatedFiles,
																})
															}}
															className="text-red-500 hover:text-red-700"
														>
															Delete
														</Button>
													</div>
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
												<div className="flex gap-2">
													<Button
														variant="outline"
														onClick={() => window.open(file.url, '_blank')}
													>
														View
													</Button>
													<Button
														variant="outline"
														onClick={() => {
															const updatedFiles = formData.degreeFiles.filter(
																(f) => f.id !== file.id
															)
															setFormData({
																...formData,
																degreeFiles: updatedFiles,
															})
														}}
														className="text-red-500 hover:text-red-700"
													>
														Delete
													</Button>
												</div>
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
													<div className="flex gap-2">
														<Button
															variant="outline"
															onClick={() => window.open(file.url, '_blank')}
														>
															View
														</Button>
														<Button
															variant="outline"
															onClick={() => {
																const updatedFiles =
																	formData.transcriptFiles.filter(
																		(f) => f.id !== file.id
																	)
																setFormData({
																	...formData,
																	transcriptFiles: updatedFiles,
																})
															}}
															className="text-red-500 hover:text-red-700"
														>
															Delete
														</Button>
													</div>
												</div>
											))}
										</div>
									</div>
								)}

							{/* Research Papers Section */}
							{formData.researchPapers &&
								formData.researchPapers.some(
									(paper) => paper.files && paper.files.length > 0
								) && (
									<div className="space-y-4">
										<h3 className="text-lg font-medium text-foreground border-b pb-2">
											Research Papers (
											{formData.researchPapers.reduce(
												(total, paper) => total + (paper.files?.length || 0),
												0
											)}
											)
										</h3>
										<div className="space-y-6">
											{formData.researchPapers.map(
												(paper, paperIndex) =>
													paper.files &&
													paper.files.length > 0 && (
														<div key={paperIndex} className="space-y-3">
															<div className="bg-blue-50 p-3 rounded-lg">
																<h4 className="font-medium text-blue-900">
																	{paper.title ||
																		`Research Paper ${paperIndex + 1}`}
																</h4>
																{paper.discipline && (
																	<p className="text-sm text-blue-700">
																		Discipline: {paper.discipline}
																	</p>
																)}
															</div>
															<div className="grid grid-cols-1 gap-3">
																{paper.files.map((file) => (
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
																		<div className="flex gap-2">
																			<Button
																				variant="outline"
																				onClick={() =>
																					window.open(file.url, '_blank')
																				}
																			>
																				View
																			</Button>
																			<Button
																				variant="outline"
																				onClick={() => {
																					const updatedPapers = [
																						...formData.researchPapers,
																					]
																					updatedPapers[paperIndex] = {
																						...updatedPapers[paperIndex],
																						files: updatedPapers[
																							paperIndex
																						].files.filter(
																							(f) => f.id !== file.id
																						),
																					}
																					setFormData({
																						...formData,
																						researchPapers: updatedPapers,
																					})
																				}}
																				className="text-red-500 hover:text-red-700"
																			>
																				Delete
																			</Button>
																		</div>
																	</div>
																))}
															</div>
														</div>
													)
											)}
										</div>
									</div>
								)}

							{/* Institution Verification Documents Section */}
							{formData.institutionVerificationDocuments &&
								formData.institutionVerificationDocuments.length > 0 && (
									<div className="space-y-4">
										<h3 className="text-lg font-medium text-foreground border-b pb-2">
											Institution Verification Documents (
											{formData.institutionVerificationDocuments.length})
										</h3>
										<div className="grid grid-cols-1 gap-4">
											{formData.institutionVerificationDocuments.map((file) => (
												<div
													key={file.id}
													className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
												>
													<div className="text-2xl">
														{file.type?.startsWith('image/') ? '🖼️' : '📄'}
													</div>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-medium text-foreground truncate">
															{file.name || file.originalName}
														</p>
														<p className="text-xs text-muted-foreground">
															{(file.size / 1024).toFixed(1)} KB
														</p>
													</div>
													<div className="flex gap-2">
														<Button
															variant="outline"
															onClick={() => window.open(file.url, '_blank')}
														>
															View
														</Button>
														<Button
															variant="outline"
															onClick={() => {
																const updatedFiles =
																	formData.institutionVerificationDocuments.filter(
																		(f) => f.id !== file.id
																	)
																setFormData({
																	...formData,
																	institutionVerificationDocuments:
																		updatedFiles,
																})
															}}
															className="text-red-500 hover:text-red-700"
														>
															Delete
														</Button>
													</div>
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
