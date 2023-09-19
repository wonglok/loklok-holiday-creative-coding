import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo } from 'react'
import { Runner } from './Rigged/Runner'
import { Box, Environment, OrbitControls, Stats, useFBX, useGLTF } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { Color } from 'three'
import { FBXLoader } from 'three-stdlib'

export function FuseDance() {
  return (
    <Canvas>
      <BG></BG>
      <Suspense fallback={null}>
        <SkinnedParticles
          motionURLs={[
            `/fuse/mixa-motion/dance-flair.fbx`,
            `/fuse/mixa-motion/dance-locking-2.fbx`,
            `/fuse/mixa-motion/rallying.fbx`,

            `/fuse/mixa-motion/dance-hiphop-1.fbx`,
            `/fuse/mixa-motion/dance-locking.fbx`,
            `/fuse/mixa-motion/dance-slide.fbx`,
            `/fuse/mixa-motion/dance-tut-hiphop.fbx`,
            `/fuse/mixa-motion/dance-wave-1.fbx`,
            `/fuse/mixa-motion/dance-wave-2.fbx`,

            // `/fuse/mixa-motion/energy-02.fbx`,
            // `/fuse/mixa-motion/energy-01.fbx`,
            // // `/fuse/mixa-motion/mma-warmup.fbx`,
            // `/fuse/mixa-motion/rallying.fbx`,
            // `/fuse/mixa-motion/mma-taunt2.fbx`,
            // `/fuse/mixa-motion/mma-kick4-side.fbx`,

            // `/fuse/mixa-motion/mma-warmup.fbx`,
            // `/fuse/mixa-motion/mma-kick1.fbx`,
            // `/fuse/mixa-motion/mma-kick2.fbx`,
            // `/fuse/mixa-motion/mma-kick3.fbx`,
            // `/fuse/mixa-motion/mma-quad-punch.fbx`,
            // `/fuse/mixa-motion/mma-taunt.fbx`,
            // `/fuse/mixa-motion/mma-idle.fbx`,
          ]}
          url={`/fuse/T-Pose.fbx`}
        ></SkinnedParticles>
      </Suspense>
      <OrbitControls makeDefault object-position={[0, 1, 3]} target={[0, 1, 0]} />
      <EffectComposer disableNormalPass multisampling={0}>
        <Bloom mipmapBlur intensity={2.5} luminanceThreshold={0.5} />
      </EffectComposer>
      <Stats></Stats>
      <directionalLight></directionalLight>
      <Environment files={`/hdr/shanghai.hdr`}></Environment>
    </Canvas>
  )
}

function SkinnedParticles({ motionURLs = [`/fuse/mixa-motion/mma-kick4-side.fbx`], url = `/wings/wing1.glb` }) {
  let fbx = useFBX(url)

  fbx.scale.setScalar(0.01)
  fbx.updateMatrixWorld(true)
  let glb = fbx
  glb.scene = fbx

  let gl = useThree((r) => r.gl)
  let { compos, runner } = useMemo(() => {
    if (!glb || !gl) {
      return { compos: null, runner: false }
    }

    let fbxs = motionURLs.map((r) => {
      return new Promise((resolve, reject) => {
        new FBXLoader().loadAsync(r).then((fbx) => {
          resolve({
            url: r,
            clip: fbx?.animations[0],
          })
        })
      })
    })

    let runner = new Runner({ glb, motionPromises: fbxs, gl })

    return { runner, compos: <primitive object={runner}></primitive> }
  }, [glb, gl, motionURLs])

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
