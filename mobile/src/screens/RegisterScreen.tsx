import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { register } from '../services/api';
// import * as WebBrowser from 'expo-web-browser';
// import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';

// WebBrowser.maybeCompleteAuthSession();

// TODO: Install expo-auth-session to enable Google OAuth
// Run: npm install expo-auth-session
const OAUTH_ENABLED = false;

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  gender: 'male',
  house: 'Kadannamanna',
  generation: '1',
  address: '',
  profession: '',
};

export const RegisterScreen: React.FC<{ onRegisterSuccess: () => void; navigation: any }> = ({ onRegisterSuccess, navigation }) => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Google OAuth - Temporarily disabled until expo-auth-session is installed
  // const [request, response, promptAsync] = Google.useAuthRequest({
  //   expoClientId: 'YOUR_EXPO_CLIENT_ID',
  //   iosClientId: 'YOUR_IOS_CLIENT_ID',
  //   androidClientId: 'YOUR_ANDROID_CLIENT_ID',
  //   webClientId: 'YOUR_WEB_CLIENT_ID',
  // });

  // React.useEffect(() => {
  //   if (response?.type === 'success') {
  //     const { authentication } = response;
  //     handleGoogleSignIn(authentication?.accessToken);
  //   }
  // }, [response]);

  const handleGoogleSignIn = async (accessToken: string | undefined) => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      // Fetch user info from Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const userInfo = await userInfoResponse.json();
      
      // Auto-fill form
      setForm({
        ...form,
        email: userInfo.email,
        firstName: userInfo.given_name || '',
        lastName: userInfo.family_name || '',
      });
      
      Alert.alert('Success', 'Google account linked! Please complete your profile.');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const validateForm = () => {
    if (!form.firstName || !form.lastName) {
      setError('First and last name are required');
      return false;
    }
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
      setError('Valid email is required');
      return false;
    }
    if (!form.password || form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!form.phone || form.phone.length < 10) {
      setError('Valid phone number is required');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const registrationData = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        gender: form.gender,
        house: form.house,
        generation: parseInt(form.generation) || 1,
        address: form.address,
        profession: form.profession,
        role: 'user',
      };
      
      const response = await register(registrationData);
      Alert.alert('Success', 'Registration successful!', [
        { text: 'OK', onPress: onRegisterSuccess }
      ]);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Registration failed';
      setError(message);
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join the Vksha Family</Text>
        
        {/* Google OAuth Button - Temporarily disabled */}
        {OAUTH_ENABLED && (
          <>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => {/* promptAsync() */}}
              disabled={loading}
            >
              <Feather name="shield" size={18} color="#333" />
              <Text style={styles.googleButtonText}>Sign up with Google</Text>
            </TouchableOpacity>
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
          </>
        )}

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        
        {/* Personal Information */}
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <TextInput
          style={styles.input}
          placeholder="First Name *"
          value={form.firstName}
          onChangeText={v => handleChange('firstName', v)}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name *"
          value={form.lastName}
          onChangeText={v => handleChange('lastName', v)}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Email *"
          value={form.email}
          onChangeText={v => handleChange('email', v)}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone (with country code) *"
          value={form.phone}
          onChangeText={v => handleChange('phone', v)}
          keyboardType="phone-pad"
          editable={!loading}
        />
        
        {/* Gender Selection */}
        <Text style={styles.label}>Gender *</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={[styles.radioButton, form.gender === 'male' && styles.radioButtonSelected]}
            onPress={() => handleChange('gender', 'male')}
            disabled={loading}
          >
            <Text style={[styles.radioText, form.gender === 'male' && styles.radioTextSelected]}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.radioButton, form.gender === 'female' && styles.radioButtonSelected]}
            onPress={() => handleChange('gender', 'female')}
            disabled={loading}
          >
            <Text style={[styles.radioText, form.gender === 'female' && styles.radioTextSelected]}>Female</Text>
          </TouchableOpacity>
        </View>
        
        {/* House Selection */}
        <Text style={styles.label}>House *</Text>
        <View style={styles.houseGrid}>
          {['Kadannamanna', 'Mankada', 'Ayiranazhi', 'Aripra'].map(house => (
            <TouchableOpacity
              key={house}
              style={[styles.houseButton, form.house === house && styles.houseButtonSelected]}
              onPress={() => handleChange('house', house)}
              disabled={loading}
            >
              <Text style={[styles.houseText, form.house === house && styles.houseTextSelected]}>{house}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Generation (e.g., 1, 2, 3)"
          value={form.generation}
          onChangeText={v => handleChange('generation', v)}
          keyboardType="numeric"
          editable={!loading}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Address"
          value={form.address}
          onChangeText={v => handleChange('address', v)}
          multiline
          numberOfLines={3}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Profession"
          value={form.profession}
          onChangeText={v => handleChange('profession', v)}
          editable={!loading}
        />
        
        {/* Security */}
        <Text style={styles.sectionTitle}>Security</Text>
        <TextInput
          style={styles.input}
          placeholder="Password (min 8 characters) *"
          value={form.password}
          onChangeText={v => handleChange('password', v)}
          secureTextEntry
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password *"
          value={form.confirmPassword}
          onChangeText={v => handleChange('confirmPassword', v)}
          secureTextEntry
          editable={!loading}
        />
        
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
        >
          <Text style={styles.linkText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666666',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#F5F5F5',
  },
  button: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666666',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 20,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 8,
    marginTop: 8,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  radioButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  radioButtonSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  radioText: {
    fontSize: 14,
    color: '#666666',
  },
  radioTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  houseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  houseButton: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  houseButtonSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  houseText: {
    fontSize: 13,
    color: '#666666',
  },
  houseTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FEE',
    borderWidth: 1,
    borderColor: '#FCC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#C00',
    fontSize: 14,
  },
});

export default RegisterScreen;
