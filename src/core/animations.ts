// @ts-ignore
import { TimelineLite, Linear, Power0, Bounce, Elastic } from 'gsap'
import CustomEase from './customEase'
import { animate } from './animate'

const tl = new TimelineLite()

/**
 * moveTo
 * 
 * @module Animation
 * 
 * @param { Object } target - target
 * @param { Number } x - coordinate x
 * @param { Number } y - coordinate y
 * @param { Number } duration - animation duration
 * @param { String } ease - animation timing function
 */
export function moveTo(target: any, x: any, y: any, duration: number, ease: any) {
    const position = {
        x: 0,
        y: 0,
    }
    if (typeof x === 'number' && typeof y === 'number') {
        position.x = x
        position.y = y
    }
    if (typeof x === 'object') {
        position.x = x.x
        position.y = x.y
        duration = y
        ease = duration
    }

    return animate(target, {
        x: position.x,
        y: position.y,
        ease,
        duration,
    })
}

export function moveBy(target: any, x: any, y: any, duration: number, ease: any) {
    const position = {
        x: 0,
        y: 0,
    }
    if (typeof x === 'number' && typeof y === 'number') {
        position.x = x
        position.y = y
    }
    if (typeof x === 'object') {
        position.x = x.x
        position.y = x.y
        duration = y
        ease = duration
    }

    return animate(target, {
        x: target.x + position.x,
        y: target.y + position.y,
        ease,
        duration,
    })
}

/**
 * blink
 * 
 * @module Animation
 * 
 * @param { Object } target - target
 * @param { Number } duration - animation duration
 * @param { Boolean } repeat - animation repeat times
 */
export function blink(target: any, duration: number, repeat: number) {
    let totalRepeat = 0
    repeatBlink()
    return tl

    function repeatBlink() {
        if (totalRepeat < repeat) {
            duration = duration / 1000 / repeat / 2
            tl.to(target, duration, {
                alpha: 0,
                onComplete: () => {
                    tl.to(target, duration / 1000 / repeat / 2, {
                        alpha: 1,
                        onComplete: repeatBlink,
                    })
                    totalRepeat++
                }
            })
        }
    }
}

/**
 * shakeInAlarm
 * 
 * @module Animation
 * 
 * @param { Object } target - target
 * 
 * @description - ['shakeInHorz', 'shakeInVetc', 'shakeInRotate', 'shakeInHard'] also except a param `target`
 */
export function shakeInAlarm(target: any) {
    const animations = [{
        duration: 0.01,
        vars: {
            pixi: {
                rotation: 5,
                x: '+=10',
            },
            ease: Linear.easeNone,
        },
    }, {
        duration: 0.01,
        vars: {
            pixi: {
                rotation: -5,
                x: '-=20',
            },
            ease: Linear.easeNone,
        },
    }]
    animations.map((animation) => tl.to(target, animation.duration, animation.vars))
    tl.eventCallback('onComplete', () => { tl.reverse() })
    tl.eventCallback('onReverseComplete', () => { tl.restart() })
}

export function shakeInHorz(target: any) {
    const animations = [{
        duration: 0.01,
        vars: {
            pixi: {
                x: '+=10',
            },
            ease: Linear.easeNone,
        },
    }, {
        duration: 0.01,
        vars: {
            pixi: {
                x: '-=20',
            },
            ease: Linear.easeNone,
        },
    }]
    animations.map((animation) => tl.to(target, animation.duration, animation.vars))
    tl.eventCallback('onComplete', () => { tl.reverse() })
    tl.eventCallback('onReverseComplete', () => { tl.restart() })
}

export function shakeInVetc(target: any) {
    const animations = [{
        target: target,
        duration: 0.01,
        vars: {
            pixi: {
                y: '+=10',
            },
            ease: Linear.easeNone,
        },
    }, {
        target: target,
        duration: 0.01,
        vars: {
            pixi: {
                y: '-=20',
            },
            ease: Linear.easeNone,
        },
    }]
    animations.map((animation) => tl.to(target, animation.duration, animation.vars))
    tl.eventCallback('onComplete', () => { tl.reverse() })
    tl.eventCallback('onReverseComplete', () => { tl.restart() })
}

export function cute(target: any) {
    // 
}

