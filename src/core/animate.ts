import * as PIXI from 'pixi.js'
// @ts-ignore
import { TweenLite } from 'gsap'
// @ts-ignore
import PixiPlugin from 'gsap/PixiPlugin'

PixiPlugin.registerPIXI(PIXI)

function animation(target: any, options: any) {
    const {
        ease,
        delay = 0,
        duration = 1000,
        repeat = 0,
        onStart = () => { },
        onUpdate = () => { },
        onComplete = () => { },
        onReverseComplete = () => { },
        ...rest
    } = options
    let count = 1
    const animate = TweenLite.to(target, duration / 1000, {
        pixi: {
            ...rest,
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
}



export function animate(target: any, options: any) {
    animation(target, options)
}