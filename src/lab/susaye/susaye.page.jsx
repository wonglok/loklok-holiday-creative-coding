import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { Runner } from './Rigged/Runner'
import {
  Box,
  Center,
  Environment,
  MeshTransmissionMaterial,
  OrbitControls,
  Stats,
  Text,
  Text3D,
  useGLTF,
} from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { Color } from 'three'

export function SparklingCake() {
  return (
    <Canvas>
      <BG></BG>

      <SkinnedParticles url={`/susaye/cake.glb`}></SkinnedParticles>

      <OrbitControls makeDefault object-position={[0, 30, 150]} target={[0, 30, 0]} />

      <EffectComposer disableNormalPass multisampling={0}>
        <Bloom mipmapBlur intensity={2.5} luminanceThreshold={0.5} />
      </EffectComposer>

      <Stats></Stats>

      <group position={[0, 8 + 75, 0]}>
        <Center>
          <Text size={25} fontSize={25} font={`/susaye/Cronos-Pro-Light.ttf`}>
            Dear Susaye
            <MeshTransmissionMaterial emissive={'#ffaaaa'}></MeshTransmissionMaterial>
          </Text>
        </Center>
      </group>
      <group position={[0, 8 + 100, 0]}>
        <Center>
          <Text size={25} fontSize={25} font={`/susaye/Cronos-Pro-Light.ttf`}>
            Happy Birthday
            <MeshTransmissionMaterial emissive={'#ffaaaa'}></MeshTransmissionMaterial>
          </Text>
        </Center>
      </group>

      <Environment files={`/hdr/shanghai.hdr`}></Environment>
    </Canvas>
  )
}

function SkinnedParticles({ url = `/wings/wing1.glb` }) {
  let glb = useGLTF(url)
  let gl = useThree((r) => r.gl)
  let { compos, runner } = useMemo(() => {
    if (!glb || !gl) {
      return { compos: null, runner: false }
    }

    let runner = new Runner({ glb, gl })

    return { runner, compos: <primitive object={runner}></primitive> }
  }, [glb, gl])

  useFrame((st, dt) => {
    runner?.work(st, dt)
  }, [])
  return (
    <>
      {/*  */}
      {compos}
      {/*  */}
    </>
  )
}

function BG() {
  let scene = useThree((r) => r.scene)
  useEffect(() => {
    scene.background = new Color('#000000')
  }, [scene])
  return null
}

//

//
