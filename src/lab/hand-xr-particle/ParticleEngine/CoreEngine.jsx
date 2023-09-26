import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { createRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BufferAttribute,
  Vector2,
  Vector3,
  HalfFloatType,
  FloatType,
  InstancedBufferGeometry,
  InstancedBufferAttribute,
  Mesh,
  DataTexture,
  RGBAFormat,
  DataUtils,
  Color,
  MeshPhysicalMaterial,
  Clock,
  SphereGeometry,
  Object3D,
  BoxGeometry,
  PlaneGeometry,
  CircleGeometry,
  DoubleSide,
  CylinderGeometry,
  Points,
  LineSegments,
  CatmullRom,
  CatmullRomCurve3,
  MeshStandardMaterial,
  ShaderMaterial,
  SubtractiveBlending,
} from 'three'
// import { loadGLTF } from "../world/loadGLTF";
// import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer";
import { CustomGPU } from './CustomGPU'
import { useCore } from './useCore'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import { TransformControls, PivotControls, Box, Sphere, Text, Stats, CatmullRomLine, Line } from '@react-three/drei'
// import { Addition, Base, Geometry } from '@react-three/csg'
import { create } from 'zustand'

let useScore = create(() => {
  return {
    scoreA: 0,
    scoreB: 0,
  }
})

export function ParticleCoreEngine() {
  // let csgRef = useRef()
  let [surfaceMesh, setSurfaceMesh] = useState(() => {
    return new Mesh(new SphereGeometry(5, 32, 32))
  })
  // let tt = useRef()

  // let applyEmissionGeometryChange = useCallback(() => {
  //   clearTimeout(tt.current)
  //   tt.current = setTimeout(() => {
  //     csgRef.current.update()
  //     setSurfaceMesh(new Mesh(new BoxGeometry(3, 3, 3)))
  //   }, 50)
  // }, [csgRef])

  // useEffect(() => {
  //   applyEmissionGeometryChange()
  // }, [applyEmissionGeometryChange])

  return (
    <>
      <mesh>
        <meshPhysicalMaterial transmission={0} thickness={2.5} roughness={0} ior={1.5}></meshPhysicalMaterial>
        {<ParticleRelayCore surfaceMesh={surfaceMesh}></ParticleRelayCore>}
      </mesh>
    </>
  )
}

// function Score({ cursorA, cursorB }) {
//   let scoreA = useScore((r) => r.scoreA)
//   let scoreB = useScore((r) => r.scoreB)
//   return (
//     <>
//       <primitive object={cursorA}>
//         <Text scale={0.5} position={[0, 0, 1.5]}>
//           {scoreA}
//         </Text>
//       </primitive>
//       <primitive object={cursorB}>
//         <Text scale={0.5} position={[0, 0, 1.5]}>
//           {scoreB}
//         </Text>
//       </primitive>

//       <Stats></Stats>
//     </>
//   )
// }

function CurveYo() {
  let [pts, setPts] = useState(() => {
    return [
      {
        position: [-4, -2, 1],
      },
      {
        position: [-2, -2, -1],
      },
      {
        position: [-1, -2, 0],
      },
      {
        position: [0, -3, 1],
      },
      {
        position: [1, -2, -1],
      },
      {
        position: [2, -3, 0],
      },
    ]
  }, [])

  let ref = useRef()
  let points = useMemo(() => {
    let ps1 = []

    for (let i = 0; i < 200; i++) {
      ps1.push([0, 0, 0])
    }

    return ps1
  }, [])

  let sync = () => {
    let curve = new CatmullRomCurve3(
      pts.map((r) => new Vector3(...r.position)),
      false,
      'catmullrom',
      0.6,
    )

    let pts2 = []

    curve.getPoints(200).forEach((pt) => {
      pts2.push(pt.x, pt.y, pt.z)
    })
    ref.current.geometry.setPositions(pts2)
  }

  useEffect(() => {
    sync()
  }, [])

  return (
    <>
      {pts.map((pt, i) => {
        return (
          <TransformControls
            onObjectChange={(ev) => {
              //
              // console.log(ev.target.worldPosition)
              pt.position[0] = ev.target.worldPosition.x
              pt.position[1] = ev.target.worldPosition.y
              pt.position[2] = ev.target.worldPosition.z

              sync()
            }}
            key={'ctrl__' + i}
            position={pt.position}
            lineWidth={3}
            scale={2}
            anchor={[0, 0, 0]}
          >
            <group
              userData={{
                indexID: i,
                lineID: 0,
                type: 'ForceCurve',
              }}
            >
              <Box scale={0.1}>
                <meshStandardMaterial color={'#ff0000'}></meshStandardMaterial>
              </Box>
            </group>
          </TransformControls>
        )
      })}

      <Line color={'black'} ref={ref} lineWidth={1} points={points}></Line>
    </>
  )
}

