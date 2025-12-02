'use client'

import React from 'react'
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface VerificationWaitingScreenProps {
	verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
	submittedAt?: string | Date | null
	rejectionReason?: string | null
}

export const VerificationWaitingScreen: React.FC<
	VerificationWaitingScreenProps
> = ({ verificationStatus, submittedAt, rejectionReason }) => {
	const formatDate = (date: string | Date | null | undefined) => {
		if (!date) return 'N/A'
		const dateObj = typeof date === 'string' ? new Date(date) : date
		return dateObj.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		})
	}

	if (verificationStatus === 'APPROVED') {
		return null // Don't show waiting screen if approved
	}

	if (verificationStatus === 'REJECTED') {
		return (
			<div className="min-h-[calc(100vh-200px)] bg-gray-50 flex items-center justify-center p-4">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 text-center"
				>
					<div className="flex justify-center mb-6">
						<div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
							<XCircle className="w-12 h-12 text-red-600" />
						</div>
					</div>
					<h1 className="text-3xl font-bold text-gray-900 mb-4">
						Profile Rejected
					</h1>
					<p className="text-lg text-gray-600 mb-6">
						Your institution profile has been reviewed and rejected.
					</p>
					{rejectionReason && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
							<div className="flex items-start gap-3">
								<AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
								<div>
									<h3 className="font-semibold text-red-900 mb-2">
										Rejection Reason:
									</h3>
									<p className="text-red-800">{rejectionReason}</p>
								</div>
							</div>
						</div>
					)}
					<div className="bg-gray-50 rounded-lg p-4 mb-6">
						<p className="text-sm text-gray-600">
							<strong>What&apos;s next?</strong>
						</p>
						<ul className="text-sm text-gray-600 mt-2 space-y-1 text-left list-disc list-inside">
							<li>Review the rejection reason above</li>
							<li>Update your profile information</li>
							<li>Resubmit your profile for review</li>
						</ul>
					</div>
					<button
						onClick={() =>
							(window.location.href = '/institution/dashboard/profile')
						}
						className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-colors"
					>
						Update Profile
					</button>
				</motion.div>
			</div>
		)
	}

	// PENDING status
	return (
		<div className="min-h-[calc(100vh-200px)] bg-gray-50 flex items-center justify-center p-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 text-center"
			>
				<div className="flex justify-center mb-6">
					<motion.div
						animate={{ rotate: 360 }}
						transition={{
							duration: 2,
							repeat: Infinity,
							ease: 'linear',
						}}
						className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center"
					>
						<Clock className="w-12 h-12 text-blue-600" />
					</motion.div>
				</div>
				<h1 className="text-3xl font-bold text-gray-900 mb-4">
					Verification in Progress
				</h1>
				<p className="text-lg text-gray-600 mb-6">
					Your institution profile is currently under review by our
					administrative team.
				</p>
				{submittedAt && (
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
						<p className="text-sm text-blue-800">
							<strong>Submitted on:</strong> {formatDate(submittedAt)}
						</p>
					</div>
				)}
				<div className="bg-gray-50 rounded-lg p-6 mb-6">
					<h3 className="font-semibold text-gray-900 mb-3">
						What happens next?
					</h3>
					<ul className="text-sm text-gray-600 space-y-2 text-left">
						<li className="flex items-start gap-2">
							<CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
							<span>
								Our team will review your institution profile and verification
								documents
							</span>
						</li>
						<li className="flex items-start gap-2">
							<CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
							<span>
								You&apos;ll receive a notification once the review is complete
							</span>
						</li>
						<li className="flex items-start gap-2">
							<CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
							<span>
								Once approved, you&apos;ll have full access to all dashboard
								features
							</span>
						</li>
					</ul>
				</div>
				<div className="text-sm text-gray-500">
					<p>
						This process typically takes 1-3 business days. Thank you for your
						patience.
					</p>
				</div>
			</motion.div>
		</div>
	)
}
