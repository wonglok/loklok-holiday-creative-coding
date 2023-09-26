import { Box, Environment, OrbitControls, PerspectiveCamera, Stats } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Sky } from './Sky/Sky'
import { Bloom, EffectComposer, SSR, Vignette } from '@react-three/postprocessing'
import { Color, SRGBColorSpace, sRGBEncoding } from 'three'
import { Core } from './Rain/Core'
import { Rain } from './Rain/Rain'
import { XR, XRButton, useXR } from '@react-three/xr'
import { XRAdapter } from './XRAdapter'
import { useEffect } from 'react'

export function XRFlow() {
  return (
    <div className='h-full w-full'>
      <Canvas
        onCreated={(st) => {
          for (let kn in st) {
            Core.now[kn] = st[kn]
          }
          st.gl.physicallyCorrectLights = true
          st.gl.outputEncoding = sRGBEncoding
          st.gl.outputColorSpace = SRGBColorSpace
        }}
      >
        <XR>
          <color attach={'background'} args={['#000000']}></color>
          <Content></Content>
        </XR>
      </Canvas>

      <div className='absolute bottom-0 left-0 flex w-full items-center justify-center'>
        <div className='mb-5 bg-lime-500 p-2 text-2xl'>
          <XRButton
            /* The type of `XRSession` to create */
            mode={'VR'}
            /**
             * `XRSession` configuration options
             * @see https://immersive-web.github.io/webxr/#feature-dependencies
             * ///, 'layers'
             */
            sessionInit={{
              // requiredFeatures: [],
              requiredFeatures: ['hand-tracking'], // 'bounded-floor', 'plane-detection',
            }}
            /** Whether this button should only enter an `XRSession`. Default is `false` */
            enterOnly={false}
            /** Whether this button should only exit an `XRSession`. Default is `false` */
            exitOnly={false}
            /** This callback gets fired if XR initialization fails. */
            onError={(error) => {}}
          >
            {/* Can accept regular DOM children and has an optional callback with the XR button status (unsupported, exited, entered) */}
            {(status) => (status === 'unsupported' ? `Enter World` : `Enter World`)}
          </XRButton>
        </div>
      </div>
    </div>
  )
}

function Content() {
  return (
    <>
      <Environment background files={`/hdr/shanghai.hdr`}></Environment>
      <Rain></Rain>
      <Stats></Stats>
      <XRAdapter
        before={
          <>
            <PerspectiveCamera fov={75} near={0.1} far={500}></PerspectiveCamera>
            <OrbitControls maxDistance={550} target={[0, 0, 0]} object-position={[0, 0, 10.0]}></OrbitControls>
          </>
        }
        after={
          <>
            <Cam></Cam>
          </>
        }
      ></XRAdapter>

      {/* <EffectComposer disableNormalPass multisampling={0}>
        <Bloom luminanceThreshold={0.99} intensity={1} mipmapBlur={true}></Bloom>
      </EffectComposer> */}

      {/* <Box scale={[1, 2, 1]}>
        <meshBasicMaterial color={'red'}></meshBasicMaterial>
      </Box> */}
    </>
  )
}

function Cam({ children, loader = null }) {
  let session = useXR((r) => r.session)
  let player = useXR((r) => r.player)
  let camera = useThree((r) => r.camera)

  useEffect(() => {
    if (session) {
      camera.position.z = 5.0
      camera.lookAt(0, 0, 0)
    }
  }, [session, player, camera])
  return (
    <>
      <PerspectiveCamera position={[0, 0, 0]} makeDefault fov={75} near={0.1} far={500}></PerspectiveCamera>
      <primitive object={player}></primitive>
    </>
  )
}