function ParticleRelayCore({ surfaceMesh }) {
  let scene = useThree((r) => r.scene)
  let gl = useThree((r) => r.gl)

  let unitGeomtry = new BoxGeometry(0.1, 0.1, 0.1)

  let roughness = 0.2,
    metalness = 0.2,
    transmission = 1,
    thickness = 3,
    //
    color = '#000000',
    emissive = '#ff0000',
    performanceProfile = 'ultra',
    surfaceEmissionForce = -0.6,
    playerAttractionForce = 0,
    playerSpinningForce = 0,
    playerPropulsionForce = 0,
    shieldRadius = 0,
    unitScale = 0.03,
    randomness = 0.5

  let cursorA = useMemo(() => {
    let o3 = new Mesh(
      new SphereGeometry(0.75, 32, 32),
      new MeshPhysicalMaterial({ transmission: 1, thickness: 2, roughness: 0, ior: 1.5 }),
    )
    o3.position.x = -3
    return o3
  }, [])

  let cursorB = useMemo(() => {
    let o3 = new Mesh(
      new SphereGeometry(0.75, 32, 32),
      new MeshPhysicalMaterial({ transmission: 1, thickness: 2, roughness: 0, ior: 1.5 }),
    )
    o3.position.x = 3
    return o3
  }, [])

  return (
    <>
      {/* <group
        userData={{
          forceSize: 1,
          forceTwist: -3.141592 * 2.0 * 2.8,
          forceType: 'vortexY',
          type: 'ForceField',
        }}
      >
        <Sphere scale={[0.1, 0.2, 0.1]}>
          <meshStandardMaterial metalness={1} flatShading></meshStandardMaterial>
        </Sphere>
      </group> */}
      {/* <TransformControls position={[0, 2, 0]} lineWidth={3} scale={2} anchor={[0, 0, 0]}>
        
      </TransformControls> */}

      {/* <CurveYo></CurveYo> */}
      {/* <TransformControls object={cursorA}></TransformControls>
      <TransformControls object={cursorB}></TransformControls>
      <Score cursorA={cursorA} cursorB={cursorB}></Score> */}

      {surfaceMesh && unitGeomtry && gl && scene && (
        <CoreEngine
          cursorA={cursorA}
          cursorB={cursorB}
          key={'__' + performanceProfile + unitGeomtry.uuid + surfaceMesh.uuid + 'corenegine'}
          performanceProfile={performanceProfile}
          surfaceMesh={surfaceMesh}
          gl={gl}
          unitGeomtry={unitGeomtry}
          scene={scene}
          unitScale={unitScale}
          color={color}
          emissive={emissive}
          //
          shieldRadius={shieldRadius}
          surfaceEmissionForce={surfaceEmissionForce}
          playerAttractionForce={playerAttractionForce}
          playerSpinningForce={playerSpinningForce}
          playerPropulsionForce={playerPropulsionForce}
          //!roughness
          roughness={roughness}
          metalness={metalness}
          transmission={transmission}
          thickness={thickness}
          //!randomness
          randomness={randomness}
        ></CoreEngine>
      )}
    </>
  )
}

