"use client";
import { useEffect, useRef } from "react";

const MESSAGE = "저장되지 않은 변경사항이 있습니다. 페이지를 이탈하시겠습니까?";

export function useUnsavedGuard(isDirty: boolean) {
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      e.returnValue = MESSAGE;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    const intercept = (
      original: typeof history.pushState,
      ...args: Parameters<typeof history.pushState>
    ) => {
      if (isDirtyRef.current) {
        const ok = window.confirm(MESSAGE);
        if (!ok) return;
      }
      original(...args);
    };

    history.pushState = (...args) => intercept(originalPushState, ...args);
    history.replaceState = (...args) => intercept(originalReplaceState, ...args);

    const handlePopState = () => {
      if (!isDirtyRef.current) return;
      const ok = window.confirm(MESSAGE);
      if (!ok) {
        history.go(1);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);
}
