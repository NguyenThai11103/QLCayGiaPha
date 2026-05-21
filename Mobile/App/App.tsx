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
import { RootStackParamList } from './src/config/navigation';
import { colors } from './src/config/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const ONBOARDING_KEY = 'onboarding_completed';

function App(): React.JSX.Element {
  const [isLoading, setIsLoading]           = useState(true);
  const [initialRoute, setInitialRoute]     = useState<keyof RootStackParamList>('Onboarding');

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then(value => {
        if (value === 'true') {
          setInitialRoute('GetStarted');
        }
      })
      .catch(() => {/* Lỗi đọc storage: mặc định hiện Onboarding */})
      .finally(() => setIsLoading(false));
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
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.white}
      />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown         : false,
            animation           : 'slide_from_right',
            contentStyle        : { backgroundColor: colors.white },
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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;

