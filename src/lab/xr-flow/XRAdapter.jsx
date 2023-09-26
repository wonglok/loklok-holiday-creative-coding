import { useXR } from '@react-three/xr'

export function XRAdapter({ before, after }) {
  let session = useXR((r) => r.session)

  return (
    <>
      {/*  */}
      {session && (
        <>
          {after}
          {/*  */}
        </>
      )}

      {!session && (
        <>
          {before}
          {/*  */}
        </>
      )}
    </>
  )
}
