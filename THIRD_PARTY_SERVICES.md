# Third-Party Libraries & Service Configuration for EduMatch Platform

## 1. Overview

The EduMatch platform integrates multiple third-party services and libraries to
provide comprehensive functionality including payment processing,
authentication, file storage, real-time messaging, AI-powered document
validation, email notifications, and cloud infrastructure. This document
provides a complete listing of all third-party integrations along with their
configuration details, API keys, webhooks, rate limits, and integration
patterns.

---

## 2. Third-Party Services & Libraries

### 2.1. Stripe (Payment Processing)

**Type:** Third-party payment service

**Purpose:**

- Subscription management for applicants and institutions
- Payment processing for premium plans
- Invoice generation and management
- Webhook-based payment event handling

**Key Features Used in EduMatch:**

- Subscription lifecycle management (create, update, cancel)
- Multiple pricing tiers (Standard, Premium, Institution Monthly/Yearly)
- Payment intent handling
- Invoice creation and tracking
- Customer portal integration
- Webhook event processing

**Configuration:**

**API Keys:**

- **Server-side Secret Key:** `STRIPE_SECRET_KEY`
  - Used for: Server-side operations (subscription creation, invoice management)
  - Location: Server environment variables only
  - Format: `sk_live_...` (production) or `sk_test_...` (development)
- **Client-side Publishable Key:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - Used for: Client-side Stripe.js initialization
  - Location: Public environment variables (safe to expose)
  - Format: `pk_live_...` (production) or `pk_test_...` (development)

**Price IDs Configuration:**

- `STRIPE_STANDARD_PRICE_ID` / `NEXT_PUBLIC_STRIPE_STANDARD_PRICE_ID`
- `STRIPE_PREMIUM_PRICE_ID` / `NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID`
- `STRIPE_INSTITUTION_MONTHLY_PRICE_ID` /
  `NEXT_PUBLIC_STRIPE_INSTITUTION_MONTHLY_PRICE_ID`
- `STRIPE_INSTITUTION_YEARLY_PRICE_ID` /
  `NEXT_PUBLIC_STRIPE_INSTITUTION_YEARLY_PRICE_ID`

**Webhook Configuration:**

- **Webhook Secret:** `STRIPE_WEBHOOK_SECRET`
  - Used for: Verifying webhook signatures from Stripe
  - Location: Server environment variables only
  - Format: `whsec_...`
- **Webhook Endpoint:** `/api/webhooks/stripe`
  - Handles events: `customer.subscription.created`,
    `customer.subscription.updated`, `customer.subscription.deleted`,
    `invoice.payment_succeeded`, `invoice.payment_failed`, `invoice.created`,
    `invoice.updated`, `checkout.session.completed`

**Callback URLs:**

- **Success URL:** Configured in Stripe Checkout session
- **Cancel URL:** Configured in Stripe Checkout session
- **Billing Portal Return URL:** Configured in Better Auth Stripe plugin

**Rate Limits:**

- **API Requests:** 100 requests per second per API key (default)
- **Webhooks:** No specific rate limit, but Stripe recommends handling events
  idempotently
- **Checkout Sessions:** No specific limit, but subject to Stripe's general rate
  limits

**Integration Points:**

- `src/config/auth.ts` - Better Auth Stripe plugin configuration
- `src/config/stripe.ts` - Client-side Stripe.js initialization
- `src/app/api/webhooks/stripe/route.ts` - Webhook handler
- `src/config/auth-client.ts` - Client-side Stripe subscription management

**API Version:** `2025-08-27.basil`

---

### 2.2. Better Auth (Authentication Framework)

**Type:** Third-party authentication library

**Purpose:**

- User authentication and session management
- OAuth provider integration (Google)
- Email/Password authentication
- Email OTP (One-Time Password) verification
- Admin role management
- Custom session optimization

**Key Features Used in EduMatch:**

- Email/password authentication with email verification
- Google OAuth (One Tap and standard OAuth)
- Email OTP for passwordless authentication
- Session management with Redis caching
- Admin role-based access control
- Stripe subscription integration

**Configuration:**

**API Keys / Secrets:**

