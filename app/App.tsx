/**
 * Saanvika Admin Dashboard Mobile App
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
