import { Box, Environment, OrbitControls, PerspectiveCamera, Stats } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Sky } from './Sky/Sky'
import { Bloom, EffectComposer, SSR, Vignette } from '@react-three/postprocessing'
import { Color, SRGBColorSpace, sRGBEncoding } from 'three'
import { Core } from './Rain/Core'
import { Rain } from './Rain/Rain'
import { Suspense } from 'react'

export function FancyTouchEmit() {
  return (
    <div className='h-full w-full'>
      <Canvas
        onCreated={(st) => {
          for (let kn in st) {
            Core.now[kn] = st[kn]
          }
          st.gl.physicallyCorrectLights = true
          st.gl.outputEncoding = sRGBEncoding
          st.gl.outputColorSpace = SRGBColorSpace
        }}
      >
        <color attach={'background'} args={['#000000']}></color>
        <Content></Content>
      </Canvas>
    </div>
  )
}
function Content() {
  return (
    <>
      <PerspectiveCamera makeDefault fov={75} near={0.01} far={3000} position={[0, 0, 150.1]}></PerspectiveCamera>
      <OrbitControls maxDistance={6000} makeDefault></OrbitControls>
      <Environment files={`/hdr/shanghai.hdr`}></Environment>
      <EffectComposer disableNormalPass multisampling={0}>
        <Bloom luminanceThreshold={0.5} intensity={1} mipmapBlur={true}></Bloom>
        {/* <Vignette></Vignette> */}
      </EffectComposer>
      <group position={[0, 0, -800]} scale={1.3}>
        <Sky></Sky>
      </group>

      <Suspense fallback={null}>
        <Rain></Rain>
      </Suspense>
      <Stats></Stats>
    </>
  )
}
