import React from 'react';
import { View, Text } from 'react-native';
import Navbar from '../../components/Navbar';

export default function UpgradeScreen({ navigation }) {
  return (
    <>
      <Navbar navigation={navigation} title="Upgrade" />
      <View style={{ padding: 20 }}>
        <Text>Upgrade plans here</Text>
      </View>
    </>
  );
}
