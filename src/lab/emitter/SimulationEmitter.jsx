import { Environment, OrbitControls, Plane, useFBO } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import { Camera, Color, FloatType, MeshPhysicalMaterial, RGBAFormat, ShaderMaterial, Vector3 } from 'three'
import { useFrame } from '@react-three/fiber'
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

  let READ2 = 0
  let WRITE = 1
  let READ1 = 2

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
          #include <common>
          
          void main (void) {
            vec2 uv = gl_FragCoord.xy / vec2(WIDTH, HEIGHT);
            vec4 last1 = texture2D(read1, uv);
            vec4 last2 = texture2D(read2, uv);
            vec3 diff = vec3(last2.rgb - last1.rgb); 

            float mode = 0.0;
            if (length(last1.rgb) == 0.0 || length(last2.rgb) == 0.0) {
              mode = 1.0;
            } if (last1.a >= 1.0 || last2.a >= 1.0) {
              mode = 1.0;
            } if (length(last1) >= 25.0) {
              mode = 1.0;
            } if (length(diff) >= 5.0) {
              mode = 1.0;
            }

            if (mode == 1.0) {
              vec3 initCube = vec3(
                2.0 * (rand(uv + 0.3) - 0.5), 2.0 * (rand(uv + 0.2) - 0.5) + 1.0, 2.0 * (rand(uv + 0.1) - 0.5)
              );

              initCube.y += 2.0;

              gl_FragColor = vec4(initCube, rand(uv + time) * 2.0);
            } else {
              vec3 velocity;

              velocity.x += (last1.w) * 0.1 * sin(time * 0.5);
              velocity.y += -1.0 * dt * 5.0 * rand(uv + time);

              last1.a += rand(uv + time) * dt * 0.5;
              gl_FragColor = vec4(last1.rgb + velocity, last1.a);
            }
          }
        `,
        transparent: false,
      }),
    )
  }, [HEIGHT, WIDTH])

  let displayShader = useMemo(() => {
    let mat = new MeshPhysicalMaterial({
      roughness: 0,
      metalness: 0.3,
      color: new Color('#ffffff'),
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

  useFrame(({ gl }, dt) => {
    gl.setRenderTarget(layout[tick.current][WRITE])

    quad.material.uniforms.time.value = performance.now() / 1000
    quad.material.uniforms.dt.value = dt

    quad.material.uniforms.read1.value = layout[tick.current][READ1].texture
    quad.material.uniforms.read2.value = layout[tick.current][READ2].texture

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

  return (
    <group>
      {/*  */}

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
