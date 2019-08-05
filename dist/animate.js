(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('gsap'), require('gsap/TweenLite.js'), require('pixi.js'), require('gsap/PixiPlugin')) :
    typeof define === 'function' && define.amd ? define(['exports', 'gsap', 'gsap/TweenLite.js', 'pixi.js', 'gsap/PixiPlugin'], factory) :
    (global = global || self, factory(global.animate = {}, global.gsap, global.TweenLite_js, global.PIXI, global.PixiPlugin));
}(this, function (exports, gsap, TweenLite_js, PIXI, PixiPlugin) { 'use strict';

    PixiPlugin = PixiPlugin && PixiPlugin.hasOwnProperty('default') ? PixiPlugin['default'] : PixiPlugin;

    /*!
     * VERSION: 0.2.2
     * DATE: 2018-08-27
     * UPDATES AND DOCS AT: http://greensock.com
     *
     * @license Copyright (c) 2008-2019, GreenSock. All rights reserved.
     * This work is subject to the terms at http://greensock.com/standard-license or for
     * Club GreenSock members, the software agreement that was issued with your membership.
     *
     * @author: Jack Doyle, jack@greensock.com
     **/

    TweenLite_js._gsScope._gsDefine("easing.CustomEase", ["easing.Ease"], function() {

        const _numbersExp = /(?:(-|-=|\+=)?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/ig;
        const _svgPathExp = /[achlmqstvz]|(-?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/ig;
        const _scientific = /[\+\-]?\d*\.?\d+e[\+\-]?\d+/ig;
        const _needsParsingExp = /[cLlsS]/g;
        const _bezierError = "CustomEase only accepts Cubic Bezier data.",
        _bezierToPoints = function (x1, y1, x2, y2, x3, y3, x4, y4, threshold, points, index) {
                var x12 = (x1 + x2) / 2,
                    y12 = (y1 + y2) / 2,
                    x23 = (x2 + x3) / 2,
                    y23 = (y2 + y3) / 2,
                    x34 = (x3 + x4) / 2,
                    y34 = (y3 + y4) / 2,
                    x123 = (x12 + x23) / 2,
                    y123 = (y12 + y23) / 2,
                    x234 = (x23 + x34) / 2,
                    y234 = (y23 + y34) / 2,
                    x1234 = (x123 + x234) / 2,
                    y1234 = (y123 + y234) / 2,
                    dx = x4 - x1,
                    dy = y4 - y1,
                    d2 = Math.abs((x2 - x4) * dy - (y2 - y4) * dx),
                    d3 = Math.abs((x3 - x4) * dy - (y3 - y4) * dx),
                    length;
                if (!points) {
                    points = [{ x: x1, y: y1 }, { x: x4, y: y4 }];
                    index = 1;
                }
                points.splice(index || points.length - 1, 0, { x: x1234, y: y1234 });
                if ((d2 + d3) * (d2 + d3) > threshold * (dx * dx + dy * dy)) {
                    length = points.length;
                    _bezierToPoints(x1, y1, x12, y12, x123, y123, x1234, y1234, threshold, points, index);
                    _bezierToPoints(x1234, y1234, x234, y234, x34, y34, x4, y4, threshold, points, index + 1 + (points.length - length));
                }
                return points
            },

            _pathDataToBezier = function (d) {
                var a = (d + "").replace(_scientific, function (m) {
                    var n = +m;
                    return (n < 0.0001 && n > -0.0001) ? 0 : n
                }).match(_svgPathExp) || [], //some authoring programs spit out very small numbers in scientific notation like "1e-5", so make sure we round that down to 0 first.
                    path = [],
                    relativeX = 0,
                    relativeY = 0,
                    elements = a.length,
                    l = 2,
                    i, x, y, command, isRelative, segment, startX, startY, prevCommand, difX, difY;
                for (i = 0; i < elements; i++) {
                    prevCommand = command;
                    if (isNaN(a[i])) {
                        command = a[i].toUpperCase();
                        isRelative = (command !== a[i]); //lower case means relative
                    } else { //commands like "C" can be strung together without any new command characters between.
                        i--;
                    }
                    x = +a[i + 1];
                    y = +a[i + 2];
                    if (isRelative) {
                        x += relativeX;
                        y += relativeY;
                    }
                    if (!i) {
                        startX = x;
                        startY = y;
                    }
                    if (command === "M") {
                        if (segment && segment.length < 8) { //if the path data was funky and just had a M with no actual drawing anywhere, skip it.
                            path.length -= 1;
                            l = 0;
                        }
                        relativeX = startX = x;
                        relativeY = startY = y;
                        segment = [x, y];
                        l = 2;
                        path.push(segment);
                        i += 2;
                        command = "L"; //an "M" with more than 2 values gets interpreted as "lineTo" commands ("L").

                    } else if (command === "C") {
                        if (!segment) {
                            segment = [0, 0];
                        }
                        segment[l++] = x;
                        segment[l++] = y;
                        if (!isRelative) {
                            relativeX = relativeY = 0;
                        }
                        segment[l++] = relativeX + a[i + 3] * 1; //note: "*1" is just a fast/short way to cast the value as a Number. WAAAY faster in Chrome, slightly slower in Firefox.
                        segment[l++] = relativeY + a[i + 4] * 1;
                        segment[l++] = relativeX = relativeX + a[i + 5] * 1;
                        segment[l++] = relativeY = relativeY + a[i + 6] * 1;
                        i += 6;

                    } else if (command === "S") {
                        if (prevCommand === "C" || prevCommand === "S") {
                            difX = relativeX - segment[l - 4];
                            difY = relativeY - segment[l - 3];
                            segment[l++] = relativeX + difX;
                            segment[l++] = relativeY + difY;
                        } else {
                            segment[l++] = relativeX;
                            segment[l++] = relativeY;
                        }
                        segment[l++] = x;
                        segment[l++] = y;
                        if (!isRelative) {
                            relativeX = relativeY = 0;
                        }
                        segment[l++] = relativeX = relativeX + a[i + 3] * 1;
                        segment[l++] = relativeY = relativeY + a[i + 4] * 1;
                        i += 4;

                    } else if (command === "L" || command === "Z") {
                        if (command === "Z") {
                            x = startX;
                            y = startY;
                            segment.closed = true;
                        }
                        if (command === "L" || Math.abs(relativeX - x) > 0.5 || Math.abs(relativeY - y) > 0.5) {
                            segment[l++] = relativeX + (x - relativeX) / 3;
                            segment[l++] = relativeY + (y - relativeY) / 3;
                            segment[l++] = relativeX + (x - relativeX) * 2 / 3;
                            segment[l++] = relativeY + (y - relativeY) * 2 / 3;
                            segment[l++] = x;
                            segment[l++] = y;
                            if (command === "L") {
                                i += 2;
                            }
                        }
                        relativeX = x;
                        relativeY = y;
                    } else {
                        throw _bezierError
                    }

                }
                return path[0]
            },

            _findMinimum = function (values) {
                var l = values.length,
                    min = 999999999999,
                    i;
                for (i = 1; i < l; i += 6) {
                    if (+values[i] < min) {
                        min = +values[i];
                    }
                }
                return min
            },

            _normalize = function (values, height, originY) { //takes all the points and translates/scales them so that the x starts at 0 and ends at 1.
                if (!originY && originY !== 0) {
                    originY = Math.max(+values[values.length - 1], +values[1]);
                }
                var tx = +values[0] * -1,
                    ty = -originY,
                    l = values.length,
                    sx = 1 / (+values[l - 2] + tx),
                    sy = -height || ((Math.abs(+values[l - 1] - +values[1]) < 0.01 * (+values[l - 2] - +values[0])) ? _findMinimum(values) + ty : +values[l - 1] + ty),
                    i;
                if (sy) { //typically y ends at 1 (so that the end values are reached)
                    sy = 1 / sy;
                } else { //in case the ease returns to its beginning value, scale everything proportionally
                    sy = -sx;
                }
                for (i = 0; i < l; i += 2) {
                    values[i] = (+values[i] + tx) * sx;
                    values[i + 1] = (+values[i + 1] + ty) * sy;
                }
            },

            _getRatio = function (p) {
                var point = this.lookup[(p * this.l) | 0] || this.lookup[this.l - 1];
                if (point.nx < p) {
                    point = point.n;
                }
                return point.y + ((p - point.x) / point.cx) * point.cy
            },


            CustomEase = function (id, data, config) {
                this._calcEnd = true;
                this.id = id;
                if (id) {
                    TweenLite_js.Ease.map[id] = this;
                }
                this.getRatio = _getRatio; //speed optimization, faster lookups.
                this.setData(data, config);
            },
            p = CustomEase.prototype = new TweenLite_js.Ease();

        p.constructor = CustomEase;

        p.setData = function (data, config) {
            data = data || "0,0,1,1";
            var values = data.match(_numbersExp),
                closest = 1,
                points = [],
                l, a1, a2, i, inc, j, point, prevPoint, p, precision;
            config = config || {};
            precision = config.precision || 1;
            this.data = data;
            this.lookup = [];
            this.points = points;
            this.fast = (precision <= 1);
            if (_needsParsingExp.test(data) || (data.indexOf("M") !== -1 && data.indexOf("C") === -1)) {
                values = _pathDataToBezier(data);
            }
            l = values.length;
            if (l === 4) {
                values.unshift(0, 0);
                values.push(1, 1);
                l = 8;
            } else if ((l - 2) % 6) {
                throw _bezierError
            }
            if (+values[0] !== 0 || +values[l - 2] !== 1) {
                _normalize(values, config.height, config.originY);
            }

            this.rawBezier = values;

            for (i = 2; i < l; i += 6) {
                a1 = { x: +values[i - 2], y: +values[i - 1] };
                a2 = { x: +values[i + 4], y: +values[i + 5] };
                points.push(a1, a2);
                _bezierToPoints(a1.x, a1.y, +values[i], +values[i + 1], +values[i + 2], +values[i + 3], a2.x, a2.y, 1 / (precision * 200000), points, points.length - 1);
            }
            l = points.length;
            for (i = 0; i < l; i++) {
                point = points[i];
                prevPoint = points[i - 1] || point;
                if (point.x > prevPoint.x || (prevPoint.y !== point.y && prevPoint.x === point.x) || point === prevPoint) { //if a point goes BACKWARD in time or is a duplicate, just drop it.
                    prevPoint.cx = point.x - prevPoint.x; //change in x between this point and the next point (performance optimization)
                    prevPoint.cy = point.y - prevPoint.y;
                    prevPoint.n = point;
                    prevPoint.nx = point.x; //next point's x value (performance optimization, making lookups faster in getRatio()). Remember, the lookup will always land on a spot where it's either this point or the very next one (never beyond that)
                    if (this.fast && i > 1 && Math.abs(prevPoint.cy / prevPoint.cx - points[i - 2].cy / points[i - 2].cx) > 2) { //if there's a sudden change in direction, prioritize accuracy over speed. Like a bounce ease - you don't want to risk the sampling chunks landing on each side of the bounce anchor and having it clipped off.
                        this.fast = false;
                    }
                    if (prevPoint.cx < closest) {
                        if (!prevPoint.cx) {
                            prevPoint.cx = 0.001; //avoids math problems in getRatio() (dividing by zero)
                            if (i === l - 1) { //in case the final segment goes vertical RIGHT at the end, make sure we end at the end.
                                prevPoint.x -= 0.001;
                                closest = Math.min(closest, 0.001);
                                this.fast = false;
                            }
                        } else {
                            closest = prevPoint.cx;
                        }
                    }
                } else {
                    points.splice(i--, 1);
                    l--;
                }
            }
            l = (1 / closest + 1) | 0;
            this.l = l; //record for speed optimization
            inc = 1 / l;
            j = 0;
            point = points[0];
            if (this.fast) {
                for (i = 0; i < l; i++) { //for fastest lookups, we just sample along the path at equal x (time) distance. Uses more memory and is slightly less accurate for anchors that don't land on the sampling points, but for the vast majority of eases it's excellent (and fast).
                    p = i * inc;
                    if (point.nx < p) {
                        point = points[++j];
                    }
                    a1 = point.y + ((p - point.x) / point.cx) * point.cy;
                    this.lookup[i] = { x: p, cx: inc, y: a1, cy: 0, nx: 9 };
                    if (i) {
                        this.lookup[i - 1].cy = a1 - this.lookup[i - 1].y;
                    }
                }
                this.lookup[l - 1].cy = points[points.length - 1].y - a1;
            } else { //this option is more accurate, ensuring that EVERY anchor is hit perfectly. Clipping across a bounce, for example, would never happen.
                for (i = 0; i < l; i++) { //build a lookup table based on the smallest distance so that we can instantly find the appropriate point (well, it'll either be that point or the very next one). We'll look up based on the linear progress. So it's it's 0.5 and the lookup table has 100 elements, it'd be like lookup[Math.floor(0.5 * 100)]
                    if (point.nx < i * inc) {
                        point = points[++j];
                    }
                    this.lookup[i] = point;
                }

                if (j < points.length - 1) {
                    this.lookup[i - 1] = points[points.length - 2];
                }
            }
            this._calcEnd = (points[points.length - 1].y !== 1 || points[0].y !== 0); //ensures that we don't run into floating point errors. As long as we're starting at 0 and ending at 1, tell GSAP to skip the final calculation and use 0/1 as the factor.
            return this
        };

        p.getRatio = _getRatio;

        p.getSVGData = function (config) {
            return CustomEase.getSVGData(this, config)
        };

        CustomEase.create = function (id, data, config) {
            return new CustomEase(id, data, config)
        };

        CustomEase.version = "0.2.2";

        CustomEase.bezierToPoints = _bezierToPoints;
        CustomEase.get = function (id) {
            return TweenLite_js.Ease.map[id]
        };
        CustomEase.getSVGData = function (ease, config) {
            config = config || {};
            var rnd = 1000,
                width = config.width || 100,
                height = config.height || 100,
                x = config.x || 0,
                y = (config.y || 0) + height,
                e = config.path,
                a, slope, i, inc, tx, ty, precision, threshold, prevX, prevY;
            if (config.invert) {
                height = -height;
                y = 0;
            }
            ease = ease.getRatio ? ease : TweenLite_js.Ease.map[ease] || console.log("No ease found: ", ease);
            if (!ease.rawBezier) {
                a = ["M" + x + "," + y];
                precision = Math.max(5, (config.precision || 1) * 200);
                inc = 1 / precision;
                precision += 2;
                threshold = 5 / precision;
                prevX = (((x + inc * width) * rnd) | 0) / rnd;
                prevY = (((y + ease.getRatio(inc) * -height) * rnd) | 0) / rnd;
                slope = (prevY - y) / (prevX - x);
                for (i = 2; i < precision; i++) {
                    tx = (((x + i * inc * width) * rnd) | 0) / rnd;
                    ty = (((y + ease.getRatio(i * inc) * -height) * rnd) | 0) / rnd;
                    if (Math.abs((ty - prevY) / (tx - prevX) - slope) > threshold || i === precision - 1) { //only add points when the slope changes beyond the threshold
                        a.push(prevX + "," + prevY);
                        slope = (ty - prevY) / (tx - prevX);
                    }
                    prevX = tx;
                    prevY = ty;
                }
            } else {
                a = [];
                precision = ease.rawBezier.length;
                for (i = 0; i < precision; i += 2) {
                    a.push((((x + ease.rawBezier[i] * width) * rnd) | 0) / rnd + "," + (((y + ease.rawBezier[i + 1] * -height) * rnd) | 0) / rnd);
                }
                a[0] = "M" + a[0];
                a[1] = "C" + a[1];
            }
            if (e) {
                (typeof (e) === "string" ? document.querySelector(e) : e).setAttribute("d", a.join(" "));
            }
            return a.join(" ")
        };

        return CustomEase

    }, true);

    var CustomEase = TweenLite_js.globals.CustomEase;

    // @ts-ignore
    var tl = new gsap.TimelineLite();
    function blink(target, duration, repeat) {
        var totalRepeat = 0;
        repeatBlink();
        return tl;
        function repeatBlink() {
            if (totalRepeat < repeat) {
                duration = duration / 1000 / repeat / 2;
                tl.to(target, duration, {
                    alpha: 0,
                    onComplete: function () {
                        tl.to(target, duration / 1000 / repeat / 2, {
                            alpha: 1,
                            onComplete: repeatBlink
                        });
                        totalRepeat++;
                    }
                });
            }
        }
    }
    function shakeInAlarm(target) {
        var animations = [{
                duration: 0.01,
                vars: {
                    pixi: {
                        rotation: 5,
                        x: "+=10"
                    },
                    ease: gsap.Linear.easeNone
                }
            }, {
                duration: 0.01,
                vars: {
                    pixi: {
                        rotation: -5,
                        x: "-=20"
                    },
                    ease: gsap.Linear.easeNone
                }
            }];
        animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
        tl.eventCallback('onComplete', function () { tl.reverse(); });
        tl.eventCallback('onReverseComplete', function () { tl.restart(); });
    }
    function shakeInHorz(target) {
        var animations = [{
                duration: 0.01,
                vars: {
                    pixi: {
                        x: "+=10"
                    },
                    ease: gsap.Linear.easeNone
                }
            }, {
                duration: 0.01,
                vars: {
                    pixi: {
                        x: "-=20"
                    },
                    ease: gsap.Linear.easeNone
                }
            }];
        animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
        tl.eventCallback('onComplete', function () { tl.reverse(); });
        tl.eventCallback('onReverseComplete', function () { tl.restart(); });
    }
    function shakeInVetc(target) {
        var animations = [{
                target: target,
                duration: 0.01,
                vars: {
                    pixi: {
                        y: "+=10"
                    },
                    ease: gsap.Linear.easeNone
                }
            }, {
                target: target,
                duration: 0.01,
                vars: {
                    pixi: {
                        y: "-=20"
                    },
                    ease: gsap.Linear.easeNone
                }
            }];
        animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
        tl.eventCallback('onComplete', function () { tl.reverse(); });
        tl.eventCallback('onReverseComplete', function () { tl.restart(); });
    }
    function shakeInRotate(target) {
        var animations = [
            {
                target: target,
                duration: 0.01,
                vars: {
                    pixi: {
                        rotation: 10
                    },
                    ease: gsap.Linear.easeNone
                }
            },
            {
                target: target,
                duration: 0.01,
                vars: {
                    pixi: {
                        rotation: -10
                    },
                    ease: gsap.Linear.easeNone
                }
            },
        ];
        animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
        tl.eventCallback('onComplete', function () { tl.reverse(); });
        tl.eventCallback('onReverseComplete', function () { tl.restart(); });
    }
    function shakeInHard(target) {
        var aniArray = [
            {
                x: "-=7",
                y: "+=5",
                rotation: 1.5 * Math.PI / 180,
                ease: gsap.Linear.easeIn
            }, {
                x: "+=5",
                y: "-=5",
                rotation: 1.5 * Math.PI / 180,
                ease: gsap.Linear.easeIn
            }, {
                x: "-=2",
                y: "+=8",
                rotation: 1.5 * Math.PI / 180,
                ease: gsap.Linear.easeIn
            }, {
                x: "-=7",
                y: "+=1",
                rotation: -(2.5 * Math.PI / 180),
                ease: gsap.Linear.easeIn
            }, {
                x: "-=2",
                y: "+=8",
                rotation: 3.5 * Math.PI / 180,
                ease: gsap.Linear.easeIn
            }, {
                x: "-=3",
                y: "-=8",
                rotation: -(1.5 * Math.PI / 180),
                ease: gsap.Linear.easeIn
            }, {
                x: "-=8",
                y: "-=7",
                rotation: 2.5 * Math.PI / 180,
                ease: gsap.Linear.easeIn
            }, {
                x: "+=0",
                y: "+=1",
                rotation: 0.5 * Math.PI / 180,
                ease: gsap.Linear.easeIn
            }, {
                x: "-=2",
                y: "-=1",
                rotation: -(1.5 * Math.PI / 180),
                ease: gsap.Linear.easeIn
            }, {
                x: "+=7",
                y: "+=0",
                rotation: -(2.5 * Math.PI / 180),
                ease: gsap.Linear.easeIn
            }, {
                x: "+=8",
                y: "-=6",
                rotation: -(1.5 * Math.PI / 180),
                ease: gsap.Linear.easeIn
            }, {
                x: "+=1",
                y: "-=4",
                rotation: -(0.5 * Math.PI / 180),
                ease: gsap.Linear.easeIn
            }, {
                x: "-=2",
                y: "+=9",
                rotation: 3.5 * Math.PI / 180,
                ease: gsap.Linear.easeIn
            }, {
                x: "+=1",
                y: "-=5",
                rotation: -(1.5 * Math.PI / 180),
                ease: gsap.Linear.easeIn
            }, {
                x: "-=2",
                y: "+=7",
                rotation: 0.5 * Math.PI / 180,
                ease: gsap.Linear.easeIn
            },
        ];
        aniArray.map(function (animation) {
            tl.to(target, 0.02, animation);
        });
        tl.eventCallback('onComplete', function () { tl.reverse(); });
        tl.eventCallback('onReverseComplete', function () { tl.restart(); });
    }
    function bomb1(target, duration) {
        if (duration === void 0) { duration = 1000; }
        if (typeof duration !== 'number') {
            throw new Error("animation time must be a number!");
        }
        duration = duration / 1000;
        var animations = [
            {
                target: target,
                duration: 1 * duration,
                vars: {
                    pixi: {
                        scale: 2 * this.ratio,
                        blur: 20,
                        alpha: 0
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.25,0.1 0.25,1 1,1")
                }
            },
        ];
        animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
        tl.eventCallback('onComplete', function () {
            tl.reverse();
        });
    }
    function freeFall(target, duration) {
        if (duration === void 0) { duration = 1000; }
        if (typeof duration !== 'number') {
            throw new Error("animation time must be a number!");
        }
        duration = duration / 1000;
        var animations = [
            {
                target: target,
                duration: 0.01,
                vars: {
                    pixi: {
                        y: "-= 300"
                    }
                }
            },
            {
                target: target,
                duration: 1 * duration,
                vars: {
                    pixi: {
                        y: "+= 300"
                    },
                    ease: gsap.Bounce.easeOut
                }
            },
        ];
        animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
    }
    function elasticScale(target, duration) {
        if (duration === void 0) { duration = 1000; }
        if (typeof duration !== 'number') {
            throw new Error("animation time must be a number!");
        }
        duration = duration / 1000;
        var animations = [
            {
                target: target,
                duration: 0.01 * duration,
                vars: {
                    pixi: {
                        scale: 0
                    },
                    ease: gsap.Power0.easeNone
                }
            },
            {
                target: target,
                duration: 0.25 * duration,
                vars: {
                    pixi: {
                        scale: 1 * this.ratio
                    },
                    ease: gsap.Power0.easeNone
                }
            },
            {
                target: target,
                duration: 0.15 * duration,
                vars: {
                    pixi: {
                        scale: 0.9 * this.ratio
                    },
                    ease: gsap.Power0.easeNone
                }
            },
            {
                target: target,
                duration: 0.15 * duration,
                vars: {
                    pixi: {
                        scale: 1 * this.ratio
                    },
                    ease: gsap.Power0.easeNone
                }
            },
            {
                target: target,
                duration: 0.15 * duration,
                vars: {
                    pixi: {
                        scale: 0.9 * this.ratio
                    },
                    ease: gsap.Power0.easeNone
                }
            },
            {
                target: target,
                duration: 0.3 * duration,
                vars: {
                    pixi: {
                        scale: 1 * this.ratio
                    },
                    ease: gsap.Power0.easeNone
                }
            },
        ];
        animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
    }
    function elasticMove(target, duration) {
        if (duration === void 0) { duration = 1000; }
        if (typeof duration !== 'number') {
            throw new Error("animation time must be a number!");
        }
        duration = duration / 1000;
        var animations = [
            {
                target: target,
                duration: 0.01 * duration,
                vars: {
                    pixi: {
                        y: "-= 300"
                    }
                }
            },
            {
                target: target,
                duration: 1 * duration,
                vars: {
                    pixi: {
                        y: "+= 300"
                    },
                    ease: gsap.Elastic.easeOut.config(0.4, 0.3)
                }
            },
        ];
        animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
    }
    function spiralRotateIn(target, duration) {
        if (duration === void 0) { duration = 1000; }
        if (typeof duration !== 'number') {
            throw new Error("animation time must be a number!");
        }
        duration = duration / 1000;
        var animations = [
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
                        y: "+=" + ((target.height))
                    },
                    ease: gsap.Linear.easeNone
                }
            },
            {
                target: target,
                duration: 0.3 * duration,
                vars: {
                    pixi: {
                        alpha: 0,
                        // anchorX: 0,
                        // anchorY: 1,
                        rotation: 360
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.25,0.1 0.25,1 1,1")
                }
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
                        y: "-=" + ((target.height) / 2),
                        x: '+=' + ((target.width) / 2)
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.25,0.1 0.25,1 1,1")
                }
            },
        ];
        animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
        tl.eventCallback('onComplete', function () {
            target.anchor.set(0.5, 0.5);
            target.x -= target.width / 2;
            target.y -= target.height / 2;
            tl.eventCallback('onComplete', function () { });
        });
    }
    function wheelRotateIn(target, duration) {
        if (duration === void 0) { duration = 1000; }
        if (typeof duration !== 'number') {
            throw new Error("animation time must be a number!");
        }
        duration = duration / 1000;
        var animations = [
            {
                target: target,
                duration: 0.01,
                vars: {
                    pixi: {
                        alpha: 0,
                        rotation: 360,
                        x: "+=200"
                    },
                    ease: gsap.Power0.easeNone
                }
            },
            {
                target: target,
                duration: 0.5 * duration,
                vars: {
                    pixi: {
                        alpha: 1,
                        rotation: -20,
                        x: "-=220"
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.25,0.1 0.25,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.5 * duration,
                vars: {
                    pixi: {
                        alpha: 1,
                        rotation: 0,
                        x: '+=20'
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.25,0.1 0.25,1 1,1")
                }
            },
        ];
        animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
    }
    function topShockIn(target, duration) {
        if (duration === void 0) { duration = 1000; }
        if (typeof duration !== 'number') {
            throw new Error("animation time must be a number!");
        }
        duration = duration / 1000;
        var animations = [
            {
                target: target,
                duration: 0.01,
                vars: {
                    pixi: {
                        alpha: 0,
                        scale: 0.1 * this.ratio,
                        y: "-=220"
                    }
                }
            },
            {
                target: target,
                duration: 0.2,
                vars: {
                    pixi: {
                        alpha: 1,
                        scale: 0.2 * this.ratio,
                        y: "-=30"
                    },
                    ease: gsap.Power0.easeNone
                }
            },
            {
                target: target,
                duration: 0.4 * duration,
                vars: {
                    pixi: {
                        alpha: 1,
                        scale: 0.675 * this.ratio,
                        y: "+=310"
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.55,0.055 0.675,0.19 1,1")
                }
            },
            {
                target: target,
                duration: 0.4 * duration,
                vars: {
                    pixi: {
                        alpha: 1,
                        scale: 1 * this.ratio,
                        y: '-=60'
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.175,0.885 0.32,1 1,1")
                }
            },
        ];
        animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
    }
    function breakIn(target, duration) {
        if (duration === void 0) { duration = 1000; }
        if (typeof duration !== 'number') {
            throw new Error("animation time must be a number!");
        }
        // sprite.anchor.set(0, 1)
        // sprite.x -= sprite.width / 2
        // sprite.y += sprite.height / 2
        duration = duration / 1000;
        var animations = [
            {
                target: target,
                duration: 0.01,
                vars: {
                    pixi: {
                        anchorX: 0,
                        anchorY: 1,
                        x: "-=" + (target.width / 2),
                        y: "+=" + (target.height / 2)
                    }
                }
            },
            {
                target: target,
                duration: 0.01 * duration,
                vars: {
                    pixi: {
                        alpha: 1,
                        x: "+=300",
                        skewX: 30
                    }
                }
            },
            {
                target: target,
                duration: 0.3 * duration,
                vars: {
                    pixi: {
                        alpha: 1,
                        skewX: 8,
                        x: "-=300"
                    },
                    ease: gsap.Power0.easeNone
                }
            },
            {
                target: target,
                duration: 0.2 * duration,
                vars: {
                    pixi: {
                        skewX: -3
                    },
                    ease: gsap.Power0.easeNone
                }
            },
            {
                target: target,
                duration: 0.2 * duration,
                vars: {
                    pixi: {
                        skewX: 1
                    },
                    ease: gsap.Power0.easeNone
                }
            },
            {
                target: target,
                duration: 0.3 * duration,
                vars: {
                    pixi: {
                        skewX: 0
                    },
                    ease: gsap.Power0.easeNone
                }
            },
        ];
        animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
        tl.eventCallback('onComplete', function () {
            target.anchor.set(0.5, 0.5);
            target.x += target.width / 2;
            target.y -= target.height / 2;
            tl.eventCallback('onComplete', function () { });
        });
    }
    function swashOut(target, duration) {
        if (duration === void 0) { duration = 1000; }
        if (typeof duration !== 'number') {
            throw new Error("animation time must be a number!");
        }
        duration = duration / 1000;
        var animations = [
            {
                target: target,
                duration: 0.8 * duration,
                vars: {
                    pixi: {
                        scale: 0.8 * this.ratio
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.25,0.1 0.25,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.2 * duration,
                vars: {
                    pixi: {
                        alpha: 0,
                        scale: 0
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.25,0.1 0.25,1 1,1")
                }
            },
        ];
        animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
    }
    function foolishIn(target, duration) {
        if (duration === void 0) { duration = 1000; }
        if (typeof duration !== 'number') {
            throw new Error("animation time must be a number!");
        }
        duration = duration / 1000;
        var animations = [
            {
                target: target,
                duration: 0.01,
                vars: {
                    pixi: {
                        alpha: 0,
                        scale: 0,
                        rotation: 360
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.25,0.1 0.25,1 1,1")
                }
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
                        rotation: 0
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.25,0.1 0.25,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.2 * duration,
                vars: {
                    pixi: {
                        alpha: 1,
                        anchorX: 1,
                        anchorY: 1
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.25,0.1 0.25,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.2 * duration,
                vars: {
                    pixi: {
                        alpha: 1,
                        anchorX: 0,
                        anchorY: 1
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.25,0.1 0.25,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.2 * duration,
                vars: {
                    pixi: {
                        alpha: 1,
                        anchorX: 0,
                        anchorY: 0
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.25,0.1 0.25,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.2 * duration,
                vars: {
                    pixi: {
                        alpha: 1,
                        anchorX: 0.5,
                        anchorY: 0.5,
                        scale: 1 * this.ratio
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.25,0.1 0.25,1 1,1")
                }
            },
        ];
        animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
    }
    function hingeOut(target, duration) {
        if (duration === void 0) { duration = 1000; }
        if (typeof duration !== 'number') {
            throw new Error("animation time must be a number!");
        }
        // sprite.anchor.set(0, 0)
        // sprite.x -= sprite.width / 2
        // sprite.y -= sprite.height / 2
        duration = duration / 1000;
        var animations = [
            {
                target: target,
                duration: 0.01,
                vars: {
                    pixi: {
                        anchorX: 0,
                        anchorY: 0,
                        x: "-=" + (target.width / 2),
                        y: "-=" + (target.height / 2)
                    }
                }
            },
            {
                target: target,
                duration: 0.2 * duration,
                vars: {
                    pixi: {
                        rotation: 70
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.2 * duration,
                vars: {
                    pixi: {
                        rotation: "-=40"
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.2 * duration,
                vars: {
                    pixi: {
                        rotation: "+=20"
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.2 * duration,
                vars: {
                    pixi: {
                        rotation: "-=15"
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.2 * duration,
                vars: {
                    pixi: {
                        y: '+=300',
                        alpha: 0
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
        ];
        animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
        tl.eventCallback('onComplete', function () {
            target.anchor.set(0.5, 0.5);
            target.x += target.width / 2;
            target.y += target.height / 2;
            tl.eventCallback('onComplete', function () { });
        });
    }
    function heartBeat(target, duration) {
        if (duration === void 0) { duration = 1000; }
        if (typeof duration !== 'number') {
            throw new Error("animation time must be a number!");
        }
        duration = duration / 1000;
        var animations = [
            {
                target: target,
                duration: 0.15 * duration,
                vars: {
                    pixi: {
                        scale: 1.3 * this.ratio
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.15 * duration,
                vars: {
                    pixi: {
                        scale: 1 * this.ratio
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.15 * duration,
                vars: {
                    pixi: {
                        scale: 1.3 * this.ratio
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.15 * duration,
                vars: {
                    pixi: {
                        scale: 1 * this.ratio
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
        ];
        animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
    }
    function jelly(target, duration) {
        if (duration === void 0) { duration = 2000; }
        if (typeof duration !== 'number') {
            throw new Error("animation time must be a number!");
        }
        duration = duration / 1000;
        var animations = [
            {
                target: target,
                duration: 0.15 * duration,
                vars: {
                    pixi: {
                        scaleX: 1.25 * this.ratio,
                        scaleY: 0.75 * this.ratio
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.05 * duration,
                vars: {
                    pixi: {
                        scaleX: 0.75 * this.ratio,
                        scaleY: 1.25 * this.ratio
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.05 * duration,
                vars: {
                    pixi: {
                        scaleX: 1.15 * this.ratio,
                        scaleY: 0.85 * this.ratio
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.075 * duration,
                vars: {
                    pixi: {
                        scaleX: 0.95 * this.ratio,
                        scaleY: 1.05 * this.ratio
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.05 * duration,
                vars: {
                    pixi: {
                        scaleX: 1.05 * this.ratio,
                        scaleY: 0.95 * this.ratio
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.125 * duration,
                vars: {
                    pixi: {
                        scaleX: 1 * this.ratio,
                        scaleY: 1 * this.ratio
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
        ];
        animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
    }
    function swing1(target, duration) {
        if (duration === void 0) { duration = 2000; }
        if (typeof duration !== 'number') {
            throw new Error("animation time must be a number!");
        }
        duration = duration / 1000;
        var animations = [
            {
                target: target,
                duration: 0.01,
                vars: {
                    pixi: {
                        rotation: -30
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.5 * duration,
                vars: {
                    pixi: {
                        rotation: 30
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.5 * duration,
                vars: {
                    pixi: {
                        rotation: -30
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
        ];
        target.anchor.set(0.5, -3);
        target.y -= target.height * 3.5;
        animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
        tl.eventCallback('onComplete', function () { tl.reverse(); });
        tl.eventCallback('onReverseComplete', function () { tl.restart(); });
    }
    function swing2(target, duration) {
        if (duration === void 0) { duration = 2000; }
        if (typeof duration !== 'number') {
            throw new Error("animation time must be a number!");
        }
        duration = duration / 1000;
        var animations = [
            {
                target: target,
                duration: 0.3 * duration,
                vars: {
                    pixi: {
                        rotation: 15
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.1 * duration,
                vars: {
                    pixi: {
                        rotation: -10
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.1 * duration,
                vars: {
                    pixi: {
                        rotation: 5
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.1 * duration,
                vars: {
                    pixi: {
                        rotation: -2
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.1 * duration,
                vars: {
                    pixi: {
                        rotation: 0
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
        ];
        target.anchor.set(0.5, 0);
        target.y -= target.height / 2;
        animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
        tl.eventCallback('onComplete', function () {
            target.anchor.set(0.5, 0.5);
            target.y += target.height / 2;
            tl.eventCallback('onComplete', function () { });
        });
    }
    function swing3(target, duration) {
        if (duration === void 0) { duration = 2000; }
        if (typeof duration !== 'number') {
            throw new Error("animation time must be a number!");
        }
        duration = duration / 1000;
        var animations = [
            {
                target: target,
                duration: 0.075 * duration,
                vars: {
                    pixi: {
                        rotation: -5,
                        x: '-=25'
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.075 * duration,
                vars: {
                    pixi: {
                        rotation: 3,
                        x: '+=45'
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.075 * duration,
                vars: {
                    pixi: {
                        rotation: -3,
                        x: '-=35'
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.075 * duration,
                vars: {
                    pixi: {
                        rotation: 2,
                        x: '+=25'
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.075 * duration,
                vars: {
                    pixi: {
                        rotation: -1,
                        x: '-=15'
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.075 * duration,
                vars: {
                    pixi: {
                        rotation: 0,
                        x: '+=5'
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
        ];
        animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
    }
    function swing4(target, duration) {
        if (duration === void 0) { duration = 2000; }
        if (typeof duration !== 'number') {
            throw new Error("animation time must be a number!");
        }
        duration = duration / 1000;
        var animations = [
            {
                target: target,
                duration: 0.05 * duration,
                vars: {
                    pixi: {
                        scale: 0.8 * this.ratio,
                        rotation: -5
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.1 * duration,
                vars: {
                    pixi: {
                        scale: 1.1 * this.ratio,
                        rotation: 3
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.05 * duration,
                vars: {
                    pixi: {
                        scale: 1.1 * this.ratio,
                        rotation: -3
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.05 * duration,
                vars: {
                    pixi: {
                        scale: 1.1 * this.ratio,
                        rotation: 3
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.05 * duration,
                vars: {
                    pixi: {
                        scale: 1.1 * this.ratio,
                        rotation: -3
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.05 * duration,
                vars: {
                    pixi: {
                        scale: 1.1 * this.ratio,
                        rotation: 3
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.05 * duration,
                vars: {
                    pixi: {
                        scale: 1.1 * this.ratio,
                        rotation: -3
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.05 * duration,
                vars: {
                    pixi: {
                        scale: 1.1 * this.ratio,
                        rotation: 3
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
            {
                target: target,
                duration: 0.05 * duration,
                vars: {
                    pixi: {
                        scale: 1 * this.ratio,
                        rotation: 0
                    },
                    ease: CustomEase.create("custom", "M0,0 C0.42,0 0.58,1 1,1")
                }
            },
        ];
        animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    PixiPlugin.registerPIXI(PIXI);
    function animation(target, options) {
        var ease = options.ease, _a = options.delay, _b = options.duration, duration = _b === void 0 ? 1000 : _b, _c = options.repeat, repeat = _c === void 0 ? 0 : _c, _d = options.onStart, onStart = _d === void 0 ? function () { } : _d, _e = options.onUpdate, onUpdate = _e === void 0 ? function () { } : _e, _f = options.onComplete, onComplete = _f === void 0 ? function () { } : _f, _g = options.onReverseComplete, onReverseComplete = _g === void 0 ? function () { } : _g, rest = __rest(options, ["ease", "delay", "duration", "repeat", "onStart", "onUpdate", "onComplete", "onReverseComplete"]);
        var count = 1;
        var animate = gsap.TweenLite.to(target, duration / 1000, {
            pixi: __assign({}, rest),
            onStart: function () {
                onStart(animate);
            },
            onComplete: function () {
                onComplete(animate);
                if (repeat === 'infinite' || count < repeat) {
                    count++;
                }
            },
            onUpdate: function () {
                var progress = (animate.progress() * 100).toFixed(2);
                onUpdate(progress, animate);
            },
            onReverseComplete: function () {
                if (repeat === 'infinite' || count < repeat) {
                    animate.restart();
                    count++;
                }
                onReverseComplete(animate);
            }
        });
    }
    function animate(target, options) {
        animation(target, options);
    }

    exports.animate = animate;
    exports.blink = blink;
    exports.bomb1 = bomb1;
    exports.breakIn = breakIn;
    exports.elasticMove = elasticMove;
    exports.elasticScale = elasticScale;
    exports.foolishIn = foolishIn;
    exports.freeFall = freeFall;
    exports.heartBeat = heartBeat;
    exports.hingeOut = hingeOut;
    exports.jelly = jelly;
    exports.shakeInAlarm = shakeInAlarm;
    exports.shakeInHard = shakeInHard;
    exports.shakeInHorz = shakeInHorz;
    exports.shakeInRotate = shakeInRotate;
    exports.shakeInVetc = shakeInVetc;
    exports.spiralRotateIn = spiralRotateIn;
    exports.swashOut = swashOut;
    exports.swing1 = swing1;
    exports.swing2 = swing2;
    exports.swing3 = swing3;
    exports.swing4 = swing4;
    exports.topShockIn = topShockIn;
    exports.wheelRotateIn = wheelRotateIn;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=animate.js.map
