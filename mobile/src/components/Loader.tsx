import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
}

export const Loader: React.FC<LoaderProps> = ({ size = 'large', color = '#000000' }) => {
  return <ActivityIndicator size={size} color={color} />;
};

export const PageLoader: React.FC = () => {
  return (
    <View style={styles.pageLoader}>
      <ActivityIndicator size="large" color="#000000" />
    </View>
  );
};

export const ButtonLoader: React.FC<{ color?: string }> = ({ color = '#FFFFFF' }) => {
  return <ActivityIndicator size="small" color={color} />;
};

const styles = StyleSheet.create({
  pageLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
});
