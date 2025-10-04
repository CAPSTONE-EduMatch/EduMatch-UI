import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
	// Amplify supports Next.js with API routes
	// images: {
	// 	unoptimized: true,
	// },
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**",
			},
			{
				protocol: "http",
				hostname: "**",
			},
		],
	},
	// webpack: (config, { isServer }) => {
	// 	// Exclude Prisma and other server-only packages from client bundles
	// 	if (!isServer) {
	// 		config.resolve.fallback = {
	// 			...config.resolve.fallback,
	// 			fs: false,
	// 			net: false,
	// 			tls: false,
	// 		};
	// 	}
	// 	return config;
	// },
	// experimental: {
	// 	serverComponentsExternalPackages: ["@prisma/client", "prisma"],
	// },
};

export default withNextIntl(nextConfig);
