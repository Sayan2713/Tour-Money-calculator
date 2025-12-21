import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Navbar = ({ navigation, title = 'TripSplit' }) => {
  return (
    <View style={styles.container}>
      {/* LEFT: Profile / Drawer button */}
      <TouchableOpacity
        style={styles.left}
        onPress={() => navigation.openDrawer()}
      >
        <Ionicons name="person-circle-outline" size={34} color="#0288d1" />
      </TouchableOpacity>

      {/* CENTER: App Title */}
      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* RIGHT: Placeholder (for balance) */}
      <View style={styles.right} />
    </View>
  );
};

export default Navbar;

/* ----------------------- */
/* Styles */
/* ----------------------- */
const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 10,
  },
  left: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  right: {
    width: 50,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#01579b',
  },
});
