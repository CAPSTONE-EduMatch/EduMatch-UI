'use client'

import { SupportModal } from '@/components/admin/SupportModal'
import { SupportTable } from '@/components/admin/SupportTable'
import {
	SupportFilters,
	SupportRequest,
} from '@/services/admin/support-service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, MessageSquare } from 'lucide-react'
import { useState } from 'react'

// Fetch function for support data
const fetchSupportData = async (filters: SupportFilters) => {
	const searchParams = new URLSearchParams()

	if (filters.search) searchParams.set('search', filters.search)
	if (filters.status && filters.status !== 'all')
		searchParams.set('status', filters.status)
	if (filters.sortBy) searchParams.set('sortBy', filters.sortBy)
	if (filters.page) searchParams.set('page', filters.page.toString())
	if (filters.limit) searchParams.set('limit', filters.limit.toString())

	const response = await fetch(`/api/admin/support?${searchParams.toString()}`)

	if (!response.ok) {
		throw new Error('Failed to fetch support data')
	}

	return response.json()
}

// Reply function for support requests
const replyToSupportRequest = async ({
	id,
	message,
}: {
	id: string
	message: string
}) => {
	const response = await fetch(`/api/admin/support/${id}/reply`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ message }),
	})

	if (!response.ok) {
		throw new Error('Failed to send reply')
	}

	return response.json()
}

export default function SupportManagementPage() {
	const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(
		null
	)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [modalMode, setModalMode] = useState<'view' | 'reply'>('view')
	const [filters, setFilters] = useState<SupportFilters>({
		page: 1,
		limit: 10,
		search: '',
		status: 'all',
		sortBy: 'newest',
	})

	const queryClient = useQueryClient()

	// Use TanStack Query for data fetching
	const {
		data: response,
		isLoading: loading,
		error,
	} = useQuery({
		queryKey: ['support-data', filters],
		queryFn: () => fetchSupportData(filters),
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	})

	// Mutation for replying to support requests
	const replyMutation = useMutation({
		mutationFn: replyToSupportRequest,
		onSuccess: () => {
			// Invalidate and refetch support data
			queryClient.invalidateQueries({ queryKey: ['support-data'] })
		},
	})

	const supportData = response?.data || []
	const stats = response?.stats || { total: 0, pending: 0, replied: 0 }
	const pagination = response?.pagination || null

	const handlePageChange = (page: number) => {
		setFilters((prev) => ({ ...prev, page }))
	}

	const handleFilterChange = (newFilters: {
		search?: string
		status?: string
		sortBy?: string
	}) => {
		setFilters((prev) => ({
			...prev,
			search: newFilters.search,
			status: newFilters.status as 'all' | 'pending' | 'replied' | undefined,
			sortBy: newFilters.sortBy as 'newest' | 'oldest' | undefined,
			page: 1,
		})) // Reset to page 1 when filters change
	}

	// Statistics from API
	const totalRequests = stats?.total || 0
	const pendingRequests = stats?.pending || 0
	const repliedRequests = stats?.replied || 0

	const handleViewSupport = (request: SupportRequest) => {
		setSelectedRequest(request)
		setModalMode('view')
		setIsModalOpen(true)
	}

	const handleReplySupport = (request: SupportRequest) => {
		setSelectedRequest(request)
		setModalMode('reply')
		setIsModalOpen(true)
	}

	const handleCloseModal = () => {
		setIsModalOpen(false)
		setSelectedRequest(null)
	}

	const handleSendReply = async (replyMessage: string) => {
		if (!selectedRequest) return

		try {
			await replyMutation.mutateAsync({
				id: selectedRequest.id,
				message: replyMessage,
			})
			handleCloseModal()
		} catch (error) {
			// Handle error silently - you can add toast notification here
			// Error handling here
		}
	}

	return (
		<div className="min-h-screen bg-gray-50 p-6">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="mb-8"
				>
					<h1 className="text-3xl font-bold text-[#126E64] mb-2">
						Administrator
					</h1>
				</motion.div>

				{/* Statistics Cards */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
				>
					<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
								<MessageSquare className="w-6 h-6 text-orange-600" />
							</div>
							<div>
								<p className="text-sm text-gray-600 mb-1">Total requests</p>
								<p className="text-2xl font-bold text-gray-900">
									{totalRequests}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center">
								<Clock className="w-6 h-6 text-teal-600" />
							</div>
							<div>
								<p className="text-sm text-gray-600 mb-1">Pending requests</p>
								<p className="text-2xl font-bold text-gray-900">
									{pendingRequests}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
								<CheckCircle className="w-6 h-6 text-blue-600" />
							</div>
							<div>
								<p className="text-sm text-gray-600 mb-1">Replied requests</p>
								<p className="text-2xl font-bold text-gray-900">
									{repliedRequests}
								</p>
							</div>
						</div>
					</div>
				</motion.div>

				{/* Support Table */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
				>
					{loading ? (
						<div className="flex items-center justify-center p-8">
							<div className="text-gray-500">Loading support requests...</div>
						</div>
					) : error ? (
						<div className="flex items-center justify-center p-8">
							<div className="text-red-500">Error: {error.message}</div>
						</div>
					) : (
						<SupportTable
							data={supportData}
							onViewSupport={handleViewSupport}
							onReplySupport={handleReplySupport}
							pagination={pagination}
							onPageChange={handlePageChange}
							onFiltersChange={handleFilterChange}
						/>
					)}
				</motion.div>

				{/* Support Modal */}
				<SupportModal
					isOpen={isModalOpen}
					onClose={handleCloseModal}
					request={selectedRequest}
					mode={modalMode}
					onSendReply={handleSendReply}
				/>
			</div>
		</div>
	)
}
