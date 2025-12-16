# Family Tree System - Complete Implementation Guide

## Overview
A comprehensive family tree system for Vakshesa Directory supporting 100+ members across 10-20 generations with interactive visualization, relationship management, and breadcrumb navigation.

## Database Schema Updates

### User Model Enhancements (`backend/src/models/User.ts`)
Added fields to support family relationships:

```typescript
// Family tree relationships
fatherId?: string;        // Reference to father's user ID
motherId?: string;        // Reference to mother's user ID
spouseId?: string;        // Reference to spouse's user ID
children?: string[];      // Array of children's user IDs
generation?: number;      // Generation level (1 for oldest ancestors)
isAlive?: boolean;        // Whether the person is alive

// Additional family info
marriageDate?: Date;
deathDate?: Date;
occupation?: string;
address?: string;
notes?: string;
```

### New FamilyTree Model (`backend/src/models/FamilyTree.ts`)
Tracks overall family structure:
- familyId: Unique family identifier
- rootMembers: IDs of oldest generation members
- totalMembers: Count of all family members
- totalGenerations: Number of generations

## Backend API Endpoints

### Family Tree Routes (`/api/family-tree`)

1. **GET `/api/family-tree/:familyId`**
   - Get full family tree structure
   - Query params: `?house=Kadannamanna` (filter by house)
   - Returns: Hierarchical tree structure with all members

2. **GET `/api/family-tree/member/:userId`**
   - Get specific member with immediate family
   - Returns: Member + father, mother, spouse, children, siblings

3. **GET `/api/family-tree/member/:userId/path`**
   - Get breadcrumb path from root ancestor to member
   - Returns: Array of ancestors in order

4. **GET `/api/family-tree/:familyId/generation/:generation`**
   - Get all members of a specific generation
   - Returns: Array of members at that generation level

5. **GET `/api/family-tree/search/relatives`**
   - Search users for relationship selection
   - Query params: `?q=search&familyId=xxx&relationshipType=father`
   - Filters by gender for parent relationships

6. **PATCH `/api/family-tree/member/:userId/relationships`** (Admin only)
   - Update family relationships
   - Body: `{ fatherId, motherId, spouseId, children }`
   - Auto-updates generation and bidirectional relationships

## Data Structure

### Tree Node Structure
```typescript
{
  _id: "user_id",
  firstName: "John",
  lastName: "Doe",
  generation: 3,
  house: "Kadannamanna",
  
  // Relationships
  fatherId: "father_id",
  motherId: "mother_id",
  spouseId: "spouse_id",
  children: ["child1_id", "child2_id"],
  
  // Nested structure for visualization
  childrenNodes: [/* recursive tree */],
  spouseNode: {/* spouse details */}
}
```

### Connection Types
1. **Parent-Child**: Vertical lines connecting generations
2. **Spouse**: Horizontal lines connecting married couples
3. **Siblings**: Share same parent nodes

## UI Components

### Mobile Family Tree Visualization

#### Features:
1. **Interactive Nodes**
   - Circular bubbles representing each member
   - Color-coded by gender (blue: male, pink: female)
   - Border color indicates house affiliation
   - Gray overlay for deceased members

2. **Breadcrumb Navigation**
   - Horizontal scrollable path showing ancestry
   - Format: "Root Ancestor › Grandparent › Parent › Current"
   - Click any ancestor to navigate to that branch

3. **House Filter**
   - Tabs for each house: Kadannamanna, Mankada, Ayiranazhi, Aripra
   - Filter tree to show only members from selected house

4. **Zoom & Pan**
   - Pinch to zoom for large trees (100+ members)
   - Pan to navigate across generations
   - Auto-zoom when clicking a node

5. **Member Details Panel**
   - Slides up from bottom when node clicked
   - Shows: Name, house, generation, DOB, family members
   - Quick navigation to related members

### Admin Family Management

#### User Creation/Edit Form Enhancements:

```typescript
// Add to user registration/edit forms:
<UserSearchField
  label="Father"
  onSelect={(user) => setFatherId(user._id)}
  gender="male"
  familyId={currentFamilyId}
/>

<UserSearchField
  label="Mother"
  onSelect={(user) => setMotherId(user._id)}
  gender="female"
  familyId={currentFamilyId}
/>

<UserSearchField
  label="Spouse"
  onSelect={(user) => setSpouseId(user._id)}
  familyId={currentFamilyId}
/>

<MultiSelectField
  label="Children"
  onSelect={(users) => setChildren(users.map(u => u._id))}
  familyId={currentFamilyId}
/>
```

## Implementation Steps

### Phase 1: Database & Backend (✅ Complete)
- [x] Update User model with relationship fields
- [x] Create FamilyTree model
- [x] Implement family tree controller
- [x] Create API routes
- [x] Add search endpoint for relatives

### Phase 2: Mobile UI Components
- [ ] Create UserSearchField component for relationship selection
- [ ] Update RegisterUserScreen with family fields
- [ ] Build FamilyTreeVisualization component with SVG
- [ ] Implement breadcrumb navigation
- [ ] Add zoom/pan gestures
- [ ] Create member details modal

