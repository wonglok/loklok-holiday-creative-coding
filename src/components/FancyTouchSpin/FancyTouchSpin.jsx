import { Box, OrbitControls, PerspectiveCamera, Stats } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Sky } from './Sky/Sky'
import { Bloom, EffectComposer, SSR, Vignette } from '@react-three/postprocessing'
import { Color, SRGBColorSpace, sRGBEncoding } from 'three'
import { Core } from './Rain/Core'
import { Rain } from './Rain/Rain'

export function FancyTouchSpin() {
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
      <PerspectiveCamera makeDefault fov={75} near={30} far={3000} position={[0, 0, 1200.1]}></PerspectiveCamera>
      <OrbitControls maxDistance={1500} makeDefault></OrbitControls>

      <EffectComposer disableNormalPass multisampling={0}>
        <Bloom luminanceThreshold={0.5} intensity={1} mipmapBlur={true}></Bloom>
        {/* <Vignette></Vignette> */}
      </EffectComposer>
      <Sky></Sky>
      <Rain></Rain>
      <Stats></Stats>
    </>
  )
}