- **Auth Secret:** `BETTER_AUTH_SECRET`
  - Used for: Signing and encrypting session tokens
  - Location: Server environment variables only
  - Format: Random secure string (minimum 32 characters)
- **Base URL:** `BETTER_AUTH_URL` / `NEXT_PUBLIC_BETTER_AUTH_URL`
  - Used for: OAuth redirects and callback URLs
  - Format: `https://yourdomain.com` (production) or `http://localhost:3000`
    (development)

**OAuth Provider Configuration (Google):**

- **Client ID:** `GOOGLE_CLIENT_ID` / `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
  - Used for: Google OAuth authentication
  - Location: Both server and client (public key is safe)
- **Client Secret:** `GOOGLE_CLIENT_SECRET`
  - Used for: Server-side OAuth token exchange
  - Location: Server environment variables only

**Google One Tap Configuration:**

- **Client ID:** `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- **Auto-select:** Disabled (user must manually select account)
- **Context:** `signin`
- **UX Mode:** `popup`
- **FedCM API:** Enabled (reduces browser warnings)

**Callback URLs:**

- **Google OAuth Redirect:** `/api/auth/callback/google`
- **Email Verification:** `/verify-email?token={token}`
- **Password Reset:** `/forgot-password?token={token}`

**Rate Limits:**

- **OTP Generation:** 5 attempts per 15 minutes per email (configurable)
- **Password Reset:** Rate limited via OTP rate limiting system
- **Session Refresh:** Optimized to reduce API calls (10-minute cookie cache,
  30-minute update age)

**Integration Points:**

- `src/config/auth.ts` - Server-side auth configuration
- `src/config/auth-client.ts` - Client-side auth client
- `src/config/otp-rate-limit.ts` - OTP rate limiting logic

---

### 2.3. AWS Services

#### 2.3.1. Amazon S3 (Simple Storage Service)

**Type:** Cloud storage service

**Purpose:**

- File upload and storage (documents, images, CVs, transcripts)
- Pre-signed URL generation for secure file access
- Multipart upload support for large files

**Key Features Used in EduMatch:**

- Private file storage with ACL restrictions
- Pre-signed URLs for temporary file access (1-hour expiration)
- Multipart upload for files larger than 5MB
- File metadata tracking (userId, originalName, uploadedAt)

**Configuration:**

**API Keys / Credentials:**

- **Access Key ID:** `ACCESS_KEY_ID`
  - Used for: AWS API authentication
  - Location: Server environment variables only
- **Secret Access Key:** `SECRET_ACCESS_KEY`
  - Used for: AWS API authentication
  - Location: Server environment variables only

**S3 Configuration:**

- **Region:** `REGION` (default: `us-east-1`)
- **Bucket Name:** `S3_BUCKET_NAME` (default: `edumatch-file-12`)
- **File Size Limit:** 10MB (configurable via `MAX_FILE_SIZE`)
- **Chunk Size:** 5MB (configurable via `CHUNK_SIZE`)

**File Access:**

- **ACL:** `private` (files are not publicly accessible)
- **Pre-signed URL Expiration:** 1 hour (3600 seconds)
- **Protected Image Endpoint:** `/api/files/protected-image?url={s3-url}`

**Rate Limits:**

- **PUT Requests:** 3,500 PUT requests per second per prefix
- **GET Requests:** 5,500 GET requests per second per prefix
- **Multipart Upload:** Subject to S3 general rate limits

**Integration Points:**

- `src/app/api/files/presigned-url/route.ts` - Pre-signed URL generation
- `src/app/api/files/s3-upload/route.ts` - Direct file upload
- `src/services/document/document-service.ts` - Document service wrapper
- `src/hooks/files/usePresignedUpload.ts` - Client-side upload hook

---

#### 2.3.2. Amazon SQS (Simple Queue Service)

**Type:** Message queue service

**Purpose:**

- Asynchronous notification processing
- Email queue management
- Decoupled event handling

**Key Features Used in EduMatch:**

- FIFO queues for ordered message processing
- Message deduplication
- Long polling (20 seconds wait time)
- Message attributes for filtering

**Configuration:**

**API Keys / Credentials:**

- **Access Key ID:** `ACCESS_KEY_ID` (shared with S3)
- **Secret Access Key:** `SECRET_ACCESS_KEY` (shared with S3)
- **Region:** `REGION` (default: `ap-northeast-1`)

