import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui'
import { PhoneInput } from '@/components/ui'
import { CustomSelect } from '@/components/ui'
import { DateInput } from '@/components/ui'
import { ErrorModal } from '@/components/ui'
import { Upload, User } from 'lucide-react'
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
	const fileInputRef = useRef<HTMLInputElement>(null)
	const hasAutoFilledNames = useRef(false)
	const { uploadFile, isUploading } = usePresignedUpload()

	// Auto-fill Google login data when component mounts (only for Google OAuth users)
	useEffect(() => {
		if (user && user.image) {
			if (user.email && !formData.email) {
				onInputChange('email', user.email)
			}

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

	// Function to handle form validation and submission
	const handleNext = () => {
		// Validate required fields
		if (!formData.firstName.trim()) {
			alert('Please enter your first name')
			return
		}

		if (!formData.lastName.trim()) {
			alert('Please enter your last name')
			return
		}

		if (!formData.email.trim()) {
			alert('Please enter your email address')
			return
		}

		// Validate phone number
		const isPhoneValid = validatePhoneNumber()

		if (!isPhoneValid) {
			return // Don't proceed if phone validation fails
		}

		onNext()
	}

	// Function to handle name input (only letters and spaces, no numbers)
	const handleNameInput =
		(field: 'firstName' | 'lastName') =>
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value
			// Remove any non-letter characters except spaces (no numbers, symbols)
			const lettersAndSpaces = value.replace(/[^a-zA-Z\s]/g, '')
			onInputChange(field, lettersAndSpaces)
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
							<AvatarImage src={formData.profilePhoto} alt="Profile photo" />
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
						<Label htmlFor="firstName">First Name</Label>
						<Input
							id="firstName"
							placeholder="Enter your first name"
							value={formData.firstName}
							onChange={handleNameInput('firstName')}
							inputSize="select"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="lastName">Last Name</Label>
						<Input
							id="lastName"
							placeholder="Enter your last name"
							value={formData.lastName}
							onChange={handleNameInput('lastName')}
							inputSize="select"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="gender">Gender</Label>
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
							onChange={(option) =>
								onSelectChange('gender')(option?.value || '')
							}
							placeholder="Choose gender"
							options={[
								{ value: 'male', label: 'Male' },
								{ value: 'female', label: 'Female' },
							]}
							isClearable={false}
							className="w-full"
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<DateInput
						id="birthday"
						value={formData.birthday}
						onChange={(value) => onInputChange('birthday', value)}
						label="Birthday"
						placeholder="dd/mm/yyyy"
					/>
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<div className="relative">
							<Input
								id="email"
								type="email"
								placeholder="example123@gmail.com"
								value={formData.email}
								onChange={onInputChangeEvent('email')}
								inputSize="select"
								disabled={
									user?.email && user?.image && formData.email === user.email
								}
							/>
							{user?.email && user?.image && formData.email === user.email && (
								<div className="absolute right-2 top-1/2 transform -translate-y-1/2">
									<div className="group relative">
										<div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center cursor-help">
											<span className="text-white text-xs font-bold">i</span>
										</div>
										<div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
											Email from Google account
											<div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="nationality">Nationality</Label>
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
							onChange={(option) =>
								onSelectChange('nationality')(option?.name || '')
							}
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
