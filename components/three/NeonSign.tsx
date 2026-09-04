"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type Ref,
} from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import gsap from "gsap";
import { SIGN, type NeonLive, type NeonSignHandle } from "./signConfig";

export { SIGN };
export type { NeonLive, NeonSignHandle };
import { LOGO_FILL, LOGO_VIEWBOX } from "@/lib/brand/logo-data";
import { NEON_TUBES, type NeonTube } from "@/lib/brand/neon-strokes";

/* ------------------------------------------------------------------ */
/*  Geometrija: SVG prostor → 3D (centar u 0,0; širina ≈ 4.2 jedinice) */
/* ------------------------------------------------------------------ */

const SCALE = 4.2 / LOGO_VIEWBOX.w;
const CX = LOGO_VIEWBOX.x + LOGO_VIEWBOX.w / 2;
const CY = LOGO_VIEWBOX.y + LOGO_VIEWBOX.h / 2;
const DISC_R = (Math.max(LOGO_VIEWBOX.w, LOGO_VIEWBOX.h) / 2) * SCALE * 1.06;

const toV3 = (x: number, y: number, z = 0) =>
  new THREE.Vector3((x - CX) * SCALE, -(y - CY) * SCALE, z);

const NEON = new THREE.Color("#f5e663");
const NEON_GLOW = new THREE.Color("#fff3a0");
// Spuštena u odnosu na prvobitnu (#f7ea7a): sa prepolovljenim plafonima jezgro
// je inače isperivalo u belo, a neon mora da ostane zasićeno žut kao na fotografiji.
const CORE_COLOR = "#f0dc55";
const GLASS_COLOR = "#efe9cf";

/** Poluprečnik cevi po imenu — jedina razlika između dve cevi znaka. */
const TUBE_RADIUS: Record<NeonTube["name"], number> = { arc: 0.028, chris: 0.034 };
/** Halo je ista cev, samo debela — svetlo dolazi iz celog tela cevi. */
const HALO_FACTOR = 3;

/** Boja štampanih slova: dan (ink) → noć (krem). */
const TEXT_DAY = new THREE.Color("#3b3f30");
const TEXT_NIGHT = new THREE.Color("#f4efe6");

/* ------------------------------------------------------------------ */
/*  JEDAN BLOK: tajming cele koreografije + plafoni svetla              */
/*  Živi u signConfig.ts (bez three-a) da Hero ne vuče three u bundle;   */
/*  i od njega gradi `ignition` timeline.                               */
/* ------------------------------------------------------------------ */

// `SIGN` (tajming + plafoni) živi u ./signConfig.ts — vidi napomenu tamo.

/** Redosled crtanja providnih slojeva: disk → sjaj → SENKA → slova → staklo → jezgro → halo. */
const ORDER = {
  disc: 0,
  wallGlow: 1,
  shadow: 2,
  text: 3,
  glass: 4,
  core: 5,
  halo: 6,
} as const;

/* ------------------------------------------------------------------ */
/*  Senka cevi na akrilu — svetlo sa gore-levo, senka dole-desno        */
/* ------------------------------------------------------------------ */

const SHADOW_COLOR = new THREE.Color("#0d1210");
/** Pomak senke u odnosu na cev (scene units): dole i desno. */
const SHADOW_OFFSET = new THREE.Vector2(0.055, -0.065);
/** Tik ispred diska, iza staklene cevi. */
const SHADOW_Z = 0.005;
/** Spljošteno po z → čita se kao razmaz po ploči, ne kao druga cev. */
const SHADOW_FLATTEN = 0.05;

/**
 * Isti fresnel obrazac kao halo, ali tamno i sa NormalBlending — meke ivice.
 * Fragmenti van akrilne ploče se odbacuju, pa senka nikad ne "curi" preko oboda.
 */
function makeShadowMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: SHADOW_COLOR.clone() },
      uOpacity: { value: SIGN.shadowOpacity.min },
      uOffset: { value: SHADOW_OFFSET.clone() },
      uDiscR: { value: DISC_R },
    },
    vertexShader: /* glsl */ `
      uniform vec2 uOffset;
      varying float vFresnel;
      varying vec2 vDisc;
      void main() {
        vec3 n = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 v = normalize(-mv.xyz);
        vFresnel = pow(max(dot(n, v), 0.0), 1.2);
        // mesh se skalira samo po z, pa je XY u prostoru diska = lokalni XY + pomak
        vDisc = position.xy + uOffset;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uDiscR;
      varying float vFresnel;
      varying vec2 vDisc;
      void main() {
        if (length(vDisc) > uDiscR * 0.985) discard;
        gl_FragColor = vec4(uColor, vFresnel * uOpacity);
      }
    `,
    transparent: true,
    blending: THREE.NormalBlending,
    depthWrite: false,
    side: THREE.FrontSide,
  });
}
const SHADOW_MATERIAL = makeShadowMaterial();

