import { GPUComputationRenderer } from 'three-stdlib'
import {
  Vector3,
  BufferAttribute,
  CylinderGeometry,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Vector2,
  RepeatWrapping,
  ShaderMaterial,
  Mesh,

  //

  // DataTexture,
  // DataUtils,
  // RGBFormat,
  // PlaneBufferGeometry,
  // MeshBasicMaterial,
  // TextureLoader,
  // AdditiveBlending,
  // MathUtils,
  Object3D,
  BackSide,
  AdditiveBlending,
  DoubleSide,
  NormalBlending,
  FrontSide,
  EquirectangularReflectionMapping,
  Color,
  FloatType,
} from 'three'
import { Geometry } from './Geo.js'
import { PositionSimulation } from './PositionSimulation'
// import { TextureLoader } from 'three'
import { generateUUID } from 'three/src/math/MathUtils'
import Pal from 'nice-color-palettes'

export class LokLokWiggleSimulation {
  constructor({ node, renderer, howManyTracker = 10, howLongTail = 32, influences }) {
    this.renderer = renderer
    this.influences = influences
    this.node = node
    this.howManyTracker = howManyTracker
    this.howLongTail = howLongTail
    this.WIDTH = howLongTail
    this.HEIGHT = howManyTracker // number of trackers
    this.COUNT = this.WIDTH * this.HEIGHT
    this.wait = this.setup({ node })
    this.v3v000 = new Vector3(0, 0, 0)
  }

  //
  async setup({ node }) {
    let renderer = this.renderer

    let gpu = (this.gpu = new GPUComputationRenderer(this.WIDTH, this.HEIGHT, renderer))

    gpu.setDataType(FloatType)

    this.simPos = new PositionSimulation({
      mini: node,
      renderer: renderer,
      howManyTracker: this.howManyTracker,
      influences: this.influences,
      renderer: renderer,
      cursorPointer: this.cursorPointer,
    })

    const dtPosition = this.gpu.createTexture()
    const lookUpTexture = this.gpu.createTexture()

    this.fillPositionTexture(dtPosition)
    this.fillLookupTexture(lookUpTexture)

    this.positionVariable = this.gpu.addVariable('texturePosition', this.positionShader(), dtPosition)

    this.gpu.setVariableDependencies(this.positionVariable, [this.positionVariable])

    this.positionUniforms = this.positionVariable.material.uniforms
    this.positionUniforms['lookup'] = { value: lookUpTexture }
    this.positionUniforms['headListPosition'] = {
      value: this.simPos.getPosition(),
    }
    this.positionUniforms['headListVelocity'] = {
      value: this.simPos.getVelocity(),
    }

    let h = this.HEIGHT
    // for (let ii = 0; ii < h; ii++) {
    //   this.positionUniforms["mouse" + ii] = { value: new Vector3(0, 0, 0) };
    // }

    this.positionUniforms['time'] = { value: 0 }
    dtPosition.wrapS = RepeatWrapping
    dtPosition.wrapT = RepeatWrapping

    //
    const error = this.gpu.init()
    if (error !== null) {
      console.error(error)
    }
  }

  track() {
    if (this.simPos) {
      this.simPos.compute()
    }
  }

  positionShader() {
    return /* glsl */ `
    uniform sampler2D headListPosition;
    uniform sampler2D headListVelocity;

      uniform sampler2D lookup;
      uniform float time;

      vec3 lerp(vec3 a, vec3 b, float w)
      {
        return a + w*(b-a);
      }

			void main()	{
        // const float width = resolution.x;
        // const float height = resolution.y;
        // float xID = floor(gl_FragCoord.x);
        // float yID = floor(gl_FragCoord.y);

        vec2 uvCursor = vec2(gl_FragCoord.x, gl_FragCoord.y) / resolution.xy;
        vec4 positionHead = texture2D( texturePosition, uvCursor );

        vec4 lookupData = texture2D(lookup, uvCursor);
        vec2 nextUV = lookupData.xy;
        float currentIDX = floor(gl_FragCoord.x);
        float currentLine = floor(gl_FragCoord.y);

        vec4 headListPosValue = texture2D(headListPosition, vec2(0.0, currentLine / ${this.HEIGHT.toFixed(1)}));
        vec4 headListVelValue = texture2D(headListVelocity, vec2(0.0, currentLine / ${this.HEIGHT.toFixed(1)}));

        if (headListPosValue.w == 0.0 || headListVelValue.w == 0.0) {
          gl_FragColor = vec4(vec3(headListPosValue), 1.0);
        } else {
          if (floor(currentIDX) == 0.0) {
            headListPosValue.rgb = lerp(positionHead.rgb, headListPosValue.rgb, 0.05);
            gl_FragColor = vec4(headListPosValue.rgb, 1.0);
          } else {
            vec3 positionChain = texture2D( texturePosition, nextUV ).xyz;
            gl_FragColor = vec4(positionChain, 1.0);
          }
        }
			}
    `
  }

