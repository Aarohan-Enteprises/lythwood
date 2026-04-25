"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { PanoramaScene } from "./PanoramaScene";
import { sampleProperty } from "@/lib/property";

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
  const property = sampleProperty;

  const [roomId, setRoomId] = useState<string>(property.startRoomId);
  const [transitioning, setTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const room = useMemo(() => {
    return property.rooms.find((r) => r.id === roomId) ?? property.rooms[0];
  }, [property, roomId]);

  function selectRoom(id: string) {
    if (id === room.id) return;
    setTransitioning(true);
    window.setTimeout(() => {
      setRoomId(id);
      window.setTimeout(() => setTransitioning(false), 300);
    }, 250);
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
          Drag to look · Scroll to zoom · Click chevrons to move
        </p>
      </div>
    </div>
  );
}
