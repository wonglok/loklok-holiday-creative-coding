import { Color, MeshPhysicalMaterial } from 'three'

export class NoodlePhysicalMaterial extends MeshPhysicalMaterial {
  constructor({ ...props }) {
    super({ ...props })

    let self = this

    this.metalness = 1.0
    this.roughness = 0.0
    this.envMapIntensity = 1.0

    this.uniforms = {
      posTexture: { value: null },
    }

    this.onBeforeCompile = (shader) => {
      shader.defines = {
        ...shader.defines,
        lengthSegments: props.subdivisions.toFixed(2),
        lineCount: props.lineCount.toFixed(2),
      }

      shader.uniforms.posTexture = {
        get value() {
          return self.uniforms.posTexture.value
        },
      }

      shader.uniforms.time = {
        get value() {
          return performance.now() / 1000
        },
      }

      shader.vertexShader = /* glsl */ `
        #define STANDARD
        varying vec3 vViewPosition;
        #ifdef USE_TRANSMISSION
          varying vec3 vWorldPosition;
        #endif
        #include <common>
        #include <uv_pars_vertex>
        #include <displacementmap_pars_vertex>
        #include <color_pars_vertex>
        #include <fog_pars_vertex>
        #include <normal_pars_vertex>
        #include <morphtarget_pars_vertex>
        #include <skinning_pars_vertex>
        #include <shadowmap_pars_vertex>
        #include <logdepthbuf_pars_vertex>
        #include <clipping_planes_pars_vertex>


        attribute float angle;
        attribute float newPosition;
        attribute float tubeInfo;
        varying float vT;
        attribute vec4 offset;

        attribute vec4 colorEach;
        varying vec4 vEachColor;

        uniform sampler2D posTexture;
        uniform float time;
        varying vec2 vMyUV;

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

        void main() {
          #include <uv_vertex>
          #include <color_vertex>
          #include <morphcolor_vertex>
          #include <beginnormal_vertex>
          #include <morphnormal_vertex>
          #include <skinbase_vertex>
          #include <skinnormal_vertex>
          #include <defaultnormal_vertex>
          #include <normal_vertex>
          //include <begin_vertex>
          
          vec3 transformed;
          objectNormal;
          
          float t = tubeInfo + 0.5;
          vT = t;

          vec2 volume = vec2(t * (1.0 - t)) * 0.005;

          createTube(t, volume, transformed, objectNormal);
          
          transformedNormal = normalMatrix * objectNormal;
          vNormal = normalize(transformedNormal);

          vEachColor = colorEach;

          vMyUV = uv;

          transformed = vec3( transformed );
          #ifdef USE_ALPHAHASH
            vPosition = vec3( transformed );
          #endif

          #include <morphtarget_vertex>
          #include <skinning_vertex>
          #include <displacementmap_vertex>
          #include <project_vertex>
          #include <logdepthbuf_vertex>
          #include <clipping_planes_vertex>
          vViewPosition = - mvPosition.xyz;
          #include <worldpos_vertex>
          #include <shadowmap_vertex>
          #include <fog_vertex>
        #ifdef USE_TRANSMISSION
          vWorldPosition = worldPosition.xyz;
        #endif
        }
      `

      shader.fragmentShader = /* glsl */ `
        #define STANDARD
        #ifdef PHYSICAL
          #define IOR
          #define USE_SPECULAR
        #endif
        uniform vec3 diffuse;
        uniform vec3 emissive;
        uniform float roughness;
        uniform float metalness;
        uniform float opacity;
        #ifdef IOR
          uniform float ior;
        #endif
        #ifdef USE_SPECULAR
          uniform float specularIntensity;
          uniform vec3 specularColor;
          #ifdef USE_SPECULAR_COLORMAP
            uniform sampler2D specularColorMap;
          #endif
          #ifdef USE_SPECULAR_INTENSITYMAP
            uniform sampler2D specularIntensityMap;
          #endif
        #endif
        #ifdef USE_CLEARCOAT
          uniform float clearcoat;
          uniform float clearcoatRoughness;
        #endif
        #ifdef USE_IRIDESCENCE
          uniform float iridescence;
          uniform float iridescenceIOR;
          uniform float iridescenceThicknessMinimum;
          uniform float iridescenceThicknessMaximum;
        #endif
        #ifdef USE_SHEEN
          uniform vec3 sheenColor;
          uniform float sheenRoughness;
          #ifdef USE_SHEEN_COLORMAP
            uniform sampler2D sheenColorMap;
          #endif
          #ifdef USE_SHEEN_ROUGHNESSMAP
            uniform sampler2D sheenRoughnessMap;
          #endif
        #endif
        #ifdef USE_ANISOTROPY
          uniform vec2 anisotropyVector;
          #ifdef USE_ANISOTROPYMAP
            uniform sampler2D anisotropyMap;
          #endif
        #endif
        varying vec3 vViewPosition;
        #include <common>
        #include <packing>
        #include <dithering_pars_fragment>
        #include <color_pars_fragment>
        #include <uv_pars_fragment>
        #include <map_pars_fragment>
        #include <alphamap_pars_fragment>
        #include <alphatest_pars_fragment>
        #include <alphahash_pars_fragment>
        #include <aomap_pars_fragment>
        #include <lightmap_pars_fragment>
        #include <emissivemap_pars_fragment>
        #include <iridescence_fragment>
        #include <cube_uv_reflection_fragment>
        #include <envmap_common_pars_fragment>
        #include <envmap_physical_pars_fragment>
        #include <fog_pars_fragment>
        #include <lights_pars_begin>
        #include <normal_pars_fragment>
        #include <lights_physical_pars_fragment>
        #include <transmission_pars_fragment>
        #include <shadowmap_pars_fragment>
        #include <bumpmap_pars_fragment>
        #include <normalmap_pars_fragment>
        #include <clearcoat_pars_fragment>
        #include <iridescence_pars_fragment>
        #include <roughnessmap_pars_fragment>
        #include <metalnessmap_pars_fragment>
        #include <logdepthbuf_pars_fragment>
        #include <clipping_planes_pars_fragment>
        varying vec4 vEachColor;
        varying vec2 vMyUV;
        varying float vT;
        uniform float time;
        
        vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
        {
            return a + b*cos( 6.28318*(c*t+d) );
        }

        void main() {
          #include <clipping_planes_fragment>
          vec4 diffuseColor = vec4( diffuse, opacity );
          ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
          vec3 totalEmissiveRadiance = emissive;
          #include <logdepthbuf_fragment>
          #include <map_fragment>
          //include <color_fragment>

          #if defined( USE_COLOR_ALPHA )
            diffuseColor *= vColor;
          #elif defined( USE_COLOR )
            diffuseColor.rgb *= vColor;
          #endif

          float tt = 1.0 - vT;
          vec3 colorPal = pal(time * 2.0 + rand(vMyUV) + tt * 5.0, vec3(0.21,0.55,0.63),vec3(0.2,0.5,0.33),vec3(0.2,0.18,0.75),vec3(0.06,0.16,0.65));
          diffuseColor.rgb *= vEachColor.rgb * 0.3 + colorPal * 1.0;
          diffuseColor.rgb = normalize(diffuseColor.rgb);

          #include <alphamap_fragment>
          #include <alphatest_fragment>
          #include <alphahash_fragment>
          #include <roughnessmap_fragment>
          #include <metalnessmap_fragment>
          #include <normal_fragment_begin>
          #include <normal_fragment_maps>
          #include <clearcoat_normal_fragment_begin>
          #include <clearcoat_normal_fragment_maps>
          #include <emissivemap_fragment>
          #include <lights_physical_fragment>
          #include <lights_fragment_begin>
          #include <lights_fragment_maps>
          #include <lights_fragment_end>
          #include <aomap_fragment>
          vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
          vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
          
          #include <transmission_fragment>

          vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
          #ifdef USE_SHEEN
            float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
            outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecular;
          #endif
          #ifdef USE_CLEARCOAT
            float dotNVcc = saturate( dot( geometry.clearcoatNormal, geometry.viewDir ) );
            vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
            outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + clearcoatSpecular * material.clearcoat;
          #endif
          #include <opaque_fragment>
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
          #include <premultiplied_alpha_fragment>
          #include <dithering_fragment>
        }
      `
    }
  }
}
