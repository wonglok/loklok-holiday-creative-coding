import { FrontSide, NormalBlending, ShaderMaterial } from 'three'

export class NoodleMat extends ShaderMaterial {
  constructor({ core, subdivisions, lineCount }) {
    super({
      uniforms: {
        time: { value: 0 },
        posTexture: {
          value: null,
        },
        // handTexture: { value: null },
      },
      defines: {
        lengthSegments: subdivisions.toFixed(1),
        lineCount: lineCount.toFixed(1),
      },
      vertexShader: /* glsl */ `
        // #include <common>

        attribute float angle;
        attribute float newPosition;
        attribute float tubeInfo;

        // varying vec2 vUv;
        varying vec3 vNormal;
        attribute vec4 offset;

        uniform sampler2D posTexture;
        // uniform sampler2D handTexture;

        uniform float time;


        vec3 lerp(vec3 a, vec3 b, float w)
        {
          return a + w*(b-a);
        } 

        // pointLineMaker

        vec3 getLineByT (float t, float lineIndex) {

          vec4 color = texture2D(posTexture,
            vec2(
              t,
              lineIndex / lineCount
            )
          );

          return color.rgb;
        }


        vec3 catmullRom (vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
            vec3 v0 = (p2 - p0) * 0.5;
            vec3 v1 = (p3 - p1) * 0.5;
            float t2 = t * t;
            float t3 = t * t * t;

            return vec3((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);
        }

        vec3 getLineByCtrlPts (float t, float lineIndex) {
          bool closed = false;
          float ll = lengthSegments;
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


        vec3 sampleFnc (float t) {
          vec3 pt = vec3(0.0);

          float lineIndex = offset.w;

          pt = getLineByT(t, lineIndex);

          // pt = getLineByCtrlPts(t, lineIndex);

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

          // t = mod(t, 1.0);

          vT = t;

          float lineIDXER = offset.w;

          vLineCycle = lineIDXER / lineCount;

          vTColor = normalize(getLineByT(0.5, lineIDXER) - getLineByT(0.6, lineIDXER));

          // vec2 volume = vec2(t * (1.0 - t)) * 0.005 * 1.0;
          vec2 volume = vec2(t * (1.0 - t)) * 0.005 * 0.3;

          // volume *= rotate(volume, t * 3.1415 * 2.0);

          // float lt = lerp(vec3(t), vec3(t), 0.1).x;

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
        varying vec3 vTColor;
        varying vec2 vUv;

        varying vec4 vEachColor;
        varying float vLineCycle;

        #include <common>
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

          // vec4 matcapColor = vec4(0.3, 0.2, 0.9, 0.1); // texture2D( map, vUv );

          float tt = (1.0 - vT);

          vec3 color = pal(time * 2.0 + rand(vUv) + tt * 5.0, vec3(0.21,0.55,0.63),vec3(0.2,0.5,0.33),vec3(0.2,0.18,0.75),vec3(0.06,0.16,0.65));
          //o_move.a + o_pos.a + 
          // float t = time * 0.5 + rand(vUv.xy);
          // vec3 myColor = 1.0 * pal(time + o_pos.a + o_move.a + abs(o_move.x * 0.005 * -cos(3.0 * time)), vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,0.0,0.5),vec3(0.8,0.90,0.30));
          // vec3 color = pal(t,vec3(0.21,0.55,0.63),vec3(0.2,0.5,0.33),vec3(0.2,0.18,0.75),vec3(0.06,0.16,0.65));
        
          gl_FragColor = vec4(vEachColor.rgb * 1.0 + color * 8.0, tt * vLineCycle);

          // gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
          // if (vLineCycle >= 0.0 && vLineCycle <= 0.333) {
          //   gl_FragColor.x *= 1.0 * tt;
          //   gl_FragColor.y *= 1.0 * tt;
          //   gl_FragColor.z *= 1.0 * tt;
          // } else if (vLineCycle >= 0.334 && vLineCycle <= 0.667) {
          //   gl_FragColor.x *= 1.0 * tt;
          //   gl_FragColor.y *= 1.0 * tt;
          //   gl_FragColor.z *= 1.0 * tt;
          // } else if (vLineCycle >= 0.668 && vLineCycle <= 1.0) {
          //   gl_FragColor.x *= 1.0 * tt;
          //   gl_FragColor.y *= 1.0 * tt;
          //   gl_FragColor.z *= 1.0 * tt;
          // }

          // gl_FragColor.rgb = vec3(1.0);
          // gl_FragColor.a = 1.0;

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
    // let galaxy = new TextureLoader().load(`/discover/000001__StarSky/image.png`)
    // galaxy.mapping = EquirectangularReflectionMapping
    let mat = this

    core.onLoop((st, dt) => {
      mat.uniforms.time.value += dt
    })
  }
}
