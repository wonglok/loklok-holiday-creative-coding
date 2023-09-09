import { Paste } from '@/components/Paste/Paste'
import '@/css/global.css'
import Head from 'next/head'
import { useEffect, useState } from 'react'

export default function Page({ Component, pageProps: { session, ...pageProps } }) {
  let [ui, setUI] = useState(null)

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      document.onpaste = async function (pasteEvent) {
        // consider the first item (can be easily extended for multiple items)
        let item = pasteEvent.clipboardData.items[0]

        if (item.type.indexOf('image') === 0) {
          let blob = item.getAsFile()

          setUI(
            <Paste
              blob={blob}
              onClose={() => {
                setUI(null)
              }}
            ></Paste>,
          )
        }
      }
    }
  }, [])

  return (
    <>
      <Head>
        <title>SWAN</title>
      </Head>
      <Component {...pageProps}></Component>
      {ui}
    </>
  )
}
