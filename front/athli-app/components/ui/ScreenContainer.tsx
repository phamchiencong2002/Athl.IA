// components/ui/ScreenContainer.tsx
import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';

interface Props {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export default function ScreenContainer({ children, style }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.inner, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.appBg,
  },
  inner: {
    flex: 1,
    padding: spacing.md,
  },
});
