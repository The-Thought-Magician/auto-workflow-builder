# AI Workflow Backend API Contract

## Overview
Complete REST API for the AI-powered workflow automation platform. All endpoints return JSON and use JWT bearer authentication where required.

## Base URL
- Development: `http://localhost:3001`
- Production: `https://your-domain.com`

## Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format
All responses follow this structure:
```json
{
  "data": {}, // Response data
  "message": "Success message",
  "error": "Error message if applicable"
}
```

## Endpoints

### Authentication Routes (`/api/auth`)

#### POST /api/auth/register
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "secure_password"
}
```

**Response (201):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "subscription": "Free"
  }
}
```

#### POST /api/auth/login
Authenticate existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "secure_password"
}
```

**Response (200):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "name": "John Doe", 
    "email": "john@example.com",
    "subscription": "Free"
  }
}
```

#### POST /api/auth/forgot-password
Request password reset token.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "If that account exists, a reset link was sent"
}
```

#### POST /api/auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset_token",
  "password": "new_password"
}
```

**Response (200):**
```json
{
  "message": "Password updated successfully"
}
```

### User Management Routes (`/api/user`)

#### GET /api/user/profile
Get current user's profile. **Requires authentication.**

**Response (200):**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com", 
  "subscription": "Free",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### PUT /api/user/profile
Update user profile. **Requires authentication.**

**Request Body:**
```json
{
  "name": "Updated Name",
  "password": "new_password" // optional
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "email": "john@example.com",
  "subscription": "Free"
}
```

#### GET /api/user/subscription
Get user's subscription info. **Requires authentication.**

**Response (200):**
```json
{
  "plan": "Free"
}
```

#### POST /api/user/subscription
Update subscription plan. **Requires authentication.**

**Request Body:**
```json
{
  "plan": "Pro"
}
```

**Response (200):**
```json
{
  "plan": "Pro"
}
```

### Workflow Management Routes (`/api/workflows`)

#### GET /api/workflows
List all workflows for authenticated user. **Requires authentication.**

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "My Workflow",
    "description": "Workflow description",
    "status": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /api/workflows
Create new workflow. **Requires authentication.**

**Request Body:**
```json
{
  "name": "New Workflow",
  "description": "Workflow description",
  "configuration": {
    "nodes": [],
    "connections": {},
    "settings": {}
  }
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "New Workflow", 
  "status": false
}
```

#### GET /api/workflows/:id
Get workflow by ID. **Requires authentication.**

