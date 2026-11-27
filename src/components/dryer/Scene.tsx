import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export type ViewMode = "iso" | "front" | "side" | "top";

type SceneProps = {
  D_mm: number;
  d_mm: number;
  t_mm: number;
  ti_mm: number;
  fill_mm: number;
  outer_H_mm: number;
  inner_H_mm: number;
  explode: number;
  section: boolean;
  holes: boolean;
  view: ViewMode;
  holeInner: number;
  pitchInner: number;
  holeOuter: number;
  pitchOuter: number;
};

function annulusGeometry(rOut: number, rIn: number, height: number) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, rOut, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, Math.max(rIn, rOut * 0.01), 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(height, 0.001),
    bevelEnabled: false,
    curveSegments: 72,
    steps: 1,
  });
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

function Shell({
  rOut,
  rIn,
  height,
  y,
  color,
  metalness,
  roughness,
  clip,
}: {
  rOut: number;
  rIn: number;
  height: number;
  y: number;
  color: string;
  metalness: number;
  roughness: number;
  clip: THREE.Plane[];
}) {
  const geo = useMemo(() => annulusGeometry(rOut, rIn, height), [rOut, rIn, height]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo} position={[0, y, 0]} castShadow receiveShadow>
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        side={THREE.DoubleSide}
        clippingPlanes={clip}
        clipShadows
      />
    </mesh>
  );
}

