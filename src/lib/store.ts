"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Hotspot, Property, Room } from "./property";

const STORAGE_PREFIX = "virtual-tour-property-v1:";

function storageKey(id: string) {
  return `${STORAGE_PREFIX}${id}`;
}

function loadFromStorage(id: string): Property | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(id));
    if (!raw) return null;
    return JSON.parse(raw) as Property;
  } catch {
    return null;
  }
}

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || `room-${Date.now()}`
  );
}

export function usePropertyStore(initialProperty: Property) {
  const [property, setProperty] = useState<Property>(initialProperty);
  const [loaded, setLoaded] = useState(false);
  const skipNextSave = useRef(true);
  const seedRef = useRef(initialProperty);

  useEffect(() => {
    seedRef.current = initialProperty;
    skipNextSave.current = true;
    const stored = loadFromStorage(initialProperty.id);
    setProperty(stored ?? initialProperty);
    setLoaded(true);
  }, [initialProperty]);

  useEffect(() => {
    if (!loaded) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    try {
      window.localStorage.setItem(
        storageKey(property.id),
        JSON.stringify(property),
      );
    } catch {
      /* ignore quota / unavailable */
    }
  }, [property, loaded]);

  const updateProperty = useCallback((patch: Partial<Property>) => {
    setProperty((p) => ({ ...p, ...patch }));
  }, []);

  const updateRoom = useCallback((roomId: string, patch: Partial<Room>) => {
    setProperty((p) => ({
      ...p,
      rooms: p.rooms.map((r) => (r.id === roomId ? { ...r, ...patch } : r)),
    }));
  }, []);

  const addRoom = useCallback((name: string, panorama: string) => {
    const id = slugify(name);
    setProperty((p) => {
      const uniqueId = p.rooms.some((r) => r.id === id)
        ? `${id}-${Date.now().toString(36)}`
        : id;
      return {
        ...p,
        rooms: [...p.rooms, { id: uniqueId, name, panorama, hotspots: [] }],
      };
    });
  }, []);

  const removeRoom = useCallback((roomId: string) => {
    setProperty((p) => {
      if (p.rooms.length <= 1) return p;
      const remaining = p.rooms.filter((r) => r.id !== roomId);
      return {
        ...p,
        rooms: remaining.map((r) => ({
          ...r,
          hotspots: r.hotspots.filter((h) => h.to !== roomId),
        })),
        startRoomId:
          p.startRoomId === roomId ? remaining[0].id : p.startRoomId,
      };
    });
  }, []);

  const addHotspot = useCallback((roomId: string, hotspot: Hotspot) => {
    setProperty((p) => ({
      ...p,
      rooms: p.rooms.map((r) =>
        r.id === roomId ? { ...r, hotspots: [...r.hotspots, hotspot] } : r,
      ),
    }));
  }, []);

  const updateHotspot = useCallback(
    (roomId: string, index: number, patch: Partial<Hotspot>) => {
      setProperty((p) => ({
        ...p,
        rooms: p.rooms.map((r) =>
          r.id === roomId
            ? {
                ...r,
                hotspots: r.hotspots.map((h, i) =>
                  i === index ? { ...h, ...patch } : h,
                ),
              }
            : r,
        ),
      }));
    },
    [],
  );

  const removeHotspot = useCallback((roomId: string, index: number) => {
    setProperty((p) => ({
      ...p,
      rooms: p.rooms.map((r) =>
        r.id === roomId
          ? { ...r, hotspots: r.hotspots.filter((_, i) => i !== index) }
          : r,
      ),
    }));
  }, []);

  const reset = useCallback(() => {
    const seed = seedRef.current;
    setProperty(seed);
    try {
      window.localStorage.removeItem(storageKey(seed.id));
    } catch {
      /* ignore */
    }
  }, []);

  const exportJSON = useCallback(() => {
    return JSON.stringify(property, null, 2);
  }, [property]);

  const importJSON = useCallback((text: string) => {
    try {
      const parsed = JSON.parse(text) as Property;
      if (!parsed.rooms || !Array.isArray(parsed.rooms)) return false;
      setProperty(parsed);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    property,
    loaded,
    updateProperty,
    updateRoom,
    addRoom,
    removeRoom,
    addHotspot,
    updateHotspot,
    removeHotspot,
    reset,
    exportJSON,
    importJSON,
  };
}

export type PropertyStore = ReturnType<typeof usePropertyStore>;
