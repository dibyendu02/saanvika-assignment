# Saanvika Admin Dashboard - Mobile App

A React Native mobile application for the Saanvika admin dashboard, providing comprehensive management of offices, employees, attendance, and more.

## Features

- **Authentication**: Secure login with token-based authentication
- **Dashboard**: Overview of offices, attendance, and goodies with quick actions
- **Office Management**: View, filter, and manage office locations with progress tracking
- **Employee Directory**: Search and filter employees by office with detailed contact information
- **Attendance Tracking**: View attendance records with date and location information
- **Profile & Settings**: User profile management and app settings

## Tech Stack

- **React Native** 0.83.1
- **React Navigation** 7.x (Stack & Bottom Tabs)
- **TypeScript** for type safety
- **Axios** for API integration
- **AsyncStorage** for local data persistence
- **React Native Vector Icons** for iconography
- **date-fns** for date formatting

## Getting Started

### Prerequisites

- Node.js >= 20
- React Native development environment set up
- iOS Simulator (for iOS) or Android Emulator (for Android)

### Installation

```bash
# Install dependencies
npm install

# iOS only - Install pods
cd ios && pod install && cd ..
```

### Running the App

```bash
# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Configuration

### API Base URL

Update the API base URL in `src/constants/api.ts`:

```typescript
export const API_BASE_URL = 'http://YOUR_IP_ADDRESS:5001/api/v1';
```

**Note**: When testing on physical devices, replace `localhost` with your computer's IP address.

## Project Structure

```
app/
├── src/
│   ├── api/              # API integration layer
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # Base UI components
│   │   ├── dashboard/   # Dashboard-specific components
│   │   ├── offices/     # Office-specific components
│   │   └── employees/   # Employee-specific components
│   ├── screens/         # Screen components
│   │   ├── auth/        # Authentication screens
│   │   ├── dashboard/   # Dashboard screen
│   │   ├── offices/     # Office screens
│   │   ├── employees/   # Employee screens
│   │   ├── attendance/  # Attendance screens
│   │   └── more/        # More/Settings screens
│   ├── navigation/      # Navigation configuration
│   ├── context/         # React Context providers
│   ├── constants/       # Constants (theme, API endpoints)
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── App.tsx              # App entry point
└── index.js             # React Native entry point
```

## Design System

The app follows a consistent design system with:

- **Primary Color**: Deep blue (#1E3A8A)
- **Background**: Light gray (#F5F7FA)
- **Success**: Green (#10B981)
- **Warning**: Orange (#F59E0B)
- **Danger**: Red (#EF4444)
- **Info**: Purple (#8B5CF6)

## Features Overview

### Dashboard
- Statistics cards for offices, attendance, and goodies
- Office target progress tracking
- Internal notices
- Quick action buttons

### Offices
- List view with filtering (All, Active, Inactive)
- Office cards with employee count and target progress
- Statistics overview

### Employee Directory
- Search functionality
- Filter by office
- Employee cards with contact information
- Status badges

### Attendance
- Attendance records list
- Date and time information
- Location coordinates

### More
- User profile display
- Menu items for additional features
- Logout functionality

## Testing

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

## Troubleshooting

### Metro Bundler Issues
```bash
# Clear cache and restart
npm start -- --reset-cache
```

### iOS Build Issues
```bash
# Clean and rebuild
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

### Android Build Issues
```bash
# Clean gradle
cd android
./gradlew clean
cd ..
npm run android
```

## Backend Connection

Make sure your backend is running and accessible. Update the API base URL in `src/constants/api.ts`:

- **Local development**: `http://localhost:5001/api/v1`
- **Physical device**: `http://YOUR_COMPUTER_IP:5001/api/v1`

To find your IP address:
- **macOS**: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- **Windows**: `ipconfig`

## License

Private - Saanvika Assignment
