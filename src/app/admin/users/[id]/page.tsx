'use client'

import { ProfileSidebar } from '@/components/profile/ProfileSidebar'
import { motion } from 'framer-motion'
import {
	Building2,
	GraduationCap,
	Users,
	ArrowLeft,
	Download,
	MessageCircle,
} from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const sidebarItems = [
	{ id: 'dashboard', icon: Users, label: 'Dashboard' },
	{ id: 'certifications', icon: GraduationCap, label: 'Certifications' },
	{ id: 'posts', icon: Building2, label: 'Posts' },
	{ id: 'discipline', icon: Building2, label: 'Discipline' },
	{ id: 'user', icon: Users, label: 'User', active: true },
	{ id: 'plan', icon: Building2, label: 'Plan' },
	{ id: 'transaction', icon: Building2, label: 'Transaction' },
	{ id: 'supports', icon: Building2, label: 'Supports' },
	{ id: 'track-user-log', icon: Building2, label: 'Track user log' },
	{ id: 'logout', icon: Building2, label: 'Log out' },
]

// Mock data for user details
const mockUserData = {
	id: '1',
	name: 'Lê Minh Gia Mẫn',
	email: 'example123@gmail.com',
	phone: '(+84) 0909090909090',
	nationality: 'Vietnam',
	birthDate: '01/01/2000',
	gender: 'Male',
	profileImage: '/profile.svg',
	program: 'Bachelor of Information System',
	gpa: '3.7',
	status: 'Graduated',
	university: 'Bach Khoa University',
	documents: {
		researchPapers: [
			{
				name: 'Research Paper 1.pdf',
				size: '200 KB',
				date: '01/01/2025 17:00:00',
			},
			{
				name: 'Research Paper 2.pdf',
				size: '150 KB',
				date: '01/01/2025 16:30:00',
			},
		],
		transcripts: [
			{
				name: 'Official Transcript.pdf',
				size: '300 KB',
				date: '01/01/2025 15:00:00',
			},
		],
		degrees: [
			{
				name: 'Bachelor Degree.pdf',
				size: '250 KB',
				date: '01/01/2025 14:00:00',
			},
		],
		languageCertificates: [
			{
				name: 'IELTS Certificate.pdf',
				size: '180 KB',
				date: '01/01/2025 13:00:00',
			},
		],
		cvResume: [
			{
				name: 'CV_Resume.pdf',
				size: '220 KB',
				date: '01/01/2025 12:00:00',
			},
		],
	},
}

// Logo section for admin sidebar
const AdminLogoSection = () => (
	<div className="flex flex-col items-center justify-center mb-12 pt-8">
		<Image
			src="/edumatch_logo.svg"
			alt="EduMatch Logo"
			className="w-12 h-12 mb-2"
			width={48}
			height={48}
		/>
		<h1 className="text-white text-2xl font-bold text-center">EduMatch</h1>
	</div>
)

interface FileCardProps {
	file: {
		name: string
		size: string
		date: string
	}
}

const FileCard = ({ file }: FileCardProps) => (
	<div className="bg-white border border-[#D2D2D2] rounded-[15px] p-4">
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-3">
				<div className="w-6 h-6 bg-[#F5F7FB] rounded flex items-center justify-center">
					<div className="w-3 h-3 bg-[#33363F] rounded-sm"></div>
				</div>
				<span className="text-sm font-medium text-black">{file.name}</span>
			</div>
			<div className="w-6 h-6 bg-[#126E64] rounded flex items-center justify-center cursor-pointer hover:bg-[#0f5a52] transition-colors">
				<Download className="w-3 h-3 text-white" />
			</div>
		</div>
		<div className="flex items-center gap-4 mt-3 text-xs text-[#A2A2A2]">
			<span className="text-[#8D8D8D]">{file.size}</span>
			<span>{file.date}</span>
			<span>Click to quick preview file</span>
		</div>
	</div>
)

interface DocumentSectionProps {
	title: string
	files: Array<{ name: string; size: string; date: string }>
	bgColor?: string
}

const DocumentSection = ({
	title,
	files,
	bgColor = 'bg-[#126E64]',
}: DocumentSectionProps) => (
	<div className="mb-6">
		<div className="flex items-center justify-between mb-4">
			<div
				className={`${bgColor} text-white px-4 py-2 rounded-[20px] font-semibold text-sm`}
			>
				{title}
			</div>
			<div className="bg-[#126E64] text-white px-4 py-2 rounded-[20px] flex items-center gap-2 cursor-pointer hover:bg-[#0f5a52] transition-colors">
				<Download className="w-3 h-3" />
				<span className="text-sm">Download folder</span>
			</div>
		</div>
		<div className="space-y-3">
			{files.map((file, index) => (
				<FileCard key={index} file={file} />
			))}
		</div>
	</div>
)

