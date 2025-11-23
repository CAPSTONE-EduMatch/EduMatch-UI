/**
 * Database Connection Diagnostic Script
 * Run with: npx tsx scripts/check-db-connection.ts
 */

import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

async function checkDatabaseConnection() {
	const connectionString = process.env.DATABASE_URL;

	if (!connectionString) {
		console.error("❌ DATABASE_URL is not set in .env file");
		process.exit(1);
	}

	// Parse connection string to show details (without password)
	const url = new URL(connectionString);
	console.log("📋 Connection Details:");
	console.log(`   Host: ${url.hostname}`);
	console.log(`   Port: ${url.port || "5432"}`);
	console.log(`   Database: ${url.pathname.slice(1)}`);
	console.log(`   User: ${url.username}`);
	console.log(`   Password: ${url.password ? "***" : "not set"}`);
	console.log("");

	const pool = new Pool({
		connectionString,
		// AWS RDS requires SSL connections
		ssl: url.hostname.includes("rds.amazonaws.com")
			? {
					rejectUnauthorized: false, // AWS RDS uses self-signed certificates
				}
			: undefined,
	});

	try {
		console.log("🔄 Attempting to connect...");
		const client = await pool.connect();
		console.log("✅ Successfully connected to database!");

		// Test a simple query
		const result = await client.query(
			"SELECT version(), current_database(), current_user"
		);
		console.log("\n📊 Database Information:");
		console.log(
			`   PostgreSQL Version: ${result.rows[0].version.split(" ")[0]} ${result.rows[0].version.split(" ")[1]}`
		);
		console.log(`   Current Database: ${result.rows[0].current_database}`);
		console.log(`   Current User: ${result.rows[0].current_user}`);

		// Check if the target database exists
		const dbCheck = await client.query(
			"SELECT 1 FROM pg_database WHERE datname = $1",
			["edumatch_final"]
		);

		if (dbCheck.rows.length > 0) {
			console.log("✅ Database 'edumatch_final' exists");
		} else {
			console.log("⚠️  Database 'edumatch_final' does not exist");
			console.log("   Available databases:");
			const dbs = await client.query(
				"SELECT datname FROM pg_database WHERE datistemplate = false"
			);
			dbs.rows.forEach((row) => {
				console.log(`   - ${row.datname}`);
			});
		}

		// Check user permissions
		const permCheck = await client.query(`
			SELECT 
				has_database_privilege(current_user, 'edumatch_final', 'CONNECT') as can_connect,
				has_database_privilege(current_user, 'edumatch_final', 'CREATE') as can_create
		`);

		if (permCheck.rows[0]?.can_connect === false) {
			console.log(
				"\n❌ User does not have CONNECT permission on 'edumatch_final'"
			);
		} else {
			console.log("\n✅ User has CONNECT permission");
		}

		client.release();
		await pool.end();
		console.log("\n✅ Connection test completed successfully!");
	} catch (error: any) {
		console.error("\n❌ Connection failed!");
		console.error(`   Error: ${error.message}`);

		if (error.code === "28P01") {
			console.error("\n💡 Authentication failed. Check:");
			console.error("   1. Username is correct");
			console.error("   2. Password is correct");
		} else if (error.code === "3D000") {
			console.error("\n💡 Database does not exist. Check:");
			console.error("   1. Database name in DATABASE_URL is correct");
			console.error("   2. Database has been created");
		} else if (error.code === "ECONNREFUSED") {
			console.error("\n💡 Connection refused. Check:");
			console.error("   1. Database server is running");
			console.error("   2. Host and port are correct");
			console.error("   3. Firewall allows connections");
		} else if (error.message?.includes("denied access")) {
			console.error("\n💡 Access denied. Check:");
			console.error("   1. User has permissions on the database");
			console.error("   2. Database exists");
			console.error("   3. User role has proper grants");
		}

		await pool.end();
		process.exit(1);
	}
}

checkDatabaseConnection();
