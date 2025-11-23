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
	experimental: {
		serverComponentsExternalPackages: [
			"@prisma/client",
			"prisma",
			"@prisma/adapter-pg",
			"pg",
		],
	},
	webpack: (config, { isServer }) => {
		// Exclude CDK infrastructure files from build
		config.externals = config.externals || [];
		config.externals.push({
			infrastructure: "commonjs infrastructure",
		});

		// Exclude Prisma and other server-only packages from client bundles
		if (!isServer) {
			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
				net: false,
				tls: false,
				dns: false,
				child_process: false,
				"pg-native": false, // pg-native is optional, ignore if not found
			};
			// Externalize pg and related packages for client bundles
			config.externals.push({
				pg: "commonjs pg",
				"@prisma/adapter-pg": "commonjs @prisma/adapter-pg",
				"pg-native": "commonjs pg-native", // Optional dependency
			});
		}

		// Ignore pg-native for server-side as well (it's optional)
		config.resolve.alias = {
			...config.resolve.alias,
			"pg-native": false,
		};
		return config;
	},
	// experimental: {
	// 	serverComponentsExternalPackages: ["@prisma/client", "prisma"],
	// },
};

export default withNextIntl(nextConfig);
