import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize } from './theme';

export const commonStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  
  // Buttons
  buttonPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  buttonOutline: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  buttonDanger: {
    backgroundColor: colors.danger,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  buttonTextOutline: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  
  // Text
  heading: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  subheading: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  body: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
  caption: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  
  // Inputs
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.md,
    color: colors.text,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  
  // Badges
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  badgePrimary: {
    backgroundColor: colors.primary + '20', // 20% opacity
  },
  badgeSuccess: {
    backgroundColor: colors.success + '20',
  },
  badgeDanger: {
    backgroundColor: colors.danger + '20',
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  
  // Stats
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  
  // Dividers
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
});