  fillPositionTexture(texture) {
    let i = 0
    const theArray = texture.image.data

    for (let y = 0; y < this.HEIGHT; y++) {
      for (let x = 0; x < this.WIDTH; x++) {
        theArray[i++] = 0.0
        theArray[i++] = 0.0
        theArray[i++] = 0.0
        theArray[i++] = 0.0
      }
    }
    texture.needsUpdate = true
  }

  fillLookupTexture(texture) {
    let i = 0
    const theArray = texture.image.data
    let items = []

    for (let y = 0; y < this.HEIGHT; y++) {
      for (let x = 0; x < this.WIDTH; x++) {
        let lastOneInArray = items[items.length - 1] || [0, 0]
        theArray[i++] = lastOneInArray[0]
        theArray[i++] = lastOneInArray[1]
        theArray[i++] = this.WIDTH
        theArray[i++] = this.HEIGHT
        items.push([x / this.WIDTH, y / this.HEIGHT])
      }
    }
    texture.needsUpdate = true
  }

  render() {
    if (this.positionUniforms && this.gpu) {
      this.positionUniforms['time'].value = window.performance.now() / 1000
      this.gpu.compute()
    }
  }

  getTextureAfterCompute() {
    return {
      posTexture: this.gpu.getCurrentRenderTarget(this.positionVariable).texture,
    }
  }
}

