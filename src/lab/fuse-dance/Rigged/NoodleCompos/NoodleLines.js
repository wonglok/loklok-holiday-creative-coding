import { BoxGeometry, Mesh, Object3D } from 'three'
import { NoodleGeo } from './NoodleGeo'
import { NoodleMat } from './NoodleMat'
import { NoodleGeoGPGPU } from './NoodleGeoGPGPU'

export class NoodleLines extends Object3D {
  constructor({ parent, onLoop }) {
    super()

    this.onLoop = onLoop
    this.parent = parent

    let lineCount = 1024

    let { geometry, subdivisions, count } = new NoodleGeo({
      count: lineCount,
      numSides: 4,
      subdivisions: 128,
      openEnded: false,
    })
    geometry.instanceCount = count

    let material = new NoodleMat({ subdivisions, lineCount: lineCount })

    let mesh = new Mesh(geometry, material)

    new NoodleGeoGPGPU({
      lineSegments: subdivisions,
      lineCount: lineCount,
      material,
      parent: this.parent,
      onLoop: (v) => this.onLoop(v),
    })
    // getPositonTexture
    // getMoveTexture

    //
    // mesh.add(new Mesh(new BoxGeometry(1, 1, 1)))
    this.add(mesh)
  }
}
