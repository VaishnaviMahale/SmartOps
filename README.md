# SmartOps - Intelligent Workflow Automation & Monitoring System

A full-stack enterprise-grade platform for creating, managing, and monitoring multi-step workflows with real-time updates, SLA enforcement, and comprehensive analytics.

![SmartOps](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🚀 Features

### Core Features
- **Drag & Drop Workflow Builder**: Visual workflow designer with intuitive interface
- **Multi-step Workflow Execution**: Support for approval, notification, auto-action, and conditional steps
- **Real-time Updates**: WebSocket-based live notifications and status updates
- **Task Management**: Comprehensive task inbox with approval/rejection workflows
- **SLA Monitoring**: Automated SLA tracking with breach detection and warnings
- **Analytics Dashboard**: Detailed insights into workflow performance and bottlenecks
- **Role-Based Access Control**: Admin, Manager, and User roles with granular permissions
- **Audit Logging**: Complete audit trail of all system actions

### Technical Features
- RESTful API with comprehensive endpoints
- In-memory job queue for background processing (no Redis dependency)
- MongoDB for flexible data storage
- JWT-based authentication
- Socket.io for real-time communication
- Scheduled jobs for SLA monitoring and notifications
- Docker containerization for easy deployment

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v7.0 or higher)
- Docker & Docker Compose (optional, for containerized deployment)

## 🛠️ Tech Stack

### Frontend
- React 18
- Redux Toolkit + RTK Query
- Material-UI (MUI)
- React Flow (workflow visualization)
- Socket.io Client
- Formik + Yup (form validation)
- Recharts (analytics)
- Vite (build tool)

### Backend
- Node.js + Express
- MongoDB + Mongoose
- In-memory job queue (no Redis required)
- Socket.io (real-time)
- JWT (authentication)
- Winston (logging)
- Nodemailer (notifications)
- Node-cron (scheduled jobs)

### DevOps
- Docker
- Docker Compose
- Nginx (reverse proxy)

## 📦 Installation

### Option 1: Docker Deployment (Recommended)

1. **Clone the repository**
```bash
git clone <repository-url>
cd smartops2
```

2. **Configure environment variables**

Copy the environment example files:
```bash
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env
```

Edit `backend/.env` and update the following:
- `JWT_SECRET`: Change to a secure random string
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`: Configure your email service

3. **Build and start the containers**
```bash
docker-compose up -d
```

4. **Seed the database** (optional)
```bash
docker-compose exec backend npm run seed
```

The application will be available at:
- Frontend: http://localhost
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

### Option 2: Manual Installation

#### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp env.example .env
```
Edit `.env` and configure your settings.

4. **Start MongoDB**
```bash
# Start MongoDB
mongod
```

5. **Seed the database** (optional)
```bash
npm run seed
```

6. **Start the backend server**
```bash
# Development
npm run dev

# Production
npm start
```

7. **Start the worker** (in a separate terminal)
```bash
npm run worker
```

#### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp env.example .env
```
Edit `.env` if needed.

4. **Start the development server**
```bash
npm run dev
```

5. **Build for production** (optional)
```bash
npm run build
```

## 👤 Default Users

After seeding the database, you can login with these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@smartops.com | password123 |
| Manager | manager@smartops.com | password123 |
| User | john@smartops.com | password123 |
| User | jane@smartops.com | password123 |

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/signup`
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

#### POST `/api/auth/login`
Authenticate a user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET `/api/auth/me`
Get current user details (requires authentication).

### Workflow Endpoints

#### POST `/api/workflows`
Create a new workflow.

**Request Body:**
```json
{
  "name": "Purchase Order Approval",
  "description": "Multi-level approval workflow",
  "tags": ["finance", "procurement"],
  "steps": [...],
  "edges": [...],
  "status": "active"
}
```

#### GET `/api/workflows`
Get all workflows (with pagination and search).

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term
- `status`: Filter by status

#### GET `/api/workflows/:id`
Get workflow details by ID.

#### PATCH `/api/workflows/:id`
Update a workflow.

#### DELETE `/api/workflows/:id`
Delete (archive) a workflow.

#### POST `/api/workflows/:id/trigger`
Trigger a workflow execution.

#### GET `/api/workflows/:id/history`
Get workflow execution history.

### Task Endpoints

#### GET `/api/tasks`
Get tasks (filtered by assigned user).

**Query Parameters:**
- `status`: Filter by status (pending, approved, rejected)
- `page`: Page number
- `limit`: Items per page

