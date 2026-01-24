# Font Setup Guide - Poppins

The mobile app now uses **Poppins** font to match the web application.

## Steps to Add Poppins Fonts:

### 1. Download Poppins Fonts

Download the following font files from Google Fonts:
https://fonts.google.com/specimen/Poppins

You need these weights:
- Poppins-Regular.ttf (400)
- Poppins-Medium.ttf (500)
- Poppins-SemiBold.ttf (600)
- Poppins-Bold.ttf (700)

### 2. Add Fonts to Project

Place the downloaded `.ttf` files in:
```
app/assets/fonts/
```

Your folder structure should look like:
```
app/
├── assets/
│   └── fonts/
│       ├── Poppins-Regular.ttf
│       ├── Poppins-Medium.ttf
│       ├── Poppins-SemiBold.ttf
│       └── Poppins-Bold.ttf
├── android/
├── ios/
└── src/
```

### 3. Link Fonts (Already Configured)

The `react-native.config.js` file is already set up to link fonts automatically.

### 4. Rebuild the App

After adding the font files, rebuild the app:

```bash
# Clean build
cd android
./gradlew clean
cd ..

# Rebuild
npx react-native run-android
```

## Alternative: Quick Download Script

You can download fonts using this command:

```bash
# Navigate to fonts directory
cd assets/fonts

# Download Poppins fonts (requires curl)
curl -L "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Regular.ttf" -o Poppins-Regular.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Medium.ttf" -o Poppins-Medium.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-SemiBold.ttf" -o Poppins-SemiBold.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Bold.ttf" -o Poppins-Bold.ttf

# Go back to app root
cd ../..
```

## What's Already Done:

✅ Theme updated to use Poppins font family
✅ `react-native.config.js` created for font linking
✅ Font family constants updated in `src/constants/theme.ts`

## Font Usage in Code:

The fonts are used via the theme constants:

```typescript
import { TYPOGRAPHY } from '../constants/theme';

// In StyleSheet
const styles = StyleSheet.create({
  text: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,  // Poppins-Regular
    fontWeight: TYPOGRAPHY.fontWeight.medium,   // 500
  },
  heading: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,     // Poppins-Bold
    fontWeight: TYPOGRAPHY.fontWeight.bold,     // 700
  },
});
```

## Troubleshooting:

If fonts don't show after rebuild:
1. Make sure all 4 `.ttf` files are in `assets/fonts/`
2. Run `npx react-native-asset` (if available)
3. Clean and rebuild: `cd android && ./gradlew clean && cd .. && npx react-native run-android`
4. Check font file names match exactly (case-sensitive)
