import { Environment, OrbitControls, Plane, useFBO } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import { Camera, Color, FloatType, MeshPhysicalMaterial, RGBAFormat, ShaderMaterial, Vector3 } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { FullScreenQuad } from 'three-stdlib'

export function SimulationEmitter({ WIDTH = 512, HEIGHT = 512 }) {
  let fbo0 = useFBO(WIDTH, HEIGHT, { samples: 0, depth: false, stencil: false, type: FloatType, format: RGBAFormat })
  let fbo1 = useFBO(WIDTH, HEIGHT, { samples: 0, depth: false, stencil: false, type: FloatType, format: RGBAFormat })
  let fbo2 = useFBO(WIDTH, HEIGHT, { samples: 0, depth: false, stencil: false, type: FloatType, format: RGBAFormat })

  let layout = useMemo(() => {
    return [
      [fbo0, fbo1, fbo2],
      [fbo2, fbo0, fbo1],
      [fbo1, fbo2, fbo0],
    ]
  }, [fbo1, fbo0, fbo2])

  let tick = useRef(0)

  let WRITE = 0
  let READ1 = 1
  let READ2 = 2

  let quad = useMemo(() => {
    return new FullScreenQuad(
      new ShaderMaterial({
        defines: {
          WIDTH: `${WIDTH.toFixed(1)}`,
          HEIGHT: `${HEIGHT.toFixed(1)}`,
        },
        uniforms: {
          mouse: { value: new Vector3() },
          force: { value: new Vector3() },
          read1: { value: 0 },
          read2: { value: 0 },
          time: { value: 0 },
          dt: { value: 0 },
        },
        // vertexShader: ``,
        fragmentShader: /* glsl */ `
          uniform float time;
          uniform float dt;
          uniform highp sampler2D read1;
          uniform highp sampler2D read2;
          uniform vec3 mouse;
          uniform vec3 force;

          #include <common>

          float sdSphere( vec3 p, float s )
          {
            return length(p)-s;
          }


          //	Simplex 3D Noise 
          //	by Ian McEwan, Ashima Arts
          //
          vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
          vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

          float snoise(vec3 v){ 
            const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
            const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

          // First corner
            vec3 i  = floor(v + dot(v, C.yyy) );
            vec3 x0 =   v - i + dot(i, C.xxx) ;

          // Other corners
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min( g.xyz, l.zxy );
            vec3 i2 = max( g.xyz, l.zxy );

            //  x0 = x0 - 0. + 0.0 * C 
            vec3 x1 = x0 - i1 + 1.0 * C.xxx;
            vec3 x2 = x0 - i2 + 2.0 * C.xxx;
            vec3 x3 = x0 - 1. + 3.0 * C.xxx;

          // Permutations
            i = mod(i, 289.0 ); 
            vec4 p = permute( permute( permute( 
                      i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

          // Gradients
          // ( N*N points uniformly over a square, mapped onto an octahedron.)
            float n_ = 1.0/7.0; // N=7
            vec3  ns = n_ * D.wyz - D.xzx;

            vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

            vec4 x = x_ *ns.x + ns.yyyy;
            vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);

            vec4 b0 = vec4( x.xy, y.xy );
            vec4 b1 = vec4( x.zw, y.zw );

            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));

            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

            vec3 p0 = vec3(a0.xy,h.x);
            vec3 p1 = vec3(a0.zw,h.y);
            vec3 p2 = vec3(a1.xy,h.z);
            vec3 p3 = vec3(a1.zw,h.w);

          //Normalise gradients
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
            p0 *= norm.x;
            p1 *= norm.y;
            p2 *= norm.z;
            p3 *= norm.w;

          // Mix final noise value
            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                          dot(p2,x2), dot(p3,x3) ) );
          }



          vec3 snoiseVec3( vec3 x ){

            float s  = snoise(vec3( x ));
            float s1 = snoise(vec3( x.y - 19.1 , x.z + 33.4 , x.x + 47.2 ));
            float s2 = snoise(vec3( x.z + 74.2 , x.x - 124.5 , x.y + 99.4 ));
            vec3 c = vec3( s , s1 , s2 );
            return c;

          }


          vec3 curlNoise( vec3 p ){
            
            const float e = .1;
            vec3 dx = vec3( e   , 0.0 , 0.0 );
            vec3 dy = vec3( 0.0 , e   , 0.0 );
            vec3 dz = vec3( 0.0 , 0.0 , e   );

            vec3 p_x0 = snoiseVec3( p - dx );
            vec3 p_x1 = snoiseVec3( p + dx );
            vec3 p_y0 = snoiseVec3( p - dy );
            vec3 p_y1 = snoiseVec3( p + dy );
            vec3 p_z0 = snoiseVec3( p - dz );
            vec3 p_z1 = snoiseVec3( p + dz );

            float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
            float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
            float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

            const float divisor = 1.0 / ( 2.0 * e );
            return normalize( vec3( x , y , z ) * divisor );

          }

          
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
          
          void main (void) {
            vec2 uv = gl_FragCoord.xy / vec2(WIDTH, HEIGHT);
            vec4 last1 = texture2D(read1, uv);
            vec4 last2 = texture2D(read2, uv);

            float mode = 0.0;
            if (length(last1.rgb) == 0.0 || length(last2.rgb) == 0.0) {
              mode = 1.0;
            } if (last1.a >= 1.0 || last2.a >= 1.0) {
              mode = 1.0;
            } if (length(last1) >= 5.0) {
              mode = 1.0;
            }

            if (mode == 1.0) {
              vec3 initCube = vec3(
                2.0 * (rand(uv + 0.3) - 0.5), 2.0 * (rand(uv + 0.2) - 0.5) + 1.0, 2.0 * (rand(uv + 0.1) - 0.5)
              );

              initCube.rgb *= 0.15;
              initCube.y += 2.0;

              gl_FragColor = vec4(initCube, rand(uv + time) * 2.0);
            } else {
              vec3 velocity = vec3(last1 - last2) * dt;

              float radius = 1.5;

              vec3 dir = normalize(last1.rgb - mouse.rgb);

              float dist = length(last1.rgb - mouse.rgb);

              if (dist <= radius) {
                velocity += dir * dist;
              }

              velocity.y += -0.5;// * rand(uv + time);

              last1.a += rand(uv + time) * dt * 0.25;

              last1.rgb += velocity * dt;
              
              // last1.rgb += curlNoise(last1.rgb * 0.25) * 0.003;

              gl_FragColor = vec4(last1.rgb, last1.a);
            }
          }
        `,
        transparent: false,
      }),
    )
  }, [HEIGHT, WIDTH])

  //

  let displayShader = useMemo(() => {
    let mat = new MeshPhysicalMaterial({
      roughness: 0.3,
      metalness: 1,
      color: new Color('#ffffff'),
      transparent: true,
      opacity: 0.5,
    })

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.posTex = { value: null }
      shader.uniforms.read1 = { value: null }
      shader.uniforms.read2 = { value: null }

      shader.vertexShader = shader.vertexShader.replace(`#include <normal_vertex>`, `#include <normal_vertex>`)
      shader.vertexShader = shader.vertexShader.replace(
        `#include <clipping_planes_pars_vertex>`,
        `#include <clipping_planes_pars_vertex>
        
        uniform highp sampler2D posTex; 
        `,
      )
      shader.vertexShader = shader.vertexShader.replace(
        `#include <begin_vertex>`,
        `
        
        vec4 posData = texture2D(posTex, uv);
        vec3 transformed = vec3( posData );

        #ifdef USE_ALPHAHASH
          vPosition = vec3( transformed );
        #endif`,
      )
      shader.vertexShader = shader.vertexShader.replace(
        `#include <fog_vertex>`,
        `#include <fog_vertex>
          gl_PointSize = 1.0;
        `,
      )

      mat.shader = shader
      return shader
    }

    return mat
  }, [])

  useEffect(() => {
    return () => {
      quad.dispose()
    }
  }, [quad])

  let hover = useRef()

  useFrame(({ gl, raycaster, camera }, dt) => {
    gl.setRenderTarget(layout[tick.current][WRITE])

    quad.material.uniforms.time.value = performance.now() / 1000
    quad.material.uniforms.dt.value = dt

    quad.material.uniforms.read1.value = layout[tick.current][READ1].texture
    quad.material.uniforms.read2.value = layout[tick.current][READ2].texture

    if (hover.current) {
      hover.current.lookAt(camera.position)
    }

    quad.render(gl)

    gl.setRenderTarget(null)

    if (displayShader.shader) {
      displayShader.shader.uniforms.posTex.value = layout[tick.current][WRITE].texture
      displayShader.shader.uniforms.read1.value = layout[tick.current][READ1].texture
      displayShader.shader.uniforms.read2.value = layout[tick.current][READ2].texture
    }

    tick.current += 1
    tick.current %= layout.length
  })

  //

  let posCount = WIDTH * HEIGHT
  let posArray = useMemo(() => {
    let f32Arr = new Float32Array(posCount * 3)

    for (let i = 0; i < posCount; i++) {
      // Generate random values for x, y, and z on every loop
      let x = (Math.random() - 0.5) * 2
      let y = (Math.random() - 0.5) * 2
      let z = (Math.random() - 0.5) * 2

      // We add the 3 values to the attribute array for every loop
      f32Arr.set([x, y, z], i * 3)
    }

    return f32Arr
  }, [posCount])

  let uvArray = useMemo(() => {
    let f32Arr = new Float32Array(posCount * 2)

    let i = 0
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        let yy = y / HEIGHT
        let xx = x / WIDTH

        // We add the 3 values to the attribute array for every loop
        f32Arr.set([xx, yy], i * 2)
        i++
      }
    }

    return f32Arr
  }, [posCount, WIDTH, HEIGHT])

  let normalArray = useMemo(() => {
    let f32Arr = new Float32Array(posCount * 3)

    let i = 0
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        // Generate random values for x, y, and z on every loop
        let x = (Math.random() - 0.5) * 2
        let y = (Math.random() - 0.5) * 2
        let z = (Math.random() - 0.5) * 2

        // We add the 3 values to the attribute array for every loop
        f32Arr.set([x, y, z], i * 3)
        i++
      }
    }

    return f32Arr
  }, [posCount, WIDTH, HEIGHT])

  let ptLightRef = useRef()
  let pt = useMemo(() => {
    return new Vector3()
  }, [])
  let last = useMemo(() => {
    return new Vector3()
  }, [])
  let diff = useMemo(() => {
    return new Vector3()
  }, [])

  useFrame(() => {
    if (last.length() === 0) {
      last.copy(pt)
    }
    diff.copy(pt).sub(last)
    last.copy(pt)
    quad.material.uniforms.force.value.add(diff)
    quad.material.uniforms.force.value.multiplyScalar(0.99)
    quad.material.uniforms.mouse.value.copy(pt)
  })

  useFrame((st, dt) => {
    if (ptLightRef.current) {
      ptLightRef.current.position.copy(quad.material.uniforms.mouse.value)
    }
  })

  return (
    <group>
      {/*  */}

      <pointLight ref={ptLightRef}></pointLight>
      <Plane
        visible={false}
        onPointerMove={({ point }) => {
          pt.copy(point)
        }}
        args={[1000, 1000]}
        ref={hover}
      ></Plane>

      <Environment files={`/hdr/shanghai.hdr`} />
      <OrbitControls></OrbitControls>

      <Plane position={[1, 0, -1]}>
        <meshBasicMaterial map={fbo0.texture}></meshBasicMaterial>
      </Plane>
      <Plane position={[2, 0, -1]}>
        <meshBasicMaterial map={fbo1.texture}></meshBasicMaterial>
      </Plane>

      <Plane position={[3, 0, -1]}>
        <meshBasicMaterial map={fbo2.texture}></meshBasicMaterial>
      </Plane>

      <points material={displayShader}>
        <bufferGeometry attach={'geometry'}>
          <bufferAttribute
            attach={'attributes-position'}
            count={posCount}
            array={posArray}
            itemSize={3}
            normalized={false}
          ></bufferAttribute>
          <bufferAttribute
            attach={'attributes-uv'}
            count={posCount}
            array={uvArray}
            itemSize={2}
            normalized={false}
          ></bufferAttribute>
          <bufferAttribute
            attach={'attributes-normal'}
            count={posCount}
            array={normalArray}
            itemSize={3}
            normalized={false}
          ></bufferAttribute>
        </bufferGeometry>
      </points>

      {/*  */}
    </group>
  )
}
