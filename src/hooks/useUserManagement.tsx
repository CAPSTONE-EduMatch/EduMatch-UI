import { authClient } from '@/app/lib/auth-client'
import {
	createContext,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react'

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

export interface UserManagementState {
	users: User[]
	loading: boolean
	error: string | null
	total: number
	currentPage: number
	pageSize: number
	filters: UserFilters
}

export interface UserManagementActions {
	fetchUsers: () => Promise<void>
	updateFilters: (newFilters: Partial<UserFilters>) => void
	setPage: (newPage: number) => void
	banUser: (
		userId: string,
		reason?: string,
		expiresIn?: number
	) => Promise<void>
	unbanUser: (userId: string) => Promise<void>
	removeUser: (userId: string) => Promise<void>
	refreshUsers: () => Promise<void>
}

export interface UserManagementContextType
	extends UserManagementState,
		UserManagementActions {}

// Context7 pattern - Create context for user management
const UserManagementContext = createContext<UserManagementContextType | null>(
	null
)

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_FILTERS: UserFilters = {
	searchValue: '',
	searchField: 'name',
	searchOperator: 'contains',
	sortBy: 'createdAt',
	sortDirection: 'desc',
	limit: DEFAULT_PAGE_SIZE,
	offset: 0,
}

// Context Provider Component
export function UserManagementProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<UserManagementState>({
		users: [],
		loading: false,
		error: null,
		total: 0,
		currentPage: 1,
		pageSize: DEFAULT_PAGE_SIZE,
		filters: DEFAULT_FILTERS,
	})

	// Fetch users using BetterAuth admin API
	const fetchUsers = useCallback(async () => {
		setState((prev) => ({ ...prev, loading: true, error: null }))

		try {
			// Build query parameters based on current filters
			const queryParams: any = {
				limit: state.filters.limit,
				offset: state.filters.offset,
				sortBy: state.filters.sortBy,
				sortDirection: state.filters.sortDirection,
			}

			// Add search parameters if search value exists
			if (state.filters.searchValue && state.filters.searchValue.trim()) {
				queryParams.searchValue = state.filters.searchValue.trim()
				queryParams.searchField = state.filters.searchField || 'name'
				queryParams.searchOperator = state.filters.searchOperator || 'contains'
			}

			// Add filter parameters if filter is set
			if (
				state.filters.filterField &&
				state.filters.filterValue !== undefined
			) {
				queryParams.filterField = state.filters.filterField
				queryParams.filterValue = state.filters.filterValue
				queryParams.filterOperator = state.filters.filterOperator || 'eq'
			}

			const { data, error } = await authClient.admin.listUsers({
				query: queryParams,
			})

			if (error) {
				setState((prev) => ({
					...prev,
					loading: false,
					error: error.message || 'Failed to fetch users',
				}))
				return
			}

			if (data) {
				// Transform BetterAuth user data to our User interface
				const transformedUsers: User[] = data.users.map((user: any) => ({
					id: user.id,
					name: user.name || user.email?.split('@')[0] || 'Unknown',
					email: user.email,
					status: user.banned ? 'deactivated' : 'activated', // Keep for backward compatibility
					appliedDate: new Date(user.createdAt).toLocaleDateString('en-GB'),
					degreeLevel: user.degreeLevel || 'Not specified',
					subDiscipline: user.subDiscipline || 'Not specified',
					abbreviation: user.name?.substring(0, 2).toUpperCase() || 'NA',
					type: user.role === 'institution' ? 'University' : undefined,
					country: user.country || 'Not specified',
					role: user.role || 'user',
					createdAt: user.createdAt,
					updatedAt: user.updatedAt,
					banned: Boolean(user.banned), // Ensure it's always a boolean
					banReason: user.banReason,
					banExpiresAt: user.banExpiresAt,
				}))

				setState((prev) => ({
					...prev,
					users: transformedUsers,
					total: data.total || transformedUsers.length,
					loading: false,
				}))
			}
		} catch (err) {
			setState((prev) => ({
				...prev,
				loading: false,
				error: err instanceof Error ? err.message : 'An unknown error occurred',
			}))
		}
	}, [state.filters])

	// Update filters and reset to first page
	const updateFilters = useCallback((newFilters: Partial<UserFilters>) => {
		setState((prev) => ({
			...prev,
			filters: {
				...prev.filters,
				...newFilters,
				offset:
					newFilters.searchValue !== prev.filters.searchValue ||
					newFilters.filterValue !== prev.filters.filterValue ||
					newFilters.sortBy !== prev.filters.sortBy ||
					newFilters.sortDirection !== prev.filters.sortDirection
						? 0
						: prev.filters.offset, // Reset to first page if search/filter/sort changes
			},
			currentPage:
				newFilters.searchValue !== prev.filters.searchValue ||
				newFilters.filterValue !== prev.filters.filterValue ||
				newFilters.sortBy !== prev.filters.sortBy ||
				newFilters.sortDirection !== prev.filters.sortDirection
					? 1
					: prev.currentPage,
		}))
	}, [])

	// Set current page and update offset
	const setPage = useCallback(
		(page: number) => {
			const offset = (page - 1) * state.pageSize
			setState((prev) => ({
				...prev,
				currentPage: page,
				filters: { ...prev.filters, offset },
			}))
		},
		[state.pageSize]
	)

	// Ban user using BetterAuth admin API
	const banUser = useCallback(
		async (userId: string, reason = 'Banned by admin', expiresIn?: number) => {
			try {
				await authClient.admin.banUser({
					userId,
					banReason: reason,
					banExpiresIn: expiresIn,
				})

				// Update local state
				setState((prev) => ({
					...prev,
					users: prev.users.map((user) =>
						user.id === userId
							? {
									...user,
									status: 'deactivated' as const,
									banned: true,
									banReason: reason,
								}
							: user
					),
				}))
			} catch (err) {
				setState((prev) => ({
					...prev,
					error: err instanceof Error ? err.message : 'Failed to ban user',
				}))
			}
		},
		[]
	)

	// Unban user using BetterAuth admin API
	const unbanUser = useCallback(async (userId: string) => {
		try {
			await authClient.admin.unbanUser({ userId })

			// Update local state
			setState((prev) => ({
				...prev,
				users: prev.users.map((user) =>
					user.id === userId
						? {
								...user,
								status: 'activated' as const,
								banned: false,
								banReason: undefined,
							}
						: user
				),
			}))
		} catch (err) {
			setState((prev) => ({
				...prev,
				error: err instanceof Error ? err.message : 'Failed to unban user',
			}))
		}
	}, [])

	// Remove user using BetterAuth admin API
	const removeUser = useCallback(async (userId: string) => {
		try {
			await authClient.admin.removeUser({ userId })

			// Update local state
			setState((prev) => ({
				...prev,
				users: prev.users.filter((user) => user.id !== userId),
				total: prev.total - 1,
			}))
		} catch (err) {
			setState((prev) => ({
				...prev,
				error: err instanceof Error ? err.message : 'Failed to remove user',
			}))
		}
	}, [])

	// Refresh users data
	const refreshUsers = useCallback(async () => {
		await fetchUsers()
	}, [fetchUsers])

	// Fetch users when filters change
	useEffect(() => {
		fetchUsers()
	}, [fetchUsers])

	const contextValue: UserManagementContextType = {
		...state,
		fetchUsers,
		updateFilters,
		setPage,
		banUser,
		unbanUser,
		removeUser,
		refreshUsers,
	}

	return (
		<UserManagementContext.Provider value={contextValue}>
			{children}
		</UserManagementContext.Provider>
	)
}

// Hook to use the UserManagement context
export function useUserManagement() {
	const context = useContext(UserManagementContext)
	if (!context) {
		throw new Error(
			'useUserManagement must be used within a UserManagementProvider'
		)
	}
	return context
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
