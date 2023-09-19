/* eslint-disable @next/next/no-img-element */
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home({}) {
  let [files, setFiles] = useState([])
  useEffect(() => {
    let files = getFiles()
    setFiles(files)
  }, [])
  return (
    <>
      <div className='mt-2 px-2 text-2xl font-bold text-purple-500'>Hallelujah to JESUS!</div>
      <div className='px-2 text-xl text-gray-500'>Holiday Creative Coding by LokLok</div>
      <div className='px-2 text-gray-400'>holiday.effectnode.com</div>
      <div className='flex flex-wrap p-2'>
        {files.map((r) => {
          return <EachThumb item={r} key={r.uuid}></EachThumb>
        })}
      </div>
    </>
  )
}

function EachThumb({ item }) {
  return (
    <>
      <div className='m-2 rounded-2xl border border-transparent bg-gray-200 p-2 hover:border-blue-500'>
        <Link href={`${item.pathname}`}>
          <Image
            src={item.thumbURL}
            width={512}
            height={512}
            className='h-72 w-72 rounded-2xl object-cover'
            alt={item.title}
          />
        </Link>
        <div className='text-center'>{item.title}</div>
        <div className='text-center text-sm text-gray-600'>{item.pathname}</div>
      </div>
    </>
  )
}

function getFiles() {
  function requireAll(r) {
    let files = []
    r.keys().forEach((key) => {
      let data = r(key)

      if (!files.some((r) => r.uuid === data.uuid)) {
        files.push(data)
      }
    })

    files = files.slice().sort((a, b) => {
      if (b.ts > a.ts) {
        return 1
      } else if (b.ts < a.ts) {
        return -1
      }
      return 0
    })

    return files
  }

  let files = requireAll(require.context('../../public/discover', true, /meta\.json$/))

  return files
}
