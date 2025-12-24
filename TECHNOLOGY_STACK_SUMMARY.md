# EduMatch Technology Stack Summary

## 🎯 Overview

EduMatch is a full-stack web application built with modern technologies for
connecting students with educational opportunities (research labs, programs,
scholarships).

---

## 🖥️ Frontend Technologies

### Core Framework

- **Next.js 13.5** - React framework with App Router
  - Server-Side Rendering (SSR)
  - Static Site Generation (SSG)
  - API Routes
  - Image Optimization
  - Internationalization support

### UI Framework & Styling

- **React 18.3** - UI library
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 4.1** - Utility-first CSS framework
- **Radix UI** - Headless UI components (30+ components)
  - Dialog, Dropdown, Select, Tabs, Toast, Tooltip, etc.
- **Framer Motion 12.23** - Animation library
- **Lucide React** - Icon library (450+ icons)
- **next-themes** - Dark mode support

### State Management & Data Fetching

- **TanStack Query (React Query) 5.90** - Server state management
- **React Context API** - Client state management
  - AuthContext, NotificationContext, ProfileContext
- **React Hook Form 7.60** - Form state management

### Form Validation

- **Zod 3.25** - Schema validation
- **@hookform/resolvers** - Form validation integration

### Rich Text & Content

- **React Quill 2.0** - Rich text editor
- **Quill 2.0** - Rich text editing engine

### Charts & Data Visualization

- **ApexCharts 5.3** - Chart library
- **React ApexCharts 1.8** - React wrapper
- **Recharts 2.15** - Composable charting library

### Internationalization

- **next-intl 4.3** - i18n for Next.js
  - Supports English and Vietnamese

### Other UI Libraries

- **React Select 5.10** - Select component
- **React Day Picker 9.8** - Date picker
- **Embla Carousel 8.5** - Carousel component
- **Sonner 1.7** - Toast notifications
- **CMDK 1.0** - Command menu
- **Vaul 0.9** - Drawer component

---

## 🔧 Backend Technologies

### Runtime & Framework

- **Node.js** - JavaScript runtime
- **Next.js API Routes** - Backend API endpoints

### Database

- **PostgreSQL** - Relational database
- **Prisma 7.0** - ORM (Object-Relational Mapping)
  - Type-safe database client
  - Migration system
  - Schema management

### Authentication & Authorization

- **Better Auth 1.3** - Authentication framework
  - Email/password authentication
  - OAuth (Google)
  - Session management
  - Role-based access control

### File Storage

- **AWS S3** - Object storage
- **AWS SDK v3** - AWS service integration
  - @aws-sdk/client-s3
  - @aws-sdk/s3-presigned-post
  - @aws-sdk/s3-request-presigner

### Caching

- **Redis** - In-memory data store
- **ioredis 5.7** - Redis client for Node.js

### Message Queue

- **AWS SQS** - Message queuing service
- **@aws-sdk/client-sqs** - SQS client

### Email Service

- **Nodemailer 7.0** - Email sending
- **SMTP** - Email protocol

### Real-time Communication

- **Socket.io 4.8** - WebSocket library
- **Socket.io-client 4.8** - Client-side WebSocket

### GraphQL (Optional)

- **AWS AppSync** - Managed GraphQL service
- **AWS Amplify 6.15** - Development platform

---

## 💳 Payment Processing

- **Stripe 18.0** - Payment gateway
- **@stripe/stripe-js 7.9** - Stripe JavaScript SDK
- **@stripe/react-stripe-js 4.0** - React components
- **@better-auth/stripe 1.3** - Stripe integration for Better Auth

---

## 🤖 AI & Machine Learning

- **Mistral AI 1.10** - AI/ML services
  - OCR (Optical Character Recognition)
  - Text processing
- **Ollama** - Local LLM (Large Language Model)
- **Google Cloud Translate 9.2** - Translation service

---

## ☁️ Cloud Services & Infrastructure

### AWS Services

- **AWS S3** - File storage
- **AWS SQS** - Message queuing
- **AWS AppSync** - GraphQL API
- **AWS Lambda** - Serverless functions
- **AWS Amplify** - Hosting and CI/CD
- **AWS CDK** - Infrastructure as Code

### Infrastructure as Code

- **AWS CDK (Cloud Development Kit)** - Define cloud infrastructure in
  TypeScript
- **TypeScript** - For CDK definitions

### Deployment

- **AWS Amplify** - Hosting platform
- **GitHub Actions** - CI/CD pipeline (optional)

---

## 🛠️ Development Tools

### Code Quality

- **ESLint 8** - Linting
- **Prettier 3.6** - Code formatting
- **Husky 9.1** - Git hooks
- **lint-staged 16.2** - Run linters on staged files
- **Commitlint 19.8** - Commit message linting

### Build Tools

- **esbuild 0.25** - Fast JavaScript bundler
- **PostCSS 8.5** - CSS processing
- **Autoprefixer 10.4** - CSS vendor prefixing

