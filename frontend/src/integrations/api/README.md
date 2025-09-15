# API Integration Services

This directory contains comprehensive API services that map all backend endpoints to frontend functionality.

## 🚀 Quick Start

```typescript
import { 
  ApplicationService, 
  CommentsService, 
  StatusManagementService,
  ContactsService,
  FiltersService,
  PaidPendingService,
  SummaryService,
  UserService 
} from './services';

// Example: Get applications for a month
const applications = await ApplicationService.getApplications("Aug-25", "", 0, 20);

// Example: Get all filter options
const filterOptions = await FiltersService.getAllFilterOptions();
console.log('Branches:', filterOptions.branches);
console.log('Dealers:', filterOptions.dealers);
console.log('Statuses:', filterOptions.statuses);

// Example: Add a comment
await CommentsService.createComment({
  repayment_id: "123",
  comment_type: CommentTypeEnum.APPLICATION_DETAILS,
  comment_text: "Customer contacted",
  user_id: "user123"
});
```

## 📁 File Structure

```
src/integrations/api/
├── client.ts                 # Main API client with utilities
├── services/                 # Individual service files
│   ├── applicationService.ts    # Applications API
│   ├── commentsService.ts       # Comments API
│   ├── contactsService.ts       # Contacts API
│   ├── filtersService.ts        # Filters API
│   ├── paidPendingService.ts    # Paid Pending API
│   ├── statusManagementService.ts # Status Management API
│   ├── summaryService.ts        # Summary Status API
│   ├── userService.ts           # Users API
│   └── index.ts                 # Service exports
├── API_DOCUMENTATION.md      # Complete API mapping
└── README.md                 # This file
```

## 🔧 Available Services

### 1. ApplicationService
- **Purpose**: Manage application data and filtering
- **Key Methods**: `getFilteredApplications()`, `getApplications()`, `getApplicationDetails()`
- **Backend Endpoint**: `GET /api/v1/applications/`

### 2. CommentsService
- **Purpose**: Handle application comments and notes
- **Key Methods**: `createComment()`, `getCommentsByRepayment()`, `getCommentsByRepaymentAndType()`
- **Backend Endpoints**: `POST /api/v1/comments/`, `GET /api/v1/comments/repayment/{id}`

### 3. ContactsService
- **Purpose**: Manage application contacts (applicant, co-applicants, guarantors, references)
- **Key Methods**: `getApplicationContacts()`, `getApplicantContact()`, `getCoApplicants()`
- **Backend Endpoint**: `GET /api/v1/contacts/{loan_id}`

### 4. FiltersService
- **Purpose**: Get filter options for applications
- **Key Methods**: `getFilterOptions()`, `getBranches()`, `getDealers()`, `getStatuses()`
- **Backend Endpoint**: `GET /api/v1/filters/options`
- **Available Filters**:
  - `emi_months`: EMI month options (e.g., "2025-02", "2025-03")
  - `branches`: Branch names (e.g., "Lucknow Branch", "Jaipur Branch")
  - `dealers`: Dealer names (e.g., "VG Motors", "Sharma Auto")
  - `lenders`: Lender names (e.g., "Vivriti Finance", "Manba Finance")
  - `statuses`: Repayment statuses (e.g., "Future", "Partially Paid", "Paid")
  - `ptpDateOptions`: PTP date options (e.g., "Overdue PTP", "Today's PTP")
  - `vehicle_statuses`: Vehicle status options (e.g., "Repossessed", "Need to repossess")
  - `team_leads`: Team lead names (e.g., "Neha Sharma", "Pooja Verma")
  - `rms`: RM names (e.g., "Amit Singh", "Ravi Kumar")

### 5. PaidPendingService
- **Purpose**: Handle paid pending approval workflows
- **Key Methods**: `getPaidPendingApplications()`, `approveRejectPaidPending()`
- **Backend Endpoints**: `GET /api/v1/paidpending-approval/`, `POST /api/v1/paidpending-approval/approve`

### 6. StatusManagementService
- **Purpose**: Update application statuses and calling information
- **Key Methods**: `updateApplicationStatus()`, `getApplicationStatus()`
- **Backend Endpoints**: `PUT /api/v1/status-management/{loan_id}`, `GET /api/v1/status-management/{loan_id}`

### 7. SummaryService
- **Purpose**: Get collection dashboard metrics and summaries
- **Key Methods**: `getSummaryStatus()`, `getCollectionMetrics()`, `getStatusBreakdown()`
- **Backend Endpoint**: `GET /api/v1/summary_status/summary`

