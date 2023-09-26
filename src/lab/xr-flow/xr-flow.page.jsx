import {
  Box,
  Environment,
  MeshTransmissionMaterial,
  OrbitControls,
  PerspectiveCamera,
  Sphere,
  Stats,
} from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Sky } from './Sky/Sky'
// import { Bloom, EffectComposer, SSR, Vignette } from '@react-three/postprocessing'
import { Color, SRGBColorSpace, sRGBEncoding } from 'three'
import { Core } from './Rain/Core'
import { Rain } from './Rain/Rain'
import { Hands, XR, XRButton, useXR } from '@react-three/xr'
import { XRAdapter } from './XRAdapter'
import { useEffect, useRef, useState } from 'react'

export function XRFlow() {
  return (
    <div className='h-full w-full'>
      <Canvas
        onCreated={(st) => {
          for (let kn in st) {
            Core.now[kn] = st[kn]
          }
          st.gl.physicallyCorrectLights = true
          // st.gl.outputEncoding = sRGBEncoding
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
            mode={'AR'}
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
            onError={(error) => {
              console.log(error)
            }}
          >
            {/* Can accept regular DOM children and has an optional callback with the XR button status (unsupported, exited, entered) */}
            {(status) => (status === 'unsupported' ? `Enter MixedReality` : `Enter MixedReality`)}
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
      <group position={[0, 1, -0.3]}>
        <Rain></Rain>
        {/* <Sphere scale={[1, 1, 0.5]}>
          <MeshTransmissionMaterial thickness={1.1}></MeshTransmissionMaterial>
        </Sphere> */}
      </group>
      {/* <Sky></Sky> */}
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
            <Hands />

            <HandsReady>
              <HandsColliders />
            </HandsReady>

            <ambientLight></ambientLight>

            <directionalLight position={[0, 1, 1]}></directionalLight>

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

const HandsColliders = () =>
  [...Array(25)].map((_, i) => (
    <Hands key={i}>
      <JointCollider index={i} hand={0} />
      <JointCollider index={i} hand={1} />
    </Hands>
  ))

function JointCollider({ index, hand }) {
  const joints = [
    'wrist',
    'thumb-metacarpal',
    'thumb-phalanx-proximal',
    'thumb-phalanx-distal',
    'thumb-tip',
    'index-finger-metacarpal',
    'index-finger-phalanx-proximal',
    'index-finger-phalanx-intermediate',
    'index-finger-phalanx-distal',
    'index-finger-tip',
    'middle-finger-metacarpal',
    'middle-finger-phalanx-proximal',
    'middle-finger-phalanx-intermediate',
    'middle-finger-phalanx-distal',
    'middle-finger-tip',
    'ring-finger-metacarpal',
    'ring-finger-phalanx-proximal',
    'ring-finger-phalanx-intermediate',
    'ring-finger-phalanx-distal',
    'ring-finger-tip',
    'pinky-finger-metacarpal',
    'pinky-finger-phalanx-proximal',
    'pinky-finger-phalanx-intermediate',
    'pinky-finger-phalanx-distal',
    'pinky-finger-tip',
  ]

  const { gl } = useThree()
  const handObj = gl.xr.getHand(hand)
  const joint = handObj.joints[joints[index]]
  let size = 0
  if (joint) {
    size = joint.jointRadius ?? 0.0001
  }

  let tipRef = useRef()
  // const [tipRef, api] = useSphere(() => ({ args: size, position: [-1, 0, 0] }))
  useFrame(() => {
    if (joint === undefined) return

    if (tipRef.current) {
      tipRef.current.position.set(joint.position.x, joint.position.y, joint.position.z)
    }
    // api.position.set(joint.position.x, joint.position.y, joint.position.z)
  })

  return (
    <Sphere ref={tipRef} args={[size, 32, 32]}>
      <meshBasicMaterial color={'#ff0000'} transparent opacity={1.0} attach='material' />
    </Sphere>
  )
}

function HandsReady(props) {
  const [ready, setReady] = useState(false)
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    if (ready) return
    const joint = gl.xr.getHand(0).joints['index-finger-tip']
    if (joint?.jointRadius !== undefined) return
    const id = setInterval(() => {
      const joint = gl.xr.getHand(0).joints['index-finger-tip']
      if (joint?.jointRadius !== undefined) {
        setReady(true)
      }
    }, 500)
    return () => {
      clearInterval(id)
    }
  }, [gl, ready])

  return ready ? props.children : null
}

function Cam({}) {
  let session = useXR((r) => r.session)
  let player = useXR((r) => r.player)
  let scene = useThree((r) => r.scene)
  let camera = useThree((r) => r.camera)

  useEffect(() => {
    if (session) {
      camera.position.z = 0.0
      camera.lookAt(0, 0, 0)
      player.position.z = 0.0
      scene.background = null
    }
  }, [session, player, camera])
  return (
    <>
      <PerspectiveCamera position={[0, 0, 0]} makeDefault fov={75} near={0.1} far={500}></PerspectiveCamera>
      <primitive object={player}></primitive>
    </>
  )
}
