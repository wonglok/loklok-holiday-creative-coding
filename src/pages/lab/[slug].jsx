import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { basename } from 'path'

export default function PageSlug() {
  //

  let slug = useRouter()?.query?.slug || '_______'

  let [compos, setCompos] = useState(null)

  let pages = useMemo(() => {
    //
    const pages = []

    function importAll(r) {
      // r.keys().forEach((key) => (cache[key] = r(key)))

      r.keys()
        .filter((r) => r.includes('/lab/'))
        .forEach((route) => {
          //

          pages.push({
            file: route,
            component: () => {
              return r(route).then((r) => {
                if (r.Page) {
                  return <r.Page></r.Page>
                } else {
                  let Page = Object.values(r)[0]
                  return <Page></Page>
                }
              })
            },
          })
        })
    }

    importAll(require.context('../../lab', true, /\.page\.jsx$/, 'lazy'))

    return pages
  }, [])

  useEffect(() => {
    let compareSlug = slug.toLowerCase()

    let result = pages.find((r) => {
      let compareFName = basename(r.file).toLowerCase().replace('.page.jsx', '')

      if (compareFName === compareSlug) {
        return true
      }

      return compareFName.includes(compareSlug)
    })

    if (result) {
      result.component().then((r) => {
        setCompos(r)
      })
    }
  }, [slug, pages])

  return <>{compos}</>
}
