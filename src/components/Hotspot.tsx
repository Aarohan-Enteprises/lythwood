"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

type Props = {
  yaw: number;
  label: string;
  onClick: () => void;
  distance?: number;
  floorY?: number;
  vrMode?: boolean;
};

export function Hotspot({
  yaw,
  label,
  onClick,
  distance = 4,
  floorY = -2.5,
  vrMode = false,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef<THREE.Mesh>(null);

  // Pull hotspots a little closer in VR so the gaze target is comfortable
  // and the geometry looks bigger relative to the wider stereo FOV.
  const effectiveDistance = vrMode ? Math.min(distance, 3.2) : distance;
  const scale = vrMode ? 1.6 : 1;

  const position = useMemo<[number, number, number]>(
    () => [
      effectiveDistance * Math.sin(yaw),
      floorY,
      effectiveDistance * Math.cos(yaw),
    ],
    [yaw, effectiveDistance, floorY],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 2.2) * 0.06;

    const userData = groupRef.current?.userData as
      | { gazing?: boolean; gazeProgress?: number }
      | undefined;
    const gazing = userData?.gazing ?? false;
    const gazeProgress = userData?.gazeProgress ?? 0;
    const active = hovered || gazing;

    if (ringRef.current) {
      ringRef.current.scale.setScalar(active ? 1.25 : pulse);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = active ? 0.95 : 0.65 + Math.sin(t * 2.2) * 0.1;
    }
    if (progressRef.current) {
      progressRef.current.visible = vrMode && gazeProgress > 0.01;
      progressRef.current.scale.setScalar(0.6 + gazeProgress * 0.6);
      const mat = progressRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.4 + gazeProgress * 0.55;
    }
  });

  function handleOver(e: { stopPropagation: () => void }) {
    if (vrMode) return;
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  }
  function handleOut(e: { stopPropagation: () => void }) {
    if (vrMode) return;
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = "auto";
  }
  function handleClick(e: { stopPropagation: () => void }) {
    if (vrMode) return;
    e.stopPropagation();
    onClick();
  }

  return (
    <group
      ref={(g) => {
        groupRef.current = g;
        if (g) {
          g.userData.isHotspot = true;
          g.userData.onActivate = onClick;
          g.userData.label = label;
          if (g.userData.gazing == null) g.userData.gazing = false;
          if (g.userData.gazeProgress == null) g.userData.gazeProgress = 0;
        }
      }}
      position={position}
      scale={scale}
    >
      <group
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleClick}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      >
        <mesh ref={ringRef}>
          <ringGeometry args={[0.55, 0.85, 64]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
        <mesh ref={progressRef} position={[0, 0, 0.04]} visible={false}>
          <ringGeometry args={[0.95, 1.15, 48]} />
          <meshBasicMaterial
            color="#bef264"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
        <mesh visible={false}>
          <circleGeometry args={[1.1, 32]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>

      {hovered && !vrMode && (
        <Html
          position={[0, 1.0, 0]}
          center
          zIndexRange={[100, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="whitespace-nowrap rounded-md bg-slate-900/85 px-2.5 py-1 text-xs font-medium text-white backdrop-blur shadow-lg">
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}
