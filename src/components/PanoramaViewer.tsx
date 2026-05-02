"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { PanoramaScene } from "./PanoramaScene";
import { EditorPanel } from "./EditorPanel";
import type { Property } from "@/lib/property";
import { usePropertyStore } from "@/lib/store";
import { projectToFloor } from "@/lib/spherical";
import { StereoRenderer } from "./vr/StereoRenderer";
import { DeviceOrientationCamera } from "./vr/DeviceOrientationCamera";
import { GazeController } from "./vr/GazeController";

// Reuse parsed textures across room switches so going back is instant.
THREE.Cache.enabled = true;

const prefetched = new Set<string>();
function prefetchPanorama(url: string) {
  if (prefetched.has(url)) return;
  prefetched.add(url);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
}

type AimRef = { dx: number; dy: number; dz: number };

function AimTracker({ aimRef }: { aimRef: React.MutableRefObject<AimRef> }) {
  const { camera } = useThree();
  const v = useRef(new THREE.Vector3());
  useFrame(() => {
    camera.getWorldDirection(v.current);
    aimRef.current.dx = v.current.x;
    aimRef.current.dy = v.current.y;
    aimRef.current.dz = v.current.z;
  });
  return null;
}

function FovZoom({ min, max, enabled }: { min: number; max: number; enabled: boolean }) {
  const { camera, gl } = useThree();
  useEffect(() => {
    if (!enabled) return;
    const dom = gl.domElement;

    function clampFov(value: number) {
      return Math.min(max, Math.max(min, value));
    }

    function onWheel(e: WheelEvent) {
      if (!(camera instanceof THREE.PerspectiveCamera)) return;
      e.preventDefault();
      camera.fov = clampFov(camera.fov + e.deltaY * 0.05);
      camera.updateProjectionMatrix();
    }

    let pinchStartDistance = 0;
    let pinchStartFov = camera instanceof THREE.PerspectiveCamera ? camera.fov : 75;

    function distance(touches: TouchList) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx, dy);
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 2) return;
      if (!(camera instanceof THREE.PerspectiveCamera)) return;
      pinchStartDistance = distance(e.touches);
      pinchStartFov = camera.fov;
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length !== 2) return;
      if (!(camera instanceof THREE.PerspectiveCamera)) return;
      if (pinchStartDistance <= 0) return;
      e.preventDefault();
      const ratio = distance(e.touches) / pinchStartDistance;
      // Pinch out (ratio > 1) → zoom in (smaller FOV); pinch in → zoom out.
      camera.fov = clampFov(pinchStartFov / ratio);
      camera.updateProjectionMatrix();
    }

    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2) pinchStartDistance = 0;
    }

    dom.addEventListener("wheel", onWheel, { passive: false });
    dom.addEventListener("touchstart", onTouchStart, { passive: true });
    dom.addEventListener("touchmove", onTouchMove, { passive: false });
    dom.addEventListener("touchend", onTouchEnd, { passive: true });
    dom.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      dom.removeEventListener("wheel", onWheel);
      dom.removeEventListener("touchstart", onTouchStart);
      dom.removeEventListener("touchmove", onTouchMove);
      dom.removeEventListener("touchend", onTouchEnd);
      dom.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [camera, gl, min, max, enabled]);
  return null;
}

function VRFovSetter({ vrMode }: { vrMode: boolean }) {
  const { camera } = useThree();
  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    camera.fov = vrMode ? 90 : 75;
    camera.updateProjectionMatrix();
  }, [camera, vrMode]);
  return null;
}

async function requestGyroPermission(): Promise<boolean> {
  type IOSDeviceOrientation = typeof DeviceOrientationEvent & {
    requestPermission?: () => Promise<"granted" | "denied">;
  };
  const ctor = (typeof DeviceOrientationEvent !== "undefined"
    ? (DeviceOrientationEvent as IOSDeviceOrientation)
    : null);
  if (ctor?.requestPermission) {
    try {
      const result = await ctor.requestPermission();
      return result === "granted";
    } catch {
      return false;
    }
  }
  return true;
}

