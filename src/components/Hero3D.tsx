import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text3D, Center, Float, Environment } from "@react-three/drei";
import { Suspense, useRef, useMemo, useState, useEffect, useCallback } from "react";
import * as THREE from "three";

/* ── Theme hook ── */
function useIsDark() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setIsDark(el.classList.contains("dark")));
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

/* ── Animated 3D Studio Name ── */
function StudioText({ mousePos }: { mousePos: React.MutableRefObject<{ x: number; y: number }> }) {
  const meshRef = useRef<THREE.Group>(null);
  const isDark = useIsDark();

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y, mousePos.current.x * 0.12, 0.025
    );
    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x, mousePos.current.y * -0.06, 0.025
    );
    meshRef.current.position.y = Math.sin(t * 0.3) * 0.04;
  });

  return (
    <group ref={meshRef}>
      <Center>
        <Text3D
          font="/fonts/helvetiker_bold.typeface.json"
          size={2.2} height={0.55}
          bevelEnabled bevelThickness={0.04} bevelSize={0.025}
          bevelSegments={12} curveSegments={48}
        >
          KIM
          <meshPhysicalMaterial
            color={isDark ? "#d4b896" : "#5a3e22"}
            metalness={0.92} roughness={0.08}
            emissive={isDark ? "#2a1e10" : "#0d0804"}
            emissiveIntensity={0.15}
            clearcoat={1} clearcoatRoughness={0.1}
            reflectivity={1} envMapIntensity={1.5}
          />
        </Text3D>
      </Center>
    </group>
  );
}

/* ── Orbit rings ── */
function OrbitRing({ radius, speed, tilt, thickness }: { radius: number; speed: number; tilt: number; thickness: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const isDark = useIsDark();
  useFrame((state) => { if (ref.current) ref.current.rotation.z = state.clock.getElapsedTime() * speed; });
  return (
    <mesh ref={ref} rotation={[tilt, 0, 0]}>
      <torusGeometry args={[radius, thickness, 16, 100]} />
      <meshStandardMaterial color={isDark ? "#c4a882" : "#6b4c2a"} metalness={0.95} roughness={0.05} transparent opacity={0.12} />
    </mesh>
  );
}

/* ── Interactive particle field — repels from mouse ── */
function InteractiveParticles({ mousePos }: { mousePos: React.MutableRefObject<{ x: number; y: number }> }) {
  const ref = useRef<THREE.Points>(null);
  const isDark = useIsDark();
  const count = 400;

  const { basePositions, velocities } = useMemo(() => {
    const base = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      base[i * 3] = (Math.random() - 0.5) * 16;
      base[i * 3 + 1] = (Math.random() - 0.5) * 8;
      base[i * 3 + 2] = (Math.random() - 0.5) * 10;
      vel[i * 3] = vel[i * 3 + 1] = vel[i * 3 + 2] = 0;
    }
    return { basePositions: base, velocities: vel };
  }, []);

  const positions = useMemo(() => new Float32Array(basePositions), [basePositions]);

  useFrame((state) => {
    if (!ref.current) return;
    const geo = ref.current.geometry;
    const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const t = state.clock.getElapsedTime();
    const mx = mousePos.current.x * 5;
    const my = mousePos.current.y * 3;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Spring back to base
      const dx = basePositions[i3] - arr[i3];
      const dy = basePositions[i3 + 1] - arr[i3 + 1];
      const dz = basePositions[i3 + 2] - arr[i3 + 2];
      velocities[i3] += dx * 0.008;
      velocities[i3 + 1] += dy * 0.008;
      velocities[i3 + 2] += dz * 0.008;

      // Mouse repulsion
      const pmx = arr[i3] - mx;
      const pmy = arr[i3 + 1] - my;
      const dist = Math.sqrt(pmx * pmx + pmy * pmy);
      if (dist < 2.5) {
        const force = (2.5 - dist) * 0.015;
        velocities[i3] += (pmx / dist) * force;
        velocities[i3 + 1] += (pmy / dist) * force;
      }

      // Damping
      velocities[i3] *= 0.92;
      velocities[i3 + 1] *= 0.92;
      velocities[i3 + 2] *= 0.92;

      arr[i3] += velocities[i3];
      arr[i3 + 1] += velocities[i3 + 1] + Math.sin(t * 0.5 + i * 0.1) * 0.0008;
      arr[i3 + 2] += velocities[i3 + 2];
    }
    posAttr.needsUpdate = true;
    ref.current.rotation.y = t * 0.008;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.014} color={isDark ? "#c4a882" : "#6b4c2a"} transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

/* ── Floating shapes ── */
function FloatingShapes() {
  const isDark = useIsDark();
  const color = isDark ? "#c4a882" : "#6b4c2a";
  const glassColor = isDark ? "#e8d5bf" : "#8b6e50";

  return (
    <>
      <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh position={[-3.8, 1.5, -1]}>
          <sphereGeometry args={[0.35, 64, 64]} />
          <meshPhysicalMaterial color={glassColor} metalness={0} roughness={0} transmission={0.95} thickness={0.5} ior={1.5} transparent opacity={0.6} envMapIntensity={2} />
        </mesh>
      </Float>
      <Float speed={1.5} rotationIntensity={0.6} floatIntensity={0.6}>
        <mesh position={[4.2, 1.0, -2]}>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} wireframe />
        </mesh>
      </Float>
      <Float speed={2} rotationIntensity={0.8} floatIntensity={0.8}>
        <mesh position={[3.5, -1.2, -1.5]}>
          <octahedronGeometry args={[0.22]} />
          <meshPhysicalMaterial color={color} metalness={0.95} roughness={0.05} clearcoat={1} />
        </mesh>
      </Float>
      <Float speed={0.8} rotationIntensity={0.3} floatIntensity={0.4}>
        <mesh position={[-3.2, -1.8, -0.8]}>
          <torusKnotGeometry args={[0.15, 0.04, 128, 16, 2, 3]} />
          <meshPhysicalMaterial color={color} metalness={0.9} roughness={0.1} clearcoat={0.5} />
        </mesh>
      </Float>
      <Float speed={1.8} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[-2.0, 2.0, -2.5]}>
          <icosahedronGeometry args={[0.2]} />
          <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} wireframe />
        </mesh>
      </Float>
      <Float speed={0.6} rotationIntensity={0.1} floatIntensity={0.3}>
        <mesh position={[2.8, 2.2, -3]} rotation={[0, 0, Math.PI / 6]}>
          <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
        </mesh>
      </Float>

      <OrbitRing radius={3.5} speed={0.08} tilt={Math.PI / 5} thickness={0.008} />
      <OrbitRing radius={4.2} speed={-0.05} tilt={-Math.PI / 7} thickness={0.005} />
      <OrbitRing radius={2.8} speed={0.03} tilt={Math.PI / 3} thickness={0.004} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshPhysicalMaterial color={isDark ? "#0f0d0b" : "#f5f0ea"} metalness={0.1} roughness={0.6} transparent opacity={0.4} />
      </mesh>
      <gridHelper args={[30, 60, isDark ? "#2a241e" : "#d4cdc4", isDark ? "#1a1610" : "#ebe5dc"]} position={[0, -2.19, 0]} />
    </>
  );
}

