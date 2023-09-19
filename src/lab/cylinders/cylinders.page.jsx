import {
  Cylinder,
  Environment,
  MeshTransmissionMaterial,
  OrbitControls,
  PerspectiveCamera,
  Stars,
  Text,
  Text3D,
} from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, SSR } from '@react-three/postprocessing'
import { useRef } from 'react'
import { font } from './font'
// import json from '../../../public/susaye/Cronos Pro Light_Regular.json'

export function Cylinders() {
  return (
    <>
      <div className='h-full w-full'>
        <Canvas>
          <Content></Content>
          <Environment background files={'/hdr/shanghai.hdr'}></Environment>
          <PerspectiveCamera makeDefault fov={65} position={[0, 0, -80]}></PerspectiveCamera>
          <OrbitControls
            autoRotate
            autoRotateSpeed={1}
            makeDefault
            enablePan={false}
            enableRotate={false}
            maxDistance={200}
            minDistance={20}
            object-position={[0, 0, -80]}
            target={[0, 0, 0]}
          ></OrbitControls>
        </Canvas>
      </div>
      {/*  */}
      {/*  */}
    </>
  )
}

function Content() {
  return (
    <>
      <CylinderWall></CylinderWall>
    </>
  )
}

function CylinderWall() {
  let ref = useRef()

  useFrame(({ camera }) => {
    ref.current.lookAt(camera.position)

    let i = 0

    let str = '123456789012345678901234567890'
    let n = str.length
    ref.current.traverse((it) => {
      if (it.geometry) {
        it.scale.z = 0.75 * (Math.sin(performance.now() / 1000 + (i / n) * 2 * 3.1415) * 0.5 + 0.5) + 0.75
        i++
      }
    })
  })

  return (
    <>
      <group ref={ref}>
        <group rotation={[0, 0, Math.PI * 1]}>
          {'123456789012345678901234567890'
            .split('')
            .fill(0)
            .map((r, i, a) => {
              //
              //
              return (
                <Cylinder
                  key={i + 'c'}
                  position={[(i - a.length * 0.5) * 2 * 7, 0, 0]}
                  args={[7, 7, 500, 32, 1]}
                  rotation={[0, 0, 0]}
                >
                  <MeshTransmissionMaterial
                    color={'#ffffff'}
                    transmission={1}
                    thickness={5.333 * 15}
                    ior={2.485}
                    // distortion={2}
                    // distortionScale={0.2}
                    chromaticAberration={0.2}
                    transmissionSampler
                    metalness={0.3}
                    roughness={0.3}
                    reflectivity={0.75}
                  ></MeshTransmissionMaterial>
                </Cylinder>
              )
            })}
        </group>

        {/* 
        <Text
          font={`/susaye/Cronos-Pro-Light.ttf`}
          textAlign='center'
          fontSize={30}
          bevelEnabled
          color={'#000000'}
          position={[0, 0, 50]}
        >
          Lok Lok
        </Text> */}
      </group>

      <EffectComposer disableNormalPass multisampling={4}>
        <Bloom luminanceThreshold={0.75} intensity={0.1} mipmapBlur></Bloom>
      </EffectComposer>
    </>
  )
}