export function PanoramaViewer({ property: initialProperty }: { property: Property }) {
  const store = usePropertyStore(initialProperty);
  const { property, addHotspot } = store;

  const [roomId, setRoomId] = useState<string>(initialProperty.startRoomId);
  const [transitioning, setTransitioning] = useState(false);
  const [panoReady, setPanoReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [vrMode, setVrMode] = useState(false);
  const [showMobileHint, setShowMobileHint] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editorAvailable, setEditorAvailable] = useState(false);
  const aimRef = useRef<AimRef>({ dx: 0, dy: 0, dz: 1 });
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Hidden access to the editor: Ctrl/Cmd + Shift + E reveals (or hides) the
  // edit button. Stays revealed until toggled off or the page is reloaded.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) return;
      if (e.key !== "E" && e.key !== "e") return;
      e.preventDefault();
      setEditorAvailable((v) => {
        if (v) setEditMode(false);
        return !v;
      });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!showMobileHint) return;
    const timer = window.setTimeout(() => setShowMobileHint(false), 3500);
    const dismiss = () => setShowMobileHint(false);
    window.addEventListener("touchstart", dismiss, { once: true, passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("touchstart", dismiss);
    };
  }, [showMobileHint]);

  const room = useMemo(() => {
    return property.rooms.find((r) => r.id === roomId) ?? property.rooms[0];
  }, [property, roomId]);

  // Once the current room is settled, warm the browser cache for any room
  // reachable in one hop so that hotspot navigation feels instant.
  useEffect(() => {
    if (transitioning) return;
    const idle =
      typeof window !== "undefined" &&
      "requestIdleCallback" in window
        ? (window as unknown as {
            requestIdleCallback: (cb: () => void) => number;
          }).requestIdleCallback
        : (cb: () => void) => window.setTimeout(cb, 200);
    const handle = idle(() => {
      for (const h of room.hotspots) {
        const target = property.rooms.find((r) => r.id === h.to);
        if (target) prefetchPanorama(target.panorama);
      }
    });
    return () => {
      if (
        typeof window !== "undefined" &&
        "cancelIdleCallback" in window &&
        typeof handle === "number"
      ) {
        (window as unknown as {
          cancelIdleCallback: (h: number) => void;
        }).cancelIdleCallback(handle);
      }
    };
  }, [room, property.rooms, transitioning]);

  const selectRoom = useCallback((id: string) => {
    setRoomId((current) => {
      if (id === current) return current;
      setTransitioning(true);
      setPanoReady(false);
      window.setTimeout(() => {
        window.setTimeout(() => setTransitioning(false), 300);
      }, 250);
      return id;
    });
  }, []);

  const dropAtCrosshair = useCallback(() => {
    const { dx, dy, dz } = aimRef.current;
    const { yaw, pitch, distance } = projectToFloor(dx, dy, dz);
    const otherRoom = property.rooms.find((r) => r.id !== room.id);
    if (!otherRoom) {
      alert("Add another room first so the hotspot has somewhere to link to.");
      return;
    }
    addHotspot(room.id, {
      to: otherRoom.id,
      label: `To ${otherRoom.name}`,
      yaw,
      pitch,
      distance,
    });
  }, [property.rooms, room, addHotspot]);

  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen();
  }

  const exitVR = useCallback(async () => {
    setVrMode(false);
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch {
      /* ignore */
    }
    try {
      screen.orientation?.unlock?.();
    } catch {
      /* ignore */
    }
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        /* ignore */
      }
    }
  }, []);

  const enterVR = useCallback(async () => {
    const granted = await requestGyroPermission();
    if (!granted) {
      alert(
        "Motion access is required for VR mode. Please allow motion and orientation in your browser settings.",
      );
      return;
    }
    const el = containerRef.current;
    if (el && !document.fullscreenElement) {
      try {
        await el.requestFullscreen();
      } catch {
        /* fullscreen may fail in some browsers */
      }
    }
    try {
      // Cardboard-class headsets are landscape-only.
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (o: string) => Promise<void>;
      };
      await orientation?.lock?.("landscape");
    } catch {
      /* lock may not be supported / requires fullscreen */
    }
    try {
      wakeLockRef.current =
        (await navigator.wakeLock?.request("screen")) ?? null;
    } catch {
      /* wake lock optional */
    }
    setVrMode(true);
  }, []);

  useEffect(() => {
    const onChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (!fs && vrMode) {
        // Exiting fullscreen also exits VR.
        void exitVR();
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [vrMode, exitVR]);

  useEffect(() => {
    if (!vrMode) return;
    function onVisibility() {
      if (document.visibilityState === "visible" && !wakeLockRef.current) {
        navigator.wakeLock
          ?.request("screen")
          .then((sentinel) => {
            wakeLockRef.current = sentinel;
          })
          .catch(() => {
            /* ignore */
          });
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [vrMode]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-black overflow-hidden"
    >
      <Canvas
        camera={{ position: [0.001, 0, 0], fov: 75 }}
        gl={{ antialias: !vrMode, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <PanoramaScene room={room} onSelectRoom={selectRoom} vrMode={vrMode} />
          <SceneReadyMarker key={room.id} onReady={() => setPanoReady(true)} />
        </Suspense>

        {!vrMode && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={-0.4}
            target={[0, 0, 0]}
          />
        )}

        <FovZoom min={35} max={90} enabled={!vrMode} />
        <VRFovSetter vrMode={vrMode} />
        <DeviceOrientationCamera enabled={vrMode} />
        <GazeController enabled={vrMode} />
        <StereoRenderer enabled={vrMode} />
        <AimTracker aimRef={aimRef} />
      </Canvas>

      <div
        className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-300 ${
          transitioning ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black transition-opacity duration-300 ${
          panoReady ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden={panoReady}
      >
        <div className="flex flex-col items-center gap-3">
          <span className="block h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-lime-400" />
          <span className="text-[10px] uppercase tracking-widest text-white/60">
            Loading {room.name}
          </span>
        </div>
      </div>

      {!vrMode && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 bg-gradient-to-b from-black/70 to-transparent p-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:p-6">
            <div className="pointer-events-auto min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-widest text-white/60 md:text-xs">
                Virtual Tour
              </p>
              <h1 className="truncate text-base font-semibold text-white md:text-2xl">
                {property.name}
              </h1>
              <p className="truncate text-[11px] text-white/70 md:text-sm">
                {property.address}
              </p>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 bg-gradient-to-t from-black/80 to-transparent p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:p-6">
            <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-lime-400" />
              <span className="text-sm font-medium text-white">{room.name}</span>
            </div>
            <div
              className="pointer-events-auto flex w-full max-w-full snap-x snap-mandatory gap-2 overflow-x-auto px-2 py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:max-w-3xl md:flex-wrap md:justify-center md:overflow-visible md:px-0"
            >
              {property.rooms.map((r) => {
                const active = r.id === room.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => selectRoom(r.id)}
                    className={`min-h-[44px] shrink-0 snap-start whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-lime-400 text-black"
                        : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-md"
                    }`}
                  >
                    {r.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pointer-events-auto absolute right-3 bottom-32 z-20 flex flex-col gap-2 md:right-6 md:bottom-36">
            {editorAvailable && (
              <button
                type="button"
                onClick={() => setEditMode((v) => !v)}
                aria-label={editMode ? "Close editor" : "Open editor"}
                title={editMode ? "Close editor" : "Edit tour"}
                className={`grid h-12 w-12 place-items-center rounded-full shadow-lg ring-1 transition ${
                  editMode
                    ? "bg-lime-400 text-black ring-black/10 hover:bg-lime-300"
                    : "bg-white/15 text-white ring-white/10 backdrop-blur-md hover:bg-white/25"
                }`}
              >
                <EditIcon className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={enterVR}
              aria-label="Enter VR mode"
              title="Enter VR"
              className="grid h-12 w-12 place-items-center rounded-full bg-lime-400 text-black shadow-lg ring-1 ring-black/10 hover:bg-lime-300 transition"
            >
              <VRIcon className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              className="grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white shadow-lg ring-1 ring-white/10 backdrop-blur-md hover:bg-white/25 transition"
            >
              {isFullscreen ? (
                <ExitFullscreenIcon className="h-5 w-5" />
              ) : (
                <FullscreenIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {editMode && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3">
              <div className="relative h-10 w-10">
                <div className="absolute inset-0 rounded-full border-2 border-lime-400 bg-lime-400/15 shadow-[0_0_20px_rgba(163,230,53,0.5)]" />
                <div className="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-lime-400" />
                <div className="absolute left-1/2 top-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2 bg-lime-400" />
              </div>
              <button
                type="button"
                onClick={dropAtCrosshair}
                className="pointer-events-auto rounded-full bg-lime-400 px-4 py-2 text-xs font-bold text-black shadow-lg hover:bg-lime-300 transition"
              >
                + Drop hotspot here
              </button>
            </div>
          )}

          {editMode && (
            <EditorPanel
              store={store}
              activeRoomId={room.id}
              onSelectRoom={selectRoom}
              onClose={() => setEditMode(false)}
            />
          )}

          <div
            className={`pointer-events-none absolute inset-x-0 top-24 z-10 px-4 transition-opacity duration-500 md:hidden ${
              showMobileHint ? "opacity-100" : "opacity-0"
            }`}
          >
            <p className="mx-auto w-fit rounded-full bg-black/55 px-3 py-1.5 text-center text-[10px] uppercase tracking-wider text-white/80 backdrop-blur-sm">
              Drag to look · Pinch to zoom · Tap rings to move
            </p>
          </div>
          <div className="pointer-events-none absolute left-4 bottom-32 z-10 hidden md:block md:left-6 md:bottom-36">
            <p className="rounded-md bg-black/40 px-3 py-2 text-[10px] uppercase tracking-wider text-white/70 backdrop-blur-sm">
              Drag to look · Scroll to zoom · Click rings to move
            </p>
          </div>
        </>
      )}

      {vrMode && (
        <button
          type="button"
          onClick={exitVR}
          className="pointer-events-auto absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-white/90 backdrop-blur-md hover:bg-white/25 transition"
        >
          Exit VR
        </button>
      )}
    </div>
  );
}

function SceneReadyMarker({ onReady }: { onReady: () => void }) {
  // Mounts only after the suspended PanoramaScene resolves, so this is the
  // earliest reliable signal that the panorama texture is loaded.
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

function VRIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h15A1.5 1.5 0 0 1 21 8.5v7a1.5 1.5 0 0 1-1.5 1.5h-3.3a1 1 0 0 1-.86-.49l-1.34-2.24a1 1 0 0 0-1.72 0l-1.34 2.24a1 1 0 0 1-.86.49H4.5A1.5 1.5 0 0 1 3 15.5v-7Z" />
      <circle cx="8.25" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15.75" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FullscreenIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 9V5a1 1 0 0 1 1-1h4" />
      <path d="M20 9V5a1 1 0 0 0-1-1h-4" />
      <path d="M4 15v4a1 1 0 0 0 1 1h4" />
      <path d="M20 15v4a1 1 0 0 1-1 1h-4" />
    </svg>
  );
}

function ExitFullscreenIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 4v4a1 1 0 0 1-1 1H4" />
      <path d="M15 4v4a1 1 0 0 0 1 1h4" />
      <path d="M9 20v-4a1 1 0 0 0-1-1H4" />
      <path d="M15 20v-4a1 1 0 0 1 1-1h4" />
    </svg>
  );
}
