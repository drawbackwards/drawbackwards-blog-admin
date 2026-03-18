"use client";

import { useState } from "react";

export default function RunScraperButton() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );

  async function handleClick() {
    setState("loading");
    try {
      const resp = await fetch("/api/run-scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 7 }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      setState("done");
      // Reset after 4 s so the button is usable again
      setTimeout(() => setState("idle"), 4000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  const labels = {
    idle: "Run scraper",
    loading: "Starting…",
    done: "Queued ✓",
    error: "Failed — retry?",
  };

  const styles = {
    idle: "bg-gray-900 text-white hover:bg-gray-700",
    loading: "bg-gray-400 text-white cursor-not-allowed",
    done: "bg-green-600 text-white cursor-default",
    error: "bg-red-600 text-white hover:bg-red-500",
  };

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading" || state === "done"}
      className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${styles[state]}`}
    >
      {labels[state]}
    </button>
  );
}
