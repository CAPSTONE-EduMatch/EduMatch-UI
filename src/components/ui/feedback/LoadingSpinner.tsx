interface LoadingSpinnerProps {
	message?: string
}

export default function LoadingSpinner({
	message = 'Loading...',
}: LoadingSpinnerProps) {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#126E64] mx-auto mb-4"></div>
				<p className="text-gray-600 text-sm">{message}</p>
			</div>
		</div>
	)
}
