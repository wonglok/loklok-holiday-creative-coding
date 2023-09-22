import { Box, MeshDiscardMaterial, OrbitControls, Plane, useSurfaceSampler } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
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

const useHairSculpPosition = () => {
  let count = 512
  let sampler = useMemo(() => {
    let mss = new MeshSurfaceSampler(new Mesh(new SphereGeometry(10, 32, 32)))
    mss.build()
    return mss
  }, [])

  let { dataTexture } = useMemo(() => {
    let dataArray = new Float32Array(count * 4 * 1)
    let dataTexture = new DataTexture(dataArray, count, 1, RGBAFormat, FloatType)

    let o3 = new Object3D()
    let v3 = o3.position
    for (let i = 0; i < count; i++) {
      sampler.sample(v3)

      dataTexture.image.data[i * 4 + 0] = v3.x
      dataTexture.image.data[i * 4 + 1] = v3.y
      dataTexture.image.data[i * 4 + 2] = v3.z
      dataTexture.image.data[i * 4 + 3] = 1.0
    }

    dataTexture.needsUpdate = true

    return { dataTexture }
  }, [sampler, count])

  return { dataTexture }
}

function Yo() {
  const { dataTexture } = useHairSculpPosition()

  console.log({ dataTexture })

  let gl = useThree((r) => r.gl)

  let { mouse, compos, works } = useMemo(() => {
    let works = []
    let core = new Group()
    core.gl = gl
    core.onLoop = (v) => {
      works.push(v)
    }
    core.hairRootDataTexture = dataTexture
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
  }, [gl, dataTexture])

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
  let nowPt = new Vector3()
  useFrame(({ camera }) => {
    if (ref.current) {
      ref.current.lookAt(camera.position)
    }
    mouse.position.lerp(nowPt, 0.1)
  })
  return (
    <Plane
      args={[10000, 10000]}
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
      {/* <meshBasicMaterial attach={'material'} color={'green'}></meshBasicMaterial> */}
    </Plane>
  )
}
