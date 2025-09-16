# API Documentation - Backend to Frontend Mapping

This document outlines all the backend API endpoints and their corresponding frontend service methods.

## Base URL
```
http://127.0.0.1:8000/api/v1
```

## 1. Applications API (`/applications`)

### Backend Endpoint
- **GET** `/applications/` - Get filtered applications

### Frontend Service
```typescript
import { ApplicationService } from './services/applicationService';

// Get filtered applications with all parameters
const applications = await ApplicationService.getFilteredApplications({
  emi_month: "Aug-25",
  search: "search term",
  branch: "branch name",
  dealer: "dealer name",
  lender: "lender name",
  status: "status name",
  rm_name: "RM name",
  tl_name: "TL name",
  ptp_date_filter: "overdue",
  offset: 0,
  limit: 20
});

// Get applications with basic filters
const { total, applications } = await ApplicationService.getApplications(
  "Aug-25", "search", 0, 20
);

// Get all applications for a month
const allApplications = await ApplicationService.getAllApplications("Aug-25");

// Get single application details
const appDetails = await ApplicationService.getApplicationDetails("123", "Aug-25");
```

## 2. Comments API (`/comments`)

### Backend Endpoints
- **POST** `/comments/` - Create a new comment
- **GET** `/comments/repayment/{repayment_id}` - Get comments by repayment
- **GET** `/comments/repayment/{repayment_id}/type/{comment_type}` - Get comments by type
- **GET** `/comments/repayment/{repayment_id}/count` - Get comment count
- **GET** `/comments/repayment/{repayment_id}/type/{comment_type}/count` - Get count by type

### Frontend Service
```typescript
import { CommentsService, CommentTypeEnum } from './services/commentsService';

// Create a new comment
const newComment = await CommentsService.createComment({
  repayment_id: "123",
  comment_type: CommentTypeEnum.APPLICATION_DETAILS,
  comment_text: "Comment text",
  user_id: "user123"
});

// Get all comments for a repayment
const comments = await CommentsService.getCommentsByRepayment("123", 0, 100);

// Get comments by type
const appComments = await CommentsService.getCommentsByRepaymentAndType(
  "123", 
  CommentTypeEnum.APPLICATION_DETAILS, 
  0, 
  100
);

// Get comment count
const count = await CommentsService.getRepaymentCommentsCount("123");

// Get count by type
const typeCount = await CommentsService.getRepaymentCommentsCountByType(
  "123", 
  CommentTypeEnum.PAID_PENDING
);
```

## 3. Contacts API (`/contacts`)

### Backend Endpoint
- **GET** `/contacts/{loan_id}` - Get application contacts

### Frontend Service
```typescript
import { ContactsService } from './services/contactsService';

// Get all contacts for an application
const contacts = await ContactsService.getApplicationContacts("123");

// Get specific contact types
const applicant = await ContactsService.getApplicantContact("123");
const coApplicants = await ContactsService.getCoApplicants("123");
const guarantors = await ContactsService.getGuarantors("123");
const references = await ContactsService.getReferences("123");

// Get contacts by type
const contactType = await ContactsService.getContactsByType("123", "applicant");
```

## 4. Filters API (`/filters`)

### Backend Endpoint
- **GET** `/filters/options` - Get filter options

### Backend Response Structure
```json
{
  "emi_months": ["2025-02", "2025-03", "2025-04", "2025-05", "2025-06", "2025-07", "2025-08"],
  "branches": ["Lucknow Branch", "Jaipur Branch", "Delhi Branch"],
  "dealers": ["VG Motors", "Sharma Auto", "Patel Vehicles"],
  "lenders": ["Vivriti Finance", "Manba Finance"],
  "statuses": ["Future", "Partially Paid", "Paid", "Overdue", "Foreclose", "Paid(Pending Approval)", "Paid Rejected"],
  "ptpDateOptions": ["Overdue PTP", "Today's PTP", "Tomorrow's PTP", "Future PTP", "No PTP"],
  "vehicle_statuses": ["Repossessed", "Need to repossess", "Third party", "none"],
  "team_leads": ["Neha Sharma", "Pooja Verma"],
  "rms": ["Amit Singh", "Ravi Kumar"]
}
```

