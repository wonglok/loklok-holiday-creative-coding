import { Sphere } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import React, { useEffect, useRef } from 'react'
import { BackSide, Color, DoubleSide, Vector2, Vector3 } from 'three'
import Pal from 'nice-color-palettes'
export function Sky() {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  let shaders = {
    vertexShader: /* glsl */ `
    // varying vec3 vPos;
    // varying vec3 vUv3;
    varying vec3 vWorldDirection;
    vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
      return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
    }

    void main() {
      vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
      gl_Position = projectionMatrix * mvPosition;
      // vPos = position;
      // vUv3 = uv.xyx;
      vWorldDirection = transformDirection( position, modelMatrix );

    }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vWorldDirection;

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

      // varying vec3 vPos;
      uniform float time;
      uniform vec3 color1;
      uniform vec3 color2;
      uniform vec3 color3;
      // varying vec3 vUv3;

      void main() {
        float speed = time / 3.5;
        vec3 pp;
        pp = vWorldDirection.xyz * 500.0 + speed * 2.0;
        // pp += vPos * 0.25 + speed;
        float noise = clamp(cnoise(speed + pp / 250.0 + 0.0 ), 0.0, 1.0);

        float starNoise1 = (noise) * pow(cnoise(speed + pp * 2.0) * 0.5 + 0.5, 15.5 + sin(time)) * 10.0;
        float starNoise2 = (noise) * pow(cnoise(speed + pp * 1.3) * 0.5 + 0.5, 15.5 + sin(time)) * 20.0;

        starNoise1 = clamp(starNoise1, 0.0, 1.0);
        starNoise2 = clamp(starNoise2, 0.0, 1.0);

        vec4 backgroundColor = vec4(color1 * 0.0035, 1.0);
        gl_FragColor = backgroundColor;
        gl_FragColor.rgb += vec3(pow(starNoise1, 1.3) * color2) * 1.0;
        gl_FragColor.rgb += vec3(pow(starNoise2, 1.3) * color3) * 1.0;
      
        gl_FragColor.rgb *= 1.0;
      
      }
      `,
  }

  let ref = useRef()

  let text = JSON.stringify(shaders)
  useEffect(() => {
    if (ref.current) {
      ref.current.needsUpdate = true
    }
  }, [shaders, shaders.fragmentShader, shaders.vertexShader, text])

  let uniforms = useRef({
    color1: { value: new Color(Pal[5][0]) },
    color2: { value: new Color(Pal[5][2]) },
    color3: { value: new Color(Pal[5][5]) },
    time: { value: 0 },
    point: { value: new Vector3() },
    resolution: { value: new Vector2() },
    point2d: { value: new Vector2() },
    mouse: { value: new Vector2() },
    viewport: { value: new Vector2() },
  })

  useFrame(({ viewport, camera, controls, size, mouse }) => {
    uniforms.current.time.value += 1 / 60

    if (controls) {
      let vp = viewport.getCurrentViewport(camera, controls.target, size)
      uniforms.current.viewport.value.set(vp.width, vp.height)
    }

    if (uniforms.current.resolution) {
      uniforms.current.resolution.value.set(size.width, size.height).multiplyScalar(window.devicePixelRatio || 1.0)
    }

    if (uniforms.current.point2d) {
      uniforms.current.point2d.value
        .set((mouse.x * 0.5 + 0.5) * size.width, -(1.0 - (mouse.y * 0.5 + 0.5)) * size.height)
        .multiplyScalar(window.devicePixelRatio || 1.0)
    }

    if (uniforms.current.mouse) {
      uniforms.current.mouse.value.copy(mouse)
    }
  })

  let ts = useRef({})
  let controls = useThree((r) => r.controls)
  return (
    <Sphere
      frustumCulled={false}
      userData={{
        enableBloom: true,
      }}
      // onPointerDown={() => {
      //   controls.enabled = false
      //   ts.current.isDown = true
      // }}
      // onPointerMove={(ev) => {
      //   //
      //   if (ts.current.isDown) {
      //     if (uniforms.current && uniforms.current.point) {
      //       uniforms.current.point.value.copy(ev.point)
      //     }
      //   }
      // }}
      // onPointerUp={() => {
      //   controls.enabled = true
      //   ts.current.isDown = false
      // }}
      scale={1}
      args={[1500, 15, 15]}
    >
      <shaderMaterial
        ref={ref}
        uniforms={uniforms.current}
        fragmentShader={shaders.fragmentShader}
        vertexShader={shaders.vertexShader}
        side={BackSide}
        transparent={true}
      >
        {/*  */}
        {/*  */}
      </shaderMaterial>
    </Sphere>
  )
}
