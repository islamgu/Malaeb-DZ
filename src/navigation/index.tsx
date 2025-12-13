import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Calendar, Heart, User } from 'lucide-react-native';

// User Screens
import { SplashScreen } from '../screens/user/SplashScreen';
import { SignUpScreen } from '../screens/user/SignUpScreen';
import { HomeScreen } from '../screens/user/HomeScreen';
import { MapScreen } from '../screens/user/MapScreen';
import { StadiumDetailScreen } from '../screens/user/StadiumDetailScreen';
import { BookingFlowScreen } from '../screens/user/BookingFlowScreen';
import { MyBookingsScreen } from '../screens/user/MyBookingsScreen';
import { FavoritesScreen } from '../screens/user/FavoritesScreen';
import { ProfileScreen } from '../screens/user/ProfileScreen';

// Admin Screens
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { StadiumFormScreen } from '../screens/admin/StadiumFormScreen';
import { BookingsQueueScreen } from '../screens/admin/BookingsQueueScreen';
import { StadiumsListScreen } from '../screens/admin/StadiumsListScreen';
import { AvailabilityEditorScreen } from '../screens/admin/AvailabilityEditorScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AdminStack = createNativeStackNavigator();

// User Tab Navigator
function UserTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    height: 80,
                    paddingBottom: 20,
                    paddingTop: 10,
                    backgroundColor: '#FFFFFF',
                    borderTopColor: '#E5E7EB',
                },
                tabBarActiveTintColor: '#22C55E',
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color }) => <Home size={24} color={color} />,
                }}
            />
            <Tab.Screen
                name="MyBookings"
                component={MyBookingsScreen}
                options={{
                    tabBarLabel: 'Bookings',
                    tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
                }}
            />
            <Tab.Screen
                name="Favorites"
                component={FavoritesScreen}
                options={{
                    tabBarIcon: ({ color }) => <Heart size={24} color={color} />,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color }) => <User size={24} color={color} />,
                }}
            />
        </Tab.Navigator>
    );
}

// Admin Stack Navigator
function AdminStackScreen() {
    return (
        <AdminStack.Navigator screenOptions={{ headerShown: false }}>
            <AdminStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <AdminStack.Screen name="StadiumForm" component={StadiumFormScreen} />
            <AdminStack.Screen name="BookingsQueue" component={BookingsQueueScreen} />
            <AdminStack.Screen name="StadiumsList" component={StadiumsListScreen} />
            <AdminStack.Screen name="AvailabilityEditor" component={AvailabilityEditorScreen} />
        </AdminStack.Navigator>
    );
}

// Main Navigation
export function Navigation() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{ headerShown: false }}
                initialRouteName="Splash"
            >
                {/* Onboarding */}
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />

                {/* User Routes */}
                <Stack.Screen name="UserTabs" component={UserTabs} />
                <Stack.Screen name="MapView" component={MapScreen} />
                <Stack.Screen name="StadiumDetail" component={StadiumDetailScreen} />
                <Stack.Screen name="BookingFlow" component={BookingFlowScreen} />

                {/* Admin Routes */}
                <Stack.Screen name="AdminStack" component={AdminStackScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