### Frontend Service
```typescript
import { FiltersService } from './services/filtersService';

// Get all filter options
const allOptions = await FiltersService.getAllFilterOptions();

// Get specific filter options
const emiMonths = await FiltersService.getEMIMonths();
const branches = await FiltersService.getBranches();
const dealers = await FiltersService.getDealers();
const lenders = await FiltersService.getLenders();
const statuses = await FiltersService.getStatuses();
const ptpDateOptions = await FiltersService.getPTPDateOptions();
const vehicleStatuses = await FiltersService.getVehicleStatuses();
const teamLeads = await FiltersService.getTeamLeads();
const rms = await FiltersService.getRMs();

// Get specific filter types only
const selectedFilters = await FiltersService.getFilterOptionsByType([
  'branches', 
  'dealers', 
  'statuses'
]);
```

## 5. Paid Pending API (`/paidpending-approval`)

### Backend Endpoints
- **GET** `/paidpending-approval/` - Get all paid pending applications
- **GET** `/paidpending-approval/{loan_id}` - Get application status
- **POST** `/paidpending-approval/approve` - Approve/reject application

### Frontend Service
```typescript
import { PaidPendingService } from './services/paidPendingService';

// Get all paid pending applications
const applications = await PaidPendingService.getPaidPendingApplications();

// Get specific application status
const status = await PaidPendingService.getPaidPendingApplicationStatus("123");

// Approve or reject application
const result = await PaidPendingService.approveRejectPaidPending({
  loan_id: 123,
  action: "approve",
  reason: "Payment verified",
  user_id: "user123"
});

// Check if application is in paid pending status
const isPending = await PaidPendingService.isApplicationPaidPending("123");

// Get applications needing approval
const needsApproval = await PaidPendingService.getApplicationsNeedingApproval();
```

## 6. Status Management API (`/status-management`)

### Backend Endpoints
- **PUT** `/status-management/{loan_id}` - Update application status
- **GET** `/status-management/{loan_id}` - Get current status

### Frontend Service
```typescript
import { StatusManagementService } from './services/statusManagementService';

// Update application status
const result = await StatusManagementService.updateApplicationStatus("123", {
  demand_calling_status: "Completed",
  contact_calling_status: "In Progress",
  repayment_status: "Paid",
  ptp_date: "2025-01-15",
  amount_collected: 5000
});

// Get current application status
const status = await StatusManagementService.getApplicationStatus("123", "2025-01-05");

// Update individual fields
await StatusManagementService.updateDemandCallingStatus("123", "Completed");
await StatusManagementService.updateContactCallingStatus("123", "In Progress");
await StatusManagementService.updateRepaymentStatus("123", "Paid");
await StatusManagementService.updatePTPDate("123", "2025-01-15");
await StatusManagementService.updateAmountCollected("123", 5000);

// Update multiple fields at once
await StatusManagementService.updateMultipleStatusFields("123", {
  demand_calling_status: "Completed",
  amount_collected: 5000
});
```

## 7. Summary Status API (`/summary_status`)

### Backend Endpoint
- **GET** `/summary_status/summary` - Get summary status for month

### Frontend Service
```typescript
import { SummaryService } from './services/summaryService';

// Get complete summary status
const summary = await SummaryService.getSummaryStatus("Aug-25");

// Get specific metrics
const totalApps = await SummaryService.getTotalApplications("Aug-25");
const totalDemand = await SummaryService.getTotalDemandAmount("Aug-25");
const totalCollected = await SummaryService.getTotalCollectedAmount("Aug-25");
const totalPending = await SummaryService.getTotalPendingAmount("Aug-25");
const collectionPercent = await SummaryService.getCollectionPercentage("Aug-25");

// Get breakdowns
const statusBreakdown = await SummaryService.getStatusBreakdown("Aug-25");
const branchBreakdown = await SummaryService.getBranchBreakdown("Aug-25");
const rmBreakdown = await SummaryService.getRMBreakdown("Aug-25");

// Get all collection metrics
const metrics = await SummaryService.getCollectionMetrics("Aug-25");
```

## 8. Users API (`/users`)

### Backend Endpoints
- **POST** `/users/` - Create new user
- **POST** `/users/login` - Login user
- **GET** `/users/{user_id}` - Get user by ID
- **GET** `/users/` - Get all users