### 8. UserService
- **Purpose**: Manage user authentication and user data
- **Key Methods**: `createUser()`, `loginUser()`, `getUserById()`, `getAllUsers()`
- **Backend Endpoints**: `POST /api/v1/users/`, `POST /api/v1/users/login`, `GET /api/v1/users/{id}`

## 💡 Usage Patterns

### Basic Data Fetching
```typescript
// Get applications with filters
const { total, applications } = await ApplicationService.getApplications(
  "Aug-25",    // EMI month
  "search",    // Search term
  0,           // Offset
  20           // Limit
);
```

### Filter Options Usage
```typescript
import { FiltersService } from './services';

// Get all filter options
const allFilters = await FiltersService.getAllFilterOptions();

// Access specific filter categories
const branches = allFilters.branches;        // ["Lucknow Branch", "Jaipur Branch", "Delhi Branch"]
const dealers = allFilters.dealers;          // ["VG Motors", "Sharma Auto", "Patel Vehicles"]
const lenders = allFilters.lenders;          // ["Vivriti Finance", "Manba Finance"]
const statuses = allFilters.statuses;        // ["Future", "Partially Paid", "Paid", "Overdue"]
const ptpOptions = allFilters.ptpDateOptions; // ["Overdue PTP", "Today's PTP", "Tomorrow's PTP"]
const vehicleStatuses = allFilters.vehicle_statuses; // ["Repossessed", "Need to repossess"]
const teamLeads = allFilters.team_leads;     // ["Neha Sharma", "Pooja Verma"]
const rms = allFilters.rms;                  // ["Amit Singh", "Ravi Kumar"]

// Get only specific filter types
const selectedFilters = await FiltersService.getFilterOptionsByType([
  'branches', 
  'dealers', 
  'statuses'
]);
```

### Status Updates
```typescript
// Update multiple status fields
await StatusManagementService.updateApplicationStatus("123", {
  contact_calling_status: "Completed",
  ptp_date: "2025-01-20",
  amount_collected: 5000
});
```

### Error Handling
```typescript
try {
  const data = await ApplicationService.getFilteredApplications(params);
  // Handle success
} catch (error) {
  console.error('API Error:', error.message);
  // Handle error (show toast, retry, etc.)
}
```

### Batch Operations
```typescript
// Load dashboard data with filters
const [summary, filters, applications] = await Promise.all([
  SummaryService.getSummaryStatus("Aug-25"),
  FiltersService.getAllFilterOptions(),
  ApplicationService.getApplications("Aug-25", "", 0, 20)
]);

// Now you have access to all filter options
console.log('Available branches:', filters.branches);
console.log('Available dealers:', filters.dealers);
console.log('Available statuses:', filters.statuses);
```

## 🔒 Authentication

The services currently use basic authentication. For production, you may want to add:

```typescript
// Add to client.ts
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

// Use in services
const response = await fetch(url, {
  headers: getAuthHeaders(),
  ...options
});
```

## 📊 TypeScript Support

All services include full TypeScript interfaces:

```typescript
interface FiltersOptionsResponse {
  emi_months: string[];
  branches: string[];
  dealers: string[];
  lenders: string[];
  statuses: string[];
  ptpDateOptions: string[];
  vehicle_statuses: string[];
  team_leads: string[];
  rms: string[];
}
```

## 🚨 Important Notes

1. **Base URL**: All services use `http://13.203.110.46:8000/api/v1` as the base URL
2. **Error Handling**: Services throw errors that should be caught and handled appropriately
3. **Backward Compatibility**: Legacy functions from `client.ts` are still available
4. **Type Safety**: Full TypeScript support for all request/response data
5. **Filter Options**: The backend provides comprehensive filter options including EMI months, branches, dealers, lenders, statuses, PTP options, vehicle statuses, team leads, and RMs

## 🔄 Migration from Legacy Code

### Before (Legacy)
```typescript
import { getFilteredApplications } from './client';

const data = await getFilteredApplications("Aug-25", "search", 0, 20);
```

### After (New Services)
```typescript
import { ApplicationService } from './services';

const { total, applications } = await ApplicationService.getApplications("Aug-25", "search", 0, 20);
```

## 📚 Additional Resources

- **API_DOCUMENTATION.md**: Complete backend-to-frontend mapping
- **Backend Routes**: Check `backend/app/api/v1/routes/` for endpoint details
- **Schemas**: Check `backend/app/schemas/` for data structures

## 🤝 Contributing

When adding new API endpoints:

1. Create a new service file in `services/`
2. Add TypeScript interfaces for request/response data
3. Include proper error handling
4. Add helper methods for common operations
5. Update `services/index.ts` to export the new service
6. Update `API_DOCUMENTATION.md` with examples