export function float(target: any) {
    const tl = animate(target, {
        duration: 3000,
        y: target.y + 30,
        ease: 'ease-in-out',
    })
    tl.eventCallback('onComplete', () => tl.reverse())
    tl.eventCallback('onReverseComplete', () => tl.restart())
}

export function shakeInRotate(target: any) {
    const animations = [
        {
            target: target,
            duration: 0.01,
            vars: {
                pixi: {
                    rotation: 10,
                },
                ease: Linear.easeNone,
            },
        },
        {
            target: target,
            duration: 0.01,
            vars: {
                pixi: {
                    rotation: -10,
                },
                ease: Linear.easeNone,
            },
        },
    ]
    animations.map((animation) => tl.to(target, animation.duration, animation.vars))
    tl.eventCallback('onComplete', () => { tl.reverse() })
    tl.eventCallback('onReverseComplete', () => { tl.restart() })
}

export function shakeInHard(target: any) {
    const aniArray = [
        {
            x: '-=7',
            y: '+=5',
            rotation: 1.5 * Math.PI / 180,
            ease: Linear.easeIn,
        }, {
            x: '+=5',
            y: '-=5',
            rotation: 1.5 * Math.PI / 180,
            ease: Linear.easeIn,
        }, {
            x: '-=2',
            y: '+=8',
            rotation: 1.5 * Math.PI / 180,
            ease: Linear.easeIn,
        }, {
            x: '-=7',
            y: '+=1',
            rotation: -(2.5 * Math.PI / 180),
            ease: Linear.easeIn,
        }, {
            x: '-=2',
            y: '+=8',
            rotation: 3.5 * Math.PI / 180,
            ease: Linear.easeIn,
        }, {
            x: '-=3',
            y: '-=8',
            rotation: -(1.5 * Math.PI / 180),
            ease: Linear.easeIn,
        }, {
            x: '-=8',
            y: '-=7',
            rotation: 2.5 * Math.PI / 180,
            ease: Linear.easeIn,
        }, {
            x: '+=0',
            y: '+=1',
            rotation: 0.5 * Math.PI / 180,
            ease: Linear.easeIn,
        }, {
            x: '-=2',
            y: '-=1',
            rotation: -(1.5 * Math.PI / 180),
            ease: Linear.easeIn,
        }, {
            x: '+=7',
            y: '+=0',
            rotation: -(2.5 * Math.PI / 180),
            ease: Linear.easeIn,
        }, {
            x: '+=8',
            y: '-=6',
            rotation: -(1.5 * Math.PI / 180),
            ease: Linear.easeIn,
        }, {
            x: '+=1',
            y: '-=4',
            rotation: -(0.5 * Math.PI / 180),
            ease: Linear.easeIn,
        }, {
            x: '-=2',
            y: '+=9',
            rotation: 3.5 * Math.PI / 180,
            ease: Linear.easeIn,
        }, {
            x: '+=1',
            y: '-=5',
            rotation: -(1.5 * Math.PI / 180),
            ease: Linear.easeIn,
        }, {
            x: '-=2',
            y: '+=7',
            rotation: 0.5 * Math.PI / 180,
            ease: Linear.easeIn,
        },
    ]
    aniArray.map((animation) => {
        tl.to(target, 0.02, animation)
    })

    tl.eventCallback('onComplete', () => { tl.reverse() })
    tl.eventCallback('onReverseComplete', () => { tl.restart() })
}

/**
 * bomb1
 *
 * @module Animation
 * 
 * @param { Object } target - target
 * @param { Number } duration - animation duration
 *
 * @description - ['freeFall', 'elasticScale', 'elasticMove',
 * 'spiralRotateIn', 'wheelRotateIn', 'topShockIn', 'breakIn',
 * 'swashOut', 'foolishIn', 'hingeOut', 'heartBeat', 'jelly',
 * 'swing1', 'swing2', 'swing3', 'swing4']
 * also except params `target`, `duration`
 */