#### GET `/api/tasks/:id`
Get task details.

#### POST `/api/tasks/:id/approve`
Approve a task.

**Request Body:**
```json
{
  "comment": "Approved with conditions"
}
```

#### POST `/api/tasks/:id/reject`
Reject a task.

**Request Body:**
```json
{
  "comment": "Rejected due to insufficient documentation"
}
```

### Analytics Endpoints

#### GET `/api/analytics/summary`
Get analytics summary.

**Query Parameters:**
- `startDate`: Start date for filtering
- `endDate`: End date for filtering

#### GET `/api/analytics/sla`
Get SLA metrics.

#### GET `/api/analytics/performance`
Get user performance metrics.

#### GET `/api/analytics/trends`
Get workflow execution trends.

**Query Parameters:**
- `days`: Number of days (default: 30)

#### GET `/api/analytics/bottlenecks`
Get performance bottlenecks.

### User Management Endpoints (Admin only)

#### GET `/api/users`
Get all users.

#### PATCH `/api/users/:id/role`
Update user role.

**Request Body:**
```json
{
  "role": "manager"
}
```

#### DELETE `/api/users/:id`
Deactivate a user.

## 🔄 Workflow Step Types

### 1. Approval Step
Requires manual approval from an assigned user or role.

**Configuration:**
```javascript
{
  type: "approval",
  label: "Manager Approval",
  assigneeRole: "manager",  // or assignee: userId
  slaHours: 24
}
```

### 2. Notification Step
Sends a notification to a user.

**Configuration:**
```javascript
{
  type: "notification",
  label: "Notify User",
  config: {
    userId: "user_id",
    title: "Notification Title",
    message: "Notification message"
  }
}
```

### 3. Auto Step
Executes automatically without user intervention.

**Configuration:**
```javascript
{
  type: "auto",
  label: "Auto Process",
  config: {
    action: "custom_action"
  }
}
```

### 4. Condition Step
Evaluates conditions for branching.

**Configuration:**
```javascript
{
  type: "condition",
  label: "Check Status",
  config: {
    condition: "status === 'approved'"
  }
}
```

## 📊 Architecture

```
smartops2/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── models/         # MongoDB schemas
│   │   ├── modules/        # Feature modules
│   │   │   ├── auth/       # Authentication
│   │   │   ├── workflows/  # Workflow management
│   │   │   ├── tasks/      # Task management
│   │   │   ├── analytics/  # Analytics
│   │   │   └── users/      # User management
│   │   ├── middlewares/    # Express middlewares
│   │   ├── jobs/           # Background jobs
│   │   ├── sockets/        # Socket.io handlers
│   │   ├── utils/          # Utilities
│   │   ├── scripts/        # Database scripts
│   │   └── server.js       # Entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/            # Redux store & theme
│   │   ├── components/     # Reusable components
│   │   ├── features/       # Redux slices & API
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utilities
│   │   ├── App.jsx         # Root component
│   │   └── main.jsx        # Entry point
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml
```

## 🔒 Security Features

- JWT-based authentication with secure token storage
- Password hashing using bcrypt
- Role-based access control (RBAC)
- Rate limiting on API endpoints
- Helmet.js for security headers
- Input validation and sanitization
- Audit logging for all actions
- CORS configuration

## 🚨 Error Handling

The application includes comprehensive error handling:
- Structured error responses
- MongoDB validation errors
- JWT authentication errors
- Custom application errors
- Centralized error middleware
- Error logging with Winston

## 📈 Monitoring & Logging

- Winston logger for structured logging
- Audit logs for all user actions
- SLA monitoring with automated alerts
- Performance metrics tracking
- Real-time notifications for critical events

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Support

For support, email support@smartops.com or create an issue in the repository.

## 🎯 Roadmap

- [ ] Email notifications for task assignments
- [ ] Advanced workflow conditions
- [ ] Workflow templates
- [ ] Export workflows as JSON
- [ ] Import workflows from JSON
- [ ] Mobile app
- [ ] Webhook integrations
- [ ] Advanced analytics with ML predictions
- [ ] Multi-tenant support
- [ ] API rate limiting per user
- [ ] GraphQL API

## 🙏 Acknowledgments

- Material-UI for the beautiful component library
- React Flow for the workflow visualization
- The open-source community for amazing tools and libraries

---

**Built with ❤️ using React, Node.js, MongoDB, and Redis**

