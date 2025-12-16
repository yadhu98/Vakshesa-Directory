# Interactive Family Tree - Complete Guide

## Overview
The Family Tree screen has been completely redesigned with **interactive features**, **navigation**, and **detailed micro-family views**. Now you can:
- ✅ Click on any node to focus on that family member
- ✅ Navigate between generations by clicking parents/children
- ✅ See micro-family structure (parents, spouse, children)
- ✅ Pan and drag across the full tree
- ✅ Zoom in/out with controls
- ✅ View member details in a modal
- ✅ Switch between houses (Kadannamanna, Mankada, Ayiranazhi, Aripra)

---

## Features

### 1. **Full Tree View**
- Displays complete family tree for selected house
- Shows all generations with interconnecting lines
- **Parent-Child**: Solid gray lines with T-junction style
- **Spouses**: Dashed orange lines indicating married relationships
- Nodes are color-coded by house
- Pan across the tree by dragging
- Zoom in/out with +/− buttons

### 2. **Interactive Node Selection**
- **Tap any node** to enter **Micro Family Mode**
- The tapped family member becomes the center focus
- Shows:
  - **Parents** (Father & Mother) - blue/pink circles
  - **Spouse** - colored circle with dashed orange line
  - **Children** - arranged below the parent
- Connected with relationship lines

### 3. **Micro Family Navigation**
Once in Micro Family Mode for a member:
- **Click Parent** → Navigate up to parent's micro family
- **Click Child** → Navigate down to child's micro family
- **Click Spouse** → View spouse's micro family
- **← Back Button** → Go to previous family member
- **Full Tree Button** → Return to complete tree view

### 4. **Member Details Modal**
Click on any node shows a modal with:
- Full name
- Email address
- Generation number
- Gender (male/female/other)
- House assignment
- Life status (Alive/Deceased)

### 5. **Zoom Controls**
- **−** Button: Zoom out (min 50%)
- **+** Button: Zoom in (max 250%)
- Displays current zoom percentage
- Works in both Full Tree and Micro Family modes

### 6. **House Selector**
- Quick toggle between all 4 houses
- Houses: Kadannamanna (Blue), Mankada (Green), Ayiranazhi (Red), Aripra (Purple)
- Only visible in Full Tree mode
- Updates tree immediately when changed

---

## How to Use

### Viewing the Full Family Tree
1. Open Family Tree screen
2. Select house from top buttons
3. View complete tree structure
4. All nodes and relationships visible
5. Drag to pan, zoom controls available

### Exploring a Specific Family
1. In Full Tree, **tap any node**
2. Screen switches to **Micro Family Mode**
3. You now see:
   - Selected member in center (larger node)
   - Parents above
   - Spouse to the side (if married)
   - Children below
4. All with connecting relationship lines

### Navigating Through Families
1. From Micro Family, **tap a parent** → See their immediate family
2. **Tap a child** → See that child's family (including their spouse/children)
3. **Tap a spouse** → View spouse's family structure
4. **← Back** → Return to previous member
5. **Full Tree** → Exit to see complete tree

### Viewing Member Details
1. From any mode, long-press or select a node
2. Modal appears showing:
   - Name with color-coded background
   - Email
   - Generation
   - Gender
   - House
   - Status
3. Swipe down or tap X to close

---

## Visual Guide

### Node Colors
```
By House:
- Kadannamanna: Blue (#1E40AF)
- Mankada: Green (#059669)
- Ayiranazhi: Red (#DC2626)
- Aripra: Purple (#7C3AED)

By Gender (if no house color):
- Male: Light Blue (#60A5FA)
- Female: Pink (#F472B6)
- Other: Purple (#A78BFA)
```

### Line Types
```
Parent-Child Relationships:
├─ Vertical line down from parent
├─ Horizontal line connecting siblings
└─ Vertical line up to child

Spouse Relationships:
─ ─ ─ ─ (Dashed orange line)
```

### Node Information
```
Node displays:
- Initials (in circle)
- First name (below circle)
- Generation (Gen X label)
- Color = House or Gender
```

---

## Technical Details

### Component Structure
```
FamilyTreeScreen
├── Full Tree Mode
│   ├── SVG Canvas (draggable, zoomable)
│   ├── renderFullTree() - Complete tree visualization
│   ├── renderConnectingLines() - Relationship lines
│   └── renderNode() - Interactive node circles
│
├── Micro Family Mode
│   ├── renderMicroFamilyTree() - Focused family view
│   ├── getMicroFamilyData() - Parent/spouse/children lookup
│   └── Navigation stack for breadcrumb tracking
│
└── Modal
    └── Member details display
```