export function CoreEngine({
  cursorA = new Object3D(),
  cursorB = new Object3D(),
  roughness = 0,
  metalness = 0,
  transmission = 0,
  thickness = 1,
  //
  gl,
  color = '#ffffff',
  emissive = '#000000',
  scene,
  performanceProfile = 'low',
  surfaceEmissionForce = 1,
  playerAttractionForce = 1,
  playerSpinningForce = 1,
  playerPropulsionForce = 1,
  shieldRadius = 10,
  unitGeomtry,
  surfaceMesh,
  unitScale,
  randomness,
}) {
  let core = useCore()

  let unitScaleRef = useRef(0)

  let surfaceEmissionForceRef = useRef(1)
  let playerAttractionForceRef = useRef(1)
  let playerSpinningForceRef = useRef(1)
  let playerPropulsionForceRef = useRef(1)
  let shieldRadiusRef = useRef(1)
  let colorRef = useRef('#ffffff')
  let emissiveRef = useRef(emissive)

  let roughnessRef = useRef(0)
  let metalnessRef = useRef(0)
  let transmissionRef = useRef(0)
  let thicknessRef = useRef(0)

  let randomnessRef = useRef(0)

  useFrame(() => {
    if (unitScaleRef) {
      unitScaleRef.current = unitScale
    }
    if (surfaceEmissionForceRef) {
      surfaceEmissionForceRef.current = surfaceEmissionForce
    }
    if (playerAttractionForceRef) {
      playerAttractionForceRef.current = playerAttractionForce
    }
    if (playerSpinningForceRef) {
      playerSpinningForceRef.current = playerSpinningForce
    }
    if (playerPropulsionForceRef) {
      playerPropulsionForceRef.current = playerPropulsionForce
    }
    if (shieldRadiusRef) {
      shieldRadiusRef.current = shieldRadius
    }
    if (colorRef) {
      colorRef.current = color
    }
    if (roughnessRef) {
      roughnessRef.current = roughness
    }
    if (metalnessRef) {
      metalnessRef.current = metalness
    }
    if (transmissionRef) {
      transmissionRef.current = transmission
    }
    if (thicknessRef) {
      thicknessRef.current = thickness
    }
    if (randomnessRef) {
      randomnessRef.current = randomness
    }
    if (emissiveRef) {
      emissiveRef.current = emissive
    }
  })

  useEffect(() => {
    let size = new Vector2(128, 256)
    if (performanceProfile === 'ultra') {
      size.x = 512
      size.y = 256

      if ('ontouchstart' in window) {
        size.x = 256
        size.y = 256
      }
    }
    if (performanceProfile === 'high') {
      size.x = 256
      size.y = 128

      if ('ontouchstart' in window) {
        size.x = 256
        size.y = 128
      }
    }
    if (performanceProfile === 'middle') {
      size.x = 128
      size.y = 128

      if ('ontouchstart' in window) {
        size.x = 128
        size.y = 64
      }
    }
    if (performanceProfile === 'low') {
      size.x = 32
      size.y = 64
      if ('ontouchstart' in window) {
        size.x = 32
        size.y = 64
      }
    }
    if (performanceProfile === 'some') {
      size.x = 16
      size.y = 16
      if ('ontouchstart' in window) {
        size.x = 16
        size.y = 16
      }
    }
    if (performanceProfile === 'few') {
      size.x = 4
      size.y = 4
      if ('ontouchstart' in window) {
        size.x = 4
        size.y = 4
      }
    }
    if (!unitGeomtry) {
      return
    }

    let unitGeo = unitGeomtry.clone()

    // let ua = window.navigator.userAgent
    // let iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i)
    // let webkit = !!ua.match(/WebKit/i)
    // let iOSSafari = iOS && webkit && !ua.match(/CriOS/i)

    //
    let useHalfFloat = false

    let curveSize = new Vector3(10, 1)
    let curveSizeCount = curveSize.x * curveSize.y * 4
    let cuveArray = new Array(curveSizeCount)
    let bufferCurve = !useHalfFloat ? new Float32Array(cuveArray) : new Uint16Array(cuveArray)
    let curveTexture = new DataTexture(
      bufferCurve,
      curveSize.x,
      curveSize.y,
      RGBAFormat,
      !useHalfFloat ? FloatType : HalfFloatType,
    )

    let syncCurve = () => {
      let texArray = curveTexture.image.data
      for (let idx = 0; idx < curveSizeCount; idx++) {
        texArray[idx * 4 + 0] = 0.0
        texArray[idx * 4 + 1] = 0.0
        texArray[idx * 4 + 2] = 0.0
        texArray[idx * 4 + 3] = 0.0
      }

      let v3 = new Vector3()

      scene.traverse((it) => {
        if (it?.userData?.type === 'ForceCurve') {
          let y = it.userData.lineID || 0
          let x = it.userData.indexID || 0

          it.getWorldPosition(v3)
          let idx = y * curveSize.y + x

          texArray[idx * 4 + 0] = v3.x
          texArray[idx * 4 + 1] = v3.y
          texArray[idx * 4 + 2] = v3.z
          texArray[idx * 4 + 3] = 1
        }
      })
      curveTexture.needsUpdate = true

      //
    }
    syncCurve()

    core.onLoop(() => {
      syncCurve()
    })
    core.onClean(() => {
      curveTexture.dispose()
    })

    //
    //

    let attractorSize = new Vector2(64, 1)

    let sceneDataAlpha = []
    let sceneDataBeta = []
    let totalDataCount = attractorSize.x * attractorSize.y

    for (let idx = 0; idx < totalDataCount; idx++) {
      sceneDataAlpha.push(0, 0, 0, 0)
      sceneDataBeta.push(0, 0, 0, 0)
    }

    let bufferAlpha = !useHalfFloat ? new Float32Array(sceneDataAlpha) : new Uint16Array(sceneDataAlpha)
    let bufferBeta = !useHalfFloat ? new Float32Array(sceneDataBeta) : new Uint16Array(sceneDataBeta)

    let sceneDataTextureAlpha = new DataTexture(
      bufferAlpha,
      attractorSize.x,
      attractorSize.y,
      RGBAFormat,
      !useHalfFloat ? FloatType : HalfFloatType,
    )

    let sceneDataTextureBeta = new DataTexture(
      bufferBeta,
      attractorSize.x,
      attractorSize.y,
      RGBAFormat,
      !useHalfFloat ? FloatType : HalfFloatType,
    )

    let getData = (v) => {
      if (useHalfFloat) {
        return DataUtils.toHalfFloat(v)
      } else {
        return Number(v)
      }
    }

    let sceneObjects = new Map()

    let v3 = new Vector3()
    let getForceType = (forceType) => {
      if (forceType === 'attract') {
        return 3
      } else if (forceType === 'vortexX') {
        return 4
      } else if (forceType === 'vortexY') {
        return 5
      } else if (forceType === 'vortexZ') {
        return 6
      } else {
        return 2
      }
    }

    let getForceSize = (forceSize) => {
      if (typeof forceSize === 'number') {
        return forceSize
      } else {
        return 1
      }
    }

    let getForceTwist = (forceTwist) => {
      if (typeof forceTwist === 'number') {
        return forceTwist
      } else {
        return 1
      }
    }

    let syncData = () => {
      sceneObjects.clear()

      scene.traverse((it) => {
        // if (it.name === 'player') {
        //   // sceneObjects.set(it.uuid, it)
        // }
        if (it.userData?.type === 'ForceField') {
          sceneObjects.set(it.uuid, it)
        }
        // if (it.name.indexOf("Water") === 0) {
        //   sceneObjects.set(it.name, it);
        // }
      })

      for (let idx = 0; idx < totalDataCount; idx++) {
        sceneDataAlpha[idx * 4 + 0] = 0.0
        sceneDataAlpha[idx * 4 + 1] = 0.0
        sceneDataAlpha[idx * 4 + 2] = 0.0
        sceneDataAlpha[idx * 4 + 3] = 0.0
        //
        sceneDataBeta[idx * 4 + 0] = 0.0
        sceneDataBeta[idx * 4 + 1] = 0.0
        sceneDataBeta[idx * 4 + 2] = 0.0
        sceneDataBeta[idx * 4 + 3] = 0.0
      }

      let entries = sceneObjects.entries()

      let i = 0
      for (let [key, object] of entries) {
        object.getWorldPosition(v3)

        sceneDataTextureAlpha.image.data[i * 4 + 0] = getData(v3.x)
        sceneDataTextureAlpha.image.data[i * 4 + 1] = getData(v3.y)
        sceneDataTextureAlpha.image.data[i * 4 + 2] = getData(v3.z)
        sceneDataTextureAlpha.image.data[i * 4 + 3] = getData(1)

        // 2 ===
        sceneDataTextureBeta.image.data[i * 4 + 0] = getData(getForceType(object?.userData?.forceType))
        sceneDataTextureBeta.image.data[i * 4 + 1] = getData(getForceSize(object?.userData?.forceSize))

        //
        sceneDataTextureBeta.image.data[i * 4 + 2] = getData(getForceTwist(object?.userData?.forceTwist))
        sceneDataTextureBeta.image.data[i * 4 + 3] = getData(1)

        i++

        // console.log(player.position.toArray().join(","));
      }
      // console.log(i);

      sceneDataTextureBeta.needsUpdate = true
      sceneDataTextureAlpha.needsUpdate = true
    }
    core.onLoop(syncData)

    syncData()

    sceneDataTextureAlpha.needsUpdate = true
    sceneDataTextureBeta.needsUpdate = true
    core.onLoop(() => {
      sceneDataTextureAlpha.needsUpdate = true
      sceneDataTextureBeta.needsUpdate = true
    })

    //
    //
    let gpu = new CustomGPU(size.x, size.y, gl)

    if (useHalfFloat) {
      gpu.setDataType(HalfFloatType)
    } else {
      gpu.setDataType(FloatType)
    }

    //

    function accessCoord() {
      let tex = gpu.createTexture()
      let height = tex.image.height
      let width = tex.image.width

      let uv = []
      let i = 0
      let total = width * height
      for (let h = 0; h < height; h++) {
        for (let w = 0; w < width; w++) {
          tex.image.data[i * 4 + 0] = w / width || 0
          tex.image.data[i * 4 + 1] = h / height || 0
          tex.image.data[i * 4 + 2] = i / total
          tex.image.data[i * 4 + 3] = 1

          uv.push(w / width, h / height, i / total, tex.image.data[i * 4 + 3])
          i++
        }
      }

      tex.userData.iSize = 4

      let attr = new BufferAttribute(new Float32Array(uv), 4)
      let iAttr = new InstancedBufferAttribute(new Float32Array(uv), 4)
      return {
        tex,
        attr,
        iAttr,
      }
    }

    function initData({ get }) {
      let tex = gpu.createTexture()
      let height = tex.image.height
      let width = tex.image.width
      let pxAll = width * height
      let i = 0

      for (let px = 0; px < pxAll; px++) {
        let v3 = get({ i, e: px / pxAll })
        tex.image.data[i * 4 + 0] = v3.x
        tex.image.data[i * 4 + 1] = v3.y
        tex.image.data[i * 4 + 2] = v3.z
        tex.image.data[i * 4 + 3] = 0.0

        i++
      }

      tex.needsUpdate = true

      return tex
    }

    let fragment = {
      position: simPos({ attractorSize, curveSize }),
      // velocity: simVel({ attractorSize }),
    }

    let v3t = new Vector3().set(0, 0, 0)
    let iTex = {
      rebornPosition: initData({
        get: ({ i, e }) => {
          return v3t
        },
      }),
      rebornNormal: initData({
        get: ({ i, e }) => {
          return v3t
        },
      }),
      position: initData({
        get: ({ i, e }) => {
          v3t.x = 0
          v3t.y = 0
          v3t.z = 0
          return v3t
        },
      }),
      // velocity: initData({
      //   get: ({ i, e }) => {
      //     v3t.x = (Math.random() * 2.0 - 1.0) * 0.1;
      //     v3t.y = (Math.random() * 2.0 - 1.0) * 0.1;
      //     v3t.z = (Math.random() * 2.0 - 1.0) * 0.1;
      //     return v3t;
      //   },
      // }),
    }

    // let clock = new Clock()

    let iCoords = accessCoord()

    let iVar = {
      // velocity: gpu.addVariable(
      //   "iv_velocity",
      //   fragment.velocity,
      //   iTex.velocity
      // ),
      position: gpu.addVariable('iv_position', fragment.position, iTex.position),
    }

    iVar.position.material.uniforms.delta = { value: 1 / 60 }
    iVar.position.material.uniforms.time = { value: 0 }
    // iVar.velocity.material.delta = delta;
    // iVar.velocity.material.time = time;

    let clockSim = new Clock()
    core.onLoop(() => {
      let dt = clockSim.getDelta()

      iVar.position.material.uniforms.delta.value = dt
      iVar.position.material.uniforms.time.value += dt
    })

    iVar.position.material.uniforms.sceneDataTextureAlpha = {
      value: sceneDataTextureAlpha,
    }
    iVar.position.material.uniforms.sceneDataTextureBeta = {
      value: sceneDataTextureBeta,
    }

    iVar.position.material.uniforms.activeSize = {
      value: 1,
    }

    iVar.position.material.uniforms.controlPointsTexture = {
      value: curveTexture,
    }

    iVar.position.material.uniforms.rebornPosition = {
      value: iTex.rebornPosition,
    }
    //
    iVar.position.material.uniforms.rebornNormal = {
      value: iTex.rebornNormal,
    }

    iVar.position.material.uniforms.iv_now_position = {
      value: null,
    }
    iVar.position.material.uniforms.iv_previous_position = {
      value: null,
    }

    core.onLoop(() => {
      iVar.position.material.uniforms.controlPointsTexture = {
        value: curveTexture,
      }

      iVar.position.material.uniforms.activeSize = {
        value: sceneObjects.length,
      }

      iVar.position.material.uniforms.surfaceEmissionForce = {
        value: surfaceEmissionForceRef.current,
      }

      iVar.position.material.uniforms.playerAttractionForce = {
        value: playerAttractionForceRef.current,
      }

      iVar.position.material.uniforms.playerSpinningForce = {
        value: playerSpinningForceRef.current,
      }

      iVar.position.material.uniforms.playerPropulsionForce = {
        value: playerPropulsionForceRef.current,
      }

      iVar.position.material.uniforms.shieldRadius = {
        value: shieldRadiusRef.current,
      }

      //
    })

    let posData = new Vector3()
    let normalData = new Vector3()
    let samplingSurface = (sampler, tex, tex2) => {
      let height = tex.image.height
      let width = tex.image.width
      let pxAll = width * height
      let i = 0
      let wp = new Vector3(0, 0, 0)

      for (let px = 0; px < pxAll; px++) {
        //
        i++

        sampler.sample(posData, normalData)
        posData.add(wp)

        // sampler
        tex.image.data[i * 4 + 0] = posData.x
        tex.image.data[i * 4 + 1] = posData.y
        tex.image.data[i * 4 + 2] = posData.z
        tex.image.data[i * 4 + 3] = 0

        tex2.image.data[i * 4 + 0] = normalData.x
        tex2.image.data[i * 4 + 1] = normalData.y
        tex2.image.data[i * 4 + 2] = normalData.z
        tex2.image.data[i * 4 + 3] = 0
      }
      tex.needsUpdate = true
      tex2.needsUpdate = true
    }

    surfaceMesh.updateMatrixWorld(true)
    let samplerGEO = surfaceMesh.geometry.clone()
    samplerGEO.applyMatrix4(surfaceMesh.matrixWorld)
    let sampler = new MeshSurfaceSampler(new Mesh(samplerGEO))
    sampler.build()

    //
    samplingSurface(sampler, iTex.rebornPosition, iTex.rebornNormal)

    let syncMode = () => {
      // iVar.velocity.material.uniforms.weatherNow = {
      //   value: 1,
      // };
      // iVar.position.material.uniforms.weatherNow = {
      //   value: 1,
      // }
    }
    syncMode()
    core.onLoop(syncMode)

    gpu.setVariableDependencies(iVar.position, [iVar.position])

    let error = gpu.init()
    if (error !== null) {
      console.error(error)
    }

    let gpuSamplerSize = Math.floor(64)
    let total = 1 * gpuSamplerSize
    let buffer = !useHalfFloat ? new Float32Array(1 * gpuSamplerSize * 4) : new Uint16Array(1 * gpuSamplerSize * 4)
    let buffAttr = new BufferAttribute(buffer, 4)

    let items = new Array(gpuSamplerSize)
    for (let i = 0; i < total; i++) {
      items[i] = new Object3D()
    }

    core.onLoop(() => {
      gpu.compute()

      // gl.readRenderTargetPixels(
      //   gpu.getCurrentRenderTarget(iVar.position),
      //   0,
      //   Math.floor(Math.random() * size.y),
      //   gpuSamplerSize,
      //   1,
      //   buffer,
      // )

      // cursorA.inRange = 0
      // cursorB.inRange = 0
      // for (let i = 0; i < total; i++) {
      //   let vx = getData(buffAttr.getX(i))
      //   let vy = getData(buffAttr.getY(i))
      //   let vz = getData(buffAttr.getZ(i))

      //   items[i].position.set(vx, vy, vz)

      //   // console.log(cursorA.position)

      //   let distA = cursorA.position.distanceTo(items[i].position)
      //   let distB = cursorB.position.distanceTo(items[i].position)
      //   if (distA <= 1) {
      //     cursorA.inRange++
      //   }

      //   if (distB <= 1) {
      //     cursorB.inRange++
      //   }
      // }

      // useScore.setState((st) => {
      //   return {
      //     ...st,

      //     //
      //     //
      //     scoreA: Math.floor(st.scoreA + cursorA.inRange),

      //     //
      //     scoreB: Math.floor(st.scoreB + cursorB.inRange),
      //   }
      // })

      // cursorA.material.color.setHSL(0.23, (cursorA.inRange / gpuSamplerSize) * 2.0, 0.5)
      // cursorB.material.color.setHSL(0.87, (cursorB.inRange / gpuSamplerSize) * 2.0, 0.5)
    })

    let geo = new InstancedBufferGeometry()
    // let unitGeo = new ConeGeometry(0.1, 0.1, 3, 1);

    let MY_SCALE = 500
    unitGeo.scale(1 / MY_SCALE, 1 / MY_SCALE, 1 / MY_SCALE)

    // unitGeo.scale(0.5, 3, 0.5)
    // geo.copy(unitGeo)

    // geo.copy(new IcosahedronBufferGeometry(0.05, 0.0));

    geo.instanceCount = size.x * size.y

    geo.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0]), 3))
    geo.setAttribute('normal', new BufferAttribute(new Float32Array([0, 0, 0]), 3))
    geo.setAttribute('uv', new BufferAttribute(new Float32Array([0, 0]), 2))

    geo.setAttribute('coords', iCoords.iAttr)

    let renderMaterial = new MeshPhysicalMaterial({
      color: new Color('#ffffff'),
      emissive: new Color('#ffffff'),
      roughness: 0.0,
      metalness: 0.0,
      transmission: 0,
      thickness: 0,
      flatShading: true,
      side: DoubleSide,
    })
    renderMaterial = new ShaderMaterial({
      transparent: true,
      // blending: SubtractiveBlending,
      vertexShader: /* glsl */ `
          attribute vec4 coords;
          uniform sampler2D iv_position;
          uniform sampler2D iv_previous_position;
          // uniform sampler2D iv_velocity;

          uniform float weatherNow;
          uniform float unitScale;
          uniform float randomness;
          uniform float dt;
          uniform float time;

          ${getRotation()}

          #include <common>

          mat3 calcLookAtMatrix(vec3 origin, vec3 target, float roll) {
            vec3 rr = vec3(sin(roll), cos(roll), 0.0);
            vec3 ww = normalize(target - origin);
            vec3 uu = normalize(cross(ww, rr));
            vec3 vv = normalize(cross(uu, ww));

            return mat3(uu, vv, ww);
          }
          
          void main (void) {
            vec4 fowradPosData = texture2D(iv_position, coords.xy);
            vec4 backPosData = texture2D(iv_previous_position, coords.xy);
            // vec4 velData = texture2D(iv_velocity, coords.xy);

            vec3 geom = position;

            vec3 transformed = vec3( geom * ${MY_SCALE}.0 * mix(unitScale, unitScale * (rand(coords.xy) * 2.0 - 1.0), randomness));

            // vec3 diff = (fowradPosData.xyz - backPosData.xyz) * dt;
            // diff = normalize(diff) * 3.141592 * 2.0;

            // transformed *= calcLookAtMatrix(fowradPosData.rgb, backPosData.rgb, 0.0);

            // transformed.xyz *= rotation3dX(diff.x);
            // transformed.xyz *= rotation3dY(diff.y);
            // transformed.xyz *= rotation3dZ(diff.z);

            gl_PointSize = 5.5;
            transformed += fowradPosData.xyz;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
          }
        `,

      fragmentShader: /* glsl */ `
          void main(void) {
            if (length(gl_PointCoord.xy - 0.5) <= 0.5) {
              gl_FragColor = vec4(0.0, 0.0, 1.0, 0.5);
            } else {
              discard;
            }
          }
        `,
    })

    renderMaterial.onBeforeCompile = (shader, gl) => {
      let sync = () => {
        // renderMaterial.color.set(colorRef.current)
        // renderMaterial.emissive.set(emissiveRef.current)
        // renderMaterial.roughness = Number(roughnessRef.current || 0)
        // renderMaterial.metalness = Number(metalnessRef.current || 0)
        // renderMaterial.transmission = Number(transmissionRef.current || 0)
        // renderMaterial.thickness = Number(thicknessRef.current || 0)

        shader.uniforms.iv_position = shader.uniforms.iv_position || {
          value: null,
        }
        shader.uniforms.iv_previous_position = shader.uniforms.iv_previous_position || {
          value: null,
        }
        // shader.uniforms.iv_velocity = shader.uniforms.iv_velocity || {
        //   value: null,
        // };
        shader.uniforms.randomness = {
          value: randomnessRef.current,
        }

        //
        shader.uniforms.iv_position.value = gpu.getCurrentRenderTarget(iVar.position).texture
        shader.uniforms.iv_previous_position.value = gpu.getAlternateRenderTarget(iVar.position).texture
        // shader.uniforms.iv_velocity.value = gpu.getCurrentRenderTarget(
        //   iVar.velocity
        // ).texture;
      }
      sync()
      core.onLoop(sync)
      let clock = new Clock()
      let syncMode = () => {
        shader.uniforms.weatherNow = {
          value: 1,
        }
        shader.uniforms.weatherNow = {
          value: 1,
        }

        shader.uniforms.unitScale = {
          value: unitScaleRef.current,
        }

        let dt = clock.getDelta()
        let time = clock.getElapsedTime()
        shader.uniforms.dt = {
          value: dt,
        }
        shader.uniforms.time = {
          value: time,
        }
      }
      syncMode()
      core.onLoop(syncMode)

      shader.vertexShader = `${shader.vertexShader.replace(
        `void main() {`,
        /* glsl */ `
        attribute vec4 coords;
        uniform sampler2D iv_position;
        uniform sampler2D iv_previous_position;
        // uniform sampler2D iv_velocity;

        uniform float weatherNow;
        uniform float unitScale;
        uniform float randomness;
        uniform float dt;
        uniform float time;

        ${getRotation()}

        mat3 calcLookAtMatrix(vec3 origin, vec3 target, float roll) {
          vec3 rr = vec3(sin(roll), cos(roll), 0.0);
          vec3 ww = normalize(target - origin);
          vec3 uu = normalize(cross(ww, rr));
          vec3 vv = normalize(cross(uu, ww));

          return mat3(uu, vv, ww);
        }

        void main() {`,
      )}`

      //!SECTION

      shader.defines.MY_SCALE = MY_SCALE.toFixed(1)

      //

      shader.vertexShader = shader.vertexShader.replace(
        `#include <begin_vertex>`,
        /* glsl */ `
        vec4 fowradPosData = texture2D(iv_position, coords.xy);
        vec4 backPosData = texture2D(iv_previous_position, coords.xy);
        // vec4 velData = texture2D(iv_velocity, coords.xy);

        vec3 geom = position;

        vec3 transformed = vec3( geom * ${MY_SCALE}.0 * mix(unitScale, unitScale * (rand(coords.xy) * 2.0 - 1.0), randomness));

        vec3 diff = (fowradPosData.xyz - backPosData.xyz) * dt;
        diff = normalize(diff) * 3.141592 * 2.0;

        // transformed *= calcLookAtMatrix(fowradPosData.rgb, backPosData.rgb, 0.0);

        transformed.xyz *= rotation3dX(diff.x);
        transformed.xyz *= rotation3dY(diff.y);
        transformed.xyz *= rotation3dZ(diff.z);

        gl_PointSize = 1.0;
        transformed += fowradPosData.xyz;
      `,
      )
    }

    let pts = new Points(geo, renderMaterial)
    pts.castShadow = true
    pts.receiveShadow = true
    pts.frustumCulled = false
    pts.position.x = 0
    pts.position.y = 0
    pts.position.z = 0

    // let scene = await gpi.ready.scene;
    scene.add(pts)

    core.onClean(() => {
      pts.removeFromParent()
    })

    ///

    // let noodle = new NoodleO3({
    //   renderer: gl,
    //   params: {
    //     jawOpen: 1,
    //     browInnerUp: 1,
    //   },
    //   core: core,
    //   getRebornPosition: () => {
    //     return iTex.rebornPosition;
    //   },
    //   getHeadList: () => {
    //     let rtt = gpu.getCurrentRenderTarget(iVar.position);
    //     return rtt.texture;
    //   },
    //   getAltHeadList: () => {
    //     let rtt = gpu.getAlternateRenderTarget(iVar.position);
    //     return rtt.texture;
    //   },
    //   howManyTracker: size.y,
    //   tailLength: 32,
    // });

    // core.onLoop(() => {
    //   let dt = clock.getDelta();
    //   noodle.track({ trackers: [], lerp: 0, dt: dt });
    // });

    // scene.add(noodle.o3d);
  }, [])
  return <></>
}

