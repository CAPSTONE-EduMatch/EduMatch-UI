import { TestNotificationButton } from '@/components/TestNotificationButton'

export default function Page() {
	return (
		<div className="min-h-screen bg-gray-100 mt-56">
			<div className="flex gap-6 items-start max-w-6xl mx-auto">
				<div className="sticky top-4 self-start h-40 w-48 bg-amber-300 z-10">
					Sidebar sticky
				</div>
				<main className="flex-1 h-[200vh]">
					<div className="p-8">
						<h1 className="text-2xl font-bold mb-6">Test Page</h1>
						<TestNotificationButton />
					</div>
				</main>
			</div>
		</div>
	)
}
