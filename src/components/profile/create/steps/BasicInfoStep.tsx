import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'
import { Avatar, AvatarFallback } from '@/components/ui'
import { ProtectedAvatarImage } from '@/components/ui/ProtectedAvatarImage'
import { PhoneInput } from '@/components/ui'
import { CustomSelect } from '@/components/ui'
import { DateInput } from '@/components/ui'
import { ErrorModal } from '@/components/ui'
import { Tooltip } from '@/components/ui'
import { Upload, User, Info } from 'lucide-react'
import { Country, getCountriesWithSvgFlags } from '@/data/countries'
import { ProfileFormData } from '@/services/profile/profile-service'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { usePresignedUpload } from '@/hooks/files/usePresignedUpload'

interface BasicInfoStepProps {
	formData: ProfileFormData
	onInputChange: (field: keyof ProfileFormData, value: string) => void
	onInputChangeEvent: (
		field: keyof ProfileFormData
	) => (e: React.ChangeEvent<HTMLInputElement>) => void
	onSelectChange: (field: keyof ProfileFormData) => (value: string) => void
	onMultiSelectChange: (
		field: 'interests' | 'favoriteCountries'
	) => (value: string[]) => void
	onBack: () => void
	onNext: () => void
	user?: any
}

export function BasicInfoStep({
	formData,
	onInputChange,
	onInputChangeEvent,
	onSelectChange,
	onMultiSelectChange,
	onBack,
	onNext,
	user,
}: BasicInfoStepProps) {
	const [subdisciplines, setSubdisciplines] = useState<
		Array<{ value: string; label: string; discipline: string }>
	>([])

	// Load subdisciplines from database
	useEffect(() => {
		const loadSubdisciplines = async () => {
			try {
				const { ApiService } = await import('@/services/api/axios-config')
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
	const [showErrorModal, setShowErrorModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const [phoneValidationError, setPhoneValidationError] = useState('')
	const [validationErrors, setValidationErrors] = useState<
		Record<string, boolean>
	>({})
	const fileInputRef = useRef<HTMLInputElement>(null)
	const hasAutoFilledNames = useRef(false)
	const { uploadFile, isUploading } = usePresignedUpload()

	// Pre-fill email with user's email (for all authenticated users)
	useEffect(() => {
		if (user?.email && !formData.email) {
			onInputChange('email', user.email)
		}
	}, [user?.email, formData.email, onInputChange])

	// Auto-fill Google login data when component mounts (only for Google OAuth users)
	useEffect(() => {
		if (user && user.image) {
			// Auto-fill name from Google account
			if (user.name) {
				const nameParts = user.name.trim().split(' ')
				// Auto-fill first name if empty
				if (nameParts.length > 0 && !formData.firstName) {
					onInputChange('firstName', nameParts[0])
				}
				// Auto-fill last name if empty
				if (nameParts.length > 1 && !formData.lastName) {
					const lastName = nameParts.slice(1).join(' ').trim()
					onInputChange('lastName', lastName)
				}
			}

			// Auto-fill profile photo from Google account
			if (!formData.profilePhoto) {
				// Clean up Google image URL to get a better size
				let imageUrl = user.image
				if (imageUrl.includes('=s96-c')) {
					imageUrl = imageUrl.replace('=s96-c', '=s400-c')
				} else if (imageUrl.includes('=s')) {
					imageUrl = imageUrl.replace(/=s\d+-c/, '=s400-c')
				}
				onInputChange('profilePhoto', imageUrl)
			}
		}
	}, [user, onInputChange])

	const handleFileSelect = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0]
		if (!file) return

		// Validate file type
		if (!file.type.startsWith('image/')) {
			setErrorMessage('Please select an image file')
			setShowErrorModal(true)
			return
		}

		try {
			await uploadFile(file, {
				onSuccess: (url) => {
					onInputChange('profilePhoto', url)
				},
				onError: (error) => {
					setErrorMessage(error)
					setShowErrorModal(true)
				},
				maxSize: 10 * 1024 * 1024, // 10MB
			})
		} catch (error) {
			// Error is already handled by onError callback
		} finally {
			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}
		}
	}

	const handleUploadClick = () => {
		fileInputRef.current?.click()
	}

	// Function to validate phone number
	const validatePhoneNumber = () => {
		if (!formData.phoneNumber) {
			setPhoneValidationError('')
			return true // Phone is optional, so empty is valid
		}

		// Check if phone number has at least 7 digits (minimum valid phone number)
		if (formData.phoneNumber.length < 7) {
			setPhoneValidationError('Phone number must be at least 7 digits')
			return false
		}

		// Check if phone number has more than 15 digits (maximum valid phone number)
		if (formData.phoneNumber.length > 15) {
			setPhoneValidationError('Phone number cannot exceed 15 digits')
			return false
		}

		setPhoneValidationError('')
		return true
	}

	// Function to validate required fields
	const validateRequiredFields = () => {
		const errors: Record<string, boolean> = {}

		// Email validation regex
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

		// Required fields validation
		if (!formData.firstName?.trim()) errors.firstName = true
		if (!formData.lastName?.trim()) errors.lastName = true
		if (!formData.email?.trim()) {
			errors.email = true
		} else if (!emailRegex.test(formData.email)) {
			errors.email = true
		}
		if (!formData.gender) errors.gender = true
		if (!formData.nationality) errors.nationality = true

		setValidationErrors(errors)
		return Object.keys(errors).length === 0
	}

	// Function to handle form validation and submission
	const handleNext = () => {
		// Validate phone number
		const isPhoneValid = validatePhoneNumber()

		// Validate required fields
		const areRequiredFieldsValid = validateRequiredFields()

		if (areRequiredFieldsValid && isPhoneValid) {
			onNext()
		}
		// Just validate and show red highlighting, no popup
	}

	// Function to handle name input (only letters and spaces, no numbers)
	const handleNameInput =
		(field: 'firstName' | 'lastName') =>
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value
			// Remove any non-letter characters except spaces (no numbers, symbols)
			const lettersAndSpaces = value.replace(/[^a-zA-Z\s]/g, '')
			onInputChange(field, lettersAndSpaces)
			// Clear validation error when user starts typing
			if (validationErrors[field]) {
				setValidationErrors((prev) => {
					const newErrors = { ...prev }
					delete newErrors[field]
					return newErrors
				})
			}
		}

	// Function to handle phone number input (only numbers)
	const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
		// Remove any non-numeric characters
		const numbersOnly = value.replace(/[^0-9]/g, '')
		onInputChange('phoneNumber', numbersOnly)
		setPhoneValidationError('')
	}

	return (
		<div className="space-y-6">
			<div className="">
				<h2 className="text-2xl font-bold text-primary mb-2">
					Basic information
				</h2>
				<p className="text-muted-foreground">
					Please provide your basic personal information to create your profile.
				</p>
			</div>

			<div className="space-y-6">
				{/* Profile Photo Upload */}
				<div className="flex items-center gap-4">
					<div className="relative">
						<Avatar className="w-20 h-20">
							<ProtectedAvatarImage
								src={formData.profilePhoto}
								alt="Profile photo"
								expiresIn={7200}
								autoRefresh={true}
							/>
							<AvatarFallback className="bg-gray-200 text-gray-600">
								<User className="w-8 h-8" />
							</AvatarFallback>
						</Avatar>
						<div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
							<Upload className="w-3 h-3 text-primary-foreground" />
						</div>
					</div>
					<div className="flex flex-col space-y-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleUploadClick}
							disabled={isUploading}
						>
							{isUploading ? 'Uploading...' : 'Upload your photo'}
						</Button>
						<p className="text-xs text-muted-foreground">
							Must be PNG, JPG, or WebP file (max 10MB)
						</p>
					</div>
					{/* Hidden file input */}
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						onChange={handleFileSelect}
						className="hidden"
					/>
				</div>

				{/* Form Fields */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="space-y-2">
						<Label htmlFor="firstName">
							First Name <span className="text-red-500">*</span>
						</Label>
						<Input
							id="firstName"
							placeholder="Enter your first name"
							value={formData.firstName}
							onChange={handleNameInput('firstName')}
							inputSize="select"
							className={
								validationErrors.firstName
									? 'border-red-500 focus:border-red-500'
									: ''
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="lastName">
							Last Name <span className="text-red-500">*</span>
						</Label>
						<Input
							id="lastName"
							placeholder="Enter your last name"
							value={formData.lastName}
							onChange={handleNameInput('lastName')}
							inputSize="select"
							className={
								validationErrors.lastName
									? 'border-red-500 focus:border-red-500'
									: ''
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="gender">
							Gender <span className="text-red-500">*</span>
						</Label>
						<CustomSelect
							value={
								formData.gender
									? {
											value: formData.gender,
											label:
												formData.gender.charAt(0).toUpperCase() +
												formData.gender.slice(1),
										}
									: null
							}
							onChange={(option) => {
								onSelectChange('gender')(option?.value || '')
								// Clear validation error when user selects
								if (validationErrors.gender) {
									setValidationErrors((prev) => {
										const newErrors = { ...prev }
										delete newErrors.gender
										return newErrors
									})
								}
							}}
							placeholder="Choose gender"
							options={[
								{ value: 'male', label: 'Male' },
								{ value: 'female', label: 'Female' },
							]}
							isClearable={false}
							className="w-full"
							styles={
								validationErrors.gender
									? {
											control: (provided: any, state: any) => ({
												...provided,
												border: '1px solid #ef4444',
												backgroundColor: '#F5F7FB',
												color: '#374151',
												minHeight: '40px',
												height: state.isMulti ? 'auto' : '40px',
												borderRadius: '20px',
												fontSize: '14px',
												padding: state.isMulti ? '8px 16px' : '0 16px',
												display: 'flex',
												alignItems:
													state.isMulti &&
													Array.isArray(state.getValue()) &&
													state.getValue().length > 0
														? 'flex-start'
														: 'center',
												flexWrap: 'wrap',
												'&:hover': {
													border: '1px solid #ef4444',
												},
												'&:focus-within': {
													border: '1px solid #ef4444',
													boxShadow: '0 0 0 1px #ef4444',
												},
											}),
											menu: (provided: any) => ({
												...provided,
												fontSize: '14px',
											}),
											option: (provided: any) => ({
												...provided,
												fontSize: '14px',
												padding: '8px 16px',
											}),
										}
									: undefined
							}
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<DateInput
							id="birthday"
							value={formData.birthday}
							onChange={(value) => onInputChange('birthday', value)}
							label="Birthday"
							placeholder="dd/mm/yyyy"
						/>
					</div>
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Label htmlFor="email">
								Email <span className="text-red-500">*</span>
							</Label>
							{user?.email && formData.email === user.email && (
								<Tooltip content="Email is pre-filled from your account and cannot be changed">
									<Info className="w-3 h-3" />
								</Tooltip>
							)}
						</div>
						<Input
							id="email"
							type="email"
							placeholder="example123@gmail.com"
							value={formData.email}
							onChange={(e) => {
								onInputChangeEvent('email')(e)
								// Clear validation error when user starts typing
								if (validationErrors.email) {
									setValidationErrors((prev) => {
										const newErrors = { ...prev }
										delete newErrors.email
										return newErrors
									})
								}
							}}
							inputSize="select"
							disabled={user?.email && formData.email === user.email}
							className={`
								${
									user?.email && formData.email === user.email
										? 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-60'
										: ''
								}
								${validationErrors.email ? 'border-red-500 focus:border-red-500' : ''}
							`}
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="nationality">
							Nationality <span className="text-red-500">*</span>
						</Label>
						<CustomSelect
							value={
								formData.nationality
									? getCountriesWithSvgFlags().find(
											(c) =>
												c.name.toLowerCase() ===
												formData.nationality.toLowerCase()
										)
									: null
							}
							onChange={(option) => {
								onSelectChange('nationality')(option?.name || '')
								// Clear validation error when user selects
								if (validationErrors.nationality) {
									setValidationErrors((prev) => {
										const newErrors = { ...prev }
										delete newErrors.nationality
										return newErrors
									})
								}
							}}
							placeholder="Choose your nationality"
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
							className="w-full"
							styles={
								validationErrors.nationality
									? {
											control: (provided: any, state: any) => ({
												...provided,
												border: '1px solid #ef4444',
												backgroundColor: '#F5F7FB',
												color: '#374151',
												minHeight: '40px',
												height: state.isMulti ? 'auto' : '40px',
												borderRadius: '20px',
												fontSize: '14px',
												padding: state.isMulti ? '8px 16px' : '0 16px',
												display: 'flex',
												alignItems:
													state.isMulti &&
													Array.isArray(state.getValue()) &&
													state.getValue().length > 0
														? 'flex-start'
														: 'center',
												flexWrap: 'wrap',
												'&:hover': {
													border: '1px solid #ef4444',
												},
												'&:focus-within': {
													border: '1px solid #ef4444',
													boxShadow: '0 0 0 1px #ef4444',
												},
											}),
											menu: (provided: any) => ({
												...provided,
												fontSize: '14px',
											}),
											option: (provided: any) => ({
												...provided,
												fontSize: '14px',
												padding: '8px 16px',
											}),
										}
									: undefined
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="phone">Phone Number</Label>
						<div className="w-full">
							<PhoneInput
								value={formData.phoneNumber}
								countryCode={formData.countryCode}
								onValueChange={(value) => {
									// Remove any non-numeric characters
									const numbersOnly = value.replace(/[^0-9]/g, '')
									onInputChange('phoneNumber', numbersOnly)
									// Clear validation error when user starts typing
									if (phoneValidationError) {
										setPhoneValidationError('')
									}
								}}
								onCountryChange={(countryCode) => {
									onInputChange('countryCode', countryCode)
									// Clear validation error when user changes country
									if (phoneValidationError) {
										setPhoneValidationError('')
									}
								}}
								placeholder="Your phone number (numbers only)"
								className="w-full"
								hasError={!!phoneValidationError}
							/>
						</div>
					</div>
				</div>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label>Interest</Label>
						<CustomSelect
							value={formData.interests.map((interest) => ({
								value: interest,
								label: interest,
							}))}
							onChange={(options) =>
								onMultiSelectChange('interests')(
									options ? options.map((option: any) => option.value) : []
								)
							}
							placeholder="Choose subject(s)/field(s) you interested in"
							options={subdisciplines}
							isMulti
							isSearchable
							isClearable
							maxSelectedHeight="120px"
						/>
					</div>

					<div className="space-y-2">
						<Label>Favorite country</Label>
						<CustomSelect
							value={formData.favoriteCountries.map((country) => {
								const countryData = getCountriesWithSvgFlags().find(
									(c) => c.name.toLowerCase() === country.toLowerCase()
								)
								return {
									value: country,
									label: country,
									...countryData,
								}
							})}
							onChange={(options) =>
								onMultiSelectChange('favoriteCountries')(
									options ? options.map((option: any) => option.value) : []
								)
							}
							placeholder="Choose your favorite countries"
							options={getCountriesWithSvgFlags().map((country) => ({
								value: country.name,
								label: country.name,
								...country,
							}))}
							formatOptionLabel={(option: any) => (
								<div className="flex items-center space-x-2">
									<span className="text-lg">{option.flag}</span>
									<span>{option.name}</span>
								</div>
							)}
							isMulti
							isClearable
							isSearchable
							filterOption={(option, inputValue) => {
								const country = option.data
								return country.name
									.toLowerCase()
									.includes(inputValue.toLowerCase())
							}}
							maxSelectedHeight="120px"
						/>
					</div>
				</div>
			</div>

			<div className="flex justify-between">
				<Button variant="outline" onClick={onBack} size="sm">
					Back
				</Button>
				<Button onClick={handleNext} size="sm">
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
