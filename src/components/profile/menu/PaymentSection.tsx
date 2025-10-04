'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/Button'

interface PaymentSectionProps {
	profile: any
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({ profile }) => {
	// Mock data for payments - replace with actual API calls
	const payments = [
		{
			id: 1,
			description: 'Application Fee - Harvard University',
			amount: 85,
			currency: 'USD',
			status: 'completed',
			date: '2024-01-15',
			transactionId: 'TXN-123456789',
		},
		{
			id: 2,
			description: 'Application Fee - Stanford University',
			amount: 90,
			currency: 'USD',
			status: 'completed',
			date: '2024-01-20',
			transactionId: 'TXN-987654321',
		},
		{
			id: 3,
			description: 'Premium Subscription',
			amount: 29.99,
			currency: 'USD',
			status: 'pending',
			date: '2024-01-25',
			transactionId: 'TXN-456789123',
		},
	]

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'completed':
				return 'bg-green-100 text-green-800'
			case 'pending':
				return 'bg-yellow-100 text-yellow-800'
			case 'failed':
				return 'bg-red-100 text-red-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	const getStatusText = (status: string) => {
		switch (status) {
			case 'completed':
				return 'Completed'
			case 'pending':
				return 'Pending'
			case 'failed':
				return 'Failed'
			default:
				return 'Unknown'
		}
	}

	const totalSpent = payments
		.filter((payment) => payment.status === 'completed')
		.reduce((sum, payment) => sum + payment.amount, 0)

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold mb-2">Payment History</h2>
				<p className="text-muted-foreground">
					Track your payments and subscription details
				</p>
			</div>

			{/* Payment Stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardContent className="p-4 text-center">
						<div className="text-2xl font-bold text-primary">
							${totalSpent.toFixed(2)}
						</div>
						<div className="text-sm text-muted-foreground">Total Spent</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4 text-center">
						<div className="text-2xl font-bold text-green-600">
							{
								payments.filter((payment) => payment.status === 'completed')
									.length
							}
						</div>
						<div className="text-sm text-muted-foreground">Completed</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4 text-center">
						<div className="text-2xl font-bold text-yellow-600">
							{
								payments.filter((payment) => payment.status === 'pending')
									.length
							}
						</div>
						<div className="text-sm text-muted-foreground">Pending</div>
					</CardContent>
				</Card>
			</div>

			{/* Payment Methods */}
			<Card>
				<CardContent className="p-6">
					<h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
					<div className="space-y-3">
						<div className="flex items-center justify-between p-4 border rounded-lg">
							<div className="flex items-center gap-3">
								<div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
									💳
								</div>
								<div>
									<p className="font-medium">Visa ending in 4242</p>
									<p className="text-sm text-muted-foreground">Expires 12/25</p>
								</div>
							</div>
							<Button variant="outline" size="sm">
								Edit
							</Button>
						</div>
						<Button variant="outline" className="w-full">
							+ Add New Payment Method
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Payment History */}
			<Card>
				<CardContent className="p-6">
					<h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
					<div className="space-y-4">
						{payments.map((payment) => (
							<div
								key={payment.id}
								className="flex items-center justify-between p-4 border rounded-lg"
							>
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-1">
										<h4 className="font-medium">{payment.description}</h4>
										<span
											className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}
										>
											{getStatusText(payment.status)}
										</span>
									</div>
									<div className="text-sm text-muted-foreground">
										<span>
											Date: {new Date(payment.date).toLocaleDateString()}
										</span>
										<span className="mx-2">•</span>
										<span>ID: {payment.transactionId}</span>
									</div>
								</div>
								<div className="text-right">
									<div className="font-semibold">
										${payment.amount.toFixed(2)} {payment.currency}
									</div>
									{payment.status === 'pending' && (
										<Button size="sm" className="mt-2">
											Retry Payment
										</Button>
									)}
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Subscription Info */}
			<Card>
				<CardContent className="p-6">
					<h3 className="text-lg font-semibold mb-4">Subscription</h3>
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">Premium Plan</p>
							<p className="text-sm text-muted-foreground">
								Next billing: February 25, 2024
							</p>
						</div>
						<div className="flex gap-2">
							<Button variant="outline" size="sm">
								Manage
							</Button>
							<Button variant="outline" size="sm">
								Cancel
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
