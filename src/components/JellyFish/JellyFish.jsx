import {
  Environment,
  MeshRefractionMaterial,
  MeshTransmissionMaterial,
  OrbitControls,
  PerspectiveCamera,
  StatsGl,
  useEnvironment,
  useGLTF,
} from '@react-three/drei'
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { Suspense, useEffect, useMemo } from 'react'
import {
  AnimationMixer,
  BackSide,
  Color,
  CubeReflectionMapping,
  CubeRefractionMapping,
  DoubleSide,
  FrontSide,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
} from 'three'
import { useComputeEnvMap } from './useComputeEnvMap'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils'
export function JellyFish() {
  return (
    <>
      <Canvas>
        <Suspense fallback={null}>
          <EnvMapGen></EnvMapGen>
        </Suspense>
        <PerspectiveCamera makeDefault></PerspectiveCamera>
        <OrbitControls makeDefault object-position={[0, 0.5, 1]} target={[0, 0, 0]}></OrbitControls>
        <EffectComposer disableNormalPass multisampling={2}>
          <Bloom mipmapBlur intensity={0.5} luminanceThreshold={0.5}></Bloom>
        </EffectComposer>
        <StatsGl></StatsGl>
        {/* <Environment files={`/hdr/shanghai.hdr`}></Environment> */}
      </Canvas>
    </>
  )
}

function EnvMapGen() {
  let { envMap: jellyEnvMap } = useComputeEnvMap(
    `

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

  // float pattern (vec2 p, float time) {
  //   float vout = fbm4( p + time + fbm6(  p + fbm4( p + time )) );
  //   return abs(vout);
  // }

  float pattern (vec2 p, float time) {
    float vout = fbm4( p + time + fbm4(  p + fbm4( p + time )) );
    return abs(vout);
  }

  uniform sampler2D equilRectTex;
  uniform float envLightIntensity;
  varying vec3 vWorldDirection;
  varying vec3 vPos;
  #define RECIPROCAL_PI 0.31830988618
  #define RECIPROCAL_PI2 0.15915494

  uniform float time;
  uniform float rotY;
  uniform sampler2D matcapTex;

  mat3 rotateY(float rad) {
      float c = cos(rad);
      float s = sin(rad);
      return mat3(
          c, 0.0, -s,
          0.0, 1.0, 0.0,
          s, 0.0, c
      );
  }

  /**
   * Adjusts the saturation of a color.
   *
   * @name czm_saturation
   * @glslFunction
   *
   * @param {vec3} rgb The color.
   * @param {float} adjustment The amount to adjust the saturation of the color.
   *
   * @returns {float} The color with the saturation adjusted.
   *
   * @example
   * vec3 greyScale = czm_saturation(color, 0.0);
   * vec3 doubleSaturation = czm_saturation(color, 2.0);
   */
  vec3 czm_saturation(vec3 rgb, float adjustment)
  {
      // Algorithm from Chapter 16 of OpenGL Shading Language
      const vec3 W = vec3(0.2125, 0.7154, 0.0721);
      vec3 intensity = vec3(dot(rgb, W));
      return mix(intensity, rgb, adjustment);
  }

  vec4 mainImage ()  {

    vec3 direction = normalize( vWorldDirection * rotateY(rotY + time));
    vec2 uv;
    uv.y = asin( clamp( direction.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
    uv.x = atan( direction.z, direction.x ) * RECIPROCAL_PI2 + 0.5;

    vec3 viewDir = normalize( vViewPosition );
    vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
    vec3 y = cross( viewDir, x );
    vec2 uvMC = vec2( dot( x, direction ), dot( y, direction ) ) * 0.495 + 0.5; // 0.495 to remove artifacts caused by undersized matcap disks

    vec4 matcapColor = texture2D( matcapTex, uvMC );

    vec4 hdrV4 = matcapColor;// texture2D(equilRectTex, uv);

    vec3 c3 = vec3(
      0.15 * pattern(time + uv * 5.0 + 0.3, time * 0.5),
      0.15 * pattern(time + uv * 5.0 + 0.0, time * 0.5),
      0.15 * pattern(time + uv * 5.0 - 0.3, time * 0.5)
    );
    
    return vec4(c3, 1.0);
  }

  `,
    {
      time: {
        get value() {
          return performance.now() / 1000
        },
        set value(v) {
          this._value = v
        },
      },
      matcapTex: { value: null },
      equilRectTex: { value: null },
      diamondEnvMapIntensity: { value: 1 },
    },
    128,
    true,
  )
  let env = useEnvironment({ files: `/hdr/shanghai.hdr` })
  let scene = useThree((r) => r.scene)

  jellyEnvMap.mapping = CubeReflectionMapping

  scene.background = env
  scene.environment = jellyEnvMap
  let glb = useGLTF(`/jellyfish/jellyfish1.glb`)

  return (
    <group>
      <group>
        <Suspense fallback={null}>
          <JellyYo gltf={glb} jellyEnvMap={jellyEnvMap} env={env}></JellyYo>
        </Suspense>
      </group>
      <group position={[0.5, 0, 0]}>
        <Suspense fallback={null}>
          <JellyYo gltf={glb} jellyEnvMap={jellyEnvMap} env={env}></JellyYo>
        </Suspense>
      </group>
    </group>
  )
}
function JellyYo({ gltf, jellyEnvMap }) {
  let glb = useMemo(() => {
    return {
      animations: [...gltf.animations],
      scene: clone(gltf.scene),
    }
  }, [gltf])

  let mixer = useMemo(() => new AnimationMixer(glb.scene), [glb])
  useFrame((_, dt) => {
    mixer.update(dt)
  })
  useEffect(() => {
    mixer.clipAction(glb.animations[2], glb.scene).play()
  }, [mixer, glb])

  let { items } = useMemo(() => {
    let items = []
    glb?.scene?.traverse((it) => {
      if (it.material) {
        if (!it.userData.oMat) {
          it.userData.oMat = it.material.clone()
        }
        let mat = it.userData.oMat

        it.material = new MeshPhysicalMaterial({
          ...mat,
          roughness: 0.1,
          metalness: 0.5,
          envMap: jellyEnvMap,
          envMapIntensity: 10,
          transmission: 1.3,
          thickness: 2,
          envMap: jellyEnvMap,
          emissiveIntensity: 20,
          transparent: true,
          side: DoubleSide,
        })

        it.frustumCulled = false

        if (it.name === 'Mesh002_1') {
          it.visible = true
        }
      }
    })

    return { items }
  }, [glb?.scene, jellyEnvMap])

  useFrame((st, dt) => {
    glb.scene.rotation.y += dt / 2
  })
  return (
    <>
      <group
        rotation={[0.15 * Math.PI, 0, Math.PI * -0.15]}
        onClick={(ev) => {
          console.log(ev.object.name)
        }}
      >
        {/* {items} */}
        <primitive object={glb.scene}></primitive>
      </group>
    </>
  )
}
