import { View, Text, Platform, StyleSheet } from 'react-native';
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Users, Wallet, Settings } from 'lucide-react-native';

import HomeScreen from '../screens/HomeScreen';
import WalletScreen from '../screens/WalletScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MyVendorsScreen from '../screens/MyVendorsScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
        screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#2563eb',
            tabBarInactiveTintColor: '#94a3b8',
            tabBarStyle: styles.tabBar,
            tabBarLabelStyle: styles.tabBarLabel,
            tabBarIconStyle: styles.tabBarIcon,
        }}
    >
        <Tab.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{
                tabBarIcon: ({ color, size }) => (
                    <Home color={color} size={24} strokeWidth={2.5} />
                )
            }}
        />
        <Tab.Screen 
            name="My Vendors" 
            component={MyVendorsScreen} 
            options={{
                tabBarIcon: ({ color, size }) => (
                    <Users color={color} size={24} strokeWidth={2.5} />
                )
            }}
        />
        <Tab.Screen 
            name="Wallet" 
            component={WalletScreen} 
            options={{
                tabBarIcon: ({ color, size }) => (
                    <Wallet color={color} size={24} strokeWidth={2.5} />
                )
            }}
        />
        <Tab.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{
                tabBarIcon: ({ color, size }) => (
                    <Settings color={color} size={24} strokeWidth={2.5} />
                )
            }}
        />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#ffffff',
        borderTopWidth: 0,
        height: Platform.OS === 'ios' ? 88 : 70,
        paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        paddingTop: 12,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        elevation: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    tabBarLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        marginTop: 2,
        letterSpacing: 0.2,
    },
    tabBarIcon: {
        marginBottom: 2,
    }
});

