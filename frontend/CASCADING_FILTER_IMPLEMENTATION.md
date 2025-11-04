# Cascading Filter Implementation - Complete Guide

## Overview
This implementation provides a cascading filter system where:
- Filters update based on selections (Branch → TL → RM cascading)
- API calls are debounced (250ms) for performance
- Uses first selection only for cascading context (single ID, not comma-separated)
- Changes apply immediately when selections are made
- Name-to-ID mapping is maintained for API calls

## Files Required

### 1. FilterBar.tsx
Location: `frontend/src/components/FilterBar.tsx`

This component manages the filter panel UI and temporary filter state while the panel is open.

**Key Features:**
- Temporary filters (`tempFilters`) that are only applied when "Done" is clicked
- Name-to-ID mapping (`idMaps`) for converting selections to API parameters
- Live cascading updates while panel is open (250ms debounce)
- Merges base options with cascading overrides for preview

**Implementation Details:**
- Uses `pickFirstId` to get the first selected ID for cascading context
- Debounces cascading API calls by 250ms
- Updates all cascading fields when any filter changes
- Maintains separate state for temporary vs applied filters

### 2. CustomMultiSelectFilter.tsx
Location: `frontend/src/components/CustomMultiSelectFilter.tsx`

A reusable multi-select dropdown component with search functionality.

**Key Features:**
- Searchable dropdown with real-time filtering
- Visual checkboxes and badges for selected items
- Select All / Clear All actions
- Inline item removal from selected badges

**Current Implementation:**
- Selections are applied immediately (no deferred changes)
- Uses `safeSelected` prop directly (no local state buffering)
- No `deferChangeUntilClose` prop currently

### 3. FilterContent.tsx
Location: `frontend/src/components/filters/FilterContent.tsx`

Renders the grid of filter dropdowns.

**Key Features:**
- Grid layout (responsive: 1/2/3/4 columns)
- Maps filter keys to `CustomMultiSelectFilter` components
- Handles Done/Cancel actions

**Current Implementation:**
- No `onDropdownOpenChange` callback tracking
- No `deferChangeUntilClose` prop passed to filters
- All selections propagate immediately

### 4. useCascadingFilters.tsx
Location: `frontend/src/hooks/useCascadingFilters.tsx`

The main hook that manages cascading filter logic and API calls.

**Key Features:**
- Maintains filter state and available options
- Handles name-to-ID mapping for cascading API
- Debounced cascading API calls (150ms)
- Caching for API responses (2 minutes)
- Tracks last changed key to determine impacted fields

**Implementation Details:**
- Uses first selection only (`toId` function picks first item)
- Cascading API accepts single IDs (not comma-separated)
- Updates all cascading fields when any filter changes
- Caches cascading responses to avoid duplicate calls

## How It Works

### Current Flow

1. **Initial Load:**
   - `useCascadingFilters` seeds name-to-ID maps from cascading endpoint
   - Loads base filter options from `getAllFilterOptions()`
   - Initializes available options with cascading data

2. **Filter Selection:**
   - User selects a filter (e.g., Branch)
   - Selection is applied immediately via `handleFilterChange`
   - `lastChangedKeyRef` tracks which filter changed
   - Debounced effect (150ms) triggers cascading API call

3. **Cascading API Call:**
   - Builds params with first selected ID from each filter
   - Calls `FiltersService.getCascadingOptions(params)`
   - Updates name-to-ID maps with new options
   - Updates available options for impacted fields

4. **Filter Panel (FilterBar):**
   - When panel opens, uses `tempFilters` for temporary selections
   - Live preview of cascading (250ms debounce) while panel is open
   - When "Done" clicked, applies all `tempFilters` to actual filters
   - When "Cancel" clicked, resets `tempFilters` to match applied filters

### API Service

**FiltersService.getCascadingOptions()** accepts:
```typescript
{
  branch_id?: number;      // Single ID (first selection)
  tl_id?: number;          // Single ID (first selection)
  rm_id?: number;          // Single ID (first selection)
  source_tl_id?: number;   // Single ID (first selection)
  source_rm_id?: number;   // Single ID (first selection)
  dealer_id?: number;      // Single ID (first selection)
  lender_id?: number;      // Single ID (first selection)
}
```

And returns:
```typescript
{
  branches: { id: number; name: string }[];
  team_leads: { id: number; name: string }[];
  rms: { id: number; name: string }[];
  source_team_leads: { id: number; name: string }[];
  source_rms: { id: number; name: string }[];
  dealers: { id: number; name: string }[];
  lenders: { id: number; name: string }[];
}
```

## Key Differences from Proposed Enhancement

The current implementation differs from the proposed enhancement in these ways:

1. **No Name Normalization:** Uses names directly, assumes exact match
2. **No Deferred Changes:** Selections apply immediately
3. **Single ID Context:** Uses first selection only for cascading (not comma-separated)
4. **No Dropdown Tracking:** Doesn't track which dropdown is open
5. **Different Debounce Times:** 250ms (FilterBar) vs 150ms (useCascadingFilters)

## Cascade Dependencies

The cascade relationships are defined in `useCascadingFilters.tsx`:

```typescript
const CASCADE_DEPENDENCIES: Record<string, string[]> = {
  branch: ['teamLeads', 'rms', 'sourceTeamLeads', 'sourceRms', 'dealers', 'lenders'],
  teamLead: ['rms', 'dealers', 'lenders'],
  rm: ['dealers', 'lenders'],
  sourceTeamLead: ['sourceRms', 'dealers', 'lenders'],
  sourceRm: ['dealers', 'lenders'],
  dealer: ['branches', 'teamLeads', 'rms', 'sourceTeamLeads', 'sourceRms', 'lenders'],
  lender: ['branches', 'teamLeads', 'rms', 'sourceTeamLeads', 'sourceRms', 'dealers']
};
```

## Performance Optimizations

1. **Caching:** Cascading responses cached for 2 minutes
2. **Debouncing:** 150ms debounce on cascading calls
3. **Pending Call Tracking:** Prevents duplicate simultaneous requests
4. **Impact-Based Updates:** Only updates impacted fields (though currently updates all)

## Future Enhancements (Not Currently Implemented)

1. **Name Normalization:** Handle whitespace/case differences
2. **Deferred Selection Changes:** Buffer changes until dropdown closes
3. **Comma-Separated IDs:** Support multiple selections for cascading context
4. **Dropdown Open Tracking:** Refresh options when dropdown opens
5. **Faster Debounce:** Reduce to 60ms for more responsive UI