export class LokLokWiggleDisplay {
  constructor({ node, sim }) {
    this.o3d = new Object3D()
    this.node = node
    this.sim = sim
    this.wait = this.setup({ node })
  }
  async setup({ node }) {
    let { geometry, subdivisions, count } = new NoodleGeo({
      count: this.sim.HEIGHT,
      numSides: 4,
      subdivisions: this.sim.WIDTH,
      openEnded: false,
    })
    geometry.instanceCount = count

    // let galaxy = new TextureLoader().load(`/discover/000001__StarSky/image.png`)
    // galaxy.mapping = EquirectangularReflectionMapping
    let matLine0 = new ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        map: {
          value: null,
        },
        posTexture: {
          value: null,
        },
        // handTexture: { value: null },
      },
      vertexShader: /* glsl */ `
        // #include <common>
        #define lengthSegments ${subdivisions.toFixed(1)}

        attribute float angle;
        attribute float newPosition;
        attribute float tubeInfo;

        // varying vec2 vUv;
        varying vec3 vNormal;
        attribute vec4 offset;

        uniform sampler2D posTexture;
        // uniform sampler2D handTexture;

        uniform float time;


        // pointLineMaker

        vec3 getLineByT (float t, float lineIndex) {

          vec4 color = texture2D(posTexture,
            vec2(
              t,
              lineIndex / ${this.sim.HEIGHT.toFixed(1)}
            )
          );

          return color.rgb;
        }


        // vec3 catmullRom (vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
        //     vec3 v0 = (p2 - p0) * 0.5;
        //     vec3 v1 = (p3 - p1) * 0.5;
        //     float t2 = t * t;
        //     float t3 = t * t * t;

        //     return vec3((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);
        // }

        // vec3 getLineByCtrlPts (float t, float lineIndex) {
        //   bool closed = false;
        //   float ll = ${subdivisions.toFixed(1)};
        //   float minusOne = 1.0;
        //   if (closed) {
        //     minusOne = 0.0;
        //   }

        //   float p = (ll - minusOne) * t;
        //   float intPoint = floor(p);
        //   float weight = p - intPoint;

        //   float idx0 = intPoint + -1.0;
        //   float idx1 = intPoint +  0.0;
        //   float idx2 = intPoint +  1.0;
        //   float idx3 = intPoint +  2.0;

        //   vec3 pt0 = getLineByT(idx0, lineIndex);
        //   vec3 pt1 = getLineByT(idx1, lineIndex);
        //   vec3 pt2 = getLineByT(idx2, lineIndex);
        //   vec3 pt3 = getLineByT(idx3, lineIndex);

        //   vec3 pointoutput = catmullRom(pt0, pt1, pt2, pt3, weight);

        //   return pointoutput;
        // }

        vec3 sampleFnc (float t) {
          vec3 pt = (offset.xyz + 0.5) * 0.0;

          float lineIndex = offset.w;

          pt += getLineByT(t, lineIndex);

          return pt;
        }

        void createTube (float t, vec2 volume, out vec3 pos, out vec3 normal) {
          // find next sample along curve
          float nextT = t + (1.0 / lengthSegments);

          // sample the curve in two places
          vec3 cur = sampleFnc(t);
          vec3 next = sampleFnc(nextT);

          // compute the Frenet-Serret frame
          vec3 T = normalize(next - cur);
          vec3 B = normalize(cross(T, next + cur));
          vec3 N = -normalize(cross(B, T));

          // extrude outward to create a tube
          float tubeAngle = angle;
          float circX = cos(tubeAngle);
          float circY = sin(tubeAngle);

          // compute position and normal
          normal.xyz = normalize(B * circX + N * circY);
          pos.xyz = cur + B * volume.x * circX + N * volume.y * circY;
        }

        varying float vT;
        varying vec2 vUv;
        varying vec3 vViewPosition;

        attribute vec4 colorEach;
        varying vec4 vEachColor;

        varying vec3 vTColor;
        varying float vLineCycle;
        vec2 rotate(vec2 v, float a) {
          float s = sin(a);
          float c = cos(a);
          mat2 m = mat2(c, -s, s, c);
          return m * v;
        }

        void main (void) {
          vec3 transformed;
          vec3 objectNormal;

          vEachColor = colorEach;

          float t = tubeInfo + 0.5;

          vT = t;

          float lineIDXER = offset.w;
          float lineCount = ${this.sim.HEIGHT.toFixed(2)};

          vLineCycle = lineIDXER / lineCount;

          vTColor = normalize(getLineByT(0.5, lineIDXER) - getLineByT(0.6, lineIDXER));


          float snip =  pow(t * (1.0 - t), 0.35);
          vec2 volume = vec2(2.5 * snip) * 0.35;

          // volume *= rotate(volume, t * 3.1415 * 2.0);

          createTube(t, volume, transformed, objectNormal);

          vec3 transformedNormal = normalMatrix * objectNormal;
          vNormal = normalize(transformedNormal);

          vUv = uv.yx;

          vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          vViewPosition = -mvPosition.xyz;
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vT;
        // varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        uniform sampler2D map;
        varying vec3 vTColor;
        varying vec2 vUv;

        varying vec4 vEachColor;
        varying float vLineCycle;

        uniform float time;

        vec3 catmullRom (vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
            vec3 v0 = (p2 - p0) * 0.5;
            vec3 v1 = (p3 - p1) * 0.5;
            float t2 = t * t;
            float t3 = t * t * t;

            return vec3((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);
        }


        // A simple way to create color variation in a cheap way (yes, trigonometrics ARE cheap
        // in the GPU, don't try to be smart and use a triangle wave instead).

        // See https://iquilezles.org/articles/palettes for more information

        vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
        {
            return a + b*cos( 6.28318*(c*t+d) );
        }

        void main (void) {

          // vec3 viewDir = normalize( vViewPosition );
          // vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
          // vec3 y = cross( viewDir, x );
          // vec2 uv = vec2( dot( x, vNormal ), dot( y, vNormal ) ) * 0.495 + 0.5; // 0.495 to remove artifacts caused by undersized matcap disks

          vec4 matcapColor = vec4(0.3, 0.2, 0.9, 0.1); // texture2D( map, vUv );

          float tt = (1.0 - vT);

          vec3 color = pal(sin(time + tt) + tt, vec3(0.0,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,0.5),vec3(0.8,0.90,0.30));

          gl_FragColor = vec4(color * 3.0, tt * vLineCycle);

          if (vLineCycle >= 0.0 && vLineCycle <= 0.333) {
            gl_FragColor.x *= 1.0 * tt;
            gl_FragColor.y *= 1.0 * tt;
            gl_FragColor.z *= 1.0 * tt;
          } else if (vLineCycle >= 0.334 && vLineCycle <= 0.667) {
            gl_FragColor.x *= 1.0 * tt;
            gl_FragColor.y *= 1.0 * tt;
            gl_FragColor.z *= 1.0 * tt;
          } else if (vLineCycle >= 0.668 && vLineCycle <= 1.0) {
            gl_FragColor.x *= 1.0 * tt;
            gl_FragColor.y *= 1.0 * tt;
            gl_FragColor.z *= 1.0 * tt;
          }

          if (vLineCycle * tt < 0.001) {
            discard;
          }
        }
      `,
      transparent: true,
      side: FrontSide,
      depthTest: true,
      depthWrite: true,
      blending: NormalBlending,
    })

    let line0 = new Mesh(geometry, matLine0)

    this.o3d.add(line0)
    node.onClean(() => {
      this.o3d.remove(line0)
    })

    // enableBloom(line0);

    // scene.add(line0);

    await this.sim.wait
    node.onLoop(() => {
      let result = this.sim.getTextureAfterCompute()
      matLine0.uniforms.posTexture.value = result.posTexture
      matLine0.uniforms.time.value = window.performance.now() / 1000
    })
  }
}

