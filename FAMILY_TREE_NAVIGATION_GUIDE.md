# Family Tree Navigation - Enhanced Features

## ✨ New Navigation Features

### 1. **Click Any Node → Navigate to Their Family**
When you're viewing a micro family and click on:
- **Father/Mother** → See their immediate family (parents, spouse, children)
- **Spouse** → View spouse's family structure
- **Children** → Navigate to child's family

### 2. **Generation Tracking**
Each node now shows its generation level:
- **Gen 1** - Grandparent level
- **Gen 2** - Parent level  
- **Gen 3** - Your generation
- **Gen 4** - Children level
- **Gen 5** - Grandchildren level

Displayed as:
```
        [Father Node]
        Gen 1
          ↓
      [YOU Node]
      Gen 3
          ↓
      [Child Node]
      Gen 4
```

### 3. **Breadcrumb Navigation Trail**
When you navigate through family members, a breadcrumb trail shows your path:

```
Breadcrumb: Hari → Arjun → Aditya
```

- Shows entire navigation history
- Helps you understand how deep you are in the tree
- Appears only when you have navigated

### 4. **Back Button**
- **← Back** button returns to previous member
- Removes one step from breadcrumb trail
- When no history, exits micro family view
- Always visible in micro family mode

### 5. **Full Tree Button**
- Returns to complete family tree overview
- Clears navigation history
- Shows all 27 members at once
- Resets to full view mode

---

## Navigation Flow

### Starting Point: Full Tree
```
[All 27 Members Visible]
        ↓
    Click Hari
        ↓
[Enter Micro Family Mode]
[Hari + Family Shown]
Breadcrumb: (empty)
```

### Navigating Down (to Children)
```
[Micro: Hari's Family]
Hari ← Spouse → You
  ↓
Click Arjun (child)
  ↓
[Micro: Arjun's Family]
Hari ← Spouse → You
  ↓
Breadcrumb: Hari → Arjun
Back button now returns to Hari
```

### Navigating Up (to Parents)
```
[Micro: Arjun's Family]
Father ← Spouse → You
  ↓
Click Father (parent)
  ↓
[Micro: Father's Family]
Grandfather ← Spouse
     ↓
Breadcrumb: Arjun → Hari
Back button returns to Arjun
```

### Navigating to Sibling (via Parent)
```
[Micro: Arjun's Family]
Hari ← Spouse
  ↓
Click Ravi (sibling via parent)
  ↓
[Micro: Ravi's Family]
Hari ← Spouse
  ↓
Breadcrumb: Arjun → Hari → Ravi
```

### Going Back to Full Tree
```
[Micro: Aditya's Family]
Arjun ← Spouse
  ↓
Click "Full Tree" button
  ↓
[All 27 Members Again]
Breadcrumb: cleared
```

---

## Visual Features in Micro Family View

### Header Section
```
┌─────────────────────────────────────────┐
│ ← Back    Arjun Menon      Full Tree    │
│           Gen 2 (Parent)                │
└─────────────────────────────────────────┘
│ Breadcrumb: Hari → Arjun                │
└─────────────────────────────────────────┘
```

### Radial Tree Layout
```
      Father (Gen 1)
           ↓
Mother ←─ YOU (Gen 2) ─→ Spouse
      Gen 2    Gen 2
           ↓
      Children (Gen 3)
      ↓        ↓
    Child1   Child2
    Gen 3    Gen 3
```

### Color Coding
- **Blue** (Male) - Father, male children
- **Pink** (Female) - Mother, female children
- **House Color** - By house assignment (Kadannamanna Blue, etc.)
- **Generation Label** - Shows "Gen X" below name

---

## How Generation Display Works

```typescript
Generation Mapping:
1 = Gen 1 (Grandparent) - Root ancestors
2 = Gen 2 (Parent) - Direct parents
3 = Gen 3 (Your Gen) - Current generation
4 = Gen 4 (Children) - Direct children
5 = Gen 5 (Grandchildren) - Grandchildren
```

When viewing Arjun (Gen 2):
```
Father = Gen 1 (one generation above)
Mother = Gen 1 (one generation above)
Spouse = Gen 2 (same generation)
Children = Gen 3 (one generation below)
```

---

## Interaction Examples

### Example 1: Navigate Down 3 Generations
```
Step 1: Click Hari (Gen 1)
  → View: Hari's family
  → Breadcrumb: (empty)
  
Step 2: Click Arjun (his child, Gen 2)
  → View: Arjun's family
  → Breadcrumb: Hari → Arjun
  
Step 3: Click Aditya (his child, Gen 3)
  → View: Aditya's family
  → Breadcrumb: Hari → Arjun → Aditya
  
Step 4: Click ← Back
  → Back to Arjun's family
  → Breadcrumb: Hari → Arjun
```

### Example 2: Navigate to Spouse's Family
```
Step 1: View Arjun's family
Step 2: Click Priya (spouse)
  → View: Priya's family
  → Shows Priya's parents, spouse (Arjun), children
  → Breadcrumb: Arjun → Priya
```

### Example 3: Full Tree to Deep Navigation
```
Step 1: Full Tree view (all 27 members)
Step 2: Click Hari
  → Micro family mode
  → Breadcrumb: (empty)
  
Step 3: Click Arjun
  → Breadcrumb: Hari → Arjun
  
Step 4: Click Aditya
  → Breadcrumb: Hari → Arjun → Aditya
  
Step 5: Click "Full Tree" button
  → Back to all 27 members
  → Breadcrumb cleared
```