**Queue URLs:**

- **Notifications Queue:** `SQS_NOTIFICATIONS_QUEUE_URL`
  - Used for: In-app notification messages
  - Message Group ID: User ID (for FIFO ordering)
- **Emails Queue:** `SQS_EMAILS_QUEUE_URL`
  - Used for: Email notification messages
  - Message Group ID: User email (for FIFO ordering)

**Message Types:**

- `PROFILE_CREATED`, `PAYMENT_DEADLINE`, `APPLICATION_STATUS_UPDATE`,
  `DOCUMENT_UPDATED`, `PAYMENT_SUCCESS`, `PAYMENT_FAILED`,
  `SUBSCRIPTION_EXPIRING`, `WELCOME`, `USER_BANNED`, `SESSION_REVOKED`,
  `WISHLIST_DEADLINE`, `PASSWORD_CHANGED`, `ACCOUNT_DELETED`, `SUPPORT_REPLY`,
  `POST_STATUS_UPDATE`, `INSTITUTION_PROFILE_STATUS_UPDATE`

**Rate Limits:**

- **Send Message:** 3,000 messages per second per queue (FIFO)
- **Receive Message:** 3,000 messages per second per queue (FIFO)
- **Batch Operations:** 10 messages per batch

**Integration Points:**

- `src/config/sqs-config.ts` - SQS service configuration and message types
- `src/services/messaging/sqs-handlers.ts` - Message handlers

---

#### 2.3.3. AWS AppSync (GraphQL API)

**Type:** Managed GraphQL service

**Purpose:**

- Real-time messaging infrastructure
- GraphQL API for message and thread management
- Subscription-based real-time updates

**Key Features Used in EduMatch:**

- GraphQL mutations for creating messages and threads
- GraphQL queries for fetching messages and threads
- Real-time subscriptions (via WebSocket)
- API key authentication (primary method)
- User context obtained from Better Auth session

**Configuration:**

**API Keys / Endpoints:**

- **AppSync Endpoint:** `NEXT_PUBLIC_APPSYNC_ENDPOINT`
  - Used for: GraphQL API endpoint URL
  - Format: `https://{api-id}.appsync-api.{region}.amazonaws.com/graphql`
- **API Key:** `NEXT_PUBLIC_APPSYNC_API_KEY`
  - Used for: API key authentication (default and primary auth mode)
  - Location: Public environment variable (safe to expose)
  - Expiration: 365 days (configurable in CDK)

- **Region:** `NEXT_PUBLIC_AWS_REGION` (default: `ap-northeast-1`)

**Authentication Flow:**

- **Primary Method:** API Key authentication
  - All AppSync requests use API key authentication
  - User context is obtained from Better Auth session
    (`authClient.getSession()`)
  - User ID, name, and image are passed in GraphQL mutation/query variables
- **Cognito Configuration (Not Actively Used):**
  - Cognito User Pool is configured in CDK infrastructure as an additional
    authorization mode
  - However, the application does not use Cognito for authentication
  - User authentication is handled entirely by Better Auth
  - Cognito environment variables (`NEXT_PUBLIC_COGNITO_USER_POOL_ID`, etc.) are
    present in the code but use empty string fallbacks, indicating they are not
    required

**Rate Limits:**

- **API Key:** 1,000 requests per day (default, can be increased)
- **WebSocket Connections:** 1,000 concurrent connections per API

**Integration Points:**

- `src/services/messaging/appsync-client.ts` - AppSync client configuration
  (uses API key auth, gets user context from Better Auth)
- `infrastructure/lib/edumatch-notification-stack.ts` - CDK infrastructure
  definition (Cognito configured but not used)

**Note:** While Cognito User Pool is configured in the CDK infrastructure as an
additional authorization mode, the application does not actively use it. All
authentication is handled by Better Auth, and AppSync operations use API key
authentication with user context passed from Better Auth sessions.

---

#### 2.3.4. AWS Lambda (Serverless Functions)

**Type:** Serverless compute service

**Purpose:**

- Message and thread management logic
- Real-time notification processing
- Background job processing

**Configuration:**

