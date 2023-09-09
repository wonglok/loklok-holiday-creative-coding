/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef } from 'react'

export function Paste({ blob, onClose }) {
  let url = URL.createObjectURL(blob)
  useEffect(() => {}, [])

  let submitPics = async ({ title }) => {
    let fd = new FormData()
    fd.append('file', blob)
    fd.append('title', title)
    fd.append('origin', window.location.origin)
    fd.append('pathname', window.location.pathname)

    fetch(`http://localhost:2329/file`, {
      headers: {
        filename: 'screencapture.png',
      },
      mode: 'cors',
      method: 'POST',
      body: fd,
    })
      .then((r) => {
        return r.ok && r.json()
      })
      .then((r) => {
        console.log(r)
        onClose()
      })
  }

  let ref = useRef()
  return (
    <>
      <div
        className=' absolute  flex flex-col bg-gray-100 '
        style={{ left: `calc(50% - 200px)`, top: `calc(50% - 200px)`, width: `400px`, height: `450px` }}
      >
        <div className='flex h-full w-full' style={{ height: `50px`, width: `100%` }}>
          <input
            defaultValue={''}
            ref={ref}
            type='text'
            className='h-full w-full bg-blue-200 p-2'
            placeholder='Title:'
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                submitPics({ title: ref.current.value || 'untitled' })
              }
            }}
          ></input>
          <button
            className='bg-blue-300 p-2 text-xs'
            onClick={() => {
              submitPics({ title: ref.current.value || 'untitled' })
            }}
          >
            Submit
          </button>
        </div>
        <div className=' flex items-center justify-center ' style={{ height: `400px` }}>
          <img src={url} alt={'pasted image'} className='h-full object-cover p-2' />
        </div>
      </div>
    </>
  )
}
