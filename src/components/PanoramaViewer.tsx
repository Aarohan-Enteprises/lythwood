"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { PanoramaScene } from "./PanoramaScene";
import { EditorPanel } from "./EditorPanel";
import { usePropertyStore } from "@/lib/store";
import { projectToFloor } from "@/lib/spherical";

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

function FovZoom({ min, max }: { min: number; max: number }) {
  const { camera, gl } = useThree();
  useEffect(() => {
    const dom = gl.domElement;
    function onWheel(e: WheelEvent) {
      if (!(camera instanceof THREE.PerspectiveCamera)) return;
      e.preventDefault();
      const next = camera.fov + e.deltaY * 0.05;
      camera.fov = Math.min(max, Math.max(min, next));
      camera.updateProjectionMatrix();
    }
    dom.addEventListener("wheel", onWheel, { passive: false });
    return () => dom.removeEventListener("wheel", onWheel);
  }, [camera, gl, min, max]);
  return null;
}

export function PanoramaViewer() {
  const store = usePropertyStore();
  const { property, loaded, addHotspot } = store;

  const [roomId, setRoomId] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const aimRef = useRef<AimRef>({ dx: 0, dy: 0, dz: 1 });

  useEffect(() => {
    if (loaded && roomId === null) {
      setRoomId(property.startRoomId);
    }
  }, [loaded, property.startRoomId, roomId]);

  const room = useMemo(() => {
    const id = roomId ?? property.startRoomId;
    return property.rooms.find((r) => r.id === id) ?? property.rooms[0];
  }, [property, roomId]);

  function selectRoom(id: string) {
    if (id === room.id) return;
    setTransitioning(true);
    window.setTimeout(() => {
      setRoomId(id);
      window.setTimeout(() => setTransitioning(false), 300);
    }, 250);
  }

  function handleAddHotspot(yaw: number, pitch: number, distance: number) {
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
  }

  function dropAtCrosshair() {
    const { dx, dy, dz } = aimRef.current;
    const { yaw, pitch, distance } = projectToFloor(dx, dy, dz);
    console.log(
      `[edit] drop @ crosshair: yaw ${((yaw * 180) / Math.PI).toFixed(1)}° pitch ${((pitch * 180) / Math.PI).toFixed(1)}° distance ${distance.toFixed(2)}m`,
    );
    if (pitch > -0.05) {
      console.warn(
        "[edit] aim is at/above horizon — chevron would be invisible. Tilt down toward the floor near the doorway, then drop.",
      );
    }
    handleAddHotspot(yaw, pitch, distance);
  }

  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen();
  }

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-black overflow-hidden"
    >
      <Canvas
        camera={{ position: [0.001, 0, 0], fov: 75 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <PanoramaScene room={room} onSelectRoom={selectRoom} />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={-0.4}
          target={[0, 0, 0]}
        />
        <FovZoom min={35} max={90} />
        <AimTracker aimRef={aimRef} />
      </Canvas>

      <div
        className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-300 ${
          transitioning ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 bg-gradient-to-b from-black/70 to-transparent p-4 md:p-6">
        <div className="pointer-events-auto">
          <p className="text-xs uppercase tracking-widest text-white/60">
            Virtual Tour
          </p>
          <h1 className="text-xl md:text-2xl font-semibold text-white">
            {property.name}
          </h1>
          <p className="text-xs md:text-sm text-white/70">{property.address}</p>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditMode((v) => !v)}
            className={`rounded-full px-3 py-2 text-xs font-medium backdrop-blur-md transition ${
              editMode
                ? "bg-lime-400 text-black"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
            title="Toggle hotspot author mode + open editor"
          >
            {editMode ? "Editing" : "Edit"}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white backdrop-blur-md hover:bg-white/20 transition"
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 bg-gradient-to-t from-black/80 to-transparent p-4 md:p-6">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-lime-400" />
          <span className="text-sm font-medium text-white">{room.name}</span>
        </div>
        <div className="pointer-events-auto flex flex-wrap justify-center gap-2">
          {property.rooms.map((r) => {
            const active = r.id === room.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => selectRoom(r.id)}
                className={`rounded-full px-4 py-2 text-xs md:text-sm font-medium transition ${
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

      <div className="pointer-events-none absolute right-4 bottom-32 md:right-6 md:bottom-36 z-10 hidden md:block">
        <p className="rounded-md bg-black/40 px-3 py-2 text-[10px] uppercase tracking-wider text-white/70 backdrop-blur-sm">
          {editMode
            ? "EDIT · Aim crosshair AT THE FLOOR near the doorway · Drop"
            : "Drag to look · Scroll to zoom · Click chevrons to move"}
        </p>
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
    </div>
  );
}
