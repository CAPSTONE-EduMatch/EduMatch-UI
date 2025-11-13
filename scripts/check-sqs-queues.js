#!/usr/bin/env node

/**
 * Script to check SQS queues for messages
 * Usage: node scripts/check-sqs-queues.js
 */

const {
	SQSClient,
	GetQueueUrlCommand,
	GetQueueAttributesCommand,
	ReceiveMessageCommand,
} = require("@aws-sdk/client-sqs");
const fs = require("fs");
const path = require("path");

// Try to load .env file if it exists
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
	const envContent = fs.readFileSync(envPath, "utf8");
	envContent.split("\n").forEach((line) => {
		const trimmedLine = line.trim();
		if (trimmedLine && !trimmedLine.startsWith("#")) {
			const [key, ...valueParts] = trimmedLine.split("=");
			if (key && valueParts.length > 0) {
				const value = valueParts
					.join("=")
					.trim()
					.replace(/^["']|["']$/g, "");
				if (!process.env[key.trim()]) {
					process.env[key.trim()] = value;
				}
			}
		}
	});
}

const region = process.env.AWS_REGION || process.env.REGION || "ap-northeast-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID;
const secretAccessKey =
	process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY;

if (!accessKeyId || !secretAccessKey) {
	console.error("❌ Error: AWS credentials not found!");
	console.error("");
	console.error("Please set one of the following:");
	console.error(
		"  - ACCESS_KEY_ID and SECRET_ACCESS_KEY (as used in your app)"
	);
	console.error("  - AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY");
	console.error("");
	console.error("You can:");
	console.error("  1. Set environment variables in PowerShell:");
	console.error('     $env:ACCESS_KEY_ID="your-key"');
	console.error('     $env:SECRET_ACCESS_KEY="your-secret"');
	console.error("");
	console.error("  2. Create a .env file in the project root with:");
	console.error("     ACCESS_KEY_ID=your-key");
	console.error("     SECRET_ACCESS_KEY=your-secret");
	console.error("     REGION=ap-northeast-1");
	process.exit(1);
}

const sqsClient = new SQSClient({
	region,
	credentials: {
		accessKeyId,
		secretAccessKey,
	},
});

const queueNames = {
	notifications: "edumatch-notifications.fifo",
	emails: "edumatch-emails.fifo",
};

async function getQueueUrl(queueName) {
	try {
		const command = new GetQueueUrlCommand({ QueueName: queueName });
		const response = await sqsClient.send(command);
		return response.QueueUrl;
	} catch (error) {
		console.error(
			`❌ Error getting queue URL for ${queueName}:`,
			error.message
		);
		return null;
	}
}

async function getQueueAttributes(queueUrl) {
	try {
		const command = new GetQueueAttributesCommand({
			QueueUrl: queueUrl,
			AttributeNames: [
				"ApproximateNumberOfMessages",
				"ApproximateNumberOfMessagesNotVisible",
				"ApproximateNumberOfMessagesDelayed",
				"CreatedTimestamp",
				"LastModifiedTimestamp",
			],
		});
		const response = await sqsClient.send(command);
		return response.Attributes;
	} catch (error) {
		console.error(`❌ Error getting queue attributes:`, error.message);
		return null;
	}
}

async function peekMessages(queueUrl, maxMessages = 5) {
	try {
		const command = new ReceiveMessageCommand({
			QueueUrl: queueUrl,
			MaxNumberOfMessages: maxMessages,
			WaitTimeSeconds: 0, // Don't wait, just peek
			MessageAttributeNames: ["All"],
		});
		const response = await sqsClient.send(command);
		return response.Messages || [];
	} catch (error) {
		console.error(`❌ Error peeking messages:`, error.message);
		return [];
	}
}

async function checkQueue(queueName, displayName) {
	console.log(`\n${"=".repeat(60)}`);
	console.log(`📬 Checking ${displayName} Queue: ${queueName}`);
	console.log("=".repeat(60));

	const queueUrl = await getQueueUrl(queueName);
	if (!queueUrl) {
		console.log(`❌ Could not find queue: ${queueName}`);
		return;
	}

	console.log(`📍 Queue URL: ${queueUrl}`);

	const attributes = await getQueueAttributes(queueUrl);
	if (attributes) {
		console.log(`\n📊 Queue Attributes:`);
		console.log(
			`   Approximate Number of Messages: ${attributes.ApproximateNumberOfMessages || "0"}`
		);
		console.log(
			`   Messages Not Visible (in flight): ${attributes.ApproximateNumberOfMessagesNotVisible || "0"}`
		);
		console.log(
			`   Delayed Messages: ${attributes.ApproximateNumberOfMessagesDelayed || "0"}`
		);

		if (attributes.CreatedTimestamp) {
			const created = new Date(
				parseInt(attributes.CreatedTimestamp) * 1000
			);
			console.log(`   Created: ${created.toISOString()}`);
		}
		if (attributes.LastModifiedTimestamp) {
			const modified = new Date(
				parseInt(attributes.LastModifiedTimestamp) * 1000
			);
			console.log(`   Last Modified: ${modified.toISOString()}`);
		}
	}

	const messageCount = parseInt(
		attributes?.ApproximateNumberOfMessages || "0"
	);
	if (messageCount > 0) {
		console.log(`\n👀 Peeking at up to 5 messages (not consuming them):`);
		const messages = await peekMessages(queueUrl, 5);

		if (messages.length === 0) {
			console.log(
				"   ⚠️  No messages visible (may be in flight or delayed)"
			);
		} else {
			messages.forEach((msg, index) => {
				console.log(`\n   Message ${index + 1}:`);
				console.log(`   📧 Message ID: ${msg.MessageId}`);
				console.log(
					`   📋 Receipt Handle: ${msg.ReceiptHandle?.substring(0, 50)}...`
				);

				if (msg.MessageAttributes) {
					console.log(`   🏷️  Attributes:`);
					if (msg.MessageAttributes.Type) {
						console.log(
							`      Type: ${msg.MessageAttributes.Type.StringValue}`
						);
					}
					if (msg.MessageAttributes.UserId) {
						console.log(
							`      User ID: ${msg.MessageAttributes.UserId.StringValue}`
						);
					}
					if (msg.MessageAttributes.UserEmail) {
						console.log(
							`      User Email: ${msg.MessageAttributes.UserEmail.StringValue}`
						);
					}
				}

				if (msg.Body) {
					try {
						const body = JSON.parse(msg.Body);
						console.log(`   📄 Body:`);
						console.log(`      Type: ${body.type}`);
						console.log(`      User ID: ${body.userId}`);
						console.log(`      User Email: ${body.userEmail}`);
						if (body.metadata) {
							console.log(
								`      Metadata: ${JSON.stringify(body.metadata, null, 8).split("\n").join("\n      ")}`
							);
						}
					} catch (e) {
						console.log(
							`   📄 Body (raw): ${msg.Body.substring(0, 200)}...`
						);
					}
				}
			});
		}
	} else {
		console.log(`\n✅ Queue is empty - no messages waiting`);
	}
}

async function main() {
	console.log("🔍 SQS Queue Checker");
	console.log(`📍 Region: ${region}`);
	console.log(
		`🔑 Access Key: ${accessKeyId ? "✅ Set (" + accessKeyId.substring(0, 8) + "...)" : "❌ Missing"}`
	);
	console.log(
		`🔐 Secret Key: ${secretAccessKey ? "✅ Set (" + secretAccessKey.substring(0, 8) + "...)" : "❌ Missing"}`
	);
	if (fs.existsSync(envPath)) {
		console.log(`📄 .env file: ✅ Found and loaded`);
	}

	await checkQueue(queueNames.notifications, "Notifications");
	await checkQueue(queueNames.emails, "Emails");

	console.log(`\n${"=".repeat(60)}`);
	console.log("✅ Queue check complete!");
	console.log("=".repeat(60));
}

main().catch((error) => {
	console.error("❌ Fatal error:", error);
	process.exit(1);
});
