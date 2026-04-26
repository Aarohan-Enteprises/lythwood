"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { StereoEffect } from "three/examples/jsm/effects/StereoEffect.js";
import * as THREE from "three";

export function StereoRenderer({ enabled }: { enabled: boolean }) {
  const { gl, size } = useThree();

  useEffect(() => {
    if (!enabled) return;
    const effect = new StereoEffect(gl);
    effect.setSize(size.width, size.height);
    const original = gl.render.bind(gl);
    let inside = false;
    gl.render = (scene: THREE.Scene, camera: THREE.Camera) => {
      // StereoEffect.render() internally calls renderer.render() for each eye.
      // Without this guard those calls re-enter our hijacked render and recurse
      // until the call stack overflows.
      if (inside) {
        original(scene, camera);
        return;
      }
      inside = true;
      try {
        effect.render(scene, camera);
      } finally {
        inside = false;
      }
    };
    return () => {
      gl.render = original;
    };
  }, [enabled, gl, size.width, size.height]);

  return null;
}
