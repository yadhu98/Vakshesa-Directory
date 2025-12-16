# Quick Testing Guide - Interactive Family Tree

## ✅ What to Test

### 1. Full Tree View
- [ ] Open app and see Family Tree screen
- [ ] All 27 Kadannamanna members visible
- [ ] Relationship lines show (solid for parents, dashed for spouses)
- [ ] Nodes are colored by house (blue for Kadannamanna)
- [ ] Can scroll horizontally and vertically
- [ ] Can drag/pan the tree
- [ ] Zoom +/- buttons visible and responsive

### 2. House Selection
- [ ] See 4 house buttons at top: Kadannamanna, Mankada, Ayiranazhi, Aripra
- [ ] Click each house button
- [ ] Tree updates with that house's members
- [ ] Different colors for different houses
- [ ] Correct member count:
  - Kadannamanna: 8 members
  - Mankada: 7 members
  - Ayiranazhi: 7 members
  - Aripra: 7 members

### 3. Tap Node → Micro Family
- [ ] Tap on "Hari" node (Gen 1)
- [ ] Screen switches to Micro Family view
- [ ] Shows Hari in center
- [ ] Shows spouse "Lakshmi" with dashed line
- [ ] Shows 2 children: "Arjun" and "Ravi"
- [ ] All with connecting lines
- [ ] "← Back" button appears
- [ ] "Full Tree" button appears

### 4. Navigate Parents
- [ ] In Hari's micro family, there should be no parents (he's Gen 1)
- [ ] Tap "Arjun" (child)
- [ ] Screen now shows Arjun as center
- [ ] Shows Hari & Lakshmi above as parents
- [ ] Shows Priya as spouse
- [ ] Shows Aditya below as child

### 5. Navigate Children
- [ ] From Arjun's view, tap "Aditya" (child)
- [ ] View updates to Aditya as center
- [ ] Shows Arjun & Priya as parents
- [ ] No spouse (if not married)
- [ ] No children (if none)

### 6. Back Navigation
- [ ] From Aditya, tap "← Back"
- [ ] Returns to Arjun's view
- [ ] Tap "← Back" again
- [ ] Returns to Hari's view
- [ ] Tap "← Back" again
- [ ] Returns to Arjun's view (breadcrumb works)

### 7. Exit Micro Family
- [ ] From any micro family view, tap "Full Tree"
- [ ] Returns to full tree
- [ ] House selector buttons reappear
- [ ] All 27 nodes visible again

### 8. Zoom Controls
- [ ] See [−] 100% [+] at bottom
- [ ] Tap [+] to zoom in (should show ≤ 125%)
- [ ] Tap [−] to zoom out (should show ≥ 75%)
- [ ] Works in both Full Tree and Micro Family modes
- [ ] Can zoom from 50% to 250%

### 9. Member Details Modal
- [ ] Tap any node for details (long press or select)
- [ ] Modal appears from bottom
- [ ] Shows colored header matching node color
- [ ] Displays:
  - Name: "Arjun Menon"
  - Email: "arjun@example.com" (or test email)
  - Generation: "2"
  - Gender: "Male" or "Female"
  - House: "Kadannamanna" (or relevant house)
  - Status: "Alive"
- [ ] Close button (X) visible
- [ ] Can scroll if needed
- [ ] Tap X or outside to close

### 10. Responsive Design
- [ ] Test on different screen sizes (if available)
- [ ] Portrait orientation works
- [ ] Landscape orientation works (if supported)
- [ ] Text is readable
- [ ] Buttons are tapable
- [ ] No content overflow

---

## 🐛 Known Issues to Check

### Performance
- [ ] No lag when scrolling full tree
- [ ] Tap response is instant (<200ms)
- [ ] Switching between modes is smooth
- [ ] Zoom in/out is responsive

### Edge Cases
- [ ] Member with no parents (Gen 1) doesn't show parent lines
- [ ] Member with no children shows empty child area
- [ ] Member with no spouse shows empty spouse area
- [ ] Switching houses doesn't crash
- [ ] Opening same member multiple times works

### Visual Issues
- [ ] No nodes overlap unnecessarily
- [ ] Lines don't obscure nodes
- [ ] Text is not cut off
- [ ] Colors are distinct
- [ ] Initials are centered in circles

---

## 📊 Test Data

### Kadannamanna Family Tree
```
Generation 1 (Root):
- Hari Menon (M) ← TAP THIS
- Lakshmi Hari (F)

Generation 2 (Children):
- Arjun Menon (M) ← TAP THIS
  - Spouse: Priya Sharma (F)
- Ravi Menon (M)
  - Spouse: Divya Kumar (F)

Generation 3 (Grandchildren):
- Aditya Menon (M) ← TAP THIS (child of Arjun)
- Ananya Menon (F) ← TAP THIS (child of Ravi)
```

