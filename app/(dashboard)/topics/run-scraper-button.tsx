"use client";

import { useState } from "react";

export default function RunScraperButton() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function handleClick() {
    setState("loading");
    setErrorMsg("");
    try {
      const resp = await fetch("/api/run-scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 7 }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setErrorMsg(data.error ?? `HTTP ${resp.status}`);
        throw new Error(data.error);
      }
      setState("done");
      setTimeout(() => setState("idle"), 4000);
    } catch {
      setState("error");
      setTimeout(() => { setState("idle"); setErrorMsg(""); }, 8000);
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
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={state === "loading" || state === "done"}
        className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${styles[state]}`}
      >
        {labels[state]}
      </button>
      {errorMsg && (
        <p className="text-xs text-red-600 max-w-xs text-right">{errorMsg}</p>
      )}
    </div>
  );
}