function simPos({ attractorSize, curveSize }) {
  return /* glsl */ `
  uniform float time;
  uniform float delta;

    #include <common>

    ${getCurlNoise()}
    ${getFbmPattern()}
    ${getRotation()}
    ${getBallify()}
    ${getCatmullRom()}

    uniform sampler2D sceneDataTextureAlpha;
    uniform sampler2D sceneDataTextureBeta;
    // uniform float weatherNow;
    uniform sampler2D rebornPosition;
    uniform sampler2D rebornNormal;

    uniform float activeSize;
  //

    uniform float surfaceEmissionForce;
    uniform float playerAttractionForce;
    uniform float playerSpinningForce;
    uniform float playerPropulsionForce;
    uniform float shieldRadius;

    vec3 booster (vec3 data_sim_position, float ci, float total) {
      vec3 curveInflu;

      vec4 ptn0 = texture2D(controlPointsTexture, vec2(ci / total, 0.0));

      if (ptn0.w == 1.0) {
        vec3 diff0 = (ptn0.rgb - data_sim_position.xyz);
        curveInflu += normalize(diff0) * min(length(diff0), 2.0) * 0.05;
      }

      return curveInflu;
    }


    void main (void) {

      vec2 uv = gl_FragCoord.xy / resolution.xy;
      vec4 data_sim_position = texture2D( iv_position, uv );

      vec4 data_sim_velocity = vec4(0.0, 0.0, 0.0, 0.0);
      const float resY = ${attractorSize.y.toFixed(1)};
      const float resX = ${attractorSize.x.toFixed(1)};

      const float resXY = resX * resY;

      float intv = 0.0;
      for (float y = 0.0; y < resY; y += 1.0) {
        for (float x = 0.0; x < resX; x += 1.0) {

          vec2 sceneUV = vec2(x / resX, y / resY);
          vec4 dataAlpha = texture2D(sceneDataTextureAlpha, sceneUV);
          vec4 dataBeta = texture2D(sceneDataTextureBeta, sceneUV);

          if (dataBeta.x == 3.0) {
            vec3 diff = (dataAlpha.xyz - data_sim_position.xyz);
            float strength = dataBeta.y;
            data_sim_velocity.xyz += normalize(diff) * strength;
          }

          if (dataBeta.x == 4.0) {
            vec3 diff = (dataAlpha.xyz - data_sim_position.xyz);
            float strength = dataBeta.y;
            float twist = dataBeta.z;

            diff.rgb *= rotation3dX(twist);

            float len = length(diff);

            data_sim_velocity.xyz += normalize(diff.xyz) * strength;
          }

          if (dataBeta.x == 5.0) {
            //
            vec3 diff = (dataAlpha.xyz - data_sim_position.xyz);
            float strength = dataBeta.y;
            float twist = dataBeta.z;

            diff.rgb *= rotation3dY(twist);

            float len = length(diff);

            data_sim_velocity.xyz += normalize(diff.xyz) * strength;
          }

          if (dataBeta.x == 6.0) {
            //
            vec3 diff = (dataAlpha.xyz - data_sim_position.xyz);
            float strength = dataBeta.y;
            float twist = dataBeta.z;

            diff.rgb *= rotation3dZ(twist);

            float len = length(diff);

            data_sim_velocity.xyz += normalize(diff.xyz) * strength;
          }

          //
          if (dataBeta.x == 2.0) {
            //
            vec3 diff = (dataAlpha.xyz - data_sim_position.xyz);
            float insideForce = -1.0;
            float outsideForce = 1.0;
            float radius = 10.0;


            radius = shieldRadius;
            insideForce = -1.0 * playerPropulsionForce;
            outsideForce = 1.0 * playerAttractionForce;

            float strength = abs((length(diff) - radius));
            if (strength >= 20.0) {
              strength = 20.0;
            }

            diff.rgb *= rotation3dY(playerSpinningForce);

            if (length(diff) >= radius) {
              data_sim_velocity.xyz += normalize(diff) * (outsideForce) * strength;
            } else {
              data_sim_velocity.xyz += normalize(diff) * (insideForce) * strength;
            }
          }

          intv += 1.0;
        }
      }


      const float total = ${curveSize.x.toFixed(1)};

      float progress = 0.0;
      vec3 nearest = vec3(0.0);

      for (float i = 0.0; i < (total); i += 1.0) {
        vec4 pt = texture2D(controlPointsTexture, vec2(i / total, 0.5));
        vec3 last = nearest;

        if (length(last - data_sim_position.rgb) > length(pt.rgb - data_sim_position.rgb)) {
          nearest = pt.rgb;
        }
      }

      for (float i = 0.0; i < (total); i += 1.0) {
        vec4 pt = texture2D(controlPointsTexture, vec2(i / total, 0.5));
        if (length(nearest - pt.rgb) <= 0.1) {
          progress = i;
        }
      }


      data_sim_position.rgb += booster(data_sim_position.rgb, progress, total) * 0.5;

      data_sim_position.rgb += booster(data_sim_position.rgb, progress + 1.0, total) * 1.5;


      //
      //
      //
      //
      //
      vec4 rebornNormalData = texture2D(rebornNormal, uv);
      vec4 rebornPositionData = texture2D(rebornPosition, uv);

      data_sim_velocity.xyz += normalize(rebornNormalData.rgb) * surfaceEmissionForce;

      data_sim_position.rgb += data_sim_velocity.rgb * 0.05;


      data_sim_position.w -= 0.01 * 0.1;

      // reset
      // if (data_sim_position.y <= -10.0 || data_sim_position.w == 0.0 || rand(data_sim_position.xy + time) >= 0.99) {
      if (data_sim_position.w < 0.0 || length(data_sim_position.rgb - rebornPositionData.rgb) >= 500.0) {
        //data_sim_position.w == 0.0 || rand(data_sim_position.xy + time) >= 0.99 ||

        // vec3 resetPosition = vec3(
        //   -0.5 + rand(uv + 0.1),
        //   -0.5 + rand(uv + 0.2),
        //   -0.5 + rand(uv + 0.3)
        // ) * vec3(100.0, -1.0, 100.0);

        // if (weatherNow == 1.0) {
        //   //

        //   resetPosition = vec3(
        //     -0.5 + rand(uv + 0.1),
        //     -0.5 + rand(uv + 0.2),
        //     -0.5 + rand(uv + 0.3)
        //   ) * vec3(80.0, 1.0, 80.0);

        //   resetPosition.y += 25.0;

        //   //
        // } else if (weatherNow == 2.0) {
        //   resetPosition = vec3(
        //     -0.5 + rand(uv + 0.1),
        //     -0.5 + rand(uv + 0.2),
        //     -0.5 + rand(uv + 0.3)
        //   ) * vec3(40.0, 20.0, 40.0);

        //   resetPosition.y += 10.0;

        //   // resetPosition = ballify(resetPosition, 50.0);
        //   // resetPosition.y += 50.0 * 2.0;
        // } else if (weatherNow == 3.0) {
        //   resetPosition = vec3(
        //     -0.5 + rand(uv + 0.1),
        //     -0.5 + rand(uv + 0.2),
        //     -0.5 + rand(uv + 0.3)
        //   ) * vec3(80.0, 0.0, 80.0);
        //   resetPosition.y += 1.0;
        // }



        data_sim_position.xyz = rebornPositionData.rgb;//resetPosition;

        data_sim_position.w = (rand(uv + time)) * 1.0;
      }


      // data_sim_position.rgb *= rotation3dX(0.013);
      // data_sim_position.rgb *= rotation3dY(0.013);
      // data_sim_position.rgb *= rotation3dZ(0.013);

      gl_FragColor = vec4(data_sim_position.rgb, data_sim_position.w);
    }
  `
}