### State Management
```typescript
- focusedMember: Currently selected family member
- microFamilyMode: Boolean (Full vs Micro view)
- navigationHistory: Array for back navigation
- zoomLevel: Current zoom percentage
- panX, panY: Pan offset coordinates
- selectedHouse: Active house filter
```

### Data Flow
```
API Response (family-tree endpoint)
    ↓
flattenTree() - Extract all members
    ↓
buildTreeLayout() - Position nodes by generation
    ↓
Render Functions
    ├── Full Tree: renderFullTree()
    └── Micro Family: renderMicroFamilyTree()
    ↓
Interactive SVG with onPress handlers
```

---

## Interaction Flow

### Full Tree → Micro Family
```
User taps node
    ↓
handleNodePress()
    ↓
focusedMember = selected member
microFamilyMode = true
navigationHistory = []
    ↓
UI switches to Micro Family view
```

### Micro Family Navigation
```
User taps parent/child/spouse
    ↓
handleNodePress()
    ↓
navigationHistory += [current member]
focusedMember = new member
    ↓
renderMicroFamilyTree() updates with new member's family
```

### Back Navigation
```
User taps Back button
    ↓
handleBackNavigation()
    ↓
if (history.length > 0)
    focusedMember = history.pop()
else
    microFamilyMode = false (return to full tree)
```

---

## API Integration

### Endpoint Used
```
GET /api/family-tree/family-default?house={houseName}
```

### Response Structure
```json
{
  "tree": [
    {
      "member": {
        "_id": "mongo-id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "house": "Kadannamanna",
        "gender": "male",
        "generation": 1,
        "fatherId": "parent-id",
        "motherId": "parent-id",
        "spouseId": "spouse-id",
        "children": ["child-id-1", "child-id-2"],
        "isAlive": true
      },
      "children": [...]
    }
  ]
}
```

### Data Relationships
- `fatherId` → Links to father's _id
- `motherId` → Links to mother's _id
- `spouseId` → Links to spouse's _id
- `children[]` → Array of child _ids
- Used to render connecting lines and navigate between members

---

## Features by Mode

### Full Tree Mode
✅ House selector visible
✅ Complete tree structure
✅ All nodes and relationships shown
✅ Pan and drag to navigate
✅ Zoom in/out
❌ Back button (not in this mode)
❌ Breadcrumb navigation

### Micro Family Mode
❌ House selector (hidden)
✅ Back button
✅ Focused family view (Parents → Person → Children)
✅ Breadcrumb navigation (Back button)
✅ Zoom controls
✅ Tap to navigate to related members

---

## Performance Optimizations

1. **Lazy Rendering**: Nodes render only when scrolled into view
2. **SVG Optimization**: Lines rendered once, not recalculated
3. **Member Map Caching**: Quick ID lookups with Map structure
4. **PanResponder**: Efficient gesture handling
5. **Memoization**: Functions don't recalculate unnecessarily

---

## Error Handling

### Empty Tree
- Shows "No family tree data" message
- Prompts user to contact administrator

### Invalid Member Selection
- Silently fails if member doesn't exist
- Member modal won't appear

### API Failures
- Catches errors, logs to console
- Falls back to empty state
- User can retry by switching houses

---

## Future Enhancements

1. **Search** - Find members by name
2. **Filters** - Show only males/females, specific generations
3. **Export** - Save tree as PDF/image
4. **Photos** - Display profile pictures in nodes
5. **Statistics** - Count by generation, house statistics
6. **Print** - Optimized print-friendly layout
7. **Timeline** - Birth/death dates with age calculation
8. **Lineage** - Highlight direct lineage paths
9. **Marriage Timeline** - Show marriage years
10. **Relationship Details** - Click lines to see relationship info

---

## Troubleshooting

### Nodes not appearing
- Check if house has members
- Try switching to another house
- Verify API is returning data

### Can't click nodes
- Ensure not in pan mode (drag state)
- Try tapping directly on node circle
- Verify member exists in database

### Zoom not working
- Check +/− buttons are visible
- Try using mouse wheel (if web)
- Reset by closing and reopening

### Back button not working
- Only appears in Micro Family mode
- Check navigationHistory state
- Try Full Tree button to exit

---

## Code Location
```
File: mobile/src/screens/FamilyTreeScreen.tsx
Size: ~1000 lines
Components:
  - FamilyTreeScreen (main component)
  - InteractiveNode (individual node renderer)
  - Helper functions (flattenTree, buildTreeLayout, etc.)
```

---

**Last Updated**: December 1, 2025
**Version**: 2.0 (Interactive)
**Status**: Production Ready ✅
