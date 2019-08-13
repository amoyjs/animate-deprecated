(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('gsap'), require('pixi.js')) :
	typeof define === 'function' && define.amd ? define(['exports', 'gsap', 'pixi.js'], factory) :
	(global = global || self, factory(global.animate = {}, global.gsap, global.PIXI));
}(this, function (exports, gsap, PIXI) { 'use strict';

	/*!
	 * VERSION: 2.1.3
	 * DATE: 2019-05-17
	 * UPDATES AND DOCS AT: http://greensock.com
	 *
	 * @license Copyright (c) 2008-2019, GreenSock. All rights reserved.
	 * This work is subject to the terms at http://greensock.com/standard-license or for
	 * Club GreenSock members, the software agreement that was issued with your membership.
	 *
	 * @author: Jack Doyle, jack@greensock.com
	 */
	/* eslint-disable */

	/* ES6 changes:
		- declare and export _gsScope at top.
		- set var TweenLite = the result of the main function
		- export default TweenLite at the bottom
		- return TweenLite at the bottom of the main function
		- pass in _gsScope as the first parameter of the main function (which is actually at the bottom)
		- remove the "export to multiple environments" in Definition().
	 */
	var _gsScope = (typeof(window) !== "undefined") ? window : (typeof(module) !== "undefined" && module.exports && typeof(global) !== "undefined") ? global : undefined || {};

	var TweenLite = (function(window) {
			var _exports = {},
				_doc = window.document,
				_globals = window.GreenSockGlobals = window.GreenSockGlobals || window;
			if (_globals.TweenLite) {
				return _globals.TweenLite; //in case the core set of classes is already loaded, don't instantiate twice.
			}
			var _namespace = function(ns) {
					var a = ns.split("."),
						p = _globals, i;
					for (i = 0; i < a.length; i++) {
						p[a[i]] = p = p[a[i]] || {};
					}
					return p;
				},
				gs = _namespace("com.greensock"),
				_tinyNum = 0.00000001,
				_slice = function(a) { //don't use Array.prototype.slice.call(target, 0) because that doesn't work in IE8 with a NodeList that's returned by querySelectorAll()
					var b = [],
						l = a.length,
						i;
					for (i = 0; i !== l; b.push(a[i++])) {}
					return b;
				},
				_emptyFunc = function() {},
				_isArray = (function() { //works around issues in iframe environments where the Array global isn't shared, thus if the object originates in a different window/iframe, "(obj instanceof Array)" will evaluate false. We added some speed optimizations to avoid Object.prototype.toString.call() unless it's absolutely necessary because it's VERY slow (like 20x slower)
					var toString = Object.prototype.toString,
						array = toString.call([]);
					return function(obj) {
						return obj != null && (obj instanceof Array || (typeof(obj) === "object" && !!obj.push && toString.call(obj) === array));
					};
				}()),
				a, i, p, _ticker, _tickerActive,
				_defLookup = {},

				/**
				 * @constructor
				 * Defines a GreenSock class, optionally with an array of dependencies that must be instantiated first and passed into the definition.
				 * This allows users to load GreenSock JS files in any order even if they have interdependencies (like CSSPlugin extends TweenPlugin which is
				 * inside TweenLite.js, but if CSSPlugin is loaded first, it should wait to run its code until TweenLite.js loads and instantiates TweenPlugin
				 * and then pass TweenPlugin to CSSPlugin's definition). This is all done automatically and internally.
				 *
				 * Every definition will be added to a "com.greensock" global object (typically window, but if a window.GreenSockGlobals object is found,
				 * it will go there as of v1.7). For example, TweenLite will be found at window.com.greensock.TweenLite and since it's a global class that should be available anywhere,
				 * it is ALSO referenced at window.TweenLite. However some classes aren't considered global, like the base com.greensock.core.Animation class, so
				 * those will only be at the package like window.com.greensock.core.Animation. Again, if you define a GreenSockGlobals object on the window, everything
				 * gets tucked neatly inside there instead of on the window directly. This allows you to do advanced things like load multiple versions of GreenSock
				 * files and put them into distinct objects (imagine a banner ad uses a newer version but the main site uses an older one). In that case, you could
				 * sandbox the banner one like:
				 *
				 * <script>
				 *     var gs = window.GreenSockGlobals = {}; //the newer version we're about to load could now be referenced in a "gs" object, like gs.TweenLite.to(...). Use whatever alias you want as long as it's unique, "gs" or "banner" or whatever.
				 * </script>
				 * <script src="js/greensock/v1.7/TweenMax.js"></script>
				 * <script>
				 *     window.GreenSockGlobals = window._gsQueue = window._gsDefine = null; //reset it back to null (along with the special _gsQueue variable) so that the next load of TweenMax affects the window and we can reference things directly like TweenLite.to(...)
				 * </script>
				 * <script src="js/greensock/v1.6/TweenMax.js"></script>
				 * <script>
				 *     gs.TweenLite.to(...); //would use v1.7
				 *     TweenLite.to(...); //would use v1.6
				 * </script>
				 *
				 * @param {!string} ns The namespace of the class definition, leaving off "com.greensock." as that's assumed. For example, "TweenLite" or "plugins.CSSPlugin" or "easing.Back".
				 * @param {!Array.<string>} dependencies An array of dependencies (described as their namespaces minus "com.greensock." prefix). For example ["TweenLite","plugins.TweenPlugin","core.Animation"]
				 * @param {!function():Object} func The function that should be called and passed the resolved dependencies which will return the actual class for this definition.
				 * @param {boolean=} global If true, the class will be added to the global scope (typically window unless you define a window.GreenSockGlobals object)
				 */
				Definition = function(ns, dependencies, func, global) {
					this.sc = (_defLookup[ns]) ? _defLookup[ns].sc : []; //subclasses
					_defLookup[ns] = this;
					this.gsClass = null;
					this.func = func;
					var _classes = [];
					this.check = function(init) {
						var i = dependencies.length,
							missing = i,
							cur, a, n, cl;
						while (--i > -1) {
							if ((cur = _defLookup[dependencies[i]] || new Definition(dependencies[i], [])).gsClass) {
								_classes[i] = cur.gsClass;
								missing--;
							} else if (init) {
								cur.sc.push(this);
							}
						}
						if (missing === 0 && func) {
							a = ("com.greensock." + ns).split(".");
							n = a.pop();
							cl = _namespace(a.join("."))[n] = this.gsClass = func.apply(func, _classes);

							//exports to multiple environments
							if (global) {
								_globals[n] = _exports[n] = cl; //provides a way to avoid global namespace pollution. By default, the main classes like TweenLite, Power1, Strong, etc. are added to window unless a GreenSockGlobals is defined. So if you want to have things added to a custom object instead, just do something like window.GreenSockGlobals = {} before loading any GreenSock files. You can even set up an alias like window.GreenSockGlobals = windows.gs = {} so that you can access everything like gs.TweenLite. Also remember that ALL classes are added to the window.com.greensock object (in their respective packages, like com.greensock.easing.Power1, com.greensock.TweenLite, etc.)
								/*
								if (typeof(module) !== "undefined" && module.exports) { //node
									if (ns === moduleName) {
										module.exports = _exports[moduleName] = cl;
										for (i in _exports) {
											cl[i] = _exports[i];
										}
									} else if (_exports[moduleName]) {
										_exports[moduleName][n] = cl;
									}
								} else if (typeof(define) === "function" && define.amd){ //AMD
									define((window.GreenSockAMDPath ? window.GreenSockAMDPath + "/" : "") + ns.split(".").pop(), [], function() { return cl; });
								}
								*/
							}
							for (i = 0; i < this.sc.length; i++) {
								this.sc[i].check();
							}
						}
					};
					this.check(true);
				},

				//used to create Definition instances (which basically registers a class that has dependencies).
				_gsDefine = window._gsDefine = function(ns, dependencies, func, global) {
					return new Definition(ns, dependencies, func, global);
				},

				//a quick way to create a class that doesn't have any dependencies. Returns the class, but first registers it in the GreenSock namespace so that other classes can grab it (other classes might be dependent on the class).
				_class = gs._class = function(ns, func, global) {
					func = func || function() {};
					_gsDefine(ns, [], function(){ return func; }, global);
					return func;
				};

			_gsDefine.globals = _globals;



	/*
	 * ----------------------------------------------------------------
	 * Ease
	 * ----------------------------------------------------------------
	 */
			var _baseParams = [0, 0, 1, 1],
				Ease = _class("easing.Ease", function(func, extraParams, type, power) {
					this._func = func;
					this._type = type || 0;
					this._power = power || 0;
					this._params = extraParams ? _baseParams.concat(extraParams) : _baseParams;
				}, true),
				_easeMap = Ease.map = {},
				_easeReg = Ease.register = function(ease, names, types, create) {
					var na = names.split(","),
						i = na.length,
						ta = (types || "easeIn,easeOut,easeInOut").split(","),
						e, name, j, type;
					while (--i > -1) {
						name = na[i];
						e = create ? _class("easing."+name, null, true) : gs.easing[name] || {};
						j = ta.length;
						while (--j > -1) {
							type = ta[j];
							_easeMap[name + "." + type] = _easeMap[type + name] = e[type] = ease.getRatio ? ease : ease[type] || new ease();
						}
					}
				};

			p = Ease.prototype;
			p._calcEnd = false;
			p.getRatio = function(p) {
				if (this._func) {
					this._params[0] = p;
					return this._func.apply(null, this._params);
				}
				var t = this._type,
					pw = this._power,
					r = (t === 1) ? 1 - p : (t === 2) ? p : (p < 0.5) ? p * 2 : (1 - p) * 2;
				if (pw === 1) {
					r *= r;
				} else if (pw === 2) {
					r *= r * r;
				} else if (pw === 3) {
					r *= r * r * r;
				} else if (pw === 4) {
					r *= r * r * r * r;
				}
				return (t === 1) ? 1 - r : (t === 2) ? r : (p < 0.5) ? r / 2 : 1 - (r / 2);
			};

			//create all the standard eases like Linear, Quad, Cubic, Quart, Quint, Strong, Power0, Power1, Power2, Power3, and Power4 (each with easeIn, easeOut, and easeInOut)
			a = ["Linear","Quad","Cubic","Quart","Quint,Strong"];
			i = a.length;
			while (--i > -1) {
				p = a[i]+",Power"+i;
				_easeReg(new Ease(null,null,1,i), p, "easeOut", true);
				_easeReg(new Ease(null,null,2,i), p, "easeIn" + ((i === 0) ? ",easeNone" : ""));
				_easeReg(new Ease(null,null,3,i), p, "easeInOut");
			}
			_easeMap.linear = gs.easing.Linear.easeIn;
			_easeMap.swing = gs.easing.Quad.easeInOut; //for jQuery folks


	/*
	 * ----------------------------------------------------------------
	 * EventDispatcher
	 * ----------------------------------------------------------------
	 */
			var EventDispatcher = _class("events.EventDispatcher", function(target) {
				this._listeners = {};
				this._eventTarget = target || this;
			});
			p = EventDispatcher.prototype;

			p.addEventListener = function(type, callback, scope, useParam, priority) {
				priority = priority || 0;
				var list = this._listeners[type],
					index = 0,
					listener, i;
				if (this === _ticker && !_tickerActive) {
					_ticker.wake();
				}
				if (list == null) {
					this._listeners[type] = list = [];
				}
				i = list.length;
				while (--i > -1) {
					listener = list[i];
					if (listener.c === callback && listener.s === scope) {
						list.splice(i, 1);
					} else if (index === 0 && listener.pr < priority) {
						index = i + 1;
					}
				}
				list.splice(index, 0, {c:callback, s:scope, up:useParam, pr:priority});
			};

			p.removeEventListener = function(type, callback) {
				var list = this._listeners[type], i;
				if (list) {
					i = list.length;
					while (--i > -1) {
						if (list[i].c === callback) {
							list.splice(i, 1);
							return;
						}
					}
				}
			};

			p.dispatchEvent = function(type) {
				var list = this._listeners[type],
					i, t, listener;
				if (list) {
					i = list.length;
					if (i > 1) {
						list = list.slice(0); //in case addEventListener() is called from within a listener/callback (otherwise the index could change, resulting in a skip)
					}
					t = this._eventTarget;
					while (--i > -1) {
						listener = list[i];
						if (listener) {
							if (listener.up) {
								listener.c.call(listener.s || t, {type:type, target:t});
							} else {
								listener.c.call(listener.s || t);
							}
						}
					}
				}
			};


	/*
	 * ----------------------------------------------------------------
	 * Ticker
	 * ----------------------------------------------------------------
	 */
	 		var _reqAnimFrame = window.requestAnimationFrame,
				_cancelAnimFrame = window.cancelAnimationFrame,
				_getTime = Date.now || function() {return new Date().getTime();},
				_lastUpdate = _getTime();

			//now try to determine the requestAnimationFrame and cancelAnimationFrame functions and if none are found, we'll use a setTimeout()/clearTimeout() polyfill.
			a = ["ms","moz","webkit","o"];
			i = a.length;
			while (--i > -1 && !_reqAnimFrame) {
				_reqAnimFrame = window[a[i] + "RequestAnimationFrame"];
				_cancelAnimFrame = window[a[i] + "CancelAnimationFrame"] || window[a[i] + "CancelRequestAnimationFrame"];
			}

			_class("Ticker", function(fps, useRAF) {
				var _self = this,
					_startTime = _getTime(),
					_useRAF = (useRAF !== false && _reqAnimFrame) ? "auto" : false,
					_lagThreshold = 500,
					_adjustedLag = 33,
					_tickWord = "tick", //helps reduce gc burden
					_fps, _req, _id, _gap, _nextTime,
					_tick = function(manual) {
						var elapsed = _getTime() - _lastUpdate,
							overlap, dispatch;
						if (elapsed > _lagThreshold) {
							_startTime += elapsed - _adjustedLag;
						}
						_lastUpdate += elapsed;
						_self.time = (_lastUpdate - _startTime) / 1000;
						overlap = _self.time - _nextTime;
						if (!_fps || overlap > 0 || manual === true) {
							_self.frame++;
							_nextTime += overlap + (overlap >= _gap ? 0.004 : _gap - overlap);
							dispatch = true;
						}
						if (manual !== true) { //make sure the request is made before we dispatch the "tick" event so that timing is maintained. Otherwise, if processing the "tick" requires a bunch of time (like 15ms) and we're using a setTimeout() that's based on 16.7ms, it'd technically take 31.7ms between frames otherwise.
							_id = _req(_tick);
						}
						if (dispatch) {
							_self.dispatchEvent(_tickWord);
						}
					};

				EventDispatcher.call(_self);
				_self.time = _self.frame = 0;
				_self.tick = function() {
					_tick(true);
				};

				_self.lagSmoothing = function(threshold, adjustedLag) {
					if (!arguments.length) { //if lagSmoothing() is called with no arguments, treat it like a getter that returns a boolean indicating if it's enabled or not. This is purposely undocumented and is for internal use.
						return (_lagThreshold < 1 / _tinyNum);
					}
					_lagThreshold = threshold || (1 / _tinyNum); //zero should be interpreted as basically unlimited
					_adjustedLag = Math.min(adjustedLag, _lagThreshold, 0);
				};

				_self.sleep = function() {
					if (_id == null) {
						return;
					}
					if (!_useRAF || !_cancelAnimFrame) {
						clearTimeout(_id);
					} else {
						_cancelAnimFrame(_id);
					}
					_req = _emptyFunc;
					_id = null;
					if (_self === _ticker) {
						_tickerActive = false;
					}
				};

				_self.wake = function(seamless) {
					if (_id !== null) {
						_self.sleep();
					} else if (seamless) {
						_startTime += -_lastUpdate + (_lastUpdate = _getTime());
					} else if (_self.frame > 10) { //don't trigger lagSmoothing if we're just waking up, and make sure that at least 10 frames have elapsed because of the iOS bug that we work around below with the 1.5-second setTimout().
						_lastUpdate = _getTime() - _lagThreshold + 5;
					}
					_req = (_fps === 0) ? _emptyFunc : (!_useRAF || !_reqAnimFrame) ? function(f) { return setTimeout(f, ((_nextTime - _self.time) * 1000 + 1) | 0); } : _reqAnimFrame;
					if (_self === _ticker) {
						_tickerActive = true;
					}
					_tick(2);
				};

				_self.fps = function(value) {
					if (!arguments.length) {
						return _fps;
					}
					_fps = value;
					_gap = 1 / (_fps || 60);
					_nextTime = this.time + _gap;
					_self.wake();
				};

				_self.useRAF = function(value) {
					if (!arguments.length) {
						return _useRAF;
					}
					_self.sleep();
					_useRAF = value;
					_self.fps(_fps);
				};
				_self.fps(fps);

				//a bug in iOS 6 Safari occasionally prevents the requestAnimationFrame from working initially, so we use a 1.5-second timeout that automatically falls back to setTimeout() if it senses this condition.
				setTimeout(function() {
					if (_useRAF === "auto" && _self.frame < 5 && (_doc || {}).visibilityState !== "hidden") {
						_self.useRAF(false);
					}
				}, 1500);
			});

			p = gs.Ticker.prototype = new gs.events.EventDispatcher();
			p.constructor = gs.Ticker;


	/*
	 * ----------------------------------------------------------------
	 * Animation
	 * ----------------------------------------------------------------
	 */
			var Animation = _class("core.Animation", function(duration, vars) {
					this.vars = vars = vars || {};
					this._duration = this._totalDuration = duration || 0;
					this._delay = Number(vars.delay) || 0;
					this._timeScale = 1;
					this._active = !!vars.immediateRender;
					this.data = vars.data;
					this._reversed = !!vars.reversed;

					if (!_rootTimeline) {
						return;
					}
					if (!_tickerActive) { //some browsers (like iOS 6 Safari) shut down JavaScript execution when the tab is disabled and they [occasionally] neglect to start up requestAnimationFrame again when returning - this code ensures that the engine starts up again properly.
						_ticker.wake();
					}

					var tl = this.vars.useFrames ? _rootFramesTimeline : _rootTimeline;
					tl.add(this, tl._time);

					if (this.vars.paused) {
						this.paused(true);
					}
				});

			_ticker = Animation.ticker = new gs.Ticker();
			p = Animation.prototype;
			p._dirty = p._gc = p._initted = p._paused = false;
			p._totalTime = p._time = 0;
			p._rawPrevTime = -1;
			p._next = p._last = p._onUpdate = p._timeline = p.timeline = null;
			p._paused = false;


			//some browsers (like iOS) occasionally drop the requestAnimationFrame event when the user switches to a different tab and then comes back again, so we use a 2-second setTimeout() to sense if/when that condition occurs and then wake() the ticker.
			var _checkTimeout = function() {
					if (_tickerActive && _getTime() - _lastUpdate > 2000 && ((_doc || {}).visibilityState !== "hidden" || !_ticker.lagSmoothing())) { //note: if the tab is hidden, we should still wake if lagSmoothing has been disabled.
						_ticker.wake();
					}
					var t = setTimeout(_checkTimeout, 2000);
					if (t.unref) {
						// allows a node process to exit even if the timeout’s callback hasn't been invoked. Without it, the node process could hang as this function is called every two seconds.
						t.unref();
					}
				};
			_checkTimeout();


			p.play = function(from, suppressEvents) {
				if (from != null) {
					this.seek(from, suppressEvents);
				}
				return this.reversed(false).paused(false);
			};

			p.pause = function(atTime, suppressEvents) {
				if (atTime != null) {
					this.seek(atTime, suppressEvents);
				}
				return this.paused(true);
			};

			p.resume = function(from, suppressEvents) {
				if (from != null) {
					this.seek(from, suppressEvents);
				}
				return this.paused(false);
			};

			p.seek = function(time, suppressEvents) {
				return this.totalTime(Number(time), suppressEvents !== false);
			};

			p.restart = function(includeDelay, suppressEvents) {
				return this.reversed(false).paused(false).totalTime(includeDelay ? -this._delay : 0, (suppressEvents !== false), true);
			};

			p.reverse = function(from, suppressEvents) {
				if (from != null) {
					this.seek((from || this.totalDuration()), suppressEvents);
				}
				return this.reversed(true).paused(false);
			};

			p.render = function(time, suppressEvents, force) {
				//stub - we override this method in subclasses.
			};

			p.invalidate = function() {
				this._time = this._totalTime = 0;
				this._initted = this._gc = false;
				this._rawPrevTime = -1;
				if (this._gc || !this.timeline) {
					this._enabled(true);
				}
				return this;
			};

			p.isActive = function() {
				var tl = this._timeline, //the 2 root timelines won't have a _timeline; they're always active.
					startTime = this._startTime,
					rawTime;
				return (!tl || (!this._gc && !this._paused && tl.isActive() && (rawTime = tl.rawTime(true)) >= startTime && rawTime < startTime + this.totalDuration() / this._timeScale - _tinyNum));
			};

			p._enabled = function (enabled, ignoreTimeline) {
				if (!_tickerActive) {
					_ticker.wake();
				}
				this._gc = !enabled;
				this._active = this.isActive();
				if (ignoreTimeline !== true) {
					if (enabled && !this.timeline) {
						this._timeline.add(this, this._startTime - this._delay);
					} else if (!enabled && this.timeline) {
						this._timeline._remove(this, true);
					}
				}
				return false;
			};


			p._kill = function(vars, target) {
				return this._enabled(false, false);
			};

			p.kill = function(vars, target) {
				this._kill(vars, target);
				return this;
			};

			p._uncache = function(includeSelf) {
				var tween = includeSelf ? this : this.timeline;
				while (tween) {
					tween._dirty = true;
					tween = tween.timeline;
				}
				return this;
			};

			p._swapSelfInParams = function(params) {
				var i = params.length,
					copy = params.concat();
				while (--i > -1) {
					if (params[i] === "{self}") {
						copy[i] = this;
					}
				}
				return copy;
			};

			p._callback = function(type) {
				var v = this.vars,
					callback = v[type],
					params = v[type + "Params"],
					scope = v[type + "Scope"] || v.callbackScope || this,
					l = params ? params.length : 0;
				switch (l) { //speed optimization; call() is faster than apply() so use it when there are only a few parameters (which is by far most common). Previously we simply did var v = this.vars; v[type].apply(v[type + "Scope"] || v.callbackScope || this, v[type + "Params"] || _blankArray);
					case 0: callback.call(scope); break;
					case 1: callback.call(scope, params[0]); break;
					case 2: callback.call(scope, params[0], params[1]); break;
					default: callback.apply(scope, params);
				}
			};

	//----Animation getters/setters --------------------------------------------------------

			p.eventCallback = function(type, callback, params, scope) {
				if ((type || "").substr(0,2) === "on") {
					var v = this.vars;
					if (arguments.length === 1) {
						return v[type];
					}
					if (callback == null) {
						delete v[type];
					} else {
						v[type] = callback;
						v[type + "Params"] = (_isArray(params) && params.join("").indexOf("{self}") !== -1) ? this._swapSelfInParams(params) : params;
						v[type + "Scope"] = scope;
					}
					if (type === "onUpdate") {
						this._onUpdate = callback;
					}
				}
				return this;
			};

			p.delay = function(value) {
				if (!arguments.length) {
					return this._delay;
				}
				if (this._timeline.smoothChildTiming) {
					this.startTime( this._startTime + value - this._delay );
				}
				this._delay = value;
				return this;
			};

			p.duration = function(value) {
				if (!arguments.length) {
					this._dirty = false;
					return this._duration;
				}
				this._duration = this._totalDuration = value;
				this._uncache(true); //true in case it's a TweenMax or TimelineMax that has a repeat - we'll need to refresh the totalDuration.
				if (this._timeline.smoothChildTiming) if (this._time > 0) if (this._time < this._duration) if (value !== 0) {
					this.totalTime(this._totalTime * (value / this._duration), true);
				}
				return this;
			};

			p.totalDuration = function(value) {
				this._dirty = false;
				return (!arguments.length) ? this._totalDuration : this.duration(value);
			};

			p.time = function(value, suppressEvents) {
				if (!arguments.length) {
					return this._time;
				}
				if (this._dirty) {
					this.totalDuration();
				}
				return this.totalTime((value > this._duration) ? this._duration : value, suppressEvents);
			};

			p.totalTime = function(time, suppressEvents, uncapped) {
				if (!_tickerActive) {
					_ticker.wake();
				}
				if (!arguments.length) {
					return this._totalTime;
				}
				if (this._timeline) {
					if (time < 0 && !uncapped) {
						time += this.totalDuration();
					}
					if (this._timeline.smoothChildTiming) {
						if (this._dirty) {
							this.totalDuration();
						}
						var totalDuration = this._totalDuration,
							tl = this._timeline;
						if (time > totalDuration && !uncapped) {
							time = totalDuration;
						}
						this._startTime = (this._paused ? this._pauseTime : tl._time) - ((!this._reversed ? time : totalDuration - time) / this._timeScale);
						if (!tl._dirty) { //for performance improvement. If the parent's cache is already dirty, it already took care of marking the ancestors as dirty too, so skip the function call here.
							this._uncache(false);
						}
						//in case any of the ancestor timelines had completed but should now be enabled, we should reset their totalTime() which will also ensure that they're lined up properly and enabled. Skip for animations that are on the root (wasteful). Example: a TimelineLite.exportRoot() is performed when there's a paused tween on the root, the export will not complete until that tween is unpaused, but imagine a child gets restarted later, after all [unpaused] tweens have completed. The startTime of that child would get pushed out, but one of the ancestors may have completed.
						if (tl._timeline) {
							while (tl._timeline) {
								if (tl._timeline._time !== (tl._startTime + tl._totalTime) / tl._timeScale) {
									tl.totalTime(tl._totalTime, true);
								}
								tl = tl._timeline;
							}
						}
					}
					if (this._gc) {
						this._enabled(true, false);
					}
					if (this._totalTime !== time || this._duration === 0) {
						if (_lazyTweens.length) {
							_lazyRender();
						}
						this.render(time, suppressEvents, false);
						if (_lazyTweens.length) { //in case rendering caused any tweens to lazy-init, we should render them because typically when someone calls seek() or time() or progress(), they expect an immediate render.
							_lazyRender();
						}
					}
				}
				return this;
			};

			p.progress = p.totalProgress = function(value, suppressEvents) {
				var duration = this.duration();
				return (!arguments.length) ? (duration ? this._time / duration : this.ratio) : this.totalTime(duration * value, suppressEvents);
			};

			p.startTime = function(value) {
				if (!arguments.length) {
					return this._startTime;
				}
				if (value !== this._startTime) {
					this._startTime = value;
					if (this.timeline) if (this.timeline._sortChildren) {
						this.timeline.add(this, value - this._delay); //ensures that any necessary re-sequencing of Animations in the timeline occurs to make sure the rendering order is correct.
					}
				}
				return this;
			};

			p.endTime = function(includeRepeats) {
				return this._startTime + ((includeRepeats != false) ? this.totalDuration() : this.duration()) / this._timeScale;
			};

			p.timeScale = function(value) {
				if (!arguments.length) {
					return this._timeScale;
				}
				var pauseTime, t;
				value = value || _tinyNum; //can't allow zero because it'll throw the math off
				if (this._timeline && this._timeline.smoothChildTiming) {
					pauseTime = this._pauseTime;
					t = (pauseTime || pauseTime === 0) ? pauseTime : this._timeline.totalTime();
					this._startTime = t - ((t - this._startTime) * this._timeScale / value);
				}
				this._timeScale = value;
				t = this.timeline;
				while (t && t.timeline) { //must update the duration/totalDuration of all ancestor timelines immediately in case in the middle of a render loop, one tween alters another tween's timeScale which shoves its startTime before 0, forcing the parent timeline to shift around and shiftChildren() which could affect that next tween's render (startTime). Doesn't matter for the root timeline though.
					t._dirty = true;
					t.totalDuration();
					t = t.timeline;
				}
				return this;
			};

			p.reversed = function(value) {
				if (!arguments.length) {
					return this._reversed;
				}
				if (value != this._reversed) {
					this._reversed = value;
					this.totalTime(((this._timeline && !this._timeline.smoothChildTiming) ? this.totalDuration() - this._totalTime : this._totalTime), true);
				}
				return this;
			};

			p.paused = function(value) {
				if (!arguments.length) {
					return this._paused;
				}
				var tl = this._timeline,
					raw, elapsed;
				if (value != this._paused) if (tl) {
					if (!_tickerActive && !value) {
						_ticker.wake();
					}
					raw = tl.rawTime();
					elapsed = raw - this._pauseTime;
					if (!value && tl.smoothChildTiming) {
						this._startTime += elapsed;
						this._uncache(false);
					}
					this._pauseTime = value ? raw : null;
					this._paused = value;
					this._active = this.isActive();
					if (!value && elapsed !== 0 && this._initted && this.duration()) {
						raw = tl.smoothChildTiming ? this._totalTime : (raw - this._startTime) / this._timeScale;
						this.render(raw, (raw === this._totalTime), true); //in case the target's properties changed via some other tween or manual update by the user, we should force a render.
					}
				}
				if (this._gc && !value) {
					this._enabled(true, false);
				}
				return this;
			};


	/*
	 * ----------------------------------------------------------------
	 * SimpleTimeline
	 * ----------------------------------------------------------------
	 */
			var SimpleTimeline = _class("core.SimpleTimeline", function(vars) {
				Animation.call(this, 0, vars);
				this.autoRemoveChildren = this.smoothChildTiming = true;
			});

			p = SimpleTimeline.prototype = new Animation();
			p.constructor = SimpleTimeline;
			p.kill()._gc = false;
			p._first = p._last = p._recent = null;
			p._sortChildren = false;

			p.add = p.insert = function(child, position, align, stagger) {
				var prevTween, st;
				child._startTime = Number(position || 0) + child._delay;
				if (child._paused) if (this !== child._timeline) { //we only adjust the _pauseTime if it wasn't in this timeline already. Remember, sometimes a tween will be inserted again into the same timeline when its startTime is changed so that the tweens in the TimelineLite/Max are re-ordered properly in the linked list (so everything renders in the proper order).
					child._pauseTime = this.rawTime() - (child._timeline.rawTime() - child._pauseTime);
				}
				if (child.timeline) {
					child.timeline._remove(child, true); //removes from existing timeline so that it can be properly added to this one.
				}
				child.timeline = child._timeline = this;
				if (child._gc) {
					child._enabled(true, true);
				}
				prevTween = this._last;
				if (this._sortChildren) {
					st = child._startTime;
					while (prevTween && prevTween._startTime > st) {
						prevTween = prevTween._prev;
					}
				}
				if (prevTween) {
					child._next = prevTween._next;
					prevTween._next = child;
				} else {
					child._next = this._first;
					this._first = child;
				}
				if (child._next) {
					child._next._prev = child;
				} else {
					this._last = child;
				}
				child._prev = prevTween;
				this._recent = child;
				if (this._timeline) {
					this._uncache(true);
				}
				return this;
			};

			p._remove = function(tween, skipDisable) {
				if (tween.timeline === this) {
					if (!skipDisable) {
						tween._enabled(false, true);
					}

					if (tween._prev) {
						tween._prev._next = tween._next;
					} else if (this._first === tween) {
						this._first = tween._next;
					}
					if (tween._next) {
						tween._next._prev = tween._prev;
					} else if (this._last === tween) {
						this._last = tween._prev;
					}
					tween._next = tween._prev = tween.timeline = null;
					if (tween === this._recent) {
						this._recent = this._last;
					}

					if (this._timeline) {
						this._uncache(true);
					}
				}
				return this;
			};

			p.render = function(time, suppressEvents, force) {
				var tween = this._first,
					next;
				this._totalTime = this._time = this._rawPrevTime = time;
				while (tween) {
					next = tween._next; //record it here because the value could change after rendering...
					if (tween._active || (time >= tween._startTime && !tween._paused && !tween._gc)) {
						if (!tween._reversed) {
							tween.render((time - tween._startTime) * tween._timeScale, suppressEvents, force);
						} else {
							tween.render(((!tween._dirty) ? tween._totalDuration : tween.totalDuration()) - ((time - tween._startTime) * tween._timeScale), suppressEvents, force);
						}
					}
					tween = next;
				}
			};

			p.rawTime = function() {
				if (!_tickerActive) {
					_ticker.wake();
				}
				return this._totalTime;
			};

	/*
	 * ----------------------------------------------------------------
	 * TweenLite
	 * ----------------------------------------------------------------
	 */
			var TweenLite = _class("TweenLite", function(target, duration, vars) {
					Animation.call(this, duration, vars);
					this.render = TweenLite.prototype.render; //speed optimization (avoid prototype lookup on this "hot" method)

					if (target == null) {
						throw "Cannot tween a null target.";
					}

					this.target = target = (typeof(target) !== "string") ? target : TweenLite.selector(target) || target;

					var isSelector = (target.jquery || (target.length && target !== window && target[0] && (target[0] === window || (target[0].nodeType && target[0].style && !target.nodeType)))),
						overwrite = this.vars.overwrite,
						i, targ, targets;

					this._overwrite = overwrite = (overwrite == null) ? _overwriteLookup[TweenLite.defaultOverwrite] : (typeof(overwrite) === "number") ? overwrite >> 0 : _overwriteLookup[overwrite];

					if ((isSelector || target instanceof Array || (target.push && _isArray(target))) && typeof(target[0]) !== "number") {
						this._targets = targets = _slice(target);  //don't use Array.prototype.slice.call(target, 0) because that doesn't work in IE8 with a NodeList that's returned by querySelectorAll()
						this._propLookup = [];
						this._siblings = [];
						for (i = 0; i < targets.length; i++) {
							targ = targets[i];
							if (!targ) {
								targets.splice(i--, 1);
								continue;
							} else if (typeof(targ) === "string") {
								targ = targets[i--] = TweenLite.selector(targ); //in case it's an array of strings
								if (typeof(targ) === "string") {
									targets.splice(i+1, 1); //to avoid an endless loop (can't imagine why the selector would return a string, but just in case)
								}
								continue;
							} else if (targ.length && targ !== window && targ[0] && (targ[0] === window || (targ[0].nodeType && targ[0].style && !targ.nodeType))) { //in case the user is passing in an array of selector objects (like jQuery objects), we need to check one more level and pull things out if necessary. Also note that <select> elements pass all the criteria regarding length and the first child having style, so we must also check to ensure the target isn't an HTML node itself.
								targets.splice(i--, 1);
								this._targets = targets = targets.concat(_slice(targ));
								continue;
							}
							this._siblings[i] = _register(targ, this, false);
							if (overwrite === 1) if (this._siblings[i].length > 1) {
								_applyOverwrite(targ, this, null, 1, this._siblings[i]);
							}
						}

					} else {
						this._propLookup = {};
						this._siblings = _register(target, this, false);
						if (overwrite === 1) if (this._siblings.length > 1) {
							_applyOverwrite(target, this, null, 1, this._siblings);
						}
					}
					if (this.vars.immediateRender || (duration === 0 && this._delay === 0 && this.vars.immediateRender !== false)) {
						this._time = -_tinyNum; //forces a render without having to set the render() "force" parameter to true because we want to allow lazying by default (using the "force" parameter always forces an immediate full render)
						this.render(Math.min(0, -this._delay)); //in case delay is negative
					}
				}, true),
				_isSelector = function(v) {
					return (v && v.length && v !== window && v[0] && (v[0] === window || (v[0].nodeType && v[0].style && !v.nodeType))); //we cannot check "nodeType" if the target is window from within an iframe, otherwise it will trigger a security error in some browsers like Firefox.
				},
				_autoCSS = function(vars, target) {
					var css = {},
						p;
					for (p in vars) {
						if (!_reservedProps[p] && (!(p in target) || p === "transform" || p === "x" || p === "y" || p === "width" || p === "height" || p === "className" || p === "border") && (!_plugins[p] || (_plugins[p] && _plugins[p]._autoCSS))) { //note: <img> elements contain read-only "x" and "y" properties. We should also prioritize editing css width/height rather than the element's properties.
							css[p] = vars[p];
							delete vars[p];
						}
					}
					vars.css = css;
				};

			p = TweenLite.prototype = new Animation();
			p.constructor = TweenLite;
			p.kill()._gc = false;

	//----TweenLite defaults, overwrite management, and root updates ----------------------------------------------------

			p.ratio = 0;
			p._firstPT = p._targets = p._overwrittenProps = p._startAt = null;
			p._notifyPluginsOfEnabled = p._lazy = false;

			TweenLite.version = "2.1.3";
			TweenLite.defaultEase = p._ease = new Ease(null, null, 1, 1);
			TweenLite.defaultOverwrite = "auto";
			TweenLite.ticker = _ticker;
			TweenLite.autoSleep = 120;
			TweenLite.lagSmoothing = function(threshold, adjustedLag) {
				_ticker.lagSmoothing(threshold, adjustedLag);
			};

			TweenLite.selector = window.$ || window.jQuery || function(e) {
				var selector = window.$ || window.jQuery;
				if (selector) {
					TweenLite.selector = selector;
					return selector(e);
				}
				if (!_doc) { //in some dev environments (like Angular 6), GSAP gets loaded before the document is defined! So re-query it here if/when necessary.
					_doc = window.document;
				}
				return (!_doc) ? e : (_doc.querySelectorAll ? _doc.querySelectorAll(e) : _doc.getElementById((e.charAt(0) === "#") ? e.substr(1) : e));
			};

			var _lazyTweens = [],
				_lazyLookup = {},
				_numbersExp = /(?:(-|-=|\+=)?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/ig,
				_relExp = /[\+-]=-?[\.\d]/,
				//_nonNumbersExp = /(?:([\-+](?!(\d|=)))|[^\d\-+=e]|(e(?![\-+][\d])))+/ig,
				_setRatio = function(v) {
					var pt = this._firstPT,
						min = 0.000001,
						val;
					while (pt) {
						val = !pt.blob ? pt.c * v + pt.s : (v === 1 && this.end != null) ? this.end : v ? this.join("") : this.start;
						if (pt.m) {
							val = pt.m.call(this._tween, val, this._target || pt.t, this._tween);
						} else if (val < min) if (val > -min && !pt.blob) { //prevents issues with converting very small numbers to strings in the browser
							val = 0;
						}
						if (!pt.f) {
							pt.t[pt.p] = val;
						} else if (pt.fp) {
							pt.t[pt.p](pt.fp, val);
						} else {
							pt.t[pt.p](val);
						}
						pt = pt._next;
					}
				},
				_blobRound = function(v) {
					return (((v * 1000) | 0) / 1000) + "";
				},
				//compares two strings (start/end), finds the numbers that are different and spits back an array representing the whole value but with the changing values isolated as elements. For example, "rgb(0,0,0)" and "rgb(100,50,0)" would become ["rgb(", 0, ",", 50, ",0)"]. Notice it merges the parts that are identical (performance optimization). The array also has a linked list of PropTweens attached starting with _firstPT that contain the tweening data (t, p, s, c, f, etc.). It also stores the starting value as a "start" property so that we can revert to it if/when necessary, like when a tween rewinds fully. If the quantity of numbers differs between the start and end, it will always prioritize the end value(s). The pt parameter is optional - it's for a PropTween that will be appended to the end of the linked list and is typically for actually setting the value after all of the elements have been updated (with array.join("")).
				_blobDif = function(start, end, filter, pt) {
					var a = [],
						charIndex = 0,
						s = "",
						color = 0,
						startNums, endNums, num, i, l, nonNumbers, currentNum;
					a.start = start;
					a.end = end;
					start = a[0] = start + ""; //ensure values are strings
					end = a[1] = end + "";
					if (filter) {
						filter(a); //pass an array with the starting and ending values and let the filter do whatever it needs to the values.
						start = a[0];
						end = a[1];
					}
					a.length = 0;
					startNums = start.match(_numbersExp) || [];
					endNums = end.match(_numbersExp) || [];
					if (pt) {
						pt._next = null;
						pt.blob = 1;
						a._firstPT = a._applyPT = pt; //apply last in the linked list (which means inserting it first)
					}
					l = endNums.length;
					for (i = 0; i < l; i++) {
						currentNum = endNums[i];
						nonNumbers = end.substr(charIndex, end.indexOf(currentNum, charIndex)-charIndex);
						s += (nonNumbers || !i) ? nonNumbers : ","; //note: SVG spec allows omission of comma/space when a negative sign is wedged between two numbers, like 2.5-5.3 instead of 2.5,-5.3 but when tweening, the negative value may switch to positive, so we insert the comma just in case.
						charIndex += nonNumbers.length;
						if (color) { //sense rgba() values and round them.
							color = (color + 1) % 5;
						} else if (nonNumbers.substr(-5) === "rgba(") {
							color = 1;
						}
						if (currentNum === startNums[i] || startNums.length <= i) {
							s += currentNum;
						} else {
							if (s) {
								a.push(s);
								s = "";
							}
							num = parseFloat(startNums[i]);
							a.push(num);
							a._firstPT = {_next: a._firstPT, t:a, p: a.length-1, s:num, c:((currentNum.charAt(1) === "=") ? parseInt(currentNum.charAt(0) + "1", 10) * parseFloat(currentNum.substr(2)) : (parseFloat(currentNum) - num)) || 0, f:0, m:(color && color < 4) ? Math.round : _blobRound}; //limiting to 3 decimal places and casting as a string can really help performance when array.join() is called!
							//note: we don't set _prev because we'll never need to remove individual PropTweens from this list.
						}
						charIndex += currentNum.length;
					}
					s += end.substr(charIndex);
					if (s) {
						a.push(s);
					}
					a.setRatio = _setRatio;
					if (_relExp.test(end)) { //if the end string contains relative values, delete it so that on the final render (in _setRatio()), we don't actually set it to the string with += or -= characters (forces it to use the calculated value).
						a.end = null;
					}
					return a;
				},
				//note: "funcParam" is only necessary for function-based getters/setters that require an extra parameter like getAttribute("width") and setAttribute("width", value). In this example, funcParam would be "width". Used by AttrPlugin for example.
				_addPropTween = function(target, prop, start, end, overwriteProp, mod, funcParam, stringFilter, index) {
					if (typeof(end) === "function") {
						end = end(index || 0, target);
					}
					var type = typeof(target[prop]),
						getterName = (type !== "function") ? "" : ((prop.indexOf("set") || typeof(target["get" + prop.substr(3)]) !== "function") ? prop : "get" + prop.substr(3)),
						s = (start !== "get") ? start : !getterName ? target[prop] : funcParam ? target[getterName](funcParam) : target[getterName](),
						isRelative = (typeof(end) === "string" && end.charAt(1) === "="),
						pt = {t:target, p:prop, s:s, f:(type === "function"), pg:0, n:overwriteProp || prop, m:(!mod ? 0 : (typeof(mod) === "function") ? mod : Math.round), pr:0, c:isRelative ? parseInt(end.charAt(0) + "1", 10) * parseFloat(end.substr(2)) : (parseFloat(end) - s) || 0},
						blob;

					if (typeof(s) !== "number" || (typeof(end) !== "number" && !isRelative)) {
						if (funcParam || isNaN(s) || (!isRelative && isNaN(end)) || typeof(s) === "boolean" || typeof(end) === "boolean") {
							//a blob (string that has multiple numbers in it)
							pt.fp = funcParam;
							blob = _blobDif(s, (isRelative ? (parseFloat(pt.s) + pt.c) + (pt.s + "").replace(/[0-9\-\.]/g, "") : end), stringFilter || TweenLite.defaultStringFilter, pt);
							pt = {t: blob, p: "setRatio", s: 0, c: 1, f: 2, pg: 0, n: overwriteProp || prop, pr: 0, m: 0}; //"2" indicates it's a Blob property tween. Needed for RoundPropsPlugin for example.
						} else {
							pt.s = parseFloat(s);
							if (!isRelative) {
								pt.c = (parseFloat(end) - pt.s) || 0;
							}
						}
					}
					if (pt.c) { //only add it to the linked list if there's a change.
						if ((pt._next = this._firstPT)) {
							pt._next._prev = pt;
						}
						this._firstPT = pt;
						return pt;
					}
				},
				_internals = TweenLite._internals = {isArray:_isArray, isSelector:_isSelector, lazyTweens:_lazyTweens, blobDif:_blobDif}, //gives us a way to expose certain private values to other GreenSock classes without contaminating tha main TweenLite object.
				_plugins = TweenLite._plugins = {},
				_tweenLookup = _internals.tweenLookup = {},
				_tweenLookupNum = 0,
				_reservedProps = _internals.reservedProps = {ease:1, delay:1, overwrite:1, onComplete:1, onCompleteParams:1, onCompleteScope:1, useFrames:1, runBackwards:1, startAt:1, onUpdate:1, onUpdateParams:1, onUpdateScope:1, onStart:1, onStartParams:1, onStartScope:1, onReverseComplete:1, onReverseCompleteParams:1, onReverseCompleteScope:1, onRepeat:1, onRepeatParams:1, onRepeatScope:1, easeParams:1, yoyo:1, immediateRender:1, repeat:1, repeatDelay:1, data:1, paused:1, reversed:1, autoCSS:1, lazy:1, onOverwrite:1, callbackScope:1, stringFilter:1, id:1, yoyoEase:1, stagger:1},
				_overwriteLookup = {none:0, all:1, auto:2, concurrent:3, allOnStart:4, preexisting:5, "true":1, "false":0},
				_rootFramesTimeline = Animation._rootFramesTimeline = new SimpleTimeline(),
				_rootTimeline = Animation._rootTimeline = new SimpleTimeline(),
				_nextGCFrame = 30,
				_lazyRender = _internals.lazyRender = function() {
					var l = _lazyTweens.length,
						i, tween;
					_lazyLookup = {};
					for (i = 0; i < l; i++) {
						tween = _lazyTweens[i];
						if (tween && tween._lazy !== false) {
							tween.render(tween._lazy[0], tween._lazy[1], true);
							tween._lazy = false;
						}
					}
					_lazyTweens.length = 0;
				};

			_rootTimeline._startTime = _ticker.time;
			_rootFramesTimeline._startTime = _ticker.frame;
			_rootTimeline._active = _rootFramesTimeline._active = true;
			setTimeout(_lazyRender, 1); //on some mobile devices, there isn't a "tick" before code runs which means any lazy renders wouldn't run before the next official "tick".

			Animation._updateRoot = TweenLite.render = function() {
					var i, a, p;
					if (_lazyTweens.length) { //if code is run outside of the requestAnimationFrame loop, there may be tweens queued AFTER the engine refreshed, so we need to ensure any pending renders occur before we refresh again.
						_lazyRender();
					}
					_rootTimeline.render((_ticker.time - _rootTimeline._startTime) * _rootTimeline._timeScale, false, false);
					_rootFramesTimeline.render((_ticker.frame - _rootFramesTimeline._startTime) * _rootFramesTimeline._timeScale, false, false);
					if (_lazyTweens.length) {
						_lazyRender();
					}
					if (_ticker.frame >= _nextGCFrame) { //dump garbage every 120 frames or whatever the user sets TweenLite.autoSleep to
						_nextGCFrame = _ticker.frame + (parseInt(TweenLite.autoSleep, 10) || 120);
						for (p in _tweenLookup) {
							a = _tweenLookup[p].tweens;
							i = a.length;
							while (--i > -1) {
								if (a[i]._gc) {
									a.splice(i, 1);
								}
							}
							if (a.length === 0) {
								delete _tweenLookup[p];
							}
						}
						//if there are no more tweens in the root timelines, or if they're all paused, make the _timer sleep to reduce load on the CPU slightly
						p = _rootTimeline._first;
						if (!p || p._paused) if (TweenLite.autoSleep && !_rootFramesTimeline._first && _ticker._listeners.tick.length === 1) {
							while (p && p._paused) {
								p = p._next;
							}
							if (!p) {
								_ticker.sleep();
							}
						}
					}
				};

			_ticker.addEventListener("tick", Animation._updateRoot);

			var _register = function(target, tween, scrub) {
					var id = target._gsTweenID, a, i;
					if (!_tweenLookup[id || (target._gsTweenID = id = "t" + (_tweenLookupNum++))]) {
						_tweenLookup[id] = {target:target, tweens:[]};
					}
					if (tween) {
						a = _tweenLookup[id].tweens;
						a[(i = a.length)] = tween;
						if (scrub) {
							while (--i > -1) {
								if (a[i] === tween) {
									a.splice(i, 1);
								}
							}
						}
					}
					return _tweenLookup[id].tweens;
				},
				_onOverwrite = function(overwrittenTween, overwritingTween, target, killedProps) {
					var func = overwrittenTween.vars.onOverwrite, r1, r2;
					if (func) {
						r1 = func(overwrittenTween, overwritingTween, target, killedProps);
					}
					func = TweenLite.onOverwrite;
					if (func) {
						r2 = func(overwrittenTween, overwritingTween, target, killedProps);
					}
					return (r1 !== false && r2 !== false);
				},
				_applyOverwrite = function(target, tween, props, mode, siblings) {
					var i, changed, curTween, l;
					if (mode === 1 || mode >= 4) {
						l = siblings.length;
						for (i = 0; i < l; i++) {
							if ((curTween = siblings[i]) !== tween) {
								if (!curTween._gc) {
									if (curTween._kill(null, target, tween)) {
										changed = true;
									}
								}
							} else if (mode === 5) {
								break;
							}
						}
						return changed;
					}
					//NOTE: Add tiny amount to overcome floating point errors that can cause the startTime to be VERY slightly off (when a tween's time() is set for example)
					var startTime = tween._startTime + _tinyNum,
						overlaps = [],
						oCount = 0,
						zeroDur = (tween._duration === 0),
						globalStart;
					i = siblings.length;
					while (--i > -1) {
						if ((curTween = siblings[i]) === tween || curTween._gc || curTween._paused) ; else if (curTween._timeline !== tween._timeline) {
							globalStart = globalStart || _checkOverlap(tween, 0, zeroDur);
							if (_checkOverlap(curTween, globalStart, zeroDur) === 0) {
								overlaps[oCount++] = curTween;
							}
						} else if (curTween._startTime <= startTime) if (curTween._startTime + curTween.totalDuration() / curTween._timeScale > startTime) if (!((zeroDur || !curTween._initted) && startTime - curTween._startTime <= _tinyNum * 2)) {
							overlaps[oCount++] = curTween;
						}
					}

					i = oCount;
					while (--i > -1) {
						curTween = overlaps[i];
						l = curTween._firstPT; //we need to discern if there were property tweens originally; if they all get removed in the next line's _kill() call, the tween should be killed. See https://github.com/greensock/GreenSock-JS/issues/278
						if (mode === 2) if (curTween._kill(props, target, tween)) {
							changed = true;
						}
						if (mode !== 2 || (!curTween._firstPT && curTween._initted && l)) {
							if (mode !== 2 && !_onOverwrite(curTween, tween)) {
								continue;
							}
							if (curTween._enabled(false, false)) { //if all property tweens have been overwritten, kill the tween.
								changed = true;
							}
						}
					}
					return changed;
				},
				_checkOverlap = function(tween, reference, zeroDur) {
					var tl = tween._timeline,
						ts = tl._timeScale,
						t = tween._startTime;
					while (tl._timeline) {
						t += tl._startTime;
						ts *= tl._timeScale;
						if (tl._paused) {
							return -100;
						}
						tl = tl._timeline;
					}
					t /= ts;
					return (t > reference) ? t - reference : ((zeroDur && t === reference) || (!tween._initted && t - reference < 2 * _tinyNum)) ? _tinyNum : ((t += tween.totalDuration() / tween._timeScale / ts) > reference + _tinyNum) ? 0 : t - reference - _tinyNum;
				};


	//---- TweenLite instance methods -----------------------------------------------------------------------------

			p._init = function() {
				var v = this.vars,
					op = this._overwrittenProps,
					dur = this._duration,
					immediate = !!v.immediateRender,
					ease = v.ease,
					startAt = this._startAt,
					i, initPlugins, pt, p, startVars, l;
				if (v.startAt) {
					if (startAt) {
						startAt.render(-1, true); //if we've run a startAt previously (when the tween instantiated), we should revert it so that the values re-instantiate correctly particularly for relative tweens. Without this, a TweenLite.fromTo(obj, 1, {x:"+=100"}, {x:"-=100"}), for example, would actually jump to +=200 because the startAt would run twice, doubling the relative change.
						startAt.kill();
					}
					startVars = {};
					for (p in v.startAt) { //copy the properties/values into a new object to avoid collisions, like var to = {x:0}, from = {x:500}; timeline.fromTo(e, 1, from, to).fromTo(e, 1, to, from);
						startVars[p] = v.startAt[p];
					}
					startVars.data = "isStart";
					startVars.overwrite = false;
					startVars.immediateRender = true;
					startVars.lazy = (immediate && v.lazy !== false);
					startVars.startAt = startVars.delay = null; //no nesting of startAt objects allowed (otherwise it could cause an infinite loop).
					startVars.onUpdate = v.onUpdate;
					startVars.onUpdateParams = v.onUpdateParams;
					startVars.onUpdateScope = v.onUpdateScope || v.callbackScope || this;
					this._startAt = TweenLite.to(this.target || {}, 0, startVars);
					if (immediate) {
						if (this._time > 0) {
							this._startAt = null; //tweens that render immediately (like most from() and fromTo() tweens) shouldn't revert when their parent timeline's playhead goes backward past the startTime because the initial render could have happened anytime and it shouldn't be directly correlated to this tween's startTime. Imagine setting up a complex animation where the beginning states of various objects are rendered immediately but the tween doesn't happen for quite some time - if we revert to the starting values as soon as the playhead goes backward past the tween's startTime, it will throw things off visually. Reversion should only happen in TimelineLite/Max instances where immediateRender was false (which is the default in the convenience methods like from()).
						} else if (dur !== 0) {
							return; //we skip initialization here so that overwriting doesn't occur until the tween actually begins. Otherwise, if you create several immediateRender:true tweens of the same target/properties to drop into a TimelineLite or TimelineMax, the last one created would overwrite the first ones because they didn't get placed into the timeline yet before the first render occurs and kicks in overwriting.
						}
					}
				} else if (v.runBackwards && dur !== 0) {
					//from() tweens must be handled uniquely: their beginning values must be rendered but we don't want overwriting to occur yet (when time is still 0). Wait until the tween actually begins before doing all the routines like overwriting. At that time, we should render at the END of the tween to ensure that things initialize correctly (remember, from() tweens go backwards)
					if (startAt) {
						startAt.render(-1, true);
						startAt.kill();
						this._startAt = null;
					} else {
						if (this._time !== 0) { //in rare cases (like if a from() tween runs and then is invalidate()-ed), immediateRender could be true but the initial forced-render gets skipped, so there's no need to force the render in this context when the _time is greater than 0
							immediate = false;
						}
						pt = {};
						for (p in v) { //copy props into a new object and skip any reserved props, otherwise onComplete or onUpdate or onStart could fire. We should, however, permit autoCSS to go through.
							if (!_reservedProps[p] || p === "autoCSS") {
								pt[p] = v[p];
							}
						}
						pt.overwrite = 0;
						pt.data = "isFromStart"; //we tag the tween with as "isFromStart" so that if [inside a plugin] we need to only do something at the very END of a tween, we have a way of identifying this tween as merely the one that's setting the beginning values for a "from()" tween. For example, clearProps in CSSPlugin should only get applied at the very END of a tween and without this tag, from(...{height:100, clearProps:"height", delay:1}) would wipe the height at the beginning of the tween and after 1 second, it'd kick back in.
						pt.lazy = (immediate && v.lazy !== false);
						pt.immediateRender = immediate; //zero-duration tweens render immediately by default, but if we're not specifically instructed to render this tween immediately, we should skip this and merely _init() to record the starting values (rendering them immediately would push them to completion which is wasteful in that case - we'd have to render(-1) immediately after)
						this._startAt = TweenLite.to(this.target, 0, pt);
						if (!immediate) {
							this._startAt._init(); //ensures that the initial values are recorded
							this._startAt._enabled(false); //no need to have the tween render on the next cycle. Disable it because we'll always manually control the renders of the _startAt tween.
							if (this.vars.immediateRender) {
								this._startAt = null;
							}
						} else if (this._time === 0) {
							return;
						}
					}
				}
				this._ease = ease = (!ease) ? TweenLite.defaultEase : (ease instanceof Ease) ? ease : (typeof(ease) === "function") ? new Ease(ease, v.easeParams) : _easeMap[ease] || TweenLite.defaultEase;
				if (v.easeParams instanceof Array && ease.config) {
					this._ease = ease.config.apply(ease, v.easeParams);
				}
				this._easeType = this._ease._type;
				this._easePower = this._ease._power;
				this._firstPT = null;

				if (this._targets) {
					l = this._targets.length;
					for (i = 0; i < l; i++) {
						if ( this._initProps( this._targets[i], (this._propLookup[i] = {}), this._siblings[i], (op ? op[i] : null), i) ) {
							initPlugins = true;
						}
					}
				} else {
					initPlugins = this._initProps(this.target, this._propLookup, this._siblings, op, 0);
				}

				if (initPlugins) {
					TweenLite._onPluginEvent("_onInitAllProps", this); //reorders the array in order of priority. Uses a static TweenPlugin method in order to minimize file size in TweenLite
				}
				if (op) if (!this._firstPT) if (typeof(this.target) !== "function") { //if all tweening properties have been overwritten, kill the tween. If the target is a function, it's probably a delayedCall so let it live.
					this._enabled(false, false);
				}
				if (v.runBackwards) {
					pt = this._firstPT;
					while (pt) {
						pt.s += pt.c;
						pt.c = -pt.c;
						pt = pt._next;
					}
				}
				this._onUpdate = v.onUpdate;
				this._initted = true;
			};

			p._initProps = function(target, propLookup, siblings, overwrittenProps, index) {
				var p, i, initPlugins, plugin, pt, v;
				if (target == null) {
					return false;
				}
				if (_lazyLookup[target._gsTweenID]) {
					_lazyRender(); //if other tweens of the same target have recently initted but haven't rendered yet, we've got to force the render so that the starting values are correct (imagine populating a timeline with a bunch of sequential tweens and then jumping to the end)
				}

				if (!this.vars.css) if (target.style) if (target !== window && target.nodeType) if (_plugins.css) if (this.vars.autoCSS !== false) { //it's so common to use TweenLite/Max to animate the css of DOM elements, we assume that if the target is a DOM element, that's what is intended (a convenience so that users don't have to wrap things in css:{}, although we still recommend it for a slight performance boost and better specificity). Note: we cannot check "nodeType" on the window inside an iframe.
					_autoCSS(this.vars, target);
				}
				for (p in this.vars) {
					v = this.vars[p];
					if (_reservedProps[p]) {
						if (v) if ((v instanceof Array) || (v.push && _isArray(v))) if (v.join("").indexOf("{self}") !== -1) {
							this.vars[p] = v = this._swapSelfInParams(v, this);
						}

					} else if (_plugins[p] && (plugin = new _plugins[p]())._onInitTween(target, this.vars[p], this, index)) {

						//t - target 		[object]
						//p - property 		[string]
						//s - start			[number]
						//c - change		[number]
						//f - isFunction	[boolean]
						//n - name			[string]
						//pg - isPlugin 	[boolean]
						//pr - priority		[number]
						//m - mod           [function | 0]
						this._firstPT = pt = {_next:this._firstPT, t:plugin, p:"setRatio", s:0, c:1, f:1, n:p, pg:1, pr:plugin._priority, m:0};
						i = plugin._overwriteProps.length;
						while (--i > -1) {
							propLookup[plugin._overwriteProps[i]] = this._firstPT;
						}
						if (plugin._priority || plugin._onInitAllProps) {
							initPlugins = true;
						}
						if (plugin._onDisable || plugin._onEnable) {
							this._notifyPluginsOfEnabled = true;
						}
						if (pt._next) {
							pt._next._prev = pt;
						}

					} else {
						propLookup[p] = _addPropTween.call(this, target, p, "get", v, p, 0, null, this.vars.stringFilter, index);
					}
				}

				if (overwrittenProps) if (this._kill(overwrittenProps, target)) { //another tween may have tried to overwrite properties of this tween before init() was called (like if two tweens start at the same time, the one created second will run first)
					return this._initProps(target, propLookup, siblings, overwrittenProps, index);
				}
				if (this._overwrite > 1) if (this._firstPT) if (siblings.length > 1) if (_applyOverwrite(target, this, propLookup, this._overwrite, siblings)) {
					this._kill(propLookup, target);
					return this._initProps(target, propLookup, siblings, overwrittenProps, index);
				}
				if (this._firstPT) if ((this.vars.lazy !== false && this._duration) || (this.vars.lazy && !this._duration)) { //zero duration tweens don't lazy render by default; everything else does.
					_lazyLookup[target._gsTweenID] = true;
				}
				return initPlugins;
			};

			p.render = function(time, suppressEvents, force) {
				var self = this,
					prevTime = self._time,
					duration = self._duration,
					prevRawPrevTime = self._rawPrevTime,
					isComplete, callback, pt, rawPrevTime;
				if (time >= duration - _tinyNum && time >= 0) { //to work around occasional floating point math artifacts.
					self._totalTime = self._time = duration;
					self.ratio = self._ease._calcEnd ? self._ease.getRatio(1) : 1;
					if (!self._reversed ) {
						isComplete = true;
						callback = "onComplete";
						force = (force || self._timeline.autoRemoveChildren); //otherwise, if the animation is unpaused/activated after it's already finished, it doesn't get removed from the parent timeline.
					}
					if (duration === 0) if (self._initted || !self.vars.lazy || force) { //zero-duration tweens are tricky because we must discern the momentum/direction of time in order to determine whether the starting values should be rendered or the ending values. If the "playhead" of its timeline goes past the zero-duration tween in the forward direction or lands directly on it, the end values should be rendered, but if the timeline's "playhead" moves past it in the backward direction (from a postitive time to a negative time), the starting values must be rendered.
						if (self._startTime === self._timeline._duration) { //if a zero-duration tween is at the VERY end of a timeline and that timeline renders at its end, it will typically add a tiny bit of cushion to the render time to prevent rounding errors from getting in the way of tweens rendering their VERY end. If we then reverse() that timeline, the zero-duration tween will trigger its onReverseComplete even though technically the playhead didn't pass over it again. It's a very specific edge case we must accommodate.
							time = 0;
						}
						if (prevRawPrevTime < 0 || (time <= 0 && time >= -_tinyNum) || (prevRawPrevTime === _tinyNum && self.data !== "isPause")) if (prevRawPrevTime !== time) { //note: when this.data is "isPause", it's a callback added by addPause() on a timeline that we should not be triggered when LEAVING its exact start time. In other words, tl.addPause(1).play(1) shouldn't pause.
							force = true;
							if (prevRawPrevTime > _tinyNum) {
								callback = "onReverseComplete";
							}
						}
						self._rawPrevTime = rawPrevTime = (!suppressEvents || time || prevRawPrevTime === time) ? time : _tinyNum; //when the playhead arrives at EXACTLY time 0 (right on top) of a zero-duration tween, we need to discern if events are suppressed so that when the playhead moves again (next time), it'll trigger the callback. If events are NOT suppressed, obviously the callback would be triggered in this render. Basically, the callback should fire either when the playhead ARRIVES or LEAVES this exact spot, not both. Imagine doing a timeline.seek(0) and there's a callback that sits at 0. Since events are suppressed on that seek() by default, nothing will fire, but when the playhead moves off of that position, the callback should fire. This behavior is what people intuitively expect. We set the _rawPrevTime to be a precise tiny number to indicate this scenario rather than using another property/variable which would increase memory usage. This technique is less readable, but more efficient.
					}

				} else if (time < _tinyNum) { //to work around occasional floating point math artifacts, round super small values to 0.
					self._totalTime = self._time = 0;
					self.ratio = self._ease._calcEnd ? self._ease.getRatio(0) : 0;
					if (prevTime !== 0 || (duration === 0 && prevRawPrevTime > 0)) {
						callback = "onReverseComplete";
						isComplete = self._reversed;
					}
					if (time > -_tinyNum) {
						time = 0;
					} else if (time < 0) {
						self._active = false;
						if (duration === 0) if (self._initted || !self.vars.lazy || force) { //zero-duration tweens are tricky because we must discern the momentum/direction of time in order to determine whether the starting values should be rendered or the ending values. If the "playhead" of its timeline goes past the zero-duration tween in the forward direction or lands directly on it, the end values should be rendered, but if the timeline's "playhead" moves past it in the backward direction (from a postitive time to a negative time), the starting values must be rendered.
							if (prevRawPrevTime >= 0 && !(prevRawPrevTime === _tinyNum && self.data === "isPause")) {
								force = true;
							}
							self._rawPrevTime = rawPrevTime = (!suppressEvents || time || prevRawPrevTime === time) ? time : _tinyNum; //when the playhead arrives at EXACTLY time 0 (right on top) of a zero-duration tween, we need to discern if events are suppressed so that when the playhead moves again (next time), it'll trigger the callback. If events are NOT suppressed, obviously the callback would be triggered in this render. Basically, the callback should fire either when the playhead ARRIVES or LEAVES this exact spot, not both. Imagine doing a timeline.seek(0) and there's a callback that sits at 0. Since events are suppressed on that seek() by default, nothing will fire, but when the playhead moves off of that position, the callback should fire. This behavior is what people intuitively expect. We set the _rawPrevTime to be a precise tiny number to indicate this scenario rather than using another property/variable which would increase memory usage. This technique is less readable, but more efficient.
						}
					}
					if (!self._initted || (self._startAt && self._startAt.progress())) { //if we render the very beginning (time == 0) of a fromTo(), we must force the render (normal tweens wouldn't need to render at a time of 0 when the prevTime was also 0). This is also mandatory to make sure overwriting kicks in immediately. Also, we check progress() because if startAt has already rendered at its end, we should force a render at its beginning. Otherwise, if you put the playhead directly on top of where a fromTo({immediateRender:false}) starts, and then move it backwards, the from() won't revert its values.
						force = true;
					}
				} else {
					self._totalTime = self._time = time;

					if (self._easeType) {
						var r = time / duration, type = self._easeType, pow = self._easePower;
						if (type === 1 || (type === 3 && r >= 0.5)) {
							r = 1 - r;
						}
						if (type === 3) {
							r *= 2;
						}
						if (pow === 1) {
							r *= r;
						} else if (pow === 2) {
							r *= r * r;
						} else if (pow === 3) {
							r *= r * r * r;
						} else if (pow === 4) {
							r *= r * r * r * r;
						}
						self.ratio = (type === 1) ? 1 - r : (type === 2) ? r : (time / duration < 0.5) ? r / 2 : 1 - (r / 2);
					} else {
						self.ratio = self._ease.getRatio(time / duration);
					}
				}

				if (self._time === prevTime && !force) {
					return;
				} else if (!self._initted) {
					self._init();
					if (!self._initted || self._gc) { //immediateRender tweens typically won't initialize until the playhead advances (_time is greater than 0) in order to ensure that overwriting occurs properly. Also, if all of the tweening properties have been overwritten (which would cause _gc to be true, as set in _init()), we shouldn't continue otherwise an onStart callback could be called for example.
						return;
					} else if (!force && self._firstPT && ((self.vars.lazy !== false && self._duration) || (self.vars.lazy && !self._duration))) {
						self._time = self._totalTime = prevTime;
						self._rawPrevTime = prevRawPrevTime;
						_lazyTweens.push(self);
						self._lazy = [time, suppressEvents];
						return;
					}
					//_ease is initially set to defaultEase, so now that init() has run, _ease is set properly and we need to recalculate the ratio. Overall this is faster than using conditional logic earlier in the method to avoid having to set ratio twice because we only init() once but renderTime() gets called VERY frequently.
					if (self._time && !isComplete) {
						self.ratio = self._ease.getRatio(self._time / duration);
					} else if (isComplete && self._ease._calcEnd) {
						self.ratio = self._ease.getRatio((self._time === 0) ? 0 : 1);
					}
				}
				if (self._lazy !== false) { //in case a lazy render is pending, we should flush it because the new render is occurring now (imagine a lazy tween instantiating and then immediately the user calls tween.seek(tween.duration()), skipping to the end - the end render would be forced, and then if we didn't flush the lazy render, it'd fire AFTER the seek(), rendering it at the wrong time.
					self._lazy = false;
				}
				if (!self._active) if (!self._paused && self._time !== prevTime && time >= 0) {
					self._active = true;  //so that if the user renders a tween (as opposed to the timeline rendering it), the timeline is forced to re-render and align it with the proper time/frame on the next rendering cycle. Maybe the tween already finished but the user manually re-renders it as halfway done.
				}
				if (prevTime === 0) {
					if (self._startAt) {
						if (time >= 0) {
							self._startAt.render(time, true, force);
						} else if (!callback) {
							callback = "_dummyGS"; //if no callback is defined, use a dummy value just so that the condition at the end evaluates as true because _startAt should render AFTER the normal render loop when the time is negative. We could handle this in a more intuitive way, of course, but the render loop is the MOST important thing to optimize, so this technique allows us to avoid adding extra conditional logic in a high-frequency area.
						}
					}
					if (self.vars.onStart) if (self._time !== 0 || duration === 0) if (!suppressEvents) {
						self._callback("onStart");
					}
				}
				pt = self._firstPT;
				while (pt) {
					if (pt.f) {
						pt.t[pt.p](pt.c * self.ratio + pt.s);
					} else {
						pt.t[pt.p] = pt.c * self.ratio + pt.s;
					}
					pt = pt._next;
				}

				if (self._onUpdate) {
					if (time < 0) if (self._startAt && time !== -0.0001) { //if the tween is positioned at the VERY beginning (_startTime 0) of its parent timeline, it's illegal for the playhead to go back further, so we should not render the recorded startAt values.
						self._startAt.render(time, true, force); //note: for performance reasons, we tuck this conditional logic inside less traveled areas (most tweens don't have an onUpdate). We'd just have it at the end before the onComplete, but the values should be updated before any onUpdate is called, so we ALSO put it here and then if it's not called, we do so later near the onComplete.
					}
					if (!suppressEvents) if (self._time !== prevTime || isComplete || force) {
						self._callback("onUpdate");
					}
				}
				if (callback) if (!self._gc || force) { //check _gc because there's a chance that kill() could be called in an onUpdate
					if (time < 0 && self._startAt && !self._onUpdate && time !== -0.0001) { //-0.0001 is a special value that we use when looping back to the beginning of a repeated TimelineMax, in which case we shouldn't render the _startAt values.
						self._startAt.render(time, true, force);
					}
					if (isComplete) {
						if (self._timeline.autoRemoveChildren) {
							self._enabled(false, false);
						}
						self._active = false;
					}
					if (!suppressEvents && self.vars[callback]) {
						self._callback(callback);
					}
					if (duration === 0 && self._rawPrevTime === _tinyNum && rawPrevTime !== _tinyNum) { //the onComplete or onReverseComplete could trigger movement of the playhead and for zero-duration tweens (which must discern direction) that land directly back on their start time, we don't want to fire again on the next render. Think of several addPause()'s in a timeline that forces the playhead to a certain spot, but what if it's already paused and another tween is tweening the "time" of the timeline? Each time it moves [forward] past that spot, it would move back, and since suppressEvents is true, it'd reset _rawPrevTime to _tinyNum so that when it begins again, the callback would fire (so ultimately it could bounce back and forth during that tween). Again, this is a very uncommon scenario, but possible nonetheless.
						self._rawPrevTime = 0;
					}
				}
			};

			p._kill = function(vars, target, overwritingTween) {
				if (vars === "all") {
					vars = null;
				}
				if (vars == null) if (target == null || target === this.target) {
					this._lazy = false;
					return this._enabled(false, false);
				}
				target = (typeof(target) !== "string") ? (target || this._targets || this.target) : TweenLite.selector(target) || target;
				var simultaneousOverwrite = (overwritingTween && this._time && overwritingTween._startTime === this._startTime && this._timeline === overwritingTween._timeline),
					firstPT = this._firstPT,
					i, overwrittenProps, p, pt, propLookup, changed, killProps, record, killed;
				if ((_isArray(target) || _isSelector(target)) && typeof(target[0]) !== "number") {
					i = target.length;
					while (--i > -1) {
						if (this._kill(vars, target[i], overwritingTween)) {
							changed = true;
						}
					}
				} else {
					if (this._targets) {
						i = this._targets.length;
						while (--i > -1) {
							if (target === this._targets[i]) {
								propLookup = this._propLookup[i] || {};
								this._overwrittenProps = this._overwrittenProps || [];
								overwrittenProps = this._overwrittenProps[i] = vars ? this._overwrittenProps[i] || {} : "all";
								break;
							}
						}
					} else if (target !== this.target) {
						return false;
					} else {
						propLookup = this._propLookup;
						overwrittenProps = this._overwrittenProps = vars ? this._overwrittenProps || {} : "all";
					}

					if (propLookup) {
						killProps = vars || propLookup;
						record = (vars !== overwrittenProps && overwrittenProps !== "all" && vars !== propLookup && (typeof(vars) !== "object" || !vars._tempKill)); //_tempKill is a super-secret way to delete a particular tweening property but NOT have it remembered as an official overwritten property (like in BezierPlugin)
						if (overwritingTween && (TweenLite.onOverwrite || this.vars.onOverwrite)) {
							for (p in killProps) {
								if (propLookup[p]) {
									if (!killed) {
										killed = [];
									}
									killed.push(p);
								}
							}
							if ((killed || !vars) && !_onOverwrite(this, overwritingTween, target, killed)) { //if the onOverwrite returned false, that means the user wants to override the overwriting (cancel it).
								return false;
							}
						}

						for (p in killProps) {
							if ((pt = propLookup[p])) {
								if (simultaneousOverwrite) { //if another tween overwrites this one and they both start at exactly the same time, yet this tween has already rendered once (for example, at 0.001) because it's first in the queue, we should revert the values to where they were at 0 so that the starting values aren't contaminated on the overwriting tween.
									if (pt.f) {
										pt.t[pt.p](pt.s);
									} else {
										pt.t[pt.p] = pt.s;
									}
									changed = true;
								}
								if (pt.pg && pt.t._kill(killProps)) {
									changed = true; //some plugins need to be notified so they can perform cleanup tasks first
								}
								if (!pt.pg || pt.t._overwriteProps.length === 0) {
									if (pt._prev) {
										pt._prev._next = pt._next;
									} else if (pt === this._firstPT) {
										this._firstPT = pt._next;
									}
									if (pt._next) {
										pt._next._prev = pt._prev;
									}
									pt._next = pt._prev = null;
								}
								delete propLookup[p];
							}
							if (record) {
								overwrittenProps[p] = 1;
							}
						}
						if (!this._firstPT && this._initted && firstPT) { //if all tweening properties are killed, kill the tween. Without this line, if there's a tween with multiple targets and then you killTweensOf() each target individually, the tween would technically still remain active and fire its onComplete even though there aren't any more properties tweening.
							this._enabled(false, false);
						}
					}
				}
				return changed;
			};

			p.invalidate = function() {
				if (this._notifyPluginsOfEnabled) {
					TweenLite._onPluginEvent("_onDisable", this);
				}
				var t = this._time;
				this._firstPT = this._overwrittenProps = this._startAt = this._onUpdate = null;
				this._notifyPluginsOfEnabled = this._active = this._lazy = false;
				this._propLookup = (this._targets) ? {} : [];
				Animation.prototype.invalidate.call(this);
				if (this.vars.immediateRender) {
					this._time = -_tinyNum; //forces a render without having to set the render() "force" parameter to true because we want to allow lazying by default (using the "force" parameter always forces an immediate full render)
					this.render(t, false, this.vars.lazy !== false);
				}
				return this;
			};

			p._enabled = function(enabled, ignoreTimeline) {
				if (!_tickerActive) {
					_ticker.wake();
				}
				if (enabled && this._gc) {
					var targets = this._targets,
						i;
					if (targets) {
						i = targets.length;
						while (--i > -1) {
							this._siblings[i] = _register(targets[i], this, true);
						}
					} else {
						this._siblings = _register(this.target, this, true);
					}
				}
				Animation.prototype._enabled.call(this, enabled, ignoreTimeline);
				if (this._notifyPluginsOfEnabled) if (this._firstPT) {
					return TweenLite._onPluginEvent((enabled ? "_onEnable" : "_onDisable"), this);
				}
				return false;
			};


	//----TweenLite static methods -----------------------------------------------------

			TweenLite.to = function(target, duration, vars) {
				return new TweenLite(target, duration, vars);
			};

			TweenLite.from = function(target, duration, vars) {
				vars.runBackwards = true;
				vars.immediateRender = (vars.immediateRender != false);
				return new TweenLite(target, duration, vars);
			};

			TweenLite.fromTo = function(target, duration, fromVars, toVars) {
				toVars.startAt = fromVars;
				toVars.immediateRender = (toVars.immediateRender != false && fromVars.immediateRender != false);
				return new TweenLite(target, duration, toVars);
			};

			TweenLite.delayedCall = function(delay, callback, params, scope, useFrames) {
				return new TweenLite(callback, 0, {delay:delay, onComplete:callback, onCompleteParams:params, callbackScope:scope, onReverseComplete:callback, onReverseCompleteParams:params, immediateRender:false, lazy:false, useFrames:useFrames, overwrite:0});
			};

			TweenLite.set = function(target, vars) {
				return new TweenLite(target, 0, vars);
			};

			TweenLite.getTweensOf = function(target, onlyActive) {
				if (target == null) { return []; }
				target = (typeof(target) !== "string") ? target : TweenLite.selector(target) || target;
				var i, a, j, t;
				if ((_isArray(target) || _isSelector(target)) && typeof(target[0]) !== "number") {
					i = target.length;
					a = [];
					while (--i > -1) {
						a = a.concat(TweenLite.getTweensOf(target[i], onlyActive));
					}
					i = a.length;
					//now get rid of any duplicates (tweens of arrays of objects could cause duplicates)
					while (--i > -1) {
						t = a[i];
						j = i;
						while (--j > -1) {
							if (t === a[j]) {
								a.splice(i, 1);
							}
						}
					}
				} else if (target._gsTweenID) {
					a = _register(target).concat();
					i = a.length;
					while (--i > -1) {
						if (a[i]._gc || (onlyActive && !a[i].isActive())) {
							a.splice(i, 1);
						}
					}
				}
				return a || [];
			};

			TweenLite.killTweensOf = TweenLite.killDelayedCallsTo = function(target, onlyActive, vars) {
				if (typeof(onlyActive) === "object") {
					vars = onlyActive; //for backwards compatibility (before "onlyActive" parameter was inserted)
					onlyActive = false;
				}
				var a = TweenLite.getTweensOf(target, onlyActive),
					i = a.length;
				while (--i > -1) {
					a[i]._kill(vars, target);
				}
			};



	/*
	 * ----------------------------------------------------------------
	 * TweenPlugin   (could easily be split out as a separate file/class, but included for ease of use (so that people don't need to include another script call before loading plugins which is easy to forget)
	 * ----------------------------------------------------------------
	 */
			var TweenPlugin = _class("plugins.TweenPlugin", function(props, priority) {
						this._overwriteProps = (props || "").split(",");
						this._propName = this._overwriteProps[0];
						this._priority = priority || 0;
						this._super = TweenPlugin.prototype;
					}, true);

			p = TweenPlugin.prototype;
			TweenPlugin.version = "1.19.0";
			TweenPlugin.API = 2;
			p._firstPT = null;
			p._addTween = _addPropTween;
			p.setRatio = _setRatio;

			p._kill = function(lookup) {
				var a = this._overwriteProps,
					pt = this._firstPT,
					i;
				if (lookup[this._propName] != null) {
					this._overwriteProps = [];
				} else {
					i = a.length;
					while (--i > -1) {
						if (lookup[a[i]] != null) {
							a.splice(i, 1);
						}
					}
				}
				while (pt) {
					if (lookup[pt.n] != null) {
						if (pt._next) {
							pt._next._prev = pt._prev;
						}
						if (pt._prev) {
							pt._prev._next = pt._next;
							pt._prev = null;
						} else if (this._firstPT === pt) {
							this._firstPT = pt._next;
						}
					}
					pt = pt._next;
				}
				return false;
			};

			p._mod = p._roundProps = function(lookup) {
				var pt = this._firstPT,
					val;
				while (pt) {
					val = lookup[this._propName] || (pt.n != null && lookup[ pt.n.split(this._propName + "_").join("") ]);
					if (val && typeof(val) === "function") { //some properties that are very plugin-specific add a prefix named after the _propName plus an underscore, so we need to ignore that extra stuff here.
						if (pt.f === 2) {
							pt.t._applyPT.m = val;
						} else {
							pt.m = val;
						}
					}
					pt = pt._next;
				}
			};

			TweenLite._onPluginEvent = function(type, tween) {
				var pt = tween._firstPT,
					changed, pt2, first, last, next;
				if (type === "_onInitAllProps") {
					//sorts the PropTween linked list in order of priority because some plugins need to render earlier/later than others, like MotionBlurPlugin applies its effects after all x/y/alpha tweens have rendered on each frame.
					while (pt) {
						next = pt._next;
						pt2 = first;
						while (pt2 && pt2.pr > pt.pr) {
							pt2 = pt2._next;
						}
						if ((pt._prev = pt2 ? pt2._prev : last)) {
							pt._prev._next = pt;
						} else {
							first = pt;
						}
						if ((pt._next = pt2)) {
							pt2._prev = pt;
						} else {
							last = pt;
						}
						pt = next;
					}
					pt = tween._firstPT = first;
				}
				while (pt) {
					if (pt.pg) if (typeof(pt.t[type]) === "function") if (pt.t[type]()) {
						changed = true;
					}
					pt = pt._next;
				}
				return changed;
			};

			TweenPlugin.activate = function(plugins) {
				var i = plugins.length;
				while (--i > -1) {
					if (plugins[i].API === TweenPlugin.API) {
						_plugins[(new plugins[i]())._propName] = plugins[i];
					}
				}
				return true;
			};

			//provides a more concise way to define plugins that have no dependencies besides TweenPlugin and TweenLite, wrapping common boilerplate stuff into one function (added in 1.9.0). You don't NEED to use this to define a plugin - the old way still works and can be useful in certain (rare) situations.
			_gsDefine.plugin = function(config) {
				if (!config || !config.propName || !config.init || !config.API) { throw "illegal plugin definition."; }
				var propName = config.propName,
					priority = config.priority || 0,
					overwriteProps = config.overwriteProps,
					map = {init:"_onInitTween", set:"setRatio", kill:"_kill", round:"_mod", mod:"_mod", initAll:"_onInitAllProps"},
					Plugin = _class("plugins." + propName.charAt(0).toUpperCase() + propName.substr(1) + "Plugin",
						function() {
							TweenPlugin.call(this, propName, priority);
							this._overwriteProps = overwriteProps || [];
						}, (config.global === true)),
					p = Plugin.prototype = new TweenPlugin(propName),
					prop;
				p.constructor = Plugin;
				Plugin.API = config.API;
				for (prop in map) {
					if (typeof(config[prop]) === "function") {
						p[map[prop]] = config[prop];
					}
				}
				Plugin.version = config.version;
				TweenPlugin.activate([Plugin]);
				return Plugin;
			};


			//now run through all the dependencies discovered and if any are missing, log that to the console as a warning. This is why it's best to have TweenLite load last - it can check all the dependencies for you.
			a = window._gsQueue;
			if (a) {
				for (i = 0; i < a.length; i++) {
					a[i]();
				}
				for (p in _defLookup) {
					if (!_defLookup[p].func) {
						window.console.log("GSAP encountered missing dependency: " + p);
					}
				}
			}

			_tickerActive = false; //ensures that the first official animation forces a ticker.tick() to update the time when it is instantiated

			return TweenLite;

	})(_gsScope);

	var globals = _gsScope.GreenSockGlobals;
	var nonGlobals = globals.com.greensock;
	var SimpleTimeline = nonGlobals.core.SimpleTimeline;
	var Animation = nonGlobals.core.Animation;
	var Ease = globals.Ease;
	var Linear = globals.Linear;
	var Power1 = globals.Power1;
	var Power2 = globals.Power2;
	var Power3 = globals.Power3;
	var Power4 = globals.Power4;
	var TweenPlugin = globals.TweenPlugin;
	var EventDispatcher = nonGlobals.events.EventDispatcher;

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

	_gsScope._gsDefine("easing.CustomEase", ["easing.Ease"], function() {

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
	                Ease.map[id] = this;
	            }
	            this.getRatio = _getRatio; //speed optimization, faster lookups.
	            this.setData(data, config);
	        },
	        p = CustomEase.prototype = new Ease();

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
	        return Ease.map[id]
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
	        ease = ease.getRatio ? ease : Ease.map[ease] || console.log("No ease found: ", ease);
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

	var CustomEase = globals.CustomEase;

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

	/*!
	 * VERSION: 0.3.0
	 * DATE: 2019-05-13
	 * UPDATES AND DOCS AT: http://greensock.com
	 *
	 * @license Copyright (c) 2008-2019, GreenSock. All rights reserved.
	 * PixiPlugin is subject to the terms at http://greensock.com/standard-license or for
	 * Club GreenSock members, the software agreement that was issued with your membership.
	 *
	 * @author: Jack Doyle, jack@greensock.com
	 */


	    var _numExp = /(\d|\.)+/g,
			_relNumExp = /(?:\d|\-\d|\.\d|\-\.\d|\+=\d|\-=\d|\+=.\d|\-=\.\d)+/g,
			_colorLookup = {aqua:[0,255,255],
				lime:[0,255,0],
				silver:[192,192,192],
				black:[0,0,0],
				maroon:[128,0,0],
				teal:[0,128,128],
				blue:[0,0,255],
				navy:[0,0,128],
				white:[255,255,255],
				fuchsia:[255,0,255],
				olive:[128,128,0],
				yellow:[255,255,0],
				orange:[255,165,0],
				gray:[128,128,128],
				purple:[128,0,128],
				green:[0,128,0],
				red:[255,0,0],
				pink:[255,192,203],
				cyan:[0,255,255],
				transparent:[255,255,255,0]},
			_hue = function(h, m1, m2) {
				h = (h < 0) ? h + 1 : (h > 1) ? h - 1 : h;
				return ((((h * 6 < 1) ? m1 + (m2 - m1) * h * 6 : (h < 0.5) ? m2 : (h * 3 < 2) ? m1 + (m2 - m1) * (2 / 3 - h) * 6 : m1) * 255) + 0.5) | 0;
			},
			/**
			 * @private Parses a color (like #9F0, #FF9900, rgb(255,51,153) or hsl(108, 50%, 10%)) into an array with 3 elements for red, green, and blue or if "format" parameter is "hsl", it will populate the array with hue, saturation, and lightness values. Or if "format" is "number", it'll return a number like 0xFF0000 instead of an array. If a relative value is found in an hsl() or hsla() string, it will preserve those relative prefixes and all the values in the array will be strings instead of numbers (in all other cases it will be populated with numbers).
			 * @param {(string|number)} v The value the should be parsed which could be a string like #9F0 or rgb(255,102,51) or rgba(255,0,0,0.5) or it could be a number like 0xFF00CC or even a named color like red, blue, purple, etc.
			 * @param {(string)} format If "hsl", an hsl() or hsla() value will be returned instead of rgb() or rgba(). Or if "number", then a numeric value will be returned, like 0xFF0000. Default is rgb.
			 * @return {(array|number)} An array containing red, green, and blue (and optionally alpha) in that order, or if the format parameter was "hsl", the array will contain hue, saturation and lightness (and optionally alpha) in that order. Or if "format" is defined as "number", it'll return a number like 0xFF0000. Always numbers unless there's a relative prefix found in an hsl() or hsla() string and "format" is "hsl".
			 */
			_parseColor = function(v, format) {
				var toHSL = (format === "hsl"),
					a, r, g, b, h, s, l, max, min, d, wasHSL;
				if (!v) {
					a = _colorLookup.black;
				} else if (typeof(v) === "number") {
					a = [v >> 16, (v >> 8) & 255, v & 255];
				} else {
					if (v.charAt(v.length - 1) === ",") { //sometimes a trailing comma is included and we should chop it off (typically from a comma-delimited list of values like a textShadow:"2px 2px 2px blue, 5px 5px 5px rgb(255,0,0)" - in this example "blue," has a trailing comma. We could strip it out inside parseComplex() but we'd need to do it to the beginning and ending values plus it wouldn't provide protection from other potential scenarios like if the user passes in a similar value.
						v = v.substr(0, v.length - 1);
					}
					if (_colorLookup[v]) {
						a = _colorLookup[v];
					} else if (v.charAt(0) === "#") {
						if (v.length === 4) { //for shorthand like #9F0
							r = v.charAt(1);
							g = v.charAt(2);
							b = v.charAt(3);
							v = "#" + r + r + g + g + b + b;
						}
						v = parseInt(v.substr(1), 16);
						a = [v >> 16, (v >> 8) & 255, v & 255];
					} else if (v.substr(0, 3) === "hsl") {
						a = wasHSL = v.match(_numExp);
						if (!toHSL) {
							h = (Number(a[0]) % 360) / 360;
							s = Number(a[1]) / 100;
							l = Number(a[2]) / 100;
							g = (l <= 0.5) ? l * (s + 1) : l + s - l * s;
							r = l * 2 - g;
							if (a.length > 3) {
								a[3] = Number(v[3]);
							}
							a[0] = _hue(h + 1 / 3, r, g);
							a[1] = _hue(h, r, g);
							a[2] = _hue(h - 1 / 3, r, g);
						} else if (v.indexOf("=") !== -1) { //if relative values are found, just return the raw strings with the relative prefixes in place.
							return v.match(_relNumExp);
						}
					} else {
						a = v.match(_numExp) || _colorLookup.transparent;
					}
					a[0] = Number(a[0]);
					a[1] = Number(a[1]);
					a[2] = Number(a[2]);
					if (a.length > 3) {
						a[3] = Number(a[3]);
					}
				}
				if (toHSL && !wasHSL) {
					r = a[0] / 255;
					g = a[1] / 255;
					b = a[2] / 255;
					max = Math.max(r, g, b);
					min = Math.min(r, g, b);
					l = (max + min) / 2;
					if (max === min) {
						h = s = 0;
					} else {
						d = max - min;
						s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
						h = (max === r) ? (g - b) / d + (g < b ? 6 : 0) : (max === g) ? (b - r) / d + 2 : (r - g) / d + 4;
						h *= 60;
					}
					a[0] = (h + 0.5) | 0;
					a[1] = (s * 100 + 0.5) | 0;
					a[2] = (l * 100 + 0.5) | 0;
				}
				return (format === "number") ? (a[0] << 16 | a[1] << 8 | a[2]) : a;
			},
			_formatColors = function(s, toHSL) {
				var colors = (s + "").match(_colorExp) || [],
					charIndex = 0,
					parsed = "",
					i, color, temp;
				if (!colors.length) {
					return s;
				}
				for (i = 0; i < colors.length; i++) {
					color = colors[i];
					temp = s.substr(charIndex, s.indexOf(color, charIndex)-charIndex);
					charIndex += temp.length + color.length;
					color = _parseColor(color, (toHSL ? "hsl" : "rgb"));
					if (color.length === 3) {
						color.push(1);
					}
					parsed += temp + (toHSL ? "hsla(" + color[0] + "," + color[1] + "%," + color[2] + "%," + color[3] : "rgba(" + color.join(",")) + ")";
				}
				return parsed + s.substr(charIndex);
			}, _colorStringFilter,
			TweenLite$1 = (_gsScope.GreenSockGlobals || _gsScope).TweenLite,
			_colorExp = "(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#(?:[0-9a-f]{3}){1,2}\\b", //we'll dynamically build this Regular Expression to conserve file size. After building it, it will be able to find rgb(), rgba(), # (hexadecimal), and named color values like red, blue, purple, etc.

			_idMatrix = [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0],
			_lumR = 0.212671,
			_lumG = 0.715160,
			_lumB = 0.072169,

			_applyMatrix = function(m, m2) {
				var temp = [],
					i = 0,
					z = 0,
					y, x;
				for (y = 0; y < 4; y++) {
					for (x = 0; x < 5; x++) {
						z = (x === 4) ? m[i + 4] : 0;
						temp[i + x] = m[i]   * m2[x] + m[i+1] * m2[x + 5] +	m[i+2] * m2[x + 10] + m[i+3] * m2[x + 15] +	z;
					}
					i += 5;
				}
				return temp;
			},

			_setSaturation = function(m, n) {
				var inv = 1 - n,
					r = inv * _lumR,
					g = inv * _lumG,
					b = inv * _lumB;
				return _applyMatrix([r + n, g, b, 0, 0, r, g + n, b, 0, 0, r, g, b + n, 0, 0, 0, 0, 0, 1, 0], m);
			},

			_colorize = function(m, color, amount) {
				var c = _parseColor(color),
					r = c[0] / 255,
					g = c[1] / 255,
					b = c[2] / 255,
					inv = 1 - amount;
				return _applyMatrix([inv + amount * r * _lumR, amount * r * _lumG, amount * r * _lumB, 0, 0, amount * g * _lumR, inv + amount * g * _lumG, amount * g * _lumB, 0, 0, amount * b * _lumR, amount * b * _lumG, inv + amount * b * _lumB, 0, 0, 0, 0, 0, 1, 0], m);
			},

			_setHue = function(m, n) {
				n *= Math.PI / 180;
				var c = Math.cos(n),
					s = Math.sin(n);
				return _applyMatrix([(_lumR + (c * (1 - _lumR))) + (s * (-_lumR)), (_lumG + (c * (-_lumG))) + (s * (-_lumG)), (_lumB + (c * (-_lumB))) + (s * (1 - _lumB)), 0, 0, (_lumR + (c * (-_lumR))) + (s * 0.143), (_lumG + (c * (1 - _lumG))) + (s * 0.14), (_lumB + (c * (-_lumB))) + (s * -0.283), 0, 0, (_lumR + (c * (-_lumR))) + (s * (-(1 - _lumR))), (_lumG + (c * (-_lumG))) + (s * _lumG), (_lumB + (c * (1 - _lumB))) + (s * _lumB), 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1], m);
			},

			_setContrast = function(m, n) {
				return _applyMatrix([n,0,0,0,0.5 * (1 - n), 0,n,0,0,0.5 * (1 - n), 0,0,n,0,0.5 * (1 - n), 0,0,0,1,0], m);
			},

			_getFilter = function(t, type) {
				var filterClass = _gsScope.PIXI.filters[type],
					filters = t.filters || [],
					i = filters.length,
					filter;
				if (!filterClass) {
					throw("PixiPlugin error: " + type + " isn't present.");
				}
				while (--i > -1) {
					if (filters[i] instanceof filterClass) {
						return filters[i];
					}
				}
				filter = new filterClass();
				if (type === "BlurFilter") {
					filter.blur = 0;
				}
				filters.push(filter);
				t.filters = filters;
				return filter;
			},

			_addColorMatrixFilterCacheTween = function(p, pg, cache, vars) { //we cache the ColorMatrixFilter components in a _gsColorMatrixFilter object attached to the target object so that it's easy to grab the current value at any time.
				pg._addTween(cache, p, cache[p], vars[p], p);
				pg._overwriteProps.push(p);
			},

			_applyBrightnessToMatrix = function(brightness, matrix) {
				var temp = new _gsScope.PIXI.filters.ColorMatrixFilter();
				temp.matrix = matrix;
				temp.brightness(brightness, true);
				return temp.matrix;
			},

			_CMFdefaults = {contrast:1, saturation:1, colorizeAmount:0, colorize:"rgb(255,255,255)", hue:0, brightness:1},

			_parseColorMatrixFilter = function(t, v, pg) {
				var filter = _getFilter(t, "ColorMatrixFilter"),
					cache = t._gsColorMatrixFilter = t._gsColorMatrixFilter || {contrast:1, saturation:1, colorizeAmount:0, colorize:"rgb(255,255,255)", hue:0, brightness:1},
					combine = v.combineCMF && !("colorMatrixFilter" in v && !v.colorMatrixFilter),
					i, matrix, startMatrix;
				startMatrix = filter.matrix;
				if (v.resolution) {
					filter.resolution = v.resolution;
				}
				if (v.matrix && v.matrix.length === startMatrix.length) {
					matrix = v.matrix;
					if (cache.contrast !== 1) {
						_addColorMatrixFilterCacheTween("contrast", pg, cache, _CMFdefaults);
					}
					if (cache.hue) {
						_addColorMatrixFilterCacheTween("hue", pg, cache, _CMFdefaults);
					}
					if (cache.brightness !== 1) {
						_addColorMatrixFilterCacheTween("brightness", pg, cache, _CMFdefaults);
					}
					if (cache.colorizeAmount) {
						_addColorMatrixFilterCacheTween("colorize", pg, cache, _CMFdefaults);
						_addColorMatrixFilterCacheTween("colorizeAmount", pg, cache, _CMFdefaults);
					}
					if (cache.saturation !== 1) {
						_addColorMatrixFilterCacheTween("saturation", pg, cache, _CMFdefaults);
					}

				} else {
					matrix = _idMatrix.slice();
					if (v.contrast != null) {
						matrix = _setContrast(matrix, Number(v.contrast));
						_addColorMatrixFilterCacheTween("contrast", pg, cache, v);
					} else if (cache.contrast !== 1) {
						if (combine) {
							matrix = _setContrast(matrix, cache.contrast);
						} else {
							_addColorMatrixFilterCacheTween("contrast", pg, cache, _CMFdefaults);
						}
					}
					if (v.hue != null) {
						matrix = _setHue(matrix, Number(v.hue));
						_addColorMatrixFilterCacheTween("hue", pg, cache, v);
					} else if (cache.hue) {
						if (combine) {
							matrix = _setHue(matrix, cache.hue);
						} else {
							_addColorMatrixFilterCacheTween("hue", pg, cache, _CMFdefaults);
						}
					}
					if (v.brightness != null) {
						matrix = _applyBrightnessToMatrix(Number(v.brightness), matrix);
						_addColorMatrixFilterCacheTween("brightness", pg, cache, v);
					} else if (cache.brightness !== 1) {
						if (combine) {
							matrix = _applyBrightnessToMatrix(cache.brightness, matrix);
						} else {
							_addColorMatrixFilterCacheTween("brightness", pg, cache, _CMFdefaults);
						}
					}
					if (v.colorize != null) {
						v.colorizeAmount = ("colorizeAmount" in v) ? Number(v.colorizeAmount) : 1;
						matrix = _colorize(matrix, v.colorize, v.colorizeAmount);
						_addColorMatrixFilterCacheTween("colorize", pg, cache, v);
						_addColorMatrixFilterCacheTween("colorizeAmount", pg, cache, v);
					} else if (cache.colorizeAmount) {
						if (combine) {
							matrix = _colorize(matrix, cache.colorize, cache.colorizeAmount);
						} else {
							_addColorMatrixFilterCacheTween("colorize", pg, cache, _CMFdefaults);
							_addColorMatrixFilterCacheTween("colorizeAmount", pg, cache, _CMFdefaults);
						}
					}
					if (v.saturation != null) {
						matrix = _setSaturation(matrix, Number(v.saturation));
						_addColorMatrixFilterCacheTween("saturation", pg, cache, v);
					} else if (cache.saturation !== 1) {
						if (combine) {
							matrix = _setSaturation(matrix, cache.saturation);
						} else {
							_addColorMatrixFilterCacheTween("saturation", pg, cache, _CMFdefaults);
						}
					}
				}
				i = matrix.length;
				while (--i > -1) {
					if (matrix[i] !== startMatrix[i]) {
						pg._addTween(startMatrix, i, startMatrix[i], matrix[i], "colorMatrixFilter");
					}
				}
				pg._overwriteProps.push("colorMatrixFilter");
			},

			_addColorTween = function(target, p, value, colorSetter, plugin) {
				var pt = colorSetter._firstPT = {_next:colorSetter._firstPT, t:target, p:p, proxy:{}, f:(typeof(target[p]) === "function")};
				pt.proxy[p] = "rgb(" + _parseColor(!pt.f ? target[p] : target[ ((p.indexOf("set") || typeof(target["get" + p.substr(3)]) !== "function") ? p : "get" + p.substr(3)) ]()).join(",") + ")";
				plugin._addTween(pt.proxy, p, "get", ((typeof(value) === "number") ? "rgb(" + _parseColor(value, false).join(",") + ")" : value), p, null, null, _colorStringFilter);
			},

			//to improve performance, when a color is sensed, we hijack the setRatio() method of the plugin instance with a new function that this method spits back. This is a special method that handles parsing color values on-the-fly and turns them into numeric values which PixiJS requires. In other words, instead of "rgb(255, 0, 0)", PixiJS wants 0xFF0000. This also works with hsl() values.
			_buildColorSetter = function(tween, plugin) {
				var setRatio = plugin.setRatio, //save the original (super) setRatio() function
					func = function(v) {
						var pt = func._firstPT,
							val;
						setRatio.call(plugin, v);
						while (pt) {
							val = _parseColor(pt.proxy[pt.p], "number");
							if (pt.f) {
								pt.t[pt.p](val);
							} else {
								pt.t[pt.p] = val;
							}
							pt = pt._next;
						}
						if (func.graphics) { //in order for PixiJS to actually redraw GraphicsData, we've gotta increment the "dirty" and "clearDirty" values. If we don't do this, the values will be tween properly, but not rendered.
							func.graphics.dirty++;
							func.graphics.clearDirty++;
						}
					};
				plugin.setRatio = func;
				return func;
			},


			_colorProps = {tint:1, lineColor:1, fillColor:1},
			_xyContexts = "position,scale,skew,pivot,anchor,tilePosition,tileScale".split(","),
			_contexts = {x:"position", y:"position", tileX:"tilePosition", tileY:"tilePosition"},
			_colorMatrixFilterProps = {colorMatrixFilter:1, saturation:1, contrast:1, hue:1, colorize:1, colorizeAmount:1, brightness:1, combineCMF:1},
			_DEG2RAD = Math.PI / 180,
	        _degreesToRadians = function(value) {
				return (typeof(value) === "string" && value.charAt(1) === "=") ? value.substr(0, 2) + (parseFloat(value.substr(2)) * _DEG2RAD) : value * _DEG2RAD;
	        }, i, p;

		//context setup...
		for (i = 0; i < _xyContexts.length; i++) {
			p = _xyContexts[i];
			_contexts[p + "X"] = p;
			_contexts[p + "Y"] = p;
	    }

	    //color parsing setup...
		for (p in _colorLookup) {
			_colorExp += "|" + p + "\\b";
		}
		_colorExp = new RegExp(_colorExp+")", "gi");
		_colorStringFilter = function(a) {
			var combined = a[0] + " " + a[1],
				toHSL;
			_colorExp.lastIndex = 0;
			if (_colorExp.test(combined)) {
				toHSL = (combined.indexOf("hsl(") !== -1 || combined.indexOf("hsla(") !== -1);
				a[0] = _formatColors(a[0], toHSL);
				a[1] = _formatColors(a[1], toHSL);
			}
		};

		if (!TweenLite$1.defaultStringFilter) {
			TweenLite$1.defaultStringFilter = _colorStringFilter;
		}

	    var PixiPlugin$1 = _gsScope._gsDefine.plugin({
	        propName: "pixi",
	        priority: 0,
	        API: 2,
			global: true,
	        version: "0.3.0",

	        init: function (target, values, tween, index) {
	            if (!target instanceof _gsScope.PIXI.DisplayObject) {
	                return false;
	            }
	            var isV4 =  _gsScope.PIXI.VERSION.charAt(0) === "4",
		            context, axis, value, colorMatrix, filter, p, padding, colorSetter, i, data, pt;
	            for (p in values) {
	                context = _contexts[p];
	                value = values[p];
	                if (typeof(value) === "function") {
	                    value = value(index || 0, target);
	                }
	                if (context) {
	                    axis = (p.charAt(p.length-1).toLowerCase().indexOf("x") !== -1) ? "x" : "y";
						this._addTween(target[context], axis, target[context][axis], (context === "skew") ? _degreesToRadians(value) : value, p);
	                } else if (p === "scale" || p === "anchor" || p === "pivot" || p === "tileScale") {
						this._addTween(target[p], "x", target[p].x, value, p + "X");
						this._addTween(target[p], "y", target[p].y, value, p + "Y");
	                } else if (p === "rotation") { //PIXI expects rotation in radians, but as a convenience we let folks define it in degrees and we do the conversion.
						this._addTween(target, p, target.rotation, _degreesToRadians(value), p);

	                } else if (_colorMatrixFilterProps[p]) {
						if (!colorMatrix) {
							_parseColorMatrixFilter(target, values.colorMatrixFilter || values, this);
							colorMatrix = true;
						}
	                } else if (p === "blur" || p === "blurX" || p === "blurY" || p === "blurPadding") {
						filter = _getFilter(target, "BlurFilter");
						this._addTween(filter, p, filter[p], value, p);
						if (values.blurPadding !== 0) {
							padding = values.blurPadding || Math.max(filter[p], value) * 2;
							i = target.filters.length;
							while (--i > -1) {
								target.filters[i].padding = Math.max(target.filters[i].padding, padding); //if we don't expand the padding on all the filters, it can look clipped.
							}
						}
	                } else if (_colorProps[p]) {
						if (!colorSetter) {
							colorSetter = _buildColorSetter(tween, this);
						}
						if ((p === "lineColor" || p === "fillColor") && target instanceof _gsScope.PIXI.Graphics) {
							data = (target.geometry || target).graphicsData; //"geometry" was introduced in PIXI version 5
							i = data.length;
							while (--i > -1) {
								_addColorTween(isV4 ? data[i] : data[i][p.substr(0, 4) + "Style"], isV4 ? p : "color", value, colorSetter, this);
							}
							colorSetter.graphics = target.geometry || target;
						} else {
							_addColorTween(target, p, value, colorSetter, this);
						}
	                } else if (p === "autoAlpha") {
						this._firstPT = pt = {t: {setRatio:function() { target.visible = !!target.alpha; }}, p: "setRatio", s: 0, c: 1, f: 1, pg: 0, n: "visible", pr: 0, m: 0, _next:this._firstPT};
						if (pt._next) {
							pt._next._prev = pt;
						}
						this._addTween(target, "alpha", target.alpha, value, "alpha");
						this._overwriteProps.push("alpha", "visible");
	                } else {
						this._addTween(target, p, target[p], value, p);
	                }
					this._overwriteProps.push(p);
	            }
	            return true;
	        }
	    });

		PixiPlugin$1.colorProps = _colorProps;
		PixiPlugin$1.parseColor = _parseColor;
		PixiPlugin$1.formatColors = _formatColors;
		PixiPlugin$1.colorStringFilter = _colorStringFilter;
		PixiPlugin$1.registerPIXI = function(PIXI) {
			_gsScope.PIXI = PIXI;
		};

	PixiPlugin$1.registerPIXI(PIXI);
	function animation(target, options) {
	    var _a = options.to, to = _a === void 0 ? {} : _a, _b = options.from, from = _b === void 0 ? {} : _b, ease = options.ease, _c = options.delay, _d = options.duration, duration = _d === void 0 ? 3000 : _d, _e = options.repeat, repeat = _e === void 0 ? 0 : _e, _f = options.onStart, onStart = _f === void 0 ? function () { } : _f, _g = options.onUpdate, onUpdate = _g === void 0 ? function () { } : _g, _h = options.onComplete, onComplete = _h === void 0 ? function () { } : _h, _j = options.onReverseComplete, onReverseComplete = _j === void 0 ? function () { } : _j, rest = __rest(options, ["to", "from", "ease", "delay", "duration", "repeat", "onStart", "onUpdate", "onComplete", "onReverseComplete"]);
	    var count = 1;
	    var action = Object.keys(to).length > 0 ? 'to' : (Object.keys(from).length > 0 ? 'from' : 'to');
	    var props = action === 'to' ? to : from;
	    var animate = gsap.TweenLite[action](target, duration / 1000, {
	        ease: getEase(ease),
	        pixi: __assign({}, rest, props),
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
	/**
	 * animate
	 *
	 * @module Animation
	 *
	 * @param target - Animation target
	 * @param { AnimateOptions } options - Animation options
	 */
	function animate(target, options) {
	    animation(target, options);
	}
	function getEase(ease) {
	    if (['ease-in', 'ease-out', 'ease-in-out'].includes(ease)) {
	        return gsap.Power4[camelize(ease)];
	    }
	    else {
	        return gsap.Power4.easeNone;
	    }
	}
	function camelize(string) {
	    return string.replace(/[_.-](\w|$)/g, function (_, $) { return $.toUpperCase(); });
	}

	// @ts-ignore
	var tl = new gsap.TimelineLite();
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
	function moveTo(target, x, y, duration, ease) {
	    var position = {
	        x: 0,
	        y: 0
	    };
	    if (typeof x === 'number' && typeof y === 'number') {
	        position.x = x;
	        position.y = y;
	    }
	    if (typeof x === 'object') {
	        position.x = x.x;
	        position.y = x.y;
	        duration = y;
	        ease = duration;
	    }
	    animate(target, {
	        x: position.x,
	        y: position.y,
	        ease: ease,
	        duration: duration
	    });
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
	/**
	 * shakeInAlarm
	 *
	 * @module Animation
	 *
	 * @param { Object } target - target
	 *
	 * @description - ['shakeInHorz', 'shakeInVetc', 'shakeInRotate', 'shakeInHard'] also except a param `target`
	 */
	function shakeInAlarm(target) {
	    var animations = [{
	            duration: 0.01,
	            vars: {
	                pixi: {
	                    rotation: 5,
	                    x: '+=10'
	                },
	                ease: gsap.Linear.easeNone
	            }
	        }, {
	            duration: 0.01,
	            vars: {
	                pixi: {
	                    rotation: -5,
	                    x: '-=20'
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
	                    x: '+=10'
	                },
	                ease: gsap.Linear.easeNone
	            }
	        }, {
	            duration: 0.01,
	            vars: {
	                pixi: {
	                    x: '-=20'
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
	                    y: '+=10'
	                },
	                ease: gsap.Linear.easeNone
	            }
	        }, {
	            target: target,
	            duration: 0.01,
	            vars: {
	                pixi: {
	                    y: '-=20'
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
	            x: '-=7',
	            y: '+=5',
	            rotation: 1.5 * Math.PI / 180,
	            ease: gsap.Linear.easeIn
	        }, {
	            x: '+=5',
	            y: '-=5',
	            rotation: 1.5 * Math.PI / 180,
	            ease: gsap.Linear.easeIn
	        }, {
	            x: '-=2',
	            y: '+=8',
	            rotation: 1.5 * Math.PI / 180,
	            ease: gsap.Linear.easeIn
	        }, {
	            x: '-=7',
	            y: '+=1',
	            rotation: -(2.5 * Math.PI / 180),
	            ease: gsap.Linear.easeIn
	        }, {
	            x: '-=2',
	            y: '+=8',
	            rotation: 3.5 * Math.PI / 180,
	            ease: gsap.Linear.easeIn
	        }, {
	            x: '-=3',
	            y: '-=8',
	            rotation: -(1.5 * Math.PI / 180),
	            ease: gsap.Linear.easeIn
	        }, {
	            x: '-=8',
	            y: '-=7',
	            rotation: 2.5 * Math.PI / 180,
	            ease: gsap.Linear.easeIn
	        }, {
	            x: '+=0',
	            y: '+=1',
	            rotation: 0.5 * Math.PI / 180,
	            ease: gsap.Linear.easeIn
	        }, {
	            x: '-=2',
	            y: '-=1',
	            rotation: -(1.5 * Math.PI / 180),
	            ease: gsap.Linear.easeIn
	        }, {
	            x: '+=7',
	            y: '+=0',
	            rotation: -(2.5 * Math.PI / 180),
	            ease: gsap.Linear.easeIn
	        }, {
	            x: '+=8',
	            y: '-=6',
	            rotation: -(1.5 * Math.PI / 180),
	            ease: gsap.Linear.easeIn
	        }, {
	            x: '+=1',
	            y: '-=4',
	            rotation: -(0.5 * Math.PI / 180),
	            ease: gsap.Linear.easeIn
	        }, {
	            x: '-=2',
	            y: '+=9',
	            rotation: 3.5 * Math.PI / 180,
	            ease: gsap.Linear.easeIn
	        }, {
	            x: '+=1',
	            y: '-=5',
	            rotation: -(1.5 * Math.PI / 180),
	            ease: gsap.Linear.easeIn
	        }, {
	            x: '-=2',
	            y: '+=7',
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
	function bomb1(target, duration) {
	    if (duration === void 0) { duration = 1000; }
	    if (typeof duration !== 'number') {
	        throw new Error('animation time must be a number!');
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
	                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1')
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
	        throw new Error('animation time must be a number!');
	    }
	    duration = duration / 1000;
	    var animations = [
	        {
	            target: target,
	            duration: 0.01,
	            vars: {
	                pixi: {
	                    y: '-= 300'
	                }
	            }
	        },
	        {
	            target: target,
	            duration: 1 * duration,
	            vars: {
	                pixi: {
	                    y: '+= 300'
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
	        throw new Error('animation time must be a number!');
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
	        throw new Error('animation time must be a number!');
	    }
	    duration = duration / 1000;
	    var animations = [
	        {
	            target: target,
	            duration: 0.01 * duration,
	            vars: {
	                pixi: {
	                    y: '-= 300'
	                }
	            }
	        },
	        {
	            target: target,
	            duration: 1 * duration,
	            vars: {
	                pixi: {
	                    y: '+= 300'
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
	        throw new Error('animation time must be a number!');
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
	                    y: '+=' + ((target.height))
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
	                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1')
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
	                    y: '-=' + ((target.height) / 2),
	                    x: '+=' + ((target.width) / 2)
	                },
	                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1')
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
	        throw new Error('animation time must be a number!');
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
	                    x: '+=200'
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
	                    x: '-=220'
	                },
	                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1')
	            }
	        },
	    ];
	    animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
	}
	function topShockIn(target, duration) {
	    if (duration === void 0) { duration = 1000; }
	    if (typeof duration !== 'number') {
	        throw new Error('animation time must be a number!');
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
	                    y: '-=220'
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
	                    y: '-=30'
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
	                    y: '+=310'
	                },
	                ease: CustomEase.create('custom', 'M0,0 C0.55,0.055 0.675,0.19 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.175,0.885 0.32,1 1,1')
	            }
	        },
	    ];
	    animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
	}
	function breakIn(target, duration) {
	    if (duration === void 0) { duration = 1000; }
	    if (typeof duration !== 'number') {
	        throw new Error('animation time must be a number!');
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
	                    x: '-=' + (target.width / 2),
	                    y: '+=' + (target.height / 2)
	                }
	            }
	        },
	        {
	            target: target,
	            duration: 0.01 * duration,
	            vars: {
	                pixi: {
	                    alpha: 1,
	                    x: '+=300',
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
	                    x: '-=300'
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
	        throw new Error('animation time must be a number!');
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
	                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1')
	            }
	        },
	    ];
	    animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
	}
	function foolishIn(target, duration) {
	    if (duration === void 0) { duration = 1000; }
	    if (typeof duration !== 'number') {
	        throw new Error('animation time must be a number!');
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
	                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.25,0.1 0.25,1 1,1')
	            }
	        },
	    ];
	    animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
	}
	function hingeOut(target, duration) {
	    if (duration === void 0) { duration = 1000; }
	    if (typeof duration !== 'number') {
	        throw new Error('animation time must be a number!');
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
	                    x: '-=' + (target.width / 2),
	                    y: '-=' + (target.height / 2)
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
	            }
	        },
	        {
	            target: target,
	            duration: 0.2 * duration,
	            vars: {
	                pixi: {
	                    rotation: '-=40'
	                },
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
	            }
	        },
	        {
	            target: target,
	            duration: 0.2 * duration,
	            vars: {
	                pixi: {
	                    rotation: '+=20'
	                },
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
	            }
	        },
	        {
	            target: target,
	            duration: 0.2 * duration,
	            vars: {
	                pixi: {
	                    rotation: '-=15'
	                },
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
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
	        throw new Error('animation time must be a number!');
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
	            }
	        },
	        {
	            target: target,
	            duration: 0.15 * duration,
	            vars: {
	                pixi: {
	                    scale: 1 * this.ratio
	                },
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
	            }
	        },
	        {
	            target: target,
	            duration: 0.15 * duration,
	            vars: {
	                pixi: {
	                    scale: 1.3 * this.ratio
	                },
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
	            }
	        },
	        {
	            target: target,
	            duration: 0.15 * duration,
	            vars: {
	                pixi: {
	                    scale: 1 * this.ratio
	                },
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
	            }
	        },
	    ];
	    animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
	}
	function jelly(target, duration) {
	    if (duration === void 0) { duration = 2000; }
	    if (typeof duration !== 'number') {
	        throw new Error('animation time must be a number!');
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
	            }
	        },
	    ];
	    animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
	}
	function swing1(target, duration) {
	    if (duration === void 0) { duration = 2000; }
	    if (typeof duration !== 'number') {
	        throw new Error('animation time must be a number!');
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
	            }
	        },
	        {
	            target: target,
	            duration: 0.5 * duration,
	            vars: {
	                pixi: {
	                    rotation: 30
	                },
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
	            }
	        },
	        {
	            target: target,
	            duration: 0.5 * duration,
	            vars: {
	                pixi: {
	                    rotation: -30
	                },
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
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
	        throw new Error('animation time must be a number!');
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
	            }
	        },
	        {
	            target: target,
	            duration: 0.1 * duration,
	            vars: {
	                pixi: {
	                    rotation: -10
	                },
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
	            }
	        },
	        {
	            target: target,
	            duration: 0.1 * duration,
	            vars: {
	                pixi: {
	                    rotation: 5
	                },
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
	            }
	        },
	        {
	            target: target,
	            duration: 0.1 * duration,
	            vars: {
	                pixi: {
	                    rotation: -2
	                },
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
	            }
	        },
	        {
	            target: target,
	            duration: 0.1 * duration,
	            vars: {
	                pixi: {
	                    rotation: 0
	                },
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
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
	        throw new Error('animation time must be a number!');
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
	            }
	        },
	    ];
	    animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
	}
	function swing4(target, duration) {
	    if (duration === void 0) { duration = 2000; }
	    if (typeof duration !== 'number') {
	        throw new Error('animation time must be a number!');
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
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
	                ease: CustomEase.create('custom', 'M0,0 C0.42,0 0.58,1 1,1')
	            }
	        },
	    ];
	    animations.map(function (animation) { return tl.to(target, animation.duration, animation.vars); });
	}

	var animations = /*#__PURE__*/Object.freeze({
		moveTo: moveTo,
		blink: blink,
		shakeInAlarm: shakeInAlarm,
		shakeInHorz: shakeInHorz,
		shakeInVetc: shakeInVetc,
		shakeInRotate: shakeInRotate,
		shakeInHard: shakeInHard,
		bomb1: bomb1,
		freeFall: freeFall,
		elasticScale: elasticScale,
		elasticMove: elasticMove,
		spiralRotateIn: spiralRotateIn,
		wheelRotateIn: wheelRotateIn,
		topShockIn: topShockIn,
		breakIn: breakIn,
		swashOut: swashOut,
		foolishIn: foolishIn,
		hingeOut: hingeOut,
		heartBeat: heartBeat,
		jelly: jelly,
		swing1: swing1,
		swing2: swing2,
		swing3: swing3,
		swing4: swing4
	});

	PixiPlugin.registerPIXI(PIXI);
	var AniController = /** @class */ (function () {
	    function AniController(sprite, file) {
	        var _this = this;
	        this.lastTimeLine = null;
	        this.aniController = { position: null, scaleX: null, scaleY: null, rotation: null, opacity: null, anchor: null };
	        this.aniData = { position: null, scaleX: null, scaleY: null, rotation: null, opacity: null, anchor: null };
	        var xRatio = 1 / 1.92;
	        var yRatio = window.innerHeight / 750;
	        var sWidth = sprite.width / xRatio;
	        var sHeight = sprite.height / xRatio;
	        var rawFile = new XMLHttpRequest();
	        // 读取json文件
	        var readFileCallBack = function (response) {
	            var ani = JSON.parse(response);
	            var totalFrame = ani.op - ani.ip;
	            var duratuion = totalFrame / ani.fr;
	            if (ani.layers) {
	                ani.layers.map(function (layer) {
	                    // get position data
	                    if (layer.ks && layer.ks.p) {
	                        var posAni = _this.animatePosition(sprite, layer.ks.p, totalFrame, duratuion);
	                        var tl_pos_1 = new gsap.TimelineLite();
	                        posAni.map(function (ani) {
	                            tl_pos_1.to(sprite, duratuion * ani.t, ani);
	                        });
	                        _this.setPosition(tl_pos_1);
	                        _this.setPositionData(posAni);
	                    }
	                    // get scale data
	                    // every dimension has it's own scale and ease cruve
	                    if (layer.ks && layer.ks.s) {
	                        var scaleAni = _this.animationScale(sprite, layer.ks.s, totalFrame, duratuion);
	                        var tl_scale_x_1 = new gsap.TimelineLite();
	                        var tl_scale_y_1 = new gsap.TimelineLite();
	                        scaleAni.x.map(function (ani) {
	                            tl_scale_x_1.to(sprite.scale, duratuion * ani.t, ani);
	                        });
	                        scaleAni.y.map(function (ani) {
	                            tl_scale_y_1.to(sprite.scale, duratuion * ani.t, ani);
	                        });
	                        _this.setScaleX(tl_scale_x_1);
	                        _this.setScaleXData(scaleAni.x);
	                        _this.setScaleY(tl_scale_y_1);
	                        _this.setScaleYData(scaleAni.y);
	                    }
	                    // get rotation data
	                    if (layer.ks && layer.ks.r) {
	                        var rotationAni = _this.animationRotation(sprite, layer.ks.r, totalFrame, duratuion);
	                        var tl_rotation_1 = new gsap.TimelineLite();
	                        rotationAni.map(function (ani) {
	                            tl_rotation_1.to(sprite, duratuion * ani.t, ani);
	                        });
	                        _this.setRotation(tl_rotation_1);
	                        _this.setRotationData(rotationAni);
	                    }
	                    // get alpha data
	                    if (layer.ks && layer.ks.o) {
	                        var opacityAni = _this.animationOpacity(sprite, layer.ks.o, totalFrame, duratuion);
	                        var tl_opacity_1 = new gsap.TimelineLite();
	                        opacityAni.map(function (ani) {
	                            tl_opacity_1.to(sprite, duratuion * ani.t, ani);
	                        });
	                        _this.setOpacity(tl_opacity_1);
	                        _this.setOpacityData(opacityAni);
	                    }
	                    // get the anchor data 
	                    if (layer.ks && layer.ks.a) {
	                        var anchorAni_1 = _this.animationAnchor(sprite, layer.ks.a, totalFrame, duratuion);
	                        var tl_anchor_1 = new gsap.TimelineLite();
	                        var delay_1 = 0;
	                        anchorAni_1.map(function (curve, index) {
	                            delay_1 = index === 0 ? curve.delay :
	                                (anchorAni_1[index - 1].delay - curve.delay);
	                            // delay += index === 0 ? curve.delay * 1000 : 
	                            //                     (anchorAni[index - 1].delay - curve.delay) * 1000
	                            var frameCount = 0;
	                            curve.bezier.points.map(function (data, dataIndex) {
	                                var anchorX = (data.point[0]) / sWidth;
	                                var anchorY = (data.point[1]) / sHeight;
	                                var startAnchorX = frameCount === 0 ? 0.5 : curve.bezier.points[dataIndex - 1].point[0] / sWidth;
	                                var startAnchorY = frameCount === 0 ? 0.5 : curve.bezier.points[dataIndex - 1].point[1] / sHeight;
	                                tl_anchor_1.to(sprite, 1 / 60, {
	                                    pixi: {
	                                        anchorX: anchorX,
	                                        anchorY: anchorY
	                                    },
	                                    delay: dataIndex === 0 ? delay_1 : 0
	                                });
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
	                                frameCount++;
	                            });
	                        });
	                        _this.setAnchor(tl_anchor_1);
	                        _this.setAnchorData(anchorAni_1);
	                    }
	                    // set lastFrame timeline
	                    _this.setLastFrameTimeline();
	                    // trigger registered event callback
	                    _this.triggerReisteredCallback();
	                });
	            }
	        };
	        rawFile.overrideMimeType("application/json");
	        rawFile.open("GET", file, true);
	        rawFile.onreadystatechange = function () {
	            if (rawFile.readyState === 4 && rawFile.status === 200) {
	                readFileCallBack(rawFile.response);
	            }
	        };
	        rawFile.send(null);
	    }
	    AniController.prototype.buildPath = function (t, e, r, i, frames) {
	        var s = (t[0] + "_" + t[1] + "_" + e[0] + "_" + e[1] + "_" + r[0] + "_" + r[1] + "_" + i[0] + "_" + i[1]).replace(/\./g, "p");
	        var a;
	        var n;
	        var o;
	        var h;
	        var l;
	        var p;
	        var m;
	        var f = frames;
	        var c = 0;
	        var d = null;
	        2 === t.length && (t[0] !== e[0] || t[1] !== e[1]) && this.y(t[0], t[1], e[0], e[1], t[0] + r[0], t[1] + r[1]) && this.y(t[0], t[1], e[0], e[1], e[0] + i[0], e[1] + i[1]) && (f = 2);
	        var u = {
	            segmentLength: 0,
	            points: new Array(t)
	        };
	        for (o = r.length, a = 0; a < f; a += 1) {
	            var timeSegmentx = this.getBezierCruveTimex(a / (f - 1));
	            var timeSegmenty = this.getBezierCruveTimey(a / (f - 1));
	            // l = (timeSegmenty - 206) / ( 888 - 206)
	            l = (a / (f - 1));
	            for (m = this.createSizedArray(o), n = p = 0; n < o; n += 1) {
	                h = Math.pow(1 - l, 3) * t[n] + 3 * Math.pow(1 - l, 2) * l * (t[n] + r[n]) + 3 * (1 - l) * Math.pow(l, 2) * (e[n] + i[n]) + Math.pow(l, 3) * e[n];
	                m[n] = h;
	                null !== d && (p += Math.pow(m[n] - d[n], 2));
	            }
	            c += p = Math.sqrt(p);
	            u.points[a] = {
	                partialLength: p,
	                point: m
	            };
	            d = m;
	        }
	        u.segmentLength = c;
	        var test = u;
	        return test;
	    };
	    AniController.prototype.getBezierCruveTimex = function (time) {
	        var timeSegment = Math.pow(1 - time, 3) * 120 + 3 * Math.pow(1 - time, 2) * time * (120) + 3 * (1 - time) * Math.pow(time, 2) * (127) + Math.pow(time, 3) * 828;
	        return timeSegment;
	    };
	    AniController.prototype.getBezierCruveTimey = function (time) {
	        var timeSegment = Math.pow(1 - time, 3) * 206 + 3 * Math.pow(1 - time, 2) * time * (888) + 3 * (1 - time) * Math.pow(time, 2) * (206) + Math.pow(time, 3) * 888;
	        return timeSegment;
	    };
	    AniController.prototype.y = function (t, e, r, i, s, a) {
	        var n = t * i + e * s + r * a - s * i - a * t - r * e;
	        return -.001 < n && n < .001;
	    };
	    AniController.prototype.createSizedArray = function (t) {
	        return Array.apply(null, {
	            length: t
	        });
	    };
	    AniController.prototype.animatePosition = function (sprite, data, totalFrame, duration) {
	        var animation = [];
	        if (data.k && data.k[0].i) {
	            var startPoint_1 = { x: 0, y: 0 };
	            var endPoint_1 = { x: 0, y: 0 };
	            var totalDelay_1 = 0;
	            if (data.k[0].t > 0) {
	                totalDelay_1 += data.k[0].t / totalFrame;
	            }
	            data.k.map(function (d, index) {
	                // get ease string
	                var easeString = '';
	                if (data.k[index].i && data.k[index].o) {
	                    easeString = 'M0,0 C' + data.k[index].o.x + ',' + data.k[index].o.y + ' ' +
	                        data.k[index].i.x + ',' + data.k[index].i.y + ' 1,1';
	                }
	                if (data.k[index + 1]) {
	                    // get postion point
	                    var xValue = data.k[index + 1].s[0] - data.k[index].s[0];
	                    var yValue = data.k[index + 1].s[1] - data.k[index].s[1];
	                    if (index === 0) {
	                        startPoint_1 = {
	                            x: sprite.x,
	                            y: sprite.y
	                        };
	                        endPoint_1 = {
	                            x: sprite.x + xValue,
	                            y: sprite.y + yValue
	                        };
	                    }
	                    else {
	                        startPoint_1 = endPoint_1;
	                        endPoint_1 = {
	                            x: startPoint_1.x + xValue,
	                            y: startPoint_1.y + yValue
	                        };
	                    }
	                    // get bezier cruve control point
	                    var bezierPoints = [];
	                    bezierPoints.push(startPoint_1); // start point
	                    bezierPoints.push({
	                        x: startPoint_1.x + data.k[index].to[0],
	                        y: startPoint_1.y + data.k[index].to[1]
	                    }); // controll point
	                    bezierPoints.push({
	                        x: endPoint_1.x + data.k[index].ti[0],
	                        y: endPoint_1.y + data.k[index].ti[1]
	                    }); // controll point
	                    bezierPoints.push(endPoint_1); // end point
	                    animation.push({
	                        bezier: {
	                            type: 'cubic',
	                            values: bezierPoints
	                        },
	                        ease: CustomEase.create("custom", easeString),
	                        t: (data.k[index + 1].t - data.k[index].t) / totalFrame,
	                        delay: totalDelay_1 * duration,
	                        lastFrame: (data.k[index + 1].t / totalFrame) === 1 ? true : false
	                    });
	                }
	                else {
	                    return;
	                }
	            });
	        }
	        return animation;
	    };
	    // currently ignore dimension z
	    AniController.prototype.animationScale = function (sprite, data, totalFrame, duration) {
	        var animation = { x: null, y: null };
	        var animationX = [];
	        var animationY = [];
	        var easeStringX = '';
	        var easeStringY = '';
	        var totalDelay = 0;
	        if (data.k[0].t > 0) {
	            totalDelay += data.k[0].t / totalFrame;
	        }
	        if (data.k && data.k[0].i) {
	            data.k.map(function (d, index) {
	                if (data.k[index].i && data.k[index].o) {
	                    easeStringX = 'M0,0 C' + data.k[index].o.x[0] + ',' + data.k[index].o.y[0] + ' ' +
	                        data.k[index].i.x[0] + ',' + data.k[index].i.y[0] + ' 1,1';
	                    easeStringY = 'M0,0 C' + data.k[index].o.x[1] + ',' + data.k[index].o.y[1] + ' ' +
	                        data.k[index].i.x[1] + ',' + data.k[index].i.y[1] + ' 1,1';
	                }
	                if (data.k[index + 1]) {
	                    animationX.push({
	                        x: data.k[index + 1].s[0] / 100,
	                        ease: CustomEase.create("custom", easeStringX),
	                        t: (data.k[index + 1].t - data.k[index].t) / totalFrame,
	                        delay: totalDelay * duration,
	                        lastFrame: (data.k[index + 1].t / totalFrame) === 1 ? true : false
	                    });
	                    animationY.push({
	                        y: data.k[index + 1].s[1] / 100,
	                        ease: CustomEase.create("custom", easeStringY),
	                        t: (data.k[index + 1].t - data.k[index].t) / totalFrame,
	                        delay: totalDelay * duration,
	                        lastFrame: (data.k[index + 1].t / totalFrame) === 1 ? true : false
	                    });
	                }
	                else {
	                    return;
	                }
	            });
	        }
	        animation.x = animationX;
	        animation.y = animationY;
	        return animation;
	    };
	    AniController.prototype.animationRotation = function (sprite, data, totalFrame, duration) {
	        var animation = [];
	        var easeString = '';
	        var totalDelay = 0;
	        if (data.k[0].t > 0) {
	            totalDelay += data.k[0].t / totalFrame;
	        }
	        if (data.k && data.k[0].i) {
	            data.k.map(function (d, index) {
	                if (data.k[index + 1]) {
	                    if (data.k[index].i && data.k[index].o) {
	                        easeString = 'M0,0 C' + data.k[index].o.x[0] + ',' + data.k[index].o.y[0] + ' ' +
	                            data.k[index].i.x[0] + ',' + data.k[index].i.y[0] + ' 1,1';
	                    }
	                    animation.push({
	                        rotation: (data.k[index + 1].s[0] - data.k[index].s[0]) * Math.PI / 180,
	                        ease: CustomEase.create("custom", easeString),
	                        t: (data.k[index + 1].t - data.k[index].t) / totalFrame,
	                        delay: totalDelay * duration,
	                        lastFrame: (data.k[index + 1].t / totalFrame) === 1 ? true : false
	                    });
	                }
	                else {
	                    return;
	                }
	            });
	        }
	        return animation;
	    };
	    AniController.prototype.animationOpacity = function (srpite, data, totalFrame, duration) {
	        var animation = [];
	        var easeString = '';
	        var totalDelay = 0;
	        if (data.k[0].t > 0) {
	            totalDelay += data.k[0].t / totalFrame;
	        }
	        if (data.k && data.k[0].i) {
	            data.k.map(function (d, index) {
	                if (data.k[index + 1]) {
	                    if (data.k[index].i && data.k[index].o) {
	                        easeString = 'M0,0 C' + data.k[index].o.x[0] + ',' + data.k[index].o.y[0] + ' ' +
	                            data.k[index].i.x[0] + ',' + data.k[index].i.y[0] + ' 1,1';
	                    }
	                    animation.push({
	                        alpha: data.k[index + 1].s[0] / 100,
	                        ease: CustomEase.create("custom", easeString),
	                        t: (data.k[index + 1].t - data.k[index].t) / totalFrame,
	                        delay: totalDelay * duration,
	                        lastFrame: (data.k[index].t / totalFrame) === 1 ? true : false
	                    });
	                }
	                else {
	                    return;
	                }
	            });
	        }
	        return animation;
	    };
	    AniController.prototype.animationAnchor = function (sprite, data, totalFrame, duration) {
	        var _this = this;
	        var animation = [];
	        if (data.k && data.k[0].i) {
	            var startPoint_2 = [0, 0, 0];
	            var endPoint_2 = [0, 0, 0];
	            var time_1 = 0;
	            var totalDelay_2 = 0;
	            if (data.k[0].t > 0) {
	                totalDelay_2 += data.k[0].t / totalFrame;
	            }
	            data.k.map(function (d, index) {
	                // get ease string
	                var easeString = '';
	                if (data.k[index].i && data.k[index].o) {
	                    easeString = 'M0,0 C' + data.k[index].o.x + ',' + data.k[index].o.y + ' ' +
	                        data.k[index].i.x + ',' + data.k[index].i.y + ' 1,1';
	                }
	                if (data.k[index + 1]) {
	                    startPoint_2 = [
	                        data.k[index].s[0],
	                        data.k[index].s[1],
	                        data.k[index].s[2],
	                    ];
	                    endPoint_2 = [
	                        data.k[index + 1].s[0],
	                        data.k[index + 1].s[1],
	                        data.k[index + 1].s[2],
	                    ];
	                    time_1 = (data.k[index + 1].t - data.k[index].t) / totalFrame,
	                        animation.push({
	                            bezier: _this.buildPath(startPoint_2, endPoint_2, data.k[index].to, data.k[index].ti, time_1 * duration * 60),
	                            ease: CustomEase.create("custom", easeString),
	                            t: time_1,
	                            delay: totalDelay_2 * duration,
	                            lastFrame: (data.k[index + 1].t / totalFrame) === 1 ? true : false
	                        });
	                }
	                else {
	                    return;
	                }
	            });
	        }
	        return animation;
	    };
	    AniController.prototype.triggerReisteredCallback = function () {
	        if (this.loadedCb)
	            this.loadedCb();
	        if (this.completeCb)
	            this.completeCb();
	        if (this.reverseCompleteCb)
	            this.reverseCompleteCb();
	    };
	    AniController.prototype.play = function () {
	        for (var property in this.aniController) {
	            if (this.aniController.hasOwnProperty(property) && this.aniController[property] !== null) {
	                this.aniController[property].play();
	            }
	        }
	    };
	    AniController.prototype.stop = function () {
	        for (var property in this.aniController) {
	            if (this.aniController.hasOwnProperty(property) && this.aniController[property] !== null) {
	                this.aniController[property].pause();
	            }
	        }
	    };
	    AniController.prototype.reverse = function () {
	        for (var property in this.aniController) {
	            if (this.aniController.hasOwnProperty(property) && this.aniController[property] !== null) {
	                this.aniController[property].reverse();
	            }
	        }
	    };
	    AniController.prototype.setPosition = function (pos) {
	        this.aniController.position = pos;
	    };
	    AniController.prototype.setPositionData = function (pos) {
	        this.aniData.position = pos;
	    };
	    AniController.prototype.setScaleX = function (scaleX) {
	        this.aniController.scaleX = scaleX;
	    };
	    AniController.prototype.setScaleXData = function (scaleX) {
	        this.aniData.scaleX = scaleX;
	    };
	    AniController.prototype.setScaleY = function (scaleY) {
	        this.aniController.scaleY = scaleY;
	    };
	    AniController.prototype.setScaleYData = function (scaleY) {
	        this.aniData.scaleY = scaleY;
	    };
	    AniController.prototype.setRotation = function (rotation) {
	        this.aniController.rotation = rotation;
	    };
	    AniController.prototype.setRotationData = function (rotation) {
	        this.aniData.rotation = rotation;
	    };
	    AniController.prototype.setOpacity = function (opacity) {
	        this.aniController.opacity = opacity;
	    };
	    AniController.prototype.setOpacityData = function (opacity) {
	        this.aniData.opacity = opacity;
	    };
	    AniController.prototype.setAnchor = function (anchor) {
	        this.aniController.anchor = anchor;
	    };
	    AniController.prototype.setAnchorData = function (anchor) {
	        this.aniData.anchor = anchor;
	    };
	    AniController.prototype.setLastFrameTimeline = function () {
	        for (var property in this.aniData) {
	            if (this.aniData.hasOwnProperty(property) && this.aniData[property] !== null) {
	                for (var _i = 0, _a = this.aniData[property]; _i < _a.length; _i++) {
	                    var data = _a[_i];
	                    if (data.lastFrame) {
	                        this.lastTimeLine = this.aniController[property];
	                        return;
	                    }
	                }
	            }
	        }
	    };
	    AniController.prototype.on = function (status, callback) {
	        var _this = this;
	        if (this.lastTimeLine === null) {
	            switch (status) {
	                case 'loadComplete':
	                    this.loadedCb = callback;
	                case 'complete':
	                    this.completeCb = function () { _this.lastTimeLine.eventCallback('onComplete', function () { return callback(); }); };
	                    break;
	                case 'reverseComplete':
	                    this.reverseCompleteCb = function () { _this.lastTimeLine.eventCallback('onReverseComplete', function () { return callback(); }); };
	                    break;
	            }
	        }
	        else {
	            switch (status) {
	                case 'complete':
	                    this.lastTimeLine.eventCallback('onComplete', function () { return callback(); });
	                    break;
	                case 'reverseComplete':
	                    this.lastTimeLine.eventCallback('onReverseComplete', function () { return callback(); });
	                    break;
	            }
	        }
	    };
	    return AniController;
	}());
	function LoadAnimation(target, JSON) {
	    return new AniController(target, JSON);
	}

	var queryAnimate = {
	    animate: function (options) {
	        for (var i = 0; i < this.length; i++) {
	            animate(this[i], options);
	        }
	    }
	};
	var keys = Object.keys(animations);
	var values = Object.values(animations);
	keys.map(function (animation, index) {
	    queryAnimate[animation] = function () {
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i] = arguments[_i];
	        }
	        for (var i = 0; i < this.length; i++) {
	            // @ts-ignore
	            values[index].apply(values, [this[i]].concat(args));
	        }
	    };
	});
	// @ts-ignore
	if (window.query)
	    window.query.extend(queryAnimate);

	exports.LoadAnimation = LoadAnimation;
	exports.blink = blink;
	exports.bomb1 = bomb1;
	exports.breakIn = breakIn;
	exports.default = animate;
	exports.elasticMove = elasticMove;
	exports.elasticScale = elasticScale;
	exports.foolishIn = foolishIn;
	exports.freeFall = freeFall;
	exports.heartBeat = heartBeat;
	exports.hingeOut = hingeOut;
	exports.jelly = jelly;
	exports.moveTo = moveTo;
	exports.queryAnimate = queryAnimate;
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
