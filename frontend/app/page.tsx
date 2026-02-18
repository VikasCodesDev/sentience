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


export default function Home() {
  const [logs, setLogs] = useState<string[]>([
    "SENTIENCE CORE INITIALIZED",
    "Awaiting command...",
  ]);

  function handleCommand(cmd: string) {
    const lower = cmd.toLowerCase();

    let response = "Command acknowledged.";

    if (lower.includes("hello")) response = "Greetings, Operator.";
    else if (lower.includes("status")) response = "All systems operational.";
    else if (lower.includes("help"))
      response = "Available commands: hello, status, help";

    setLogs((prev) => [...prev, `> ${cmd}`, response]);
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
          <AITerminal logs={logs} />
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
