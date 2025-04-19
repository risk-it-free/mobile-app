# Mobile App - Setup & Installation Guide

## Overview

This is a mobile application built with React Native and Expo. To run and test this application on your mobile device, you'll need to set up Expo and make some configuration changes.

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- npm or yarn package manager
- A smartphone with the Expo Go app installed
- For iOS development: macOS with Xcode installed
- For Android development: Android Studio with an emulator set up (optional)

## Installation Steps

### 1. Install Expo CLI

```bash
npm install -g expo-cli
```

### 2. Install project dependencies

```bash
npm install
```

### 3. Configure Backend URL

Before running the app, you need to modify the backend URL in the `config.ts` file. This is crucial for the app to communicate with your backend server.

1. Open the `config.ts` file located in the project root
2. Find the `backendApiUrl` setting
3. Replace the URL with your backend server URL:

```typescript
export const config = {
    backendApiUrl: 'YOUR_BACKEND_URL_HERE',
}
```

> **Note:** If you're using a local development server, you might need to use your computer's local IP address instead of localhost.

### 4. Start the Development Server

```bash
npx expo start
```

This will start the Metro bundler and display a QR code in your terminal.

## Running on Your Mobile Device

### Using Expo Go

1. Install the Expo Go app on your mobile device:
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)

2. Make sure your mobile device is on the same Wi-Fi network as your development computer.

3. Scan the QR code:
   - Android: Use the Expo Go app to scan the QR code
   - iOS: Use the iPhone's camera app to scan the QR code

4. The app should load on your device automatically.

### Development Builds (for advanced features)

If you need to use native modules not supported by Expo Go:

```bash
npx expo prebuild
npx expo run:android  # For Android
npx expo run:ios      # For iOS (requires macOS)
```

## Troubleshooting

- **Cannot connect to server**:
  - Ensure your mobile device and computer are on the same network.
  - Check if your firewall is blocking the connection.
  - Try starting the server with `npx expo start --tunnel` to use a tunnel connection.

- **Backend connection issues**:
  - Verify that the backend URL in config.ts is correct and ensure it is https not http.
  - Check if your backend server is running.
  - Ensure your backend server is accessible from your mobile device.

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Go Client](https://expo.dev/client)

## Support

If you encounter any issues during setup or running the application, please contact the development team for assistance.
