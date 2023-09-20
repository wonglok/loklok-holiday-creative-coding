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


          if (floor(currentIDX) == 0.0) {
            datPos.rgb = lerp(positionHead.rgb, datPos.rgb, 0.15);
            gl_FragColor = vec4(datPos.rgb, 1.0);
          } else {
            vec3 positionChain = texture2D(texturePosition, nextUV ).xyz;

     
            gl_FragColor = vec4(positionChain, 1.0);
          }
          
        }
      `,
      txPos,
    )
    vaPos.material.uniforms.resolution = { value: new Vector2(lineSegments, lineCount) }
    vaPos.material.uniforms.time = { value: 0 }
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