- Defined in CDK infrastructure
  (`infrastructure/lib/edumatch-notification-stack.ts`)
- Runtime: Node.js 18.x
- Timeout: 30 seconds (configurable)
- Memory: 256 MB (configurable)

**Integration Points:**

- `infrastructure/lib/edumatch-notification-stack.ts` - Lambda function
  definitions

---

#### 2.3.5. AWS DynamoDB (NoSQL Database)

**Type:** Managed NoSQL database

**Purpose:**

- Message storage for real-time chat
- Thread/conversation storage
- Message read receipts

**Configuration:**

- Tables defined in CDK infrastructure
- Used by AppSync resolvers and Lambda functions

**Integration Points:**

- `infrastructure/lib/edumatch-notification-stack.ts` - DynamoDB table
  definitions

---

### 2.4. Mistral AI

**Type:** Third-party AI service

**Purpose:**

- Document OCR (Optical Character Recognition)
- AI-powered file validation
- Text extraction from images and PDFs

**Key Features Used in EduMatch:**

- OCR processing for images and PDFs
- Document validation using AI models
- File type verification (CVs, transcripts, certificates)

**Configuration:**

**API Keys:**

- **API Key:** `NEXT_PUBLIC_MISTRAL_OCR_API_KEY`
  - Used for: Authenticating Mistral AI API requests
  - Location: Public environment variable (required for client-side OCR)
  - Format: Mistral API key string

**Service Configuration:**

- **API Endpoint:** `https://api.mistral.ai/v1/chat/completions`
- **OCR Enabled Flag:** `NEXT_PUBLIC_MISTRAL_OCR_ENABLED` (must be `"true"` to
  enable)
- **Model:** `mistral-large-latest` (for validation), `pixtral-12b-2409` (for
  OCR)

**Rate Limits:**

- **Free Tier:** Limited requests per month (check Mistral AI documentation)
- **Paid Tier:** Higher rate limits based on subscription plan
- **Rate Limit Headers:** Check `x-ratelimit-*` headers in API responses

**Integration Points:**

- `src/services/ocr/mistral-ocr-service.ts` - OCR service implementation
- `src/services/ai/ollama-file-validation-service.ts` - File validation using
  Mistral AI

---

### 2.5. Ollama (AI Service)

**Type:** Third-party AI service

**Purpose:**

- AI model inference for document validation
- Alternative AI service for file processing

**Configuration:**

**API Keys:**

- **API Key:** `OLLAMA_API_KEY`
  - Used for: Authenticating Ollama Cloud API requests
  - Location: Server environment variables only
  - Format: Ollama API key string

**Service Configuration:**

- **API Base URL:** `https://ollama.com/api`
- **Endpoint:** `/generate`
- **Authentication:** Bearer token in Authorization header

**Rate Limits:**

- Subject to Ollama Cloud service limits (check Ollama documentation)

**Integration Points:**

- `src/app/api/ollama/generate/route.ts` - Ollama API proxy endpoint

---

### 2.6. Redis

**Type:** In-memory data store

**Purpose:**

- Session caching to reduce database load
- OTP rate limiting storage
- Cache management for API responses

**Key Features Used in EduMatch:**

- Session storage (10-minute cache, 7-day expiration)
- OTP attempt tracking
- API response caching

**Configuration:**

**Connection:**

- **Redis URL:** `REDIS_URL`
  - Format: `redis://{host}:{port}` or `rediss://{host}:{port}` (SSL)
  - Example: `redis://localhost:6379` (development)
  - Location: Server environment variables only

**Session Configuration:**

- **Cache Max Age:** 10 minutes (600 seconds)
- **Session Expiration:** 7 days
- **Update Age:** 30 minutes (session refresh interval)
- **Fresh Age:** 10 minutes (for sensitive operations)

**Rate Limits:**

- **OTP Rate Limit:** 5 attempts per 15 minutes per email address
- **Redis Connection Pool:** Default connection pool settings

**Integration Points:**

- `src/config/redis.ts` - Redis client configuration
- `src/config/auth.ts` - Session storage using Redis
- `src/config/otp-rate-limit.ts` - OTP rate limiting with Redis

**Fallback Behavior:**

- If Redis URL is not configured or connection fails, the system falls back to
  memory-only session storage (not persistent across restarts)

