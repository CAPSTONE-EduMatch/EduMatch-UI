// Custom hook for admin user management using our flexible API
'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'

// User interface matching our API response
export interface User {
	id: string
	name: string
	email: string
	status: 'active' | 'banned' | 'denied' | 'pending'
	role?: string
	createdAt: string
	banned: boolean
	banReason?: string
	banExpires?: string
	image?: string
	type?: string
	institutionStatus?: boolean
	verification_status?: string | null
	submitted_at?: string | null
	verified_at?: string | null
	verified_by?: string | null
	rejection_reason?: string | null
}

export interface UserFilters {
	search?: string
	status?: string // Can be "all", single status, or comma-separated multiple statuses
	role?: string
	userType?: 'applicant' | 'institution' | 'admin'
	sortBy?: 'name' | 'email' | 'createdAt'
	sortDirection?: 'asc' | 'desc'
	page?: number
	limit?: number
}

interface ApiResponse {
	success: boolean
	users: User[]
	total: number
	pagination: {
		currentPage: number
		totalPages: number
		totalCount: number
		limit: number
		hasNextPage: boolean
		hasPrevPage: boolean
	}
	filters: UserFilters
}

const DEFAULT_FILTERS: UserFilters = {
	search: '',
	status: 'all', // Can be "all", single status, or comma-separated multiple statuses
	sortBy: 'createdAt',
	sortDirection: 'desc',
	page: 1,
	limit: 10,
}

// Fetch users from our custom API
const fetchUsers = async (filters: UserFilters): Promise<ApiResponse> => {
	const params = new URLSearchParams()

	// Add all filter parameters to the URL
	Object.entries(filters).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			// For status, if it's an array, join with comma; otherwise use as string
			if (key === 'status' && Array.isArray(value)) {
				params.append(key, value.length > 0 ? value.join(',') : 'all')
			} else {
				params.append(key, value.toString())
			}
		}
	})

	const response = await fetch(`/api/admin/users?${params.toString()}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
	})

	if (!response.ok) {
		throw new Error(`Failed to fetch users: ${response.statusText}`)
	}

	const data = await response.json()

	if (!data.success) {
		throw new Error(data.message || 'Failed to fetch users')
	}

	return data
}

// Perform user actions (ban, unban, delete)
const performUserAction = async ({
	userId,
	action,
	reason,
	expiresIn,
}: {
	userId: string
	action: 'ban' | 'unban' | 'delete'
	reason?: string
	expiresIn?: number
}) => {
	const response = await fetch('/api/admin/users', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			userId,
			action,
			reason,
			expiresIn,
		}),
	})

	if (!response.ok) {
		throw new Error(`Failed to ${action} user: ${response.statusText}`)
	}

	const data = await response.json()

	if (!data.success) {
		throw new Error(data.message || `Failed to ${action} user`)
	}

	return data
}

// Generate stable query key for TanStack Query
const getUsersQueryKey = (filters: UserFilters) => ['admin-users', filters]

export function useAdminUserManagement() {
	const queryClient = useQueryClient()
	const [filters, setFilters] = useState<UserFilters>(DEFAULT_FILTERS)

	// Fetch users with TanStack Query
	const { data, isLoading, error, refetch } = useQuery({
		queryKey: getUsersQueryKey(filters),
		queryFn: () => fetchUsers(filters),
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 10, // 10 minutes
	})

	// Update filters function
	const updateFilters = useCallback((newFilters: Partial<UserFilters>) => {
		setFilters((prev) => ({
			...prev,
			...newFilters,
			// Reset to page 1 when filters change (except when only changing page)
			page: newFilters.page !== undefined ? newFilters.page : 1,
		}))
	}, [])

	// Set page function
	const setPage = useCallback((page: number) => {
		setFilters((prev) => ({
			...prev,
			page,
		}))
	}, [])

	// Ban user mutation
	const banUserMutation = useMutation({
		mutationFn: ({
			userId,
			reason,
			expiresIn,
		}: {
			userId: string
			reason?: string
			expiresIn?: number
		}) => performUserAction({ userId, action: 'ban', reason, expiresIn }),
		onSuccess: () => {
			// Invalidate and refetch users query
			queryClient.invalidateQueries({ queryKey: ['admin-users'] })
		},
	})

	// Unban user mutation
	const unbanUserMutation = useMutation({
		mutationFn: (userId: string) =>
			performUserAction({ userId, action: 'unban' }),
		onSuccess: () => {
			// Invalidate and refetch users query
			queryClient.invalidateQueries({ queryKey: ['admin-users'] })
		},
	})

	// Remove user mutation
	const removeUserMutation = useMutation({
		mutationFn: (userId: string) =>
			performUserAction({ userId, action: 'delete' }),
		onSuccess: () => {
			// Invalidate and refetch users query
			queryClient.invalidateQueries({ queryKey: ['admin-users'] })
		},
	})

	// Action functions
	const banUser = useCallback(
		async (userId: string, reason?: string, expiresIn?: number) => {
			await banUserMutation.mutateAsync({ userId, reason, expiresIn })
		},
		[banUserMutation]
	)

	const unbanUser = useCallback(
		async (userId: string) => {
			await unbanUserMutation.mutateAsync(userId)
		},
		[unbanUserMutation]
	)

	const removeUser = useCallback(
		async (userId: string) => {
			await removeUserMutation.mutateAsync(userId)
		},
		[removeUserMutation]
	)

	const refreshUsers = useCallback(async () => {
		await refetch()
	}, [refetch])

	return {
		users: data?.users || [],
		loading: isLoading,
		error: error?.message || null,
		total: data?.total || 0,
		pagination: data?.pagination,
		currentPage: filters.page || 1,
		filters,
		updateFilters,
		setPage,
		banUser,
		unbanUser,
		removeUser,
		refreshUsers,
		// Mutation states for UI feedback
		banningUser: banUserMutation.isPending,
		unbanningUser: unbanUserMutation.isPending,
		removingUser: removeUserMutation.isPending,
	}
}
