/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
*/

import { useGLTF } from '@react-three/drei'
import { useComputeEnvMap } from './useComputeEnvMap'
// import { useFrame } from '@react-three/fiber'
// import { useRef } from 'react'

export function Rose(props) {
  const { nodes, materials } = useGLTF('/rose/rose2.glb?a=1')

  let { envMap: envMapGlass } = useComputeEnvMap(
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
      pLayout1 * 0.23 + 0.05,
      pLayout1 * 0.23 + 0.05
    );

    return outColor;
  }

  `,
    { time: { value: 1 } },
    1024,
    true,
  )

  return (
    <group {...props} dispose={null}>
      <mesh
        name='Stem'
        castShadow
        receiveShadow
        frustumCulled={false}
        geometry={nodes.Stem.geometry}
        material={materials.green}
        position={[0.01582, 0.18058, -0.08771]}
        rotation={[1.1232, 0, -Math.PI / 2]}
        scale={0.00136}
        userData={{ name: 'Stem' }}
      >
        <meshPhysicalMaterial envMap={envMapGlass} transmission={1} thickness={1} roughness={0} color={'#008800'} />
      </mesh>
      <mesh
        name='petals021'
        castShadow
        receiveShadow
        frustumCulled={false}
        geometry={nodes.petals021.geometry}
        position={[0.03869, 0.32278, -0.11959]}
        rotation={[1.92032, 0, -Math.PI / 2]}
        scale={0.00136}
        userData={{ name: 'petals.021' }}
      >
        <meshPhysicalMaterial
          metalness={0.1}
          envMap={envMapGlass}
          transmission={1}
          thickness={1}
          roughness={0}
          color={'#440000'}
        />
      </mesh>
      <mesh
        name='petals001'
        castShadow
        receiveShadow
        frustumCulled={false}
        geometry={nodes.petals001.geometry}
        position={[0.03727, 0.30462, -0.06339]}
        rotation={[1.92032, 0, -Math.PI / 2]}
        scale={0.00136}
        userData={{ name: 'petals.001' }}
      >
        <meshPhysicalMaterial
          metalness={0.1}
          envMap={envMapGlass}
          transmission={1}
          thickness={1}
          roughness={0}
          color={'#440000'}
        />
      </mesh>
      <mesh
        name='petals013'
        castShadow
        receiveShadow
        frustumCulled={false}
        geometry={nodes.petals013.geometry}
        position={[0.07679, 0.34146, -0.12545]}
        rotation={[1.92032, 0, -Math.PI / 2]}
        scale={0.00136}
        userData={{ name: 'petals.013' }}
      >
        <meshPhysicalMaterial
          metalness={0.1}
          envMap={envMapGlass}
          transmission={1}
          thickness={1}
          roughness={0}
          color={'#440000'}
        />
      </mesh>
    </group>
  )
}
