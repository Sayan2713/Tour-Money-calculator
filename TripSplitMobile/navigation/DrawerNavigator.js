import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

import TripListScreen from '../screens/Trips/TripListScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import GraphScreen from '../screens/Graphs/GraphScreen';
import UpgradeScreen from '../screens/Subscription/UpgradeScreen';

import AboutScreen from '../screens/Static/AboutScreen';
import ContactScreen from '../screens/Static/ContactScreen';
import HowToUseScreen from '../screens/Static/HowToUseScreen';
import TermsScreen from '../screens/Static/TermsScreen';
import CopyrightScreen from '../screens/Static/CopyrightScreen';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator screenOptions={{ headerShown: false }}>
      <Drawer.Screen name="Trips" component={TripListScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Graphs" component={GraphScreen} />
      <Drawer.Screen name="Upgrade" component={UpgradeScreen} />
      <Drawer.Screen name="About" component={AboutScreen} />
      <Drawer.Screen name="Contact" component={ContactScreen} />
      <Drawer.Screen name="HowToUse" component={HowToUseScreen} />
      <Drawer.Screen name="Terms" component={TermsScreen} />
      <Drawer.Screen name="Copyright" component={CopyrightScreen} />
    </Drawer.Navigator>
  );
}
