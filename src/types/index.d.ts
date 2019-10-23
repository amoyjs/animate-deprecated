
declare namespace ANIMATE {
    interface AnimateOptions {
        // pixi.js
        x?: number
        y?: number
        width?: number
        height?: number
        alpha?: number
        scale?: number
        rotation?: number
        // TweenLite
        duration?: number
        delay?: number
        ease?: 'back' | 'bounce' | 'elastic' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'
        repeat?: number | 'infinite'
        onStart?: () => {}
        onUpdate?: (progress: number) => {}
        onComplete?: () => void
        onReverseComplete?: () => void
    }

    // Animations
    function blink(target: any, duration: number, repeat: number): any
    function shakeInAlarm(target: any): any
    function shakeInHorz(target: any): any
    function shakeInVetc(target: any): any
    function shakeInRotate(target: any): any
    function shakeInHard(target: any): any
    function bomb1(target: any, duration?: number): any
    function freeFall(target: any, duration?: number): any
    function elasticScale(target: any, duration?: number): any //
    function elasticMove(target: any, duration?: number): any
    function spiralRotateIn(target: any, duration?: number): any //
    function wheelRotateIn(target: any, duration?: number): any
    function topShockIn(target: any, duration?: number): any
    function breakIn(target: any, duration?: number): any
    function swashOut(target: any, duration?: number): any
    function foolishIn(target: any, duration?: number): any //
    function hingeOut(target: any, duration?: number): any
    function heartBeat(target: any, duration?: number): any //
    function jelly(target: any, duration?: number): any //
    function swing1(target: any, duration?: number): any
    function swing2(target: any, duration?: number): any
    function swing3(target: any, duration?: number): any
    function swing4(target: any, duration?: number): any
}
declare module '@amoy/animate' {
    export default function animate(target: any, options: ANIMATE.AnimateOptions): void
}
