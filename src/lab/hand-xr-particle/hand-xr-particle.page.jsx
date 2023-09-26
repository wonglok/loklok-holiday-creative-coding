import React, { useState, useEffect, Fragment, useMemo } from 'react'
import { Hands, XR, XRButton } from '@react-three/xr'
import { useThree, useFrame, Canvas } from '@react-three/fiber'
import { Box, OrbitControls, Plane, Sphere, useGLTF, Environment, useTexture } from '@react-three/drei'
import { usePlane, useBox, Physics, useSphere, useConvexPolyhedron } from '@react-three/cannon'
import { joints } from './joints'
import { IcosahedronGeometry, SRGBColorSpace, SphereGeometry } from 'three'
import { Geometry } from './Geo'
import { ParticleCoreEngine } from './ParticleEngine/CoreEngine'

//  "@react-three/cannon": "^1.4.0",

// import { WaterSurfaceContent } from '../WaterSurface/WaterSurface'
/**
 * Returns legacy geometry vertices, faces for ConvP
 * @param {THREE.BufferGeometry} bufferGeometry
 */
function toConvexProps(bufferGeometry) {
  const geo = new Geometry().fromBufferGeometry(bufferGeometry)
  // Merge duplicate vertices resulting from glTF export.
  // Cannon assumes contiguous, closed meshes to work
  geo.mergeVertices()
  return [geo.vertices.map((v) => [v.x, v.y, v.z]), geo.faces.map((f) => [f.a, f.b, f.c]), []]
}

function WoodMaterial() {
  let tx = useTexture({
    map: '/bricks/Wood048_1K-JPG/Wood048_1K_Color.jpg',
    normalMap: '/bricks/Wood048_1K-JPG/Wood048_1K_NormalGL.jpg',
    // roughnessMap: '/bricks/Wood048_1K-JPG/Wood048_1K_Roughness.jpg',
    // metalnessMap: '/bricks/Wood048_1K-JPG/Wood048_1K_Displacement.jpg',
  })
  if (tx?.map) {
    tx.map.colorSpace = SRGBColorSpace
  }
  return (
    <meshPhysicalMaterial
      //
      normalMap={tx?.normalMap}
      map={tx.map}
      emissive={'#ffffff'}
      emissiveMap={tx.map}
      transmission={1}
      thickness={3}
      roughness={0.1}
    ></meshPhysicalMaterial>
  )
}

function Arch({ position = [0, 1.2, 0], ...props }) {
  const { nodes } = useGLTF('/bricks/Arch.glb')
  const selectGeo = nodes.Arch.geometry.clone()
  selectGeo.scale(0.75, 0.75, 0.75)
  const geo = useMemo(() => toConvexProps(selectGeo), [selectGeo])
  const [ref] = useConvexPolyhedron(() => ({
    ...props,
    position: position,
    mass: 1,
    args: geo,
  }))

  return (
    <mesh castShadow receiveShadow ref={ref} geometry={selectGeo} {...props}>
      <WoodMaterial></WoodMaterial>

      {/* <group
        userData={{
          forceSize: 0.5,
          forceTwist: 3.141592 * 2.0 * 2.8,
          forceType: 'attract',
          type: 'ForceField',
        }}
      ></group> */}
      {/* <meshStandardMaterial color='yellow' roughness={0} metalness={0.5} /> */}
    </mesh>
  )
}

function Rectangle({ position = [0, 1.2, 0], ...props }) {
  const { nodes } = useGLTF('/bricks/Rectangle.glb')
  const selectGeo = nodes.Rectangle.geometry.clone()
  selectGeo.scale(0.75, 0.75, 0.75)
  const geo = useMemo(() => toConvexProps(selectGeo), [selectGeo])
  const [ref] = useConvexPolyhedron(() => ({
    ...props,
    position: position,
    mass: 1,
    args: geo,
  }))

  return (
    <mesh castShadow receiveShadow ref={ref} geometry={selectGeo} {...props}>
      <WoodMaterial></WoodMaterial>

      {/* <group
        userData={{
          forceSize: 0.5,
          forceTwist: 3.141592 * 2.0 * 2.8,
          forceType: 'attract',
          type: 'ForceField',
        }}
      ></group> */}
      {/* <meshStandardMaterial color='yellow' roughness={0} metalness={0.5} /> */}
    </mesh>
  )
}

