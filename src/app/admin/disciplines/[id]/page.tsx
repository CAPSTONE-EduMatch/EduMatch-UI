'use client'

import { AdminTable } from '@/components/admin/AdminTable'
import { Card, CardContent } from '@/components/ui'
import Modal from '@/components/ui/modals/Modal'
import { useDisciplineDetails } from '@/hooks/admin/useAdminDisciplines'
import {
	ArrowLeft,
	BookOpen,
	Building2,
	Loader2,
	Pencil,
	Plus,
	Trash2,
	Users,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

const getStatusColor = (status: 'Active' | 'Inactive') => {
	switch (status) {
		case 'Active':
			return 'bg-[#126E64] text-white'
		case 'Inactive':
			return 'bg-[#D5D5D5] text-black'
		default:
			return 'bg-gray-200 text-black'
	}
}

type Subdiscipline = {
	id: string
	name: string
	status: 'Active' | 'Inactive'
	createdAt: string
}

export default function DisciplineDetailPage() {
	const router = useRouter()
	const params = useParams()
	const disciplineId = params?.id as string

	const {
		discipline,
		isLoading,
		createSubdiscipline,
		updateSubdiscipline,
		deleteSubdiscipline,
		isCreating,
		isUpdating,
		isDeleting,
	} = useDisciplineDetails(disciplineId)

	// Modal states
	const [isAddModalOpen, setIsAddModalOpen] = useState(false)
	const [isEditModalOpen, setIsEditModalOpen] = useState(false)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [selectedSubdiscipline, setSelectedSubdiscipline] =
		useState<Subdiscipline | null>(null)

	// Form states
	const [newSubdisciplineName, setNewSubdisciplineName] = useState('')
	const [editedName, setEditedName] = useState('')
	const [editedStatus, setEditedStatus] = useState<'Active' | 'Inactive'>(
		'Active'
	)

	const handleAddSubdiscipline = async () => {
		if (!newSubdisciplineName.trim()) return

		await createSubdiscipline(newSubdisciplineName)
		setIsAddModalOpen(false)
		setNewSubdisciplineName('')
	}

	const handleEdit = (subdiscipline: Subdiscipline) => {
		setSelectedSubdiscipline(subdiscipline)
		setEditedName(subdiscipline.name)
		setEditedStatus(subdiscipline.status)
		setIsEditModalOpen(true)
	}

	const handleDelete = (subdiscipline: Subdiscipline) => {
		setSelectedSubdiscipline(subdiscipline)
		setIsDeleteModalOpen(true)
	}

	const handleSaveChanges = async () => {
		if (!selectedSubdiscipline) return

		await updateSubdiscipline(selectedSubdiscipline.id, {
			name: editedName,
			status: editedStatus,
		})
		setIsEditModalOpen(false)
		setSelectedSubdiscipline(null)
	}

	const handleConfirmDelete = async () => {
		if (!selectedSubdiscipline) return

		await deleteSubdiscipline(selectedSubdiscipline.id)
		setIsDeleteModalOpen(false)
		setSelectedSubdiscipline(null)
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
			accessor: ((subdiscipline: Subdiscipline) => (
				<div className="text-left font-semibold text-base text-black group relative">
					<div className="truncate">{subdiscipline.name}</div>
					<div className="absolute left-0 top-full mt-1 px-3 py-2 bg-gray-800 text-white text-sm rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 whitespace-normal max-w-xs pointer-events-none">
						{subdiscipline.name}
					</div>
				</div>
			)) as (_subdiscipline: Subdiscipline) => React.ReactNode,
			className: 'minmax(200px, 1.5fr)',
		},
		{
			header: 'Status',
			accessor: ((subdiscipline: Subdiscipline) => (
				<span
					className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(
						subdiscipline.status
					)}`}
				>
					{subdiscipline.status}
				</span>
			)) as (_subdiscipline: Subdiscipline) => React.ReactNode,
			className: '110px',
		},
		{
			header: 'Created at',
			accessor: ((subdiscipline: Subdiscipline) => (
				<div className="text-gray-700 text-sm text-center">
					{subdiscipline.createdAt}
				</div>
			)) as (_subdiscipline: Subdiscipline) => React.ReactNode,
			className: '100px',
		},
		{
			header: 'Actions',
			accessor: ((subdiscipline: Subdiscipline) => (
				<div className="flex items-center justify-center gap-2">
					<button
						onClick={() => handleEdit(subdiscipline)}
						className="p-2 text-[#126E64] hover:bg-[#126E64]/10 rounded-lg transition-colors"
						title="Edit subdiscipline"
					>
						<Pencil className="w-4 h-4" />
					</button>
					<button
						onClick={() => handleDelete(subdiscipline)}
						className="p-2 text-[#E20000] hover:bg-[#E20000]/10 rounded-lg transition-colors"
						title="Delete subdiscipline"
					>
						<Trash2 className="w-4 h-4" />
					</button>
				</div>
			)) as (_subdiscipline: Subdiscipline) => React.ReactNode,
			className: '100px',
		},
	]

	if (isLoading) {
		return (
			<div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
				<Loader2 className="w-8 h-8 animate-spin text-[#126E64]" />
			</div>
		)
	}

	if (!discipline) {
		return (
			<div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
				<div className="text-center">
					<p className="text-xl text-gray-600 mb-4">Discipline not found</p>
					<button
						onClick={() => router.push('/admin/disciplines')}
						className="text-[#126E64] hover:underline"
					>
						Back to Disciplines
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-[#F5F7FB] pb-12">
			{/* Header Section */}
			<div className="px-8 pt-[135px] pb-6">
				<button
					onClick={() => router.push('/admin/disciplines')}
					className="flex items-center gap-2 text-[#126E64] hover:underline mb-4"
				>
					<ArrowLeft className="w-5 h-5" />
					Back to Disciplines
				</button>
				<h1 className="text-2xl font-bold text-[#126E64]">{discipline.name}</h1>
			</div>

			{/* Statistics Cards */}
			<div className="px-8 mb-8">
				<div className="grid grid-cols-3 gap-6 mb-6">
					{/* Total Subdisciplines Card */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0">
						<CardContent className="p-5 flex items-center gap-4">
							<div className="w-14 h-14 rounded-full bg-[#F0A227]/20 flex items-center justify-center">
								<BookOpen className="w-7 h-7 text-[#F0A227]" />
							</div>
							<div className="text-right flex-1">
								<p className="text-base text-black mb-1">
									Total subdisciplines
								</p>
								<p className="text-2xl font-semibold text-[#989898]">
									{discipline.stats.totalSubdisciplines}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Active Subdisciplines Card */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0">
						<CardContent className="p-5 flex items-center gap-4">
							<div className="w-14 h-14 rounded-full bg-[#126E64]/20 flex items-center justify-center">
								<BookOpen className="w-7 h-7 text-[#126E64]" />
							</div>
							<div className="text-right flex-1">
								<p className="text-base text-black mb-1">
									Active subdisciplines
								</p>
								<p className="text-2xl font-semibold text-[#989898]">
									{discipline.stats.activeSubdisciplines}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Inactive Subdisciplines Card */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0">
						<CardContent className="p-5 flex items-center gap-4">
							<div className="w-14 h-14 rounded-full bg-[#D5D5D5]/20 flex items-center justify-center">
								<BookOpen className="w-7 h-7 text-[#D5D5D5]" />
							</div>
							<div className="text-right flex-1">
								<p className="text-base text-black mb-1">
									Inactive subdisciplines
								</p>
								<p className="text-2xl font-semibold text-[#989898]">
									{discipline.stats.inactiveSubdisciplines}
								</p>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Usage Statistics */}
				<div className="grid grid-cols-3 gap-6">
					{/* Linked Posts */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0">
						<CardContent className="p-5 flex items-center gap-4">
							<div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
								<BookOpen className="w-7 h-7 text-blue-600" />
							</div>
							<div className="text-right flex-1">
								<p className="text-base text-black mb-1">Linked posts</p>
								<p className="text-2xl font-semibold text-[#989898]">
									{discipline.stats.linkedPosts}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Linked Institutions */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0">
						<CardContent className="p-5 flex items-center gap-4">
							<div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
								<Building2 className="w-7 h-7 text-purple-600" />
							</div>
							<div className="text-right flex-1">
								<p className="text-base text-black mb-1">Linked institutions</p>
								<p className="text-2xl font-semibold text-[#989898]">
									{discipline.stats.linkedInstitutions}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Linked Applicants */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0">
						<CardContent className="p-5 flex items-center gap-4">
							<div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
								<Users className="w-7 h-7 text-green-600" />
							</div>
							<div className="text-right flex-1">
								<p className="text-base text-black mb-1">Linked applicants</p>
								<p className="text-2xl font-semibold text-[#989898]">
									{discipline.stats.linkedApplicants}
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Main Content */}
			<div className="px-8">
				{/* Add New Button */}
				<div className="mb-6 flex justify-end">
					<button
						onClick={() => setIsAddModalOpen(true)}
						className="bg-[#126E64] hover:bg-[#0f5850] text-white rounded-full px-6 py-3 flex items-center gap-2 text-base font-semibold transition-colors shadow-sm"
					>
						<Plus className="w-5 h-5" />
						Add Subdiscipline
					</button>
				</div>

				{/* Subdisciplines Table */}
				<div>
					<h2 className="text-2xl font-bold text-black mb-6">
						Subdisciplines ({discipline.subdisciplines.length} total)
					</h2>

					<AdminTable
						data={discipline.subdisciplines}
						columns={columns}
						currentPage={1}
						totalPages={1}
						totalItems={discipline.subdisciplines.length}
						itemsPerPage={discipline.subdisciplines.length}
						onPageChange={() => {}}
						emptyMessage="No subdisciplines found for this discipline."
					/>
				</div>
			</div>

			{/* Add Subdiscipline Modal */}
			<Modal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				title="Add Subdiscipline"
				maxWidth="lg"
			>
				<div className="space-y-6">
					{/* Discipline Name (Read-only) */}
					<div className="space-y-2">
						<label className="block text-sm font-semibold text-gray-700">
							Discipline
						</label>
						<div className="bg-gray-100 border-2 border-gray-200 rounded-[16px] px-4 py-3">
							<p className="text-base text-gray-600">{discipline.name}</p>
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
								value={newSubdisciplineName}
								onChange={(e) => setNewSubdisciplineName(e.target.value)}
								placeholder="Enter subdiscipline name"
								className="w-full text-base text-gray-900 outline-none bg-transparent"
							/>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-4 pt-4">
						<button
							onClick={handleAddSubdiscipline}
							disabled={isCreating || !newSubdisciplineName.trim()}
							className="flex-1 bg-[#126E64] hover:bg-[#0f5850] text-white rounded-[16px] px-6 py-3 text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						>
							{isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
							Create
						</button>
						<button
							onClick={() => {
								setIsAddModalOpen(false)
								setNewSubdisciplineName('')
							}}
							disabled={isCreating}
							className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-[16px] px-6 py-3 text-base font-semibold transition-colors disabled:opacity-50"
						>
							Cancel
						</button>
					</div>
				</div>
			</Modal>

			{/* Edit Subdiscipline Modal */}
			<Modal
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
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

					{/* Discipline (Read-only) */}
					<div className="space-y-2">
						<label className="block text-sm font-semibold text-gray-700">
							Discipline
						</label>
						<div className="bg-gray-100 border-2 border-gray-200 rounded-[16px] px-4 py-3">
							<p className="text-base text-gray-600">{discipline.name}</p>
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
							disabled={isUpdating}
							className="flex-1 bg-[#126E64] hover:bg-[#0f5850] text-white rounded-[16px] px-6 py-3 text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						>
							{isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
							Save Changes
						</button>
						<button
							onClick={() => setIsEditModalOpen(false)}
							disabled={isUpdating}
							className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-[16px] px-6 py-3 text-base font-semibold transition-colors disabled:opacity-50"
						>
							Cancel
						</button>
					</div>
				</div>
			</Modal>

			{/* Delete Confirmation Modal */}
			<Modal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				title="Delete Subdiscipline"
				maxWidth="md"
			>
				<div className="space-y-6">
					<div className="bg-red-50 border-2 border-red-200 rounded-[16px] p-4">
						<p className="text-base text-red-800">
							Are you sure you want to delete the subdiscipline{' '}
							<span className="font-semibold">
								&quot;{selectedSubdiscipline?.name}&quot;
							</span>
							?
						</p>
						<p className="text-sm text-red-600 mt-2">
							This will deactivate the subdiscipline.
						</p>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-4">
						<button
							onClick={handleConfirmDelete}
							disabled={isDeleting}
							className="flex-1 bg-[#E20000] hover:bg-[#cc0000] text-white rounded-[16px] px-6 py-3 text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						>
							{isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
							Delete
						</button>
						<button
							onClick={() => setIsDeleteModalOpen(false)}
							disabled={isDeleting}
							className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-[16px] px-6 py-3 text-base font-semibold transition-colors disabled:opacity-50"
						>
							Cancel
						</button>
					</div>
				</div>
			</Modal>
		</div>
	)
}
