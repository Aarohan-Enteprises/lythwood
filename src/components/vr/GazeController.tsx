"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const DWELL_SECONDS = 1.6;
const ANGLE_THRESHOLD_RAD = THREE.MathUtils.degToRad(10);

type Props = {
  enabled: boolean;
  onActivate?: () => void;
};

export function GazeController({ enabled, onActivate }: Props) {
  const { scene, camera } = useThree();
  const reticleGroup = useRef<THREE.Group>(null);
  const fillRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const dwellState = useRef<{
    targetUuid: string | null;
    accumulated: number;
    cooldown: number;
  }>({ targetUuid: null, accumulated: 0, cooldown: 0 });

  // Reusable temporaries — avoid per-frame allocation in the render loop.
  const tmp = useMemo(
    () => ({
      camPos: new THREE.Vector3(),
      camDir: new THREE.Vector3(),
      hotPos: new THREE.Vector3(),
      toHot: new THREE.Vector3(),
    }),
    [],
  );

  useEffect(() => {
    if (!enabled) {
      // Clear any lingering gaze state on hotspots when leaving VR.
      scene.traverse((obj) => {
        if (obj.userData?.isHotspot) {
          obj.userData.gazing = false;
          obj.userData.gazeProgress = 0;
        }
      });
      dwellState.current = {
        targetUuid: null,
        accumulated: 0,
        cooldown: 0,
      };
    }
  }, [enabled, scene]);

  useFrame((_, delta) => {
    if (!enabled) {
      if (reticleGroup.current) reticleGroup.current.visible = false;
      return;
    }
    if (reticleGroup.current) reticleGroup.current.visible = true;

    // Position the reticle ~1m in front of the camera, billboarded.
    camera.getWorldPosition(tmp.camPos);
    camera.getWorldDirection(tmp.camDir);
    if (reticleGroup.current) {
      reticleGroup.current.position
        .copy(tmp.camPos)
        .addScaledVector(tmp.camDir, 1);
      reticleGroup.current.quaternion.copy(camera.quaternion);
    }

    // Find the closest hotspot to the gaze direction.
    let bestGroup: THREE.Object3D | null = null;
    let bestAngle = Infinity;
    scene.traverse((obj) => {
      if (!obj.userData?.isHotspot) return;
      obj.getWorldPosition(tmp.hotPos);
      tmp.toHot.subVectors(tmp.hotPos, tmp.camPos).normalize();
      const angle = tmp.camDir.angleTo(tmp.toHot);
      if (angle < bestAngle) {
        bestAngle = angle;
        bestGroup = obj;
      }
    });

    const state = dwellState.current;
    if (state.cooldown > 0) state.cooldown -= delta;

    const onTarget =
      bestGroup !== null &&
      bestAngle < ANGLE_THRESHOLD_RAD &&
      state.cooldown <= 0;

    if (onTarget && bestGroup) {
      const target = bestGroup as THREE.Object3D;
      if (state.targetUuid !== target.uuid) {
        state.targetUuid = target.uuid;
        state.accumulated = 0;
      }
      state.accumulated += delta;
      const progress = Math.min(1, state.accumulated / DWELL_SECONDS);

      // Mark this hotspot as gazed; clear all others.
      scene.traverse((obj) => {
        if (!obj.userData?.isHotspot) return;
        if (obj.uuid === target.uuid) {
          obj.userData.gazing = true;
          obj.userData.gazeProgress = progress;
        } else {
          obj.userData.gazing = false;
          obj.userData.gazeProgress = 0;
        }
      });

      if (progress >= 1) {
        const activate = target.userData?.onActivate as
          | (() => void)
          | undefined;
        state.targetUuid = null;
        state.accumulated = 0;
        state.cooldown = 0.6;
        target.userData.gazing = false;
        target.userData.gazeProgress = 0;
        if (activate) activate();
        if (onActivate) onActivate();
      }
    } else {
      if (state.targetUuid !== null) {
        state.targetUuid = null;
        state.accumulated = 0;
        scene.traverse((obj) => {
          if (!obj.userData?.isHotspot) return;
          obj.userData.gazing = false;
          obj.userData.gazeProgress = 0;
        });
      }
    }

    // Drive reticle fill from current dwell progress.
    const progress =
      state.targetUuid && bestGroup
        ? Math.min(1, state.accumulated / DWELL_SECONDS)
        : 0;
    if (fillRef.current) {
      fillRef.current.scale.setScalar(0.0001 + progress * 1);
      const mat = fillRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.85 * progress;
    }
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = onTarget ? 0.95 : 0.5;
    }
  });

  return (
    <group ref={reticleGroup} renderOrder={999}>
      <mesh ref={ringRef}>
        <ringGeometry args={[0.018, 0.024, 48]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.5}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={fillRef} scale={0.0001}>
        <circleGeometry args={[0.022, 32]} />
        <meshBasicMaterial
          color="#bef264"
          transparent
          opacity={0}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