---

### 2.7. Nodemailer (SMTP Email Service)

**Type:** Node.js email library

**Purpose:**

- Sending transactional emails
- Email notifications for users
- OTP delivery via email

**Key Features Used in EduMatch:**

- Welcome emails
- Password reset emails
- Application status update emails
- Payment notification emails
- Support reply emails
- Profile creation confirmation emails

**Configuration:**

**SMTP Configuration:**

- **SMTP Host:** `SMTP_HOST`
  - Used for: SMTP server hostname
  - Example: `smtp.gmail.com`, `smtp.sendgrid.net`
- **SMTP Port:** `SMTP_PORT` (default: `587`)
  - Used for: SMTP server port
  - Common values: `587` (TLS), `465` (SSL), `25` (unencrypted, not recommended)
- **SMTP User:** `SMTP_USER`
  - Used for: SMTP authentication username
  - Format: Email address or username
- **SMTP Password:** `SMTP_PASS`
  - Used for: SMTP authentication password
  - Location: Server environment variables only
- **From Address:** `SMTP_FROM`
  - Used for: Default sender email address
  - Format: `"EduMatch" <noreply@edumatch.com>` or `noreply@edumatch.com`

**Email Templates:**

- Welcome email
- Profile created email
- Payment deadline email
- Application status update email
- Document updated email
- Payment success/failed emails
- Subscription expiring email
- User banned email
- Session revoked email
- Wishlist deadline email
- Password changed email
- Account deleted email
- Support reply email
- Post status update email
- Institution profile status update email

**Rate Limits:**

- **SMTP Provider Limits:** Subject to your SMTP provider's rate limits
  - Gmail: 500 emails per day (free), 2,000 per day (Google Workspace)
  - SendGrid: Varies by plan (free tier: 100 emails/day)
  - AWS SES: 200 emails per day (sandbox), higher limits (production)
- **Application-Level:** No specific rate limiting in Nodemailer itself

**Integration Points:**

- `src/services/email/email-service.ts` - Email service implementation
- `src/services/email/email-template.ts` - Email template generators
- `src/config/auth.ts` - OTP and password reset email sending

---

### 2.8. Google Cloud Translate (Installed but Usage Unclear)

**Type:** Third-party translation API

**Purpose:**

- Potential use for dynamic translation (if implemented)
- Currently installed as dependency but may not be actively used

**Configuration:**

**API Keys:**

- **API Key:** Not currently configured in environment variables
- **Service Account:** Not currently configured

**Note:** This service is listed in `package.json` but may not be actively
integrated. If used, it would require:

- Google Cloud project setup
- Translation API enabled
- API key or service account credentials
- Billing enabled on Google Cloud project

**Rate Limits:**

- **Free Tier:** 500,000 characters per month
- **Paid Tier:** Higher limits based on usage

---

### 2.9. Ably (Real-Time Messaging - Installed but Usage Unclear)

**Type:** Third-party real-time messaging service

**Purpose:**

- Potential use for real-time chat functionality
- Currently installed as dependency but may not be actively used

**Configuration:**

**API Keys:**

- **Ably API Key:** Not currently configured in environment variables

**Note:** This service is listed in `package.json` (`@ably/chat`,
`@ably/chat-react-ui-components`, `ably`) but may not be actively integrated.
The platform currently uses AWS AppSync for real-time messaging.

**If Used, Would Require:**

- Ably account setup
- API key configuration
- Channel configuration
- Client library initialization

**Rate Limits:**

- Subject to Ably plan limits (free tier: 2 million messages/month)

---

### 2.10. Socket.io (Real-Time Communication - Installed but Usage Unclear)

**Type:** WebSocket library

**Purpose:**

- Potential use for real-time bidirectional communication
- Currently installed as dependency but may not be actively used

**Configuration:**

**Server Configuration:**

- **Port:** Not currently configured (would typically use Next.js API routes)
- **CORS:** Would need to be configured if used

**Note:** This service is listed in `package.json` (`socket.io`,
`socket.io-client`) but may not be actively integrated. The platform currently
uses AWS AppSync for real-time messaging.

**If Used, Would Require:**

- Socket.io server setup
- Client connection configuration
- Event handling setup

