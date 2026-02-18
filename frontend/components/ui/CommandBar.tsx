"use client";

import { useState } from "react";

type Props = {
  onSubmit: (cmd: string) => void;
};

export default function CommandBar({ onSubmit }: Props) {
  const [value, setValue] = useState("");

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && value.trim()) {
      onSubmit(value.trim());
      setValue("");
    }
  }

  return (
    <div className="w-[680px] max-w-[90vw]">
      <div
        className="
          bg-black/50
          backdrop-blur-2xl
          border border-cyan-400/30
          rounded-2xl
          px-6 py-4
          shadow-[0_0_40px_rgba(0,255,255,0.18)]
        "
      >
        <p className="text-[11px] tracking-widest opacity-70 text-cyan-300 mb-1">
          SENTIENCE INTERFACE
        </p>

        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask Sentience..."
          className="
            w-full
            bg-transparent
            outline-none
            text-lg
            text-cyan-200
            placeholder:text-cyan-400/50
          "
        />

        <div className="text-right text-xs opacity-60 text-cyan-300 mt-1">
          Press Enter to Execute
        </div>
      </div>
    </div>
  );
}
