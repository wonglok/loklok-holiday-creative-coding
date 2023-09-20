import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { Clock } from 'three'
import { create } from 'zustand'

export const useCore = () => {
  let useInternalCore = useMemo(() => {
    return create((set, get) => {
      //
      return {
        //
        cleans: [],
        onClean: (v) => {
          //
          get().cleans.push(v)
        },
        clean: () => {
          get().cleans.forEach((eclean) => {
            eclean()
          })
        },
        onInterval: (fnc, freq = 1000) => {
          let timer = setInterval(() => {
            fnc()
          }, freq)
          get().onClean(() => {
            clearInterval(timer)
          })
        },
        works: [],
        onLoop: (v) => {
          //
          get().works.push(v)
        },
        loop: (dt, et) => {
          get().works.forEach((ework) => {
            ework(dt, et)
          })
        },
      }
    })
  })

  useFrame(({ clock }) => {
    let dt = clock.getDelta()
    let et = clock.getElapsedTime()
    useInternalCore.getState().loop(dt, et)
  })

  return {
    useCoreStore: useInternalCore,
    onInterval: useInternalCore.getState().onInterval,
    onClean: useInternalCore.getState().onClean,
    onLoop: useInternalCore.getState().onLoop,
  }
}

//
