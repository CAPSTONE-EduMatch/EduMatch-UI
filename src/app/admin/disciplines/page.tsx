'use client'

import { AdminTable } from '@/components/admin/AdminTable'
import { SearchAndFilter } from '@/components/profile/institution/components/SearchAndFilter'
import { Card, CardContent } from '@/components/ui'
import Modal from '@/components/ui/modals/Modal'
import { useDebouncedValue } from '@/hooks'
import type { Discipline } from '@/hooks/admin/useAdminDisciplines'
import { useAdminDisciplines } from '@/hooks/admin/useAdminDisciplines'
import {
	ChevronRight,
	Loader2,
	Pencil,
	Plus,
	Trash2,
	Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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

export default function AdminDisciplinesPage() {
	const router = useRouter()
	const {
		disciplines,
		stats,
		pagination,
		isLoading,
		updateFilters,
		setPage,
		updateDiscipline,
		deleteDiscipline,
		isUpdating,
		isDeleting,
	} = useAdminDisciplines()

	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<string[]>([])
	const [sortBy, setSortBy] = useState('name-asc')
	const [selectedDiscipline, setSelectedDiscipline] =
		useState<Discipline | null>(null)
	const [isEditModalOpen, setIsEditModalOpen] = useState(false)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

	// Edit form state
	const [editedName, setEditedName] = useState('')
	const [editedStatus, setEditedStatus] = useState<'Active' | 'Inactive'>(
		'Active'
	)

	// Debounce search with 500ms delay
	const debouncedSearchQuery = useDebouncedValue(searchQuery, 500)

	// Update filters when debounced search/status/sort changes
	useEffect(() => {
		const statusValue =
			statusFilter.length === 0
				? 'all'
				: statusFilter.length === 1
					? statusFilter[0].toLowerCase()
					: 'all'

		const sortDirection = sortBy.includes('desc') ? 'desc' : 'asc'
		const sortField = sortBy.includes('name') ? 'name' : 'name'

		updateFilters({
			search: debouncedSearchQuery,
			status: statusValue as 'all' | 'active' | 'inactive',
			sortBy: sortField,
			sortDirection,
		})
	}, [debouncedSearchQuery, statusFilter, sortBy, updateFilters])

	const handleEdit = (discipline: Discipline) => {
		setSelectedDiscipline(discipline)
		setEditedName(discipline.name)
		setEditedStatus(discipline.status)
		setIsEditModalOpen(true)
	}

	const handleDelete = (discipline: Discipline) => {
		setSelectedDiscipline(discipline)
		setIsDeleteModalOpen(true)
	}

	const handleSaveChanges = async () => {
		if (!selectedDiscipline) return

		await updateDiscipline(selectedDiscipline.id, {
			name: editedName,
			status: editedStatus,
		})
		setIsEditModalOpen(false)
		setSelectedDiscipline(null)
	}

	const handleConfirmDelete = async () => {
		if (!selectedDiscipline) return

		await deleteDiscipline(selectedDiscipline.id)
		setIsDeleteModalOpen(false)
		setSelectedDiscipline(null)
	}

	const handleViewDetails = (discipline: Discipline) => {
		router.push(`/admin/disciplines/${discipline.id}`)
	}

	// Define table columns
	const columns = [
		{
			header: 'ID',
			accessor: 'id' as keyof Discipline,
			className: '70px',
		},
		{
			header: 'Discipline name',
			accessor: ((discipline: Discipline) => (
				<div className="text-left font-semibold text-base text-black group relative">
					<div className="truncate">{discipline.name}</div>
					<div className="absolute left-0 top-full mt-1 px-3 py-2 bg-gray-800 text-white text-sm rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 whitespace-normal max-w-xs pointer-events-none">
						{discipline.name}
					</div>
				</div>
			)) as (_discipline: Discipline) => React.ReactNode,
			className: 'minmax(200px, 1.5fr)',
		},
		{
			header: 'Subdisciplines',
			accessor: ((discipline: Discipline) => (
				<div className="text-gray-700 text-sm text-center">
					{discipline.subdisciplineCount}
				</div>
			)) as (_discipline: Discipline) => React.ReactNode,
			className: '120px',
		},
		{
			header: 'Status',
			accessor: ((discipline: Discipline) => (
				<span
					className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(
						discipline.status
					)}`}
				>
					{discipline.status}
				</span>
			)) as (_discipline: Discipline) => React.ReactNode,
			className: '110px',
		},
		{
			header: 'Actions',
			accessor: ((discipline: Discipline) => (
				<div className="flex items-center justify-center gap-2">
					<button
						onClick={() => handleEdit(discipline)}
						className="p-2 text-[#126E64] hover:bg-[#126E64]/10 rounded-lg transition-colors"
						title="Edit discipline"
					>
						<Pencil className="w-4 h-4" />
					</button>
					<button
						onClick={() => handleDelete(discipline)}
						className="p-2 text-[#E20000] hover:bg-[#E20000]/10 rounded-lg transition-colors"
						title="Delete discipline"
					>
						<Trash2 className="w-4 h-4" />
					</button>
					<button
						onClick={() => handleViewDetails(discipline)}
						className="flex items-center gap-1 text-[#126E64] hover:underline text-sm"
					>
						<span>View Details</span>
						<ChevronRight className="w-4 h-4" />
					</button>
				</div>
			)) as (_discipline: Discipline) => React.ReactNode,
			className: 'minmax(200px, 1fr)',
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
					{/* Total Disciplines Card */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0 flex-1">
						<CardContent className="p-5 flex items-center gap-4">
							<div className="w-14 h-14 rounded-full bg-[#F0A227]/20 flex items-center justify-center">
								<Users className="w-7 h-7 text-[#F0A227]" />
							</div>
							<div className="text-right flex-1">
								<p className="text-base text-black mb-1">Total disciplines</p>
								<p className="text-2xl font-semibold text-[#989898]">
									{isLoading ? (
										<Loader2 className="w-5 h-5 animate-spin" />
									) : (
										stats.total
									)}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Active Disciplines Card */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0 flex-1">
						<CardContent className="p-5 flex items-center gap-4">
							<div className="w-14 h-14 rounded-full bg-[#126E64]/20 flex items-center justify-center">
								<Users className="w-7 h-7 text-[#126E64]" />
							</div>
							<div className="text-right flex-1">
								<p className="text-base text-black mb-1">Active disciplines</p>
								<p className="text-2xl font-semibold text-[#989898]">
									{isLoading ? (
										<Loader2 className="w-5 h-5 animate-spin" />
									) : (
										stats.active
									)}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Inactive Disciplines Card */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0 flex-1">
						<CardContent className="p-5 flex items-center gap-4">
							<div className="w-14 h-14 rounded-full bg-[#D5D5D5]/20 flex items-center justify-center">
								<Users className="w-7 h-7 text-[#D5D5D5]" />
							</div>
							<div className="text-right flex-1">
								<p className="text-base text-black mb-1">
									Inactive disciplines
								</p>
								<p className="text-2xl font-semibold text-[#989898]">
									{isLoading ? (
										<Loader2 className="w-5 h-5 animate-spin" />
									) : (
										stats.inactive
									)}
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Main Content */}
			<div className="px-8">
				{/* Search and Filters */}
				<SearchAndFilter
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					statusFilter={statusFilter}
					onStatusFilterChange={setStatusFilter}
					sortBy={sortBy}
					onSortChange={setSortBy}
					statusOptions={[
						{ value: 'Active', label: 'Active' },
						{ value: 'Inactive', label: 'Inactive' },
					]}
					sortOptions={[
						{ value: 'name-asc', label: 'Name A-Z' },
						{ value: 'name-desc', label: 'Name Z-A' },
					]}
					searchPlaceholder="Search by discipline name..."
				/>

				{/* Add New Button */}
				<div className="mb-6 flex justify-end">
					<button
						onClick={() => router.push('/admin/disciplines/create')}
						className="bg-[#126E64] hover:bg-[#0f5850] text-white rounded-full px-6 py-3 flex items-center gap-2 text-base font-semibold transition-colors shadow-sm"
					>
						<Plus className="w-5 h-5" />
						Add New
					</button>
				</div>

				{/* Disciplines Table */}
				<div>
					<h2 className="text-2xl font-bold text-black mb-6">
						Disciplines ({pagination.totalCount} total)
					</h2>

					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="w-8 h-8 animate-spin text-[#126E64]" />
						</div>
					) : (
						<AdminTable
							data={disciplines}
							columns={columns}
							currentPage={pagination.currentPage}
							totalPages={pagination.totalPages}
							totalItems={pagination.totalCount}
							itemsPerPage={pagination.limit}
							onPageChange={setPage}
							emptyMessage="No disciplines found matching your criteria."
						/>
					)}
				</div>
			</div>

			{/* Edit Modal */}
			<Modal
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				title="Edit Discipline"
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
								{selectedDiscipline?.id}
							</p>
						</div>
					</div>

					{/* Discipline Name */}
					<div className="space-y-2">
						<label className="block text-sm font-semibold text-gray-700">
							Discipline Name
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

					{/* Subdiscipline Count (Read-only) */}
					<div className="space-y-2">
						<label className="block text-sm font-semibold text-gray-700">
							Subdisciplines Count
						</label>
						<div className="bg-gray-100 border-2 border-gray-200 rounded-[16px] px-4 py-3">
							<p className="text-base text-gray-600">
								{selectedDiscipline?.subdisciplineCount}
							</p>
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
				title="Delete Discipline"
				maxWidth="md"
			>
				<div className="space-y-6">
					<div className="bg-red-50 border-2 border-red-200 rounded-[16px] p-4">
						<p className="text-base text-red-800">
							Are you sure you want to delete the discipline{' '}
							<span className="font-semibold">
								&quot;{selectedDiscipline?.name}&quot;
							</span>
							?
						</p>
						<p className="text-sm text-red-600 mt-2">
							This will deactivate the discipline and all{' '}
							<span className="font-semibold">
								{selectedDiscipline?.subdisciplineCount} subdiscipline(s)
							</span>{' '}
							under it.
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
