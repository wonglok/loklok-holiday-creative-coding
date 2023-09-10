import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import { Runner } from './Rigged/Runner'
import { Box, Environment, OrbitControls, useGLTF } from '@react-three/drei'

export function ParticleWing() {
  return (
    <Canvas>
      <Environment files={`/hdr/shanghai.hdr`}></Environment>
      <Content></Content>
      <OrbitControls makeDefault object-position={[0, 0, 100]} target={[0, 0, 0]} />
    </Canvas>
  )
}
function Content() {
  let glb = useGLTF(`/wings/wing1.glb`)
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
  //
  return (
    <>
      {/*  */}
      {compos}

      {/* <Box position={[1, 0, 0]}>
        <meshBasicMaterial color={'red'}></meshBasicMaterial>
      </Box> */}

      {/*  */}
    </>
  )
}
