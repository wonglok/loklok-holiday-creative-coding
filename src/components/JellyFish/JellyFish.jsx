import {
  Environment,
  MeshRefractionMaterial,
  MeshTransmissionMaterial,
  OrbitControls,
  PerspectiveCamera,
  useGLTF,
} from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { Suspense, useEffect, useMemo } from 'react'
import { AnimationMixer, MeshBasicMaterial } from 'three'

export function JellyFish() {
  return (
    <>
      <Canvas>
        <Suspense fallback={null}>
          <JellyYo></JellyYo>
        </Suspense>
        <color attach={'background'} args={['#000000']}></color>
        <PerspectiveCamera makeDefault></PerspectiveCamera>
        <OrbitControls makeDefault object-position={[0, 0, 1]} target={[0, 0, 0]}></OrbitControls>
        <EffectComposer>
          <Bloom mipmapBlur intensity={0.5} luminanceThreshold={0.5}></Bloom>
        </EffectComposer>
        <Environment files={`/hdr/kloofendal_48d_partly_cloudy_puresky_1k.hdr`}></Environment>
      </Canvas>
    </>
  )
}

function JellyYo() {
  let glb = useGLTF(`/jellyfish/jellyfish.glb`)
  let mixer = useMemo(() => new AnimationMixer(glb.scene), [glb])
  useFrame((_, dt) => {
    mixer.update(dt)
  })
  useEffect(() => {
    mixer.clipAction(glb.animations[2], glb.scene).play()
  }, [mixer, glb])

  let items = []
  glb?.scene?.traverse((it) => {
    if (it.material) {
      let mat = it.material
      items.push(
        <primitive key={it.uuid} object={it}>
          <MeshTransmissionMaterial
            key={mat.uuid}
            transmission={1}
            thickness={2}
            backside={true}
            backsideThickness={2}
            backsideResolution={1024}
            roughness={0.0}
            chromaticAberration={0.05}
            alphaMap={mat.map}
            color={'#ffffff'}
            transparent
            envMapIntensity={1.5}
            emissive={mat.emissive}
            emissiveMap={mat.emissiveMap}
            emissiveIntensity={20.5}
            samples={3}
          ></MeshTransmissionMaterial>
        </primitive>,
      )
    }
  })

  return (
    <>
      {items}
      <primitive object={glb.scene}></primitive>
    </>
  )
}
