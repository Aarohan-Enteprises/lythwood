"use client";

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
          arrowRotation={h.arrowRotation ?? 0}
          label={h.label}
          onClick={() => onSelectRoom(h.to)}
          vrMode={vrMode}
        />
      ))}
    </>
  );
}
