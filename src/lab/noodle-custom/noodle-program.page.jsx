import {
  Box,
  Environment,
  MeshDiscardMaterial,
  OrbitControls,
  Plane,
  Stats,
  useFBX,
  useGLTF,
  useSurfaceSampler,
} from '@react-three/drei'
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import { NoodleEntry } from './NoodleCompos/NoodleEntry'
import {
  AnimationMixer,
  DataTexture,
  FloatType,
  Group,
  Mesh,
  Object3D,
  Quaternion,
  RGBAFormat,
  SphereGeometry,
  Vector3,
} from 'three'
import { Bloom, EffectComposer, N8AO, Autofocus, DepthOfField } from '@react-three/postprocessing'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler'

export function Page() {
  return (
    <>
      {/*  */}

      <Canvas shadows={false}>
        <Suspense fallback={null}>
          <Yo></Yo>
        </Suspense>

        <OrbitControls object-position={[-2, 1.68, 2]} target={[0, 1.68, 0]} makeDefault></OrbitControls>

        <Effects></Effects>

        <color attach={'background'} args={['#000000']}></color>
        <Environment background files={`/hdr/shanghai.hdr`}></Environment>
      </Canvas>

      {/*  */}
    </>
  )
}

function Effects() {
  // let controls = useThree((state) => state.controls)
  return (
    <>
      <EffectComposer disableNormalPass>
        <Bloom mipmapBlur intensity={1} luminanceThreshold={0.8}></Bloom>
      </EffectComposer>
    </>
  )
}

const useHairSculpPosition = () => {
  let glb = useGLTF(`/rpm/lok/lok-white-tshirt-sculp.glb`)
  let fbx = useFBX(`/rpm/dance/silly.fbx`)
  let mixer = useMemo(() => {
    return new AnimationMixer(glb.scene)
  }, [glb])
  useFrame((st, dt) => {
    mixer.update(dt)
  })
  mixer.clipAction(fbx.animations[0]).play()

  glb?.scene.traverse((it) => {
    console.log(it.name)
  })
  let name = 'Wolf3D_Head001'
  let mesh = glb?.scene?.getObjectByName(name)
  let count = 256
  let sampler = useMemo(() => {
    let iMesh = mesh
    if (!iMesh) {
      console.log('no headskin found')
      iMesh = new Mesh(new SphereGeometry(1, 32, 32))
    }
    let sampler = new MeshSurfaceSampler(iMesh)
    sampler.build()
    return sampler
  }, [mesh])

  let headPosition = new Vector3()
  let headQuaternion = new Quaternion()

  useFrame(() => {
    glb.scene.traverse((it) => {
      if (it.name === 'Head') {
        it.getWorldPosition(headPosition)
        headPosition.y += 0.11
        it.getWorldQuaternion(headQuaternion)
      }
    })
  })

  let { positionTexture, normalTexture } = useMemo(() => {
    let positionTexture
    let normalTexture

    if (!mesh) {
      return { positionTexture, normalTexture }
    }
    {
      let dataArray = new Float32Array(count * 4 * 1)
      positionTexture = new DataTexture(dataArray, count, 1, RGBAFormat, FloatType)

      let normalArray = new Float32Array(count * 4 * 1)
      normalTexture = new DataTexture(normalArray, count, 1, RGBAFormat, FloatType)

      let o3 = new Object3D()
      let v3 = o3.position
      let n3 = new Vector3()
      let geo = mesh?.geometry
      geo && geo.computeBoundingSphere()

      let geoDiff = new Vector3()
      geoDiff.copy(geo.boundingSphere.center)
      for (let i = 0; i < count; i++) {
        sampler.sample(v3, n3)

        positionTexture.image.data[i * 4 + 0] = v3.x - geoDiff.x + (Math.random() * 2.0 - 1.0) * 0.01
        positionTexture.image.data[i * 4 + 1] = v3.y - geoDiff.y + (Math.random() * 2.0 - 1.0) * 0.01
        positionTexture.image.data[i * 4 + 2] = v3.z - geoDiff.z + (Math.random() * 2.0 - 1.0) * 0.01
        positionTexture.image.data[i * 4 + 3] = 1.0

        normalTexture.image.data[i * 4 + 0] = n3.x
        normalTexture.image.data[i * 4 + 1] = n3.y
        normalTexture.image.data[i * 4 + 2] = n3.z
        normalTexture.image.data[i * 4 + 3] = 1.0
      }

      normalTexture.needsUpdate = true
      positionTexture.needsUpdate = true
    }

    return { positionTexture, normalTexture }
  }, [sampler, count, mesh])

  return { positionTexture, normalTexture, glb, count, headPosition, headQuaternion }
}

function Yo() {
  const { positionTexture, normalTexture, glb, count, headPosition, headQuaternion } = useHairSculpPosition()

  // console.log({ positionTexture })

  let gl = useThree((r) => r.gl)

  let { mouse, compos, works } = useMemo(() => {
    let works = []
    let core = new Group()
    core.gl = gl
    core.onLoop = (v) => {
      works.push(v)
    }
    core.txHairRootPosition = positionTexture
    core.txHairRootNormal = normalTexture
    core.mouseObject = new Object3D()
    core.count = count
    core.headPosition = headPosition
    core.headQuaternion = headQuaternion

    let noodle = new NoodleEntry({
      core: core,
    })
    core.add(noodle)

    return {
      works,
      mouse: core.mouseObject,
      compos: <primitive key={core.uuid} object={core}></primitive>,
    }
  }, [gl, positionTexture, normalTexture, count, headPosition, headQuaternion, NoodleEntry])

  useFrame((st, dt) => {
    works.forEach((fnc) => {
      fnc(st, dt)
    })
  })

  glb.scene.traverse((it) => {
    if (it) {
      it.castShadow = true
    }
    if (it) {
      it.receiveShadow = true
    }
  })
  return (
    <>
      {/*  */}
      {compos}
      <group rotation={[0.0, 0, 0]}>
        <primitive object={glb.scene}></primitive>
      </group>

      <gridHelper args={[10, 10, 'white', 'white']}></gridHelper>
      <Mouse mouse={mouse}></Mouse>
      <Stats></Stats>

      {/*  */}
    </>
  )
}

function Mouse({ mouse }) {
  let o3d = new Object3D()
  let ref = useRef()
  let nowPt = new Vector3(0, 0, 0.0)
  let ptl = useRef()
  useFrame(({ camera, controls }) => {
    if (controls) {
      o3d.position.copy(controls.target)
    }
    o3d.lookAt(camera.position)
    mouse.position.lerp(nowPt, 0.3)

    if (ptl.current) {
      ptl.current.position.lerp(nowPt, 0.1)
      ptl.current.color.offsetHSL(0.001, 0, 0)
    }
  })
  return (
    <>
      <pointLight castShadow ref={ptl} intensity={3.0} color={'#ff0000'}></pointLight>
      {createPortal(
        <Plane
          position={[0, 0, 0]}
          args={[25, 25, 50, 50]}
          ref={ref}
          onPointerOver={({ point }) => {
            nowPt.copy(point)
          }}
          onPointerEnter={({ point }) => {
            nowPt.copy(point)
          }}
          onPointerMove={({ point }) => {
            nowPt.copy(point)
          }}
        >
          <MeshDiscardMaterial></MeshDiscardMaterial>
          {/* <meshBasicMaterial
            wireframe
            attach={'material'}
            opacity={0.5}
            transparent
            color={'green'}
          ></meshBasicMaterial> */}
        </Plane>,
        o3d,
      )}
      <primitive object={o3d}></primitive>
    </>
  )
}
