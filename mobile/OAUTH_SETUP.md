# OAuth Setup Guide for Mobile App

## Google OAuth Configuration

The RegisterScreen now supports Google Sign-In via OAuth. To enable this functionality, you need to configure OAuth client IDs from Google Cloud Console.

### Prerequisites

1. Expo account (for Expo Client ID)
2. Google Cloud Console account
3. Project created in Google Cloud Console

### Step 1: Install Required Packages

```bash
cd mobile
npm install expo-auth-session expo-web-browser
```

### Step 2: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing project
3. Enable Google+ API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 Credentials:
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"

### Step 3: Create Client IDs

You need to create **4 different OAuth client IDs**:

#### 3.1 Web Client ID
- Application type: **Web application**
- Name: "Vksha Web Client"
- Authorized redirect URIs: Add your backend URL + `/auth/google/callback`
- Copy the **Client ID** (will be used as `webClientId`)

#### 3.2 iOS Client ID
- Application type: **iOS**
- Name: "Vksha iOS Client"
- Bundle ID: Get from `app.json` (e.g., `com.yourcompany.vksha`)
- Copy the **Client ID** (will be used as `iosClientId`)

#### 3.3 Android Client ID
- Application type: **Android**
- Name: "Vksha Android Client"
- Package name: Get from `app.json` (e.g., `com.yourcompany.vksha`)
- SHA-1 certificate fingerprint: 
  - For development: Run `expo credentials:manager` and select "Android" > "Keystore" > "View"
  - For production: Use your production keystore SHA-1
- Copy the **Client ID** (will be used as `androidClientId`)

#### 3.4 Expo Client ID
- Application type: **Web application**
- Name: "Vksha Expo Client"
- Authorized redirect URIs:
  - `https://auth.expo.io/@YOUR_EXPO_USERNAME/vksha`
  - Replace `YOUR_EXPO_USERNAME` with your Expo username
- Copy the **Client ID** (will be used as `expoClientId`)

### Step 4: Update RegisterScreen.tsx

Open `mobile/src/screens/RegisterScreen.tsx` and update the OAuth configuration (around line 57):

```typescript
const [request, response, promptAsync] = Google.useAuthRequest({
  expoClientId: 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
});
```

Replace:
- `YOUR_EXPO_CLIENT_ID` with the Expo Web Client ID from Step 3.4
- `YOUR_IOS_CLIENT_ID` with the iOS Client ID from Step 3.2
- `YOUR_ANDROID_CLIENT_ID` with the Android Client ID from Step 3.3
- `YOUR_WEB_CLIENT_ID` with the Web Client ID from Step 3.1

### Step 5: Get Your Expo Username

```bash
expo whoami
```

This displays your Expo username. Use this in the redirect URI (Step 3.4).

### Step 6: Testing

1. **Development Mode:**
   ```bash
   cd mobile
   npm start
   ```

2. **Test OAuth Flow:**
   - Navigate to Register screen
   - Click "Sign in with Google" button
   - Complete Google authentication
   - Verify that email and name fields are auto-filled
   - Complete remaining fields
   - Submit registration

### Troubleshooting

#### Error: "Invalid client ID"
- Verify all 4 client IDs are correctly copied
- Ensure client IDs end with `.apps.googleusercontent.com`
- Check that bundle ID/package name matches `app.json`

#### Error: "Redirect URI mismatch"
- Verify redirect URIs are added in Google Cloud Console
- Ensure Expo username is correct in redirect URI
- For web client, ensure backend URL is correct

#### OAuth button not working
- Check that `expo-auth-session` and `expo-web-browser` are installed
- Run `expo install expo-auth-session expo-web-browser` to ensure compatibility
- Clear Metro cache: `npm start -- --clear`

#### Google user info not fetched
- Verify Google+ API is enabled in Google Cloud Console
- Check access token is valid
- Inspect console logs for API errors

### Security Notes

1. **Never commit client IDs to version control** - Use environment variables:
   ```typescript
   import Constants from 'expo-constants';
   
   const expoClientId = Constants.expoConfig?.extra?.googleExpoClientId;
   ```

2. **Add to app.json:**
   ```json
   {
     "expo": {
       "extra": {
         "googleExpoClientId": "YOUR_EXPO_CLIENT_ID",
         "googleIosClientId": "YOUR_IOS_CLIENT_ID",
         "googleAndroidClientId": "YOUR_ANDROID_CLIENT_ID",
         "googleWebClientId": "YOUR_WEB_CLIENT_ID"
       }
     }
   }
   ```

3. **Add to .gitignore:**
   ```
   app.json
   .env
   ```

### Backend Integration

The OAuth flow sends the user data to the existing `/auth/register` endpoint:

```typescript
POST /auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@gmail.com", // From Google
  "password": "securePassword123",
  "phone": "+1234567890",
  "gender": "Male",
  "house": "Kadannamanna",
  "generation": 1,
  "address": "123 Main St",
  "profession": "Engineer"
}
```

No backend changes are required - the OAuth flow just pre-fills the registration form.

### Additional Resources

- [Expo Auth Session Docs](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Expo Google Sign-In Guide](https://docs.expo.dev/guides/authentication/#google)
