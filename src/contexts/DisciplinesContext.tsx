'use client'

import { createContext, useContext, ReactNode } from 'react'
import {
	useSubdisciplines,
	useDisciplines,
	SubdisciplineOption,
	DisciplineData,
} from '@/hooks/data/useDisciplines'

interface DisciplinesContextType {
	// Subdisciplines
	subdisciplines: SubdisciplineOption[]
	isLoadingSubdisciplines: boolean
	subdisciplinesError: Error | null
	refetchSubdisciplines: () => void

	// Disciplines
	disciplines: DisciplineData | null
	isLoadingDisciplines: boolean
	disciplinesError: Error | null
	refetchDisciplines: () => void
}

const DisciplinesContext = createContext<DisciplinesContextType | undefined>(
	undefined
)

export function DisciplinesProvider({ children }: { children: ReactNode }) {
	const {
		data: subdisciplines = [],
		isLoading: isLoadingSubdisciplines,
		error: subdisciplinesError,
		refetch: refetchSubdisciplines,
	} = useSubdisciplines()

	const {
		data: disciplines = null,
		isLoading: isLoadingDisciplines,
		error: disciplinesError,
		refetch: refetchDisciplines,
	} = useDisciplines()

	return (
		<DisciplinesContext.Provider
			value={{
				subdisciplines,
				isLoadingSubdisciplines,
				subdisciplinesError: subdisciplinesError as Error | null,
				refetchSubdisciplines: () => {
					refetchSubdisciplines()
				},
				disciplines,
				isLoadingDisciplines,
				disciplinesError: disciplinesError as Error | null,
				refetchDisciplines: () => {
					refetchDisciplines()
				},
			}}
		>
			{children}
		</DisciplinesContext.Provider>
	)
}

export function useDisciplinesContext() {
	const context = useContext(DisciplinesContext)
	if (context === undefined) {
		throw new Error(
			'useDisciplinesContext must be used within a DisciplinesProvider'
		)
	}
	return context
}
