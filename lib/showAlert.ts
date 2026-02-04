import { notifyWebAlert, type AlertButton } from "@/lib/web/webAlert";
import { Alert, Platform } from "react-native";

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
) {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons);
    return;
  }

  if (notifyWebAlert({ title, message, buttons })) {
    return;
  }

  const fullMessage = `${title}${message ? `\n\n${message}` : ""}`;

  if (buttons && buttons.length >= 2) {
    const cancel = buttons.find((button) => button.style === "cancel");
    const primary = buttons.find((button) => button !== cancel);

    if (typeof globalThis.confirm === "function" && primary) {
      const accepted = globalThis.confirm(fullMessage);
      if (accepted) {
        primary.onPress?.();
      } else {
        cancel?.onPress?.();
      }
      return;
    }
  }

  if (typeof globalThis.alert === "function") {
    globalThis.alert(fullMessage);
    return;
  }

  console.warn(title, message);
}
