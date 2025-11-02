import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Auth from './auth';
import Register from './register';
import Home from './home/Home';
import MyAccount from './home/MyAccount';
import Group from './home/Group';
import List from './home/List';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Auth">
        {/* Login Screen */}
        <Stack.Screen 
          name="Auth" 
          component={Auth} 
          options={{ headerShown: false }} 
        />

        {/* Register Screen */}
        <Stack.Screen 
          name="Register" 
          component={Register} 
          options={{ headerShown: false }} 
        />

        {/* Home Screen */}
       <Stack.Screen
  name="Home"
  component={Home}
  options={{ headerShown: false }} 
/>
        {/* Home Subscreens */}
        <Stack.Screen 
          name="MyAccount" 
          component={MyAccount} 
          options={{ title: 'My Account' }} 
        />
        <Stack.Screen 
          name="Group" 
          component={Group} 
          options={{ title: 'Group' }} 
        />
        <Stack.Screen 
          name="List" 
          component={List} 
          options={{ title: 'List' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
