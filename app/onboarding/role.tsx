import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';

export default function RoleSelection() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'user' | 'community_owner' | null>(null);

  const selectRole = async (role: 'user' | 'community_owner') => {
    if (!user) return;

    setLoading(true);

    try {
      await user.update({
        unsafeMetadata: { role },
      });

      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', user.id);

      if (error) {
        Alert.alert('Error', 'Failed to update role in database');
        console.error(error);
        return;
      }

      if (role === 'user') {
        router.replace('/user/home');
      } else if (role === 'community_owner') {
        router.replace('/onboarding/community');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Something went wrong, please try again.');
    } finally {
      setLoading(false);
    }
  };

  const RoleCard = ({ 
    role, 
    title, 
    description, 
    icon 
  }: { 
    role: 'user' | 'community_owner'; 
    title: string; 
    description: string;
    icon: string;
  }) => {
    const isSelected = selectedRole === role;
    
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedRole(role);
          selectRole(role);
        }}
        disabled={loading}
        style={{
          backgroundColor: colors.surface,
          padding: spacing.xl,
          borderRadius: borderRadius.lg,
          marginBottom: spacing.lg,
          borderWidth: 2,
          borderColor: isSelected ? colors.primary : colors.border,
          opacity: loading && selectedRole !== role ? 0.5 : 1,
        }}
        activeOpacity={0.7}
      >
        {/* Icon */}
        <View style={{
          width: 56,
          height: 56,
          borderRadius: borderRadius.md,
          backgroundColor: isSelected ? colors.primary + '15' : colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: spacing.md,
        }}>
          <Text style={{ fontSize: 28 }}>{icon}</Text>
        </View>

        {/* Title */}
        <Text style={{
          fontSize: fontSize.lg,
          fontWeight: '700',
          color: colors.text,
          marginBottom: spacing.xs,
        }}>
          {title}
        </Text>

        {/* Description */}
        <Text style={{
          fontSize: fontSize.md,
          color: colors.textSecondary,
          lineHeight: 22,
        }}>
          {description}
        </Text>

        {/* Loading indicator */}
        {loading && isSelected && (
          <View style={{ 
            marginTop: spacing.md,
            paddingTop: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}>
            <Text style={{ 
              fontSize: fontSize.sm, 
              color: colors.primary,
              fontWeight: '600',
            }}>
              Setting up your account...
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View style={{ flex: 1, padding: spacing.xl, justifyContent: 'center' }}>
        {/* Header */}
        <View style={{ marginBottom: spacing.xxl * 2 }}>
          <Text style={{
            fontSize: fontSize.xxl + 8,
            fontWeight: '800',
            color: colors.text,
            marginBottom: spacing.xs,
          }}>
            Choose Your Path
          </Text>
          <Text style={{
            fontSize: fontSize.md,
            color: colors.textSecondary,
            lineHeight: 22,
          }}>
            Select how you want to use the platform. You can not change this later in settings.
          </Text>
        </View>

        {/* Role Cards */}
        <View>
          <RoleCard
            role="user"
            title="Trader"
            description="Follow trading communities, receive signals, and subscribe to premium content from top performers."
            icon="📊"
          />

          <RoleCard
            role="community_owner"
            title="Community Owner"
            description="Create your own trading community, share signals, build your reputation, and earn from subscriptions."
            icon="👥"
          />
        </View>

        {/* Footer note */}
        <Text style={{
          fontSize: fontSize.xs,
          color: colors.danger,
          textAlign: 'center',
          marginTop: spacing.xl,
        }}>
          You can not switch between roles anytime
        </Text>
      </View>
    </ScrollView>
  );
}