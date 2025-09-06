# Frontend in Mock Mode

This frontend is now running in **mock mode** without any real database connection. All data is simulated using mock data.

## What's Changed

1. **Removed Supabase**: All Supabase dependencies have been removed
2. **Mock API Client**: Created a mock API client that simulates Supabase functionality
3. **Mock Data**: Added sample data for applications, users, comments, etc.

## How to Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Login Credentials

Use these credentials to log in:
- **Email**: `admin@example.com`
- **Password**: `password`

## Mock Data

The application now uses mock data for:

- **Applications**: 2 sample applications with complete details
- **Users**: 1 admin user
- **Comments**: Sample comments for applications
- **Field Status**: Sample status data
- **Audit Logs**: Sample audit trail
- **Calling Logs**: Sample call history
- **PTP Dates**: Sample promise-to-pay dates
- **Payment Dates**: Sample payment records

## Features Available

All frontend features work with mock data:
- ✅ Dashboard with applications
- ✅ Application details and editing
- ✅ Comments system
- ✅ Status updates
- ✅ Contact calling status
- ✅ Audit logs
- ✅ Analytics (with mock data)
- ✅ User management
- ✅ Filters and search

## What's Not Working

Since this is mock mode:
- ❌ No real data persistence
- ❌ No real-time updates
- ❌ No actual database operations
- ❌ File uploads (simulated)

## Next Steps

When you're ready to connect to a real backend:
1. Replace the mock API client with real API calls
2. Update authentication to use your backend
3. Connect to your MySQL database
4. Implement real-time features

## File Structure

```
src/integrations/
├── api/
│   └── client.ts          # Mock API client
└── supabase/              # Removed
```

The mock client simulates all Supabase operations so your existing code continues to work without changes. 