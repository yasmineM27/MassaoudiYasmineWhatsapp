// home/Home.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import MyAccount from './MyAccount';
import Group from './Group';
import List from './List';

const Tab = createBottomTabNavigator();

export default function Home() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: 'green',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { height: 60, paddingBottom: 5 },
      }}
    >
      <Tab.Screen name="Group" component={Group} options={{ tabBarLabel: 'Group' }} />
      <Tab.Screen name="List" component={List} options={{ tabBarLabel: 'List' }} />
     <Tab.Screen name="MyAccount" component={MyAccount} options={{ tabBarLabel: 'Account' }} />

    </Tab.Navigator>
  );
}
