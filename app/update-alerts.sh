#!/bin/bash

# Script to replace Alert with Toast in all screen files

echo "Updating screens to use Toast instead of Alert..."

# Update offices screen
sed -i '' 's/Alert,//' /Users/dibyendudas/Personal-Projects/saanvika-assignment/app/src/screens/offices/OfficesScreen.tsx
sed -i '' "s/import { COLORS/import { showToast } from '..\/..\/utils\/toast';\nimport { COLORS/" /Users/dibyendudas/Personal-Projects/saanvika-assignment/app/src/screens/offices/OfficesScreen.tsx
sed -i '' "s/Alert.alert('Error', 'Failed to load offices');/showToast.error('Error', 'Failed to load offices');/" /Users/dibyendudas/Personal-Projects/saanvika-assignment/app/src/screens/offices/OfficesScreen.tsx

# Update employees screen
sed -i '' 's/Alert,//' /Users/dibyendudas/Personal-Projects/saanvika-assignment/app/src/screens/employees/EmployeeDirectoryScreen.tsx
sed -i '' "s/import { COLORS/import { showToast } from '..\/..\/utils\/toast';\nimport { COLORS/" /Users/dibyendudas/Personal-Projects/saanvika-assignment/app/src/screens/employees/EmployeeDirectoryScreen.tsx
sed -i '' "s/Alert.alert('Error', 'Failed to load employees');/showToast.error('Error', 'Failed to load employees');/" /Users/dibyendudas/Personal-Projects/saanvika-assignment/app/src/screens/employees/EmployeeDirectoryScreen.tsx

# Update attendance screen
sed -i '' 's/Alert,//' /Users/dibyendudas/Personal-Projects/saanvika-assignment/app/src/screens/attendance/AttendanceScreen.tsx
sed -i '' "s/import { COLORS/import { showToast } from '..\/..\/utils\/toast';\nimport { COLORS/" /Users/dibyendudas/Personal-Projects/saanvika-assignment/app/src/screens/attendance/AttendanceScreen.tsx
sed -i '' "s/Alert.alert('Error', 'Failed to load attendance records');/showToast.error('Error', 'Failed to load attendance records');/" /Users/dibyendudas/Personal-Projects/saanvika-assignment/app/src/screens/attendance/AttendanceScreen.tsx

echo "Done!"