### Frontend Service
```typescript
import { UserService } from './services/userService';

// Create a new user
const newUser = await UserService.createUser({
  email: "user@example.com",
  password: "password123",
  full_name: "John Doe",
  role: "RM",
  branch: "Main Branch"
});

// Login user
const user = await UserService.loginUser("user@example.com", "password123");

// Get user by ID
const userDetails = await UserService.getUserById(123);

// Get all users
const allUsers = await UserService.getAllUsers(0, 10);

// Helper methods
const isAuthenticated = await UserService.authenticateUser("user@example.com", "password123");
const exists = await UserService.userExists("user@example.com");
const rmUsers = await UserService.getUsersByRole("RM");
const branchUsers = await UserService.getUsersByBranch("Main Branch");
```

## 9. Paid Pending Applications API (`/paidpending-applications`)

### Backend Endpoint
- **GET** `/paidpending-applications/` - Get paid pending applications list

### Frontend Service
```typescript
import { PaidPendingService } from './services/paidPendingService';

// Get paid pending applications list
const { total, results } = await PaidPendingService.getPaidPendingApplicationsList(0, 100);
```

## Usage Examples

### Complete Application Workflow
```typescript
import { 
  ApplicationService, 
  CommentsService, 
  StatusManagementService,
  ContactsService 
} from './services';

// 1. Get application details
const app = await ApplicationService.getApplicationDetails("123", "Aug-25");

// 2. Get contacts for the application
const contacts = await ContactsService.getApplicationContacts("123");

// 3. Add a comment
await CommentsService.createComment({
  repayment_id: "123",
  comment_type: CommentTypeEnum.APPLICATION_DETAILS,
  comment_text: "Customer contacted, PTP set for next week",
  user_id: "user123"
});

// 4. Update status
await StatusManagementService.updateApplicationStatus("123", {
  contact_calling_status: "Completed",
  ptp_date: "2025-01-20"
});
```

### Dashboard Data Loading with Correct Filters
```typescript
import { 
  SummaryService, 
  ApplicationService, 
  FiltersService 
} from './services';

// Load dashboard data
const loadDashboard = async (emiMonth: string) => {
  // Get summary metrics
  const summary = await SummaryService.getSummaryStatus(emiMonth);
  
  // Get all filter options (now includes all backend fields)
  const filters = await FiltersService.getAllFilterOptions();
  
  // Get applications
  const { total, applications } = await ApplicationService.getApplications(emiMonth, "", 0, 20);
  
  return { 
    summary, 
    filters, 
    applications, 
    total,
    // Access specific filter options
    emiMonths: filters.emi_months,
    branches: filters.branches,
    dealers: filters.dealers,
    lenders: filters.lenders,
    statuses: filters.statuses,
    ptpDateOptions: filters.ptpDateOptions,
    vehicleStatuses: filters.vehicle_statuses,
    teamLeads: filters.team_leads,
    rms: filters.rms
  };
};
```

### Filter Options Usage
```typescript
import { FiltersService } from './services';

// Get all filter options for a filter component
const setupFilters = async () => {
  const filterOptions = await FiltersService.getAllFilterOptions();
  
  // Now you have access to all the backend filter options:
  console.log('EMI Months:', filterOptions.emi_months);
  console.log('Branches:', filterOptions.branches);
  console.log('Dealers:', filterOptions.dealers);
  console.log('Lenders:', filterOptions.lenders);
  console.log('Statuses:', filterOptions.statuses);
  console.log('PTP Date Options:', filterOptions.ptpDateOptions);
  console.log('Vehicle Statuses:', filterOptions.vehicle_statuses);
  console.log('Team Leads:', filterOptions.team_leads);
  console.log('RMs:', filterOptions.rms);
  
  return filterOptions;
};
```

## Error Handling

All services use consistent error handling:

```typescript
try {
  const data = await ApplicationService.getFilteredApplications(params);
  // Handle success
} catch (error) {
  // Handle error
  console.error('API Error:', error.message);
}
```

## TypeScript Support

All services include full TypeScript interfaces for:
- Request parameters
- Response data
- Error handling
- Enum values

This ensures type safety and better development experience.