---

## State Management

### Navigation State
```typescript
// Current focused member
focusedMember: FamilyMember | null

// Whether in micro view
microFamilyMode: boolean

// History of navigation
navigationHistory: FamilyMember[]
// Example: [Hari, Arjun] means: Hari → Arjun → [Current]

// Generation info
generation: number (1-5)
generationLabel: string ("Gen 2 (Parent)")
```

### How Back Button Works
```
navigationHistory = [Hari, Arjun, Aditya]
focusedMember = Current member (clicked node)

User clicks ← Back
  ↓
Pop from history: previousMember = Aditya
navigationHistory = [Hari, Arjun]
focusedMember = Aditya
  ↓
UI updates to show Aditya's family
```

---

## Navigation Rules

### When in Full Tree Mode
- ✅ Click any node → Enter micro family for that person
- ✅ House buttons active
- ❌ No back button
- ❌ No breadcrumb

### When in Micro Family Mode
- ✅ Click any relative → Navigate to their family
- ✅ Back button → Go to previous person
- ✅ Full Tree button → Exit to overview
- ✅ Breadcrumb → Shows your path
- ✅ Generation labels → Show your relative position
- ❌ House buttons hidden

### What Clicking Different Nodes Does
```
Click Parent → Show parent's family
            → Parent now centered
            → Parent becomes the new focus
            → History: [..., currentMember]

Click Spouse → Show spouse's family  
           → Spouse now centered
           → Spouse becomes the new focus
           → History: [..., currentMember]

Click Child → Show child's family
          → Child now centered
          → Child becomes the new focus
          → History: [..., currentMember]
```

---

## Breadcrumb Examples

### 1 Step Deep
```
Breadcrumb: (none - just entered)
View: Hari's immediate family
```

### 2 Steps Deep
```
Breadcrumb: Hari → Arjun
View: Arjun's immediate family
Back returns to: Hari
```

### 3 Steps Deep
```
Breadcrumb: Hari → Arjun → Aditya
View: Aditya's immediate family
Back returns to: Arjun
```

### 4 Steps Deep
```
Breadcrumb: Hari → Arjun → Aditya → [Spouse]
View: Aditya's spouse family
Back returns to: Aditya
```

---

## Features Summary

| Feature | Full Tree | Micro View |
|---------|-----------|-----------|
| See all members | ✅ | ❌ |
| See 5-7 relations | ❌ | ✅ |
| Click nodes | ✅ | ✅ |
| Back button | ❌ | ✅ |
| Breadcrumb | ❌ | ✅ (when navigated) |
| Generation labels | ✅ | ✅ |
| House buttons | ✅ | ❌ |
| Zoom controls | ✅ | ✅ |
| Radial layout | ❌ | ✅ |

---

## User Journey Example

```
1. User opens Family Tree → See full Kadannamanna (27 members)

2. User clicks "Hari" node
   → Enter micro family view
   → See Hari + Lakshmi (spouse) + 2 children (Arjun, Ravi)
   → No breadcrumb (first click)

3. User clicks "Arjun" (child)
   → View updates to Arjun's family
   → See: Hari (Gen 1), Lakshmi (Gen 1), Arjun (Gen 2 - YOU), 
           Priya (spouse), Aditya (child, Gen 3)
   → Breadcrumb shows: "Hari → Arjun"
   → Header shows: "Arjun Menon - Gen 2 (Parent)"

4. User clicks "Aditya" (child)
   → View updates to Aditya's family
   → See: Arjun (Gen 2), Priya (Gen 2), Aditya (Gen 3 - YOU)
   → Breadcrumb shows: "Hari → Arjun → Aditya"
   → Header shows: "Aditya Menon - Gen 3 (Your Gen)"

5. User clicks "← Back"
   → Returns to Arjun's view
   → Breadcrumb: "Hari → Arjun"

6. User clicks "← Back" again
   → Returns to Hari's view
   → Breadcrumb: (empty)

7. User clicks "Full Tree"
   → Returns to complete 27-member overview
   → Breadcrumb cleared
   → House buttons reappear
```

---

## Technical Implementation

### handleNodePress Function
```typescript
// When user clicks a node:
if (microFamilyMode) {
  // Add current to history
  setNavigationHistory([...navigationHistory, focusedMember])
  // Set clicked member as new focus
  setFocusedMember(member)
} else {
  // First time clicking, enter micro mode
  setFocusedMember(member)
  setMicroFamilyMode(true)
  setNavigationHistory([])
}
```

### handleBackNavigation Function
```typescript
// When user clicks ← Back:
if (navigationHistory.length > 0) {
  // Pop last from history
  const previousMember = navigationHistory.pop()
  setFocusedMember(previousMember)
} else {
  // No history, exit micro mode
  setMicroFamilyMode(false)
  setFocusedMember(null)
}
```

### getGenerationInfo Function
```typescript
// Returns generation and label
1 → "Gen 1 (Grandparent)"
2 → "Gen 2 (Parent)"
3 → "Gen 3 (Your Gen)"
4 → "Gen 4 (Children)"
5 → "Gen 5 (Grandchildren)"
```

---

**Version**: 2.1 (Enhanced Navigation)
**Last Updated**: December 1, 2025
**Status**: Production Ready ✅
