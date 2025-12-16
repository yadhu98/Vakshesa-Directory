import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import AppHeader from '../components/AppHeader';

interface EditForm {
  firstName: string;
  lastName: string;
  phone: string;
  profession: string;
  address: string;
}

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');
  
  const [form, setForm] = useState<EditForm>({
    firstName: '',
    lastName: '',
    phone: '',
    profession: '',
    address: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
      
      if (!currentUser?._id) {
        Alert.alert('Error', 'User not found');
        navigation.goBack();
        return;
      }

      setUserId(currentUser._id);

      // Load user profile
      const profileRes = await api.get(`/users/${currentUser._id}`);
      const userData = profileRes.data.user;

      setForm({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        profession: userData.profession || '',
        address: userData.address || '',
      });
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!form.firstName.trim() || !form.lastName.trim()) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }

    if (form.phone && form.phone.length < 10) {
      Alert.alert('Error', 'Phone number must be at least 10 digits');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        profession: form.profession.trim(),
        address: form.address.trim(),
      };

      await api.put('/auth/profile', updateData);

      // Update local storage
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const updatedUser = { ...userData, ...updateData };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      }

      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Edit Profile" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Edit Profile" showBackButton />
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={form.firstName}
            onChangeText={(text) => setForm({ ...form, firstName: text })}
            placeholder="Enter first name"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            value={form.lastName}
            onChangeText={(text) => setForm({ ...form, lastName: text })}
            placeholder="Enter last name"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={form.phone}
            onChangeText={(text) => setForm({ ...form, phone: text })}
            placeholder="Enter phone number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Profession</Text>
          <TextInput
            style={styles.input}
            value={form.profession}
            onChangeText={(text) => setForm({ ...form, profession: text })}
            placeholder="Enter profession"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.address}
            onChangeText={(text) => setForm({ ...form, address: text })}
            placeholder="Enter address"
            placeholderTextColor="#9CA3AF"
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.changePasswordButton}
          onPress={() => navigation.navigate('ChangePassword' as never)}
        >
          <Feather name="lock" size={18} color="#000" />
          <Text style={styles.changePasswordText}>Change Password</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  saveButton: {
    backgroundColor: '#000000',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  changePasswordButton: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  changePasswordText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileScreen;
