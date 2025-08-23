# Component Analysis & Organization Report

## Current Component Structure

### Core Components (`src/components/`)

#### 1. **Typeahead.tsx** (175 lines)
**Purpose**: Autocomplete search component for locations
**Functionality**:
- Debounced search with abort controller
- Keyboard navigation (arrow keys, enter, escape)
- Accessibility features (ARIA labels, roles)
- Framer Motion animations

**Strengths**:
- Well-structured with proper TypeScript types
- Good accessibility implementation
- Efficient search with debouncing and cancellation
- Smooth animations

**Issues**:
- Hard-coded API endpoint (`/api/sites/search`)
- No error state handling
- Limited customization options

#### 2. **DateTimePicker.tsx** (234 lines)
**Purpose**: Custom date/time selection component
**Functionality**:
- Calendar grid with month navigation
- Time selection with dropdowns
- Portal-based popover positioning
- Local time parsing and formatting

**Strengths**:
- Comprehensive date/time functionality
- Proper portal usage for z-index issues
- Good keyboard accessibility

**Issues**:
- Complex positioning logic
- No timezone awareness
- Limited styling customization
- Large component doing multiple things

#### 3. **ModeBadge.tsx** (59 lines)
**Purpose**: Transport mode indicators and line badges
**Functionality**:
- Mode-specific styling and emojis
- SL line color mapping
- Responsive badge design

**Strengths**:
- Good separation of concerns with helper functions
- Extensible color/emoji mapping
- Reusable design

**Issues**:
- Hard-coded SL-specific colors
- Could be more generic for other transport systems

#### 4. **AuthButton.tsx** (Not examined in detail)
**Purpose**: Authentication UI controls

### Page Components (`src/app/`)

#### 1. **page.tsx** (Main Planner) (848 lines) ⚠️
**Purpose**: Main trip planning interface
**Major Issues**:
- **Massive file size**: 848 lines is too large for maintainability
- **Multiple responsibilities**: Planning, trip display, state management
- **Complex state**: 10+ useState hooks
- **Duplicate logic**: Similar trip handling in multiple places
- **Hard to test**: Everything in one component

**Components Within**:
- `PlannerPage` (main component)
- `DestinationTrips` (trip display logic, 345 lines)
- `YourTripsSection` (saved trips list, 23 lines)
- Helper functions (`toSiteFromPlace`, `distanceMeters`, `computeEndpoints`)

#### 2. **trips/page.tsx** (184 lines)
**Purpose**: Saved trips management
**Issues**:
- Duplicated type definitions with main page
- Similar trip handling logic
- Could share components with main page

## Component Organization Issues

### 1. **Lack of Shared Components**
- Trip display logic duplicated between pages
- Similar form patterns not extracted
- Common UI patterns (buttons, cards) not componentized

### 2. **Poor Separation of Concerns**
- Business logic mixed with UI components
- API calls scattered throughout components
- State management not centralized

### 3. **Type Duplication**
Multiple places define similar types:
```typescript
// In page.tsx
type Site = { id: string; name: string; ... }
type SavedTrip = { id: string; label?: string; ... }

// In trips/page.tsx  
type Trip = { id: string; label?: string; ... }
type Place = PlaceSite | PlaceAddress
```

### 4. **Component Size Issues**
- `page.tsx`: 848 lines (too large)
- `DestinationTrips`: 345 lines (should be split)
- `DateTimePicker`: 234 lines (complex, could be simplified)

## Recommended Component Structure

### 1. **Shared Types** (`src/types/`)
```
types/
├── trip.ts          # Trip, Place, Site types
├── api.ts           # API response types
└── ui.ts            # UI component types
```

### 2. **Feature Components** (`src/components/`)
```
components/
├── trip/
│   ├── TripCard.tsx         # Individual trip display
│   ├── TripList.tsx         # Trip list container
│   ├── TripForm.tsx         # Trip creation form
│   └── TripPlanner.tsx      # Main planning interface
├── location/
│   ├── LocationSearch.tsx   # Enhanced Typeahead
│   ├── LocationChips.tsx    # Saved location chips
│   └── NearbyStops.tsx      # Current location button
├── datetime/
│   ├── DatePicker.tsx       # Date selection only
│   ├── TimePicker.tsx       # Time selection only
│   └── DateTimePicker.tsx   # Combined component
├── transport/
│   ├── ModeBadge.tsx        # Current component
│   ├── LineBadge.tsx        # Separate line component
│   └── RouteDisplay.tsx     # Route visualization
└── ui/
    ├── Button.tsx           # Standardized buttons
    ├── Card.tsx             # Consistent card styling
    ├── Loading.tsx          # Loading states
    └── ErrorBoundary.tsx    # Error handling
```

### 3. **Hooks** (`src/hooks/`)
```
hooks/
├── useTrips.ts           # Trip management logic
├── useLocation.ts        # Geolocation handling
├── useSearch.ts          # Search functionality
└── useDebounce.ts        # Reusable debouncing
```

### 4. **Utils** (`src/utils/`)
```
utils/
├── api.ts               # API client functions
├── location.ts          # Distance calculations
├── time.ts              # Time formatting/parsing
└── constants.ts         # App constants
```

## Reusability Opportunities

### 1. **Form Components**
- Consistent input styling
- Reusable form validation
- Standard button components

### 2. **Trip Components**
- Trip card component for consistent display
- Trip action buttons (save, delete, etc.)
- Trip status indicators

### 3. **Layout Components**
- Page containers with consistent spacing
- Section headers with icons
- Loading and error states

### 4. **Business Logic**
- Trip planning logic extraction
- Location handling utilities
- Time/date formatting functions

## Testing Considerations

### Current State
- No visible test files
- Components too large/complex to test effectively
- Business logic mixed with UI makes unit testing difficult

### Recommended Approach
- Extract business logic into testable utils/hooks
- Create smaller, focused components
- Implement integration tests for user flows
- Add visual regression testing for UI components

## Conclusion

The current component structure shows good TypeScript usage and modern React patterns, but suffers from:
1. **Oversized components** that are hard to maintain
2. **Duplicate code** across similar features
3. **Mixed concerns** making testing difficult
4. **Limited reusability** due to tight coupling

Breaking down the large `page.tsx` file and extracting shared components would significantly improve maintainability, testability, and developer experience.