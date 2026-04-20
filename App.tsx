import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import PlanScreen from './src/screens/PlanScreen'
import RouteScreen from './src/screens/RouteScreen'

const Stack = createNativeStackNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Plan" component={PlanScreen} />
        <Stack.Screen name="Route" component={RouteScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
