"use client";

import { useEffect } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { Hotspot } from "./Hotspot";
import type { Room } from "@/lib/property";

type Props = {
  room: Room;
  onSelectRoom: (id: string) => void;
  vrMode?: boolean;
};

export function PanoramaScene({ room, onSelectRoom, vrMode = false }: Props) {
  const texture = useLoader(THREE.TextureLoader, room.panorama);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  // Release the ~134 MB GPU texture when this room is replaced. Without this
  // the renderer accumulates one full equirectangular per visited room and
  // Chrome eventually kills the tab.
  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  return (
    <>
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[10, 64, 32]} />
        <meshBasicMaterial map={texture} side={THREE.BackSide} />
      </mesh>

      {room.hotspots.map((h, i) => (
        <Hotspot
          key={`${room.id}-${i}-${h.to}`}
          yaw={h.yaw}
          distance={h.distance ?? 4}
          label={h.label}
          onClick={() => onSelectRoom(h.to)}
          vrMode={vrMode}
        />
      ))}
    </>
  );
}
