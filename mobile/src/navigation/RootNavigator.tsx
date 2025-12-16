import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';

// Screens
import AuthScreen from '../screens/AuthScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DirectoryScreen from '../screens/DirectoryScreen';
import FamilyTreeScreen from '../screens/FamilyTreeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import CarnivalEventScreen from '../screens/CarnivalEventScreen';
import MyStallsScreen from '../screens/MyStallsScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { ShopkeeperScreen } from '../screens/ShopkeeperScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab Bar Icons
const BookIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const PeopleIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const UserIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CarnivalIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L2 22h20L12 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 6v8M9 14h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

// Carnival Stack Navigator
const CarnivalStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CarnivalHome" component={CarnivalEventScreen} />
      <Stack.Screen name="MyStalls" component={MyStallsScreen} />
    </Stack.Navigator>
  );
};

// Main Tab Navigator
const MainTabs: React.FC<{ userRole: string }> = ({ userRole }) => {
  if (userRole === 'shopkeeper') {
    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#000000',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            paddingTop: 8,
            paddingBottom: 8,
            height: 60,
          },
        }}
      >
        <Tab.Screen
          name="Shopkeeper"
          component={ShopkeeperScreen}
          options={{
            tabBarLabel: 'Scanner',
            tabBarIcon: ({ color }: any) => <BookIcon color={color} />,
          }}
        />
        <Tab.Screen
          name="Leaderboard"
          component={LeaderboardScreen}
          options={{
            tabBarLabel: 'Leaderboard',
            tabBarIcon: ({ color }: any) => <PeopleIcon color={color} />,
          }}
        />
      </Tab.Navigator>
    );
  }

  // Regular user tabs
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name="Directory"
        component={DirectoryScreen}
        options={{
          tabBarLabel: 'Directory',
          tabBarIcon: ({ color }: any) => <BookIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Carnival"
        component={CarnivalStack}
        options={{
          tabBarLabel: 'Carnival',
          tabBarIcon: ({ color }: any) => <CarnivalIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="FamilyTree"
        component={FamilyTreeScreen}
        options={{
          tabBarLabel: 'Family',
          tabBarIcon: ({ color }: any) => <PeopleIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }: any) => <UserIcon color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const Navigation: React.FC = () => {
  const [authenticated, setAuthenticated] = React.useState(false);
  const [userRole, setUserRole] = React.useState<string>('user');
  const [loading, setLoading] = React.useState(true);
  const navigationRef = React.useRef<any>(null);

  React.useEffect(() => {
    checkAuth();
    
    // Listen for auth changes
    const interval = setInterval(() => {
      checkAuth();
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userDataStr = await AsyncStorage.getItem('userData');
      
      if (token && userDataStr) {
        setAuthenticated(true);
        const userData = JSON.parse(userDataStr);
        setUserRole(userData.role || 'user');
      } else {
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!authenticated ? (
          <>
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main">
              {() => <MainTabs userRole={userRole} />}
            </Stack.Screen>
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;