var asyncWait = {};

(function() {
	var waitHandlers = {};
	
	/**
	 * Call this function to check if the page is ready.
	 */
	asyncWait.ready = function() {
		var name, handler
		for (name in waitHandlers) {
			handler = waitHandlers[name];
			if (handler()) {
				return false;
			}
		}
		return true;
	};
	
	/**
	 * Call this function to make ready return false until the next page reload.
	 */
	asyncWait.waitForReload = function() {
		asyncWait.ready = function() { return false; };
	};

	asyncWait.addWaitHandler = function(name, handler) {
		waitHandlers[name] = handler;
	};

})();

/**
 * Support waiting for page load, also for dojo.
 */
(function() {
	var loaded = false;
	function loadCallback() {
		if (window.require && !window.require.idle()) {
			// Dojo loader may not be ready yet...
			window.require.on('idle', function() {
				loaded = true;
			});
		} else {
			loaded = true;
		}
	} 
	if (window.addEventListener) {
		window.addEventListener("load", loadCallback, false);
     } else if (window.attachEvent) {
    	 window.attachEvent("onload", loadCallback);
     }	

	asyncWait.addWaitHandler('load', function() {
		return !loaded;
	});
})();

/**
 * Support waiting for page unload.
 */
(function() {
	var inReload = false;

	if (window.addEventListener) {
		window.addEventListener('unload', function() {
			inReload = true;
		}, true);
	} else {
		window.attachEvent("onunload", function() {
			inReload = true;
		});
	}

	asyncWait.addWaitHandler('unload', function() {
		return inReload;
	});
})();

/**
 * Adds support for waiting for setTimeout.
 */
(function() {
	var timeouts = {};
	// Note: Do NOT use function.apply here,
	// as sometimes the timeout method
	// is also used with native objects!
	if (!window.oldTimeout) {
		window.oldTimeout = window.setTimeout;
	}
	window.setTimeout = function(fn, time) {
		var handle;
		var callback = function() {
			delete timeouts[handle];
			if (typeof fn == 'string') {
				eval(fn);
			} else {
				fn();
			}
		};
		handle = window.oldTimeout(callback, time);
		timeouts[handle] = true;
		return handle;
	};

	// Note: Do NOT use function.apply here,
	// as sometimes the timeout method
	// is also used with native objects!
	window.oldClearTimeout = window.clearTimeout;
	window.clearTimeout = function(code) {
		window.oldClearTimeout(code);
		delete timeouts[code];
	};
	asyncWait.addWaitHandler('timeout', function() {
		var count = 0;
		for ( var x in timeouts) {
			count++;
		}
		return count != 0;
	});
})();

/**
 * Adds support for async wait handler for the window.setInterval function.
 */
(function() {
	var intervals = {};
	// Note: Do NOT use function.apply here,
	// as sometimes the interval method
	// is also used with native objects!
	window.oldSetInterval = window.setInterval;
	window.setInterval = function(fn, time) {
		var callback = function() {
			if (typeof fn == 'string') {
				eval(fn);
			} else {
				fn();
			}
		};
		var res = window.oldSetInterval(callback, time);
		intervals[res] = 'true';
		return res;
	};

	// Note: Do NOT use function.apply here,
	// as sometimes the interval method
	// is also used with native objects!
	window.oldClearInterval = window.clearInterval;
	window.clearInterval = function(code) {
		window.oldClearInterval(code);
		delete intervals[code];
	};
	// return a function that allows to check
	// if an interval is running...
	asyncWait.addWaitHandler('interval', function() {
		var count = 0;
		for ( var x in intervals) {
			count++;
		}
		return count != 0;
	});
})();

/**
 * Adds support for async wait handler for the window.XMLHttpRequest.
 */
(function() {
	var copyStateFields = [ 'readyState', 'responseText', 'responseXML', 'status', 'statusText' ];
	var proxyMethods = [ 'abort', 'getAllResponseHeaders', 'getResponseHeader', 'open', 'send', 'setRequestHeader' ];

	var oldXHR = window.XMLHttpRequest;
	window.openCallCount = 0;
	var DONE = 4;
	var newXhr = function() {
		var self = this;
		this.origin = new oldXHR();

		function copyState() {
			for ( var i = 0; i < copyStateFields.length; i++) {
				var field = copyStateFields[i];
				try {
					self[field] = self.origin[field];
				} catch (_) {
				}
			}
		}

		function proxyMethod(name) {
			self[name] = function() {
				if (name == 'send') {
					window.openCallCount++;
				}
				var res = self.origin[name].apply(self.origin, arguments);
				copyState();
				return res;
			};
		}

		for ( var i = 0; i < proxyMethods.length; i++) {
			proxyMethod(proxyMethods[i]);
		}
		this.origin.onreadystatechange = function() {
			if (self.origin.readyState == DONE) {
				window.openCallCount--;
			}
			copyState();
			if (self.onreadystatechange) {
				self.onreadystatechange.apply(self.origin, arguments);
			}
		};
		copyState();
	};
	window.XMLHttpRequest = newXhr;

	asyncWait.addWaitHandler('xhr', function() {
		return window.openCallCount != 0;
	});

})();

