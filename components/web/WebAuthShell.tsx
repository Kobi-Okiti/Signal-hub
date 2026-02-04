import { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { borderRadius, colors, spacing } from "@/constants/theme";

export const webAuthAppearance = {
  variables: {
    colorPrimary: colors.primary,
    colorBackground: colors.surface,
    colorText: colors.text,
    colorTextSecondary: colors.textSecondary,
    colorDanger: colors.danger,
    colorSuccess: colors.success,
    borderRadius: `${borderRadius.md}px`,
  },
  elements: {
    rootBox: {
      width: "100%",
    },
    cardBox: {
      width: "100%",
    },
    card: {
      width: "100%",
      borderRadius: `${borderRadius.lg}px`,
      border: `1px solid ${colors.border}`,
      boxShadow: "0 12px 30px rgba(23, 29, 28, 0.08)",
    },
    headerTitle: {
      fontWeight: "800",
    },
    headerSubtitle: {
      color: colors.textSecondary,
    },
    formFieldLabel: {
      color: colors.text,
    },
    formFieldInput: {
      borderRadius: `${borderRadius.md}px`,
      borderColor: colors.border,
    },
    formButtonPrimary: {
      backgroundColor: colors.primary,
      borderRadius: `${borderRadius.md}px`,
    },
    footerActionLink: {
      color: colors.primary,
    },
  },
} as const;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 420,
  },
});

export default function WebAuthShell({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>{children}</View>
    </ScrollView>
  );
}