**Rate Limits:**

- No specific rate limits (subject to server resources)

---

### 2.11. next-intl (Internationalization)

**Type:** Third-party Next.js i18n library

**Purpose:**

- Multilingual support (English and Vietnamese)
- Locale-based routing
- Static translation file management

**Key Features Used in EduMatch:**

- Locale-aware routing (`/en/...`, `/vi/...`)
- File-based message loading (`en.json`, `vi.json`)
- Automatic language fallback
- Server and Client Component translation support

**Configuration:**

**No External API Keys Required:**

- All translations are stored locally in JSON files
- No external translation API calls
- No API keys, callbacks, or webhooks needed

**File Structure:**

- Translation files: `messages/en.json`, `messages/vi.json`
- Middleware: Automatic locale detection and redirection

**Rate Limits:**

- No rate limits (local file-based system)

**Integration Points:**

- `next.config.js` - Next.js plugin configuration
- `src/middleware.ts` - Locale middleware
- Translation files in `messages/` directory

**Note:** This service is fully documented in a separate i18n configuration
document.

---

## 3. Environment Variables Summary

### Required Server-Side Environment Variables

```bash
# Database
DATABASE_URL=

# Authentication
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STANDARD_PRICE_ID=
STRIPE_PREMIUM_PRICE_ID=
STRIPE_INSTITUTION_MONTHLY_PRICE_ID=
STRIPE_INSTITUTION_YEARLY_PRICE_ID=

# AWS
REGION=
ACCESS_KEY_ID=
SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
SQS_NOTIFICATIONS_QUEUE_URL=
SQS_EMAILS_QUEUE_URL=

# Redis
REDIS_URL=

# SMTP
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# AI Services
OLLAMA_API_KEY=
```

### Required Client-Side Environment Variables (NEXT*PUBLIC*\*)

```bash
# Authentication
NEXT_PUBLIC_BETTER_AUTH_URL=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_STRIPE_STANDARD_PRICE_ID=
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=
NEXT_PUBLIC_STRIPE_INSTITUTION_MONTHLY_PRICE_ID=
NEXT_PUBLIC_STRIPE_INSTITUTION_YEARLY_PRICE_ID=

# AWS AppSync
NEXT_PUBLIC_APPSYNC_ENDPOINT=
NEXT_PUBLIC_APPSYNC_API_KEY=
NEXT_PUBLIC_AWS_REGION=
# Note: Cognito environment variables are not required - Cognito is configured in CDK but not actively used
# NEXT_PUBLIC_COGNITO_USER_POOL_ID= (optional, not used)
# NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID= (optional, not used)
# NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID= (optional, not used)

# AI Services
NEXT_PUBLIC_MISTRAL_OCR_API_KEY=
NEXT_PUBLIC_MISTRAL_OCR_ENABLED=
```

---

## 4. Webhook Configuration

### Stripe Webhooks

**Endpoint:** `https://yourdomain.com/api/webhooks/stripe`

**Events Handled:**

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `invoice.created`
- `invoice.updated`
- `checkout.session.completed`

**Configuration Steps:**

1. Log in to Stripe Dashboard
2. Navigate to Developers → Webhooks
3. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen to (listed above)
5. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET` environment variable

**Security:**

- Webhook signature verification using `stripe.webhooks.constructEvent()`
- Signature header: `stripe-signature`
- Webhook secret required for production (can be bypassed in development with
  `ALLOW_UNSAFE_WEBHOOK=true`)

---

## 5. Callback URLs Configuration

### Google OAuth Callback

**URL:** `{BETTER_AUTH_URL}/api/auth/callback/google`

**Configuration Steps:**

1. Log in to Google Cloud Console
2. Navigate to APIs & Services → Credentials
3. Edit OAuth 2.0 Client ID
4. Add authorized redirect URI:
   `https://yourdomain.com/api/auth/callback/google`
5. For development: `http://localhost:3000/api/auth/callback/google`

### Stripe Checkout Callbacks

**Success URL:** Configured per checkout session **Cancel URL:** Configured per
checkout session

**Configuration:**

- Set in Stripe Checkout session creation
- Typically: `{BASE_URL}/payment/success` and `{BASE_URL}/payment/cancel`

