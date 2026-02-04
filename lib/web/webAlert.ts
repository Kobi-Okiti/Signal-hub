export type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
};

export type WebAlertPayload = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
};

type WebAlertListener = (payload: WebAlertPayload) => void;

const listeners = new Set<WebAlertListener>();

export function subscribeToWebAlerts(listener: WebAlertListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyWebAlert(payload: WebAlertPayload) {
  if (listeners.size === 0) return false;

  listeners.forEach((listener) => listener(payload));
  return true;
}
