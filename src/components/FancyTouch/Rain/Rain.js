import { Core } from './Core'
import { Box } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { SphereGeometry } from 'three'
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

export function Rain() {
  // let { get } = useThree();
  let mini = Core
  useFrame(() => {
    Core.work()
  })

  let cursorPointer = useMemo(() => {
    return new Vector3()
  }, [])

  let sim = useMemo(() => {
    return new FunSim({
      cursorPointer: cursorPointer,
      node: mini,
      influences: [
        {
          name: 'center',
          type: `computeSphere`,
          enabled: true,
          mouse: true,
          needsUpdate: true,
          position: { x: 0, y: 0, z: 0 },
          radius: 500,
          force: 500,
          noise: 0,
        },

        //
        {
          name: 'vortexA',
          type: `computeVortex`,
          enabled: true,
          needsUpdate: true,
          mouse: true,
          position: { x: 0, y: 0, z: 0 },
          force: 5000,
          radius: 250,
          // min: -4.0,
          // max: 4.0,
        },

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
          position: { x: 0, y: 0, z: 0 },
          radius: 250,
          force: 50000,
          noise: 0,
        },
      ],
      tailLength: 45, // 512, 1024
      howManyTrackers: 1024,
    })
  }, [mini, cursorPointer, PhysicsInfluences.key, FunSim.key])

  //

  let mouse = useTweaks('mouse', {
    // enabled: true,
    mouse: true,
    needsUpdate: true,
    position: { x: 0, y: 0, z: 0 },
    radius: 60,
    force: -50000,
    noise: 0,
  })

  let centerGravity = useTweaks('center gravity', {
    // enabled: true,
    mouse: true,
    needsUpdate: true,
    position: { x: 0, y: 0, z: 0 },
    radius: 500,
    force: 500,
    noise: 0,
  })

  let vortex = useTweaks('vortex', {
    // enabled: true,
    needsUpdate: true,
    mouse: true,
    position: { x: 0, y: 0, z: 0 },
    force: 500,
    radius: 250,
  })

  useFrame(({ camera }) => {
    sim?.track()

    //
    {
      let target = sim.influences.find((e) => e.name === 'mouse3d')
      for (let kn in mouse) {
        target[kn] = mouse[kn]
      }
    }
    {
      let target = sim.influences.find((e) => e.name === 'vortexA')
      for (let kn in vortex) {
        target[kn] = vortex[kn]
      }
    }
    {
      let target = sim.influences.find((e) => e.name === 'center')
      for (let kn in centerGravity) {
        target[kn] = centerGravity[kn]
      }
    }
    // radius
  })

  let refToucher = useRef()
  useFrame(({ camera }) => {
    if (refToucher.current) {
      refToucher.current.lookAt(camera.position)
    }
  })

  //
  return (
    <group position={[0, 0, 0]}>
      <Box
        ref={refToucher}
        args={[10000, 10000, 0.1]}
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
        onPointerDown={(ev) => {
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
