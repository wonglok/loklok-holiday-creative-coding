import { useXR } from '@react-three/xr'

export function XRAdapter() {
  let session = useXR((r) => r.session)

  return (
    <>
      {/*  */}
      {session && <>{/*  */}</>}
    </>
  )
}
