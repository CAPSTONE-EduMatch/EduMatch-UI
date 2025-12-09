# EduMatch

**Match. Apply. Succeed.**

EduMatch is a comprehensive platform that connects students and applicants with
educational institutions, scholarships, research programs, and graduate
opportunities worldwide. Our intelligent matching system helps students find the
perfect opportunities that align with their academic background and career
aspirations.

## 🌟 Features

### For Students/Applicants

- **Smart Matching**: AI-powered algorithm that matches students with relevant
  programs, scholarships, and research opportunities
- **Global Opportunities**: Access to scholarships and research programs from
  institutions worldwide
- **Personalized Recommendations**: Find opportunities tailored to your specific
  academic background
- **Application Management**: Track and manage your applications in one place
- **Document Management**: Upload and manage your academic documents with OCR
  support
- **Wishlist**: Save your favorite opportunities for later
- **Messaging**: Communicate directly with institutions
- **Notifications**: Stay updated on application status and new opportunities

### For Institutions

- **Profile Management**: Create and manage your institution profile
- **Opportunity Posting**: Post programs, research labs, and scholarships
- **Application Review**: Review and manage incoming applications
- **Student Communication**: Direct messaging with applicants
- **Analytics**: Track application metrics and engagement

### For Administrators

- **User Management**: Manage users, roles, and permissions
- **Content Moderation**: Review and approve posts and institutions
- **Payment Management**: Monitor subscriptions and payments
- **System Settings**: Configure platform-wide settings

## 🚀 Tech Stack

### Frontend

- **Framework**: Next.js 13+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.x
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Internationalization**: next-intl (English, Vietnamese)

### Backend

- **Runtime**: Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth
- **File Storage**: AWS S3
- **Caching**: Redis (ioredis)
- **Queue**: AWS SQS
- **Email**: Nodemailer with SMTP

### Third-Party Services

- **Payments**: Stripe
- **Real-time Chat**: Ably
- **AI/ML**: Mistral AI, Ollama
- **Translation**: Google Cloud Translate
- **Analytics**: Vercel Analytics

### Infrastructure

