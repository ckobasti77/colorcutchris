"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { NeonSign, type NeonSignProps } from "./NeonSign";

type Props = NeonSignProps & { className?: string };

/**
 * Canvas omotač za neon znak. Uvoziti isključivo preko next/dynamic({ ssr:false })
 * iz client komponente (vidi Hero.tsx). `signRef` prolazi do NeonSign-a i daje
 * imperativni handle (getIgnition / setLit).
 */
export function NeonSignCanvas({ className, ...sign }: Props) {
  return (
    <Canvas
      className={className}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 9.6], fov: 32, near: 0.1, far: 50 }}
      style={{ background: "transparent" }}
      frameloop="always"
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 6]} intensity={1.2} />
      <Suspense fallback={null}>
        <NeonSign {...sign} />
      </Suspense>
    </Canvas>
  );
}
