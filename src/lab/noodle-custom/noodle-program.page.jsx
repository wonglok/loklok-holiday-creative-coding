import {
  Box,
  Environment,
  MeshDiscardMaterial,
  OrbitControls,
  Plane,
  useGLTF,
  useSurfaceSampler,
} from '@react-three/drei'
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import { NoodleEntry } from './NoodleCompos/NoodleEntry'
import { DataTexture, FloatType, Group, Mesh, Object3D, RGBAFormat, SphereGeometry, Vector3 } from 'three'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler'

export function Page() {
  return (
    <>
      {/*  */}

      <Canvas>
        <color attach={'background'} args={['#000000']}></color>
        <Suspense fallback={null}>
          <Yo></Yo>
        </Suspense>

        <OrbitControls object-position={[-2, 1.68, 2]} target={[0, 1.68, 0]} makeDefault></OrbitControls>

        <EffectComposer disableNormalPass>
          <Bloom mipmapBlur intensity={1} luminanceThreshold={0.05}></Bloom>
        </EffectComposer>

        <Environment files={`/hdr/shanghai.hdr`}></Environment>
      </Canvas>

      {/*  */}
    </>
  )
}

const useHairSculpPosition = () => {
  let glb = useGLTF(`/rpm/lok/lok-white-tshirt-sculp.glb`)
  let name = 'Wolf3D_Head001'
  let mesh = glb?.scene?.getObjectByName(name)
  let count = 512
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

  let { positionTexture, normalTexture } = useMemo(() => {
    let positionTexture
    let normalTexture
    {
      let dataArray = new Float32Array(count * 4 * 1)
      positionTexture = new DataTexture(dataArray, count, 1, RGBAFormat, FloatType)

      let normalArray = new Float32Array(count * 4 * 1)
      normalTexture = new DataTexture(normalArray, count, 1, RGBAFormat, FloatType)

      let o3 = new Object3D()
      let v3 = o3.position
      let n3 = new Vector3()
      for (let i = 0; i < count; i++) {
        sampler.sample(v3, n3)

        positionTexture.image.data[i * 4 + 0] = v3.x + (Math.random() * 2.0 - 1.0) * 0.01
        positionTexture.image.data[i * 4 + 1] = v3.y + (Math.random() * 2.0 - 1.0) * 0.01
        positionTexture.image.data[i * 4 + 2] = v3.z + (Math.random() * 2.0 - 1.0) * 0.01
        positionTexture.image.data[i * 4 + 3] = 1.0

        normalTexture.image.data[i * 4 + 0] = n3.x
        normalTexture.image.data[i * 4 + 1] = n3.y
        normalTexture.image.data[i * 4 + 2] = n3.z
        normalTexture.image.data[i * 4 + 3] = 1.0
      }

      normalTexture.needsUpdate = true
      positionTexture.needsUpdate = true
    }

    return { positionTexture, normalTexture, initPosition: mesh }
  }, [sampler, count])

  return { positionTexture, normalTexture, glb, count }
}

function Yo() {
  const { positionTexture, normalTexture, glb, count } = useHairSculpPosition()

  console.log({ positionTexture })

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

    let noodle = new NoodleEntry({
      core: core,
    })
    core.add(noodle)

    return {
      works,
      mouse: core.mouseObject,
      compos: <primitive key={core.uuid} object={core}></primitive>,
    }
  }, [gl, positionTexture, normalTexture, count, NoodleEntry])

  useFrame((st, dt) => {
    works.forEach((fnc) => {
      fnc(st, dt)
    })
  })

  return (
    <>
      {/*  */}
      {compos}
      {createPortal(<></>, glb.scene)}

      <gridHelper args={[10, 10, 'white', 'white']}></gridHelper>
      <Mouse mouse={mouse}></Mouse>
      <primitive object={glb.scene}></primitive>

      {/*  */}
    </>
  )
}

function Mouse({ mouse }) {
  let o3d = new Object3D()
  let ref = useRef()
  let nowPt = new Vector3(0, 0, 0.0)

  useFrame(({ camera, controls }) => {
    if (controls) {
      o3d.position.copy(controls.target)
    }
    o3d.lookAt(camera.position)
    mouse.position.lerp(nowPt, 0.3)
  })
  return (
    <>
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
