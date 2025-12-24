#!/bin/bash

# Script to check SQS queues using AWS CLI
# Usage: ./scripts/check-sqs-queues.sh

set -e

REGION=${AWS_REGION:-${REGION:-ap-northeast-1}}
NOTIFICATIONS_QUEUE="edumatch-notifications.fifo"
EMAILS_QUEUE="edumatch-emails.fifo"

echo "🔍 SQS Queue Checker (AWS CLI)"
echo "📍 Region: $REGION"
echo ""

# Function to check a queue
check_queue() {
    local queue_name=$1
    local display_name=$2
    
    echo "============================================================"
    echo "📬 Checking $display_name Queue: $queue_name"
    echo "============================================================"
    
    # Get queue URL
    QUEUE_URL=$(aws sqs get-queue-url --queue-name "$queue_name" --region "$REGION" --query 'QueueUrl' --output text 2>/dev/null)
    
    if [ -z "$QUEUE_URL" ]; then
        echo "❌ Could not find queue: $queue_name"
        echo ""
        return
    fi
    
    echo "📍 Queue URL: $QUEUE_URL"
    echo ""
    
    # Get queue attributes
    echo "📊 Queue Attributes:"
    aws sqs get-queue-attributes \
        --queue-url "$QUEUE_URL" \
        --attribute-names \
            ApproximateNumberOfMessages \
            ApproximateNumberOfMessagesNotVisible \
            ApproximateNumberOfMessagesDelayed \
        --region "$REGION" \
        --query 'Attributes' \
        --output table
    
    # Get message count
    MSG_COUNT=$(aws sqs get-queue-attributes \
        --queue-url "$QUEUE_URL" \
        --attribute-names ApproximateNumberOfMessages \
        --region "$REGION" \
        --query 'Attributes.ApproximateNumberOfMessages' \
        --output text)
    
    if [ "$MSG_COUNT" -gt 0 ]; then
        echo ""
        echo "👀 Peeking at up to 5 messages (not consuming them):"
        echo ""
        
        # Receive messages (peek only, don't delete)
        aws sqs receive-message \
            --queue-url "$QUEUE_URL" \
            --max-number-of-messages 5 \
            --wait-time-seconds 0 \
            --message-attribute-names All \
            --region "$REGION" \
            --query 'Messages[*].{MessageId:MessageId,Type:MessageAttributes.Type.StringValue,UserEmail:MessageAttributes.UserEmail.StringValue,Body:Body}' \
            --output table 2>/dev/null || echo "   ⚠️  Could not peek messages (may be in flight)"
    else
        echo ""
        echo "✅ Queue is empty - no messages waiting"
    fi
    
    echo ""
}

# Check both queues
check_queue "$NOTIFICATIONS_QUEUE" "Notifications"
check_queue "$EMAILS_QUEUE" "Emails"

echo "============================================================"
echo "✅ Queue check complete!"
echo "============================================================"

