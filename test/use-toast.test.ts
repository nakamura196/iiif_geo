import { describe, it, expect, beforeEach, vi } from "vitest";
import { useToast } from "~/composables/useToast";

describe("useToast", () => {
  beforeEach(() => {
    // Clear any toasts left by a previous test (shared singleton state).
    const { toasts, dismiss } = useToast();
    [...toasts.value].forEach((t) => dismiss(t.id));
  });

  it("show() adds a toast with message and type", () => {
    const { toasts, show } = useToast();
    show("hello", "error", 0);
    expect(toasts.value).toHaveLength(1);
    expect(toasts.value[0]).toMatchObject({ message: "hello", type: "error" });
  });

  it("defaults to type 'info'", () => {
    const { toasts, show } = useToast();
    show("hi", undefined, 0);
    expect(toasts.value[0].type).toBe("info");
  });

  it("auto-dismisses after the timeout", () => {
    vi.useFakeTimers();
    const { toasts, show } = useToast();
    show("bye", "info", 1000);
    expect(toasts.value).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    expect(toasts.value).toHaveLength(0);
    vi.useRealTimers();
  });

  it("dismiss() removes a specific toast by id", () => {
    const { toasts, show, dismiss } = useToast();
    const id = show("a", "info", 0);
    show("b", "info", 0);
    dismiss(id);
    expect(toasts.value.map((t) => t.message)).toEqual(["b"]);
  });
});
