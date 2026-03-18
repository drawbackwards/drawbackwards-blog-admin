"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RunScraperButton() {
  const [state, setState] = useState<"idle" | "starting" | "running" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  async function pollUntilDone(triggeredRunId?: number) {
    const deadline = Date.now() + 5 * 60 * 1000; // 5 min max

    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const resp = await fetch("/api/scraper-status");
        const data = await resp.json();

        // Wait until we're seeing the run we just triggered (or any newer one)
        if (triggeredRunId && data.runId < triggeredRunId) continue;

        if (data.status === "completed") {
          if (data.conclusion === "success") {
            setState("done");
            router.refresh();
            setTimeout(() => setState("idle"), 3000);
          } else {
            setState("error");
            setErrorMsg("Scraper finished with errors — check GitHub Actions.");
            setTimeout(() => { setState("idle"); setErrorMsg(""); }, 8000);
          }
          return;
        }
      } catch {
        // network blip — keep polling
      }
    }

    // Timed out — just refresh anyway
    setState("done");
    router.refresh();
    setTimeout(() => setState("idle"), 3000);
  }

  async function handleClick() {
    setState("starting");
    setErrorMsg("");
    try {
      // Get current latest run ID before triggering so we can track the new one
      const before = await fetch("/api/scraper-status").then((r) => r.json()).catch(() => ({}));

      const resp = await fetch("/api/run-scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 5 }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setErrorMsg(data.error ?? `HTTP ${resp.status}`);
        setState("error");
        setTimeout(() => { setState("idle"); setErrorMsg(""); }, 8000);
        return;
      }

      setState("running");
      pollUntilDone(before.runId);
    } catch {
      setState("error");
      setErrorMsg("Could not reach server.");
      setTimeout(() => { setState("idle"); setErrorMsg(""); }, 8000);
    }
  }

  const labels = {
    idle: "Run scraper",
    starting: "Starting…",
    running: "Scraping…",
    done: "Done ✓",
    error: "Failed — retry?",
  };

  const styles = {
    idle: "bg-gray-900 text-white hover:bg-gray-700",
    starting: "bg-gray-400 text-white cursor-not-allowed",
    running: "bg-blue-600 text-white cursor-not-allowed",
    done: "bg-green-600 text-white cursor-default",
    error: "bg-red-600 text-white hover:bg-red-500",
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={state === "starting" || state === "running" || state === "done"}
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
