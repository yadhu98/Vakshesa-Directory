import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import api, { login as loginService } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Family {
  _id: string;
  name: string;
}

// Shared theme colors
const colors = {
  primary: '#000000',
  white: '#FFFFFF',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
  },
  purple: '#F3E8FF',
};

const AuthScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [families, setFamilies] = useState<Family[]>([]);
  
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // ...existing code...

  useEffect(() => {
    loadFamilies();
  }, []);

  const loadFamilies = async () => {
    try {
      const res = await api.get('/bulk/families');
      setFamilies(res.data || []);
    } catch (error) {
      console.error('Failed to load families:', error);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await loginService(email, password);
      console.log('Login successful, response:', response);
      
      // Verify data was saved
      const savedToken = await AsyncStorage.getItem('authToken');
      const savedUser = await AsyncStorage.getItem('userData');
      console.log('Saved token:', savedToken);
      console.log('Saved user:', savedUser);
      
      // Navigation will happen automatically via RootNavigator
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Registration logic removed. Use RegisterScreen for registration.

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with Logo */}
          <View style={styles.header}>
            <Text style={styles.title}>Vakshesa Family Directory</Text>
            
            {/* Logo Container */}
            <View style={styles.logoContainer}>
              <Text style={styles.logoPlaceholder}>LOGO</Text>
            </View>
            
            <Text style={styles.subtitle}>
              {'Welcome back'}
            </Text>
            <Text style={styles.description}>
              {'Enter your email to sign in to your account'}
            </Text>
          </View>

        {/* Form Section */}
        <View style={styles.form}>
          {/* Login Form Only */}
          <TextInput
            style={styles.input}
            placeholder="email@domain.com"
            placeholderTextColor={colors.gray[400]}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.gray[400]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Continue</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Social Login Buttons */}
          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.socialButtonText}>🔍 Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.socialButton, styles.appleButton]}>
            <Text style={styles.socialButtonText}>🍎 Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register' as never)}>
            <Text style={styles.switchText}>
              Don't have an account? <Text style={styles.switchLink}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Terms and Privacy */}
        <Text style={styles.termsText}>
          By clicking continue, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 8,
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  logoContainer: {
    width: 150,
    height: 150,
    backgroundColor: colors.purple,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
  },
  logoPlaceholder: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray[500],
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 21,
  },
  form: {
    marginTop: 24,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.primary,
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    backgroundColor: colors.white,
    marginBottom: 12,
  },
  picker: {
    height: 50,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[200],
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: colors.gray[500],
  },
  socialButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  appleButton: {
    backgroundColor: colors.gray[50],
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
  },
  switchText: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: 20,
  },
  switchLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 24,
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});

export default AuthScreen;
