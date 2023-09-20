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

  useEffect(() => {
    let clock = new Clock()
    let rAFID = 0
    let rAF = () => {
      let dt = clock.getDelta()
      let et = clock.getElapsedTime()
      rAFID = requestAnimationFrame(rAF)
      //
      useInternalCore.getState().loop(dt, et)
    }
    rAFID = requestAnimationFrame(rAF)
    return () => {
      useInternalCore.getState().clean()
      cancelAnimationFrame(rAFID)
    }
  }, [])

  return {
    useCoreStore: useInternalCore,
    onInterval: useInternalCore.getState().onInterval,
    onClean: useInternalCore.getState().onClean,
    onLoop: useInternalCore.getState().onLoop,
  }
}

//