function getCatmullRom() {
  return /* glsl */ `
  uniform sampler2D controlPointsTexture;
  vec4 getLineByTexture (float lineIndex, float t) {
    vec4 color = texture2D(controlPointsTexture,
      vec2(
        t,
        lineIndex
      )
    );

    return color.rgba;
  }


  vec3 catmullRom (vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
      vec3 v0 = (p2 - p0) * 0.5;
      vec3 v1 = (p3 - p1) * 0.5;
      float t2 = t * t;
      float t3 = t * t * t;

      return vec3((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);
  }

  vec4 getIndexLineByProgress (float lineIndex, float t, float total) {
    bool closed = false;
    float ll = total;
    float minusOne = 0.0;
    if (closed) {
      minusOne = 0.0;
    }

    float p = (ll - minusOne) * t;
    float intPoint = floor(p);
    float weight = p - intPoint;

    float idx0 = (intPoint +  0.0) / ll;
    float idx1 = (intPoint +  1.0) / ll;
    float idx2 = (intPoint +  2.0) / ll;
    float idx3 = (intPoint +  3.0) / ll;

    if (idx0 > 1.0) {
      idx0 = 1.0;
    }
    if (idx1 > 1.0) {
      idx1 = 1.0;
    }
    if (idx2 > 1.0) {
      idx2 = 1.0;
    }
    if (idx3 > 1.0) {
      idx3 = 1.0;
    }

    vec4 pt0 = getLineByTexture(lineIndex, idx0);
    vec4 pt1 = getLineByTexture(lineIndex, idx1);
    vec4 pt2 = getLineByTexture(lineIndex, idx2);
    vec4 pt3 = getLineByTexture(lineIndex, idx3);

    vec4 pointoutput = vec4(.0);
    vec4 pt4 = getLineByTexture(lineIndex, idx2);

    pointoutput.rgb = catmullRom(pt0.rgb, pt1.rgb, pt2.rgb, pt3.rgb, weight);
    pointoutput.a = pt4.a;

    return pointoutput;
  }


  `
}

