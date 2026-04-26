"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const ZEE = new THREE.Vector3(0, 0, 1);
const Q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

function setQuaternion(
  out: THREE.Quaternion,
  alpha: number,
  beta: number,
  gamma: number,
  orient: number,
) {
  const euler = new THREE.Euler(beta, alpha, -gamma, "YXZ");
  out.setFromEuler(euler);
  out.multiply(Q1);
  out.multiply(new THREE.Quaternion().setFromAxisAngle(ZEE, -orient));
}

export function DeviceOrientationCamera({ enabled }: { enabled: boolean }) {
  const { camera } = useThree();
  const stateRef = useRef({
    alpha: 0,
    beta: 0,
    gamma: 0,
    orient: 0,
    received: false,
  });

  useEffect(() => {
    if (!enabled) return;

    function readOrientationAngle() {
      const angle =
        (typeof screen !== "undefined" && screen.orientation?.angle) ||
        (typeof window !== "undefined" &&
          (window as unknown as { orientation?: number }).orientation) ||
        0;
      stateRef.current.orient = THREE.MathUtils.degToRad(angle as number);
    }

    function onDeviceOrientation(e: DeviceOrientationEvent) {
      if (e.alpha == null || e.beta == null || e.gamma == null) return;
      stateRef.current.alpha = THREE.MathUtils.degToRad(e.alpha);
      stateRef.current.beta = THREE.MathUtils.degToRad(e.beta);
      stateRef.current.gamma = THREE.MathUtils.degToRad(e.gamma);
      stateRef.current.received = true;
    }

    readOrientationAngle();
    window.addEventListener("orientationchange", readOrientationAngle);
    window.addEventListener("deviceorientation", onDeviceOrientation, true);
    return () => {
      window.removeEventListener("orientationchange", readOrientationAngle);
      window.removeEventListener(
        "deviceorientation",
        onDeviceOrientation,
        true,
      );
    };
  }, [enabled]);

  useFrame(() => {
    if (!enabled) return;
    const { alpha, beta, gamma, orient, received } = stateRef.current;
    if (!received) return;
    setQuaternion(camera.quaternion, alpha, beta, gamma, orient);
  });

  return null;
}
