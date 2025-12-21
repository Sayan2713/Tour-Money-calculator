import React from 'react';
import { View, Text } from 'react-native';
import Navbar from '../../components/Navbar';

export default function AboutScreen({ navigation }) {
  return (
    <>
      <Navbar navigation={navigation} title="About" />
      <View style={{ padding: 20 }}>
        <Text>
          TripSplit helps you manage shared trip expenses easily.
        </Text>
      </View>
    </>
  );
}