### Test Paths
```
Path 1: Hari → Arjun → Aditya → (Back) → Arjun → (Back) → Hari
Path 2: Hari → Arjun → Spouse (Priya) → (Back) → Arjun
Path 3: Hari → Ravi → Ananya → (Back) → Ravi
Path 4: (Full Tree) → Tap Lakshmi → See her as root
```

---

## ⚡ Keyboard Shortcuts (Web)
```
- Spacebar: Pan tree (hold + drag)
- +: Zoom in
- -: Zoom out
- Escape: Close modal/exit micro family
- Tab: Navigate between nodes
```

---

## 📱 Mobile Testing Checklist

### iOS (if available)
- [ ] Swipe gestures work
- [ ] Double-tap for zoom doesn't interfere
- [ ] Scroll momentum smooth
- [ ] Safe area respected (notch, etc.)

### Android (if available)
- [ ] Back button returns to previous
- [ ] Orientation change doesn't crash
- [ ] Performance smooth on older devices
- [ ] Touch response quick

---

## 🎯 Expected Behaviors

### Correct Micro Family Rendering
```
When tapping Arjun:
✅ Hari (father) appears above
✅ Lakshmi (mother) appears above
✅ Priya (spouse) appears to the side with dashed line
✅ Aditya (child) appears below
✅ All connected with solid lines
```

### Correct Navigation
```
Arjun → Tap Hari = Shows Hari's full family
Arjun → Tap Aditya = Shows Aditya's family (no spouse/children if none)
Arjun → Tap Priya = Shows Priya's family (might have her parents if Gen 2)
Arjun → Back = Returns to Arjun
```

### House Color Consistency
```
Kadannamanna = Blue (#1E40AF)
Mankada = Green (#059669)
Ayiranazhi = Red (#DC2626)
Aripra = Purple (#7C3AED)

All nodes of same house = same color
Modal header = same color as node
```

---

## ✨ Highlight Features to Showcase

1. **Click to Focus**: Tap any node → becomes center of micro family view
2. **Natural Navigation**: Click parents/children → explore family tree intuitively
3. **Breadcrumb History**: Back button remembers path through families
4. **Full Tree Overview**: Switch to Full Tree to see all 27 members at once
5. **Smart Layout**: Each mode shows only relevant information
6. **Instant Feedback**: All interactions are immediate and smooth
7. **Member Details**: Rich modal with all available information
8. **Multi-House Support**: Easy toggle between 4 houses
9. **Responsive Zoom**: 50-250% zoom range with precise control
10. **Visual Hierarchy**: Generations, relationships, and colors clearly indicate structure

---

## 🔧 Troubleshooting

### If Nodes Not Clickable
- Check if in pan mode (release pan first)
- Verify member exists in database
- Ensure nodes are visible on screen

### If Modal Doesn't Open
- Verify member has all required fields
- Check if modal styling is loaded
- Try different member

### If Back Button Not Working
- Ensure in Micro Family mode
- Check navigationHistory state
- Verify history array isn't empty

### If Tree Shows Wrong Data
- Clear app cache
- Verify API endpoint returns correct house
- Check if bulk import completed successfully

### If Performance Slow
- Reduce number of members
- Check device performance
- Try zooming to different level

---

## 📝 Feedback Template

When testing, document:
1. **Device**: iPhone 14 / Android 13 / Web Chrome
2. **Feature Tested**: e.g., "Tap node to enter micro family"
3. **Expected**: What should happen
4. **Actual**: What actually happens
5. **Status**: ✅ Pass / ⚠️ Partial / ❌ Fail
6. **Notes**: Any additional observations

Example:
```
Device: iPad Pro
Feature: Zoom controls
Expected: Tap [+] increases zoom from 100% to 120%
Actual: Works as expected, smooth animation
Status: ✅ Pass
Notes: None
```

---

## 🚀 Launch Checklist

Before production:
- [ ] All 10 test sections pass
- [ ] No console errors
- [ ] Responsive on multiple devices
- [ ] Performance acceptable (< 200ms response)
- [ ] Modal displays correctly
- [ ] All 4 houses have correct data
- [ ] Navigation history works
- [ ] Zoom limits respected (50-250%)
- [ ] Back button always works
- [ ] Full Tree shows all nodes
- [ ] Micro Family shows related members correctly
- [ ] Colors match house assignments
- [ ] Lines render correctly
- [ ] No memory leaks
- [ ] No infinite loops

---

**Version**: 2.0
**Last Updated**: December 1, 2025
**Status**: Ready for Testing ✅