/* ── Volumetric light beams ── */
function LightBeams() {
  const isDark = useIsDark();
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => { if (ref.current) ref.current.rotation.y = state.clock.getElapsedTime() * 0.02; });
  const beamColor = isDark ? "#c4a882" : "#8b6e50";
  return (
    <group ref={ref}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 3, 0]} rotation={[0, (Math.PI * 2 / 3) * i, Math.PI / 8 + i * 0.05]}>
          <planeGeometry args={[0.03, 8]} />
          <meshBasicMaterial color={beamColor} transparent opacity={0.03} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Scene ── */
function Scene({ mousePos, scrollProgress }: { mousePos: React.MutableRefObject<{ x: number; y: number }>; scrollProgress: number }) {
  const { camera } = useThree();
  const isDark = useIsDark();
  const targetZ = useRef(6);

  useEffect(() => { camera.position.set(0, 0.4, 6); }, [camera]);

  useFrame(() => {
    // Scroll-driven zoom
    targetZ.current = 6 - scrollProgress * 2.5;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ.current, 0.04);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mousePos.current.x * 0.3, 0.02);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.4 + mousePos.current.y * 0.15 - scrollProgress * 0.5, 0.02);
    camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, scrollProgress * -0.08, 0.03);
  });

  const fogColor = isDark ? "#0a0908" : "#f5f0ea";

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[8, 8, 5]} intensity={1.5} castShadow color="#fff8f0" />
      <directionalLight position={[-5, 3, -3]} intensity={0.5} color="#c4a882" />
      <pointLight position={[0, 4, 3]} intensity={0.8} color="#fff5e6" distance={12} decay={2} />
      <pointLight position={[-4, -1, 2]} intensity={0.3} color="#c4a882" distance={8} decay={2} />
      <spotLight position={[0, 6, 0]} angle={0.4} penumbra={1} intensity={0.4} color="#fff5e6" />

      <StudioText mousePos={mousePos} />
      <FloatingShapes />
      <InteractiveParticles mousePos={mousePos} />
      <LightBeams />

      <Environment preset="studio" environmentIntensity={0.4} />
      <fog attach="fog" args={[fogColor, 6, 20]} />
    </>
  );
}

/* ── Fallback ── */
function CanvasFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="font-display text-[clamp(4rem,12vw,10rem)] text-foreground/5 leading-none select-none">KIM</div>
    </div>
  );
}

/* ── Exported Hero Component ── */
export function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const [canRender, setCanRender] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) setCanRender(false);
    } catch { setCanRender(false); }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const vh = window.innerHeight;
      setScrollProgress(Math.min(window.scrollY / vh, 1));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mousePos.current = {
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
    };
  }, []);

  if (!canRender) return <CanvasFallback />;

  return (
    <div ref={containerRef} onMouseMove={handleMouseMove} className="absolute inset-0 z-[1]">
      <Suspense fallback={<CanvasFallback />}>
        <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} style={{ background: "transparent" }} shadows>
          <Scene mousePos={mousePos} scrollProgress={scrollProgress} />
        </Canvas>
      </Suspense>
    </div>
  );
}
