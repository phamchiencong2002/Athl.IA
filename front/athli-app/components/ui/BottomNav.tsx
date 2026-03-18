import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';

interface BottomNavProps {
  activeTab: 'home' | 'workouts' | 'stats' | 'profile';
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  return (
    <View style={styles.navBar}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => activeTab !== 'home' && router.push('/dashboard')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="grid-view" size={28} color={activeTab === 'home' ? colors.primaryBlue : colors.mutedLight} />
        <Text style={[styles.navText, activeTab === 'home' && { color: colors.primaryBlue }]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => activeTab !== 'workouts' && router.push('/workouts')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="fitness-center" size={28} color={activeTab === 'workouts' ? colors.primaryBlue : colors.mutedLight} />
        <Text style={[styles.navText, activeTab === 'workouts' && { color: colors.primaryBlue }]}>Séances</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => activeTab !== 'stats' && router.push('/stats')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="analytics" size={28} color={activeTab === 'stats' ? colors.primaryBlue : colors.mutedLight} />
        <Text style={[styles.navText, activeTab === 'stats' && { color: colors.primaryBlue }]}>Stats</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push('/profile')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="account-circle" size={28} color={activeTab === 'profile' ? colors.primaryBlue : colors.mutedLight} />
        <Text style={[styles.navText, activeTab === 'profile' && { color: colors.primaryBlue }]}>Profil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 16,
    paddingHorizontal: 32,
  },
  navItem: {
    alignItems: 'center',
    gap: 6,
  },
  navText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: colors.mutedLight,
  },
});
