import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'

import {
  WebGLCubeRenderTarget,
  Scene,
  Mesh,
  ShaderMaterial,
  CubeRefractionMapping,
  BackSide,
  NoBlending,
  CubeCamera,
  CubeReflectionMapping,
  RGBAFormat,
  NearestFilter,
  NearestMipmapLinearFilter,
  SRGBColorSpace,
} from 'three'
import { SphereGeometry } from 'three'

// import { cloneUniforms } from "three/src/renderers/shaders/UniformsUtils.js";
// import * as dat from '';

let DefaultCode = `

const mat2 m = mat2( 0.80,  0.60, -0.60,  0.80 );

float noise( in vec2 p ) {
  return sin(p.x)*sin(p.y);
}

float fbm4( vec2 p ) {
    float f = 0.0;
    f += 0.5000 * noise( p ); p = m * p * 2.02;
    f += 0.2500 * noise( p ); p = m * p * 2.03;
    f += 0.1250 * noise( p ); p = m * p * 2.01;
    f += 0.0625 * noise( p );
    return f / 0.9375;
}

float fbm6( vec2 p ) {
    float f = 0.0;
    f += 0.500000*(0.5 + 0.5 * noise( p )); p = m*p*2.02;
    f += 0.250000*(0.5 + 0.5 * noise( p )); p = m*p*2.03;
    f += 0.125000*(0.5 + 0.5 * noise( p )); p = m*p*2.01;
    f += 0.062500*(0.5 + 0.5 * noise( p )); p = m*p*2.04;
    f += 0.031250*(0.5 + 0.5 * noise( p )); p = m*p*2.01;
    f += 0.015625*(0.5 + 0.5 * noise( p ));
    return f/0.96875;
}

float pattern (vec2 p, float time) {
  float vout = fbm4( p + time + fbm6(  p + fbm4( p + time )) );
  return abs(vout);
}

uniform sampler2D hdrTexture;
uniform float envLightIntensity;
varying vec3 vWorldDirection;
varying vec3 vPos;
#define RECIPROCAL_PI 0.31830988618
#define RECIPROCAL_PI2 0.15915494

uniform float time;
uniform float rotY;

mat3 rotateY(float rad) {
    float c = cos(rad);
    float s = sin(rad);
    return mat3(
        c, 0.0, -s,
        0.0, 1.0, 0.0,
        s, 0.0, c
    );
}

vec4 mainImage ()  {
  vec3 direction = normalize( vWorldDirection * rotateY(rotY));
  vec2 uv;
  uv.y = asin( clamp( direction.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
  uv.x = atan( direction.z, direction.x ) * RECIPROCAL_PI2 + 0.5;

  vec4 hdrTextureC4 = texture2D(hdrTexture, uv);

  vec4 outColor;
  outColor.a = 1.0;

  // outColor.rgb = vec3(
  //   pattern(vPos.zy * 2.0 + 0.1, time * 0.1),
  //   pattern(vPos.zy * 2.0 + 0.0, time * 0.1),
  //   pattern(vPos.zy * 2.0 + -0.1, time * 0.1)
  // );


  outColor += hdrTextureC4;

  outColor *= envLightIntensity;

  return outColor;
}

`

export function useComputeEnvMap(code = DefaultCode, uniforms = {}, res = 128, doCompute = true, newAngle = 0) {
  let { gl } = useThree()

  let { envMap, compute, cubeRtt } = useMemo(() => {
    console.log('compile shader')
    let scene = new Scene()

    let shader = {
      uniforms: {
        rotY: { value: 0.5 },
        time: { value: 0.0 },
        ...uniforms,
      },

      vertexShader: `
        varying vec3 vPos;
        varying vec3 vWorldDirection;
        varying vec3 vViewPosition;
        vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
          return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
        }
        void main() {
          vPos = position;
          vWorldDirection = transformDirection( position, modelMatrix );
          #include <begin_vertex>
          #include <project_vertex>

          vViewPosition = - mvPosition.xyz;
        }
      `,

      fragmentShader: `

        varying vec3 vViewPosition;
        ${code || DefaultCode}


        void main() {
          gl_FragColor = mainImage();
        }
      `,
    }

    let material = new ShaderMaterial({
      type: 'CubemapFromEquirect',
      uniforms: shader.uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      side: BackSide,
      blending: NoBlending,
    })

    let mesh = new Mesh(new SphereGeometry(5, 32, 32), material)
    scene.add(mesh)

    shader.uniforms.time.value = 0.4

    let cubeRtt = new WebGLCubeRenderTarget(res, {
      format: RGBAFormat,
      generateMipmaps: true,
      magFilter: NearestFilter,
      minFilter: NearestMipmapLinearFilter,
    })

    let camera = new CubeCamera(1, 100000, cubeRtt)

    camera.update(gl, scene)

    let compute = () => {
      shader.uniforms.time.value += 1 / 60
      camera.update(gl, scene)
    }

    cubeRtt.texture.mapping = CubeRefractionMapping
    cubeRtt.texture.mapping = CubeReflectionMapping
    cubeRtt.texture.colorSpace = SRGBColorSpace

    return {
      cubeRtt,
      envMap: cubeRtt.texture,
      compute,
    }
  }, [code, gl, res, uniforms])

  useEffect(() => {
    return () => {
      cubeRtt.dispose()
    }
  }, [cubeRtt])

  let yo = 0
  useFrame(() => {
    if (doCompute || newAngle !== yo) {
      yo = newAngle
      compute()
    }
  })

  return { envMap }
}

