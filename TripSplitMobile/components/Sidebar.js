import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

const Sidebar = ({ navigation, onLogout }) => {
  const go = (screen) => {
    navigation.closeDrawer();
    navigation.navigate(screen);
  };

  return (
    <DrawerContentScrollView contentContainerStyle={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={70} color="#0288d1" />
        <Text style={styles.appName}>TripSplit</Text>
      </View>

      {/* MAIN LINKS */}
      <ScrollView style={styles.menu}>
        <MenuItem icon="person-outline" label="Your Profile" onPress={() => go('Profile')} />
        <MenuItem icon="stats-chart-outline" label="Graphs" onPress={() => go('Graphs')} />
        <MenuItem icon="diamond-outline" label="Upgrade Plan" onPress={() => go('Subscription')} />
        <MenuItem icon="information-circle-outline" label="About" onPress={() => go('About')} />
        <MenuItem icon="call-outline" label="Contact" onPress={() => go('Contact')} />
        <MenuItem icon="help-circle-outline" label="How to Use" onPress={() => go('HowToUse')} />
        <MenuItem icon="document-text-outline" label="Terms & Conditions" onPress={() => go('Terms')} />
        <MenuItem icon="copyright-outline" label="Copyright" onPress={() => go('Copyright')} />
      </ScrollView>

      {/* FOOTER ACTIONS */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerBtn}
          onPress={() => go('ChangePassword')}
        >
          <Ionicons name="key-outline" size={20} color="#333" />
          <Text style={styles.footerText}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerBtn, { borderTopWidth: 1 }]}
          onPress={() =>
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel' },
              { text: 'Logout', style: 'destructive', onPress: onLogout },
            ])
          }
        >
          <Ionicons name="log-out-outline" size={20} color="#d32f2f" />
          <Text style={[styles.footerText, { color: '#d32f2f' }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

export default Sidebar;

/* ----------------------- */
/* Reusable Menu Item */
/* ----------------------- */
const MenuItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>
    <Ionicons name={icon} size={22} color="#444" />
    <Text style={styles.itemText}>{label}</Text>
  </TouchableOpacity>
);

/* ----------------------- */
/* Styles */
/* ----------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 25,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0288d1',
    marginTop: 5,
  },
  menu: {
    paddingVertical: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  itemText: {
    marginLeft: 15,
    fontSize: 15,
    color: '#333',
  },
  footer: {
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderColor: '#e0e0e0',
  },
  footerText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
  },
});
