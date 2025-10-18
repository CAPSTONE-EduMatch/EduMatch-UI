'use client'

import { authClient } from '@/app/lib/auth-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'

// Extended User interface for admin management
export interface User {
	id: string
	name: string
	email: string
	status: 'activated' | 'deactivated' | 'pending' | 'rejected'
	appliedDate?: string
	degreeLevel?: string
	subDiscipline?: string
	abbreviation?: string
	type?: string
	country?: string
	role?: string
	createdAt: string
	updatedAt: string
	banned?: boolean
	banReason?: string
	banExpiresAt?: string
}

// Filtering and sorting parameters based on BetterAuth admin API
export interface UserFilters {
	searchValue?: string
	searchField?: 'email' | 'name'
	searchOperator?: 'contains' | 'starts_with' | 'ends_with'
	filterField?: string
	filterValue?: string | number | boolean
	filterOperator?: 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte'
	sortBy?: string
	sortDirection?: 'asc' | 'desc'
	limit?: number
	offset?: number
	// Extended filtering options
	roleFilter?: string
	statusFilter?: 'all' | 'activated' | 'deactivated'
	dateFrom?: string
	dateTo?: string
}

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_FILTERS: UserFilters = {
	searchValue: '',
	searchField: 'email',
	searchOperator: 'contains',
	sortBy: 'createdAt',
	sortDirection: 'desc',
	limit: DEFAULT_PAGE_SIZE,
	offset: 0,
}

// Transform BetterAuth user data to our User interface
const transformUser = (user: any): User => ({
	id: user.id,
	name: user.name || user.email?.split('@')[0] || 'Unknown',
	email: user.email,
	status: user.banned ? 'deactivated' : 'activated',
	appliedDate: new Date(user.createdAt).toLocaleDateString('en-GB'),
	degreeLevel: user.degreeLevel || 'Not specified',
	subDiscipline: user.subDiscipline || 'Not specified',
	abbreviation: user.name?.substring(0, 2).toUpperCase() || 'NA',
	type: user.role === 'institution' ? 'University' : undefined,
	country: user.country || 'Not specified',
	role: user.role || 'user',
	createdAt: user.createdAt,
	updatedAt: user.updatedAt,
	banned: Boolean(user.banned),
	banReason: user.banReason,
	banExpiresAt: user.banExpiresAt,
})

// Fetch users function
const fetchUsers = async (filters: UserFilters) => {
	// Build query parameters based on current filters
	const queryParams: any = {
		limit: filters.limit,
		offset: filters.offset,
		sortBy: filters.sortBy,
		sortDirection: filters.sortDirection,
	}

	// Add search parameters if search value exists
	if (filters.searchValue && filters.searchValue.trim()) {
		queryParams.searchValue = filters.searchValue.trim()
		queryParams.searchField = filters.searchField || 'name'
		queryParams.searchOperator = filters.searchOperator || 'contains'
	}

	// Add filter parameters if filter is set
	if (filters.filterField && filters.filterValue !== undefined) {
		queryParams.filterField = filters.filterField
		queryParams.filterValue = filters.filterValue
		queryParams.filterOperator = filters.filterOperator || 'eq'
	}

	const { data, error } = await authClient.admin.listUsers({
		query: queryParams,
	})

	if (error) {
		throw new Error(error.message || 'Failed to fetch users')
	}

	if (!data) {
		throw new Error('No data returned from server')
	}

	return {
		users: data.users.map(transformUser),
		total: data.total || data.users.length,
	}
}

// Generate stable query key for caching
const getUsersQueryKey = (filters: UserFilters) => [
	'users',
	{
		search: filters.searchValue?.trim() || '',
		searchField: filters.searchField,
		filterField: filters.filterField,
		filterValue: filters.filterValue,
		filterOperator: filters.filterOperator,
		sortBy: filters.sortBy,
		sortDirection: filters.sortDirection,
		limit: filters.limit,
		offset: filters.offset,
	},
]

// Hook for user management with TanStack Query
export function useUserManagement() {
	const queryClient = useQueryClient()
	const [filters, setFilters] = useState<UserFilters>(DEFAULT_FILTERS)
	const currentPage =
		Math.floor((filters.offset || 0) / (filters.limit || DEFAULT_PAGE_SIZE)) + 1

	// Query for fetching users
	const { data, isLoading, error, refetch } = useQuery({
		queryKey: getUsersQueryKey(filters),
		queryFn: () => fetchUsers(filters),
		enabled: true,
		staleTime: 2 * 60 * 1000, // 2 minutes
	})

	// Update filters function with stable reference
	const updateFilters = useCallback((newFilters: Partial<UserFilters>) => {
		setFilters((prev) => {
			const updated = { ...prev, ...newFilters }

			// Reset to first page if search/filter/sort changes
			if (
				newFilters.searchValue !== prev.searchValue ||
				newFilters.filterValue !== prev.filterValue ||
				newFilters.sortBy !== prev.sortBy ||
				newFilters.sortDirection !== prev.sortDirection
			) {
				updated.offset = 0
			}

			return updated
		})
	}, [])

	// Set page function
	const setPage = useCallback(
		(page: number) => {
			const offset = (page - 1) * (filters.limit || DEFAULT_PAGE_SIZE)
			setFilters((prev) => ({ ...prev, offset }))
		},
		[filters.limit]
	)

	// Ban user mutation
	const banUserMutation = useMutation({
		mutationFn: async ({
			userId,
			reason,
			expiresIn,
		}: {
			userId: string
			reason?: string
			expiresIn?: number
		}) => {
			await authClient.admin.banUser({
				userId,
				banReason: reason || 'Banned by admin',
				banExpiresIn: expiresIn,
			})
		},
		onSuccess: () => {
			// Invalidate and refetch users query
			queryClient.invalidateQueries({ queryKey: ['users'] })
		},
	})

	// Unban user mutation
	const unbanUserMutation = useMutation({
		mutationFn: async (userId: string) => {
			await authClient.admin.unbanUser({ userId })
		},
		onSuccess: () => {
			// Invalidate and refetch users query
			queryClient.invalidateQueries({ queryKey: ['users'] })
		},
	})

	// Remove user mutation
	const removeUserMutation = useMutation({
		mutationFn: async (userId: string) => {
			await authClient.admin.removeUser({ userId })
		},
		onSuccess: () => {
			// Invalidate and refetch users query
			queryClient.invalidateQueries({ queryKey: ['users'] })
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
		currentPage,
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

// Helper hook for specific user types (applicants/institutions)
export function useUserManagementByType(
	userType: 'applicants' | 'institutions'
) {
	const context = useUserManagement()

	// Filter users based on type
	const filteredUsers = context.users.filter((user) => {
		if (userType === 'institutions') {
			return user.type === 'University' || user.role === 'institution'
		} else {
			return !user.type && user.role !== 'institution'
		}
	})

	return {
		...context,
		users: filteredUsers,
		total: filteredUsers.length,
	}
}
