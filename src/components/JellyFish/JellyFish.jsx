import {
  Environment,
  MeshRefractionMaterial,
  MeshTransmissionMaterial,
  OrbitControls,
  PerspectiveCamera,
  StatsGl,
  useGLTF,
} from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { Suspense, useEffect, useMemo } from 'react'
import { AnimationMixer, BackSide, DoubleSide, FrontSide, MeshBasicMaterial } from 'three'

export function JellyFish() {
  return (
    <>
      <Canvas>
        <Suspense fallback={null}>
          <JellyYo></JellyYo>
        </Suspense>
        <color attach={'background'} args={['#000000']}></color>
        <PerspectiveCamera makeDefault></PerspectiveCamera>
        <OrbitControls makeDefault object-position={[0, 0.35, 1]} target={[0, 0, 0]}></OrbitControls>
        <EffectComposer disableNormalPass multisampling={2}>
          <Bloom mipmapBlur intensity={0.5} luminanceThreshold={0.3}></Bloom>
        </EffectComposer>
        <StatsGl></StatsGl>
        <Environment background files={`/hdr/kloofendal_48d_partly_cloudy_puresky_1k.hdr`}></Environment>
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

  let { items } = useMemo(() => {
    let items = []
    glb?.scene?.traverse((it) => {
      if (it.material) {
        let mat = it.material
        if (it.name === 'JF_skin_in') {
          items.push(
            <primitive key={it.uuid} object={it}>
              <MeshTransmissionMaterial
                reflectivity={1}
                key={mat.uuid}
                side={FrontSide}
                transmission={1}
                thickness={2}
                metalness={0.05}
                backside={true}
                backsideThickness={0.9}
                backsideResolution={1024}
                roughness={0.0}
                chromaticAberration={0.25}
                map={mat.map}
                alphaMap={mat.alphaMap}
                color={'#ffffff'}
                distortion={0.5}
                distortionScale={0.15}
                temporalDistortion={0.15}
                transparent
                envMapIntensity={1.6}
                emissive={mat.emissive}
                emissiveMap={mat.emissiveMap}
                emissiveIntensity={20.5}
                samples={3}
              ></MeshTransmissionMaterial>
            </primitive>,
          )
        }
        if (it.name === 'JF_skin_tentacles') {
          items.push(
            <primitive key={it.uuid} object={it}>
              <MeshTransmissionMaterial
                reflectivity={1}
                key={mat.uuid}
                side={DoubleSide}
                transmission={1}
                thickness={2}
                metalness={0.05}
                backside={true}
                backsideThickness={0.9}
                backsideResolution={1024}
                roughness={0.2}
                chromaticAberration={0.25}
                map={mat.map}
                alphaMap={mat.alphaMap}
                color={'#ffffff'}
                distortion={0.5}
                distortionScale={0.15}
                temporalDistortion={0.15}
                transparent
                envMapIntensity={1.6}
                emissive={mat.emissive}
                emissiveMap={mat.emissiveMap}
                emissiveIntensity={20.5}
                samples={3}
              ></MeshTransmissionMaterial>
            </primitive>,
          )
        }
      }
    })

    return { items }
  }, [glb?.scene])

  return (
    <>
      <group
        onClick={(ev) => {
          console.log(ev.object.name)
        }}
      >
        {items}
        <primitive object={glb.scene}></primitive>
      </group>
    </>
  )
}
