// Lightweight global toast/snackbar, replacing jarring native alert() calls
// (geolocation failures, image load errors). Shared singleton state; rendered
// once by <AppToast> (mounted in app.vue).
import { ref } from "vue";

export interface ToastItem {
  id: number;
  message: string;
  type: "info" | "error";
}

const toasts = ref<ToastItem[]>([]);
let seq = 0;

export function useToast() {
  const dismiss = (id: number) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };
  const show = (
    message: string,
    type: ToastItem["type"] = "info",
    timeout = 4000
  ) => {
    const id = ++seq;
    toasts.value.push({ id, message, type });
    if (timeout > 0) setTimeout(() => dismiss(id), timeout);
    return id;
  };
  return { toasts, show, dismiss };
}
