import { BufferAttribute, BufferGeometry, FloatType, Vector2, SkinnedMesh, DataTexture, RGBAFormat } from 'three'

export function getSkinData({ ww = 512, hh = 512, skinnedMesh }) {
  /** @type {SkinnedMesh} */
  let it = skinnedMesh

  /** @type {BufferGeometry} */
  let nonIndexed = it.geometry.toNonIndexed()

  // /** @type {PerspectiveCamera} */
  // let camera = await api.ready.camera;

  // let nearestPow2 = (aSize) => {
  //   return Math.pow(2, Math.ceil(Math.log(aSize) / Math.log(2)))
  // }

  let width = ww
  let height = hh

  // console.log(width, height)

  function createTexture() {
    let f32 = new Float32Array(width * height * 4)
    let dataTexture = new DataTexture(f32, width, height, RGBAFormat, FloatType)
    dataTexture.needsUpdate = true
    return dataTexture
  }

  function accessCoord() {
    let tex = createTexture()
    let height = tex.image.height
    let width = tex.image.width

    let uv = []
    let i = 0
    let total = width * height
    for (let h = 0; h < height; h++) {
      for (let w = 0; w < width; w++) {
        tex.image.data[i * 4 + 0] = w / width || 0
        tex.image.data[i * 4 + 1] = h / height || 0
        tex.image.data[i * 4 + 2] = i / total
        tex.image.data[i * 4 + 3] = i <= nonIndexed.attributes.position.array.length / 3 ? 1 : -1

        uv.push(w / width, h / height, i / total, tex.image.data[i * 4 + 3])
        i++
      }
    }

    tex.userData.iSize = 4

    tex.needsUpdate = true

    let attr = new BufferAttribute(new Float32Array(uv), 4)
    return {
      tex,
      attr,
    }
  }

  function initData({ src, name = '' }) {
    let tex = createTexture()
    let height = tex.image.height
    let width = tex.image.width
    let pxAll = width * height

    let i = 0
    /** @type {BufferAttribute} */
    let attrib = src
    let iSize = attrib.itemSize
    tex.userData.itemSize = iSize

    let getRand = () => {
      if (name === 'position') {
        return 0.0 * (Math.random() * 2.0 - 1.0)
      } else {
        return 0
      }
    }

    let max = attrib.array.length / iSize
    for (let px = 0; px < pxAll; px++) {
      //
      if (iSize >= 1) {
        tex.image.data[i * 4 + 0] = attrib.getX(i) || 0
      } else {
        tex.image.data[i * 4 + 0] = 0
      }
      if (iSize >= 2) {
        tex.image.data[i * 4 + 1] = attrib.getY(i) || 0
      } else {
        tex.image.data[i * 4 + 1] = 0
      }
      if (iSize >= 3) {
        tex.image.data[i * 4 + 2] = attrib.getZ(i) || 0
      } else {
        tex.image.data[i * 4 + 2] = 0
      }
      if (iSize >= 4) {
        tex.image.data[i * 4 + 3] = attrib.getW(i) || 0
      } else {
        tex.image.data[i * 4 + 3] = 0
      }

      if (i > max) {
        let r = Math.floor(i % max)
        if (iSize >= 1) {
          tex.image.data[i * 4 + 0] = (attrib.getX(r) || 0) + getRand()
        }
        if (iSize >= 2) {
          tex.image.data[i * 4 + 1] = (attrib.getY(r) || 0) + getRand()
        }
        if (iSize >= 3) {
          tex.image.data[i * 4 + 2] = (attrib.getZ(r) || 0) + getRand()
        }
        if (iSize >= 4) {
          tex.image.data[i * 4 + 3] = 0
        }
      }

      i++
    }

    tex.needsUpdate = true
    return tex
  }

  {
    const CODE_GLSL = /* glsl */ `

    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 data_o_normal = texture2D( o_normal, uv );
    vec4 data_o_position = texture2D( o_position, uv );
    // vec4 data_o_coords = texture2D( o_coords, uv );

    vec4 data_sim_position = texture2D( iv_position, uv );
    vec4 data_sim_velocity = texture2D( iv_velocity, uv );

    vec4 skinIndex = texture2D( o_skinIndex, uv );
    vec4 skinWeight = texture2D( o_skinWeight, uv );

    vec3 transformed = data_o_position.xyz;
    // vec3 objectNormal =  vec3(0.0);
    // vec3 objectTangent =  data_o_normal.xyz;

    mat4 boneMatX = getBoneMatrix( skinIndex.x );
    mat4 boneMatY = getBoneMatrix( skinIndex.y );
    mat4 boneMatZ = getBoneMatrix( skinIndex.z );
    mat4 boneMatW = getBoneMatrix( skinIndex.w );

    vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
    vec4 skinned = vec4( 0.0 );
    skinned += boneMatX * skinVertex * skinWeight.x;
    skinned += boneMatY * skinVertex * skinWeight.y;
    skinned += boneMatZ * skinVertex * skinWeight.z;
    skinned += boneMatW * skinVertex * skinWeight.w;
    transformed = ( bindMatrixInverse * skinned ).xyz;

    transformed = vec3(o3dMatrix * vec4(transformed.rgb, 1.0));
    transformed = vec3(parentMatrix * vec4(transformed.rgb, 1.0));
  `
  }

  // console.log(nonIndexed.attributes.position);
  // console.log(nonIndexed.attributes.uv);
  // console.log(nonIndexed.attributes.skinIndex);
  // console.log(nonIndexed.attributes.skinWeight);

  let out = {
    o_layout: accessCoord(),
    o_position: initData({
      src: nonIndexed.attributes.position,
      name: 'position',
    }),
    o_normal: initData({ src: nonIndexed.attributes.normal }),
    o_uv: initData({ src: nonIndexed.attributes.uv }),
    o_skinIndex: initData({
      src: nonIndexed.attributes.skinIndex,
    }),
    o_skinWeight: initData({
      src: nonIndexed.attributes.skinWeight,
    }),

    skinnedMesh: it,
  }
  return out
}