**Response (200):**
```json
{
  "id": "uuid",
  "name": "My Workflow",
  "description": "Workflow description",
  "configuration": {
    "nodes": [],
    "connections": {},
    "settings": {}
  },
  "status": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### PUT /api/workflows/:id
Update workflow. **Requires authentication.**

**Request Body:**
```json
{
  "name": "Updated Workflow",
  "description": "Updated description",
  "configuration": {
    "nodes": [],
    "connections": {},
    "settings": {}
  },
  "status": true
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Updated Workflow",
  "status": true
}
```

#### DELETE /api/workflows/:id
Delete workflow. **Requires authentication.**

**Response (200):**
```json
{
  "success": true
}
```

#### POST /api/workflows/:id/run
Manually execute workflow. **Requires authentication.**

**Response (200):**
```json
{
  "executionId": "uuid",
  "status": "queued"
}
```

#### GET /api/workflows/:id/history
Get workflow execution history. **Requires authentication.**

**Response (200):**
```json
{
  "local": [
    {
      "id": "uuid",
      "status": "success",
      "data": {},
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "remote": []
}
```

#### GET /api/workflows/:id/history/:logId
Get detailed execution log. **Requires authentication.**

**Response (200):**
```json
{
  "id": "uuid",
  "status": "success",
  "data": {},
  "workflowId": "uuid",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### POST /api/workflows/:id/clone
Clone workflow. **Requires authentication.**

**Response (201):**
```json
{
  "id": "uuid",
  "name": "My Workflow (Clone)"
}
```

#### POST /api/workflows/:id/activate
Toggle workflow activation. **Requires authentication.**

**Request Body:**
```json
{
  "active": true
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "status": true
}
```

### Credential Management Routes (`/api/credentials`)

#### GET /api/credentials
List user's credentials. **Requires authentication.**

**Response (200):**
```json
[
  {
    "id": "uuid",
    "service": "slack",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /api/credentials
Store new credentials. **Requires authentication.**

**Request Body:**
```json
{
  "service": "slack",
  "data": {
    "apiKey": "secret_key"
  },
  "validate": true
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "service": "slack",
  "message": "slack credentials saved successfully"
}
```

#### DELETE /api/credentials/:id
Delete credentials. **Requires authentication.**

**Response (200):**
```json
{
  "success": true
}
```

#### POST /api/credentials/:id/test
Test credential connection. **Requires authentication.**

**Response (200):**
```json
{
  "valid": true,
  "data": {}
}
```

#### GET /api/credentials/requirements/:service
Get credential requirements for service. **Requires authentication.**

**Response (200):**
```json
{
  "service": "slack",
  "name": "Slack",
  "type": "oauth",
  "requiresOAuth": true,
  "scope": "chat:write channels:read",
  "description": "Connect your Slack account to enable automation"
}
```

#### POST /api/credentials/oauth/url
Generate OAuth URL. **Requires authentication.**

**Request Body:**
```json
{
  "service": "slack",
  "clientId": "slack_client_id",
  "redirectUri": "https://your-app.com/callback"
}
```

**Response (200):**
```json
{
  "authUrl": "https://slack.com/oauth/...",
  "state": "user_id:timestamp"
}
```

#### POST /api/credentials/oauth/callback
Handle OAuth callback. **Requires authentication.**

**Request Body:**
```json
{
  "service": "slack",
  "code": "oauth_code",
  "state": "user_id:timestamp",
  "clientId": "slack_client_id",
  "clientSecret": "slack_client_secret",
  "redirectUri": "https://your-app.com/callback"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "service": "slack",
  "message": "slack connected successfully"
}
```

### Chat Processing Routes (`/api/chat`)

#### POST /api/chat
Process chat messages with AI workflow interpreter. **Requires authentication.**

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Create a workflow that sends Slack messages when Typeform is submitted"
    }
  ]
}
```

**Response (200):**
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "I can help you create that workflow. Let me guide you through the process..."
      },
      "finish_reason": "stop"
    }
  ],
  "functionResults": [
    {
      "type": "credential_request",
      "data": {
        "service": "typeform",
        "message": "Please connect your Typeform account to continue",
        "requirements": {
          "type": "oauth",
          "scope": "accounts:read forms:read responses:read"
        }
      }
    }
  ]
}
```

### Health Check

#### GET /health
Simple health check endpoint.

**Response (200):**
```json
{
  "status": "ok"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "message": "Authorization header missing"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal Server Error"
}
```

## Environment Variables Required

### Core Configuration
- `PORT` - Server port (default: 3001)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- `ENCRYPTION_KEY` - Key for encrypting credentials

### AI Integration
- `OPENROUTER_API_KEY` - OpenRouter API key for AI processing
- `OPENROUTER_BASE_URL` - OpenRouter base URL (optional)
- `OPENROUTER_DEFAULT_MODEL` - Default AI model (optional)

### N8N Integration
- `N8N_API_URL` - N8N instance URL
- `N8N_API_KEY` - N8N API key
- `N8N_MCP_URL` - N8N MCP server URL (optional)
- `MCP_AUTH_TOKEN` - MCP authentication token (optional)

## Database Schema
The API uses Prisma ORM with PostgreSQL. Key models:

- **User**: User accounts with authentication
- **Workflow**: Workflow definitions and configurations
- **Credential**: Encrypted service credentials
- **ExecutionLog**: Workflow execution history
- **PasswordResetToken**: Password reset tokens

## Security Features
- JWT-based authentication
- AES-256-CBC credential encryption
- Password hashing with bcrypt
- Secure OAuth state validation
- Input validation and sanitization
- CORS protection