// ------------------------------------------------------------------
// Simulate.js: Simulate browser events
// ----------------------------------------
/**
 * Functions to simulate events. Based upon
 * https://github.com/jquery/jquery-ui/blob/master/tests/jquery.simulate.js Can
 * also handle elements from different frames.
 * <p>
 * Provides: simulate(el, type, options)
 * Provides: queryAndSimulate(cssSelector, type, options)
 */
(function(window) {
	window.simulate = function(el, type, options) {
		options = extend({}, simulate.defaults, options || {});
		var document = el.ownerDocument;
		simulateEvent(document, el, type, options);
	};
	
	function extend(target) {
		for ( var i = 1; i < arguments.length; i++) {
			var obj = arguments[i];
			for ( var key in obj) {
				target[key] = obj[key];
			};
		}
		return target;
	}

	function simulateEvent(document, el, type, options) {
		var evt = createEvent(document, type, options);
		dispatchEvent(el, type, evt);
		return evt;
	}

	function createEvent(document, type, options) {
		if (/^mouse(over|out|down|up|move)|(dbl)?click$/.test(type)) {
			return mouseEvent(document, type, options);
		} else if (/^key(up|down|press)$/.test(type)) {
			return keyboardEvent(document, type, options);
		} else {
			return otherEvent(document, type, options);
		}
	}

	function mouseEvent(document, type, options) {
		var evt;
		var e = extend({
			bubbles : true,
			cancelable : (type != "mousemove"),
			detail : 0,
			screenX : 0,
			screenY : 0,
			clientX : 0,
			clientY : 0,
			ctrlKey : false,
			altKey : false,
			shiftKey : false,
			metaKey : false,
			button : 0,
			relatedTarget : undefined
		}, options);

		if (typeof document.createEvent == 'function') {
			evt = document.createEvent("MouseEvents");
			evt.initMouseEvent(type, e.bubbles, e.cancelable, e.view, e.detail, e.screenX, e.screenY, e.clientX, e.clientY, e.ctrlKey, e.altKey, e.shiftKey,
					e.metaKey, e.button, e.relatedTarget || document.body.parentNode);
		} else if (document.createEventObject) {
			evt = document.createEventObject();
			extend(evt, e);
			evt.button = {
				0 : 1,
				1 : 4,
				2 : 2
			}[evt.button] || evt.button;
		}
		return evt;
	}

	function keyboardEvent(document, type, options) {
		var evt;

		var e = extend({
			bubbles : true,
			cancelable : true,
			ctrlKey : false,
			altKey : false,
			shiftKey : false,
			metaKey : false,
			keyCode : 0,
			charCode : 0
		}, options);

		if (typeof document.createEvent == 'function') {
			try {
				evt = document.createEvent("KeyEvents");
				evt.initKeyEvent(type, e.bubbles, e.cancelable, e.view, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, e.keyCode, e.charCode);
			} catch (err) {
				evt = document.createEvent("Events");
				evt.initEvent(type, e.bubbles, e.cancelable);
				extend(evt, {
					view : e.view,
					ctrlKey : e.ctrlKey,
					altKey : e.altKey,
					shiftKey : e.shiftKey,
					metaKey : e.metaKey,
					keyCode : e.keyCode,
					charCode : e.charCode
				});
			}
		} else if (document.createEventObject) {
			evt = document.createEventObject();
			extend(evt, e);
		}
		return evt;
	}

	function otherEvent(document, type, options) {
		var evt;

		var e = extend({
			bubbles : true,
			cancelable : true
		}, options);

		if (typeof document.createEvent == 'function') {
			evt = document.createEvent("Events");
			evt.initEvent(type, e.bubbles, e.cancelable);
		} else if (document.createEventObject) {
			evt = document.createEventObject();
			extend(evt, e);
		}
		return evt;
	}

	function dispatchEvent(el, type, evt) {
		// Bugfix for IE8 and click on input type=submit...
		if (type=='click' && el.click) {
			el.click();
		} else if (el.dispatchEvent) {
			el.dispatchEvent(evt);
		} else if (el.fireEvent) {
			el.fireEvent('on' + type, evt);
		}
		return evt;
	}

	extend(simulate, {
		defaults : {
			speed : 'sync',
			view: window
		},
		VK_TAB : 9,
		VK_ENTER : 13,
		VK_ESC : 27,
		VK_PGUP : 33,
		VK_PGDN : 34,
		VK_END : 35,
		VK_HOME : 36,
		VK_LEFT : 37,
		VK_UP : 38,
		VK_RIGHT : 39,
		VK_DOWN : 40
	});

})(window);