import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text3D, Center, Float, Environment, MeshTransmissionMaterial } from "@react-three/drei";
import { Suspense, useRef, useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import { useTheme } from "next-themes";

/* ── Animated 3D Studio Name ── */
function StudioText({ text = "KIM", mousePos }: { text?: string; mousePos: React.MutableRefObject<{ x: number; y: number }> }) {
  const meshRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    // Gentle breathing
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      mousePos.current.x * 0.15,
      0.03
    );
    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      mousePos.current.y * -0.08,
      0.03
    );
    meshRef.current.position.y = Math.sin(t * 0.4) * 0.05;
  });

  const color = isDark ? "#c4a882" : "#6b4c2a";
  const emissive = isDark ? "#3d2e1a" : "#1a1008";

  return (
    <group ref={meshRef}>
      <Center>
        <Text3D
          font="/fonts/helvetiker_bold.typeface.json"
          size={1.8}
          height={0.4}
          bevelEnabled
          bevelThickness={0.03}
          bevelSize={0.02}
          bevelSegments={8}
          curveSegments={32}
        >
          {text}
          <meshStandardMaterial
            ref={materialRef}
            color={color}
            metalness={0.85}
            roughness={0.15}
            emissive={emissive}
            emissiveIntensity={0.1}
          />
        </Text3D>
      </Center>
    </group>
  );
}

/* ── Floating accent shapes ── */
function FloatingShapes() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const color = isDark ? "#c4a882" : "#6b4c2a";

  return (
    <>
      <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh position={[-3.5, 1.2, -1.5]}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} wireframe />
        </mesh>
      </Float>
      <Float speed={2} rotationIntensity={0.6} floatIntensity={0.8}>
        <mesh position={[3.8, -0.8, -2]}>
          <octahedronGeometry args={[0.25]} />
          <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} wireframe />
        </mesh>
      </Float>
      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.5}>
        <mesh position={[2.5, 1.8, -1]}>
          <torusGeometry args={[0.2, 0.06, 16, 32]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
        </mesh>
      </Float>
      <Float speed={1.8} rotationIntensity={0.5} floatIntensity={0.4}>
        <mesh position={[-2.8, -1.5, -0.5]}>
          <icosahedronGeometry args={[0.18]} />
          <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} wireframe />
        </mesh>
      </Float>
      {/* Ground plane with grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.8, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color={isDark ? "#1a1614" : "#f0ebe4"} metalness={0} roughness={1} transparent opacity={0.5} />
      </mesh>
      <gridHelper args={[20, 40, isDark ? "#2a241e" : "#d4cdc4", isDark ? "#1f1a15" : "#e8e2da"]} position={[0, -1.79, 0]} />
    </>
  );
}

/* ── Particle field ── */
function ParticleField() {
  const ref = useRef<THREE.Points>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const particles = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[particles, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color={isDark ? "#c4a882" : "#6b4c2a"}
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

/* ── Scene ── */
function Scene({ mousePos }: { mousePos: React.MutableRefObject<{ x: number; y: number }> }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0.3, 5.5);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#c4a882" />
      <pointLight position={[0, 3, 2]} intensity={0.6} color="#fff5e6" />
      <StudioText mousePos={mousePos} />
      <FloatingShapes />
      <ParticleField />
      <Environment preset="studio" environmentIntensity={0.3} />
      <fog attach="fog" args={["#000000", 8, 18]} />
    </>
  );
}

/* ── Fallback for non-WebGL / loading ── */
function CanvasFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="font-display text-[clamp(4rem,12vw,10rem)] text-foreground/5 leading-none select-none">
        KIM
      </div>
    </div>
  );
}

/* ── Exported Hero Component ── */
export function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const [canRender, setCanRender] = useState(true);

  useEffect(() => {
    // Check for WebGL support
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) setCanRender(false);
    } catch {
      setCanRender(false);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mousePos.current = {
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
    };
  };

  if (!canRender) return <CanvasFallback />;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="absolute inset-0 z-[1]"
    >
      <Suspense fallback={<CanvasFallback />}>
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <Scene mousePos={mousePos} />
        </Canvas>
      </Suspense>
    </div>
  );
}