// import { OrbitControls, Stage, useAnimations, useGLTF } from '@react-three/drei'
// import { Canvas } from '@react-three/fiber'
// import { useEffect, useRef, useState } from 'react'
// import copyToClipboard from 'copy-to-clipboard'
// import moment from 'moment'

export function Blender({}) {
  return <>blend</>
}
// export function Blender() {
//   let [files, setFiles] = useState([])
//   let [activeIndex, setIndex] = useState(0)

//   useEffect(() => {
//     setIndex(0)
//   }, [files])

//   useEffect(() => {
//     let newFiles = getFiles()
//     setFiles(newFiles)
//     return () => {}
//   }, [getFiles])

//   let fileURL = files[activeIndex]?.file

//   return (
//     <>
//       <div className='flex h-full w-full'>
//         <div className='' style={{ width: `270px`, height: '100%' }}>
//           <div className='relative m-2 cursor-pointer overflow-x-scroll rounded-lg bg-blue-100 p-2 py-5'>
//             <div className='text-center text-xl font-semibold text-blue-800'>Blender Livelink</div>
//             <div className='text-center text-xs font-light text-blue-500'>Click Boxes Below to Copy URL</div>
//           </div>

//           {files.map((it, idx) => {
//             return (
//               <div
//                 className={
//                   activeIndex === idx
//                     ? `relative m-2 cursor-pointer overflow-x-scroll rounded-lg bg-purple-100 p-2 hover:bg-purple-200`
//                     : `relative m-2 cursor-pointer overflow-x-scroll rounded-lg bg-gray-100 p-2 hover:bg-gray-200`
//                 }
//                 key={it.file}
//                 onClick={() => {
//                   setIndex(idx)
//                   copyToClipboard(files[idx].file)
//                 }}
//               >
//                 <div className='text-xs text-gray-600' style={{ fontSize: '14px' }}>
//                   {it.basename}
//                 </div>
//                 <div className='text-xs text-gray-400' style={{ fontSize: '10px' }}>
//                   {it.date}
//                 </div>
//                 <div className='overflow-x-hidden text-right text-gray-400' style={{ fontSize: '10px' }}>
//                   <LiveRealtiveTime date={it.ts}></LiveRealtiveTime>
//                 </div>
//                 <div className=' absolute right-1 top-1 m-1 h-5 w-5'>
//                   <svg
//                     clipRule='evenodd'
//                     fillRule='evenodd'
//                     strokeLinejoin='round'
//                     strokeMiterlimit='2'
//                     viewBox='0 0 24 24'
//                   >
//                     <path
//                       fill='gray'
//                       d='m6 19v2c0 .621.52 1 1 1h2v-1.5h-1.5v-1.5zm7.5 3h-3.5v-1.5h3.5zm4.5 0h-3.5v-1.5h3.5zm4-3h-1.5v1.5h-1.5v1.5h2c.478 0 1-.379 1-1zm-1.5-1v-3.363h1.5v3.363zm0-4.363v-3.637h1.5v3.637zm-13-3.637v3.637h-1.5v-3.637zm11.5-4v1.5h1.5v1.5h1.5v-2c0-.478-.379-1-1-1zm-10 0h-2c-.62 0-1 .519-1 1v2h1.5v-1.5h1.5zm4.5 1.5h-3.5v-1.5h3.5zm3-1.5v-2.5h-13v13h2.5v-1.863h1.5v3.363h-4.5c-.48 0-1-.379-1-1v-14c0-.481.38-1 1-1h14c.621 0 1 .522 1 1v4.5h-3.5v-1.5z'
//                       fillRule='nonzero'
//                     />
//                   </svg>
//                 </div>
//               </div>
//             )
//           })}
//         </div>

//         <div style={{ width: `calc(100% - 270px)`, height: `100%` }}>
//           {fileURL && (
//             <>
//               <Canvas shadows='variance'>
//                 <Stage
//                   environment={{ files: `/hdr/shanghai.hdr` }}
//                   key={`stage${fileURL}?v=${performance.now()}`}
//                   adjustCamera={1.5}
//                   shadows='contact'
//                 >
//                   <GLB key={`glb${fileURL}?v=${performance.now()}`} src={`${fileURL}?v=${performance.now()}`}></GLB>
//                 </Stage>
//                 <OrbitControls
//                   key={`cam${fileURL}?v=${performance.now()}`}
//                   object-position={[0, 4, 8]}
//                   makeDefault
//                 ></OrbitControls>
//               </Canvas>
//             </>
//           )}
//         </div>
//       </div>
//     </>
//   )
// }

// export default Blender

// function GLB({ src }) {
//   let glb = useGLTF(`${src}`)
//   const { ref, mixer, names, actions, clips } = useAnimations(glb.animations)
//   useEffect(() => {
//     ;(names || []).forEach((name) => {
//       if (name) {
//         actions[name].reset()
//         actions[name].play()
//       }
//     })
//   }, [actions, names])

//   glb.scene.traverse((it) => {
//     it.castShadow = true
//     it.receiveShadow = true
//   })

//   return (
//     <group ref={ref}>
//       <primitive object={glb.scene}></primitive>
//     </group>
//   )
// }

// function LiveRealtiveTime({ date }) {
//   let ref = useRef()
//   useEffect(() => {
//     let ttt = setInterval(() => {
//       let dateStr = moment(new Date(Number(date))).fromNow()
//       if (ref.current) {
//         ref.current.innerText = dateStr
//       }
//     }, 100)

//     return () => {
//       clearInterval(ttt)
//     }
//   }, [])

//   return <span ref={ref}></span>
// }

// function basename(path) {
//   return path.replace(/\\/g, '/').replace(/.*\//, '')
// }

// function getFiles() {
//   function requireAll(r) {
//     let files = []
//     r.keys().forEach((key) => {
//       // r(key);
//       // console.log(key);

//       if (key.includes('public')) {
//         let item = {}
//         item.basename = basename(key)
//         item.file = key.replace('public/', '/')

//         let segs = item.file.split('/')

//         item.date = segs[2]

//         // let name = item.basename.split('.')
//         // let ext = name.pop().toUpperCase()
//         // let date = name.pop()

//         if (segs[3].includes('__TS__')) {
//           let [name, ts] = segs[3].split('__TS__')
//           item.name = name // name.join('.')
//           item.ts = ts // Number(date || performance.now())
//           files.push(item)
//         }
//       }
//     })

//     // console.log(files)

//     files = files.sort((a, b) => {
//       if (b.ts > a.ts) {
//         return 1
//       } else if (b.ts < a.ts) {
//         return -1
//       }
//       return 0
//     })

//     return files
//   }

//   let files = requireAll(require.context('file-loader!../../public/blender-livelink-dropzone', true, /\.glb$/))

//   return files
// }
