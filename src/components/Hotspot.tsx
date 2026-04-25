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
  arrowRotation?: number;
};

const chevronShape = (() => {
  const s = new THREE.Shape();
  const w = 0.55;
  const h = 0.45;
  const t = 0.18;
  s.moveTo(-w, -h * 0.4);
  s.lineTo(0, h * 0.6);
  s.lineTo(w, -h * 0.4);
  s.lineTo(w - t, -h * 0.4);
  s.lineTo(0, h * 0.6 - t * 1.2);
  s.lineTo(-(w - t), -h * 0.4);
  s.closePath();
  return s;
})();

export function Hotspot({
  yaw,
  label,
  onClick,
  distance = 4,
  floorY = -2.5,
  arrowRotation = 0,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const chevronRef = useRef<THREE.Mesh>(null);

  const position = useMemo<[number, number, number]>(
    () => [distance * Math.sin(yaw), floorY, distance * Math.cos(yaw)],
    [yaw, distance, floorY],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 2.2) * 0.06;
    if (ringRef.current) {
      ringRef.current.scale.setScalar(hovered ? 1.25 : pulse);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = hovered ? 0.95 : 0.65 + Math.sin(t * 2.2) * 0.1;
    }
    if (chevronRef.current) {
      chevronRef.current.position.z = 0.05 + Math.sin(t * 2.2) * 0.04;
      const mat = chevronRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = hovered ? 1 : 0.85;
    }
  });

  function handleOver(e: { stopPropagation: () => void }) {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
    console.log("[hotspot] hover ->", label);
  }
  function handleOut(e: { stopPropagation: () => void }) {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = "auto";
  }
  function handleClick(e: { stopPropagation: () => void }) {
    e.stopPropagation();
    console.log("[hotspot] click ->", label);
    onClick();
  }

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, yaw + arrowRotation, 0]}
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
        <mesh ref={chevronRef} position={[0, 0, 0.05]}>
          <shapeGeometry args={[chevronShape]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.85}
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

      {hovered && (
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
