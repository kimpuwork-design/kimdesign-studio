import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text3D, Center, Float } from "@react-three/drei";
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
          size={2.2} height={0.5}
          bevelEnabled bevelThickness={0.03} bevelSize={0.02}
          bevelSegments={4} curveSegments={16}
        >
          KIM
          <meshStandardMaterial
            color={isDark ? "#d4b896" : "#5a3e22"}
            metalness={0.85} roughness={0.2}
          />
        </Text3D>
      </Center>
    </group>
  );
}

/* ── Orbit ring ── */
function OrbitRing({ radius, speed, tilt, thickness }: { radius: number; speed: number; tilt: number; thickness: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const isDark = useIsDark();
  useFrame((state) => { if (ref.current) ref.current.rotation.z = state.clock.getElapsedTime() * speed; });
  return (
    <mesh ref={ref} rotation={[tilt, 0, 0]}>
      <torusGeometry args={[radius, thickness, 8, 64]} />
      <meshStandardMaterial color={isDark ? "#c4a882" : "#6b4c2a"} metalness={0.9} roughness={0.1} transparent opacity={0.12} />
    </mesh>
  );
}

/* ── Particle field — light ── */
function Particles({ mousePos, count }: { mousePos: React.MutableRefObject<{ x: number; y: number }>; count: number }) {
  const ref = useRef<THREE.Points>(null);
  const isDark = useIsDark();

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.rotation.y = t * 0.02 + mousePos.current.x * 0.05;
    ref.current.rotation.x = mousePos.current.y * 0.03;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.018} color={isDark ? "#c4a882" : "#6b4c2a"} transparent opacity={0.45} sizeAttenuation />
    </points>
  );
}

/* ── Floating shapes ── */
function FloatingShapes() {
  const isDark = useIsDark();
  const color = isDark ? "#c4a882" : "#6b4c2a";

  return (
    <>
      <Float speed={1.5} rotationIntensity={0.6} floatIntensity={0.6}>
        <mesh position={[4.0, 1.0, -2]}>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} wireframe />
        </mesh>
      </Float>
      <Float speed={2} rotationIntensity={0.8} floatIntensity={0.8}>
        <mesh position={[3.3, -1.2, -1.5]}>
          <octahedronGeometry args={[0.22]} />
          <meshStandardMaterial color={color} metalness={0.9} roughness={0.15} />
        </mesh>
      </Float>
      <Float speed={1.8} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[-2.0, 2.0, -2.5]}>
          <icosahedronGeometry args={[0.2]} />
          <meshStandardMaterial color={color} metalness={0.85} roughness={0.15} wireframe />
        </mesh>
      </Float>

      <OrbitRing radius={3.5} speed={0.08} tilt={Math.PI / 5} thickness={0.008} />
      <OrbitRing radius={4.2} speed={-0.05} tilt={-Math.PI / 7} thickness={0.005} />
    </>
  );
}

/* ── Scene ── */
function Scene({ mousePos, scrollProgress, particleCount }: { mousePos: React.MutableRefObject<{ x: number; y: number }>; scrollProgress: number; particleCount: number }) {
  const { camera } = useThree();
  const isDark = useIsDark();

  useEffect(() => { camera.position.set(0, 0.4, 6); }, [camera]);

  useFrame(() => {
    const targetZ = 6 - scrollProgress * 2.2;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.04);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mousePos.current.x * 0.3, 0.02);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.4 + mousePos.current.y * 0.15 - scrollProgress * 0.4, 0.02);
  });

  const fogColor = isDark ? "#0a0908" : "#f5f0ea";

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[8, 8, 5]} intensity={1.2} color="#fff8f0" />
      <pointLight position={[0, 4, 3]} intensity={0.5} color="#fff5e6" distance={12} decay={2} />

      <StudioText mousePos={mousePos} />
      <FloatingShapes />
      <Particles mousePos={mousePos} count={particleCount} />

      <fog attach="fog" args={[fogColor, 6, 18]} />
    </>
  );
}

/* ── Fallback ── */
function CanvasFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="font-display text-[clamp(4rem,12vw,10rem)] text-foreground/10 leading-none select-none tracking-tight">KIM</div>
    </div>
  );
}

/* ── Exported Hero Component ── */
export function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const [mode, setMode] = useState<"loading" | "full" | "lite" | "off">("loading");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const lowMem = (navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4;
    const lowCpu = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    const small = window.innerWidth < 768;

    if (reduce) { setMode("off"); return; }

    let webgl = false;
    try {
      const c = document.createElement("canvas");
      webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch { webgl = false; }
    if (!webgl) { setMode("off"); return; }

    if (coarse || small || lowMem || lowCpu) setMode("lite");
    else setMode("full");
  }, []);

  // Pause when off-screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Scroll progress (rAF-throttled)
  useEffect(() => {
    let raf = 0;
    const update = () => {
      const vh = window.innerHeight;
      setScrollProgress(Math.min(window.scrollY / vh, 1));
      raf = 0;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mousePos.current = {
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
    };
  }, []);

  if (mode === "loading") return <CanvasFallback />;
  if (mode === "off") return <CanvasFallback />;

  const isLite = mode === "lite";
  const particleCount = isLite ? 80 : 220;

  return (
    <div ref={containerRef} onMouseMove={handleMouseMove} className="absolute inset-0 z-[1]">
      <Suspense fallback={<CanvasFallback />}>
        <Canvas
          dpr={isLite ? 1 : [1, 1.5]}
          frameloop={visible ? "always" : "never"}
          gl={{ antialias: !isLite, alpha: true, powerPreference: "high-performance" }}
          style={{ background: "transparent" }}
        >
          <Scene mousePos={mousePos} scrollProgress={scrollProgress} particleCount={particleCount} />
        </Canvas>
      </Suspense>
    </div>
  );
}
