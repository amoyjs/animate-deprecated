export interface AnimateOptions {
    // pixi.js
    x?: number
    y?: number
    width?: number
    height?: number
    alpha?: number
    // TweenLite
    duration?: number
    delay?: number
    ease?: 'back' | 'bounce' | 'elastic' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'
    repeat?: number | 'infinite'
    onStart?: () => {}
    onUpdate?: (progress: number) => {}
    onComplete?: (animation: object) => {}
    onReverseComplete?: (animation: object) => {}
}

export default function animate(target: any, options: AnimateOptions): void

// Animations
export function blink(target: any, duration: number, repeat: number): any
export function shakeInAlarm(target: any): any
export function shakeInHorz(target: any): any
export function shakeInVetc(target: any): any
export function shakeInRotate(target: any): any
export function shakeInHard(target: any): any
export function bomb1(target: any, duration?: number): any
export function freeFall(target: any, duration?: number): any
export function elasticScale(target: any, duration?: number): any //
export function elasticMove(target: any, duration?: number): any
export function spiralRotateIn(target: any, duration?: number): any //
export function wheelRotateIn(target: any, duration?: number): any
export function topShockIn(target: any, duration?: number): any
export function breakIn(target: any, duration?: number): any
export function swashOut(target: any, duration?: number): any
export function foolishIn(target: any, duration?: number): any //
export function hingeOut(target: any, duration?: number): any
export function heartBeat(target: any, duration?: number): any //
export function jelly(target: any, duration?: number): any //
export function swing1(target: any, duration?: number): any
export function swing2(target: any, duration?: number): any
export function swing3(target: any, duration?: number): any
export function swing4(target: any, duration?: number): any