function holeTexture(holeMm: number, pitchMm: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 222;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const pitchPx = 28;
  const radius = Math.max(1.2, (holeMm / Math.max(pitchMm, 0.1)) * pitchPx * 0.45);
  ctx.fillStyle = "rgba(0,0,0,0.72)";
  for (let row = 0; row < 10; row += 1) {
    const y = 12 + row * (pitchPx * 0.866);
    const shift = row % 2 === 0 ? 0 : pitchPx / 2;
    for (let col = 0; col < 12; col += 1) {
      ctx.beginPath();
      ctx.arc(shift + col * pitchPx, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function HoleVeil({
  radius,
  height,
  y,
  hole,
  pitch,
  upperOnly,
  clip,
}: {
  radius: number;
  height: number;
  y: number;
  hole: number;
  pitch: number;
  upperOnly: boolean;
  clip: THREE.Plane[];
}) {
  const map = useMemo(() => holeTexture(hole, pitch), [hole, pitch]);
  useEffect(() => () => map?.dispose(), [map]);
  if (!map) return null;
  const h = upperOnly ? height * 0.5 : height;
  const y0 = upperOnly ? y + height * 0.5 : y;
  map.repeat.set(Math.max(6, (2 * Math.PI * radius) / 0.05), Math.max(4, h / 0.04));
  return (
    <mesh position={[0, y0 + h / 2, 0]} castShadow={false}>
      <cylinderGeometry args={[radius * 1.004, radius * 1.004, h, 64, 1, true]} />
      <meshStandardMaterial
        color="#1a120c"
        alphaMap={map}
        transparent
        opacity={0.55}
        roughness={0.8}
        metalness={0}
        side={THREE.DoubleSide}
        depthWrite={false}
        clippingPlanes={clip}
      />
    </mesh>
  );
}

function Rig({
  view,
  radius,
  height,
  controls,
}: {
  view: ViewMode;
  radius: number;
  height: number;
  controls: RefObject<OrbitControlsImpl | null>;
}) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useEffect(() => {
    const dist = Math.max(radius * 3.4, height * 2.2, 0.9);
    const target = new THREE.Vector3(0, height / 2, 0);
    const pos =
      view === "top"
        ? new THREE.Vector3(0, dist, 0.001)
        : view === "front"
          ? new THREE.Vector3(0, height * 0.55, dist)
          : view === "side"
            ? new THREE.Vector3(dist, height * 0.55, 0)
            : new THREE.Vector3(dist * 0.82, dist * 0.58, dist * 0.82);
    camera.position.copy(pos);
    camera.up.set(0, 1, 0);
    camera.lookAt(target);
    if ((camera as THREE.OrthographicCamera).isOrthographicCamera && view !== "iso") {
      const ortho = camera as THREE.OrthographicCamera;
      const zoom = Math.min(size.width, size.height) / (Math.max(radius, height) * 5.4);
      ortho.zoom = Math.max(zoom, 40);
      ortho.updateProjectionMatrix();
    }
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera && view === "iso") {
      camera.updateProjectionMatrix();
    }
    const ctl = controls.current;
    if (ctl) {
      ctl.target.copy(target);
      ctl.update();
    }
  }, [view, radius, height, camera, size.width, size.height, controls]);
  return null;
}

function World(props: SceneProps) {
  const controls = useRef<OrbitControlsImpl>(null);
  const D = props.D_mm / 1000;
  const d = props.d_mm / 1000;
  const t = props.t_mm / 1000;
  const ti = props.ti_mm / 1000;
  const outerH = props.outer_H_mm / 1000;
  const innerH = props.inner_H_mm / 1000;
  const fill = props.fill_mm / 1000;
  const clip = useMemo(() => (props.section ? [new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0)] : []), [props.section]);
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  return (
    <>
      <Rig view={props.view} radius={D / 2} height={Math.max(outerH, innerH)} controls={controls} />
      <color attach="background" args={["#f4f0e8"]} />
      <ambientLight intensity={0.62} />
      <directionalLight position={[2.4, 3.6, 1.8]} intensity={1.45} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <directionalLight position={[-1.8, 1.4, -1.2]} intensity={0.35} />
      <Shell
        rOut={D / 2}
        rIn={D / 2 - t}
        height={outerH}
        y={0}
        color="#1c2830"
        metalness={0.25}
        roughness={0.72}
        clip={clip}
      />
      <Shell
        rOut={D / 2 - t}
        rIn={d / 2}
        height={Math.min(fill, outerH, innerH)}
        y={0}
        color="#c4a15a"
        metalness={0.05}
        roughness={0.86}
        clip={clip}
      />
      <Shell
        rOut={d / 2}
        rIn={d / 2 - ti}
        height={innerH}
        y={props.explode * Math.max(outerH, innerH) * 0.55}
        color="#d5dbe0"
        metalness={0.72}
        roughness={0.28}
        clip={clip}
      />
      {props.holes ? (
        <>
          <HoleVeil
            radius={d / 2 + 0.0008}
            height={innerH}
            y={props.explode * Math.max(outerH, innerH) * 0.55}
            hole={props.holeInner}
            pitch={props.pitchInner}
            upperOnly={false}
            clip={clip}
          />
          <HoleVeil
            radius={D / 2}
            height={outerH}
            y={0}
            hole={props.holeOuter}
            pitch={props.pitchOuter}
            upperOnly
            clip={clip}
          />
        </>
      ) : null}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <circleGeometry args={[Math.max(D, 0.4) * 1.15, 48]} />
        <meshStandardMaterial color="#e7e1d4" />
      </mesh>
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping={!reduced}
        maxPolarAngle={Math.PI * 0.49}
        minDistance={0.15}
        maxDistance={6}
      />
    </>
  );
}

export function DryerScene(props: SceneProps) {
  return (
    <Canvas
      key={props.view}
      shadows
      dpr={[1, 1.6]}
      gl={{ antialias: true, localClippingEnabled: true }}
      camera={
        props.view === "iso"
          ? { fov: 32, position: [1.1, 0.8, 1.1], near: 0.01, far: 40 }
          : { position: [0, 1.2, 1.4], near: 0.01, far: 40, zoom: 280 }
      }
      orthographic={props.view !== "iso"}
      data-testid="scene-canvas"
      aria-label="Interactive reference shell. Dark outer absorber, gold annular bed, silver inner shell, empty core."
    >
      <World {...props} />
    </Canvas>
  );
}
