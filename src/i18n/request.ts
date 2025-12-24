import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
	// Try to get locale from cookies, otherwise default to "vn"
	const cookieStore = cookies();
	const savedLocale = cookieStore.get("preferredLocale")?.value;

	let locale = "en";
	if (savedLocale && (savedLocale === "en" || savedLocale === "vn")) {
		locale = savedLocale;
	}

	return {
		locale,
		messages: (await import(`../../messages/${locale}.json`)).default,
	};
});
