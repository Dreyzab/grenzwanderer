import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getSkillCheckVoicePalette } from "../skillCheckPalette";
import type { VnDiceMode } from "../types";

export type VnSkillCheckDicePhase = "arming" | "rolling" | "impact" | "result";

interface VnSkillCheckDiceSceneProps {
  diceMode: VnDiceMode;
  voiceId: string;
  phase: VnSkillCheckDicePhase;
  passed?: boolean;
}

type DiceMeshProps = VnSkillCheckDiceSceneProps;

const buildPhaseTargets = (
  phase: VnSkillCheckDicePhase,
  passed: boolean,
): {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
} => {
  if (phase === "arming") {
    return {
      position: new THREE.Vector3(-0.72, 0.28, 0.24),
      rotation: new THREE.Euler(0.45, -0.32, 0.18),
      scale: new THREE.Vector3(0.98, 0.98, 0.98),
    };
  }
  if (phase === "rolling") {
    return {
      position: new THREE.Vector3(0.08, 0.46, 0),
      rotation: new THREE.Euler(1.4, 1.8, 0.8),
      scale: new THREE.Vector3(1.02, 1.02, 1.02),
    };
  }
  if (phase === "impact") {
    return {
      position: new THREE.Vector3(0, passed ? -0.18 : -0.24, 0),
      rotation: passed
        ? new THREE.Euler(2.1, -0.3, 0.24)
        : new THREE.Euler(2.45, 0.52, -0.34),
      scale: passed
        ? new THREE.Vector3(1.08, 1.08, 1.08)
        : new THREE.Vector3(0.97, 0.97, 0.97),
    };
  }

  return {
    position: new THREE.Vector3(0, passed ? -0.12 : -0.18, 0),
    rotation: passed
      ? new THREE.Euler(2.12, -0.22, 0.16)
      : new THREE.Euler(2.34, 0.38, -0.2),
    scale: new THREE.Vector3(1, 1, 1),
  };
};

const D20Die = ({
  materialProps,
}: {
  materialProps: JSX.IntrinsicElements["meshStandardMaterial"];
}) => (
  <mesh castShadow receiveShadow>
    <icosahedronGeometry args={[0.86, 0]} />
    <meshStandardMaterial {...materialProps} />
  </mesh>
);

const D10Die = ({
  materialProps,
}: {
  materialProps: JSX.IntrinsicElements["meshStandardMaterial"];
}) => (
  <group>
    <mesh castShadow receiveShadow position={[0, 0.34, 0]}>
      <cylinderGeometry args={[0, 0.82, 0.82, 10, 1, false]} />
      <meshStandardMaterial {...materialProps} />
    </mesh>
    <mesh
      castShadow
      receiveShadow
      position={[0, -0.34, 0]}
      rotation={[Math.PI, 0, 0]}
    >
      <cylinderGeometry args={[0, 0.82, 0.82, 10, 1, false]} />
      <meshStandardMaterial {...materialProps} />
    </mesh>
  </group>
);

const DiceMesh = ({ diceMode, voiceId, phase, passed }: DiceMeshProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const phaseStartedAtRef = useRef(0);
  const palette = useMemo(() => getSkillCheckVoicePalette(voiceId), [voiceId]);
  const target = useMemo(
    () => buildPhaseTargets(phase, Boolean(passed)),
    [passed, phase],
  );

  useEffect(() => {
    phaseStartedAtRef.current = performance.now();
  }, [phase]);

  useFrame((_state, delta) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    const elapsed = (performance.now() - phaseStartedAtRef.current) / 1000;
    const bobOffset = phase === "rolling" ? Math.sin(elapsed * 7.5) * 0.14 : 0;
    const rollSpinX = phase === "rolling" ? delta * 7.4 : 0;
    const rollSpinY = phase === "rolling" ? delta * 9.2 : 0;
    const rollSpinZ = phase === "rolling" ? delta * 5.6 : 0;

    if (phase === "rolling") {
      group.rotation.x += rollSpinX;
      group.rotation.y += rollSpinY;
      group.rotation.z += rollSpinZ;
    }

    group.position.lerp(
      new THREE.Vector3(
        target.position.x,
        target.position.y + bobOffset,
        target.position.z,
      ),
      Math.min(1, delta * 5.4),
    );
    group.scale.lerp(target.scale, Math.min(1, delta * 5.8));
    group.rotation.x = THREE.MathUtils.lerp(
      group.rotation.x,
      target.rotation.x,
      Math.min(1, delta * 2.8),
    );
    group.rotation.y = THREE.MathUtils.lerp(
      group.rotation.y,
      target.rotation.y,
      Math.min(1, delta * 2.8),
    );
    group.rotation.z = THREE.MathUtils.lerp(
      group.rotation.z,
      target.rotation.z,
      Math.min(1, delta * 2.8),
    );

    if (pointLightRef.current) {
      pointLightRef.current.intensity =
        phase === "impact"
          ? 3.8
          : phase === "result"
            ? 2.6
            : phase === "rolling"
              ? 2.1
              : 1.5;
    }
  });

  const materialProps = {
    color: palette.text,
    emissive: palette.accent,
    emissiveIntensity:
      phase === "impact" ? 0.8 : phase === "result" ? 0.5 : 0.28,
    metalness: 0.36,
    roughness: 0.28,
  } satisfies JSX.IntrinsicElements["meshStandardMaterial"];

  return (
    <group ref={groupRef} position={[-0.72, 0.28, 0.24]}>
      <pointLight
        ref={pointLightRef}
        position={[0, 1.1, 1.6]}
        color={palette.accent}
        intensity={1.5}
        distance={5}
      />
      {diceMode === "d10" ? (
        <D10Die materialProps={materialProps} />
      ) : (
        <D20Die materialProps={materialProps} />
      )}
    </group>
  );
};

export const VnSkillCheckDiceScene = ({
  diceMode,
  voiceId,
  phase,
  passed,
}: VnSkillCheckDiceSceneProps) => {
  const palette = useMemo(() => getSkillCheckVoicePalette(voiceId), [voiceId]);
  const frameLoop = phase === "result" ? "demand" : "always";

  return (
    <div
      className="vn-check-resolve__dice-shell"
      data-testid="vn-skill-dice-scene"
    >
      <Canvas
        camera={{ position: [0, 0, 3.8], fov: 34 }}
        dpr={[1, 1.5]}
        frameloop={frameLoop}
        gl={{ alpha: true, antialias: true }}
        shadows
      >
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#020202", 4.8, 9]} />
        <ambientLight intensity={0.85} color="#f8f1e3" />
        <directionalLight
          position={[2.4, 2.8, 3]}
          intensity={1.55}
          color="#fff9f2"
          castShadow
        />
        <directionalLight
          position={[-2.8, -1.4, 2.4]}
          intensity={1.15}
          color={palette.accent}
        />
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.08, 0]}
          receiveShadow
        >
          <circleGeometry args={[2.4, 40]} />
          <meshBasicMaterial
            color={palette.glowStrong}
            transparent
            opacity={0.12}
          />
        </mesh>
        <DiceMesh
          diceMode={diceMode}
          voiceId={voiceId}
          phase={phase}
          passed={passed}
        />
      </Canvas>
    </div>
  );
};

export default VnSkillCheckDiceScene;