/**
 * Halo materijal: prozirnost po fresnelu → mek sjaj bez post-processing bloom-a.
 * Jedan deljeni materijal za obe cevi; uniform se ažurira jednom po frejmu.
 */
function makeHaloMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: NEON_GLOW.clone() },
      uOpacity: { value: 0.05 },
    },
    vertexShader: /* glsl */ `
      varying float vFresnel;
      void main() {
        vec3 n = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 v = normalize(-mv.xyz);
        vFresnel = pow(max(dot(n, v), 0.0), 1.8);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vFresnel;
      void main() {
        gl_FragColor = vec4(uColor, vFresnel * uOpacity);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide,
  });
}
const HALO_MATERIAL = makeHaloMaterial();

/* ------------------------------------------------------------------ */
/*  Cevi — tačno dve, iz lib/brand/neon-strokes.ts, bez ikakve obrade   */
/* ------------------------------------------------------------------ */

type TubeSpec = {
  name: NeonTube["name"];
  /** Jezgro; drawRange na njemu "vodi" svetlo od početka do kraja cevi. */
  core: THREE.TubeGeometry;
  /** Ista putanja, poluprečnik × 3 — fresnel halo. */
  halo: THREE.TubeGeometry;
  /** Kopija jezgra bez drawRange-a — staklena cev se vidi i ugašena. */
  glass: THREE.TubeGeometry;
  radius: number;
  start: THREE.Vector3;
  end: THREE.Vector3;
};

function buildTube(tube: NeonTube): TubeSpec {
  const radius = TUBE_RADIUS[tube.name];
  const points = tube.points.map(([x, y]) => toV3(x, y, 0.08));
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.5);
  const segments = Math.max(12, Math.round(curve.getLength() * 40));
  const core = new THREE.TubeGeometry(curve, segments, radius, 12, false);
  const halo = new THREE.TubeGeometry(curve, segments, radius * HALO_FACTOR, 12, false);
  return {
    name: tube.name,
    core,
    halo,
    glass: core.clone(),
    radius,
    start: points[0],
    end: points[points.length - 1],
  };
}

type NeonTubeProps = {
  spec: TubeSpec;
  /** 0..1 koliko je cev "napunjena" svetlom. */
  fill: { value: number };
  /** 0..1 intenzitet (deljen između obe cevi — treperi ceo znak odjednom). */
  power: { value: number };
};

function NeonTubeMesh({ spec, fill, power }: NeonTubeProps) {
  const coreMat = useRef<THREE.MeshStandardMaterial>(null);
  const glassMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const capMats = useRef<(THREE.MeshPhysicalMaterial | null)[]>([]);

  const coreTotal = spec.core.index ? spec.core.index.count : 0;
  const haloTotal = spec.halo.index ? spec.halo.index.count : 0;

  useFrame(() => {
    const p = THREE.MathUtils.clamp(fill.value, 0, 1);
    const pw = THREE.MathUtils.clamp(power.value, 0, 1);
    // drawRange mora biti umnožak 3 (trouglovi); TubeGeometry indeksira redom
    // duž cevi, pa se svetlo "kreće" od početka ka kraju.
    spec.core.setDrawRange(0, Math.floor((coreTotal * p) / 3) * 3);
    spec.halo.setDrawRange(0, Math.floor((haloTotal * p) / 3) * 3);
    if (coreMat.current) {
      coreMat.current.emissiveIntensity =
        SIGN.coreEmissive.min + pw * (SIGN.coreEmissive.max - SIGN.coreEmissive.min);
    }
    // staklo se gubi u svetlu: kad je upaljeno, vidi se samo jezgro + halo
    const glassOpacity = 0.55 * (1 - pw) + 0.04;
    if (glassMat.current) glassMat.current.opacity = glassOpacity;
    for (const m of capMats.current) if (m) m.opacity = glassOpacity;
    // senka je tu i danju (dnevno svetlo) i noću — samo malo produbi kad se upali
    SHADOW_MATERIAL.uniforms.uOpacity.value =
      SIGN.shadowOpacity.min + pw * (SIGN.shadowOpacity.max - SIGN.shadowOpacity.min);
  });

  return (
    <group>
      {/* senka cevi na akrilu: ista TubeGeometry, spljoštena i pomerena dole-desno */}
      <mesh
        geometry={spec.glass}
        material={SHADOW_MATERIAL}
        position={[SHADOW_OFFSET.x, SHADOW_OFFSET.y, SHADOW_Z]}
        scale={[1, 1, SHADOW_FLATTEN]}
        renderOrder={ORDER.shadow}
      />

      {/* staklena cev — uvek cela vidljiva, tako da se ugašen neon vidi kao na zidu danju */}
      <mesh geometry={spec.glass} renderOrder={ORDER.glass}>
        <meshPhysicalMaterial
          ref={glassMat}
          color={GLASS_COLOR}
          transparent
          opacity={0.55}
          roughness={0.25}
          metalness={0}
          clearcoat={0.6}
          depthWrite={false}
        />
      </mesh>

      {/* kapice — samo na dva prava kraja cevi */}
      {[spec.start, spec.end].map((p, i) => (
        <mesh key={i} position={p} renderOrder={ORDER.glass}>
          <sphereGeometry args={[spec.radius * 1.02, 12, 12]} />
          <meshPhysicalMaterial
            ref={(m) => {
              capMats.current[i] = m;
            }}
            color={GLASS_COLOR}
            transparent
            opacity={0.55}
            roughness={0.25}
            clearcoat={0.6}
            depthWrite={false}
          />
        </mesh>
      ))}

      <mesh geometry={spec.core} renderOrder={ORDER.core}>
        <meshStandardMaterial
          ref={coreMat}
          color={CORE_COLOR}
          emissive={NEON}
          emissiveIntensity={0.15}
          roughness={0.35}
          metalness={0}
          toneMapped={false}
        />
      </mesh>

      <mesh geometry={spec.halo} material={HALO_MATERIAL} renderOrder={ORDER.halo} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Štampana slova ("color cut" / "and more") — ravne SVG konture       */
/* ------------------------------------------------------------------ */

function PrintedText({ tint }: { tint: { value: number } }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);

  const geometry = useMemo(() => {
    const loader = new SVGLoader();
    const data = loader.parse(
      `<svg xmlns="http://www.w3.org/2000/svg"><path d="${LOGO_FILL.text}"/></svg>`,
    );
    const geos: THREE.BufferGeometry[] = [];
    for (const path of data.paths) {
      for (const shape of path.toShapes()) {
        geos.push(new THREE.ShapeGeometry(shape, 6));
      }
    }
    const merged = mergeGeometries(geos);
    merged.translate(-CX, -CY, 0);
    merged.scale(SCALE, -SCALE, 1);
    return merged;
  }, []);

  useFrame(() => {
    if (mat.current) mat.current.color.lerpColors(TEXT_DAY, TEXT_NIGHT, tint.value);
  });

  return (
    <mesh geometry={geometry} position={[0, 0, 0.012]} renderOrder={ORDER.text}>
      <meshBasicMaterial ref={mat} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}

function mergeGeometries(geos: THREE.BufferGeometry[]) {
  // mali lokalni merge (izbegavamo import BufferGeometryUtils zbog veličine bundle-a)
  const positions: number[] = [];
  const indices: number[] = [];
  let offset = 0;
  for (const g of geos) {
    const pos = g.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
    const idx = g.index;
    if (idx) for (let i = 0; i < idx.count; i++) indices.push(idx.getX(i) + offset);
    offset += pos.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  out.setIndex(indices);
  out.computeVertexNormals();
  return out;
}

/* ------------------------------------------------------------------ */
/*  Akrilni disk + šrafovi (kao u salonu)                               */
/* ------------------------------------------------------------------ */

function AcrylicDisc() {
  const screws = useMemo(() => {
    const r = DISC_R * 0.92;
    return [40, 140, 220, 320].map((deg) => {
      const a = (deg * Math.PI) / 180;
      return [Math.cos(a) * r, Math.sin(a) * r] as const;
    });
  }, []);

  return (
    <group>
      <mesh position={[0, 0, -0.01]} renderOrder={ORDER.disc}>
        <circleGeometry args={[DISC_R, 128]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.07}
          roughness={0.08}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.05}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0, -0.005]} renderOrder={ORDER.disc}>
        <ringGeometry args={[DISC_R - 0.012, DISC_R, 160]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.35} toneMapped={false} />
      </mesh>
      {screws.map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.06, 20]} />
          <meshStandardMaterial color="#cfcfcf" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Sjaj iza cevi — ISKLJUČIVO unutar diska                             */
/* ------------------------------------------------------------------ */

/**
 * Krug poluprečnika DISC_R sa radijalnim gradijentom čija je alfa tačno 0 na obodu.
 * Ništa ne sme da svetli van akrilne ploče — van kruga stranica ostaje netaknuta.
 */
function WallHalo({ power }: { power: { value: number } }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);

  const texture = useMemo(() => {
    const size = 512;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,243,160,0.55)");
    g.addColorStop(0.45, "rgba(245,230,99,0.18)");
    g.addColorStop(0.92, "rgba(245,230,99,0)");
    g.addColorStop(1, "rgba(245,230,99,0)");
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  useFrame(() => {
    if (mat.current) mat.current.opacity = power.value * SIGN.wallGlow.max;
  });

  // CircleGeometry mapira UV tako da obod kruga pada tačno na kraj gradijenta (alfa 0)
  return (
    <mesh position={[0, 0, -0.03]} renderOrder={ORDER.wallGlow}>
      <circleGeometry args={[DISC_R, 128]} />
      <meshBasicMaterial
        ref={mat}
        map={texture}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Scena                                                               */
/* ------------------------------------------------------------------ */

// `NeonLive` i `NeonSignHandle` su u ./signConfig.ts (re-export ispod).

export type NeonSignProps = {
  /** Callback ili ref za imperativni handle (vidi Hero.tsx). */
  signRef?: Ref<NeonSignHandle>;
  /** Koliko znak prati miš (0 = ne). */
  parallax?: number;
};

export function NeonSign({ signRef, parallax = 1 }: NeonSignProps) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  // tačno dve cevi — luk i "Chris" — iz jedinog izvora geometrije
  const tubes = useMemo(() => NEON_TUBES.map(buildTube), []);

  // animaciona stanja: obični objekti koje GSAP tween-uje, a useFrame čita
  const live = useMemo<NeonLive>(
    () => ({ power: { value: 0 }, arc: { value: 0 }, chris: { value: 0 }, tint: { value: 0 } }),
    [],
  );

  const pulse = useRef<gsap.core.Tween | null>(null);

  const startPulse = useCallback(() => {
    pulse.current?.kill();
    pulse.current = gsap.to(live.power, {
      value: SIGN.pulse.to,
      duration: SIGN.pulse.duration,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
  }, [live]);

  const stopPulse = useCallback(() => {
    pulse.current?.kill();
    pulse.current = null;
  }, []);

  useImperativeHandle(
    signRef,
    () => ({ live, startPulse, stopPulse }),
    [live, startPulse, stopPulse],
  );

  useEffect(() => {
    return () => {
      pulse.current?.kill();
      pulse.current = null;
    };
  }, []);

  useEffect(() => {
    const specs = tubes;
    return () => {
      for (const s of specs) {
        s.core.dispose();
        s.halo.dispose();
        s.glass.dispose();
      }
    };
  }, [tubes]);

  useFrame((_, dt) => {
    HALO_MATERIAL.uniforms.uOpacity.value =
      SIGN.haloOpacity.min + live.power.value * (SIGN.haloOpacity.max - SIGN.haloOpacity.min);
    if (!group.current) return;
    const k = 1 - Math.exp(-dt * 4); // frame-rate nezavisni lerp
    const tx = pointer.y * 0.12 * parallax;
    const ty = pointer.x * 0.22 * parallax;
    group.current.rotation.x += (tx - group.current.rotation.x) * k;
    group.current.rotation.y += (ty - group.current.rotation.y) * k;
  });

  return (
    <group ref={group}>
      <WallHalo power={live.power} />
      <AcrylicDisc />
      <PrintedText tint={live.tint} />
      {tubes.map((spec) => (
        <NeonTubeMesh
          key={spec.name}
          spec={spec}
          fill={spec.name === "arc" ? live.arc : live.chris}
          power={live.power}
        />
      ))}
    </group>
  );
}
