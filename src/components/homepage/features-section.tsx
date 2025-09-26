import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
	{
		title: 'Features 1',
		description:
			"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
	},
	{
		title: 'Features 1',
		description:
			"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
	},
	{
		title: 'Features 1',
		description:
			"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
	},
	{
		title: 'Features 1',
		description:
			"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
	},
]

export function FeaturesSection() {
	return (
		<section className="py-20 bg-background">
			<div className="container mx-auto px-4">
				<h2 className="text-3xl font-bold text-center mb-12 text-foreground">
					Features
				</h2>

				<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
					{features.map((feature, index) => (
						<Card key={index} className="h-full">
							<CardHeader>
								<CardTitle className="text-primary text-lg">
									{feature.title}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground text-sm leading-relaxed">
									{feature.description}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	)
}