---

## 6. Rate Limits Summary

| Service             | Rate Limit               | Notes                       |
| ------------------- | ------------------------ | --------------------------- |
| Stripe API          | 100 req/sec per key      | Can be increased on request |
| Stripe Webhooks     | No specific limit        | Handle idempotently         |
| Better Auth OTP     | 5 attempts / 15 min      | Per email address           |
| AWS S3 PUT          | 3,500 req/sec per prefix | Per bucket                  |
| AWS S3 GET          | 5,500 req/sec per prefix | Per bucket                  |
| AWS SQS Send        | 3,000 msg/sec (FIFO)     | Per queue                   |
| AWS AppSync API Key | 1,000 req/day (default)  | Can be increased            |
| Mistral AI          | Varies by plan           | Check Mistral documentation |
| Ollama              | Varies by plan           | Check Ollama documentation  |
| SMTP (Gmail)        | 500 emails/day (free)    | 2,000/day (Workspace)       |
| SMTP (SendGrid)     | 100 emails/day (free)    | Varies by paid plan         |
| Redis               | No specific limit        | Subject to server resources |

---

## 7. Security Best Practices

### API Key Management

- **Never commit API keys to version control**
- Use environment variables for all secrets
- Rotate API keys regularly
- Use different keys for development and production
- Restrict API key permissions where possible (principle of least privilege)

### Webhook Security

- Always verify webhook signatures (Stripe, etc.)
- Use HTTPS for all webhook endpoints
- Validate webhook payloads before processing
- Implement idempotency for webhook handlers

### OAuth Security

- Use secure redirect URIs (HTTPS in production)
- Validate state parameters
- Store OAuth tokens securely (encrypted at rest)
- Implement token refresh logic

### File Upload Security

- Validate file types and sizes
- Use pre-signed URLs with expiration
- Set appropriate ACLs (private by default)
- Scan uploaded files for malware (if applicable)

---

## 8. Monitoring and Debugging

### Stripe

- **Dashboard:** https://dashboard.stripe.com
- Monitor webhook delivery in Developers → Webhooks
- Check API usage in Developers → API logs

### AWS Services

- **CloudWatch:** Monitor Lambda functions, API Gateway, AppSync
- **S3 Access Logs:** Enable for audit trails
- **SQS Metrics:** Monitor queue depth and message processing

### Redis

- Monitor connection status and memory usage
- Check for connection errors in application logs

### SMTP

- Monitor email delivery rates
- Check bounce and spam reports
- Review SMTP provider dashboard for delivery statistics

---

## 9. Cost Considerations

### Stripe

- **Transaction Fees:** 2.9% + $0.30 per successful card charge
- **Subscription Management:** No additional fees
- **Webhooks:** Free

### AWS Services

- **S3:** Pay per GB storage and requests
- **SQS:** $0.40 per million requests
- **AppSync:** $4.00 per million queries + $2.00 per million mutations
- **Lambda:** Pay per invocation and compute time
- **DynamoDB:** Pay per read/write capacity units

### Mistral AI

- Pay per API call based on model and tokens used
- Check current pricing on Mistral AI website

### Redis

- Self-hosted: Infrastructure costs only
- Managed (e.g., AWS ElastiCache): Pay per instance size

### SMTP

- Free tiers available (Gmail, SendGrid)
- Paid plans for higher volume

---

## 10. Conclusion

The EduMatch platform integrates multiple third-party services to provide a
comprehensive educational matching experience. Key integrations include:

- **Payment Processing:** Stripe for subscriptions and payments
- **Authentication:** Better Auth with Google OAuth
- **File Storage:** AWS S3 for document management
- **Real-Time Messaging:** AWS AppSync for chat functionality
- **AI Services:** Mistral AI and Ollama for document validation and OCR
- **Email:** Nodemailer with SMTP for transactional emails
- **Caching:** Redis for session and API response caching
- **Message Queues:** AWS SQS for asynchronous processing
- **Internationalization:** next-intl for multilingual support

All services are configured via environment variables, with proper separation
between server-side secrets and client-side public keys. Webhook endpoints are
secured with signature verification, and rate limiting is implemented where
applicable to ensure system stability and cost control.