### Type Definitions

- **@types/node** - Node.js types
- **@types/react** - React types
- **@types/react-dom** - React DOM types
- **@types/pg** - PostgreSQL types

---

## 📦 Utility Libraries

### Date & Time

- **date-fns 4.1** - Date utility library

### Data Processing

- **Axios 1.12** - HTTP client
- **UUID 13.0** - Unique ID generation
- **JSZip 3.10** - ZIP file creation
- **Sharp 0.33** - Image processing

### Validation & Utilities

- **libphonenumber-js 1.12** - Phone number validation
- **class-variance-authority 0.7** - Component variants
- **clsx 2.1** - Conditional className utility
- **tailwind-merge 3.3** - Merge Tailwind classes

### Environment

- **dotenv 17.2** - Environment variable management

---

## 📊 Analytics & Monitoring

- **Vercel Analytics 1.3** - Web analytics

---

## 🔐 Security Features

- **Encryption utilities** - Custom encryption for sensitive data
- **Session protection** - Secure file access
- **Rate limiting** - OTP rate limiting with Redis
- **Input validation** - Zod schema validation
- **CORS** - Cross-origin resource sharing configuration

---

## 📱 Features & Capabilities

### Core Features

- Multi-role system (Applicant, Institution, Admin)
- Application management system
- Real-time messaging
- File upload and management
- Document OCR processing
- Payment processing with subscriptions
- Notification system
- Wishlist functionality
- Search and filtering
- Internationalization (i18n)

### Advanced Features

- AI-powered recommendations
- Similarity matching
- Document embedding
- Email notifications
- Push notifications
- Online status tracking
- Application status tracking
- Payment webhooks

---

## 🗂️ Project Structure

```
EduMatch-UI-Main/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (applicant)/  # Applicant routes
│   │   ├── (institution)/# Institution routes
│   │   ├── (public)/     # Public routes
│   │   ├── (shared)/     # Shared routes
│   │   └── api/          # API routes
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Business logic services
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript types
│   └── contexts/         # React contexts
├── prisma/               # Database schema
├── infrastructure/       # AWS CDK infrastructure
└── scripts/              # Utility scripts
```

---

## 🚀 Key Technical Decisions

1. **Next.js App Router** - Modern routing with server components
2. **Prisma ORM** - Type-safe database access
3. **Better Auth** - Modern authentication solution
4. **TanStack Query** - Efficient server state management
5. **Radix UI** - Accessible, unstyled components
6. **Tailwind CSS** - Rapid UI development
7. **TypeScript** - Type safety across the stack
8. **AWS Services** - Scalable cloud infrastructure
9. **Redis** - Fast caching layer
10. **Stripe** - Reliable payment processing

---

## 📈 Scalability Considerations

- **Serverless architecture** - AWS Lambda for background jobs
- **Message queues** - AWS SQS for async processing
- **Caching layer** - Redis for performance
- **CDN** - AWS Amplify for static assets
- **Database optimization** - Prisma query optimization
- **Image optimization** - Next.js Image component + Sharp

---

## 🔄 Development Workflow

1. **Version Control** - Git with GitHub
2. **Code Quality** - ESLint + Prettier + Husky
3. **Type Safety** - TypeScript strict mode
4. **Testing** - (Can add Jest/React Testing Library)
5. **CI/CD** - AWS Amplify Build
6. **Infrastructure** - AWS CDK for IaC

---

## 📝 Notes for Presentation

### Strengths to Highlight

- Modern tech stack (Next.js 13, React 18, TypeScript)
- Type-safe development (TypeScript + Prisma)
- Scalable architecture (AWS services)
- Excellent developer experience (Radix UI, Tailwind)
- Production-ready features (Auth, Payments, Real-time)

### Potential Questions & Answers

**Q: Why Next.js over other frameworks?** A: Server-side rendering, API routes,
excellent performance, and great developer experience.

**Q: Why Prisma over other ORMs?** A: Type-safe queries, excellent migration
system, and great developer experience.

**Q: Why Better Auth over NextAuth?** A: Modern architecture, better TypeScript
support, and more flexible.

**Q: How do you handle scalability?** A: Serverless functions, message queues,
Redis caching, and AWS infrastructure.

**Q: How is security handled?** A: Better Auth for authentication, encryption
utilities, rate limiting, input validation, and secure file access.

**Q: What about real-time features?** A: Socket.io for WebSocket connections and
AWS AppSync for GraphQL subscriptions.

---

## 📚 Additional Resources

- Next.js Documentation: https://nextjs.org/docs
- Prisma Documentation: https://www.prisma.io/docs
- AWS CDK Documentation: https://docs.aws.amazon.com/cdk
- Radix UI Documentation: https://www.radix-ui.com
- TanStack Query: https://tanstack.com/query

---

_Last Updated: Based on package.json and codebase analysis_
