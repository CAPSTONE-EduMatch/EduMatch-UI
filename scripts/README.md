# SQS Queue Checker Scripts

These scripts help you check the status of SQS queues without deploying code.

## Prerequisites

### For Node.js script:

- Node.js installed
- AWS SDK v3 installed: `npm install @aws-sdk/client-sqs`
- Environment variables set:
  - `AWS_ACCESS_KEY_ID` or `ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY` or `SECRET_ACCESS_KEY`
  - `AWS_REGION` or `REGION` (defaults to `ap-northeast-1`)

### For Bash script:

- AWS CLI installed and configured
- Environment variables set:
  - `AWS_REGION` or `REGION` (defaults to `ap-northeast-1`)

## Usage

### Node.js Script (Recommended)

**On Windows (PowerShell):**

```powershell
# Set environment variables (replace with your actual credentials)
$env:AWS_ACCESS_KEY_ID="your-access-key-id"
$env:AWS_SECRET_ACCESS_KEY="your-secret-access-key"
$env:AWS_REGION="ap-northeast-1"  # Optional, defaults to ap-northeast-1

# Run the script
node scripts/check-sqs-queues.js
```

**On Linux/Mac:**

```bash
# Set environment variables
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
export AWS_REGION="ap-northeast-1"  # Optional

# Run the script
node scripts/check-sqs-queues.js
```

**Quick one-liner (PowerShell):**

```powershell
$env:AWS_ACCESS_KEY_ID="your-key"; $env:AWS_SECRET_ACCESS_KEY="your-secret"; node scripts/check-sqs-queues.js
```

### Bash Script (AWS CLI)

```bash
# Make the script executable
chmod +x scripts/check-sqs-queues.sh

# Run it
./scripts/check-sqs-queues.sh
```

## What it shows:

1. **Queue URLs** - The full AWS SQS queue URLs
2. **Message Counts** - How many messages are waiting in each queue
3. **In-flight Messages** - Messages currently being processed
4. **Delayed Messages** - Messages scheduled for later
5. **Message Preview** - A peek at up to 5 messages (without consuming them)

## Example Output

```
🔍 SQS Queue Checker
📍 Region: ap-northeast-1
🔑 Access Key: ✅ Set
🔐 Secret Key: ✅ Set

============================================================
📬 Checking Notifications Queue: edumatch-notifications.fifo
============================================================
📍 Queue URL: https://sqs.ap-northeast-1.amazonaws.com/123456789012/edumatch-notifications.fifo

📊 Queue Attributes:
   Approximate Number of Messages: 3
   Messages Not Visible (in flight): 0
   Delayed Messages: 0

👀 Peeking at up to 5 messages (not consuming them):

   Message 1:
   📧 Message ID: abc123...
   📋 Receipt Handle: AQEBzW...
   🏷️  Attributes:
      Type: WISHLIST_DEADLINE
      User ID: user-123
      User Email: user@example.com
   📄 Body:
      Type: WISHLIST_DEADLINE
      User ID: user-123
      User Email: user@example.com
      Metadata: {
        postId: "post-456",
        postTitle: "Test Program",
        ...
      }
```

## Troubleshooting

### "Could not find queue"

- Make sure the queue names are correct
- Check that you're using the right AWS region
- Verify your AWS credentials have permissions to access SQS

### "AWS credentials not found"

- **PowerShell:** Set environment variables:
  ```powershell
  $env:AWS_ACCESS_KEY_ID="your-key"
  $env:AWS_SECRET_ACCESS_KEY="your-secret"
  ```
- **Bash/Linux:** Set environment variables:
  ```bash
  export AWS_ACCESS_KEY_ID="your-key"
  export AWS_SECRET_ACCESS_KEY="your-secret"
  ```
- Or configure AWS CLI: `aws configure`
- **Note:** These credentials should match the ones used in your `.env` file for
  the application

### "No messages visible"

- Messages might be in-flight (being processed)
- Messages might be delayed
- The queue might actually be empty
