import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize } from './theme';

export const authStyles = StyleSheet.create({
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});