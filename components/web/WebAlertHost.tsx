import { borderRadius, colors, fontSize, spacing } from "@/constants/theme";
import {
  subscribeToWebAlerts,
  type AlertButton,
  type WebAlertPayload,
} from "@/lib/web/webAlert";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    zIndex: 1000,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.lg,
  },
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
});

const defaultButton: AlertButton = { text: "OK", style: "default" };

export default function WebAlertHost() {
  const [alert, setAlert] = useState<WebAlertPayload | null>(null);

  useEffect(() => {
    return subscribeToWebAlerts((payload) => setAlert(payload));
  }, []);

  const buttons = useMemo(() => {
    if (!alert) return [];
    const incoming = alert.buttons?.length ? alert.buttons : [defaultButton];
    return incoming;
  }, [alert]);

  const handleDismiss = (button?: AlertButton) => {
    setAlert(null);
    button?.onPress?.();
  };

  const cancelButton = useMemo(
    () => buttons.find((button) => button.style === "cancel"),
    [buttons],
  );

  if (!alert) return null;

  return (
    <Pressable
      style={styles.overlay}
      onPress={() => handleDismiss(cancelButton)}
    >
      <Pressable
        style={styles.card}
        onPress={(event) => event.stopPropagation?.()}
      >
        <Text style={styles.title}>{alert.title}</Text>
        {alert.message ? (
          <Text style={styles.message}>{alert.message}</Text>
        ) : null}

        <View style={styles.actions}>
          {buttons.map((button, index) => {
            const variant = button.style ?? "default";
            const backgroundColor =
              variant === "destructive"
                ? colors.danger
                : variant === "cancel"
                  ? colors.surface
                  : colors.primary;
            const borderColor =
              variant === "cancel" ? colors.border : backgroundColor;
            const textColor =
              variant === "cancel" ? colors.text : colors.surface;

            return (
              <TouchableOpacity
                key={`${button.text ?? "action"}-${index}`}
                onPress={() => handleDismiss(button)}
                style={[
                  styles.button,
                  {
                    backgroundColor,
                    borderColor,
                    marginLeft: index === 0 ? 0 : spacing.sm,
                  },
                ]}
              >
                <Text style={[styles.buttonText, { color: textColor }]}>
                  {button.text ?? "OK"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Pressable>
    </Pressable>
  );
}
