import { Mesh, Object3D } from 'three'
import { NoodleGeo } from './NoodleGeo'
import { NoodleMat } from './NoodleMat'
import { NoodleGeoGPGPU } from './NoodleGeoGPGPU'

export class NoodleEntry extends Object3D {
  constructor({ core }) {
    super()

    let lineCount = core.count || 512

    let { geometry, subdivisions, count } = new NoodleGeo({
      count: lineCount,
      numSides: 4,
      subdivisions: 64,
      openEnded: false,
    })
    geometry.instanceCount = count

    let material = new NoodleMat({ core, subdivisions, lineCount: lineCount })

    let mesh = new Mesh(geometry, material)

    mesh.needsUpdate = true

    new NoodleGeoGPGPU({
      lineSegments: subdivisions,
      lineCount: lineCount,
      material,
      core: core,
    })

    mesh.frustumCulled = false

    this.add(mesh)

    // mesh.add(new Mesh(new BoxGeometry(1, 1, 1)))

    // {
    //   // / debug
    //   let data = new Float32Array(subdivisions * lineCount * 4)

    //   let i = 0
    //   for (let y = 0; y < lineCount; y++) {
    //     for (let x = 0; x < subdivisions; x++) {
    //       data[i + 0] = (x / subdivisions) * 2
    //       data[i + 1] = (y / lineCount) * 256
    //       data[i + 2] = 0
    //       data[i + 3] = 1

    //       i += 4
    //     }
    //   }
    //   let dataTex = new DataTexture(data, subdivisions, lineCount, RGBAFormat, FloatType)
    //   dataTex.needsUpdate = true
    //   material.uniforms.posTexture.value = dataTex
    //   material.needsUpdate = true
    // }
  }
}

//
