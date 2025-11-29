// App.js
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Auth from './auth';
import Register from './register';

import Home from './home/Home';
import MyAccount from './home/MyAccount';
import Group from './home/Group';
import List from './home/List';
import Chat from './home/Chat';
import CreateGroup from './home/CreateGroup';
import GroupChat from './home/GroupChat';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Auth"
        screenOptions={{
          headerStyle: { backgroundColor: '#25D366' },
          headerTintColor: 'white',
          headerTitleStyle: { fontSize: 20, fontWeight: 'bold' },
        }}
      >

        {/* AUTH */}
        <Stack.Screen 
          name="Auth" 
          component={Auth}
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="Register" 
          component={Register}
          options={{ headerShown: false }} 
        />

        {/* HOME */}
        <Stack.Screen 
          name="Home" 
          component={Home}
          options={{ headerShown: false }} 
        />

        {/* SUB SCREENS */}
        <Stack.Screen 
          name="MyAccount" 
          component={MyAccount}
          options={{ title: "My Account" }} 
        />

        <Stack.Screen 
          name="Group" 
          component={Group}
          options={{ title: "Group" }} 
        />

        <Stack.Screen 
          name="List" 
          component={List}
          options={{ title: "Contacts" }} 
        />

        {/* CHAT */}
        <Stack.Screen 
          name="Chat" 
          component={Chat}
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="GroupChat" 
          component={GroupChat}
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="CreateGroup" 
          component={CreateGroup}
          options={{ headerShown: false }} 
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
