import * as cdk from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export class EduMatchNotificationStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		// Create SQS Queues
		const notificationsQueue = new sqs.Queue(this, "NotificationsQueue", {
			queueName: "edumatch-notifications.fifo",
			fifo: true,
			contentBasedDeduplication: true,
			visibilityTimeout: cdk.Duration.seconds(300), // 5 minutes
			retentionPeriod: cdk.Duration.days(14),
			deadLetterQueue: {
				queue: new sqs.Queue(this, "NotificationsDLQ", {
					queueName: "edumatch-notifications-dlq.fifo",
					fifo: true,
					contentBasedDeduplication: true,
					retentionPeriod: cdk.Duration.days(14),
				}),
				maxReceiveCount: 3,
			},
		});

		const emailsQueue = new sqs.Queue(this, "EmailsQueue", {
			queueName: "edumatch-emails.fifo",
			fifo: true,
			contentBasedDeduplication: true,
			visibilityTimeout: cdk.Duration.seconds(300), // 5 minutes
			retentionPeriod: cdk.Duration.days(14),
			deadLetterQueue: {
				queue: new sqs.Queue(this, "EmailsDLQ", {
					queueName: "edumatch-emails-dlq.fifo",
					fifo: true,
					contentBasedDeduplication: true,
					retentionPeriod: cdk.Duration.days(14),
				}),
				maxReceiveCount: 3,
			},
		});

		// Create IAM role for Lambda functions
		const lambdaRole = new iam.Role(this, "NotificationLambdaRole", {
			assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
			managedPolicies: [
				iam.ManagedPolicy.fromAwsManagedPolicyName(
					"service-role/AWSLambdaBasicExecutionRole"
				),
			],
			inlinePolicies: {
				SQSAndSESPolicy: new iam.PolicyDocument({
					statements: [
						new iam.PolicyStatement({
							effect: iam.Effect.ALLOW,
							actions: [
								"sqs:ReceiveMessage",
								"sqs:DeleteMessage",
								"sqs:GetQueueAttributes",
								"sqs:ChangeMessageVisibility",
							],
							resources: [
								notificationsQueue.queueArn,
								emailsQueue.queueArn,
								notificationsQueue.deadLetterQueue?.queue
									?.queueArn || "",
								emailsQueue.deadLetterQueue?.queue?.queueArn ||
									"",
							],
						}),
						new iam.PolicyStatement({
							effect: iam.Effect.ALLOW,
							actions: ["ses:SendEmail", "ses:SendRawEmail"],
							resources: ["*"],
						}),
						new iam.PolicyStatement({
							effect: iam.Effect.ALLOW,
							actions: [
								"dynamodb:PutItem",
								"dynamodb:GetItem",
								"dynamodb:UpdateItem",
								"dynamodb:DeleteItem",
								"dynamodb:Query",
								"dynamodb:Scan",
							],
							resources: [
								"arn:aws:dynamodb:*:*:table/edumatch-*",
							],
						}),
					],
				}),
			},
		});

		// Create Lambda function for processing notifications
		const notificationProcessor = new lambda.Function(
			this,
			"NotificationProcessor",
			{
				runtime: lambda.Runtime.NODEJS_18_X,
				handler: "index.handler",
				code: lambda.Code.fromInline(`
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const sqsClient = new SQSClient({ region: 'ap-northeast-1' });

exports.handler = async (event) => {
  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      
      // Store notification in database
      await storeNotificationInDatabase(message);
      
      // Forward message to email queue
      const emailCommand = new SendMessageCommand({
        QueueUrl: process.env.EMAILS_QUEUE_URL,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          Type: {
            DataType: 'String',
            StringValue: message.type,
          },
          UserEmail: {
            DataType: 'String',
            StringValue: message.userEmail,
          },
        },
        MessageGroupId: message.userEmail,
        MessageDeduplicationId: message.id,
      });
      
      await sqsClient.send(emailCommand);
      
    } catch (error) {
      console.error('Error processing notification:', error);
      throw error; // This will trigger retry
    }
  }
};

async function storeNotificationInDatabase(message) {
  try {
    // Create notification title and body based on type
    let title = "";
    let bodyText = "";
    let url = "/";

    switch (message.type) {
      case "WELCOME":
        title = "Welcome to EduMatch!";
        bodyText = \`Welcome \${message.metadata?.firstName || "User"}! Your account has been created successfully.\`;
        url = "/applicant-profile/create";
        break;
      case "PROFILE_CREATED":
        title = "Profile Created Successfully!";
        bodyText = \`Your \${message.metadata?.role || "profile"} profile has been created and is now live.\`;
        url = "/profile/view";
        break;
      case "PAYMENT_DEADLINE":
        title = "Payment Deadline Reminder";
        bodyText = \`Your \${message.metadata?.planName || "subscription"} payment is due on \${message.metadata?.deadlineDate || "soon"}.\`;
        url = "/pricing";
        break;
      default:
        title = "New Notification";
        bodyText = "You have a new notification from EduMatch.";
        break;
    }

    // Call your API to store notification
    const response = await fetch(\`\${process.env.API_BASE_URL || 'https://your-app-url.com'}/api/notifications/store\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: message.id,
        userId: message.userId,
        type: message.type,
        title,
        bodyText,
        url,
        createAt: message.createAt || new Date().toISOString(),
        queuedAt: message.queuedAt || new Date().toISOString(),
        payload: message.metadata || {},
      }),
    });

    if (!response.ok) {
      throw new Error(\`Failed to store notification: \${response.status}\`);
    }
  } catch (error) {
    console.error('❌ Error storing notification in database:', error);
    throw error;
  }
}
      `),
				role: lambdaRole,
				timeout: cdk.Duration.seconds(300),
				memorySize: 256,
				logGroup: new logs.LogGroup(
					this,
					"NotificationProcessorLogGroup",
					{
						retention: logs.RetentionDays.ONE_WEEK,
					}
				),
				environment: {
					NOTIFICATIONS_QUEUE_URL: notificationsQueue.queueUrl,
					EMAILS_QUEUE_URL: emailsQueue.queueUrl,
				},
			}
		);

		// Create Lambda function for processing emails
		const emailProcessor = new lambda.Function(this, "EmailProcessor", {
			runtime: lambda.Runtime.NODEJS_18_X,
			handler: "index.handler",
			code: lambda.Code.fromInline(`
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const https = require('https');

const sqsClient = new SQSClient({ region: 'ap-northeast-1' });

// Email templates (simplified versions)
const emailTemplates = {
  WELCOME: (metadata) => ({
    subject: \`Welcome to EduMatch, \${metadata.firstName}!\`,
    html: \`
      <h1>Welcome to EduMatch!</h1>
      <p>Hello \${metadata.firstName} \${metadata.lastName},</p>
      <p>Welcome to EduMatch! We're thrilled to have you join our community.</p>
      <p>Best regards,<br>The EduMatch Team</p>
    \`
  }),
  PROFILE_CREATED: (metadata) => ({
    subject: 'Profile Created Successfully - Welcome to EduMatch!',
    html: \`
      <h1>Profile Created Successfully!</h1>
      <p>Congratulations, \${metadata.firstName}!</p>
      <p>Your \${metadata.role} profile has been successfully created.</p>
      <p>Best regards,<br>The EduMatch Team</p>
    \`
  }),
  PAYMENT_DEADLINE: (metadata) => ({
    subject: \`Payment Deadline Reminder - \${metadata.planName} Subscription\`,
    html: \`
      <h1>Payment Deadline Reminder</h1>
      <p>Your \${metadata.planName} subscription payment is due soon.</p>
      <p>Amount: \${metadata.currency} \${metadata.amount}</p>
      <p>Deadline: \${new Date(metadata.deadlineDate).toLocaleDateString()}</p>
      <p>Best regards,<br>The EduMatch Team</p>
    \`
  }),
  APPLICATION_STATUS_UPDATE: (metadata) => ({
    subject: \`Application Status Update - \${metadata.programName}\`,
    html: \`
      <h1>Application Status Update</h1>
      <p>Your application to \${metadata.programName} at \${metadata.institutionName} has been updated.</p>
      <p>New Status: \${metadata.newStatus}</p>
      <p>Best regards,<br>The EduMatch Team</p>
    \`
  }),
  PAYMENT_SUCCESS: (metadata) => ({
    subject: \`Payment Successful - \${metadata.planName} Subscription\`,
    html: \`
      <h1>Payment Successful!</h1>
      <p>Thank you for your payment.</p>
      <p>Plan: \${metadata.planName}</p>
      <p>Amount: \${metadata.currency} \${metadata.amount}</p>
      <p>Best regards,<br>The EduMatch Team</p>
    \`
  }),
  PAYMENT_FAILED: (metadata) => ({
    subject: \`Payment Failed - \${metadata.planName} Subscription\`,
    html: \`
      <h1>Payment Failed</h1>
      <p>We were unable to process your payment for \${metadata.planName}.</p>
      <p>Reason: \${metadata.failureReason}</p>
      <p>Best regards,<br>The EduMatch Team</p>
    \`
  }),
  SUBSCRIPTION_EXPIRING: (metadata) => ({
    subject: \`Subscription Expiring Soon - \${metadata.planName}\`,
    html: \`
      <h1>Subscription Expiring Soon</h1>
      <p>Your \${metadata.planName} subscription will expire in \${metadata.daysRemaining} days.</p>
      <p>Expiry Date: \${new Date(metadata.expiryDate).toLocaleDateString()}</p>
      <p>Best regards,<br>The EduMatch Team</p>
    \`
  })
};

exports.handler = async (event) => {
  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      
      // Get email template
      const template = emailTemplates[message.type];
      if (!template) {
        console.error('Unknown email type:', message.type);
        continue;
      }
      
      const emailContent = template(message.metadata);
      
      // Send email by calling your Next.js app's email API
      const emailPayload = {
        to: message.userEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        from: 'edumatch.noreply@gmail.com'
      };
      
      // Call your Next.js app's email API endpoint
      // Try localhost first (for development), then fallback to deployed URL
      let baseUrl = 'http://localhost:3000';
      try {
        // Try localhost first
        const localhostResponse = await fetch('http://localhost:3000/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailPayload),
          signal: AbortSignal.timeout(2000) // 2 second timeout
        });
        
        if (localhostResponse.ok) {
          continue; // Skip to next message
        }
      } catch (localhostError) {
        // Localhost not available, continue to deployed URL
      }
      
      // Fallback to deployed URL
      baseUrl = 'https://dev.d1jaxpbx3axxsh.amplifyapp.com';
      const response = await fetch('https://dev.d1jaxpbx3axxsh.amplifyapp.com/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to send email via deployed URL:', response.status, errorData);
        throw new Error(\`Email sending failed: \${response.status} - \${errorData.error}\`);
      }
      
    } catch (error) {
      console.error('Error processing email:', error);
      throw error; // This will trigger retry
    }
  }
};
      `),
			role: lambdaRole,
			timeout: cdk.Duration.seconds(300),
			memorySize: 256,
			logGroup: new logs.LogGroup(this, "EmailProcessorLogGroup", {
				retention: logs.RetentionDays.ONE_WEEK,
			}),
			environment: {
				// Email processing logs are available in CloudWatch
			},
		});

		// Add SQS event sources to Lambda functions
		notificationProcessor.addEventSource(
			new lambdaEventSources.SqsEventSource(notificationsQueue, {
				batchSize: 10,
				// maxBatchingWindow not supported for FIFO queues
			})
		);

		emailProcessor.addEventSource(
			new lambdaEventSources.SqsEventSource(emailsQueue, {
				batchSize: 10,
				// maxBatchingWindow not supported for FIFO queues
			})
		);

		// Create DynamoDB tables for messaging with efficient partition keys
		const messagesTable = new dynamodb.Table(this, "MessagesTable", {
			tableName: "edumatch-messages-v2",
			partitionKey: {
				name: "threadId",
				type: dynamodb.AttributeType.STRING,
			},
			sortKey: {
				name: "createdAt",
				type: dynamodb.AttributeType.STRING,
			},
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		// Threads table with user-based partition key for efficient queries
		const threadsTable = new dynamodb.Table(this, "ThreadsTable", {
			tableName: "edumatch-threads-v2",
			partitionKey: {
				name: "userId",
				type: dynamodb.AttributeType.STRING,
			},
			sortKey: {
				name: "threadId",
				type: dynamodb.AttributeType.STRING,
			},
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		// Message reads table for tracking read status
		const messageReadsTable = new dynamodb.Table(
			this,
			"MessageReadsTable",
			{
				tableName: "edumatch-message-reads-v2",
				partitionKey: {
					name: "messageId",
					type: dynamodb.AttributeType.STRING,
				},
				sortKey: {
					name: "userId",
					type: dynamodb.AttributeType.STRING,
				},
				billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
				removalPolicy: cdk.RemovalPolicy.DESTROY,
			}
		);

		// Create Lambda function for thread management
		const threadManager = new lambda.Function(this, "ThreadManager", {
			runtime: lambda.Runtime.NODEJS_18_X,
			handler: "index.handler",
			code: lambda.Code.fromInline(`
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

exports.handler = async (event) => {
  try {
    const { currentUserId, participantId, threadId, createdAt, userName, userEmail, userImage } = event.arguments.input;
    
    if (!currentUserId || !participantId || !threadId) {
      throw new Error('Missing required parameters: currentUserId, participantId, or threadId');
    }
    
    // Create thread entry for current user
    const currentUserThread = {
      userId: currentUserId,
      threadId: threadId,
      id: threadId,
      user1Id: currentUserId,
      user2Id: participantId,
      lastMessage: "",
      lastMessageAt: createdAt,
      lastMessageSenderId: null,
      lastMessageSenderName: null,
      lastMessageSenderImage: null,
      lastMessageFileUrl: null,
      lastMessageFileName: null,
      lastMessageMimeType: null,
      createdAt: createdAt,
      updatedAt: createdAt,
      unreadCount: 0
    };
    
    // Create thread entry for participant
    const participantThread = {
      userId: participantId,
      threadId: threadId,
      id: threadId,
      user1Id: participantId,
      user2Id: currentUserId,
      lastMessage: "",
      lastMessageAt: createdAt,
      lastMessageSenderId: null,
      lastMessageSenderName: null,
      lastMessageSenderImage: null,
      lastMessageFileUrl: null,
      lastMessageFileName: null,
      lastMessageMimeType: null,
      createdAt: createdAt,
      updatedAt: createdAt,
      unreadCount: 0
    };
    
    // Put both thread entries
    const currentUserCommand = new PutItemCommand({
      TableName: process.env.THREADS_TABLE_NAME,
      Item: marshall(currentUserThread)
    });
    
    const participantCommand = new PutItemCommand({
      TableName: process.env.THREADS_TABLE_NAME,
      Item: marshall(participantThread)
    });
    
    await Promise.all([
      dynamoClient.send(currentUserCommand),
      dynamoClient.send(participantCommand)
    ]);
    
    // Return the current user's thread entry
    return currentUserThread;
    
  } catch (error) {
    console.error('Error in thread manager:', error);
    throw error;
  }
};
      `),
			role: lambdaRole,
			timeout: cdk.Duration.seconds(30),
			memorySize: 256,
			logGroup: new logs.LogGroup(this, "ThreadManagerLogGroup", {
				retention: logs.RetentionDays.ONE_WEEK,
			}),
			environment: {
				THREADS_TABLE_NAME: threadsTable.tableName,
			},
		});

		// Grant DynamoDB permissions to thread manager
		threadsTable.grantWriteData(threadManager);

		// Create Lambda function for message management
		const messageManager = new lambda.Function(this, "MessageManager", {
			runtime: lambda.Runtime.NODEJS_18_X,
			handler: "index.handler",
			code: lambda.Code.fromInline(`
const { DynamoDBClient, PutItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

exports.handler = async (event) => {
  try {
    const { threadId, content, senderId, senderName, senderImage, fileUrl, fileName, mimeType } = event.arguments.input;
    
    if (!threadId || !content || !senderId) {
      throw new Error('Missing required parameters: threadId, content, or senderId');
    }
    
    const messageId = event.arguments.input.messageId || require('crypto').randomUUID();
    const createdAt = event.arguments.input.createdAt || new Date().toISOString();
    
    // Create the message
    const message = {
      threadId: threadId,
      createdAt: createdAt,
      id: messageId,
      content: content,
      senderId: senderId,
      senderName: senderName,
      senderImage: senderImage,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      mimeType: mimeType || null,
      isRead: false,
      readAt: null
    };
    
    // Put the message
    const messageCommand = new PutItemCommand({
      TableName: process.env.MESSAGES_TABLE_NAME,
      Item: marshall(message)
    });
    
    await dynamoClient.send(messageCommand);
    
    // Update thread information for both users
    // First, get the thread to find both users
    const threadQuery = {
      TableName: process.env.THREADS_TABLE_NAME,
      FilterExpression: 'threadId = :threadId',
      ExpressionAttributeValues: {
        ':threadId': { S: threadId }
      }
    };
    
    const { ScanCommand } = require('@aws-sdk/client-dynamodb');
    const scanCommand = new ScanCommand(threadQuery);
    const threadResult = await dynamoClient.send(scanCommand);
    
    if (threadResult.Items && threadResult.Items.length > 0) {
      // Update each thread entry
      for (const threadItem of threadResult.Items) {
        const thread = unmarshall(threadItem);
        
        // Determine if this thread entry is for the sender or recipient
        const isSender = thread.userId === senderId;
        
        let updateCommand;
        if (isSender) {
          // For sender: set unreadCount to 0
          updateCommand = new UpdateItemCommand({
            TableName: process.env.THREADS_TABLE_NAME,
            Key: {
              userId: { S: thread.userId },
              threadId: { S: thread.threadId }
            },
            UpdateExpression: 'SET lastMessage = :lastMessage, lastMessageAt = :lastMessageAt, lastMessageSenderId = :lastMessageSenderId, lastMessageSenderName = :lastMessageSenderName, lastMessageSenderImage = :lastMessageSenderImage, lastMessageFileUrl = :lastMessageFileUrl, lastMessageFileName = :lastMessageFileName, lastMessageMimeType = :lastMessageMimeType, updatedAt = :updatedAt, unreadCount = :zero',
            ExpressionAttributeValues: {
              ':lastMessage': { S: content },
              ':lastMessageAt': { S: createdAt },
              ':lastMessageSenderId': { S: senderId },
              ':lastMessageSenderName': { S: senderName || '' },
              ':lastMessageSenderImage': { S: senderImage || '' },
              ':lastMessageFileUrl': { S: fileUrl || '' },
              ':lastMessageFileName': { S: fileName || '' },
              ':lastMessageMimeType': { S: mimeType || '' },
              ':updatedAt': { S: createdAt },
              ':zero': { N: '0' }
            }
          });
        } else {
          // For recipient: increment unreadCount
          updateCommand = new UpdateItemCommand({
            TableName: process.env.THREADS_TABLE_NAME,
            Key: {
              userId: { S: thread.userId },
              threadId: { S: thread.threadId }
            },
            UpdateExpression: 'SET lastMessage = :lastMessage, lastMessageAt = :lastMessageAt, lastMessageSenderId = :lastMessageSenderId, lastMessageSenderName = :lastMessageSenderName, lastMessageSenderImage = :lastMessageSenderImage, lastMessageFileUrl = :lastMessageFileUrl, lastMessageFileName = :lastMessageFileName, lastMessageMimeType = :lastMessageMimeType, updatedAt = :updatedAt, unreadCount = unreadCount + :one',
            ExpressionAttributeValues: {
              ':lastMessage': { S: content },
              ':lastMessageAt': { S: createdAt },
              ':lastMessageSenderId': { S: senderId },
              ':lastMessageSenderName': { S: senderName || '' },
              ':lastMessageSenderImage': { S: senderImage || '' },
              ':lastMessageFileUrl': { S: fileUrl || '' },
              ':lastMessageFileName': { S: fileName || '' },
              ':lastMessageMimeType': { S: mimeType || '' },
              ':updatedAt': { S: createdAt },
              ':one': { N: '1' }
            }
          });
        }
        
        await dynamoClient.send(updateCommand);
      }
    }
    
    return message;
    
  } catch (error) {
    console.error('Error in message manager:', error);
    throw error;
  }
};
      `),
			role: lambdaRole,
			timeout: cdk.Duration.seconds(30),
			memorySize: 256,
			logGroup: new logs.LogGroup(this, "MessageManagerLogGroup", {
				retention: logs.RetentionDays.ONE_WEEK,
			}),
			environment: {
				MESSAGES_TABLE_NAME: messagesTable.tableName,
				THREADS_TABLE_NAME: threadsTable.tableName,
			},
		});

		// Grant DynamoDB permissions to message manager
		messagesTable.grantWriteData(messageManager);
		threadsTable.grantWriteData(messageManager);

		// Create Lambda function for marking messages as read
		const markReadManager = new lambda.Function(this, "MarkReadManager", {
			runtime: lambda.Runtime.NODEJS_18_X,
			handler: "index.handler",
			code: lambda.Code.fromInline(`
const { DynamoDBClient, PutItemCommand, UpdateItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

exports.handler = async (event) => {
  try {
    const { messageId, userId } = event.arguments.input;
    
    if (!messageId || !userId) {
      throw new Error('Missing required parameters: messageId or userId');
    }
    
    const readId = event.arguments.input.readId || require('crypto').randomUUID();
    const readAt = event.arguments.input.readAt || new Date().toISOString();
    
    // First, get the message to find the threadId
    const messageCommand = new GetItemCommand({
      TableName: process.env.MESSAGES_TABLE_NAME,
      Key: {
        threadId: { S: 'temp' }, // We need to scan to find the message
        createdAt: { S: 'temp' }
      }
    });
    
    // Since we don't have threadId, we need to scan for the message
    const { ScanCommand } = require('@aws-sdk/client-dynamodb');
    const scanCommand = new ScanCommand({
      TableName: process.env.MESSAGES_TABLE_NAME,
      FilterExpression: 'id = :messageId',
      ExpressionAttributeValues: {
        ':messageId': { S: messageId }
      }
    });
    
    const messageResult = await dynamoClient.send(scanCommand);
    
    if (!messageResult.Items || messageResult.Items.length === 0) {
      throw new Error('Message not found');
    }
    
    const message = unmarshall(messageResult.Items[0]);
    const threadId = message.threadId;
    
    // Create the read record
    const readRecord = {
      messageId: messageId,
      userId: userId,
      id: readId,
      readAt: readAt
    };
    
    const readCommand = new PutItemCommand({
      TableName: process.env.MESSAGE_READS_TABLE_NAME,
      Item: marshall(readRecord)
    });
    
    await dynamoClient.send(readCommand);
    
    // Update the thread's unread count for this user
    const threadQuery = {
      TableName: process.env.THREADS_TABLE_NAME,
      FilterExpression: 'threadId = :threadId AND userId = :userId',
      ExpressionAttributeValues: {
        ':threadId': { S: threadId },
        ':userId': { S: userId }
      }
    };
    
    const threadScanCommand = new ScanCommand(threadQuery);
    const threadResult = await dynamoClient.send(threadScanCommand);
    
    if (threadResult.Items && threadResult.Items.length > 0) {
      const thread = unmarshall(threadResult.Items[0]);
      
      const updateCommand = new UpdateItemCommand({
        TableName: process.env.THREADS_TABLE_NAME,
        Key: {
          userId: { S: thread.userId },
          threadId: { S: thread.threadId }
        },
        UpdateExpression: 'SET unreadCount = unreadCount - :one',
        ConditionExpression: 'unreadCount > :zero',
        ExpressionAttributeValues: {
          ':one': { N: '1' },
          ':zero': { N: '0' }
        }
      });
      
      try {
        await dynamoClient.send(updateCommand);
      } catch (error) {
        // If unreadCount is already 0, that's fine
      }
    }
    
    return readRecord;
    
  } catch (error) {
    console.error('Error in mark read manager:', error);
    throw error;
  }
};
      `),
			role: lambdaRole,
			timeout: cdk.Duration.seconds(30),
			memorySize: 256,
			logGroup: new logs.LogGroup(this, "MarkReadManagerLogGroup", {
				retention: logs.RetentionDays.ONE_WEEK,
			}),
			environment: {
				MESSAGES_TABLE_NAME: messagesTable.tableName,
				THREADS_TABLE_NAME: threadsTable.tableName,
				MESSAGE_READS_TABLE_NAME: messageReadsTable.tableName,
			},
		});

		// Grant DynamoDB permissions to mark read manager
		messagesTable.grantReadData(markReadManager);
		threadsTable.grantWriteData(markReadManager);
		messageReadsTable.grantWriteData(markReadManager);

		// Create Lambda function for clearing thread unread count
		const clearUnreadManager = new lambda.Function(
			this,
			"ClearUnreadManager",
			{
				runtime: lambda.Runtime.NODEJS_18_X,
				handler: "index.handler",
				code: lambda.Code.fromInline(`
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

exports.handler = async (event) => {
  try {
    const { threadId, userId } = event.arguments.input;
    
    if (!threadId || !userId) {
      throw new Error('Missing required parameters: threadId or userId');
    }
    
    // Update the thread's unread count to 0 for this user
    const updateCommand = new UpdateItemCommand({
      TableName: process.env.THREADS_TABLE_NAME,
      Key: {
        userId: { S: userId },
        threadId: { S: threadId }
      },
      UpdateExpression: 'SET unreadCount = :zero',
      ExpressionAttributeValues: {
        ':zero': { N: '0' }
      },
      ReturnValues: 'ALL_NEW'
    });
    
    const result = await dynamoClient.send(updateCommand);
    
    return {
      id: threadId,
      unreadCount: 0
    };
    
  } catch (error) {
    console.error('Error in clear unread manager:', error);
    throw error;
  }
};
      `),
				role: lambdaRole,
				timeout: cdk.Duration.seconds(30),
				memorySize: 256,
				logGroup: new logs.LogGroup(
					this,
					"ClearUnreadManagerLogGroup",
					{
						retention: logs.RetentionDays.ONE_WEEK,
					}
				),
				environment: {
					THREADS_TABLE_NAME: threadsTable.tableName,
				},
			}
		);

		// Grant DynamoDB permissions to clear unread manager
		threadsTable.grantWriteData(clearUnreadManager);

		// Create AppSync API
		const api = new appsync.GraphqlApi(this, "EduMatchMessagingApi", {
			name: "EduMatchMessagingApi",
			schema: appsync.SchemaFile.fromAsset("graphql/schema.graphql"),
			authorizationConfig: {
				defaultAuthorization: {
					authorizationType: appsync.AuthorizationType.API_KEY,
					apiKeyConfig: {
						expires: cdk.Expiration.after(cdk.Duration.days(365)),
					},
				},
				additionalAuthorizationModes: [
					{
						authorizationType: appsync.AuthorizationType.USER_POOL,
						userPoolConfig: {
							userPool: cognito.UserPool.fromUserPoolId(
								this,
								"UserPool",
								process.env.COGNITO_USER_POOL_ID ||
									"us-east-1_XXXXXXXXX"
							),
						},
					},
				],
			},
			xrayEnabled: true,
		});

		// Create DynamoDB data sources
		const messagesDataSource = api.addDynamoDbDataSource(
			"MessagesDataSource",
			messagesTable
		);
		const threadsDataSource = api.addDynamoDbDataSource(
			"ThreadsDataSource",
			threadsTable
		);

		// Message reads data source (now handled by Lambda)
		// const messageReadsDataSource = api.addDynamoDbDataSource(
		// 	"MessageReadsDataSource",
		// 	messageReadsTable
		// );

		// Create Lambda data source for thread management
		const threadManagerDataSource = api.addLambdaDataSource(
			"ThreadManagerDataSource",
			threadManager
		);

		// Create Lambda data source for message management
		const messageManagerDataSource = api.addLambdaDataSource(
			"MessageManagerDataSource",
			messageManager
		);

		// Create Lambda data source for mark read management
		const markReadManagerDataSource = api.addLambdaDataSource(
			"MarkReadManagerDataSource",
			markReadManager
		);

		// Create Lambda data source for clear unread management
		const clearUnreadManagerDataSource = api.addLambdaDataSource(
			"ClearUnreadManagerDataSource",
			clearUnreadManager
		);

		// Simple and efficient resolvers

		// Get messages for a thread
		messagesDataSource.createResolver("GetMessagesResolver", {
			typeName: "Query",
			fieldName: "getMessages",
			requestMappingTemplate: appsync.MappingTemplate.fromString(`
				{
					"version": "2017-02-28",
					"operation": "Query",
					"query": {
						"expression": "threadId = :threadId",
						"expressionValues": {
							":threadId": $util.dynamodb.toDynamoDBJson($ctx.args.threadId)
						}
					}
				}
			`),
			responseMappingTemplate:
				appsync.MappingTemplate.dynamoDbResultList(),
		});

		// Create a new message - uses Lambda to create message and update threads
		messageManagerDataSource.createResolver("CreateMessageResolver", {
			typeName: "Mutation",
			fieldName: "createMessage",
			requestMappingTemplate: appsync.MappingTemplate.fromString(`
				#set($senderId = $ctx.identity.sub)
				#set($senderName = $ctx.identity.claims.name)
				#set($senderImage = $ctx.identity.claims.picture)
				#if($ctx.args.input.senderId)
					#set($senderId = $ctx.args.input.senderId)
				#end
				#if($ctx.args.input.senderName)
					#set($senderName = $ctx.args.input.senderName)
				#end
				#if($ctx.args.input.senderImage)
					#set($senderImage = $ctx.args.input.senderImage)
				#end
				#set($messageId = $util.autoId())
				#set($createdAt = $util.time.nowISO8601())
				
				{
					"version": "2017-02-28",
					"operation": "Invoke",
					"payload": {
						"arguments": {
							"input": {
								"messageId": $util.toJson($messageId),
								"threadId": $util.toJson($ctx.args.input.threadId),
								"content": $util.toJson($ctx.args.input.content),
								"senderId": $util.toJson($senderId),
								"senderName": $util.toJson($senderName),
								"senderImage": $util.toJson($senderImage),
								"fileUrl": $util.toJson($ctx.args.input.fileUrl),
								"fileName": $util.toJson($ctx.args.input.fileName),
								"mimeType": $util.toJson($ctx.args.input.mimeType),
								"createdAt": $util.toJson($createdAt)
							}
						}
					}
				}
			`),
			responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
		});

		// Get threads for current user
		threadsDataSource.createResolver("GetThreadsResolver", {
			typeName: "Query",
			fieldName: "getThreads",
			requestMappingTemplate: appsync.MappingTemplate.fromString(`
				#set($userId = $ctx.identity.sub)
				#if($ctx.args.userId)
					#set($userId = $ctx.args.userId)
				#end
				#if($userId)
				{
					"version": "2017-02-28",
					"operation": "Query",
					"query": {
						"expression": "userId = :userId",
						"expressionValues": {
							":userId": $util.dynamodb.toDynamoDBJson($userId)
						}
					}
				}
				#else
				$util.error("User ID is required", "BadRequest")
				#end
			`),
			responseMappingTemplate: appsync.MappingTemplate.fromString(`
				#set($items = [])
				#foreach($item in $ctx.result.items)
					#set($item.unreadCount = $util.defaultIfNull($item.unreadCount, 0))
					$util.qr($items.add($item))
				#end
				$util.toJson($items)
			`),
		});

		// Create thread resolver - uses Lambda to create entries for both users
		threadManagerDataSource.createResolver("CreateThreadResolver", {
			typeName: "Mutation",
			fieldName: "createThread",
			requestMappingTemplate: appsync.MappingTemplate.fromString(`
				#set($currentUserId = $ctx.identity.sub)
				#if($ctx.args.input.userId)
					#set($currentUserId = $ctx.args.input.userId)
				#end
				#set($threadId = $util.autoId())
				#set($createdAt = $util.time.nowISO8601())
				
				{
					"version": "2017-02-28",
					"operation": "Invoke",
					"payload": {
						"arguments": {
							"input": {
								"currentUserId": $util.toJson($currentUserId),
								"participantId": $util.toJson($ctx.args.input.participantId),
								"threadId": $util.toJson($threadId),
								"createdAt": $util.toJson($createdAt),
								"userName": $util.toJson($ctx.args.input.userName),
								"userEmail": $util.toJson($ctx.args.input.userEmail),
								"userImage": $util.toJson($ctx.args.input.userImage)
							}
						}
					}
				}
			`),
			responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
		});

		// Mark message as read - uses Lambda to update unread count
		markReadManagerDataSource.createResolver("MarkMessageReadResolver", {
			typeName: "Mutation",
			fieldName: "markMessageRead",
			requestMappingTemplate: appsync.MappingTemplate.fromString(`
				#set($userId = $ctx.identity.sub)
				#if($ctx.args.input.userId)
					#set($userId = $ctx.args.input.userId)
				#end
				#set($readId = $util.autoId())
				#set($readAt = $util.time.nowISO8601())
				
				{
					"version": "2017-02-28",
					"operation": "Invoke",
					"payload": {
						"arguments": {
							"input": {
								"messageId": $util.toJson($ctx.args.input.messageId),
								"userId": $util.toJson($userId),
								"readId": $util.toJson($readId),
								"readAt": $util.toJson($readAt)
							}
						}
					}
				}
			`),
			responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
		});

		// Clear thread unread count - simple Lambda to set unreadCount = 0
		clearUnreadManagerDataSource.createResolver(
			"ClearThreadUnreadCountResolver",
			{
				typeName: "Mutation",
				fieldName: "clearThreadUnreadCount",
				requestMappingTemplate: appsync.MappingTemplate.fromString(`
				#set($userId = $ctx.identity.sub)
				#if($ctx.args.input.userId)
					#set($userId = $ctx.args.input.userId)
				#end
				
				{
					"version": "2017-02-28",
					"operation": "Invoke",
					"payload": {
						"arguments": {
							"input": {
								"threadId": $util.toJson($ctx.args.input.threadId),
								"userId": $util.toJson($userId)
							}
						}
					}
				}
			`),
				responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
			}
		);

		// Get unread count resolver
		threadsDataSource.createResolver("GetUnreadCountResolver", {
			typeName: "Query",
			fieldName: "getUnreadCount",
			requestMappingTemplate: appsync.MappingTemplate.fromString(`
				#set($userId = $ctx.identity.sub)
				#if($ctx.args.userId)
					#set($userId = $ctx.args.userId)
				#end
				#if($userId)
				{
					"version": "2017-02-28",
					"operation": "Query",
					"query": {
						"expression": "userId = :userId",
						"expressionValues": {
							":userId": $util.dynamodb.toDynamoDBJson($userId)
						}
					}
				}
				#else
				$util.error("User ID is required", "BadRequest")
				#end
			`),
			responseMappingTemplate: appsync.MappingTemplate.fromString(`
				#set($totalUnread = 0)
				#foreach($item in $ctx.result.items)
					#set($totalUnread = $totalUnread + $item.unreadCount)
				#end
				$totalUnread
			`),
		});

		// Output important values
		new cdk.CfnOutput(this, "NotificationsQueueUrl", {
			value: notificationsQueue.queueUrl,
			description: "SQS Notifications Queue URL",
			exportName: "EduMatch-NotificationsQueueUrl",
		});

		new cdk.CfnOutput(this, "EmailsQueueUrl", {
			value: emailsQueue.queueUrl,
			description: "SQS Emails Queue URL",
			exportName: "EduMatch-EmailsQueueUrl",
		});

		new cdk.CfnOutput(this, "NotificationProcessorArn", {
			value: notificationProcessor.functionArn,
			description: "Notification Processor Lambda ARN",
			exportName: "EduMatch-NotificationProcessorArn",
		});

		new cdk.CfnOutput(this, "EmailProcessorArn", {
			value: emailProcessor.functionArn,
			description: "Email Processor Lambda ARN",
			exportName: "EduMatch-EmailProcessorArn",
		});

		new cdk.CfnOutput(this, "AppSyncApiEndpoint", {
			value: api.graphqlUrl,
			description: "AppSync GraphQL API Endpoint",
			exportName: "EduMatch-AppSyncApiEndpoint",
		});

		new cdk.CfnOutput(this, "AppSyncApiKey", {
			value: api.apiKey || "No API Key",
			description: "AppSync API Key",
			exportName: "EduMatch-AppSyncApiKey",
		});

		new cdk.CfnOutput(this, "MessagesTableName", {
			value: messagesTable.tableName,
			description: "Messages DynamoDB Table Name",
			exportName: "EduMatch-MessagesTableName",
		});

		new cdk.CfnOutput(this, "ThreadsTableName", {
			value: threadsTable.tableName,
			description: "Threads DynamoDB Table Name",
			exportName: "EduMatch-ThreadsTableName",
		});
	}
}
