import React, { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useComputeEnvMap } from './useComputeEnvMap'
import { useFrame } from '@react-three/fiber'
import { Color, DoubleSide } from 'three'

export function Rose3({ ...props }) {
  const { nodes, materials } = useGLTF('/rose/rose3.glb')

  let uniforms = useMemo(() => {
    return {
      time: { value: 0 },
    }
  }, [])
  let { envMap: rose3Env } = useComputeEnvMap(
    /* glsl */ `

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
    vec3 direction = normalize( vWorldDirection * rotateY(time * 0.0165));
    vec2 uv;
    uv.y = asin( clamp( direction.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
    uv.x = atan( direction.z, direction.x ) * RECIPROCAL_PI2 + 0.5;

    // vec4 hdrTextureC4 = texture2D(hdrTexture, uv);

    vec4 outColor;
    outColor.a = 1.0;

    float pLayout1 = pow(pattern(time * 0.5 + uv.xy * 5.0 + 0.01, 0.1 * time), 1.3);

    outColor.rgb = vec3(
      pLayout1 * 0.55 + 0.05 + 0.5,
      pLayout1 * 0.1 + 0.05,
      pLayout1 * 0.1 + 0.05
    );

    outColor.r = pow(outColor.r, 2.0);
    
    return outColor;
  }

  `,
    uniforms,
    64,
  )

  // useFrame((_, dt) => {
  //   if (materials?.rose) {
  //     materials.rose.envMap = rose3Env
  //     materials.rose.color = new Color('#880000')
  //     materials.rose.emissive = new Color('#220000')
  //   }
  // })

  return (
    <group scale={0.1} rotation={[-0.25 * Math.PI, 0, 0]} position={[0, 0.2, 0]} {...props} dispose={null}>
      <group name='Rose' position={[0.00221, 0, 0]} rotation={[0, 1.57053, 0]} scale={0.10008}>
        <mesh
          name='petals'
          castShadow
          receiveShadow
          geometry={nodes.petals.geometry}
          material={materials.rose}
          position={[20.76555, 6.82571, 1.82089]}
          rotation={[0, 0, 1.32211]}
          scale={0.13645}
        >
          <meshPhysicalMaterial
            metalness={1.0}
            envMapIntensity={0.7}
            envMap={rose3Env}
            side={DoubleSide}
            roughness={0.1}
            color={'#f00'}
          />
        </mesh>
        <mesh
          name='Stem'
          castShadow
          receiveShadow
          geometry={nodes.Stem.geometry}
          material={materials.leaf}
          position={[9.75426, -6.88729, 0.2459]}
          rotation={[0, 0, 0.525]}
          scale={0.13645}
        />
      </group>
    </group>
  )
}