export default function UserDetailPage() {
	const [isClient, setIsClient] = useState(false)
	const router = useRouter()

	useEffect(() => {
		setIsClient(true)
	}, [])

	const handleBack = () => {
		router.back()
	}

	if (!isClient) {
		return (
			<div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#126E64]"></div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-[#F5F7FB] flex">
			{/* Sidebar */}
			<div className="w-[289px] bg-[#126E64] min-h-screen fixed left-0 top-0 z-10">
				<ProfileSidebar
					activeSection="user"
					onSectionChange={() => {
						// TODO: Implement proper navigation routing
					}}
					navItems={sidebarItems}
					showProfileSection={false}
					logoSection={<AdminLogoSection />}
					enableNavigationProtection={false}
					sidebarStyle={{
						activeItemBgColor: 'bg-white/10',
						activeItemTextColor: 'text-white',
						activeItemBorder: 'border border-white/20',
						inactiveItemTextColor: 'text-white/80',
						itemBorderRadius: 'rounded-full',
						itemPadding: 'px-4 py-3',
						itemSpacing: 'mb-2',
					}}
					containerPaddingTop="pt-0"
				/>
			</div>

			{/* Main Content */}
			<div className="flex-1 ml-[289px]">
				{/* Header */}
				<div className="bg-white shadow-sm p-4 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<button
							onClick={handleBack}
							className="flex items-center gap-2 text-[#126E64] hover:text-[#0f5a52] transition-colors"
						>
							<ArrowLeft className="w-4 h-4" />
							<span className="text-sm font-medium">
								Back to User Management
							</span>
						</button>
					</div>
					<div className="flex items-center gap-3">
						<span className="text-lg font-bold text-[#126E64]">EduMatch</span>
						<span className="text-sm text-[#126E64]">Administrator</span>
					</div>
				</div>

				<div className="flex gap-12 p-6 max-w-7xl mx-auto">
					{/* Left Column - User Profile */}
					<div className="w-[350px] flex-shrink-0">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
							className="bg-white rounded-lg p-6 shadow-sm"
						>
							{/* Profile Image and Basic Info */}
							<div className="text-center mb-6">
								<div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
									<Image
										src={mockUserData.profileImage}
										alt={mockUserData.name}
										width={128}
										height={128}
										className="w-full h-full object-cover"
									/>
								</div>
								<h2 className="text-xl font-semibold text-black mb-1">
									{mockUserData.name}
								</h2>
								<p className="text-sm text-[#A2A2A2]">
									{mockUserData.birthDate} - {mockUserData.gender}
								</p>
							</div>

							{/* Academic Information */}
							<div className="mb-6">
								<div className="border-b border-[#DEDEDE] mb-4"></div>
								<div className="space-y-3">
									<div>
										<span className="text-sm text-black">Program: </span>
										<span className="text-sm font-medium text-black">
											{mockUserData.program}
										</span>
									</div>
									<div>
										<span className="text-sm text-black">GPA: </span>
										<span className="text-sm font-medium text-black">
											{mockUserData.gpa}
										</span>
									</div>
									<div>
										<span className="text-sm font-semibold text-black">
											Status:{' '}
										</span>
										<span className="text-sm font-semibold text-black">
											{mockUserData.status}
										</span>
									</div>
									<div>
										<span className="text-sm font-semibold text-black">
											University:{' '}
										</span>
										<span className="text-sm font-semibold text-black">
											{mockUserData.university}
										</span>
									</div>
								</div>
							</div>

							{/* Contact Information */}
							<div className="mb-6">
								<div className="border-b border-[#DEDEDE] mb-4"></div>
								<div className="space-y-3">
									<div>
										<span className="text-sm text-black">Email: </span>
										<span className="text-sm text-black">
											{mockUserData.email}
										</span>
									</div>
									<div>
										<span className="text-sm text-black">Phone number: </span>
										<span className="text-sm text-black">
											{mockUserData.phone}
										</span>
									</div>
									<div>
										<span className="text-sm text-black">Nationality: </span>
										<span className="text-sm text-black">
											{mockUserData.nationality}
										</span>
									</div>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="space-y-3">
								<button className="w-full bg-[#F0A227] text-white py-2.5 px-4 rounded-[30px] flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#e6921f] transition-colors">
									<MessageCircle className="w-4 h-4" />
									Contact Applicant
								</button>
								<button className="w-full bg-[#E20000] text-white py-2.5 px-4 rounded-[30px] text-sm font-semibold hover:bg-[#cc0000] transition-colors">
									Deactivate
								</button>
							</div>
						</motion.div>
					</div>

					{/* Right Column - Documents */}
					<div className="flex-1 min-w-0">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: 0.1 }}
						>
							<div className="mb-6">
								<h1 className="text-xl font-bold text-[#116E63] mb-2">
									Academic Profile
								</h1>
								<div className="border-b border-[#DEDEDE] mb-6"></div>
							</div>

							<DocumentSection
								title="Research paper"
								files={mockUserData.documents.researchPapers}
							/>

							<DocumentSection
								title="Transcript"
								files={mockUserData.documents.transcripts}
							/>

							<DocumentSection
								title="Degrees"
								files={mockUserData.documents.degrees}
							/>

							<DocumentSection
								title="Foreign Language Certificate"
								files={mockUserData.documents.languageCertificates}
							/>

							<DocumentSection
								title="CV / Resume"
								files={mockUserData.documents.cvResume}
							/>

							{/* Download All Button */}
							<div className="flex justify-center mt-6">
								<button className="bg-[#126E64] text-white px-6 py-2.5 rounded-[20px] flex items-center gap-2 text-sm font-semibold hover:bg-[#0f5a52] transition-colors">
									<Download className="w-4 h-4" />
									Download all
								</button>
							</div>
						</motion.div>
					</div>
				</div>
			</div>
		</div>
	)
}