function getCurlNoise() {
  return /* glsl */ `

//
// Description : Array and textureless GLSL 2D/3D/4D simplex
//               noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : ijm
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
  {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
  }


vec3 snoiseVec3( vec3 x ){

  float s  = snoise(vec3( x ));
  float s1 = snoise(vec3( x.y - 19.1 , x.z + 33.4 , x.x + 47.2 ));
  float s2 = snoise(vec3( x.z + 74.2 , x.x - 124.5 , x.y + 99.4 ));
  vec3 c = vec3( s , s1 , s2 );
  return c;

}


vec3 curlNoise( vec3 p ){

  const float e = .1;
  vec3 dx = vec3( e   , 0.0 , 0.0 );
  vec3 dy = vec3( 0.0 , e   , 0.0 );
  vec3 dz = vec3( 0.0 , 0.0 , e   );

  vec3 p_x0 = snoiseVec3( p - dx );
  vec3 p_x1 = snoiseVec3( p + dx );
  vec3 p_y0 = snoiseVec3( p - dy );
  vec3 p_y1 = snoiseVec3( p + dy );
  vec3 p_z0 = snoiseVec3( p - dz );
  vec3 p_z1 = snoiseVec3( p + dz );

  float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
  float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
  float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

  const float divisor = 1.0 / ( 2.0 * e );
  return normalize( vec3( x , y , z ) * divisor );

}

  `
}

