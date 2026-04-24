import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import HomeScreen from './src/screens/HomeScreen'
import PlanScreen from './src/screens/PlanScreen'
import RouteScreen from './src/screens/RouteScreen'
import MyRoutesScreen from './src/screens/MyRoutesScreen'
import DiscoverScreen from './src/screens/DiscoverScreen'

const Stack = createNativeStackNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Plan" component={PlanScreen} />
        <Stack.Screen name="Route" component={RouteScreen} />
        <Stack.Screen name="MyRoutes" component={MyRoutesScreen} />
        <Stack.Screen name="Discover" component={DiscoverScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