### Phase 3: Admin Panel
- [ ] Add family relationship fields to user forms
- [ ] Create family tree management page
- [ ] Build bulk relationship import tool
- [ ] Add generation management interface

### Phase 4: Advanced Features
- [ ] Export family tree as PDF/image
- [ ] Timeline view (chronological births/marriages)
- [ ] Family statistics dashboard
- [ ] Relationship calculator (cousin finder)

## Usage Examples

### Creating a User with Family Relations

```typescript
// When registering a new user
const userData = {
  firstName: "Ram",
  lastName: "Kumar",
  email: "ram@example.com",
  familyId: "family-default",
  house: "Kadannamanna",
  generation: 4,
  
  // Family relationships
  fatherId: "father_user_id",  // Selected via search
  motherId: "mother_user_id",  // Selected via search
  spouseId: null,              // Not married yet
  children: [],                // No children yet
};

await api.post('/api/auth/register', userData);
```

### Fetching Family Tree

```typescript
// Get full tree for a house
const response = await api.get('/api/family-tree/family-default?house=Kadannamanna');
// Returns hierarchical structure with all relationships

// Get specific member's immediate family
const member = await api.get('/api/family-tree/member/user_id');
// Returns: { member, father, mother, spouse, children, siblings }

// Get ancestry path for breadcrumb
const path = await api.get('/api/family-tree/member/user_id/path');
// Returns: [{ name: "Great-Grandpa", generation: 1 }, ...]
```

### Searching for Relatives

```typescript
// Search for father (males only)
const fathers = await api.get('/api/family-tree/search/relatives?q=John&relationshipType=father');

// Search for mother (females only)
const mothers = await api.get('/api/family-tree/search/relatives?q=Mary&relationshipType=mother');

// Search for spouse (any gender)
const spouses = await api.get('/api/family-tree/search/relatives?q=Sarah');
```

### Updating Relationships

```typescript
// Admin updates family relationships
await api.patch('/api/family-tree/member/user_id/relationships', {
  fatherId: "father_id",
  motherId: "mother_id",
  spouseId: "spouse_id",
  children: ["child1_id", "child2_id"]
});
// Auto-updates generation and creates bidirectional links
```

## Visualization Algorithm

### Tree Layout Calculation

```typescript
function calculateNodePosition(member, level, positionInLevel) {
  const x = HORIZONTAL_SPACING * positionInLevel;
  const y = VERTICAL_SPACING * level;
  
  return { x, y };
}

function buildTreeLayout(rootMembers) {
  const tree = [];
  
  for (const root of rootMembers) {
    const node = {
      member: root,
      position: calculateNodePosition(root, root.generation, index),
      children: buildChildrenLayout(root.children, root.generation + 1),
      spouse: root.spouseId ? getSpouseNode(root.spouseId) : null
    };
    
    tree.push(node);
  }
  
  return tree;
}
```

### Connection Drawing

```typescript
// Parent to Child (vertical line)
<Line
  x1={parentNode.x}
  y1={parentNode.y + NODE_RADIUS}
  x2={childNode.x}
  y2={childNode.y - NODE_RADIUS}
  stroke="#D1D5DB"
  strokeWidth="2"
/>

// Spouse connection (horizontal line)
<Line
  x1={member.x + NODE_RADIUS}
  y1={member.y}
  x2={spouse.x - NODE_RADIUS}
  y2={spouse.y}
  stroke="#F59E0B"
  strokeWidth="2"
/>
```

## Performance Optimization

### For 100+ Members:

1. **Virtualization**: Only render visible nodes
2. **Lazy Loading**: Load generations on-demand
3. **Caching**: Cache tree structure in AsyncStorage
4. **Pagination**: Load 3 generations at a time
5. **Indexing**: Database indexes on familyId, generation, parentIds

### Generation Limits:

- Start at root generation (1)
- Load ±2 generations from current view
- Use "Load More" button for additional generations
- Breadcrumb shows path to current focus

## Color Coding

- **Gender**: Blue (male), Pink (female), Purple (other)
- **House**: 
  - Kadannamanna: Red
  - Mankada: Green
  - Ayiranazhi: Orange
  - Aripra: Purple
- **Status**: Gray overlay for deceased
- **Selection**: Yellow highlight for focused member

## Next Steps

1. Install SVG library: `npm install react-native-svg`
2. Create UserSearchField component for relationship selection
3. Update user forms with family relationship fields
4. Implement FamilyTreeVisualization component
5. Add breadcrumb navigation component
6. Test with sample data (10-20 generations)

## Sample Data Structure

```json
{
  "generation1": [
    {
      "_id": "root1",
      "firstName": "Patriarch",
      "generation": 1,
      "children": ["gen2_1", "gen2_2"]
    }
  ],
  "generation2": [
    {
      "_id": "gen2_1",
      "firstName": "Son1",
      "generation": 2,
      "fatherId": "root1",
      "spouseId": "gen2_spouse",
      "children": ["gen3_1", "gen3_2"]
    }
  ]
  // ... continues for 10-20 generations
}
```

This structure supports the interconnected family tree visualization with clickable nodes, zoom navigation, and breadcrumb trails for easy navigation across generations.
