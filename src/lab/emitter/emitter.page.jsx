import { Canvas } from '@react-three/fiber'
import { SimulationEmitter } from './SimulationEmitter'

export function Emitter() {
  return (
    <Canvas>
      <SimulationEmitter></SimulationEmitter>
    </Canvas>
  )
}