// EXAMPLE
// let { envMap: computedRainbowEnv } = useComputeEnvMap(
//   `

//   const mat2 m = mat2( 0.80,  0.60, -0.60,  0.80 );

//   float noise( in vec2 p ) {
//     return sin(p.x)*sin(p.y);
//   }

//   float fbm4( vec2 p ) {
//       float f = 0.0;
//       f += 0.5000 * noise( p ); p = m * p * 2.02;
//       f += 0.2500 * noise( p ); p = m * p * 2.03;
//       f += 0.1250 * noise( p ); p = m * p * 2.01;
//       f += 0.0625 * noise( p );
//       return f / 0.9375;
//   }

//   float fbm6( vec2 p ) {
//       float f = 0.0;
//       f += 0.500000*(0.5 + 0.5 * noise( p )); p = m*p*2.02;
//       f += 0.250000*(0.5 + 0.5 * noise( p )); p = m*p*2.03;
//       f += 0.125000*(0.5 + 0.5 * noise( p )); p = m*p*2.01;
//       f += 0.062500*(0.5 + 0.5 * noise( p )); p = m*p*2.04;
//       f += 0.031250*(0.5 + 0.5 * noise( p )); p = m*p*2.01;
//       f += 0.015625*(0.5 + 0.5 * noise( p ));
//       return f/0.96875;
//   }

//   // float pattern (vec2 p, float time) {
//   //   float vout = fbm4( p + time + fbm6(  p + fbm4( p + time )) );
//   //   return abs(vout);
//   // }

//   float pattern (vec2 p, float time) {
//     float vout = fbm4( p + time + fbm4(  p + fbm4( p + time )) );
//     return abs(vout);
//   }

//   uniform sampler2D hdrTexture;
//   uniform float envLightIntensity;
//   varying vec3 vWorldDirection;
//   varying vec3 vPos;
//   #define RECIPROCAL_PI 0.31830988618
//   #define RECIPROCAL_PI2 0.15915494

//   uniform float time;
//   uniform float rotY;
//   uniform sampler2D matcap;

//   mat3 rotateY(float rad) {
//       float c = cos(rad);
//       float s = sin(rad);
//       return mat3(
//           c, 0.0, -s,
//           0.0, 1.0, 0.0,
//           s, 0.0, c
//       );
//   }

//   /**
//    * Adjusts the saturation of a color.
//    *
//    * @name czm_saturation
//    * @glslFunction
//    *
//    * @param {vec3} rgb The color.
//    * @param {float} adjustment The amount to adjust the saturation of the color.
//    *
//    * @returns {float} The color with the saturation adjusted.
//    *
//    * @example
//    * vec3 greyScale = czm_saturation(color, 0.0);
//    * vec3 doubleSaturation = czm_saturation(color, 2.0);
//    */
//   vec3 czm_saturation(vec3 rgb, float adjustment)
//   {
//       // Algorithm from Chapter 16 of OpenGL Shading Language
//       const vec3 W = vec3(0.2125, 0.7154, 0.0721);
//       vec3 intensity = vec3(dot(rgb, W));
//       return mix(intensity, rgb, adjustment);
//   }

//   uniform float diamondEnvMapIntensity;
//   vec4 mainImage ()  {

//     vec3 direction = normalize( vWorldDirection * rotateY(rotY));
//     vec2 uv;
//     uv.y = asin( clamp( direction.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
//     uv.x = atan( direction.z, direction.x ) * RECIPROCAL_PI2 + 0.5;

//     vec3 viewDir = normalize( vViewPosition );
//     vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
//     vec3 y = cross( viewDir, x );
//     vec2 uvMC = vec2( dot( x, direction ), dot( y, direction ) ) * 0.495 + 0.5; // 0.495 to remove artifacts caused by undersized matcap disks

//     vec4 matcapColor = texture2D( matcap, uvMC );

//     vec4 hdrV4 = matcapColor;// texture2D(hdrTexture, uv);

//     vec4 outColor;
//     outColor.a = 1.0;

//     float pLayout = pow(pattern(direction.xz * 3.3, 0.1), 2.0);

//     outColor.rgb = vec3(
//       ${diamondLighntess.toFixed(3)} * pattern((direction.xz * 0.5 + 0.5) * 15.0 + ${diamondRainbow.toFixed(
//         3,
//       )}, time * 0.05),
//       ${diamondLighntess.toFixed(3)} * pattern((direction.xz * 0.5 + 0.5) * 15.0, time * 0.05),
//       ${diamondLighntess.toFixed(3)} * pattern((direction.xz * 0.5 + 0.5) * 15.0 - ${diamondRainbow.toFixed(
//         3,
//       )}, time * 0.05)
//     );

//     outColor.r = pow(outColor.r * 0.4, ${diamondContrast.toFixed(3)});
//     outColor.g = pow(outColor.g * 0.4, ${diamondContrast.toFixed(3)});
//     outColor.b = pow(outColor.b * 0.4, ${diamondContrast.toFixed(3)});

//     outColor.rgb = mix(hdrV4.rgb , outColor.rgb, 0.3);
//     outColor.rgb  = czm_saturation(outColor.rgb, 0.1);

//     return outColor * diamondEnvMapIntensity;
//   }

//   `,
//   {
//     time: { value: 0 },
//     matcap: { value: matcap },
//     hdrTexture: { value: hdr },
//     diamondEnvMapIntensity: { value: diamondEnvMapIntensity },
//   },
//   128,
//   true,
// )
