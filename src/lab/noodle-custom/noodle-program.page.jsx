import { Box, MeshDiscardMaterial, OrbitControls, Plane } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { NoodleEntry } from './NoodleCompos/NoodleEntry'
import { Group, Object3D } from 'three'
import { Bloom, EffectComposer } from '@react-three/postprocessing'

export function Page() {
  return (
    <>
      {/*  */}

      <Canvas>
        <color attach={'background'} args={['#333333']}></color>
        <Yo></Yo>

        <OrbitControls object-position={[0, 0, 10]} target={[0, 0, 0]} makeDefault></OrbitControls>

        <EffectComposer disableNormalPass>
          <Bloom mipmapBlur intensity={2} luminanceThreshold={0.1}></Bloom>
        </EffectComposer>
      </Canvas>

      {/*  */}
    </>
  )
}

function Yo() {
  let gl = useThree((r) => r.gl)

  let { mouse, compos, works } = useMemo(() => {
    let works = []
    let core = new Group()
    core.gl = gl
    core.onLoop = (v) => {
      works.push(v)
    }
    core.mouseObject = new Object3D()

    let noodle = new NoodleEntry({
      core: core,
    })
    core.add(noodle)

    return {
      works,
      mouse: core.mouseObject,
      compos: <primitive key={core.uuid} object={core}></primitive>,
    }
  })

  useFrame((st, dt) => {
    works.forEach((fnc) => {
      fnc(st, dt)
    })
  })

  return (
    <>
      {/*  */}
      {compos}

      <Mouse mouse={mouse}></Mouse>
      {/*  */}
    </>
  )
}

function Mouse({ mouse }) {
  let ref = useRef()
  useFrame(({ camera }) => {
    if (ref.current) {
      ref.current.lookAt(camera.position)
    }
  })
  return (
    <Plane
      args={[10000, 10000]}
      ref={ref}
      onPointerOver={({ point }) => {
        mouse.position.copy(point)
      }}
      onPointerMove={({ point }) => {
        mouse.position.copy(point)
      }}
    >
      <MeshDiscardMaterial></MeshDiscardMaterial>
      {/* <meshBasicMaterial attach={'material'} color={'green'}></meshBasicMaterial> */}
    </Plane>
  )
}