function MySphere({ forceTypeIndex = 0, flip = 1, position = [0, 1.2, 0], ...props }) {
  const selectGeo = useMemo(() => {
    return new IcosahedronGeometry(0.03, 3)
  }, [])
  const renderGeo = useMemo(() => {
    return new SphereGeometry(0.03 * 2.0, 32, 32)
  }, [])
  selectGeo.scale(1, 1, 1)

  // const geo = useMemo(() => toConvexProps(selectGeo), [selectGeo])
  // const [ref] = useConvexPolyhedron(() => ({
  //   ...props,
  //   position: position,
  //   mass: 0.1,
  //   args: geo,
  // }))

  const [ref, api] = useSphere(() => ({
    ...props,
    position: position,
    mass: 0.5,
    args: 0.05 * 2.0,
    friction: 5,
  }))

  useEffect(() => {
    return api.position.subscribe((value) => {
      if (value[1] <= -2) {
        api.position.set(0, 1.1, -0.3)
      }
      // if (ref.current.position.y <= -1.5) {
      //   api.position.set(0, 1, -0.5)
      // }
    })
  })

  useFrame(() => {})

  return (
    <mesh castShadow receiveShadow ref={ref} geometry={renderGeo} {...props}>
      {/* <WoodMaterial></WoodMaterial> */}

      <meshStandardMaterial metalness={1} roughness={0.1} color={'#0000ff'}></meshStandardMaterial>
      {/*  */}
      <group
        userData={{
          forceSize: 3.6 / 8,
          forceTwist: 3.141592 * 2.0 * 2.8,
          forceType: ['vortexY', 'vortexX'][forceTypeIndex % 2],
          type: 'ForceField',
        }}
      ></group>
      {/* <meshStandardMaterial color='yellow' roughness={0} metalness={0.5} /> */}
    </mesh>
  )
}

// function MyLineNode({ nodeIndex = 0, flip = 1, position = [0, 1.2, 0], ...props }) {
//   const selectGeo = useMemo(() => {
//     return new IcosahedronGeometry(0.05, 1)
//   }, [])
//   const renderGeo = useMemo(() => {
//     return new SphereGeometry(0.05, 25, 25)
//   }, [])
//   selectGeo.scale(1, 1, 1)
//   const geo = useMemo(() => toConvexProps(selectGeo), [selectGeo])
//   const [ref] = useConvexPolyhedron(() => ({
//     ...props,
//     position: position,
//     mass: 1,
//     args: geo,
//   }))

//   return (
//     <mesh castShadow receiveShadow ref={ref} geometry={renderGeo} {...props}>
//       <meshPhysicalMaterial
//         roughness={0}
//         transmission={1}
//         metalness={0}
//         thickness={1.5}
//         color={'#ff0000'}
//       ></meshPhysicalMaterial>

//       {/* <group
//         userData={{
//           indexID: nodeIndex,
//           lineID: 0,
//           type: 'ForceCurve',
//         }}
//       ></group> */}
//       {/* <meshStandardMaterial color='yellow' roughness={0} metalness={0.5} /> */}
//     </mesh>
//   )
// }

function Triangle({ position = [0, 1.2, 0], ...props }) {
  const { nodes } = useGLTF('/bricks/Triangle.glb')
  const selectGeo = nodes.Triangle.geometry.clone()
  selectGeo.scale(0.75, 0.75, 0.75)
  const geo = useMemo(() => toConvexProps(selectGeo), [selectGeo])
  const [ref] = useConvexPolyhedron(() => ({
    ...props,
    position: position,
    mass: 1,
    args: geo,
  }))

  return (
    <mesh castShadow receiveShadow ref={ref} geometry={selectGeo} {...props}>
      <WoodMaterial></WoodMaterial>

      {/* <group
        userData={{
          forceSize: 0.5,
          forceTwist: -3.141592 * 2.0 * 2.8,
          forceType: 'vortexY',
          type: 'ForceField',
        }}
      ></group> */}

      {/* <meshStandardMaterial color='yellow' roughness={0} metalness={0.5} /> */}
    </mesh>
  )
}

function Cube2({ position = [0, 1.2, 0], ...props }) {
  const { nodes } = useGLTF('/bricks/Cube.glb')
  const selectGeo = nodes.Cube.geometry.clone()
  selectGeo.scale(0.75, 0.75, 0.75)
  const geo = useMemo(() => toConvexProps(selectGeo), [selectGeo])
  const [ref] = useConvexPolyhedron(() => ({
    ...props,
    position: position,
    mass: 1,
    args: geo,
  }))

  return (
    <mesh castShadow receiveShadow ref={ref} geometry={selectGeo} {...props}>
      <WoodMaterial></WoodMaterial>

      {/* <group
        userData={{
          forceSize: 0.5,
          forceTwist: -3.141592 * 2.0 * 2.8,
          forceType: 'vortexY',
          type: 'ForceField',
        }}
      ></group> */}
      {/* <meshStandardMaterial color='yellow' roughness={0} metalness={0.5} /> */}
    </mesh>
  )
}

function Cube({ position, args = [0.065 / 2, 0.065 / 2, 0.065 / 2] }) {
  const [boxRef] = useBox(() => ({ position, mass: 1, args }))
  // const [tex] = useMatcapTexture('C7C0AC_2E181B_543B30_6B6270')

  return (
    <Box ref={boxRef} args={args} castShadow>
      <WoodMaterial></WoodMaterial>

      {/* <meshStandardMaterial attach='material' color='#ffff00' roughness={0} metalness={0.5} /> */}
      {/* <meshMatcapMaterial attach='material' matcap={tex} /> */}
    </Box>
  )
}

