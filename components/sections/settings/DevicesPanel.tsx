"use client";

import { useState } from "react";

interface Device {
  name: string;
  platform: string;
  connected: boolean;
  lastSeen: string;
  capabilities?: string[];
}

const mockDevices: Device[] = [
  {
    name: "Dennis\u2019s iPhone",
    platform: "iOS",
    connected: true,
    lastSeen: "2 min ago",
    capabilities: ["Camera", "Location", "Notifications"],
  },
  {
    name: "MacBook Pro",
    platform: "macOS",
    connected: true,
    lastSeen: "now",
    capabilities: ["Screen", "Files", "Notifications"],
  },
  {
    name: "Pixel 8",
    platform: "Android",
    connected: false,
    lastSeen: "3 days ago",
  },
];

function generatePairingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function DevicesPanel() {
  const [pairingCode, setPairingCode] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
        Connected Devices
      </p>

      <div className="space-y-3">
        {mockDevices.map((device) => (
          <div
            key={device.name}
            className="flex flex-col gap-1 border-b border-zinc-200 pb-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-zinc-800">{device.name}</span>
                <span className="text-[12px] text-zinc-500">{device.platform}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-zinc-500">
                  {device.connected ? "Connected" : "Disconnected"}
                </span>
                <span className="font-mono text-[11px] text-zinc-600">
                  {device.lastSeen}
                </span>
              </div>
            </div>
            {device.capabilities && device.capabilities.length > 0 && (
              <div className="flex gap-2 pt-0.5">
                {device.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="text-[10px] text-zinc-700"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setPairingCode(generatePairingCode())}
          className="text-[12px] text-zinc-500 transition-colors duration-150 hover:text-zinc-800"
        >
          + Pair Device
        </button>
        {pairingCode && (
          <span className="font-mono text-xl text-zinc-900">{pairingCode}</span>
        )}
      </div>
    </div>
  );
}

export { DevicesPanel };
