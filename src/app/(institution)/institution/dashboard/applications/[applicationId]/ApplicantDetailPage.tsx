'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ApplicantDetailView } from '@/components/profile/institution/components'
import type { Applicant } from '@/components/profile/institution/components'

export default function ApplicantDetailPage() {
	const router = useRouter()
	const params = useParams()
	const applicationId = params.applicationId as string
	const [applicant, setApplicant] = useState<Applicant | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Fetch applicant data from API
	useEffect(() => {
		const fetchApplicant = async () => {
			if (!applicationId) {
				setError('Application ID is required')
				setLoading(false)
				return
			}

			try {
				setLoading(true)
				setError(null)

				// Fetch application details to get applicant info
				const response = await fetch(
					`/api/applications/institution/${applicationId}`,
					{
						method: 'GET',
						headers: {
							'Content-Type': 'application/json',
						},
						credentials: 'include',
					}
				)

				if (!response.ok) {
					throw new Error('Failed to fetch application details')
				}

				const result = await response.json()

				if (result.success && result.data) {
					// Transform API data to Applicant interface
					const appData = result.data
					const transformedApplicant: Applicant = {
						id: appData.application?.applicationId || applicationId,
						postId: appData.application?.postId || '',
						name: appData.applicant?.name || 'Unknown',
						appliedDate: appData.application?.applyAt
							? new Date(appData.application.applyAt).toLocaleDateString()
							: '',
						degreeLevel: appData.applicant?.level || 'Unknown',
						subDiscipline: Array.isArray(appData.applicant?.subdiscipline)
							? appData.applicant.subdiscipline
									.map((s: any) => s.name || s)
									.join(', ')
							: appData.applicant?.subdiscipline || 'Unknown',
						status: (appData.application?.status?.toLowerCase() ||
							'submitted') as
							| 'submitted'
							| 'under_review'
							| 'accepted'
							| 'rejected'
							| 'new_request',
						matchingScore: Math.floor(Math.random() * 30) + 70, // Mock score
						userId: appData.applicant?.userId || '',
						gpa: appData.applicant?.gpa || undefined,
					}
					setApplicant(transformedApplicant)
				} else {
					throw new Error(result.error || 'Failed to fetch application details')
				}
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: 'Failed to fetch application details'
				)
			} finally {
				setLoading(false)
			}
		}

		fetchApplicant()
	}, [applicationId])

	const handleBack = () => {
		// Navigate back to applications list
		router.push('/institution/dashboard/applications')
	}

	const handleApprove = () => {
		// Refresh the page after approval
		router.refresh()
	}

	const handleReject = () => {
		// Refresh the page after rejection
		router.refresh()
	}

	const handleRequireUpdate = () => {
		// Refresh the page after update request
		router.refresh()
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#126E64] mx-auto"></div>
					<p className="mt-4 text-muted-foreground">
						Loading applicant details...
					</p>
				</div>
			</div>
		)
	}

	if (error || !applicant) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="text-red-500 text-6xl mb-4">⚠️</div>
					<h2 className="text-xl font-semibold mb-2">
						Error Loading Applicant
					</h2>
					<p className="text-muted-foreground mb-4">
						{error || 'Applicant not found'}
					</p>
					<button
						onClick={handleBack}
						className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md"
					>
						Back to Applications
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
			<ApplicantDetailView
				applicant={applicant}
				onBack={handleBack}
				onApprove={handleApprove}
				onReject={handleReject}
				onRequireUpdate={handleRequireUpdate}
			/>
		</div>
	)
}
