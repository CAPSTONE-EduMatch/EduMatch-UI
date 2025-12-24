export interface Plan {
	plan_id: string;
	priceId: string;
	name: string;
	description: string | null;
	features: string[];
	month_price: number; // in cents
	year_price: number | null; // in cents
	hierarchy: number;
	popular?: boolean; // Frontend-only flag
}

export interface PricingAPIResponse {
	success: boolean;
	plans: Plan[];
	error?: string;
}
