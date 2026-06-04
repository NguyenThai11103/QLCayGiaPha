/**
 * MainNavigator – Bottom Tab Navigator dùng CustomTabBar
 * Route: Home | Members | Tree | Events | Profile
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomTabBar from '../components/CustomTabBar';

// ── Screens
import HomeScreen    from '../pages/HomeScreen';
import MembersScreen from '../pages/MembersScreen';
import TreeScreen    from '../pages/TreeScreen';
import EventsScreen  from '../pages/EventsScreen';
import ProfileScreen from '../pages/ProfileScreen';

const Tab = createBottomTabNavigator();

const MainNavigator: React.FC<{ navigation?: any }> = () => (
  <Tab.Navigator
    tabBar={props => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
    initialRouteName="Home">
    <Tab.Screen name="Home"    component={HomeScreen}    />
    <Tab.Screen name="Members" component={MembersScreen} />
    <Tab.Screen name="Tree"    component={TreeScreen}    />
    <Tab.Screen name="Events"  component={EventsScreen}  />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

export default MainNavigator;
