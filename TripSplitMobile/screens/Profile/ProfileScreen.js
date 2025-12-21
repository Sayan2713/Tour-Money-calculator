import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, refreshUser } = useAuth();

  const [showEdit, setShowEdit] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);

  const [editData, setEditData] = useState({
    name: '',
    mobile: '',
    dob: '',
    gender: '',
  });

  const [passData, setPassData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  /* ---------------------------------- */
  /* Load user into edit form            */
  /* ---------------------------------- */
  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || '',
        mobile: user.mobile || '',
        dob: user.dob ? user.dob.split('T')[0] : '',
        gender: user.gender || '',
      });
    }
  }, [user]);

  /* ---------------------------------- */
  /* Update profile                      */
  /* ---------------------------------- */
  const handleSaveProfile = async () => {
    try {
      await api.put('/users/update', editData);
      await refreshUser();
      setShowEdit(false);
      Alert.alert('Success', 'Profile updated');
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  /* ---------------------------------- */
  /* Change password                     */
  /* ---------------------------------- */
  const handleChangePassword = async () => {
    if (passData.newPassword !== passData.confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match');
    }

    try {
      await api.post('/users/change-password', {
        oldPassword: passData.oldPassword,
        newPassword: passData.newPassword,
      });
      setShowChangePass(false);
      setPassData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      Alert.alert('Success', 'Password updated');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.msg || 'Failed');
    }
  };

  /* ---------------------------------- */
  /* Delete account                      */
  /* ---------------------------------- */
  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'This cannot be undone.', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete('/users/delete');
            logout();
          } catch {
            Alert.alert('Error', 'Failed to delete account');
          }
        },
      },
    ]);
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.container}>
      {/* PROFILE CARD */}
      <View style={styles.card}>
        <View style={styles.avatarBox}>
          {user.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{user.name?.[0] || 'U'}</Text>
            </View>
          )}
        </View>

        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.info}>{user.email}</Text>
        <Text style={styles.info}>Mobile: {user.mobile || '-'}</Text>
        <Text style={styles.info}>
          DOB: {user.dob ? new Date(user.dob).toLocaleDateString() : '-'}
        </Text>
        <Text style={styles.info}>Gender: {user.gender || '-'}</Text>
      </View>

      {/* ACTIONS */}
      <TouchableOpacity style={styles.btn} onPress={() => setShowEdit(true)}>
        <Text style={styles.btnText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: '#ff9800' }]}
        onPress={() => setShowChangePass(true)}
      >
        <Text style={styles.btnText}>Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: '#d32f2f' }]}
        onPress={handleDeleteAccount}
      >
        <Text style={styles.btnText}>Delete Account</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: '#555' }]}
        onPress={logout}
      >
        <Text style={styles.btnText}>Logout</Text>
      </TouchableOpacity>

      {/* EDIT PROFILE MODAL */}
      <Modal visible={showEdit} animationType="slide">
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Edit Profile</Text>

          <TextInput
            style={styles.input}
            placeholder="Name"
            value={editData.name}
            onChangeText={(t) => setEditData({ ...editData, name: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Mobile"
            value={editData.mobile}
            keyboardType="phone-pad"
            onChangeText={(t) => setEditData({ ...editData, mobile: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="DOB (YYYY-MM-DD)"
            value={editData.dob}
            onChangeText={(t) => setEditData({ ...editData, dob: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Gender"
            value={editData.gender}
            onChangeText={(t) => setEditData({ ...editData, gender: t })}
          />

          <TouchableOpacity style={styles.btn} onPress={handleSaveProfile}>
            <Text style={styles.btnText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#ccc' }]}
            onPress={() => setShowEdit(false)}
          >
            <Text style={[styles.btnText, { color: '#000' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* CHANGE PASSWORD MODAL */}
      <Modal visible={showChangePass} animationType="slide">
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Change Password</Text>

          <TextInput
            style={styles.input}
            placeholder="Old Password"
            secureTextEntry
            value={passData.oldPassword}
            onChangeText={(t) => setPassData({ ...passData, oldPassword: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="New Password"
            secureTextEntry
            value={passData.newPassword}
            onChangeText={(t) => setPassData({ ...passData, newPassword: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            secureTextEntry
            value={passData.confirmPassword}
            onChangeText={(t) =>
              setPassData({ ...passData, confirmPassword: t })
            }
          />

          <TouchableOpacity style={styles.btn} onPress={handleChangePassword}>
            <Text style={styles.btnText}>Update</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#ccc' }]}
            onPress={() => setShowChangePass(false)}
          >
            <Text style={[styles.btnText, { color: '#000' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
};

/* ---------------------------------- */
/* Styles                              */
/* ---------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },

  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },

  avatarBox: { marginBottom: 10 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0288d1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: 'bold' },

  name: { fontSize: 20, fontWeight: 'bold' },
  info: { color: '#666', marginTop: 4 },

  btn: {
    backgroundColor: '#0288d1',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnText: { color: '#fff', fontWeight: 'bold' },

  modal: { flex: 1, padding: 20, justifyContent: 'center' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
});

export default ProfileScreen;