- **Deployment**: AWS Amplify
- **Infrastructure as Code**: AWS CDK
- **CI/CD**: AWS Amplify Build

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher
- **npm** or **yarn** or **pnpm**
- **PostgreSQL** database (local or remote)
- **Redis** server (for caching)
- **AWS Account** (for S3, SQS, and other AWS services)

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd EduMatch-UI-Main
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory with the following variables:

   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/edumatch"

   # Authentication
   BETTER_AUTH_SECRET="your-secret-key"
   BETTER_AUTH_URL="http://localhost:3000"
   NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

   # OAuth (Google)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id"

   # Stripe
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_BASIC_PRICE_ID="price_..."
   STRIPE_PRO_PRICE_ID="price_..."
   STRIPE_ENTERPRISE_PRICE_ID="price_..."
   NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID="price_..."
   NEXT_PUBLIC_STRIPE_PRO_PRICE_ID="price_..."
   NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID="price_..."

   # Redis
   REDIS_URL="redis://localhost:6379"

   # AWS
   REGION="us-east-1"
   ACCESS_KEY_ID="your-access-key"
   SECRET_ACCESS_KEY="your-secret-key"
   S3_BUCKET_NAME="your-bucket-name"
   SQS_NOTIFICATIONS_QUEUE_URL="https://sqs.region.amazonaws.com/account/queue"
   SQS_EMAILS_QUEUE_URL="https://sqs.region.amazonaws.com/account/queue"
   NEXT_PUBLIC_AWS_REGION="us-east-1"

   # Email (SMTP)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   SMTP_FROM="noreply@edumatch.com"

   # AI Services
   NEXT_PUBLIC_MISTRAL_OCR_API_KEY="your-mistral-key"
   MISTRAL_OCR_ENDPOINT="https://api.mistral.ai"
   NEXT_PUBLIC_MISTRAL_OCR_ENABLED="true"
   OLLAMA_API_KEY="your-ollama-key"

   # AppSync (Optional)
   NEXT_PUBLIC_APPSYNC_ENDPOINT="https://your-endpoint.appsync-api.region.amazonaws.com/graphql"
   NEXT_PUBLIC_APPSYNC_API_KEY="your-api-key"

   # Other
   ONLINE_STATUS_THRESHOLD_MINUTES="5"
   ```

4. **Set up the database**

   Generate Prisma client and run migrations:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Seed the database (optional)**

   ```bash
   npm run seed
   ```

6. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier
- `npm run seed` - Seed the database with sample data
- `npm run prisma:refresh-schema` - Pull database schema and regenerate Prisma
  client
- `npm run deploy:infrastructure` - Deploy AWS infrastructure using CDK
- `npm run deploy:infrastructure:diff` - Preview infrastructure changes

## 🏗️ Project Structure

```
EduMatch-UI-Main/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (applicant)/        # Applicant-specific routes
│   │   ├── (institution)/      # Institution-specific routes
│   │   ├── (public)/           # Public routes (auth, etc.)
│   │   ├── admin/              # Admin panel routes
│   │   └── api/                # API routes
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI components
│   │   ├── auth/               # Authentication components
│   │   ├── profile/            # Profile-related components
│   │   └── ...
│   ├── hooks/                  # Custom React hooks
│   ├── services/               # Business logic services
│   ├── config/                 # Configuration files
│   ├── contexts/               # React contexts
│   ├── types/                  # TypeScript type definitions
│   └── utils/                  # Utility functions
├── prisma/
│   └── schema.prisma           # Prisma database schema
├── infrastructure/             # AWS CDK infrastructure code
├── messages/                   # Internationalization files
│   ├── en.json
│   └── vn.json
├── scripts/                    # Utility scripts
└── public/                     # Static assets
```

## 🔐 Authentication

EduMatch uses Better Auth for authentication with support for:

- Email/Password authentication
- Google OAuth
- Session management
- Role-based access control (Applicant, Institution, Admin)

## 💳 Payment Integration

The platform integrates with Stripe for subscription management:

- Basic (Free)
- Premium
- Pro
- Enterprise

Subscription features include:

- Automatic billing
- Webhook handling
- Invoice management
- Subscription upgrades/downgrades

## 📧 Email & Notifications

- Email notifications via SMTP (Nodemailer)
- Real-time notifications via AWS SQS
- Notification preferences per user
- Email templates for various events

## 🗄️ Database

The application uses PostgreSQL with Prisma ORM. Key models include:

- Users (with roles)
- Applicants
- Institutions
- Programs, Scholarships, Research Labs
- Applications
- Messages/Chat
- Notifications
- Subscriptions/Invoices

To view the database schema, check `prisma/schema.prisma`.

## 🌐 Internationalization

EduMatch supports multiple languages:

- English (en)
- Vietnamese (vn)

Translation files are located in the `messages/` directory.

## 🧪 Development Guidelines

### Code Style

- Follow the ESLint and Prettier configurations
- Use TypeScript for type safety
- Follow the project's commit message conventions (see
  [CONTRIBUTING.md](./CONTRIBUTING.md))

### Commit Convention

We follow conventional commits:

```
<type>(<scope>): <subject>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`,
`ci`, `build`, `revert`

Example: `feat(auth): add google login`

### Pre-commit Hooks

The project uses Husky and lint-staged to:

- Automatically format and lint staged files
- Validate commit messages
- Run pre-commit checks

## 🚢 Deployment

### AWS Amplify

The project is configured for deployment on AWS Amplify. The build configuration
is in `amplify.yml`.

### Infrastructure Deployment

Deploy AWS infrastructure (S3, SQS, etc.) using CDK:

```bash
npm run deploy:infrastructure
```

## 📝 Environment Variables

See the [Installation](#-installation) section for a complete list of required
environment variables. Make sure all variables are set before running the
application.

## 🤝 Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of
conduct and the process for submitting pull requests.

## 📄 License

[Add your license information here]

## 🆘 Support

For support, email [your-email] or open an issue in the repository.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- All contributors and open-source libraries used in this project

---

**Built with ❤️ by the EduMatch team**