function getFbmPattern() {
  return /* glsl */ `

    const mat2 m = mat2( 0.80,  0.60, -0.60,  0.80 );

    float noise( in vec2 p ) {
      return sin(p.x)*sin(p.y);
    }

    float fbm4( vec2 p ) {
        float f = 0.0;
        f += 0.5000 * noise( p ); p = m * p * 2.02;
        f += 0.2500 * noise( p ); p = m * p * 2.03;
        f += 0.1250 * noise( p ); p = m * p * 2.01;
        f += 0.0625 * noise( p );
        return f / 0.9375;
    }

    float fbm6( vec2 p ) {
        float f = 0.0;
        f += 0.500000*(0.5 + 0.5 * noise( p )); p = m*p*2.02;
        f += 0.250000*(0.5 + 0.5 * noise( p )); p = m*p*2.03;
        f += 0.125000*(0.5 + 0.5 * noise( p )); p = m*p*2.01;
        f += 0.062500*(0.5 + 0.5 * noise( p )); p = m*p*2.04;
        f += 0.031250*(0.5 + 0.5 * noise( p )); p = m*p*2.01;
        f += 0.015625*(0.5 + 0.5 * noise( p ));
        return f/0.96875;
    }

    float pattern (vec2 p) {
      float vout = fbm4( p + time + fbm6(  p + fbm4( p + time )) );
      return abs(vout);
    }
  `
}

