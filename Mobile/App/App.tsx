/**
 * Cây Gia Phả - React Native App
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import OnboardingScreen from './src/pages/OnboardingScreen';
import GetStartedScreen from './src/pages/GetStartedScreen';
import LoginScreen from './src/pages/LoginScreen';
import RegisterScreen from './src/pages/RegisterScreen';
import MainNavigator from './src/navigation/MainNavigator';
import QRScanScreen from './src/pages/QRScanScreen';
import NotificationsScreen from './src/pages/NotificationsScreen';
import ForgotPasswordScreen from './src/pages/ForgotPasswordScreen';
import SettingsScreen from './src/pages/SettingsScreen';
import HelpScreen from './src/pages/HelpScreen';
import { RootStackParamList } from './src/config/navigation';
import { STORAGE_TOKEN_KEY } from './src/genaral/authService';
import { colors } from './src/config/theme';
import { ThemeProvider } from './src/context/ThemeContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

const ONBOARDING_KEY = 'onboarding_completed';

function App(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Onboarding');

  useEffect(() => {
    const initApp = async () => {
      try {
        // 1️⃣ Kiểm tra token trước — nếu có thì vào thẳng Home
        const token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
        if (token) {
          setInitialRoute('Home');
          return;
        }

        // 2️⃣ Không có token — kiểm tra onboarding
        const onboarded = await AsyncStorage.getItem(ONBOARDING_KEY);
        setInitialRoute(onboarded === 'true' ? 'GetStarted' : 'Onboarding');
      } catch {
        setInitialRoute('Onboarding');
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A1A' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.white}
        />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: colors.white },
            }}>
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ animation: 'fade' }}
            />
            <Stack.Screen
              name="GetStarted"
              component={GetStartedScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
            />
            <Stack.Screen
              name="Home"
              component={MainNavigator}
              options={{ animation: 'fade' }}
            />
            <Stack.Screen
              name="QRScan"
              component={QRScanScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Help"
              component={HelpScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;

