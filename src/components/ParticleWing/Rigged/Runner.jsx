import {
  AnimationMixer,
  BufferGeometry,
  Clock,
  Color,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Points,
  ShaderMaterial,
  Vector2,
} from 'three'
import { getSkinData } from './Rigged'
import { GPUComputationRenderer } from 'three-stdlib'
export class Runner extends Object3D {
  constructor({ glb, gl }) {
    super()
    this.ww = 512
    this.hh = 512
    let firstSkinnedMesh = glb.scene.getObjectByProperty('type', 'SkinnedMesh')
    this.skinData = getSkinData({ ww: this.ww, hh: this.hh, skinnedMesh: firstSkinnedMesh })

    glb.scene.traverse((it) => {
      it.frustumCulled = false
      if (it.geometry) {
        it.material.transparent = true
        it.material.opacity = 0
      }
    })
    this.add(glb.scene)

    //
    this.tasks = []
    this.work = (st, dt) => {
      this.tasks.forEach((it) => {
        it(st, dt)
      })
    }

    this.onLoop = (fn) => {
      this.tasks.push(fn)
    }

    this.gpu = new GPUComputationRenderer(this.ww, this.hh, gl)
    this.pos0 = this.gpu.createTexture()
    this.move0 = this.gpu.createTexture()
    {
      let array = this.pos0.image.data

      let ii = 0
      for (let y = 0; y < this.hh; y++) {
        for (let x = 0; x < this.ww; x++) {
          array[ii + 0] = 0.0
          array[ii + 1] = 0.0
          array[ii + 2] = 0.0
          array[ii + 3] = 1.0
          ii += 4.0
        }
      }
      this.pos0.needsUpdate = true
    }

    {
      let array = this.move0.image.data

      let ii = 0
      for (let y = 0; y < this.hh; y++) {
        for (let x = 0; x < this.ww; x++) {
          array[ii + 0] = 0.0
          array[ii + 1] = 0.0
          array[ii + 2] = 0.0
          array[ii + 3] = 1.0
          ii += 4.0
        }
      }
      this.move0.needsUpdate = true
    }

    this.posVar = this.gpu.addVariable('texturePosition', this.fragmentShaderPos(), this.pos0)
    this.moveVar = this.gpu.addVariable('textureMove', this.fragmentShaderMove(), this.move0)

    let clock = new Clock()
    let sync = (targetVar) => {
      /** @type {SkinnedMesh} */
      let sMesh = this.skinData.skinnedMesh

      // sMesh.skeleton.calculateInverses()
      // sMesh.skeleton.computeBoneTexture()
      // sMesh.skeleton.update()

      targetVar.material.uniforms.u_resolution = { value: new Vector2().fromArray([this.ww, this.hh]) }
      targetVar.material.uniforms.time = { value: clock.getElapsedTime() }
      targetVar.material.uniforms.delta = { value: clock.getDelta() }

      targetVar.material.uniforms.o_layout = { value: this.skinData.o_layout }
      targetVar.material.uniforms.o_position = { value: this.skinData.o_position }
      // targetVar.material.uniforms.o_normal = { value: this.skinData.o_normal }
      // targetVar.material.uniforms.o_uv = { value: this.skinData.o_uv }

      targetVar.material.uniforms.o_skinIndex = { value: this.skinData.o_skinIndex }
      targetVar.material.uniforms.o_skinWeight = { value: this.skinData.o_skinWeight }
      targetVar.material.uniforms.o_o3dMatrix = { value: sMesh.matrix }

      if (sMesh.parent) {
        targetVar.material.uniforms.o_parentMatrix = { value: sMesh.parent.matrix }
      }

      targetVar.material.uniforms.o_bindMatrix = { value: sMesh.bindMatrix }
      targetVar.material.uniforms.o_bindMatrixInverse = { value: sMesh.bindMatrixInverse }
      targetVar.material.uniforms.o_boneTexture = { value: sMesh.skeleton.boneTexture }
      targetVar.material.uniforms.o_boneTextureSize = { value: sMesh.skeleton.boneTextureSize }
    }
    sync(this.moveVar)
    sync(this.posVar)
    this.onLoop(() => {
      sync(this.moveVar)
      sync(this.posVar)
    })

    this.gpu.setVariableDependencies(this.posVar, [this.posVar])
    this.gpu.setVariableDependencies(this.moveVar, [this.moveVar, this.posVar])

    let err = this.gpu.init()
    if (err) {
      console.error(err)
      throw new Error(err)
    }

    this.onLoop(() => {
      this.gpu.compute()
    })

    this.add(
      new Display({
        parent: this,
        getMotionTexture: () => {
          return this.gpu.getCurrentRenderTarget(this.posVar).texture
        },
        getColor: () => {
          return new Color('#ffff00')
        },
      }),
    )

    this.add(
      new Display({
        parent: this,
        getMotionTexture: () => {
          return this.gpu.getCurrentRenderTarget(this.moveVar).texture
        },
        getColor: () => {
          return new Color('#ff5600')
        },
      }),
    )

    this.mixer = new AnimationMixer(glb.scene)
    this.onLoop((st, dt) => {
      this.mixer.update(dt)
    })

    this.mixer.clipAction(glb.animations[0]).reset().play()
  }
  fragmentShaderPos() {
    return require('./shader/compute.pos.fragment.glsl').default
  }
  fragmentShaderMove() {
    return require('./shader/compute.move.fragment.glsl').default
  }
}

class Display extends Object3D {
  constructor({ parent, getMotionTexture = () => null, getColor = () => new Color('#ff0000') }) {
    super()
    /** @type {Runner} */
    this.parent = parent
    this.onLoop = (v) => {
      parent.onLoop(v)
    }

    let geometry = new BufferGeometry()
    geometry.setAttribute('position', this.parent.skinData.o_layout.attr)
    geometry.setAttribute('uv', this.parent.skinData.o_layout.attr)

    let shader = new MeshBasicMaterial({
      color: getColor(),
    })
    shader.onBeforeCompile = (shader) => {
      shader.uniforms.dt = { value: 0 }
      shader.uniforms.time = { value: 0 }
      shader.uniforms.u_pos = { value: null }
      let clock = new Clock()
      this.onLoop(() => {
        shader.uniforms.dt = { value: clock.getDelta() }
        shader.uniforms.time = { value: clock.getElapsedTime() }
        shader.uniforms.u_pos.value = getMotionTexture()
      })

      shader.vertexShader = shader.vertexShader.replace(
        `void main() {`,
        `
        uniform sampler2D u_pos;
        void main() {`,
      )

      shader.vertexShader = shader.vertexShader.replace(
        `#include <beginnormal_vertex>`,
        `
        vec3 objectNormal = vec3( normal );
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3( tangent.xyz );
        #endif
      `,
      )

      shader.vertexShader = shader.vertexShader.replace(
        `#include <begin_vertex>`,
        `
        vec2 myUV = uv.xy;
        vec4 tPosData = texture2D( u_pos, uv.xy );
        vec3 transformed = vec3( tPosData.rgb );

        #ifdef USE_ALPHAHASH
          vPosition = vec3( tPosData.rgb );
        #endif
      `,
      )

      shader.vertexShader = shader.vertexShader.replace(
        `}`,
        `
          gl_PointSize = 1.0;
        }`,
      )
    }

    this.pts = new Points(geometry, shader)
    this.pts.frustumCulled = false
    this.add(this.pts)
  }
}
