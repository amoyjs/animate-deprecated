import * as PIXI from 'pixi.js'
import { AnimateOptions } from '../types'
// @ts-ignore
import * as gsap from 'gsap'
// @ts-ignore
import PixiPlugin from 'gsap/PixiPlugin'

PixiPlugin.registerPIXI(PIXI)

function animation(target: any, options: any) {
    const {
        to = {},
        from = {},
        ease,
        delay = 0,
        duration = 1000,
        repeat = 0,
        onStart = () => {},
        onUpdate = () => {},
        onComplete = () => {},
        onReverseComplete = () => {},
        ...rest
    } = options
    let count = 1
    const action = Object.keys(to).length > 0 ? 'to' : (Object.keys(from).length > 0 ? 'from' : 'to')
    const props = action === 'to' ? to : from
    const animate = gsap.TweenLite[action](target, duration / 1000, {
        ease: getEase(ease),
        pixi: {
            ...rest,
            ...props,
        },
        onStart() {
            onStart(animate)
        },
        onComplete() {
            onComplete(animate)
            if (repeat === 'infinite' || count < repeat) {
                count++
            }
        },
        onUpdate() {
            const progress = (animate.progress() * 100).toFixed(2)
            onUpdate(progress, animate)
        },
        onReverseComplete() {
            if (repeat === 'infinite' || count < repeat) {
                animate.restart()
                count++
            }
            onReverseComplete(animate)
        },
    })

    return animate
}

/**
 * animate
 * 
 * @module Animation
 * 
 * @param target - Animation target
 * @param { AnimateOptions } options - Animation options
 */
export function animate(target: any, options: AnimateOptions) {
    return animation(target, options)
}

function getEase(ease?: string) {
    if (['ease-in', 'ease-out', 'ease-in-out'].includes(ease)) {
        return gsap.Power4[camelize(ease)]
    } else {
        return gsap.Power4.easeNone
    }
}

function camelize(string: string) {
    return string.replace(/[_.-](\w|$)/g, (_, $) => $.toUpperCase())
}