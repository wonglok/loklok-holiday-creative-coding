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

          
          void main (void) {
            vec2 uv = gl_FragCoord.xy / vec2(WIDTH, HEIGHT);
            vec4 last1 = texture2D(read1, uv);
            vec4 last2 = texture2D(read2, uv);

            float mode = 0.0;
            if (length(last1.rgb) == 0.0 || length(last2.rgb) == 0.0) {
              mode = 1.0;
            } if (last1.a >= 1.0 || last2.a >= 1.0) {
              mode = 1.0;
            } if (length(last1) >= 25.0) {
              mode = 1.0;
            }

            if (mode == 1.0) {
              vec3 initCube = vec3(
                2.0 * (rand(uv + 0.3) - 0.5), 2.0 * (rand(uv + 0.2) - 0.5) + 1.0, 2.0 * (rand(uv + 0.1) - 0.5)
              );

              initCube.rgb *= 0.5;
              initCube.y += 1.0;

              gl_FragColor = vec4(initCube, rand(uv + time) * 2.0);
            } else {
              vec3 velocity = vec3(last1 - last2) * dt;

              float radius = 1.3;

              vec3 dir = normalize(last1.rgb - mouse.rgb);
              float dist = length(last1.rgb - mouse.rgb);

              if (dist <= radius) {
                velocity += dir * dist * dt * 16.777;
              }

              velocity.y += -1.0 * dt * 2.0 * rand(uv + time);

              last1.a += rand(uv + time) * dt * 0.25;
              last1.rgb += velocity;

              gl_FragColor = vec4(last1.rgb, last1.a);
            }
          }
        `,
        transparent: false,
      }),
    )
  }, [HEIGHT, WIDTH])

  let displayShader = useMemo(() => {
    let mat = new MeshPhysicalMaterial({
      roughness: 0.3,
      metalness: 1,
      color: new Color('#ffffff'),
      transparent: true,
      opacity: 0.5,
    })

    mat.onBeforeCompile = (shader) => {
      // console.log(shader.vertexShader)
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
