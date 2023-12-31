import { Mesh, Object3D } from 'three'
import { NoodleGeo } from './NoodleGeo'
import { NoodleGeoGPGPU } from './NoodleGeoGPGPU'
import { NoodlePhysicalMaterial } from './NoodlePhysicalMaterial'
// import { NoodleMat } from './NoodleMat'

export class NoodleEntry extends Object3D {
  constructor({ core }) {
    super()

    let lineCount = core.count

    let { geometry, subdivisions, count } = new NoodleGeo({
      count: lineCount,
      numSides: 4,
      subdivisions: 64,
      openEnded: false,
    })

    // let material = new NoodleMat({ core, subdivisions, lineCount: lineCount })

    let material = new NoodlePhysicalMaterial({ core, subdivisions, lineCount: lineCount })
    let mesh = new Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true

    mesh.needsUpdate = true

    new NoodleGeoGPGPU({
      lineSegments: subdivisions,
      lineCount: lineCount,
      material,
      core: core,
    })

    mesh.frustumCulled = false

    this.add(mesh)
  }
}

//

//

//