function getRotation() {
  return /* glsl */ `

  mat3 rotation3dX(float angle) {
    float s = sin(angle);
    float c = cos(angle);

    return mat3(
      1.0, 0.0, 0.0,
      0.0, c, s,
      0.0, -s, c
    );
  }
  vec3 rotateX(vec3 v, float angle) {
    return rotation3dX(angle) * v;
  }

  mat3 rotation3dY(float angle) {
    float s = sin(angle);
    float c = cos(angle);

    return mat3(
      c, 0.0, -s,
      0.0, 1.0, 0.0,
      s, 0.0, c
    );
  }

  vec3 rotateY(vec3 v, float angle) {
    return rotation3dY(angle) * v;
  }

  mat3 rotation3dZ(float angle) {
    float s = sin(angle);
    float c = cos(angle);

    return mat3(
      c, s, 0.0,
      -s, c, 0.0,
      0.0, 0.0, 1.0
    );
  }

  vec3 rotateZ(vec3 v, float angle) {
    return rotation3dZ(angle) * v;
  }
  `
}

function getBallify() {
  return /* glsl */ `
  #define M_PI_3_1415 3.1415926535897932384626433832795

  float atan2(in float y, in float x) {
    bool xgty = (abs(x) > abs(y));
    return mix(M_PI_3_1415 / 2.0 - atan(x,y), atan(y,x), float(xgty));
  }

  vec3 fromBall(float r, float az, float el) {
    return vec3(
      r * cos(el) * cos(az),
      r * cos(el) * sin(az),
      r * sin(el)
    );
  }
  void toBall(vec3 pos, out float az, out float el) {
    az = atan2(pos.y, pos.x);
    el = atan2(pos.z, sqrt(pos.x * pos.x + pos.y * pos.y));
  }

  // float az = 0.0;
  // float el = 0.0;
  // vec3 noiser = vec3(lastVel);
  // toBall(noiser, az, el);
  // lastVel.xyz = fromBall(1.0, az, el);

  vec3 ballify (vec3 pos, float r) {
    float az = atan2(pos.y, pos.x);
    float el = atan2(pos.z, sqrt(pos.x * pos.x + pos.y * pos.y));
    return vec3(
      r * cos(el) * cos(az),
      r * cos(el) * sin(az),
      r * sin(el)
    );
  }

  `
}