class NoodleGeo {
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
    let palet = Pal[5]
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

export class FunSim {
  constructor({ node, cursorPointer, howManyTrackers = 8, influences, tailLength = 64 }) {
    this.influences = influences
    this.cursorPointer = cursorPointer
    this.o3d = new Object3D()
    this.node = node
    this.howManyTrackers = howManyTrackers
    this.tailLength = tailLength

    node.ready.gl.then((renderer) => {
      this.renderer = renderer
      this.setup({ node, renderer })
    })
  }
  track() {
    //noop placeholder
  }

  async setup({ node, renderer }) {
    //
    let sim = new LokLokWiggleSimulation({
      node,
      renderer: renderer,
      howManyTracker: this.howManyTrackers,
      influences: this.influences,
      howLongTail: this.tailLength,
      cursorPointer: this.cursorPointer,
    })

    let display = new LokLokWiggleDisplay({ node, sim })

    this.o3d.add(display.o3d)

    node.onClean(() => {
      this.o3d.remove(display.o3d)
    })

    this.track = () => {
      sim.track()
      sim.render({
        //
      })
    }
  }
}

FunSim.key = generateUUID()
// let makeOrbitor = (node, radius = 1, mounter) => {
//   let orbit = new Object3D();
//   mounter.add(orbit);
//   node.onClean(() => {
//     mounter.remove(orbit);
//   });

//   node.onLoop((dt) => {
//     orbit.rotation.y += 0.05;
//   });

//   let orbiting1 = new Object3D();
//   orbiting1.position.y = 0.15;
//   orbiting1.position.x = radius;
//   orbit.add(orbiting1);

//   let left = new Vector3();
//   let right = new Vector3();
//   let dist = 2.5700293285455326;
//   let v3 = new Vector3();
//   Promise.all([
//     //
//     node.ready.AvaLeftHand,
//     node.ready.AvaRightHand,
//   ]).then(
//     ([
//       //
//       AvaLeftHand,
//       AvaRightHand,
//     ]) => {
//       node.onLoop(() => {
//         AvaLeftHand.getWorldPosition(left);
//         AvaRightHand.getWorldPosition(right);

//         let dist2 = left.distanceTo(right);

//         let s = dist2 / dist;
//         v3.set(s * s * 10 + 0.5, 1, 1);
//         orbit.scale.lerp(v3, 1);
//       });
//     }
//   );

//   return orbiting1;
// };
