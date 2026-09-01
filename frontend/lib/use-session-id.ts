"use client";

import { useEffect, useState } from "react";

const KEY = "san_session_id";

/** A stable per-tab id for analytics dedupe — not a security token. */
export function useSessionId(): string {
  const [id, setId] = useState("");

  useEffect(() => {
    try {
      let existing = sessionStorage.getItem(KEY);
      if (!existing) {
        existing = crypto.randomUUID();
        sessionStorage.setItem(KEY, existing);
      }
      setId(existing);
    } catch {
      setId(crypto.randomUUID());
    }
  }, []);

  return id;
}
