# Authentication System Documentation

## Overview

The Prosparity Collection Dashboard now includes a complete role-based authentication system that integrates with the FastAPI backend. Users must log in to access the dashboard, and different roles have different permissions.

## User Roles

### Admin
- **Full access** to all features
- Can view and manage pending status approvals
- Can access admin settings
- Can manage users and roles

### RM (Relationship Manager)
- **Limited access** - cannot view pending status approvals
- Can access all other dashboard features
- Can view applications, analytics, and reports

### TL (Team Lead)
- **Limited access** - cannot view pending status approvals
- Can access all other dashboard features
- Can view applications, analytics, and reports

## Authentication Flow

1. **Login Page**: Users are redirected to `/login` if not authenticated
2. **Authentication**: Users enter email and password
3. **Token Storage**: JWT token is stored in localStorage
4. **Dashboard Access**: Authenticated users are redirected to the main dashboard
5. **Role-Based Access**: Components are conditionally rendered based on user role

## API Integration

### Backend Endpoints
- `POST /api/v1/users/login` - User authentication
- `GET /api/v1/users/me` - Get current user info
- `POST /api/v1/users/logout` - User logout

### Frontend Services
- `AuthService` - Handles all authentication operations
- `useAuth` hook - Provides authentication context
- `ProtectedRoute` - Wraps components requiring authentication

## Setup Instructions

### Backend Setup
1. **Create Admin User**: Run `python create_admin_user.py` to create the initial admin user
2. **Create Test Users**: Run `python create_test_users.py` to create RM and TL test users
3. **Start Backend**: Run `python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

### Frontend Setup
1. **Install Dependencies**: Run `npm install` or `bun install`
2. **Start Frontend**: Run `npm run dev` or `bun run dev`
3. **Access Login**: Navigate to `/login` to access the authentication system

## Usage

### Login
```typescript
import { useAuth } from '@/hooks/useAuth';

const { login } = useAuth();

const handleLogin = async (credentials) => {
  try {
    await login(credentials);
    // Redirect to dashboard
  } catch (error) {
    // Handle login error
  }
};
```

### Role-Based Access Control
```typescript
import { AuthService } from '@/integrations/api/services/authService';

// Check if user can view pending approvals
if (AuthService.canViewPendingApprovals()) {
  // Render PendingApprovals component
}

// Check specific roles
if (AuthService.isAdmin()) {
  // Admin-only features
}

if (AuthService.isRM() || AuthService.isTL()) {
  // RM/TL features
}
```

### Protected Routes
```typescript
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Basic protection
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Admin-only protection
<ProtectedRoute requireAdmin={true}>
  <AdminSettings />
</ProtectedRoute>

// Role-specific protection
<ProtectedRoute requireRole={['admin', 'RM']}>
  <SomeComponent />
</ProtectedRoute>
```

## Security Features

- **JWT Tokens**: Secure token-based authentication
- **Token Expiration**: Automatic token refresh and expiration handling
- **Role Validation**: Server-side role verification
- **Protected Routes**: Client-side route protection
- **Secure Storage**: Tokens stored in localStorage with expiration

## Demo Credentials

For testing purposes, use these credentials:

- **Admin**: `admin@prosparity.com` / `Admin@123`
- **RM**: `rm@prosparity.com` / `password`
- **TL**: `tl@prosparity.com` / `password`

## File Structure

```
src/
├── components/
│   └── auth/
│       └── ProtectedRoute.tsx
├── hooks/
│   └── useAuth.tsx
├── integrations/
│   └── api/
│       └── services/
│           └── authService.ts
├── pages/
│   └── Login.tsx
└── types/
    └── auth.ts
```

## Backend Requirements

The backend must provide:
- User authentication endpoint (`/users/login`)
- User info endpoint (`/users/me`)
- Logout endpoint (`/users/logout`)
- JWT token generation and validation
- Role-based access control middleware

## Troubleshooting

### Common Issues

1. **Login Fails**: Check backend is running and credentials are correct
2. **Token Expired**: User will be automatically logged out
3. **Role Access Denied**: Verify user has correct role assigned
4. **API Errors**: Check network connectivity and backend status

### Debug Mode

Enable console logging to debug authentication issues:
```typescript
// Check authentication status
console.log('Is Authenticated:', AuthService.isAuthenticated());
console.log('User Role:', AuthService.getCurrentUserRole());
console.log('Can View Pending Approvals:', AuthService.canViewPendingApprovals());
```

## Future Enhancements

- Password reset functionality
- Remember me option
- Multi-factor authentication
- Session management
- Audit logging
- User profile management
