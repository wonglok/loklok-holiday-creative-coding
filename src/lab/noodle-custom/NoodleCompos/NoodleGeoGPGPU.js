import { Clock, FloatType, Vector2 } from 'three'
import { GPUComputationRenderer } from 'three-stdlib'

export class NoodleGeoGPGPU {
  constructor({ material, lineSegments, lineCount, core }) {
    //
    this.core = core
    this.onLoop = core.onLoop
    this.lineCount = lineCount
    this.lineSegments = lineSegments

    let gpu = new GPUComputationRenderer(lineSegments, lineCount, core.gl)
    this.gpu = gpu

    gpu.setDataType(FloatType)
    let txPos = gpu.createTexture()
    this.fillTxPos(txPos)

    {
      let tx = gpu.createTexture()
      this.fillNextLookUp(tx)
      this.nextSegmentTexture = tx
    }

    {
      let tx = gpu.createTexture()
      this.fillBackLookUp(tx)
      this.backSegmentTexture = tx
    }

    let vaPos = gpu.addVariable(
      'texturePosition',
      /* glsl */ `

      uniform sampler2D txPosition;
      // uniform sampler2D txMove;
      uniform sampler2D txHairRootPosition;
      uniform sampler2D txHairRootNormal;
      uniform vec3 mousePosition;

      uniform sampler2D nextSegment;
      uniform sampler2D backSegment;
      uniform float time;

      vec3 lerp(vec3 a, vec3 b, float w) {
        return a + w*(b-a);
      } 

      #define lineCount ${this.lineCount.toFixed(1)}

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
      


      vec3 catmullRom (vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
          vec3 v0 = (p2 - p0) * 0.5;
          vec3 v1 = (p3 - p1) * 0.5;
          float t2 = t * t;
          float t3 = t * t * t;

          return vec3((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);
      }

      vec3 getLineByT (float t, float lineIndex) {
        vec4 color = texture2D(txPosition,
          vec2(
            t,
            lineIndex / lineCount
          )
        );
        return color.rgb;
      }

      float sdfSphere(vec3 position, float radius) {
        return length(position) - radius;
      }

      vec3 scene(vec3 pos) {
        float val = sdfSphere(pos, 1.0);
        return vec3(val);
      }

      vec3 calcNormalCore(vec3 pos, float eps) {
        const vec3 v1 = vec3( 1.0,-1.0,-1.0);
        const vec3 v2 = vec3(-1.0,-1.0, 1.0);
        const vec3 v3 = vec3(-1.0, 1.0,-1.0);
        const vec3 v4 = vec3( 1.0, 1.0, 1.0);

        return normalize( v1 * scene( pos + v1*eps ).x +
                          v2 * scene( pos + v2*eps ).x +
                          v3 * scene( pos + v3*eps ).x +
                          v4 * scene( pos + v4*eps ).x );
      }

      vec3 calcNormal(vec3 pos) {
        return calcNormalCore(pos, 0.002);
      }

      vec3 getLineByCtrlPts (float t, float lineIndex) {
        bool closed = false;
        float ll = ${this.lineSegments.toFixed(1)};
        float minusOne = 1.0;
        if (closed) {
          minusOne = 0.0;
        }

        float p = (ll - minusOne) * t;
        float intPoint = floor(p);
        float weight = p - intPoint;

        float idx0 = intPoint + -1.0;
        float idx1 = intPoint +  0.0;
        float idx2 = intPoint +  1.0;
        float idx3 = intPoint +  2.0;

        vec3 pt0 = getLineByT(idx0, lineIndex);
        vec3 pt1 = getLineByT(idx1, lineIndex);
        vec3 pt2 = getLineByT(idx2, lineIndex);
        vec3 pt3 = getLineByT(idx3, lineIndex);

        vec3 pointoutput = catmullRom(pt0, pt1, pt2, pt3, weight);

        return pointoutput;
      }


      //	Classic Perlin 3D Noise
      //	by Stefan Gustavson
      //
      vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
      vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
      vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

      float cnoise(vec3 P){
        vec3 Pi0 = floor(P); // Integer part for indexing
        vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
        Pi0 = mod(Pi0, 289.0);
        Pi1 = mod(Pi1, 289.0);
        vec3 Pf0 = fract(P); // Fractional part for interpolation
        vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
        vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
        vec4 iy = vec4(Pi0.yy, Pi1.yy);
        vec4 iz0 = Pi0.zzzz;
        vec4 iz1 = Pi1.zzzz;

        vec4 ixy = permute(permute(ix) + iy);
        vec4 ixy0 = permute(ixy + iz0);
        vec4 ixy1 = permute(ixy + iz1);

        vec4 gx0 = ixy0 / 7.0;
        vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
        gx0 = fract(gx0);
        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);

        vec4 gx1 = ixy1 / 7.0;
        vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
        gx1 = fract(gx1);
        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
        vec4 sz1 = step(gz1, vec4(0.0));
        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
        gy1 -= sz1 * (step(0.0, gy1) - 0.5);

        vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
        vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
        vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
        vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
        vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
        vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
        vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
        vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

        vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
        g000 *= norm0.x;
        g010 *= norm0.y;
        g100 *= norm0.z;
        g110 *= norm0.w;
        vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
        g001 *= norm1.x;
        g011 *= norm1.y;
        g101 *= norm1.z;
        g111 *= norm1.w;

        float n000 = dot(g000, Pf0);
        float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
        float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
        float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
        float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
        float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
        float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
        float n111 = dot(g111, Pf1);

        vec3 fade_xyz = fade(Pf0);
        vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
        vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
        float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
        return 2.2 * n_xyz;
      }


        void main()	{
          // const float width = resolution.x;
          // const float height = resolution.y;
          // float xID = floor(gl_FragCoord.x);
          // float yID = floor(gl_FragCoord.y);

          vec2 uv = vec2(gl_FragCoord.x, gl_FragCoord.y) / resolution.xy;
          vec4 metaData = texture2D( texturePosition, uv );

          vec4 nextSegmentData = texture2D(nextSegment, uv);
          vec2 nextUV = nextSegmentData.xy;

          vec4 backSegmentData = texture2D(backSegment, uv);
          vec2 backUV = backSegmentData.xy;

          float currentIDX = floor(gl_FragCoord.x);
          float currentLine = floor(gl_FragCoord.y);
          float lineT = gl_FragCoord.x / resolution.x;
          float lineE = (1.0 - lineT);

          if (metaData.w == -1.0) {
            gl_FragColor.rgb = vec3(0.0);
            gl_FragColor.a = 1.0;
          } else if (currentIDX == 0.0) {
            vec4 hairRootPosition = texture2D(txHairRootPosition, 
              vec2(
                currentLine / lineCount,
                0.5
              )
            );

            gl_FragColor.rgb = hairRootPosition.rgb;
            // gl_FragColor.rgb = vec3(1.0 * (rand(uv + 0.1) * 2.0 - 1.0), 2.0, 1.0 * (rand(uv + 0.2) * 2.0 - 1.0));
            gl_FragColor.a = 1.0;
          } else {
            vec4 backData =  texture2D( texturePosition, backSegmentData.rg );
            vec4 thisData =  texture2D( texturePosition, uv );
            vec4 nextData =  texture2D( texturePosition, nextSegmentData.rg );

            float dist = length(thisData.rgb - backData.rgb);
            float maxDist = 0.3;
            if (dist >= maxDist) {
              dist = maxDist;
            }

            float sticky = 1.0 / dist;

            vec3 fromPos = thisData.rgb;
            vec3 tPos = backData.rgb;



            // hair root normal
            vec4 hairRootPosition = texture2D(txHairRootPosition, 
              vec2(
                currentLine / lineCount,
                0.5
              )
            );

            vec4 hairRootNormalData = texture2D(txHairRootNormal, 
              vec2(
                currentLine / lineCount,
                0.5
              )
            );

            // spread the hair
            float behind = 0.5;
            vec3 sculp = normalize(vec3(hairRootNormalData.x, hairRootNormalData.y, hairRootNormalData.z - behind));

            sculp *= 0.125;
            sculp.xz *= 0.36;
            
            tPos.xyz += sculp * pow(lineE, 6.0);

            tPos.y += -0.1 * pow(lineE, 1.0);

            // wind
            tPos.z += -0.015 * lineE;
            
            // tPos.x += -0.1 * sin(time) * pow(lineE, 6.0);

            // tPos.xyz += normalize(backData.rgb - thisData.rgb) * 0.001;

            // previous hair
            // tPos += (vec3(thisData.xyz - tPos.xyz)) * 0.1;
            
            // mouse
            float radiusAffected = 2.0;
            vec3 mPos = mousePosition;
            float distMouseToHair = length(mPos - tPos.xyz);
            float maxDistMouseToHair = radiusAffected;
            if (distMouseToHair >= radiusAffected) {
              distMouseToHair = radiusAffected;
            }
            float mouseForceSize = (((radiusAffected - distMouseToHair) / maxDistMouseToHair));
            tPos += 0.5 * normalize(mPos - tPos.xyz) * -mouseForceSize;

            // smooth
            fromPos = lerp(fromPos, tPos, 0.5);

            gl_FragColor.rgb = fromPos;
          
            gl_FragColor.a = 1.0;
          }


          // vec4 datPos = texture2D(txPosition, vec2(1.0, currentLine / ${this.lineCount.toFixed(1)}));
          // vec4 datMove = texture2D(txMove, vec2(1.0, currentLine / ${this.lineCount.toFixed(1)}));

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

          // vec3 velocity = vec3(datMove.rgb - datPos.rgb);

          // if (floor(currentIDX) == 0.0) {
          //   // datPos.y *= 0.15;
          //   // datPos.y += 1.3;
          //   // datPos.x *= 1.2;
          //   datPos.rgb = lerp(positionHead.rgb, datPos.rgb, 0.075);

          //   datPos.z += -0.03;
          //   gl_FragColor = vec4(datPos.rgb, 1.0);
          // } else {
          //   vec3 positionChain = texture2D(texturePosition, nextUV ).xyz;

          //   positionChain.z += -0.02;
            
          //   positionChain.xz *= 1.08;

          //   positionChain.y += 0.03;

          //   gl_FragColor = vec4(positionChain, 1.0);

          //   // gl_FragColor.z += -0.08;

          //   // gl_FragColor.x *= 1.07;

          //   // gl_FragColor.y *= 1.01;
          //   // gl_FragColor.x += 0.1 * sin(yoo)* sin(yoo);
          //   // gl_FragColor.y += 0.1 * sin(yoo) * cos(yoo);
          //   // gl_FragColor.z += 0.1;
          // }

          // float yoo = gl_FragCoord.y / resolution.y * 3.141592 * 2.0 + gl_FragCoord.x / resolution.x * 3.141592 * 2.0;

          // float middle = t * (1.0 - t);
          // float x = 1.0 * (sin(yoo) * sin(yoo) - 0.5);
          // float z = 1.0 * (sin(yoo) * cos(yoo));

          // vec3 ball = ballify(vec3(x, sin(time * 1.5) * 5.5, z) + normalize(datPos.rgb) * 5.5 / 2.0, 2.3);
          // ball.y += 1.0;

          // gl_FragColor.rgb = mix(ball, datPos.rgb, 0.5);


          // gl_FragColor.rgb = ballify(vec3(
          //   sin(time + uv.x) + t + rand(uv + 0.1) * 2.0 - 1.0,
          //   sin(time + uv.y) + t + rand(uv + 0.2) * 2.0 - 1.0,
          //   sin(time + uv.x) + t + rand(uv + 0.3) * 2.0 - 1.0
          // ), 5.0);

          // vec3 datPos = vec3(t * 15.0, 15.0 * sin(t + time), 0.0);
          // if (floor(currentIDX) == 0.0) {
          //   datPos.rgb = lerp(positionHead.rgb, datPos.rgb, 0.15);
          //   gl_FragColor = vec4(datPos.rgb, 1.0);
          // } else {
          //   vec3 positionChain = texture2D(texturePosition, nextUV ).xyz;

          //   positionChain.x *= 1.0;
          //   positionChain.z *= 1.0;
          //   positionChain.y *= 1.0;
          //   gl_FragColor = vec4(positionChain, 1.0);
          // }

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
    vaPos.material.uniforms.txMove = { value: null }
    vaPos.material.uniforms.txPosition = { value: null }
    vaPos.material.uniforms.txMove = { value: null }
    vaPos.material.uniforms.txHairRootPosition = { value: core.txHairRootPosition }
    vaPos.material.uniforms.txHairRootNormal = { value: core.txHairRootNormal }
    vaPos.material.uniforms.mousePosition = { value: core.mouseObject.position }
    vaPos.material.uniforms.nextSegment = { value: this.nextSegmentTexture }
    vaPos.material.uniforms.backSegment = { value: this.backSegmentTexture }
    vaPos.material.needsUpdate = true
    gpu.setVariableDependencies(vaPos, [vaPos])

    gpu.init()

    let clock = new Clock()
    this.core.onLoop(() => {
      gpu.compute()
      let dt = 1 / 60

      dt = clock.getDelta()

      vaPos.material.uniforms.dt = { value: dt }
      vaPos.material.uniforms.mousePosition = { value: core.mouseObject.position }
      vaPos.material.uniforms.txPosition = { value: null }
      vaPos.material.uniforms.txMove = { value: null }
      vaPos.material.uniforms.nextSegment = { value: this.nextSegmentTexture }
      vaPos.material.uniforms.backSegment = { value: this.backSegmentTexture }
      material.uniforms.posTexture.value = gpu.getCurrentRenderTarget(vaPos).texture
    })
  }

  fillNextLookUp(texture) {
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

  fillBackLookUp(texture) {
    let i = 0
    const theArray = texture.image.data

    for (let y = 0; y < this.lineCount; y++) {
      for (let x = 0; x < this.lineSegments; x++) {
        let xn1 = x - 1
        theArray[i++] = (xn1 > 0.0 ? xn1 : 0.0) / this.lineSegments
        theArray[i++] = y / this.lineCount
        theArray[i++] = this.lineSegments
        theArray[i++] = this.lineCount
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
        // if (x === 0.0) {
        //   theArray[i + 0] = 0
        //   theArray[i + 1] = 0
        //   theArray[i + 2] = 0
        //   theArray[i + 3] = 1
        // } else {
        //   theArray[i + 0] = theArray[i - x * 4 + 0]
        //   theArray[i + 1] = theArray[i - x * 4 + 1]
        //   theArray[i + 2] = theArray[i - x * 4 + 2]
        //   theArray[i + 3] = theArray[i - x * 4 + 3]
        // }

        theArray[i + 0] = 0.0
        theArray[i + 1] = 0.0
        theArray[i + 2] = 0.0
        theArray[i + 3] = -1
        i += 4
        items.push([x / this.lineSegments, y / this.lineCount])
      }
    }
    texture.needsUpdate = true
  }
}