function JointCollider({ index, hand }) {
  const { gl } = useThree()
  const handObj = gl.xr.getHand(hand)
  const joint = handObj.joints[joints[index]]
  let size = 0
  if (joint) {
    size = joint.jointRadius ?? 0.0001
    // size *= 1.3333

    size *= 0.5
  }

  const [tipRef, api] = useSphere(() => ({ args: size, position: [-1, 0, 0] }))
  useFrame(() => {
    if (joint === undefined) return
    api.position.set(joint.position.x, joint.position.y, joint.position.z)
  })

  return (
    <Sphere ref={tipRef} args={[size]}>
      <meshBasicMaterial color={'#ff0000'} transparent opacity={1} attach='material' />
    </Sphere>
  )
}

function HandsReady(props) {
  const [ready, setReady] = useState(false)
  const { gl } = useThree()
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

const HandsColliders = () =>
  [...Array(25)].map((_, i) => (
    <Fragment key={i}>
      <JointCollider index={i} hand={0} />
      <JointCollider index={i} hand={1} />
    </Fragment>
  ))

function Scene() {
  const [boxRef] = useBox(() => ({
    args: [1, 0.01, 2],
    rotation: [0, 0, 0],
    position: [0, 0.9, 0],
    type: 'Static',
  }))

  return (
    <>
      {/* <group scale={1} position={[0, -0.05, -2]}>
        <Avatar></Avatar>
      </group> */}

      {/* <group rotation={[Math.PI * -0.5, 0, 0]}>
        <WaterSurfaceContent></WaterSurfaceContent>
      </group> */}

      {[...Array(2)].map((_, i) => (
        <Arch key={'arch' + i} position={[0.1, 1.1 + 0.1 * i, -0.8]}></Arch>
      ))}
      {[...Array(2)].map((_, i) => (
        <Cube2 key={'cube' + i} position={[0.3, 1.1 + 0.1 * i, -0.8]}></Cube2>
      ))}
      {[...Array(2)].map((_, i) => (
        <Triangle key={'Triangle' + i} position={[-0.3, 1.1 + 0.1 * i, -0.8]}></Triangle>
      ))}
      {[...Array(2)].map((_, i) => (
        <Rectangle key={'Rectangle' + i} position={[-0.1, 1.1 + 0.1 * i, -0.8]}></Rectangle>
      ))}

      {/* {[...Array(5)].map((_, i) => (
        <MyLineNode key={'MyLineNode' + i} forceTypeIndex={i} position={[0.1 * i, 1.1 + 0.1, -0.2]}></MyLineNode>
      ))} */}

      {/*  <group
              userData={{
                indexID: i,
                lineID: 0,
                type: 'ForceCurve',
              }}
            >
              <Box scale={0.1}>
                <meshStandardMaterial color={'#ff0000'}></meshStandardMaterial>
              </Box>
            </group> */}

      {[...Array(3)].map((_, i) => (
        <MySphere key={'MySphere' + i} forceTypeIndex={i} position={[(-0.15 * 3) / 2 + 0.2 * i, 1, -0.3]}></MySphere>
      ))}

      <Box ref={boxRef} args={[1, 0.01, 2]} receiveShadow>
        {/* <MeshDiscardMaterial></MeshDiscardMaterial> */}
        <meshStandardMaterial attach='material' color='#fff' transparent opacity={0.5} />
      </Box>

      <Hands />
      <HandsReady>
        <HandsColliders />
      </HandsReady>

      {/* {[...Array(7)].map((_, i) => (
        <Cube key={i} position={[0, 1.1 + 0.1 * i, -0.5]} />
      ))} */}

      <OrbitControls makeDefault object-position={[0, 1.1, 0.0]} target={[0, 1.1, -0.1]} />
      <ambientLight intensity={0.5} />
      {/* <spotLight position={[1, 8, 1]} angle={0.3} penumbra={1} intensity={1} castShadow /> */}
    </>
  )
}

// function Avatar() {
//   let glb = useGLTF(`/rpm/avatar/default-lok.glb`)
//   let motion = {
//     talk: useFBX(`/rpm/rpm-actions-emoji/talk-phone.fbx`),
//   }

//   let mixer = useMemo((r) => {
//     return new AnimationMixer()
//   }, [])
//   useFrame((st, dt) => {
//     mixer.update(dt)
//   })
//   useEffect(() => {
//     mixer.clipAction(motion.talk.animations[0], glb.scene).reset().play()
//   }, [glb.scene, mixer, motion])

//   return <primitive object={glb.scene}></primitive>
// }

export const HandXR = () => (
  <>
    <Canvas>
      <XR>
        <Physics
          gravity={[0, -2, 0]}
          iterations={20}
          defaultContactMaterial={{
            friction: 0.09,
          }}
        >
          <group position={[0, 0, 0]}>
            <Scene />
            <ParticleCoreEngine></ParticleCoreEngine>
          </group>
        </Physics>
      </XR>

      {/*  */}
      <Environment files={`/hdr/shanghai.hdr`}></Environment>
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
          onError={(error) => {}}
        >
          {/* Can accept regular DOM children and has an optional callback with the XR button status (unsupported, exited, entered) */}
          {(status) => (status === 'unsupported' ? `Enter MixedReality` : `Enter MixedReality`)}
        </XRButton>
      </div>
    </div>
  </>
)
