// Custom hook for admin post management
'use client'

import { PostStatus } from '@prisma/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'

// Post interface matching our API response
export interface Post {
	id: string
	title: string
	status: PostStatus
	postedBy: string
	institutionId: string
	postedDate: Date
	startDate: Date
	endDate?: Date | null
	type: 'Program' | 'Scholarship' | 'Job'
	location?: string | null
	degreeLevel: string
}

export interface PostFilters {
	search?: string
	status?: 'all' | PostStatus
	type?:
		| 'all'
		| 'Program'
		| 'Scholarship'
		| 'Job'
		| ('Program' | 'Scholarship' | 'Job')[]
	sortBy?: 'title' | 'create_at' | 'start_date'
	sortDirection?: 'asc' | 'desc'
	page?: number
	limit?: number
}

export interface PostStats {
	total: number
	published: number
	closed: number
	draft: number
	deleted: number
}

interface ApiResponse {
	success: boolean
	posts: Post[]
	stats: PostStats
	total: number
	pagination: {
		currentPage: number
		totalPages: number
		totalCount: number
		limit: number
		hasNextPage: boolean
		hasPrevPage: boolean
	}
	filters: PostFilters
}

const DEFAULT_FILTERS: PostFilters = {
	search: '',
	status: 'all',
	type: 'all',
	sortBy: 'create_at',
	sortDirection: 'desc',
	page: 1,
	limit: 10,
}

// Fetch posts from our custom API
const fetchPosts = async (filters: PostFilters): Promise<ApiResponse> => {
	const params = new URLSearchParams()

	// Add all filter parameters to the URL
	Object.entries(filters).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			params.append(key, value.toString())
		}
	})

	const response = await fetch(`/api/admin/posts?${params.toString()}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
	})

	if (!response.ok) {
		throw new Error(`Failed to fetch posts: ${response.statusText}`)
	}

	const data = await response.json()

	if (!data.success) {
		throw new Error(data.message || 'Failed to fetch posts')
	}

	return data
}

// Update post status
const updatePostStatus = async ({
	postId,
	status,
}: {
	postId: string
	status: PostStatus
}) => {
	const response = await fetch('/api/admin/posts', {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ postId, status }),
	})

	if (!response.ok) {
		throw new Error(`Failed to update post: ${response.statusText}`)
	}

	const data = await response.json()

	if (!data.success) {
		throw new Error(data.message || 'Failed to update post')
	}

	return data
}

export const useAdminPostManagement = () => {
	const queryClient = useQueryClient()
	const [filters, setFilters] = useState<PostFilters>(DEFAULT_FILTERS)

	// Fetch posts query
	const {
		data,
		isLoading,
		error,
		refetch: refetchPosts,
	} = useQuery({
		queryKey: ['admin-posts', filters],
		queryFn: () => fetchPosts(filters),
		staleTime: 0, // Always consider data stale for admin pages
		refetchOnMount: 'always', // Always refetch when component mounts
	})

	// Update post status mutation
	const updateStatusMutation = useMutation({
		mutationFn: updatePostStatus,
		onSuccess: () => {
			// Invalidate and refetch posts
			queryClient.invalidateQueries({ queryKey: ['admin-posts'] })
		},
	})

	// Helper function to update filters
	const updateFilters = useCallback((newFilters: Partial<PostFilters>) => {
		setFilters((prev) => ({
			...prev,
			...newFilters,
			// Reset to page 1 when filters change (except when changing page)
			page: newFilters.page !== undefined ? newFilters.page : 1,
		}))
	}, [])

	// Helper function to reset filters
	const resetFilters = useCallback(() => {
		setFilters(DEFAULT_FILTERS)
	}, [])

	// Helper function to change page
	const changePage = useCallback((page: number) => {
		setFilters((prev) => ({ ...prev, page }))
	}, [])

	// Helper function to update post status
	const updateStatus = useCallback(
		(postId: string, status: PostStatus) => {
			return updateStatusMutation.mutateAsync({ postId, status })
		},
		[updateStatusMutation]
	)

	return {
		// Data
		posts: data?.posts || [],
		stats: data?.stats || {
			total: 0,
			published: 0,
			closed: 0,
			draft: 0,
			deleted: 0,
		},
		pagination: data?.pagination || {
			currentPage: 1,
			totalPages: 1,
			totalCount: 0,
			limit: 10,
			hasNextPage: false,
			hasPrevPage: false,
		},
		total: data?.total || 0,

		// State
		filters,
		isLoading,
		error: error as Error | null,
		isUpdating: updateStatusMutation.isPending,

		// Actions
		updateFilters,
		resetFilters,
		changePage,
		refetchPosts,
		updateStatus,
	}
}
