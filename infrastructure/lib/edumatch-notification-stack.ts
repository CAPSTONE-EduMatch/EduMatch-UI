import * as cdk from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
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
  console.log('Processing notification messages:', JSON.stringify(event, null, 2));
  
  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      console.log('Processing notification:', message.type, 'for user:', message.userId);
      
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
      console.log('Message forwarded to email queue:', message.type, 'for:', message.userEmail);
      
    } catch (error) {
      console.error('Error processing notification:', error);
      throw error; // This will trigger retry
    }
  }
};
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
  console.log('Processing email messages:', JSON.stringify(event, null, 2));
  
  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      console.log('Processing email:', message.type, 'for:', message.userEmail);
      
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
          const result = await localhostResponse.json();
          console.log('Email sent successfully via localhost:', {
            to: message.userEmail,
            subject: emailContent.subject,
            type: message.type,
            messageId: result.messageId,
            timestamp: new Date().toISOString()
          });
          continue; // Skip to next message
        }
      } catch (localhostError) {
        console.log('Localhost not available, trying deployed URL...');
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
      
      if (response.ok) {
        const result = await response.json();
        console.log('Email sent successfully via deployed URL:', {
          to: message.userEmail,
          subject: emailContent.subject,
          type: message.type,
          messageId: result.messageId,
          timestamp: new Date().toISOString()
        });
      } else {
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
	}
}
