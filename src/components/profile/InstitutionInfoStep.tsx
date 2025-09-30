'use client'

import { useState, useRef } from 'react'
import { ProfileFormData } from '@/types/profile'
import { Label } from '@/components/ui/label'
import Input from '@/components/ui/Input'
import { CustomSelect } from '@/components/ui/custom-select'
import { PhoneInput } from '@/components/ui/phone-input'
import Button from '@/components/ui/Button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload, Building2 } from 'lucide-react'

interface InstitutionInfoStepProps {
	formData: ProfileFormData
	onInputChange: (field: keyof ProfileFormData, value: any) => void
	onInputChangeEvent: (
		field: keyof ProfileFormData
	) => (e: React.ChangeEvent<HTMLInputElement>) => void
	onSelectChange: (field: keyof ProfileFormData) => (value: string) => void
	onBack: () => void
	onNext: () => void
	onShowManageModal: () => void
}

export function InstitutionInfoStep({
	formData,
	onInputChange,
	onInputChangeEvent,
	onSelectChange,
	onBack,
	onNext,
	onShowManageModal,
}: InstitutionInfoStepProps) {
	const [showCampusForm, setShowCampusForm] = useState(false)
	const [isUploading, setIsUploading] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [newCampus, setNewCampus] = useState({
		name: '',
		country: '',
		address: '',
	})

	const handleAddCampus = () => {
		if (newCampus.name && newCampus.country && newCampus.address) {
			const updatedCampuses = [...(formData.campuses || []), { ...newCampus }]
			onInputChange('campuses', updatedCampuses)
			setNewCampus({ name: '', country: '', address: '' })
			setShowCampusForm(false)
		}
	}

	const handleRemoveCampus = (index: number) => {
		const updatedCampuses =
			formData.campuses?.filter((_, i) => i !== index) || []
		onInputChange('campuses', updatedCampuses)
	}

	const handleFileSelect = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0]
		if (!file) return

		// Validate file type
		if (!file.type.startsWith('image/')) {
			alert('Please select an image file')
			return
		}

		// Validate file size (5MB max)
		if (file.size > 5 * 1024 * 1024) {
			alert('File size must be less than 5MB')
			return
		}

		setIsUploading(true)

		try {
			// Create FormData for upload
			const formData = new FormData()
			formData.append('file', file)

			// Upload to S3
			const { ApiService } = await import('@/lib/axios-config')
			const result = await ApiService.uploadFile(file)

			// Update the profile photo with the S3 URL
			onInputChange('profilePhoto', result.url)
		} catch (error) {
			console.error('Upload error:', error)
			alert('Failed to upload image. Please try again.')
		} finally {
			setIsUploading(false)
			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}
		}
	}

	const handleUploadClick = () => {
		fileInputRef.current?.click()
	}

	const getAllFiles = () => {
		return []
	}

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="text-center">
				<h2 className="text-2xl font-bold text-foreground mb-2">
					Institution Information
				</h2>
				<p className="text-muted-foreground">
					Please provide your institution details
				</p>
			</div>

			{/* Profile Photo Upload */}
			<div className="flex items-center gap-4">
				<div className="relative">
					<Avatar className="w-20 h-20">
						<AvatarImage src={formData.profilePhoto || '/profile.svg'} />
						<AvatarFallback className="bg-blue-500 text-white">
							<Building2 className="w-8 h-8" />
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
						{isUploading ? 'Uploading...' : 'Upload institution logo'}
					</Button>
					<p className="text-xs text-muted-foreground">
						Must be PNG or JPG file (max 5MB)
					</p>
				</div>
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					onChange={handleFileSelect}
					className="hidden"
				/>
			</div>

			{/* First Row: Institution Name and Abbreviation */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">
						Institution Name *
					</Label>
					<Input
						id="institutionName"
						value={formData.institutionName}
						onChange={onInputChangeEvent('institutionName')}
						placeholder="Enter institution name"
						inputSize="select"
					/>
				</div>
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">
						Abbreviation
					</Label>
					<Input
						id="institutionAbbreviation"
						value={formData.institutionAbbreviation}
						onChange={onInputChangeEvent('institutionAbbreviation')}
						placeholder="e.g., MIT, Harvard"
						inputSize="select"
					/>
				</div>
			</div>

			{/* Second Row: Hotline and Type */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">Hotline</Label>
					<PhoneInput
						value={formData.institutionHotline}
						countryCode={formData.institutionHotlineCode}
						onValueChange={(phone) =>
							onInputChange('institutionHotline', phone)
						}
						onCountryChange={(code) =>
							onInputChange('institutionHotlineCode', code)
						}
						placeholder="Enter hotline number"
					/>
				</div>
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">
						Institution Type *
					</Label>
					<CustomSelect
						value={formData.institutionType}
						onChange={onSelectChange('institutionType')}
						placeholder="Select institution type"
						options={[
							{ value: 'university', label: 'University' },
							{ value: 'college', label: 'College' },
							{ value: 'research-institute', label: 'Research Institute' },
							{ value: 'technical-school', label: 'Technical School' },
							{ value: 'community-college', label: 'Community College' },
							{ value: 'other', label: 'Other' },
						]}
					/>
				</div>
			</div>

			{/* Third Row: Website and Email */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">Website</Label>
					<Input
						id="institutionWebsite"
						value={formData.institutionWebsite}
						onChange={onInputChangeEvent('institutionWebsite')}
						placeholder="https://www.institution.edu"
						inputSize="select"
					/>
				</div>
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">
						Institution Email *
					</Label>
					<Input
						id="institutionEmail"
						type="email"
						value={formData.institutionEmail}
						onChange={onInputChangeEvent('institutionEmail')}
						placeholder="contact@institution.edu"
						inputSize="select"
					/>
				</div>
			</div>

			{/* Fourth Row: Country and Address */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">
						Country *
					</Label>
					<CustomSelect
						value={formData.institutionCountry}
						onChange={onSelectChange('institutionCountry')}
						placeholder="Select country"
						options={[
							{ value: 'us', label: 'United States' },
							{ value: 'uk', label: 'United Kingdom' },
							{ value: 'ca', label: 'Canada' },
							{ value: 'au', label: 'Australia' },
							{ value: 'de', label: 'Germany' },
							{ value: 'fr', label: 'France' },
							{ value: 'jp', label: 'Japan' },
							{ value: 'kr', label: 'South Korea' },
							{ value: 'sg', label: 'Singapore' },
							{ value: 'other', label: 'Other' },
						]}
					/>
				</div>
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">
						Detailed Address *
					</Label>
					<Input
						id="institutionAddress"
						value={formData.institutionAddress}
						onChange={onInputChangeEvent('institutionAddress')}
						placeholder="Enter detailed address"
						inputSize="select"
					/>
				</div>
			</div>

			{/* Campus Management */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Label className="text-sm font-medium text-foreground">
						Campus Locations
					</Label>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowCampusForm(true)}
					>
						+ Add Campus
					</Button>
				</div>

				{/* Existing Campuses */}
				{formData.campuses && formData.campuses.length > 0 && (
					<div className="space-y-3">
						{formData.campuses.map((campus, index) => (
							<div
								key={index}
								className="p-4 border border-gray-200 rounded-lg bg-gray-50"
							>
								<div className="flex justify-between items-start">
									<div className="flex-1">
										<h4 className="font-medium text-foreground">
											{campus.name}
										</h4>
										<p className="text-sm text-muted-foreground">
											{campus.country}
										</p>
										<p className="text-sm text-muted-foreground">
											{campus.address}
										</p>
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleRemoveCampus(index)}
										className="text-red-500 hover:text-red-700"
									>
										Remove
									</Button>
								</div>
							</div>
						))}
					</div>
				)}

				{/* Add Campus Form */}
				{showCampusForm && (
					<div className="p-4 border border-gray-200 rounded-lg bg-blue-50">
						<h4 className="font-medium text-blue-900 mb-4">Add New Campus</h4>
						<div className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<Input
									placeholder="Campus name"
									value={newCampus.name}
									onChange={(e) =>
										setNewCampus({ ...newCampus, name: e.target.value })
									}
									inputSize="select"
								/>
								<Input
									placeholder="Country"
									value={newCampus.country}
									onChange={(e) =>
										setNewCampus({ ...newCampus, country: e.target.value })
									}
									inputSize="select"
								/>
								<Input
									placeholder="Address"
									value={newCampus.address}
									onChange={(e) =>
										setNewCampus({ ...newCampus, address: e.target.value })
									}
									inputSize="select"
								/>
							</div>
							<div className="flex gap-2">
								<Button onClick={handleAddCampus} size="sm">
									Add Campus
								</Button>
								<Button
									variant="outline"
									onClick={() => {
										setShowCampusForm(false)
										setNewCampus({ name: '', country: '', address: '' })
									}}
									size="sm"
								>
									Cancel
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Fifth Row: Representative Information */}
			<div className="space-y-4">
				<h3 className="text-lg font-semibold text-foreground">
					Representative Information
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="space-y-2">
						<Label className="text-sm font-medium text-foreground">
							Representative Name *
						</Label>
						<Input
							id="representativeName"
							value={formData.representativeName}
							onChange={onInputChangeEvent('representativeName')}
							placeholder="Enter representative name"
							inputSize="select"
						/>
					</div>
					<div className="space-y-2">
						<Label className="text-sm font-medium text-foreground">
							Appellation
						</Label>
						<CustomSelect
							value={formData.representativeAppellation}
							onChange={onSelectChange('representativeAppellation')}
							placeholder="Select appellation"
							options={[
								{ value: 'mr', label: 'Mr.' },
								{ value: 'mrs', label: 'Mrs.' },
								{ value: 'ms', label: 'Ms.' },
								{ value: 'dr', label: 'Dr.' },
								{ value: 'prof', label: 'Prof.' },
								{ value: 'other', label: 'Other' },
							]}
						/>
					</div>
					<div className="space-y-2">
						<Label className="text-sm font-medium text-foreground">
							Position *
						</Label>
						<Input
							id="representativePosition"
							value={formData.representativePosition}
							onChange={onInputChangeEvent('representativePosition')}
							placeholder="e.g., Admissions Director"
							inputSize="select"
						/>
					</div>
				</div>
			</div>

			{/* Sixth Row: Representative Contact */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">
						Representative Email *
					</Label>
					<Input
						id="representativeEmail"
						type="email"
						value={formData.representativeEmail}
						onChange={onInputChangeEvent('representativeEmail')}
						placeholder="representative@institution.edu"
						inputSize="select"
					/>
				</div>
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">
						Representative Phone
					</Label>
					<PhoneInput
						value={formData.representativePhone}
						countryCode={formData.representativePhoneCode}
						onValueChange={(phone) =>
							onInputChange('representativePhone', phone)
						}
						onCountryChange={(code) =>
							onInputChange('representativePhoneCode', code)
						}
						placeholder="Enter phone number"
					/>
				</div>
			</div>

			{/* About Institution */}
			<div className="space-y-2">
				<Label className="text-sm font-medium text-foreground">
					About Institution *
				</Label>
				<textarea
					value={formData.aboutInstitution}
					onChange={(e) => onInputChange('aboutInstitution', e.target.value)}
					placeholder="Describe your institution, its mission, programs, and what makes it unique..."
					className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-[#F5F7FB] text-sm"
					rows={5}
				/>
			</div>

			{/* Manage Files Button */}
			{getAllFiles().length > 0 && (
				<div className="flex justify-center pt-6">
					<Button variant="outline" onClick={onShowManageModal} size="sm">
						Manage Files ({getAllFiles().length})
					</Button>
				</div>
			)}

			{/* Navigation Buttons */}
			<div className="flex justify-between pt-8">
				<Button size="sm" variant="outline" onClick={onBack}>
					Back
				</Button>
				<Button size="sm" onClick={onNext}>
					Next
				</Button>
			</div>
		</div>
	)
}
