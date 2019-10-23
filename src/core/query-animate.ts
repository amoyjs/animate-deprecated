import { animate as _animate } from './animate'
import * as animations from './animations'

export const queryAnimate = {
    animate(options: ANIMATE.AnimateOptions) {
        for (let i = 0; i < this.length; i++) {
            _animate(this[i], options)
        }
    },
}

const keys = Object.keys(animations)
const values = Object.values(animations)
keys.map((animation, index) => {
    queryAnimate[animation] = function (...args: any) {
        for (let i = 0; i < this.length; i++) {
            // @ts-ignore
            values[index](this[i], ...args)
        }
    }
})

// @ts-ignore
if (window.query) window.query.extend(queryAnimate)