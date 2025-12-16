# Styling and UI Library Setup

## Admin Panel (React)

### Install Dependencies
```bash
cd admin
npm install react-hot-toast react-icons
```

### Usage
- **Toast Notifications**: Use `react-hot-toast` for feedback messages
- **Icons**: Use `react-icons/fi` (Feather icons)
- **Colors**: Black (#000000) and White (#FFFFFF) theme

## Mobile App (React Native)

### Install Dependencies
```bash
cd mobile
npm install react-native-paper react-native-vector-icons
npx expo install react-native-safe-area-context
```

### Setup Icons (if not already done)
For Expo: Icons are included by default

### Usage
- **Snackbar**: Use `react-native-paper` Snackbar component
- **Icons**: Use Feather icons from `react-native-vector-icons/Feather`
- **Theme**: Black and white with purple accents

## Implementation Notes

1. **Admin Panel Toast**: Already integrated in CarnivalAnalytics
2. **Mobile Snackbar**: Integrated in MyStallsScreen and CarnivalEventScreen
3. **Icons**: Feather icons used throughout for consistency
4. **Color Scheme**: Monochrome with strategic accent colors
