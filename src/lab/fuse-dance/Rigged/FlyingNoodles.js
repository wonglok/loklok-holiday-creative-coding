import { Object3D } from 'three'
import { NoodleLines } from './NoodleCompos/NoodleLines'
// import { NoodleGeo } from './NoodleCompos/NoodleGeo'
// import { NoodleMat } from './NoodleCompos/NoodleMat'

export class FlyingNoodles extends Object3D {
  constructor({ parent }) {
    super()
    this.onLoop = (v) => {
      parent.onLoop(v)
    }

    this.parent = parent

    this.setupPromise = this.setup()
    //
  }
  async setup() {
    //
    let obj = new NoodleLines({
      parent: this.parent,
      onLoop: (v) => {
        this.parent.onLoop(v)
      },
    })
    //
    this.add(obj)
  }
}
