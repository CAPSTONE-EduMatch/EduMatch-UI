'use client'

import { AdminTable } from '@/components/admin/AdminTable'
import { Card, CardContent } from '@/components/ui'
import Modal from '@/components/ui/modals/Modal'
import { ChevronRight, Plus, Search, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Subdiscipline {
	id: string
	subdisciplineName: string
	discipline: string
	status: 'Active' | 'Inactive'
	createdAt: string
}

const mockSubdisciplines: Subdiscipline[] = [
	{
		id: 'SD001',
		subdisciplineName: 'Artificial Intelligence',
		discipline: 'Computer Science',
		status: 'Active',
		createdAt: '01/01/2024',
	},
	{
		id: 'SD002',
		subdisciplineName: 'Machine Learning',
		discipline: 'Computer Science',
		status: 'Active',
		createdAt: '01/02/2024',
	},
	{
		id: 'SD003',
		subdisciplineName: 'Organic Chemistry',
		discipline: 'Chemistry',
		status: 'Active',
		createdAt: '01/03/2024',
	},
	{
		id: 'SD004',
		subdisciplineName: 'Quantum Physics',
		discipline: 'Physics',
		status: 'Inactive',
		createdAt: '01/04/2024',
	},
	{
		id: 'SD005',
		subdisciplineName: 'Microeconomics',
		discipline: 'Economics',
		status: 'Active',
		createdAt: '01/05/2024',
	},
	{
		id: 'SD006',
		subdisciplineName: 'Molecular Biology',
		discipline: 'Biology',
		status: 'Active',
		createdAt: '01/06/2024',
	},
	{
		id: 'SD007',
		subdisciplineName: 'Data Structures',
		discipline: 'Computer Science',
		status: 'Active',
		createdAt: '01/07/2024',
	},
]

const getStatusColor = (status: Subdiscipline['status']) => {
	switch (status) {
		case 'Active':
			return 'bg-[#126E64] text-white'
		case 'Inactive':
			return 'bg-[#D5D5D5] text-black'
		default:
			return 'bg-gray-200 text-black'
	}
}

export default function AdminDisciplinesPage() {
	const router = useRouter()
	const [searchQuery, setSearchQuery] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [statusFilter, setStatusFilter] = useState<
		'all' | 'Active' | 'Inactive'
	>('all')
	const [selectedSubdiscipline, setSelectedSubdiscipline] =
		useState<Subdiscipline | null>(null)
	const [isModalOpen, setIsModalOpen] = useState(false)

	// Edit form state
	const [editedName, setEditedName] = useState('')
	const [editedDiscipline, setEditedDiscipline] = useState('')
	const [editedStatus, setEditedStatus] = useState<'Active' | 'Inactive'>(
		'Active'
	)

	// Filter subdisciplines based on search and filters
	const filteredSubdisciplines = mockSubdisciplines.filter((subdiscipline) => {
		const matchesSearch =
			searchQuery === '' ||
			subdiscipline.subdisciplineName
				.toLowerCase()
				.includes(searchQuery.toLowerCase()) ||
			subdiscipline.discipline.toLowerCase().includes(searchQuery.toLowerCase())
		const matchesStatus =
			statusFilter === 'all' || subdiscipline.status === statusFilter
		return matchesSearch && matchesStatus
	})

	const totalPages = Math.ceil(filteredSubdisciplines.length / 10)
	const paginatedSubdisciplines = filteredSubdisciplines.slice(
		(currentPage - 1) * 10,
		currentPage * 10
	)

	const handleViewDetails = (subdiscipline: Subdiscipline) => {
		setSelectedSubdiscipline(subdiscipline)
		setEditedName(subdiscipline.subdisciplineName)
		setEditedDiscipline(subdiscipline.discipline)
		setEditedStatus(subdiscipline.status)
		setIsModalOpen(true)
	}

	const handleSaveChanges = () => {
		// TODO: Implement save logic
		console.log('Saving changes:', {
			id: selectedSubdiscipline?.id,
			subdisciplineName: editedName,
			discipline: editedDiscipline,
			status: editedStatus,
		})
		setIsModalOpen(false)
	}

	// Define table columns
	const columns = [
		{
			header: 'ID',
			accessor: 'id' as keyof Subdiscipline,
			className: '70px',
		},
		{
			header: 'Subdiscipline name',
			// eslint-disable-next-line no-unused-vars
			accessor: ((subdiscipline: Subdiscipline) => (
				<div className="text-left font-semibold text-base text-black group relative">
					<div className="truncate">{subdiscipline.subdisciplineName}</div>
					<div className="absolute left-0 top-full mt-1 px-3 py-2 bg-gray-800 text-white text-sm rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 whitespace-normal max-w-xs pointer-events-none">
						{subdiscipline.subdisciplineName}
					</div>
				</div>
			)) as (subdiscipline: Subdiscipline) => React.ReactNode,
			className: 'minmax(200px, 1.5fr)',
		},
		{
			header: 'Discipline',
			// eslint-disable-next-line no-unused-vars
			accessor: ((subdiscipline: Subdiscipline) => (
				<div className="text-gray-700 text-sm text-center group relative">
					<div className="truncate">{subdiscipline.discipline}</div>
					<div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-1 px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 whitespace-nowrap pointer-events-none">
						{subdiscipline.discipline}
					</div>
				</div>
			)) as (subdiscipline: Subdiscipline) => React.ReactNode,
			className: 'minmax(150px, 1fr)',
		},
		{
			header: 'Status',
			// eslint-disable-next-line no-unused-vars
			accessor: ((subdiscipline: Subdiscipline) => (
				<span
					className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(
						subdiscipline.status
					)}`}
				>
					{subdiscipline.status}
				</span>
			)) as (subdiscipline: Subdiscipline) => React.ReactNode,
			className: '110px',
		},
		{
			header: 'Created at',
			// eslint-disable-next-line no-unused-vars
			accessor: ((subdiscipline: Subdiscipline) => (
				<div className="text-gray-700 text-sm text-center">
					{subdiscipline.createdAt}
				</div>
			)) as (subdiscipline: Subdiscipline) => React.ReactNode,
			className: '100px',
		},
		{
			header: 'Actions',
			// eslint-disable-next-line no-unused-vars
			accessor: ((subdiscipline: Subdiscipline) => (
				<button
					onClick={() => handleViewDetails(subdiscipline)}
					className="flex items-center justify-center gap-1 text-[#126E64] hover:underline text-sm mx-auto"
				>
					<span>View Details</span>
					<ChevronRight className="w-4 h-4" />
				</button>
			)) as (subdiscipline: Subdiscipline) => React.ReactNode,
			className: '130px',
		},
	]

	return (
		<div className="min-h-screen bg-[#F5F7FB] pb-12">
			{/* Header Section */}
			<div className="px-8 pt-[135px] pb-6">
				<h1 className="text-2xl font-bold text-[#126E64]">
					Discipline Management
				</h1>
			</div>

			{/* Statistics Cards */}
			<div className="px-8 mb-8">
				<div className="flex gap-6">
					{/* Total Subdisciplines Card */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0 flex-1">
						<CardContent className="p-5 flex items-center gap-4">
							<div className="w-14 h-14 rounded-full bg-[#F0A227]/20 flex items-center justify-center">
								<Users className="w-7 h-7 text-[#F0A227]" />
							</div>
							<div className="text-right flex-1">
								<p className="text-base text-black mb-1">
									Total subdisciplines
								</p>
								<p className="text-2xl font-semibold text-[#989898]">
									{mockSubdisciplines.length}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Active Subdisciplines Card */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0 flex-1">
						<CardContent className="p-5 flex items-center gap-4">
							<div className="w-14 h-14 rounded-full bg-[#126E64]/20 flex items-center justify-center">
								<Users className="w-7 h-7 text-[#126E64]" />
							</div>
							<div className="text-right flex-1">
								<p className="text-base text-black mb-1">
									Active subdisciplines
								</p>
								<p className="text-2xl font-semibold text-[#989898]">
									{
										mockSubdisciplines.filter((s) => s.status === 'Active')
											.length
									}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Inactive Subdisciplines Card */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0 flex-1">
						<CardContent className="p-5 flex items-center gap-4">
							<div className="w-14 h-14 rounded-full bg-[#D5D5D5]/20 flex items-center justify-center">
								<Users className="w-7 h-7 text-[#D5D5D5]" />
							</div>
							<div className="text-right flex-1">
								<p className="text-base text-black mb-1">
									Inactive subdisciplines
								</p>
								<p className="text-2xl font-semibold text-[#989898]">
									{
										mockSubdisciplines.filter((s) => s.status === 'Inactive')
											.length
									}
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Main Content */}
			<div className="px-8">
				{/* Search, Filters, and Add Button */}
				<div className="mb-6 flex items-center gap-4">
					<div className="flex-1 relative">
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by subdiscipline or discipline..."
							className="w-full px-6 py-3 pr-16 rounded-full border-2 border-[#126E64] text-base outline-none focus:ring-2 focus:ring-[#126E64]/30"
						/>
						<div className="absolute right-0 top-0 bottom-0 bg-[#126E64] rounded-r-full px-5 flex items-center">
							<Search className="w-5 h-5 text-white" />
						</div>
					</div>
					<div className="bg-white border-2 border-gray-300 rounded-full px-5 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
						<select
							value={statusFilter}
							onChange={(e) =>
								setStatusFilter(e.target.value as 'all' | 'Active' | 'Inactive')
							}
							className="bg-transparent text-gray-700 font-medium focus:outline-none text-sm min-w-[90px]"
						>
							<option value="all">All Status</option>
							<option value="Active">Active</option>
							<option value="Inactive">Inactive</option>
						</select>
					</div>
					<button
						onClick={() => router.push('/admin/disciplines/create')}
						className="bg-[#126E64] hover:bg-[#0f5850] text-white rounded-full px-6 py-3 flex items-center gap-2 text-base font-semibold transition-colors shadow-sm"
					>
						<Plus className="w-5 h-5" />
						Add New
					</button>
				</div>{' '}
				{/* Subdisciplines Table */}
				<div>
					<h2 className="text-2xl font-bold text-black mb-6">
						Subdisciplines ({filteredSubdisciplines.length} total)
					</h2>

					<AdminTable
						data={paginatedSubdisciplines}
						columns={columns}
						currentPage={currentPage}
						totalPages={totalPages}
						totalItems={filteredSubdisciplines.length}
						itemsPerPage={10}
						onPageChange={setCurrentPage}
						emptyMessage="No subdisciplines found matching your criteria."
					/>
				</div>
			</div>

			{/* Edit Modal */}
			<Modal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				title="Edit Subdiscipline"
				maxWidth="lg"
			>
				<div className="space-y-6">
					{/* ID (Read-only) */}
					<div className="space-y-2">
						<label className="block text-sm font-semibold text-gray-700">
							ID
						</label>
						<div className="bg-gray-100 border-2 border-gray-200 rounded-[16px] px-4 py-3">
							<p className="text-base text-gray-600">
								{selectedSubdiscipline?.id}
							</p>
						</div>
					</div>

					{/* Subdiscipline Name */}
					<div className="space-y-2">
						<label className="block text-sm font-semibold text-gray-700">
							Subdiscipline Name
						</label>
						<div className="bg-gray-50 border-2 border-gray-200 rounded-[16px] px-4 py-3 focus-within:border-[#126E64] focus-within:bg-white transition-all">
							<input
								type="text"
								value={editedName}
								onChange={(e) => setEditedName(e.target.value)}
								className="w-full text-base text-gray-900 outline-none bg-transparent"
							/>
						</div>
					</div>

					{/* Discipline */}
					<div className="space-y-2">
						<label className="block text-sm font-semibold text-gray-700">
							Discipline
						</label>
						<div className="bg-gray-50 border-2 border-gray-200 rounded-[16px] px-4 py-3 focus-within:border-[#126E64] focus-within:bg-white transition-all">
							<input
								type="text"
								value={editedDiscipline}
								onChange={(e) => setEditedDiscipline(e.target.value)}
								className="w-full text-base text-gray-900 outline-none bg-transparent"
							/>
						</div>
					</div>

					{/* Status */}
					<div className="space-y-2">
						<label className="block text-sm font-semibold text-gray-700">
							Status
						</label>
						<div className="bg-gray-50 border-2 border-gray-200 rounded-[16px] px-4 py-3 focus-within:border-[#126E64] focus-within:bg-white transition-all">
							<select
								value={editedStatus}
								onChange={(e) =>
									setEditedStatus(e.target.value as 'Active' | 'Inactive')
								}
								className="w-full text-base text-gray-900 outline-none bg-transparent"
							>
								<option value="Active">Active</option>
								<option value="Inactive">Inactive</option>
							</select>
						</div>
					</div>

					{/* Created At (Read-only) */}
					<div className="space-y-2">
						<label className="block text-sm font-semibold text-gray-700">
							Created At
						</label>
						<div className="bg-gray-100 border-2 border-gray-200 rounded-[16px] px-4 py-3">
							<p className="text-base text-gray-600">
								{selectedSubdiscipline?.createdAt}
							</p>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-4 pt-4">
						<button
							onClick={handleSaveChanges}
							className="flex-1 bg-[#126E64] hover:bg-[#0f5850] text-white rounded-[16px] px-6 py-3 text-base font-semibold transition-colors"
						>
							Save Changes
						</button>
						<button
							onClick={() => setIsModalOpen(false)}
							className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-[16px] px-6 py-3 text-base font-semibold transition-colors"
						>
							Cancel
						</button>
					</div>
				</div>
			</Modal>
		</div>
	)
}

// Discipline not done. Need to correct the flow
