import { Core } from './Core'
import { Box, Center, useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { AnimationMixer, Clock, Matrix4, SphereGeometry } from 'three'
import {
  ArrowHelper,
  // AxesHelper,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from 'three'
import { useTweaks } from 'use-tweaks'
import { FunSim } from './FunSim'
import { PhysicsInfluences } from './PositionSimulation'
import { getSkinData } from '../Rigged/Rigged'

export function Rain() {
  let wingGLB = useGLTF(`/wings/wing1.glb`)
  // let { get } = useThree();
  let mini = Core
  useFrame(() => {
    Core.work()
  })

  let cursorPointer = useMemo(() => {
    return new Vector3()
  }, [])

  let txt = `${PhysicsInfluences.key}${FunSim.key}`

  let { sim, compos } = useMemo(() => {
    if (!wingGLB) {
      return
    }
    wingGLB.scene.scale.setScalar(1)
    wingGLB.scene.traverse((it) => {
      it.frustumCulled = false
    })
    let arr = wingGLB.scene.getObjectsByProperty('type', 'SkinnedMesh')
    let skms = arr[0]
    let mixer = new AnimationMixer(wingGLB.scene)
    let action = mixer.clipAction(wingGLB.animations[0], wingGLB.scene)

    action.reset().play()

    let c2 = new Clock()
    Core.onLoop(() => {
      let dt = c2.getDelta()
      mixer.update(dt)
    })

    if (!skms) {
      return {}
    }

    let sim = new FunSim({
      skinData: getSkinData({ skinnedMesh: skms }),
      cursorPointer: cursorPointer,
      node: mini,
      influences: [
        // {
        //   name: 'center',
        //   type: `computeSphere`,
        //   enabled: true,
        //   mouse: true,
        //   needsUpdate: true,
        //   position: { x: 0, y: 0, z: 0 },
        //   radius: 500,
        //   force: 500,
        //   noise: 0,
        // },

        // //
        // {
        //   name: 'vortexA',
        //   type: `computeVortex`,
        //   enabled: true,
        //   needsUpdate: true,
        //   mouse: true,
        //   position: { x: 0, y: 0, z: 0 },
        //   force: 5000,
        //   radius: 250,
        //   // min: -4.0,
        //   // max: 4.0,
        // },

        // {
        //   type: `computeSphere`,
        //   enabled: true,
        //   mouse: false,
        //   needsUpdate: true,
        //   position: { x: 0, y: 0, z: 0 },
        //   radius: 1.5,
        //   force: -30.0 * 1.3,
        //   noise: 3.0,
        // },

        // {
        //   name: 'gravity',
        //   type: `computeGravity`,
        //   enabled: true,
        //   direction: { x: 0, y: 0, z: 0 },
        //   force: 0,
        // },

        {
          name: 'mouse3d',
          type: `computeSphere`,
          enabled: true,
          mouse: true,
          needsUpdate: true,
          position: { x: 1000, y: 1000, z: 1000 },
          radius: 250,
          force: 50000,
          noise: 0,
        },
      ],
      tailLength: 32, // 512, 1024
      howManyTrackers: 4096,

      autoReload: txt,
    })

    return {
      sim,
      compos: <primitive object={wingGLB.scene}></primitive>,
    }
  }, [mini, cursorPointer, txt, wingGLB])

  //

  // let mouse = useTweaks('mouse', {
  //   // enabled: true,
  //   mouse: true,
  //   needsUpdate: true,
  //   position: { x: 0, y: 0, z: 0 },
  //   radius: 60,
  //   force: -50000,
  //   noise: 0,
  // })

  // let centerGravity = useTweaks('center gravity', {
  //   // enabled: true,
  //   mouse: true,
  //   needsUpdate: true,
  //   position: { x: 0, y: 0, z: 0 },
  //   radius: 500,
  //   force: 500,
  //   noise: 0,
  // })

  // let vortex = useTweaks('vortex', {
  //   // enabled: true,
  //   needsUpdate: true,
  //   mouse: true,
  //   position: { x: 0, y: 0, z: 0 },
  //   force: 500,
  //   radius: 250,
  // })

  useFrame(({ camera }) => {
    sim?.track()
  })

  let refToucher = useRef()
  useFrame(({ camera }) => {
    if (refToucher.current) {
      refToucher.current.lookAt(camera.position)
    }
  })

  let controls = useThree((r) => r.controls)
  //

  if (!wingGLB) {
    return null
  }
  if (!sim) {
    return null
  }

  return (
    <group position={[0, 0, 0]}>
      {compos}
      {/* <Box visible={false}></Box> */}
      {/* <Box></Box> */}
      <Box
        ref={refToucher}
        args={[100000, 100000, 0.01]}
        visible={false}
        onPointerMove={(ev) => {
          //
          let influ = sim.influences.find((e) => e.name === 'mouse3d')
          if (influ) {
            influ.position.x = ev.point.x
            influ.position.y = ev.point.y
            influ.position.z = ev.point.z
            influ.needsUpdate = true
          }

          // cursorPointer.copy(ev.point)
        }}
        onPointerUp={(ev) => {
          if (controls) {
            controls.enabled = true
          }
        }}
        onPointerDown={(ev) => {
          if (controls) {
            // controls.enabled = false
          }
          let influ = sim.influences.find((e) => e.name === 'mouse3d')
          if (influ) {
            influ.position.x = ev.point.x
            influ.position.y = ev.point.y
            influ.position.z = ev.point.z
            influ.needsUpdate = true
          }

          // cursorPointer.copy(ev.point)
        }}
      ></Box>
      {/* <OrbitDrei /> */}
      {/* <Visualise influ={sim.influences} /> */}

      <primitive object={sim.o3d}></primitive>
    </group>
  )
}

function Visualise({ influ }) {
  let mini = Core
  let ref = useRef()
  useEffect(() => {
    let o3d = ref.current

    o3d.children.forEach((k) => {
      o3d.remove(k)
    })

    influ.forEach((it) => {
      if (it.type === 'computeVortex') {
        let geo = new SphereGeometry(1, 32, 32)
        let mesh = new Mesh(
          geo,
          new MeshBasicMaterial({
            color: '#fff',
            transparent: true,
            opacity: 0.05,
            wireframe: true,
          }),
        )
        o3d.add(mesh)
        mini.onLoop(() => {
          mesh.scale.setScalar(it.radius)
          mesh.position.copy(it.position)
        })
      }

      if (it.type === 'computeSphere') {
        let geo = new SphereGeometry(1, 32, 32)
        let mesh = new Mesh(
          geo,
          new MeshBasicMaterial({
            color: '#00f',
            transparent: true,
            opacity: 0.3,
            wireframe: true,
          }),
        )
        o3d.add(mesh)
        mini.onLoop(() => {
          mesh.scale.setScalar(it.radius)
          mesh.position.copy(it.position)
        })
      }

      if (it.type === 'computeGravity') {
        let mesh1 = new ArrowHelper(5)
        o3d.add(mesh1)
      }

      //
    })

    return () => {
      o3d.children.forEach((k) => {
        o3d.remove(k)
      })
    }

    //
  }, [mini, influ])
  return <group ref={ref}></group>
}
