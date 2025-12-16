import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import api, { login as loginService, register as registerService } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { Button, Input, Logo, Card, colors, typography, spacing, borderRadius, shadows } from '../../../shared/components';

interface Family {
  _id: string;
  name: string;
}

const AuthScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [families, setFamilies] = useState<Family[]>([]);
  
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register fields
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    profession: '',
    familyId: '',
    role: 'user',
  });

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
      await loginService(email, password);
      // Navigation handled by RootNavigator based on stored user data
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const { name, email, password, confirmPassword, phone, familyId } = registerData;

    if (!name || !email || !password || !familyId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await registerService({
        name,
        email,
        password,
        phone,
        profession: registerData.profession || '',
        familyId,
        role: 'user',
      });
      Alert.alert('Success', 'Registration successful! Please log in.');
      setIsLogin(true);
      // Clear form
      setRegisterData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        profession: '',
        familyId: '',
        role: 'user',
      });
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Logo size="xl" showSubtitle={true} style={styles.logoWrapper} />
        <Text style={styles.subtitle}>Family Event Management</Text>
      </View>

      <Card variant="elevated" style={styles.authCard}>
        <View style={styles.tabContainer}>
          <Button
            title="Login"
            onPress={() => setIsLogin(true)}
            variant={isLogin ? 'primary' : 'ghost'}
            size="md"
            fullWidth
            style={styles.tabButton}
          />
          <Button
            title="Register"
            onPress={() => setIsLogin(false)}
            variant={!isLogin ? 'primary' : 'ghost'}
            size="md"
            fullWidth
            style={styles.tabButton}
          />
        </View>

        {isLogin ? (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                icon="✉️"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                icon="🔒"
              />
            </View>

            <Button
              title="Login"
              onPress={handleLogin}
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={loading}
              icon="🎪"
              style={styles.submitButton}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <Input
                value={registerData.name}
                onChangeText={(text) => setRegisterData({ ...registerData, name: text })}
                placeholder="John Doe"
                icon="👤"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <Input
                value={registerData.email}
                onChangeText={(text) => setRegisterData({ ...registerData, email: text })}
                placeholder="your.email@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                icon="✉️"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <Input
                value={registerData.phone}
                onChangeText={(text) => setRegisterData({ ...registerData, phone: text })}
                placeholder="+1234567890"
                keyboardType="phone-pad"
                icon="📱"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Profession</Text>
              <Input
                value={registerData.profession}
                onChangeText={(text) => setRegisterData({ ...registerData, profession: text })}
                placeholder="Engineer, Doctor, Student, etc."
                icon="👔"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Family *</Text>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerIcon}>👨‍👩‍👧‍👦</Text>
                <Picker
                  selectedValue={registerData.familyId}
                  onValueChange={(value: string) => setRegisterData({ ...registerData, familyId: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="-- Select Family --" value="" />
                  {families.map((family) => (
                    <Picker.Item key={family._id} label={family.name} value={family._id} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <Input
                value={registerData.password}
                onChangeText={(text) => setRegisterData({ ...registerData, password: text })}
                placeholder="At least 6 characters"
                secureTextEntry
                icon="🔒"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password *</Text>
              <Input
                value={registerData.confirmPassword}
                onChangeText={(text) => setRegisterData({ ...registerData, confirmPassword: text })}
                placeholder="Re-enter password"
                secureTextEntry
                icon="🔑"
              />
            </View>

            <Button
              title="Create Account"
              onPress={handleRegister}
              variant="carnival"
              size="lg"
              fullWidth
              loading={loading}
              disabled={loading}
              icon="🎉"
              style={styles.submitButton}
            />
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing[5],
    backgroundColor: colors.background.secondary,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing[10],
    marginBottom: spacing[8],
  },
  logoWrapper: {
    marginBottom: spacing[3],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  authCard: {
    marginBottom: spacing[5],
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: spacing[6],
    gap: spacing[2],
  },
  tabButton: {
    flex: 1,
  },
  form: {
    gap: spacing[4],
  },
  inputGroup: {
    gap: spacing[2],
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: borderRadius.base,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing[3],
  },
  pickerIcon: {
    fontSize: typography.fontSize.lg,
    marginRight: spacing[2],
  },
  picker: {
    flex: 1,
    height: 50,
  },
  submitButton: {
    marginTop: spacing[4],
  },
}); backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AuthScreen;
