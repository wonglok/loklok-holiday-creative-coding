import React, { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useComputeEnvMap } from './useComputeEnvMap'
import { useFrame } from '@react-three/fiber'
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  FrontSide,
  Mesh,
  MeshBasicMaterial,
  Points,
  ShaderMaterial,
  Vector3,
} from 'three'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler'

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
    <>
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
              envMapIntensity={0.55}
              envMap={rose3Env}
              side={DoubleSide}
              roughness={0.1}
              color={'#ff0'}
            />
            <Particles nodes={nodes}></Particles>
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
    </>
  )
}

function Particles({ nodes }) {
  let { primitiveArray, obj } = useMemo(() => {
    if (!nodes?.petals?.geometry) {
      return {}
    }
    let o3d = []
    let obj = []
    let pedals = [
      {
        geo: nodes?.petals?.geometry,
        props: {
          // position: [20.76555, 6.82571, 1.82089],
          // rotation: [0, 0, 1.32211],
          // scale: 0.13645,
        },
        amount: 256 * 256,
      },
    ]
    pedals.forEach(({ geo, props, amount = 512 * 512 }) => {
      let mesh = new Mesh(geo || new BoxGeometry(), new MeshBasicMaterial({ side: FrontSide }))
      let sampler = new MeshSurfaceSampler(mesh)
      sampler.build()

      let pointCount = amount // * 0.025
      let sPosition = new BufferAttribute(new Float32Array(pointCount * 4), 4)
      let sNormal = new BufferAttribute(new Float32Array(pointCount * 4), 4)
      let sRand = new BufferAttribute(new Float32Array(pointCount * 1), 1)
      let pos = new Vector3()
      let norm = new Vector3()
      for (let i = 0; i < pointCount; i++) {
        sampler.sample(pos, norm)
        sPosition.setXYZW(i, pos.x, pos.y, pos.z, 1.0)
        sNormal.setXYZW(i, norm.x, norm.y, norm.z, 1.0)
        sRand.setX(i, Math.random())
      }

      let bGeo = new BufferGeometry()
      bGeo.setAttribute('position', sPosition)
      bGeo.setAttribute('sPosition', sPosition)
      bGeo.setAttribute('sNormal', sNormal)
      bGeo.setAttribute('sRand', sRand)
      let points = new Points(
        bGeo,
        new ShaderMaterial({
          transparent: true,
          uniforms: {
            //
            time: { value: 0 },
            dist: { value: 0 },
            //
          },
          vertexShader: /* glsl */ `
          attribute vec4 sPosition;
          attribute vec4 sNormal;
          attribute float sRand;
          uniform float dist;
          uniform float time;

          mat3 rotateY(float rad) {
              float c = cos(rad);
              float s = sin(rad);
              return mat3(
                  c, 0.0, -s,
                  0.0, 1.0, 0.0,
                  s, 0.0, c
              );
          }
          mat3 rotateX(float rad) {
              float c = cos(rad);
              float s = sin(rad);
              return mat3(
                  1.0, 0.0, 0.0,
                  0.0, c, s,
                  0.0, -s, c
              );
          }
          
          mat3 rotateZ(float rad) {
              float c = cos(rad);
              float s = sin(rad);
              return mat3(
                  c, s, 0.0,
                  -s, c, 0.0,
                  0.0, 0.0, 1.0
              );
          }
        
          void main (void) {
            gl_PointSize = 1.0 / dist;
            if (gl_PointSize >=1.0) {
              gl_PointSize = 1.0;
            }

            float height = 5.0;
            
            float loop = mod(time * 1.5 + sRand * height, height);

            vec3 diff = vec3(
              sNormal.r * loop,
              sNormal.g * loop,
              sNormal.b * loop
            );

            // float loop2 = mod(time + sRand * 1.0, 1.0);

            // vec4 rNormal = modelViewMatrix * sNormal;
            // vec4 rPosition = modelViewMatrix * sPosition;

            // diff += normalize(rPosition.rgb) * rotateX(time * 3.141592) * 1.0;
            // diff += normalize(rPosition.rgb) * rotateY(time * 0.5 * 3.141592) * 1.0;
            // diff += normalize(rPosition.rgb) * rotateZ(time * 3.141592) * 1.0;

            // diff += normalize(sPosition.rgb) * rotateY(loop2 * 3.141592) * 1.0;
            // diff += normalize(sPosition.rgb) * rotateZ(loop2 * 3.141592) * 1.0;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(sPosition.rgb - sNormal.rgb * 3.0 + diff, 1.0);
          }
          `,
          fragmentShader: /* glsl */ `
            uniform float dist;
            void main (void) {
              float maxAlpha = 1.0;
              float alpha = 1.0;
              alpha = alpha / pow(dist, 1.5);
              if (alpha >= maxAlpha) {
                alpha = maxAlpha;
              }
              gl_FragColor = vec4(0.4, 0.4, 0.2, alpha);
            }
          `,
        }),
      )

      o3d.push(
        <group key={points.uuid} {...props}>
          <primitive object={points}></primitive>
        </group>,
      )

      obj.push(points)
    })
    return { primitiveArray: o3d, obj: obj }
  }, [nodes?.petals?.geometry])

  useFrame(({ controls }, dt) => {
    if (controls && obj?.length > 0) {
      obj.forEach((o) => {
        o.material.uniforms.dist.value = controls.object.position.distanceTo(controls.target) || 0
        o.material.uniforms.time.value = performance.now() / 1000
      })
    }
  })

  return <>{primitiveArray || []}</>
}
