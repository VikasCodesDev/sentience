"use client";

import { useState } from "react";

import { SceneWrapper } from "@/components/scene/SceneWrapper";
import OrbCursor from "@/components/scene/OrbCursor";
import CursorTrail from "@/components/scene/CursorTrail";
import ClickRipple from "@/components/scene/ClickRipple";
import MagneticEffect from "@/components/scene/MagneticEffect";

import SentienceHUD from "@/components/ui/SentienceHUD";
import SpaceVignette from "@/components/ui/SpaceVignette";
import NavNodes from "@/components/ui/NavNodes";
import CommandBar from "@/components/ui/CommandBar";
import AITerminal from "@/components/ui/AITerminal";

type Log = {
  type: "system" | "user" | "ai" | "error";
  text: string;
};

export default function Home() {
  const [logs, setLogs] = useState<Log[]>([
    { type: "system", text: "SENTIENCE CORE INITIALIZED" },
    { type: "system", text: "Awaiting command..." },
  ]);

  const [loading, setLoading] = useState(false);

  async function handleCommand(cmd: string) {
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: cmd }),
      });

      const data = await res.json();

      setLogs((prev) => [
        ...prev,
        { type: "ai", text: data.reply || "No response." },
      ]);
    } catch (err) {
      setLogs((prev) => [
        ...prev,
        { type: "error", text: "Connection to AI failed." },
      ]);
    }

    setLoading(false);
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden">

      {/* Cursor FX */}
      <OrbCursor />
      <CursorTrail />
      <MagneticEffect />
      <ClickRipple />

      {/* 3D Scene */}
      <SceneWrapper />

      {/* Overlay UI */}
      <SentienceHUD />
      <SpaceVignette />
      <NavNodes />

      {/* LEFT AI TERMINAL */}
      <div className="pointer-events-none fixed left-6 top-1/2 z-50 -translate-y-1/2">
        <div className="pointer-events-auto">
          <AITerminal logs={logs} loading={loading} />
        </div>
      </div>

      {/* BOTTOM COMMAND BAR */}
      <div className="pointer-events-none fixed bottom-10 left-1/2 z-50 -translate-x-1/2">
        <div className="pointer-events-auto">
          <CommandBar onSubmit={handleCommand} />
        </div>
      </div>

    </main>
  );
}
