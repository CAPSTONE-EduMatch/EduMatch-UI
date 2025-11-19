'use client'

import { useParams } from 'next/navigation'
import { InstitutionDetail } from './InstitutionDetail'

export default function InstitutionDetailPage() {
	const params = useParams()
	const institutionId = params.id as string

	return <InstitutionDetail institutionId={institutionId} />
}
