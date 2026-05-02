"use client";

import { useMemo, useRef, useState } from "react";
import { imagesForProperty } from "@/lib/property";
import type { PropertyStore } from "@/lib/store";

const RAD2DEG = 180 / Math.PI;

type Props = {
  store: PropertyStore;
  activeRoomId: string;
  onSelectRoom: (id: string) => void;
  onClose: () => void;
};

export function EditorPanel({
  store,
  activeRoomId,
  onSelectRoom,
  onClose,
}: Props) {
  const {
    property,
    updateProperty,
    updateRoom,
    addRoom,
    removeRoom,
    updateHotspot,
    removeHotspot,
    reset,
    exportJSON,
    importJSON,
  } = store;

  const availableImages = useMemo(
    () => imagesForProperty(property.id),
    [property.id],
  );

  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomImage, setNewRoomImage] = useState(
    availableImages[0]?.url ?? "",
  );
  const [showJson, setShowJson] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeRoom =
    property.rooms.find((r) => r.id === activeRoomId) ?? property.rooms[0];

  function handleExport() {
    const json = exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${property.id || "tour"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importJSON(String(reader.result));
      if (!ok) alert("Invalid JSON file");
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <aside className="pointer-events-auto absolute right-0 top-0 z-20 flex h-full w-full max-w-sm flex-col bg-slate-950/95 text-white shadow-2xl backdrop-blur-md ring-1 ring-white/10">
      <header className="flex items-center justify-between border-b border-white/10 p-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-lime-400">
            Editor · {property.id}
          </p>
          <h2 className="text-base font-semibold">Tour Configuration</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
          aria-label="Close editor"
        >
          ✕
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section>
          <label className="block text-xs uppercase tracking-wider text-white/60 mb-1">
            Property name
          </label>
          <input
            type="text"
            value={property.name}
            onChange={(e) => updateProperty({ name: e.target.value })}
            className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-lime-400"
          />
          <label className="block text-xs uppercase tracking-wider text-white/60 mt-3 mb-1">
            Address
          </label>
          <input
            type="text"
            value={property.address}
            onChange={(e) => updateProperty({ address: e.target.value })}
            className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-lime-400"
          />
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-wider text-white/60 mb-2">
            Rooms
          </h3>
          <ul className="space-y-1.5 mb-3">
            {property.rooms.map((r) => (
              <li
                key={r.id}
                className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm transition ${
                  r.id === activeRoom.id
                    ? "border-lime-400 bg-lime-400/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectRoom(r.id)}
                  className="flex-1 text-left truncate"
                  title="Open this room"
                >
                  {r.name}
                </button>
                <button
                  type="button"
                  onClick={() => updateProperty({ startRoomId: r.id })}
                  className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${
                    property.startRoomId === r.id
                      ? "bg-lime-400 text-black"
                      : "bg-white/10 text-white/60 hover:text-white"
                  }`}
                  title="Set as starting room"
                >
                  Start
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      property.rooms.length > 1 &&
                      confirm(`Delete room "${r.name}"?`)
                    ) {
                      removeRoom(r.id);
                      if (r.id === activeRoom.id) {
                        const next = property.rooms.find((x) => x.id !== r.id);
                        if (next) onSelectRoom(next.id);
                      }
                    }
                  }}
                  disabled={property.rooms.length <= 1}
                  className="rounded px-1.5 py-0.5 text-xs text-white/50 hover:text-red-400 disabled:opacity-30"
                  title="Delete room"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <div className="rounded-md border border-dashed border-white/15 p-2.5 space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-white/50">
              Add new room
            </p>
            <input
              type="text"
              placeholder="Room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-sm focus:outline-none focus:border-lime-400"
            />
            <select
              value={newRoomImage}
              onChange={(e) => setNewRoomImage(e.target.value)}
              className="w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-sm focus:outline-none focus:border-lime-400"
            >
              {availableImages.map((img) => (
                <option key={img.url} value={img.url} className="bg-slate-900">
                  {img.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                if (!newRoomName.trim()) return;
                addRoom(newRoomName.trim(), newRoomImage);
                setNewRoomName("");
              }}
              disabled={!newRoomName.trim()}
              className="w-full rounded bg-lime-400 px-2 py-1.5 text-xs font-semibold text-black hover:bg-lime-300 disabled:opacity-40"
            >
              + Add room
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-wider text-white/60 mb-2">
            Editing: {activeRoom.name}
          </h3>
          <label className="block text-[11px] text-white/50 mb-1">Name</label>
          <input
            type="text"
            value={activeRoom.name}
            onChange={(e) =>
              updateRoom(activeRoom.id, { name: e.target.value })
            }
            className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm mb-3 focus:outline-none focus:border-lime-400"
          />

          <label className="block text-[11px] text-white/50 mb-1.5">
            Panorama image
          </label>
          <div className="grid grid-cols-3 gap-2">
            {availableImages.map((img) => {
              const active = activeRoom.panorama === img.url;
              return (
                <button
                  key={img.url}
                  type="button"
                  onClick={() =>
                    updateRoom(activeRoom.id, { panorama: img.url })
                  }
                  className={`group relative overflow-hidden rounded-md border-2 transition ${
                    active
                      ? "border-lime-400"
                      : "border-white/10 hover:border-white/30"
                  }`}
                  title={img.name}
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="aspect-[2/1] w-full object-cover"
                    loading="lazy"
                  />
                  {active && (
                    <span className="absolute inset-0 flex items-center justify-center bg-lime-400/30 text-xs font-bold text-white">
                      ✓
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[9px] text-white">
                    {img.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-wider text-white/60 mb-2">
            Hotspots in {activeRoom.name}
          </h3>
          {activeRoom.hotspots.length === 0 ? (
            <p className="text-xs text-white/50 italic mb-2">
              No hotspots yet. Aim crosshair at floor and tap “Drop hotspot
              here”.
            </p>
          ) : (
            <ul className="space-y-2 mb-2">
              {activeRoom.hotspots.map((h, i) => (
                <li
                  key={i}
                  className="rounded-md border border-white/10 bg-white/5 p-2 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <select
                      value={h.to}
                      onChange={(e) =>
                        updateHotspot(activeRoom.id, i, { to: e.target.value })
                      }
                      className="flex-1 rounded bg-white/5 border border-white/10 px-2 py-1 text-xs focus:outline-none focus:border-lime-400"
                    >
                      {property.rooms
                        .filter((r) => r.id !== activeRoom.id)
                        .map((r) => (
                          <option
                            key={r.id}
                            value={r.id}
                            className="bg-slate-900"
                          >
                            → {r.name}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeHotspot(activeRoom.id, i)}
                      className="rounded px-2 py-1 text-xs text-white/50 hover:text-red-400"
                      title="Delete hotspot"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    value={h.label}
                    onChange={(e) =>
                      updateHotspot(activeRoom.id, i, { label: e.target.value })
                    }
                    placeholder="Label"
                    className="w-full rounded bg-white/5 border border-white/10 px-2 py-1 text-xs focus:outline-none focus:border-lime-400"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/50 w-14 shrink-0">
                      Distance
                    </span>
                    <input
                      type="range"
                      min={1.5}
                      max={9}
                      step={0.1}
                      value={h.distance ?? 4}
                      onChange={(e) =>
                        updateHotspot(activeRoom.id, i, {
                          distance: parseFloat(e.target.value),
                        })
                      }
                      className="flex-1 accent-lime-400"
                    />
                    <span className="text-[10px] text-white/60 font-mono w-10 text-right">
                      {(h.distance ?? 4).toFixed(1)}m
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 font-mono">
                    yaw {(h.yaw * RAD2DEG).toFixed(1)}° · pitch{" "}
                    {(h.pitch * RAD2DEG).toFixed(1)}°
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[10px] text-white/40">
            Tip: aim the crosshair at the floor near the doorway, then drop.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs uppercase tracking-wider text-white/60 mb-2">
            Save / Load
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="flex-1 rounded bg-white/10 px-2 py-1.5 text-xs hover:bg-white/20"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 rounded bg-white/10 px-2 py-1.5 text-xs hover:bg-white/20"
            >
              Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowJson((v) => !v)}
            className="w-full rounded bg-white/5 px-2 py-1.5 text-xs hover:bg-white/10"
          >
            {showJson ? "Hide" : "Show"} JSON preview
          </button>
          {showJson && (
            <pre className="max-h-40 overflow-auto rounded bg-black/40 p-2 text-[10px] text-white/70">
              {exportJSON()}
            </pre>
          )}
          <button
            type="button"
            onClick={() => {
              if (confirm("Reset all changes for this property?")) {
                reset();
              }
            }}
            className="w-full rounded bg-red-500/20 px-2 py-1.5 text-xs text-red-300 hover:bg-red-500/30"
          >
            Reset to default
          </button>
          <p className="text-[10px] text-white/40 text-center">
            Changes auto-save to your browser per property
          </p>
        </section>
      </div>
    </aside>
  );
}
