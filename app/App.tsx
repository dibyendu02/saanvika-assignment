/**
 * Saanvika Admin Dashboard Mobile App
 */

import React from 'react';
import { StatusBar, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  const toastConfig = {
    success: ({ text1, text2 }: any) => (
      <View style={{
        backgroundColor: '#10b981',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}>
        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600', flex: 1 }}>
          {text1}
        </Text>
        {text2 && <Text style={{ color: '#ffffff', fontSize: 14, marginLeft: 8 }}>{text2}</Text>}
      </View>
    ),
    error: ({ text1, text2 }: any) => (
      <View style={{
        backgroundColor: '#ef4444',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}>
        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600', flex: 1 }}>
          {text1}
        </Text>
        {text2 && <Text style={{ color: '#ffffff', fontSize: 14, marginLeft: 8 }}>{text2}</Text>}
      </View>
    ),
    info: ({ text1, text2 }: any) => (
      <View style={{
        backgroundColor: '#3b82f6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}>
        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600', flex: 1 }}>
          {text1}
        </Text>
        {text2 && <Text style={{ color: '#ffffff', fontSize: 14, marginLeft: 8 }}>{text2}</Text>}
      </View>
    ),
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
        <Toast config={toastConfig} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
