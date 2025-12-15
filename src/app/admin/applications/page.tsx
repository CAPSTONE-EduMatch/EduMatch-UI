'use client'

import { AdminTable } from '@/components/admin/AdminTable'
import { SearchAndFilter } from '@/components/profile/institution/components/SearchAndFilter'
import { Card, CardContent } from '@/components/ui'
import { useDebouncedValue } from '@/hooks'
import { useAdminApplications } from '@/hooks/admin'
import { useAdminAuth } from '@/hooks/auth/useAdminAuth'
import { ApplicationStatus } from '@prisma/client'
import {
	Check,
	CheckCircle2,
	ChevronRight,
	Clock,
	Copy,
	FileText,
	XCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Application {
	id: string
	applicantName: string
	postTitle: string
	institutionName: string
	appliedDate: Date
	status: ApplicationStatus
	reapplyCount: number
}

const getStatusColor = (status: ApplicationStatus) => {
	switch (status) {
		case 'SUBMITTED':
			return 'bg-blue-100 text-blue-800'
		case 'PROGRESSING':
			return 'bg-yellow-100 text-yellow-800'
		case 'ACCEPTED':
			return 'bg-green-100 text-green-800'
		case 'REJECTED':
			return 'bg-red-100 text-red-800'
		default:
			return 'bg-gray-100 text-gray-800'
	}
}

const getStatusLabel = (status: ApplicationStatus) => {
	switch (status) {
		case 'SUBMITTED':
			return 'Submitted'
		case 'PROGRESSING':
			return 'Progressing'
		case 'ACCEPTED':
			return 'Accepted'
		case 'REJECTED':
			return 'Rejected'
		default:
			return status
	}
}

export default function AdminApplicationsPage() {
	const router = useRouter()
	const { isAdmin, isLoading: authLoading } = useAdminAuth()
	const {
		applications,
		stats,
		pagination,
		filters,
		isLoading,
		setSearch,
		setStatus,
		setPage,
		setSortBy,
	} = useAdminApplications()

	const [searchInput, setSearchInput] = useState(filters.search || '')
	const [statusFilter, setStatusFilter] = useState<string[]>(
		filters.status && filters.status !== 'all' ? [filters.status] : []
	)
	const [localSortBy, setLocalSortBy] = useState(filters.sortBy || 'newest')

	// Debounce search with 500ms delay
	const debouncedSearchInput = useDebouncedValue(searchInput, 500)

	// Update search filter when debounced value changes
	useEffect(() => {
		setSearch(debouncedSearchInput)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedSearchInput])

	// Update status filter when statusFilter changes
	useEffect(() => {
		if (statusFilter.length === 1) {
			setStatus(statusFilter[0] as ApplicationStatus)
		} else {
			setStatus('all')
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [statusFilter])

	// Update sort filter when localSortBy changes
	useEffect(() => {
		setSortBy(localSortBy as 'newest' | 'oldest' | 'name' | 'status')
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [localSortBy])

	// Component for ID cell with copy functionality
	const IdCell = ({ id }: { id: string }) => {
		const [copied, setCopied] = useState(false)

		const shortId = id.length > 8 ? `${id.substring(0, 8)}...` : id

		const handleCopy = async () => {
			try {
				await navigator.clipboard.writeText(id)
				setCopied(true)
				setTimeout(() => setCopied(false), 2000)
			} catch (err) {
				// eslint-disable-next-line no-console
				console.error('Failed to copy:', err)
			}
		}

		return (
			<div className="flex items-center gap-2">
				<span className="text-sm text-gray-700 font-mono">{shortId}</span>
				<button
					onClick={handleCopy}
					className="p-1 hover:bg-gray-100 rounded transition-colors"
					title="Copy full ID"
				>
					{copied ? (
						<Check className="w-4 h-4 text-green-600" />
					) : (
						<Copy className="w-4 h-4 text-gray-500 hover:text-gray-700" />
					)}
				</button>
			</div>
		)
	}

	// Define table columns
	const columns = [
		{
			header: 'Application ID',
			accessor: ((app: Application) => <IdCell id={app.id} />) as (
				_app: Application
			) => React.ReactNode,
			className: '150px',
		},
		{
			header: 'Applicant Name',
			accessor: ((app: Application) => (
				<div className="text-left font-medium text-sm text-gray-900">
					{app.applicantName}
				</div>
			)) as (_app: Application) => React.ReactNode,
			className: 'minmax(150px, 1fr)',
		},
		{
			header: 'Post Name',
			accessor: ((app: Application) => (
				<div className="text-left text-sm text-gray-700 group relative">
					<div className="truncate">{app.postTitle}</div>
					<div className="absolute left-0 top-full mt-1 px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 whitespace-normal max-w-xs pointer-events-none">
						{app.postTitle}
					</div>
				</div>
			)) as (_app: Application) => React.ReactNode,
			className: 'minmax(200px, 1.5fr)',
		},
		{
			header: 'Institution',
			accessor: ((app: Application) => (
				<div className="text-left text-sm text-gray-700 group relative">
					<div className="truncate">{app.institutionName}</div>
					<div className="absolute left-0 top-full mt-1 px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 whitespace-nowrap pointer-events-none">
						{app.institutionName}
					</div>
				</div>
			)) as (_app: Application) => React.ReactNode,
			className: 'minmax(150px, 1fr)',
		},
		{
			header: 'Applied Date',
			accessor: ((app: Application) => (
				<div className="text-gray-700 text-sm text-center">
					{new Date(app.appliedDate).toLocaleDateString()}
				</div>
			)) as (_app: Application) => React.ReactNode,
			className: '110px',
		},
		{
			header: 'Status',
			accessor: ((app: Application) => (
				<span
					className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusColor(
						app.status
					)}`}
				>
					{getStatusLabel(app.status)}
				</span>
			)) as (_app: Application) => React.ReactNode,
			className: '120px',
		},
		// {
		// 	header: 'Reapply Count',
		// 	accessor: ((app: Application) => (
		// 		<div className="text-gray-700 text-sm text-center">
		// 			{app.reapplyCount}
		// 		</div>
		// 	)) as (_app: Application) => React.ReactNode,
		// 	className: '110px',
		// },
		{
			header: 'Actions',
			accessor: ((app: Application) => (
				<button
					onClick={() => router.push(`/admin/applications/${app.id}`)}
					className="flex items-center justify-center gap-1 text-[#126E64] hover:underline text-sm mx-auto"
				>
					<span>View Details</span>
					<ChevronRight className="w-4 h-4" />
				</button>
			)) as (_app: Application) => React.ReactNode,
			className: '130px',
		},
	]

	// Loading state
	if (authLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-[#F5F7FB]">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#126E64]"></div>
			</div>
		)
	}

	// Redirect if not admin
	if (!isAdmin) {
		router.push('/signin')
		return null
	}

	return (
		<div className="min-h-screen bg-[#F5F7FB] pb-12">
			{/* Header Section */}
			<div className="px-8 pt-[35px] pb-6">
				<h1 className="text-2xl font-bold text-[#126E64]">
					Application Management
				</h1>
			</div>

			{/* Statistics Cards */}
			<div className="px-8 mb-8">
				<div className="grid grid-cols-4 gap-6">
					{/* Submitted Applications Card */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0">
						<CardContent className="p-5 flex items-center gap-4">
							<div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
								<FileText className="w-7 h-7 text-blue-600" />
							</div>
							<div className="text-right flex-1">
								<p className="text-sm text-gray-600 mb-1">Submitted</p>
								<p className="text-2xl font-semibold text-gray-900">
									{stats.submitted}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Progressing Applications Card */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0">
						<CardContent className="p-5 flex items-center gap-4">
							<div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center">
								<Clock className="w-7 h-7 text-yellow-600" />
							</div>
							<div className="text-right flex-1">
								<p className="text-sm text-gray-600 mb-1">Progressing</p>
								<p className="text-2xl font-semibold text-gray-900">
									{stats.progressing}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Accepted Applications Card */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0">
						<CardContent className="p-5 flex items-center gap-4">
							<div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
								<CheckCircle2 className="w-7 h-7 text-green-600" />
							</div>
							<div className="text-right flex-1">
								<p className="text-sm text-gray-600 mb-1">Accepted</p>
								<p className="text-2xl font-semibold text-gray-900">
									{stats.accepted}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Rejected Applications Card */}
					<Card className="bg-white rounded-[20px] shadow-sm border-0">
						<CardContent className="p-5 flex items-center gap-4">
							<div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
								<XCircle className="w-7 h-7 text-red-600" />
							</div>
							<div className="text-right flex-1">
								<p className="text-sm text-gray-600 mb-1">Rejected</p>
								<p className="text-2xl font-semibold text-gray-900">
									{stats.rejected}
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Main Content */}
			<div className="px-8">
				{/* Search and Filter */}
				<div className="mb-6">
					<SearchAndFilter
						searchQuery={searchInput}
						onSearchChange={setSearchInput}
						statusFilter={statusFilter}
						onStatusFilterChange={setStatusFilter}
						sortBy={localSortBy}
						onSortChange={(sort: string) =>
							setLocalSortBy(sort as 'newest' | 'oldest' | 'name' | 'status')
						}
						searchPlaceholder="Search by applicant name, post title, institution..."
						statusOptions={[
							{ value: 'SUBMITTED', label: 'Submitted' },
							{ value: 'PROGRESSING', label: 'Progressing' },
							{ value: 'ACCEPTED', label: 'Accepted' },
							{ value: 'REJECTED', label: 'Rejected' },
						]}
						sortOptions={[
							{ value: 'newest', label: 'Newest First' },
							{ value: 'oldest', label: 'Oldest First' },
							{ value: 'status', label: 'By Status' },
						]}
					/>
				</div>

				{/* Applications Table */}
				<div>
					<h2 className="text-2xl font-bold text-black mb-6 mt-4">
						Applications ({pagination.totalCount} total)
					</h2>

					<AdminTable
						data={applications}
						columns={columns}
						currentPage={pagination.currentPage}
						totalPages={pagination.totalPages}
						totalItems={pagination.totalCount}
						itemsPerPage={pagination.limit}
						onPageChange={setPage}
						emptyMessage={
							isLoading
								? 'Loading applications...'
								: 'No applications found matching your criteria.'
						}
					/>
				</div>
			</div>
		</div>
	)
}
