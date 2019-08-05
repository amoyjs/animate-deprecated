import * as PIXI from 'pixi.js'
// @ts-ignore
import { TimelineLite } from 'gsap'
import { CustomEase } from './customEase'
import 'gsap/PixiPlugin'
declare var PixiPlugin: any
PixiPlugin.registerPIXI(PIXI)

class AniController {

    private lastTimeLine: any = null
    private loadedCb: () => void 
    private completeCb: () => void 
    private reverseCompleteCb: () => void 
    private aniController: {
                position: any, scaleX: any, scaleY: any, rotation: any, opacity: any, anchor: any
            } = {position: null, scaleX: null, scaleY: null, rotation: null, opacity: null, anchor: null}
    private aniData: {
                position: any, scaleX: any, scaleY: any, rotation: any, opacity: any, anchor: any
            } = {position: null, scaleX: null, scaleY: null, rotation: null, opacity: null, anchor: null}    

    constructor(sprite: any, file: string) {
        const xRatio = 1 / 1.92
        const yRatio = window.innerHeight / 750
        const sWidth = sprite.width / xRatio
        const sHeight = sprite.height / xRatio
        
        const rawFile = new XMLHttpRequest()
        // 读取json文件
        const readFileCallBack = (response: any): any => {
            const ani = JSON.parse(response)
            const totalFrame = ani.op - ani.ip
            const duratuion = totalFrame / ani.fr

            if (ani.layers) {
                ani.layers.map((layer: any) => {
                    // get position data
                    if (layer.ks && layer.ks.p) {
                        const posAni = this.animatePosition(sprite, layer.ks.p, totalFrame, duratuion)
                        const tl_pos = new TimelineLite()
                        posAni.map((ani) => {
                            tl_pos.to(sprite, duratuion * ani.t, ani)
                        })
                        this.setPosition(tl_pos)
                        this.setPositionData(posAni)
                    }

                    // get scale data
                    // every dimension has it's own scale and ease cruve
                    if (layer.ks && layer.ks.s) {
                        const scaleAni = this.animationScale(sprite, layer.ks.s, totalFrame, duratuion)
                        const tl_scale_x = new TimelineLite()
                        const tl_scale_y = new TimelineLite()

                        scaleAni.x.map((ani: any) => {
                            tl_scale_x.to(sprite.scale, duratuion * ani.t, ani)

                        })
                        scaleAni.y.map((ani: any) => {
                            tl_scale_y.to(sprite.scale, duratuion * ani.t, ani)
                        })
                        this.setScaleX(tl_scale_x)
                        this.setScaleXData(scaleAni.x)

                        this.setScaleY(tl_scale_y)
                        this.setScaleYData(scaleAni.y)
                    }

                    // get rotation data
                    if (layer.ks && layer.ks.r) {
                        const rotationAni = this.animationRotation(sprite, layer.ks.r, totalFrame, duratuion)
                        const tl_rotation = new TimelineLite()
                        rotationAni.map((ani: any) => {
                            tl_rotation.to(sprite, duratuion * ani.t, ani)
                        })
                        this.setRotation(tl_rotation)
                        this.setRotationData(rotationAni)
                    }

                    // get alpha data
                    if (layer.ks && layer.ks.o) {
                        const opacityAni = this.animationOpacity(sprite, layer.ks.o, totalFrame, duratuion)
                        const tl_opacity = new TimelineLite()
                        opacityAni.map((ani) => {
                            tl_opacity.to(sprite, duratuion * ani.t, ani)
                        })
                        this.setOpacity(tl_opacity)
                        this.setOpacityData(opacityAni)
                    }

                    // get the anchor data 
                    if (layer.ks && layer.ks.a) {
                        const anchorAni = this.animationAnchor(sprite, layer.ks.a, totalFrame, duratuion)
                        const tl_anchor = new TimelineLite()
                        let delay = 0
                        anchorAni.map( (curve, index) => {
                            delay = index === 0 ? curve.delay :
                                                (anchorAni[index - 1].delay - curve.delay) 
                            // delay += index === 0 ? curve.delay * 1000 : 
                            //                     (anchorAni[index - 1].delay - curve.delay) * 1000
                            let frameCount = 0;                
                            curve.bezier.points.map( (data: any, dataIndex: number) => {
                                const anchorX = (data.point[0] ) / sWidth
                                const anchorY = (data.point[1] ) / sHeight
                                const startAnchorX = frameCount === 0 ? 0.5 : curve.bezier.points[dataIndex - 1].point[0] / sWidth
                                const startAnchorY = frameCount === 0 ? 0.5 : curve.bezier.points[dataIndex - 1].point[1] / sHeight
                                const anchorDiffX = anchorX - startAnchorX
                                const anchorDiffY = anchorY - startAnchorY
                                
                                tl_anchor.to(sprite, 1 / 60, {
                                    pixi: {
                                        anchorX,
                                        anchorY,
                                        // x: (anchorDiffX < 0?'+=':'-=') + Math.abs(anchorDiffX * sWidth),
                                        // y: (anchorDiffY < 0?'+=':'-=') + Math.abs(anchorDiffY * sHeight),
                                    }, 
                                    delay: dataIndex === 0 ? delay: 0
                                })
                            
                                // setTimeout( () => {
                                //     // 变动anchor 的同时要计算位移动
                                //     const anchorX = (data.point[0] ) / sWidth
                                //     const anchorY = (data.point[1] ) / sHeight
                                //     const startAnchorX = frameCount === 0 ? 0.5 : curve.bezier.points[dataIndex - 1].point[0] / sWidth
                                //     const startAnchorY = frameCount === 0 ? 0.5 : curve.bezier.points[dataIndex - 1].point[1] / sHeight
                                //     const anchorDiffX = anchorX - startAnchorX
                                //     const anchorDiffY = anchorY - startAnchorY
                                //     sprite.anchor.set( (data.point[0] ) / sWidth,
                                //                        (data.point[1] ) / sHeight,
                                //                      )
                                //     console.log('x: '+ anchorX, 'y'+ anchorX, 
                                //                 'xStart: '+ startAnchorX, 'yStart '+ startAnchorY,
                                //                 'xDiff: '+ anchorDiffX,'yDiff' +anchorDiffY,

                                //                 )
                                //     sprite.x += - (anchorDiffX * sWidth)
                                //     sprite.y += - (anchorDiffY * sHeight)

                                // }, delay)
                                // delay += (1 / 60) * 1000
                                frameCount++
                            })
                        })
                        this.setAnchor(tl_anchor)
                        this.setAnchorData(anchorAni)
                    }
                    // set lastFrame timeline
                    this.setLastFrameTimeline()
                    // trigger registered event callback
                    this.triggerReisteredCallback()
                })
            }
        }
        rawFile.overrideMimeType("application/json")
        rawFile.open("GET", file, true)
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4 && rawFile.status === 200) {
                readFileCallBack(rawFile.response)
            }
        }
        rawFile.send(null)
    }

    private buildPath(t: any, e: any, r: any, i: any, frames: number) {
        const s = (t[0] + "_" + t[1] + "_" + e[0] + "_" + e[1] + "_" + r[0] + "_" + r[1] + "_" + i[0] + "_" + i[1]).replace(/\./g, "p")

        let a: any
        let n: any
        let o: any
        let h: any
        let l: any
        let p: any
        let m: any
        let f = frames
        let c = 0
        let d = null
        2 === t.length && (t[0] !== e[0] || t[1] !== e[1]) && this.y(t[0], t[1], e[0], e[1], t[0] + r[0], t[1] + r[1]) && this.y(t[0], t[1], e[0], e[1], e[0] + i[0], e[1] + i[1]) && (f = 2)
        const u = {
            segmentLength: 0,
            points: new Array(t),
        }
        for (o = r.length, a = 0; a < f; a += 1) {
            const timeSegmentx = this.getBezierCruveTimex(a / (f - 1))
            const timeSegmenty = this.getBezierCruveTimey(a / (f - 1))
            const totalLength = Math.sqrt(Math.pow((888 - 206), 2) + Math.pow((878 - 120), 2))
            const currentLength = Math.sqrt(Math.pow((timeSegmenty - 206), 2) + Math.pow((timeSegmentx - 120), 2))

            // l = (timeSegmenty - 206) / ( 888 - 206)
            l = (a / (f - 1))
            for (m = this.createSizedArray(o), n = p = 0; n < o; n += 1) {
                h = Math.pow(1 - l, 3) * t[n] + 3 * Math.pow(1 - l, 2) * l * (t[n] + r[n]) + 3 * (1 - l) * Math.pow(l, 2) * (e[n] + i[n]) + Math.pow(l, 3) * e[n]
                m[n] = h
                null !== d && (p += Math.pow(m[n] - d[n], 2))
            }
            c += p = Math.sqrt(p)
            const obj = {
                partialLength: p,
                point: m,
            }
            u.points[a] = {
                partialLength: p,
                point: m,
            }

            d = m
        }
        u.segmentLength = c
        const test = u
        return test
    }

    private getBezierCruveTimex(time: any) {
        const timeSegment = Math.pow(1 - time, 3) * 120 + 3 * Math.pow(1 - time, 2) * time * (120) + 3 * (1 - time) * Math.pow(time, 2) * (127) + Math.pow(time, 3) * 828
        return timeSegment
    }

    private getBezierCruveTimey(time: any) {
        const timeSegment = Math.pow(1 - time, 3) * 206 + 3 * Math.pow(1 - time, 2) * time * (888) + 3 * (1 - time) * Math.pow(time, 2) * (206) + Math.pow(time, 3) * 888
        return timeSegment
    }

    private y(t: any, e: any, r: any, i: any, s: any, a: any) {
        const n = t * i + e * s + r * a - s * i - a * t - r * e
        return -.001 < n && n < .001
    }

    private createSizedArray(t: any) {
        return Array.apply(null, {
            length: t,
        })
    }
    private animatePosition(sprite: PIXI.Sprite, data: any, totalFrame: number, duration: number) {
        const animation: Array<{ bezier: any, ease: any, t: number, delay: number, lastFrame: boolean }> = []
        if (data.k && data.k[0].i) {
            let startPoint = { x: 0, y: 0 }
            let endPoint = { x: 0, y: 0 }
            let totalDelay = 0
            if (data.k[0].t > 0) {
                totalDelay += data.k[0].t / totalFrame
            }
            data.k.map((d: any, index: number) => {

                // get ease string
                let easeString = ''
                if (data.k[index].i && data.k[index].o) {
                    easeString = 'M0,0 C' + data.k[index].o.x + ',' + data.k[index].o.y + ' ' +
                        data.k[index].i.x + ',' + data.k[index].i.y + ' 1,1'
                }

                if (data.k[index + 1]) {
                    // get postion point
                    const xValue = data.k[index + 1].s[0] - data.k[index].s[0]
                    const yValue = data.k[index + 1].s[1] - data.k[index].s[1]
                    if (index === 0) {
                        startPoint = {
                            x: sprite.x,
                            y: sprite.y,
                        }

                        endPoint = {
                            x: sprite.x + xValue,
                            y: sprite.y + yValue,
                        }

                    } else {
                        startPoint = endPoint
                        endPoint = {
                            x: startPoint.x + xValue,
                            y: startPoint.y + yValue,
                        }
                    }
                    // get bezier cruve control point
                    const bezierPoints: Array<{ x: number, y: number }> = []
                    bezierPoints.push(startPoint) // start point

                    bezierPoints.push({
                        x: startPoint.x + data.k[index].to[0],
                        y: startPoint.y + data.k[index].to[1],
                    }) // controll point
                    bezierPoints.push({
                        x: endPoint.x + data.k[index].ti[0],
                        y: endPoint.y + data.k[index].ti[1],
                    }) // controll point

                    bezierPoints.push(endPoint) // end point

                    animation.push({
                        bezier: {
                            type: 'cubic',
                            values: bezierPoints,
                        },
                        ease: CustomEase.create("custom", easeString),
                        t: (data.k[index + 1].t - data.k[index].t) / totalFrame,
                        delay: totalDelay * duration,
                        lastFrame: (data.k[index + 1].t / totalFrame) === 1? true : false,
                    })
                } else {
                    return
                }
            })
        }
        return animation
    }

    // currently ignore dimension z
    private animationScale(sprite: PIXI.Sprite, data: any, totalFrame: number, duration: number) {
        const animation: { x: any, y: any } = { x: null, y: null }
        const animationX: Array<{ x: number, ease: any, t: number, delay: number, lastFrame: boolean }> = []
        const animationY: Array<{ y: number, ease: any, t: number, delay: number, lastFrame: boolean }> = []
        let easeStringX = ''
        let easeStringY = ''
        let totalDelay = 0
        if (data.k[0].t > 0) {
            totalDelay += data.k[0].t / totalFrame
        }
        if (data.k && data.k[0].i) {
            data.k.map((d: any, index: number) => {

                if (data.k[index].i && data.k[index].o) {
                    easeStringX = 'M0,0 C' + data.k[index].o.x[0] + ',' + data.k[index].o.y[0] + ' ' +
                        data.k[index].i.x[0] + ',' + data.k[index].i.y[0] + ' 1,1'

                    easeStringY = 'M0,0 C' + data.k[index].o.x[1] + ',' + data.k[index].o.y[1] + ' ' +
                        data.k[index].i.x[1] + ',' + data.k[index].i.y[1] + ' 1,1'
                }

                if (data.k[index + 1]) {
                    animationX.push({
                        x: data.k[index + 1].s[0] / 100,
                        ease: CustomEase.create("custom", easeStringX),
                        t: (data.k[index + 1].t - data.k[index].t) / totalFrame,
                        delay: totalDelay * duration,
                        lastFrame: (data.k[index + 1].t / totalFrame) === 1? true : false,
                    })
                    animationY.push({
                        y: data.k[index + 1].s[1] / 100,
                        ease: CustomEase.create("custom", easeStringY),
                        t: (data.k[index + 1].t - data.k[index].t) / totalFrame,
                        delay: totalDelay * duration,
                        lastFrame: (data.k[index + 1].t / totalFrame) === 1? true : false,
                    })
                } else {
                    return
                }
            })
        }
        animation.x = animationX
        animation.y = animationY
        return animation
    }

    private animationRotation(sprite: PIXI.Sprite, data: any, totalFrame: number, duration: number) {
        const animation: Array<{ rotation: number, ease: any, t: number, delay: number,  lastFrame: boolean }> = []
        let easeString = ''
        let totalDelay = 0
        if (data.k[0].t > 0) {
            totalDelay += data.k[0].t / totalFrame
        }
        if (data.k && data.k[0].i) {
            data.k.map((d: any, index: number) => {
                if (data.k[index + 1]) {
                    if (data.k[index].i && data.k[index].o) {
                        easeString = 'M0,0 C' + data.k[index].o.x[0] + ',' + data.k[index].o.y[0] + ' ' +
                            data.k[index].i.x[0] + ',' + data.k[index].i.y[0] + ' 1,1'
                    }

                    animation.push({
                        rotation: (data.k[index + 1].s[0] - data.k[index].s[0]) * Math.PI / 180,
                        ease: CustomEase.create("custom", easeString),
                        t: (data.k[index + 1].t - data.k[index].t) / totalFrame,
                        delay: totalDelay * duration,
                        lastFrame: (data.k[index + 1].t / totalFrame) === 1? true : false,
                    })
                } else {
                    return
                }
            })
        }
        return animation
    }

    private animationOpacity(srpite: PIXI.Sprite, data: any, totalFrame: number, duration: number) {
        const animation: Array<{ alpha: number, ease: any, t: number, delay: number, lastFrame: boolean }> = []
        let easeString = ''
        let totalDelay = 0
        if (data.k[0].t > 0) {
            totalDelay += data.k[0].t / totalFrame
        }
        if (data.k && data.k[0].i) {
            data.k.map((d: any, index: number) => {
                if (data.k[index + 1]) {
                    if (data.k[index].i && data.k[index].o) {
                        easeString = 'M0,0 C' + data.k[index].o.x[0] + ',' + data.k[index].o.y[0] + ' ' +
                            data.k[index].i.x[0] + ',' + data.k[index].i.y[0] + ' 1,1'
                    }

                    animation.push({
                        alpha: data.k[index + 1].s[0] / 100,
                        ease: CustomEase.create("custom", easeString),
                        t: (data.k[index + 1].t - data.k[index].t) / totalFrame,
                        delay: totalDelay * duration,
                        lastFrame: (data.k[index].t / totalFrame) === 1? true : false,
                    })
                } else {
                    return
                }

            })
        }
        return animation
    }

    private animationAnchor(sprite: PIXI.Sprite, data: any, totalFrame: number, duration: number) {
        const animation: Array<{ bezier: any, ease: any, t: number, delay: number, lastFrame: boolean }> = []
        if (data.k && data.k[0].i) {
            let startPoint = [0, 0, 0]
            let endPoint = [0, 0, 0]
            let time = 0
            let totalDelay = 0
            if (data.k[0].t > 0) {
                totalDelay += data.k[0].t / totalFrame
            }
            data.k.map((d: any, index: number) => {
                // get ease string
                let easeString = ''
                if (data.k[index].i && data.k[index].o) {
                    easeString = 'M0,0 C' + data.k[index].o.x + ',' + data.k[index].o.y + ' ' +
                        data.k[index].i.x + ',' + data.k[index].i.y + ' 1,1'
                }

                if (data.k[index + 1]) {
                    startPoint = [
                        data.k[index].s[0],
                        data.k[index].s[1],
                        data.k[index].s[2],
                    ]

                    endPoint = [
                        data.k[index + 1].s[0],
                        data.k[index + 1].s[1],
                        data.k[index + 1].s[2],
                    ]
                    time = (data.k[index + 1].t - data.k[index].t) / totalFrame,
                        animation.push({
                            bezier: this.buildPath(startPoint, endPoint, data.k[index].to, data.k[index].ti, time * duration * 60),
                            ease: CustomEase.create("custom", easeString),
                            t: time,
                            delay: totalDelay * duration,
                            lastFrame: (data.k[index + 1].t / totalFrame) === 1? true : false,
                        })
                } else {
                    return
                }

            })
        }
        return animation
    }

    private triggerReisteredCallback() {
        if(this.loadedCb) this.loadedCb()

        if(this.completeCb) this.completeCb()
     
        if(this.reverseCompleteCb) this.reverseCompleteCb()
    }
    
    public play() {
        for (let property in this.aniController) {
            if (this.aniController.hasOwnProperty(property) && this.aniController[property] !== null) {
                this.aniController[property].play()
            }
        }
    }   

    public stop() {
        for (let property in this.aniController) {
            if (this.aniController.hasOwnProperty(property) && this.aniController[property] !== null) {
                this.aniController[property].pause()
            }
        }
    }   

    public reverse() {
        for (let property in this.aniController) {
            if (this.aniController.hasOwnProperty(property) && this.aniController[property] !== null) {
                this.aniController[property].reverse()
            }
        }
    }  

    public setPosition(pos: any) {
        this.aniController.position = pos
    }
    public setPositionData(pos: any) {
        this.aniData.position = pos
    }
    
    public setScaleX(scaleX: any) {
        this.aniController.scaleX = scaleX
    }
    public setScaleXData(scaleX: any) {
        this.aniData.scaleX = scaleX
    }    

    public setScaleY(scaleY: any) {
        this.aniController.scaleY = scaleY
    }
    public setScaleYData(scaleY: any) {
        this.aniData.scaleY = scaleY
    } 

    public setRotation(rotation: any) {
        this.aniController.rotation = rotation
    }
    public setRotationData(rotation: any) {
        this.aniData.rotation = rotation
    }

    public setOpacity(opacity: any) {
        this.aniController.opacity = opacity
    }
    public setOpacityData(opacity: any) {
        this.aniData.opacity = opacity
    }    

    public setAnchor(anchor: any) {
        this.aniController.anchor = anchor
    }
    public setAnchorData(anchor: any) {
        this.aniData.anchor = anchor
    }    

    public setLastFrameTimeline() {
        for (let property in this.aniData) {
            if (this.aniData.hasOwnProperty(property) && this.aniData[property] !== null) {
                for(let data of this.aniData[property]  )  {   
                    if(data.lastFrame) {
                        this.lastTimeLine = this.aniController[property]
                         return
                    }
                }
            }
        }
    }

    public on(status: string, callback:() => void) {
        if( this.lastTimeLine === null ) {
            switch(status) {
                case 'loadComplete':
                    this.loadedCb = callback
                case 'complete':
                    this.completeCb = () => { this.lastTimeLine.eventCallback('onComplete', () => callback()) }
                    break
                case 'reverseComplete':  
                    this.reverseCompleteCb = () => { this.lastTimeLine.eventCallback('onReverseComplete', () => callback()) }
                    break
            }
        } else {
            switch(status) {
                case 'complete':
                    this.lastTimeLine.eventCallback('onComplete', () => callback())
                    break
                case 'reverseComplete':  
                    this.lastTimeLine.eventCallback('onReverseComplete', () => callback())
                    break
            }
        }
    }
}

export function LoadAnimation(target: PIXI.Sprite, JSON: any) {
    return new AniController(target, JSON)
}