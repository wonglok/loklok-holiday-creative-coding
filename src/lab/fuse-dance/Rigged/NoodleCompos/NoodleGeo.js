import {
  BufferAttribute,
  CylinderGeometry,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Vector2,

  //

  // DataTexture,
  // DataUtils,
  // RGBFormat,
  // PlaneBufferGeometry,
  // MeshBasicMaterial,
  // TextureLoader,
  // AdditiveBlending,
  // MathUtils,
  Color,
} from 'three'
import { Geometry } from './Geo.js'
import Pal from 'nice-color-palettes'

export class NoodleGeo {
  constructor(props) {
    let { count = 20, numSides = 4, subdivisions = 50, openEnded = true } = props
    const radius = 1
    const length = 1

    const cylinderBufferGeo = new CylinderGeometry(radius, radius, length, numSides, subdivisions, openEnded)

    let baseGeometry = new Geometry()
    baseGeometry = baseGeometry.fromBufferGeometry(cylinderBufferGeo)

    baseGeometry.rotateZ(Math.PI / 2)

    // compute the radial angle for each position for later extrusion
    const tmpVec = new Vector2()
    const xPositions = []
    const angles = []
    const uvs = []
    const vertices = baseGeometry.vertices
    const faceVertexUvs = baseGeometry.faceVertexUvs[0]
    const oPositions = []

    // Now go through each face and un-index the geometry.
    baseGeometry.faces.forEach((face, i) => {
      const { a, b, c } = face
      const v0 = vertices[a]
      const v1 = vertices[b]
      const v2 = vertices[c]
      const verts = [v0, v1, v2]
      const faceUvs = faceVertexUvs[i]

      // For each vertex in this face...
      verts.forEach((v, j) => {
        tmpVec.set(v.y, v.z).normalize()

        // the radial angle around the tube
        const angle = Math.atan2(tmpVec.y, tmpVec.x)
        angles.push(angle)

        // "arc length" in range [-0.5 .. 0.5]
        xPositions.push(v.x)
        oPositions.push(v.x, v.y, v.z)

        // copy over the UV for this vertex
        uvs.push(faceUvs[j].toArray())
      })
    })

    // build typed arrays for our attributes
    const posArray = new Float32Array(xPositions)
    const angleArray = new Float32Array(angles)
    const uvArray = new Float32Array(uvs.length * 2)

    const origPosArray = new Float32Array(oPositions)

    // unroll UVs
    for (let i = 0; i < posArray.length; i++) {
      const [u, v] = uvs[i]
      uvArray[i * 2 + 0] = u
      uvArray[i * 2 + 1] = v
    }

    const lineGeo = new InstancedBufferGeometry()
    lineGeo.instanceCount = count

    lineGeo.setAttribute('position', new BufferAttribute(origPosArray, 3))
    lineGeo.setAttribute('tubeInfo', new BufferAttribute(posArray, 1))
    lineGeo.setAttribute('angle', new BufferAttribute(angleArray, 1))
    lineGeo.setAttribute('uv', new BufferAttribute(uvArray, 2))

    // let offset = [];
    // let ddxyz = Math.floor(Math.pow(count, 1 / 3));
    // let iii = 0;
    // for (let z = 0; z < ddxyz; z++) {
    //   for (let y = 0; y < ddxyz; y++) {
    //     for (let x = 0; x < ddxyz; x++) {
    //       offset.push(
    //         0.0, //  * (x / ddxyz) * 2.0 - 1.0,
    //         0.0, //  * (y / ddxyz) * 2.0 - 1.0,
    //         0.0, //  * (z / ddxyz) * 2.0 - 1.0,
    //         iii
    //       );
    //       iii++;
    //     }
    //   }
    // }

    let offset = []
    for (let i = 0; i < count; i++) {
      offset.push(0, 0, 0, i)
    }

    // let ddxyz = Math.floor(Math.pow(count, 1 / 2));
    // for (let y = 0; y < ddxyz; y++) {
    //   for (let x = 0; x < ddxyz; x++) {
    //     offset.push(0.0, (x / ddxyz) * 2.0 - 1.0, (y / ddxyz) * 2.0 - 1.0);
    //   }
    // }

    let colors = []
    let palet = Pal[25]
    let color = new Color('#ffffff')
    for (let i = 0; i < count; i++) {
      let hex = palet[Math.floor(palet.length * Math.random())]
      color.set(hex)
      colors.push(color.r, color.g, color.b, Math.random())
    }

    lineGeo.setAttribute('offset', new InstancedBufferAttribute(new Float32Array(offset), 4))
    lineGeo.setAttribute('colorEach', new InstancedBufferAttribute(new Float32Array(colors), 4))

    let eachLineIdx = []
    for (let c = 0; c < count; c++) {
      eachLineIdx.push(c)
    }

    // lineGeo.setAttribute(
    //   "lineIDXER",
    //   new InstancedBufferAttribute(new Float32Array(eachLineIdx), 1)
    // );

    return {
      ...props,
      dataLength: posArray.length,
      geometry: lineGeo,
    }
  }
}