export function bomb1(target: any, duration: number = 1000) {
    if (typeof duration !== 'number') {
        throw new Error('animation time must be a number!')
    }
    duration = duration / 1000
    const animations = [
        {
            target: target,
            duration: 1 * duration,
            vars: {
                pixi: {
                    scale: 2 * this.ratio,
                    blur: 20,
                    alpha: 0,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1'),
            },
        },
    ]
    animations.map((animation) => tl.to(target, animation.duration, animation.vars))
    tl.eventCallback('onComplete', () => {
        tl.reverse()
    })
}

export function freeFall(target: any, duration: number = 1000) {
    if (typeof duration !== 'number') {
        throw new Error('animation time must be a number!')
    }
    duration = duration / 1000
    const animations = [
        {
            target: target,
            duration: 0.01,
            vars: {
                pixi: {
                    y: '-= 300',
                },
            },
        },
        {
            target: target,
            duration: 1 * duration,
            vars: {
                pixi: {
                    y: '+= 300',
                },
                ease: Bounce.easeOut,
            },
        },
    ]
    animations.map((animation) => tl.to(target, animation.duration, animation.vars))
}

export function elasticScale(target: any, duration: number = 1000) {
    if (typeof duration !== 'number') {
        throw new Error('animation time must be a number!')
    }
    duration = duration / 1000
    const animations = [
        {
            target: target,
            duration: 0.01 * duration,
            vars: {
                pixi: {
                    scale: 0,
                },
                ease: Power0.easeNone,
            },
        },
        {
            target: target,
            duration: 0.25 * duration,
            vars: {
                pixi: {
                    scale: 1 * this.ratio,
                },
                ease: Power0.easeNone,
            },
        },
        {
            target: target,
            duration: 0.15 * duration,
            vars: {
                pixi: {
                    scale: 0.9 * this.ratio,
                },
                ease: Power0.easeNone,
            },
        },
        {
            target: target,
            duration: 0.15 * duration,
            vars: {
                pixi: {
                    scale: 1 * this.ratio,
                },
                ease: Power0.easeNone,
            },
        },
        {
            target: target,
            duration: 0.15 * duration,
            vars: {
                pixi: {
                    scale: 0.9 * this.ratio,
                },
                ease: Power0.easeNone,
            },
        },
        {
            target: target,
            duration: 0.3 * duration,
            vars: {
                pixi: {
                    scale: 1 * this.ratio,
                },
                ease: Power0.easeNone,
            },
        },
    ]
    animations.map((animation) => tl.to(target, animation.duration, animation.vars))
}

export function elasticMove(target: any, duration: number = 1000) {
    if (typeof duration !== 'number') {
        throw new Error('animation time must be a number!')
    }
    duration = duration / 1000
    const animations = [
        {
            target: target,
            duration: 0.01 * duration,
            vars: {
                pixi: {
                    y: '-= 300',
                },
            },
        },
        {
            target: target,
            duration: 1 * duration,
            vars: {
                pixi: {
                    y: '+= 300',
                },
                ease: Elastic.easeOut.config(0.4, 0.3),
            },
        },
    ]
    animations.map((animation) => tl.to(target, animation.duration, animation.vars))
}

export function spiralRotateIn(target: any, duration: number = 1000) {
    if (typeof duration !== 'number') {
        throw new Error('animation time must be a number!')
    }
    duration = duration / 1000
    const animations = [
        {
            target: target,
            duration: 0.01,
            vars: {
                pixi: {
                    alpha: 0,
                    anchorX: 0,
                    anchorY: 1,
                    scale: 0,
                    rotation: 360,
                    y: '+=' + ((target.height)),
                },
                ease: Linear.easeNone,
            },
        },
        {
            target: target,
            duration: 0.3 * duration,
            vars: {
                pixi: {
                    alpha: 0,
                    // anchorX: 0,
                    // anchorY: 1,
                    rotation: 360,
                    // rotate:  360,
                    //  y: '+=' + ((sprite.height)),
                },
                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.7 * duration,
            vars: {
                pixi: {
                    alpha: 1,
                    anchorX: 1,
                    anchorY: 1,
                    scale: 1,
                    rotation: 0,
                    y: '-=' + ((target.height) / 2),
                    x: '+=' + ((target.width) / 2),
                },
                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1'),
            },
        },
    ]
    animations.map((animation) => tl.to(target, animation.duration, animation.vars))
    tl.eventCallback('onComplete', () => {
        target.anchor.set(0.5, 0.5)
        target.x -= target.width / 2
        target.y -= target.height / 2
        tl.eventCallback('onComplete', () => { })
    })
}

export function wheelRotateIn(target: any, duration: number = 1000) {
    if (typeof duration !== 'number') {
        throw new Error('animation time must be a number!')
    }
    duration = duration / 1000
    const animations = [
        {
            target: target,
            duration: 0.01,
            vars: {
                pixi: {
                    alpha: 0,
                    rotation: 360,
                    x: '+=200',
                },
                ease: Power0.easeNone,
            },
        },
        {
            target: target,
            duration: 0.5 * duration,
            vars: {
                pixi: {
                    alpha: 1,
                    rotation: -20,
                    x: '-=220',
                },
                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.5 * duration,
            vars: {
                pixi: {
                    alpha: 1,
                    rotation: 0,
                    x: '+=20',
                },
                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1'),
            },
        },
    ]
    animations.map((animation) => tl.to(target, animation.duration, animation.vars))
}

export function topShockIn(target: any, duration: number = 1000) {
    if (typeof duration !== 'number') {
        throw new Error('animation time must be a number!')
    }
    duration = duration / 1000
    const animations = [
        {
            target: target,
            duration: 0.01,
            vars: {
                pixi: {
                    alpha: 0,
                    scale: 0.1 * this.ratio,
                    y: '-=220',
                },

            },
        },
        {
            target: target,
            duration: 0.2,
            vars: {
                pixi: {
                    alpha: 1,
                    scale: 0.2 * this.ratio,
                    y: '-=30',
                },
                ease: Power0.easeNone,
            },
        },
        {
            target: target,
            duration: 0.4 * duration,
            vars: {
                pixi: {
                    alpha: 1,
                    scale: 0.675 * this.ratio,
                    y: '+=310',
                },
                ease: CustomEase.create('custom', 'M0,0 C0.55,0.055 0.675,0.19 1,1'),
            },
        },
        {
            target: target,
            duration: 0.4 * duration,
            vars: {
                pixi: {
                    alpha: 1,
                    scale: 1 * this.ratio,
                    y: '-=60',
                },
                ease: CustomEase.create('custom', 'M0,0 C0.175,0.885 0.32,1 1,1'),
            },
        },
    ]
    animations.map((animation) => tl.to(target, animation.duration, animation.vars))
}

export function breakIn(target: any, duration: number = 1000) {
    if (typeof duration !== 'number') {
        throw new Error('animation time must be a number!')
    }
    // sprite.anchor.set(0, 1)
    // sprite.x -= sprite.width / 2
    // sprite.y += sprite.height / 2
    duration = duration / 1000
    const animations = [
        {
            target: target,
            duration: 0.01,
            vars: {
                pixi: {
                    anchorX: 0,
                    anchorY: 1,
                    x: '-=' + (target.width / 2),
                    y: '+=' + (target.height / 2),
                },

            },
        },
        {
            target: target,
            duration: 0.01 * duration,
            vars: {
                pixi: {
                    alpha: 1,
                    x: '+=300',
                    skewX: 30,
                },

            },
        },
        {
            target: target,
            duration: 0.3 * duration,
            vars: {
                pixi: {
                    alpha: 1,
                    skewX: 8,
                    x: '-=300',
                },
                ease: Power0.easeNone,
            },
        },
        {
            target: target,
            duration: 0.2 * duration,
            vars: {
                pixi: {
                    skewX: -3,
                },
                ease: Power0.easeNone,
            },
        },
        {
            target: target,
            duration: 0.2 * duration,
            vars: {
                pixi: {
                    skewX: 1,
                },
                ease: Power0.easeNone,
            },
        },
        {
            target: target,
            duration: 0.3 * duration,
            vars: {
                pixi: {
                    skewX: 0,
                },
                ease: Power0.easeNone,
            },
        },
    ]
    animations.map((animation) => tl.to(target, animation.duration, animation.vars))
    tl.eventCallback('onComplete', () => {
        target.anchor.set(0.5, 0.5)
        target.x += target.width / 2
        target.y -= target.height / 2
        tl.eventCallback('onComplete', () => { })
    })
}

export function swashOut(target: any, duration: number = 1000) {
    if (typeof duration !== 'number') {
        throw new Error('animation time must be a number!')
    }
    duration = duration / 1000
    const animations = [
        {
            target: target,
            duration: 0.8 * duration,
            vars: {
                pixi: {
                    scale: 0.8 * this.ratio,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.2 * duration,
            vars: {
                pixi: {
                    alpha: 0,
                    scale: 0,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1'),
            },
        },
    ]
    animations.map((animation) => tl.to(target, animation.duration, animation.vars))
}

export function foolishIn(target: any, duration: number = 1000) {
    if (typeof duration !== 'number') {
        throw new Error('animation time must be a number!')
    }
    duration = duration / 1000
    const animations = [
        {
            target: target,
            duration: 0.01,
            vars: {
                pixi: {
                    alpha: 0,
                    scale: 0,
                    rotation: 360,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.2 * duration,
            vars: {
                pixi: {
                    alpha: 1,
                    anchorX: 0,
                    anchorY: 1,
                    scale: 0.5 * this.ratio,
                    rotation: 0,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.2 * duration,
            vars: {
                pixi: {
                    alpha: 1,
                    anchorX: 1,
                    anchorY: 1,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.2 * duration,
            vars: {
                pixi: {
                    alpha: 1,
                    anchorX: 0,
                    anchorY: 1,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.2 * duration,
            vars: {
                pixi: {
                    alpha: 1,
                    anchorX: 0,
                    anchorY: 0,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.2 * duration,
            vars: {
                pixi: {
                    alpha: 1,
                    anchorX: 0.5,
                    anchorY: 0.5,
                    scale: 1 * this.ratio,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1'),
            },
        },
    ]
    animations.map((animation) => tl.to(target, animation.duration, animation.vars))
}

export function hingeOut(target: any, duration: number = 1000) {
    if (typeof duration !== 'number') {
        throw new Error('animation time must be a number!')
    }
    // sprite.anchor.set(0, 0)
    // sprite.x -= sprite.width / 2
    // sprite.y -= sprite.height / 2
    duration = duration / 1000
    const animations = [
        {
            target: target,
            duration: 0.01,
            vars: {
                pixi: {
                    anchorX: 0,
                    anchorY: 0,
                    x: '-=' + (target.width / 2),
                    y: '-=' + (target.height / 2),
                },
            },
        },
        {
            target: target,
            duration: 0.2 * duration,
            vars: {
                pixi: {
                    rotation: 70,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.2 * duration,
            vars: {
                pixi: {
                    rotation: '-=40',
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.2 * duration,
            vars: {
                pixi: {
                    rotation: '+=20',
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.2 * duration,
            vars: {
                pixi: {
                    rotation: '-=15',
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.2 * duration,
            vars: {
                pixi: {
                    y: '+=300',
                    alpha: 0,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
    ]
    animations.map((animation) => tl.to(target, animation.duration, animation.vars))

    tl.eventCallback('onComplete', () => {
        target.anchor.set(0.5, 0.5)
        target.x += target.width / 2
        target.y += target.height / 2
        tl.eventCallback('onComplete', () => { })
    })
}

export function heartBeat(target: any, duration: number = 1000) {
    if (typeof duration !== 'number') {
        throw new Error('animation time must be a number!')
    }
    duration = duration / 1000
    const animations = [
        {
            target: target,
            duration: 0.15 * duration,
            vars: {
                pixi: {
                    scale: 1.3 * this.ratio,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.15 * duration,
            vars: {
                pixi: {
                    scale: 1 * this.ratio,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.15 * duration,
            vars: {
                pixi: {
                    scale: 1.3 * this.ratio,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.15 * duration,
            vars: {
                pixi: {
                    scale: 1 * this.ratio,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
    ]
    animations.map((animation) => tl.to(target, animation.duration, animation.vars))
}

export function jelly(target: any, duration: number = 2000) {
    if (typeof duration !== 'number') {
        throw new Error('animation time must be a number!')
    }
    duration = duration / 1000
    const animations = [
        {
            target: target,
            duration: 0.15 * duration,
            vars: {
                pixi: {
                    scaleX: 1.25 * this.ratio,
                    scaleY: 0.75 * this.ratio,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.05 * duration,
            vars: {
                pixi: {
                    scaleX: 0.75 * this.ratio,
                    scaleY: 1.25 * this.ratio,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.05 * duration,
            vars: {
                pixi: {
                    scaleX: 1.15 * this.ratio,
                    scaleY: 0.85 * this.ratio,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.075 * duration,
            vars: {
                pixi: {
                    scaleX: 0.95 * this.ratio,
                    scaleY: 1.05 * this.ratio,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.05 * duration,
            vars: {
                pixi: {
                    scaleX: 1.05 * this.ratio,
                    scaleY: 0.95 * this.ratio,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.125 * duration,
            vars: {
                pixi: {
                    scaleX: 1 * this.ratio,
                    scaleY: 1 * this.ratio,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
    ]
    animations.map((animation) => tl.to(target, animation.duration, animation.vars))
}

export function swing1(target: any, duration: number = 2000) {
    if (typeof duration !== 'number') {
        throw new Error('animation time must be a number!')
    }
    duration = duration / 1000
    const animations = [
        {
            target: target,
            duration: 0.01,
            vars: {
                pixi: {
                    rotation: -30,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.5 * duration,
            vars: {
                pixi: {
                    rotation: 30,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.5 * duration,
            vars: {
                pixi: {
                    rotation: -30,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
    ]
    target.anchor.set(0.5, -3)
    target.y -= target.height * 3.5
    animations.map((animation) => tl.to(target, animation.duration, animation.vars))
    tl.eventCallback('onComplete', () => { tl.reverse() })
    tl.eventCallback('onReverseComplete', () => { tl.restart() })
}

export function swing2(target: any, duration: number = 2000) {
    if (typeof duration !== 'number') {
        throw new Error('animation time must be a number!')
    }
    duration = duration / 1000
    const animations = [
        {
            target: target,
            duration: 0.3 * duration,
            vars: {
                pixi: {
                    rotation: 15,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.1 * duration,
            vars: {
                pixi: {
                    rotation: -10,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.1 * duration,
            vars: {
                pixi: {
                    rotation: 5,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.1 * duration,
            vars: {
                pixi: {
                    rotation: -2,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.1 * duration,
            vars: {
                pixi: {
                    rotation: 0,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },

    ]
    target.anchor.set(0.5, 0)
    target.y -= target.height / 2
    animations.map((animation) => tl.to(target, animation.duration, animation.vars))

    tl.eventCallback('onComplete', () => {
        target.anchor.set(0.5, 0.5)
        target.y += target.height / 2
        tl.eventCallback('onComplete', () => { })
    })
}

export function swing3(target: any, duration: number = 2000) {
    if (typeof duration !== 'number') {
        throw new Error('animation time must be a number!')
    }
    duration = duration / 1000
    const animations = [
        {
            target: target,
            duration: 0.075 * duration,
            vars: {
                pixi: {
                    rotation: -5,
                    x: '-=25',
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.075 * duration,
            vars: {
                pixi: {
                    rotation: 3,
                    x: '+=45',
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.075 * duration,
            vars: {
                pixi: {
                    rotation: -3,
                    x: '-=35',
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.075 * duration,
            vars: {
                pixi: {
                    rotation: 2,
                    x: '+=25',
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.075 * duration,
            vars: {
                pixi: {
                    rotation: -1,
                    x: '-=15',
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.075 * duration,
            vars: {
                pixi: {
                    rotation: 0,
                    x: '+=5',
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
    ]
    animations.map((animation) => tl.to(target, animation.duration, animation.vars))
}

export function swing4(target: any, duration: number = 2000) {
    if (typeof duration !== 'number') {
        throw new Error('animation time must be a number!')
    }
    duration = duration / 1000
    const animations = [
        {
            target: target,
            duration: 0.05 * duration,
            vars: {
                pixi: {
                    scale: 0.8 * this.ratio,
                    rotation: -5,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.1 * duration,
            vars: {
                pixi: {
                    scale: 1.1 * this.ratio,
                    rotation: 3,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.05 * duration,
            vars: {
                pixi: {
                    scale: 1.1 * this.ratio,
                    rotation: -3,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.05 * duration,
            vars: {
                pixi: {
                    scale: 1.1 * this.ratio,
                    rotation: 3,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.05 * duration,
            vars: {
                pixi: {
                    scale: 1.1 * this.ratio,
                    rotation: -3,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.05 * duration,
            vars: {
                pixi: {
                    scale: 1.1 * this.ratio,
                    rotation: 3,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.05 * duration,
            vars: {
                pixi: {
                    scale: 1.1 * this.ratio,
                    rotation: -3,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.05 * duration,
            vars: {
                pixi: {
                    scale: 1.1 * this.ratio,
                    rotation: 3,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
        {
            target: target,
            duration: 0.05 * duration,
            vars: {
                pixi: {
                    scale: 1 * this.ratio,
                    rotation: 0,
                },
                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1'),
            },
        },
    ]
    animations.map((animation) => tl.to(target, animation.duration, animation.vars))
}