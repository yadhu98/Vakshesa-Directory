# Vksha Mobile App - React Native

Cross-platform mobile application for iOS and Android using React Native and Expo.

## Features

- User authentication
- Family directory
- Family tree visualization
- Real-time leaderboard
- QR code scanning (Phase 2)
- Profile management
- Points tracking

## Prerequisites

- Node.js 16+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app (for testing on device)

## Installation

```bash
npm install
```

## Development

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

### Web
```bash
npm run web
```

## Building

### For iOS
```bash
npm run build-ios
```

### For Android
```bash
npm run build-android
```

## Environment Variables

Create `.env` file:

```
EXPO_PUBLIC_API_URL=http://your-backend-url/api
```

## Project Structure

```
src/
├── screens/        # Screen components
├── navigation/     # Navigation setup
├── components/     # Reusable components
├── services/       # API services
├── utils/          # Helper functions
└── types/          # TypeScript types
```

## Technologies

- React Native
- Expo
- TypeScript
- React Navigation
- Axios

## Testing on Device

1. Install Expo Go app
2. Run `npm start`
3. Scan QR code with Expo Go
4. App will open on your device

## Distribution

### iOS
- Build via Expo: `npm run build-ios`
- Download from EAS Builds
- Create Google Drive share link for distribution

### Android
- Build via Expo: `npm run build-android`
- Can be tested via APK
- Can be hosted on Google Drive

## Notes

- App is not published to App Store
- Distribution via Google Drive link
- Supports both iOS and Android
- Requires authentication to access features
