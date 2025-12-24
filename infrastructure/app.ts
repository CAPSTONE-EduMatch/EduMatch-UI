#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { EduMatchNotificationStack } from "./lib/edumatch-notification-stack";

const app = new cdk.App();

// Get environment from context or use default
const env = {
	account: process.env.CDK_DEFAULT_ACCOUNT,
	region: process.env.CDK_DEFAULT_REGION || "ap-northeast-1",
};

// Create the stack
new EduMatchNotificationStack(app, "EduMatchNotificationStack", {
	env,
	description: "EduMatch SQS and Lambda infrastructure for notifications",
});

app.synth();
