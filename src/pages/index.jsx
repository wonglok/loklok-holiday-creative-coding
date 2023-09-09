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
      <div className='mt-2 px-2 text-2xl'>Hallelujah to JESUS!</div>
      <div className='px-2  text-gray-500'>Holiday Creative Coding by LokLok</div>
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
      <div className=''>
        <Link href={`${item.pathname}`}>
          <img src={item.thumbURL} className='h-72 w-72 object-cover' alt={item.title} />
        </Link>
        <div className='text-center'>{item.title}</div>
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
      if (b.createdAt > a.createdAt) {
        return 1
      } else if (b.createdAt < a.createdAt) {
        return -1
      }
      return 0
    })

    return files
  }

  let files = requireAll(require.context('../../public/discover', true, /meta\.json$/))

  return files
}
