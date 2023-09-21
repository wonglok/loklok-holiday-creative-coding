import { Box, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { NoodleEntry } from './NoodleCompos/NoodleEntry'
import { Group } from 'three'
import { Bloom, EffectComposer } from '@react-three/postprocessing'

export function Page() {
  return (
    <>
      {/*  */}

      <Canvas>
        <color attach={'background'} args={['#333333']}></color>
        <Yo></Yo>

        <OrbitControls object-position={[0, 1.3, 20]} target={[0, 1.3, 0]} makeDefault></OrbitControls>

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

  let { compos, works } = useMemo(() => {
    let works = []
    let core = new Group()
    core.gl = gl
    core.onLoop = (v) => {
      works.push(v)
    }

    let noodle = new NoodleEntry({
      core: core,
    })
    core.add(noodle)

    return {
      works,
      compos: <primitive key={core.uuid} object={core}></primitive>,
    }
  }, [gl])

  useFrame((st, dt) => {
    works.forEach((fnc) => {
      fnc(st, dt)
    })
  })

  return (
    <>
      {/*  */}
      {compos}

      {/*  */}
    </>
  )
}
