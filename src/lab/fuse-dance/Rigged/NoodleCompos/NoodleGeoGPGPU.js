import { FloatType, Vector2 } from 'three'
import { GPUComputationRenderer } from 'three-stdlib'

export class NoodleGeoGPGPU {
  constructor({ material, lineSegments, lineCount, parent, onLoop }) {
    //
    this.parent = parent
    this.onLoop = onLoop
    this.lineCount = lineCount
    this.lineSegments = lineSegments
    let gpu = new GPUComputationRenderer(lineSegments, lineCount, parent.gl)
    this.gpu = gpu

    gpu.setDataType(FloatType)
    let txPos = gpu.createTexture()
    this.fillTxPos(txPos)

    let txLookUp = gpu.createTexture()
    this.fillLookupTexture(txLookUp)
    this.lookupTexture = txLookUp

    let vaPos = gpu.addVariable(
      'texturePosition',
      /* glsl */ `
      
      uniform sampler2D txPosition;
      uniform sampler2D txMove;

        uniform sampler2D lookup;
        uniform float time;

        vec3 lerp(vec3 a, vec3 b, float w)
        {
          return a + w*(b-a);
        } 

        #include <common>

         
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

          vec4 datPos = texture2D(txPosition, vec2(1.0, currentLine / ${this.lineCount.toFixed(1)}));
          vec4 datMove = texture2D(txMove, vec2(1.0, currentLine / ${this.lineCount.toFixed(1)}));

          // if (datPos.w == 0.0 || datMove.w == 0.0) {
          //   gl_FragColor = vec4(datPos.rgb, 1.0);
          // } else {
          //   if (floor(currentIDX) == 0.0) {
          //     datPos.rgb = lerp(positionHead.rgb, datPos.rgb, 0.15);
          //     gl_FragColor = vec4(datPos.rgb, 1.0);
          //   } else {
          //     vec3 positionChain = texture2D(texturePosition, nextUV ).xyz;

          //     positionChain.x *= 1.01;
          //     positionChain.z *= 1.01;
          //     positionChain.y *= 1.01;
          //     gl_FragColor = vec4(positionChain, 1.0);
          //   }
          // }

          vec3 velocity = vec3(datMove.rgb - datPos.rgb);

          if (floor(currentIDX) == 0.0) {
            // datPos.y *= 0.15;
            // datPos.y += 1.3;
            // datPos.x *= 1.2;
            datPos.rgb = lerp(positionHead.rgb, datPos.rgb, 0.15);
            gl_FragColor = vec4(datPos.rgb, 1.0);
          } else {
            vec3 positionChain = texture2D(texturePosition, nextUV ).xyz;

            // if (mod(floor(currentLine), 2.0) == 0.0 ) {
            //   positionChain.xz *= 1.08;
            //   positionChain.y *= 0.97;
            // } else {
            // }

            gl_FragColor = vec4(positionChain, 1.0);

            gl_FragColor.z += -0.08;

            gl_FragColor.x *= 1.07;

            gl_FragColor.y *= 1.01;

            // gl_FragColor.x += sin(gl_FragCoord.y * 0.2 + time * 3.0) * 0.05;
            // gl_FragColor.y += cos(gl_FragCoord.y * 0.2 + gl_FragCoord.x * 0.2 + time * 3.0) * 0.05;
            // gl_FragColor.z += -0.1;
          }

          // vec4 grid = vec4(ballify(datMove.rgb, 2.0), 1.0);
          // vec4 avatar = vec4(datPos.rgb, 1.0);

          // gl_FragColor.rgb = mix(grid.rgb, avatar.rgb, 1.0- gl_FragCoord.x / resolution.x);

          // 
        }
      `,
      txPos,
    )
    vaPos.material.uniforms.resolution = { value: new Vector2(lineSegments, lineCount) }
    vaPos.material.uniforms.time = {
      get value() {
        return performance.now() / 1000
      },
    }
    vaPos.material.uniforms.dt = { value: 1 / 60 }
    vaPos.material.uniforms.txMove = { value: parent }
    vaPos.material.uniforms.txPosition = { value: this.parent.getPositionTexture() }
    vaPos.material.uniforms.txMove = { value: this.parent.getMoveTexture() }
    vaPos.material.uniforms.lookup = { value: this.lookupTexture }
    vaPos.material.needsUpdate = true
    gpu.setVariableDependencies(vaPos, [vaPos])

    gpu.init()

    this.parent.onLoop(() => {
      gpu.compute()

      vaPos.material.uniforms.txPosition = { value: this.parent.getPositionTexture() }
      vaPos.material.uniforms.txMove = { value: this.parent.getMoveTexture() }
      vaPos.material.uniforms.lookup = { value: this.lookupTexture }
      material.uniforms.posTexture.value = gpu.getCurrentRenderTarget(vaPos).texture
    })
  }
  fillLookupTexture(texture) {
    let i = 0
    const theArray = texture.image.data
    let items = []

    for (let y = 0; y < this.lineCount; y++) {
      for (let x = 0; x < this.lineSegments; x++) {
        let lastOneInArray = items[items.length - 1] || [0, 0]
        theArray[i++] = lastOneInArray[0]
        theArray[i++] = lastOneInArray[1]
        theArray[i++] = this.lineSegments
        theArray[i++] = this.lineCount
        items.push([x / this.lineSegments, y / this.lineCount])
      }
    }
    texture.needsUpdate = true
  }
  fillTxPos(texture) {
    let i = 0
    const theArray = texture.image.data
    let items = []

    for (let y = 0; y < this.lineCount; y++) {
      for (let x = 0; x < this.lineSegments; x++) {
        if (x === 0.0) {
          theArray[i + 0] = 0.25 * (Math.random() * 2.0 - 1.0)
          theArray[i + 1] = 0.05
          theArray[i + 2] = 0.25 * (Math.random() * 2.0 - 1.0)
          theArray[i + 3] = 1
        } else {
          theArray[i + 0] = theArray[i - x * 4 + 0]
          theArray[i + 1] = theArray[i - x * 4 + 1]
          theArray[i + 2] = theArray[i - x * 4 + 2]
          theArray[i + 3] = theArray[i - x * 4 + 3]
        }
        i += 4
        items.push([x / this.lineSegments, y / this.lineCount])
      }
    }
    texture.needsUpdate = true
  }
}
