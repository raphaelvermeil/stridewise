// Asks "Leave without saving?" while a form has unsaved changes: on closing/reloading the tab (browser's own prompt)
// and on clicking any in-app link (the App Router has no built-in navigation guard, so link clicks are caught here).
"use client";

import { useEffect } from "react";

export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest("a[href]");
      // Ctrl/Cmd/Shift-click opens a new tab, so this page (and its changes) stays.
      if (!link || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (!confirm("You have unsaved changes. Leave without saving?")) {
        e.preventDefault();
        e.stopPropagation(); // capture phase on document: runs before Next's Link handler, so this stops the navigation
      }
    };
    addEventListener("beforeunload", onUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      removeEventListener("beforeunload", onUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);
}
