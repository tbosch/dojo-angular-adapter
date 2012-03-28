define([ 'dojox/rpc/Rest', 'dojox/data/JsonRestStore', 'dojo/aspect', 'dojo/_base/config', 'dojo/_base/Deferred', 'dojox/rpc/JsonRest', 'dojo/_base/unload' ], function(Rest, JsonRestStore, aspect,
		config, Deferred, JsonRest, baseUnload) {

	baseUnload.addOnUnload(window, function(){
		if (window.testmode) 
			return undefined;
		if (JsonRest.isDirty()) {
			 return "@i18n(WARN.UNSAVEDCHANGES)";
		}		
	});
	JsonRestStore.prototype.getEntity = function(item, property) {
		var lastDot = property.lastIndexOf('.');
		if (lastDot != -1) {
			return this.getValue(item, property.substring(0, lastDot));
		}
		return item;
	};

	var dojoGridRefreshRequested = false;
	
	aspect.around(JsonRestStore.prototype, 'getValue', function(originalGetValue) {
		return function(item, property) {
			var firstDot = property.indexOf('.');
			if (firstDot != -1) {
				var originalProperty = property;
				var base = originalGetValue.call(this, item, property.substring(0, firstDot));
				if (base == null || base == undefined) {
					return undefined;
				}
				return this.getValue(base, originalProperty.substring(firstDot + 1));
			}
			return originalGetValue.apply(this, arguments);
		};
	});
	aspect.around(JsonRestStore.prototype, 'setValue', function(originalSetValue) {
		return function(item, property, value) {
			if (value == '') {
				value = null;
			}
			var parts = property.split("\.");
			if (parts.length > 1) {
				var lastPart = parts[parts.length - 1];
				parts.pop();
				var base = this.getValue(item, parts.join('.'));
				if (base == null || base == undefined) {
					return;
				}
				item = base;
				property = lastPart;
			}
			requestDojoGridRefresh();
			return originalSetValue.call(this, item, property, value);
		};
	});

	function requestDojoGridRefresh() {
		dojoGridRefreshRequested = true;
	}
	
	function fireRefreshEventIfNeeded(scope) {
		if (dojoGridRefreshRequested) {
			dojoGridRefreshRequested = false;
			scope.$broadcast("refreshDojoGrids");
		}
	}
	
	var entityIdRegex = /(^|.*\/)(\w+)\/([\d-]+)$/;
	function isEntityId(id) {
		return entityIdRegex.test(id);
	}

	function getEntity(id) {
		return Rest._index[id];
	}

	function getStoreEntity(id, property) {
		if (!id) {
			return undefined;
		}
		if (!property) {
			return id;
		}
		var base = getEntity(id);
		if (!base) {
			return undefined;
		}
		var store = dojox.data._getStoreForItem(base);
		return store.getEntity(base, property);
	}

	function getStoreValue(id, property) {
		if (!id) {
			return undefined;
		}
		if (!property) {
			return id;
		}
		var base = getEntity(id);
		var store = dojox.data._getStoreForItem(base);
		return store.getValue(base, property);
	}

	function setStoreValue(id, property, value) {
		if (!id) {
			return undefined;
		}
		if (!property) {
			throw Error("Cannot change the root object");
		}
		var base = getEntity(id);
		var store = dojox.data._getStoreForItem(base);
		store.setValue(base, property, value);
		return value;
	}

	function storeAccessor(id, property) {
		return {
			get : function() {
				var res = getStoreValue(id, property);
				if (res && res.id) {
					return res.id;
				}
				return res;
			},
			set : function(value) {
				if (isEntityId(value)) {
					value = Rest._index[value];
				}
				return setStoreValue(id, property, value);
			},
			entity : function() {
				var entity = getStoreEntity(id, property);
				if (entity) {
					return entity.id;
				}
				return undefined;
			}
		};
	}

	function findInCache(predicate) {
		for ( var x in Rest._index) {
			dto = Rest._index[x];
			if (typeof dto === 'object' && predicate(dto)) {
				return dto;
			}
		}
		return null;
	}

	// enable io events.
	config.ioPublish = true;

	var ioWaitPromise;

	dojo.subscribe("/dojo/io/start", function() {
		ioWaitPromise = new Deferred();
		blockUI(true);
	});

	dojo.subscribe("/dojo/io/stop", function() {
		if (ioWaitPromise) {
			ioWaitPromise.resolve();
			ioWaitPromise = null;
		}
		blockUI(false);
	});
	
	function afterIo() {
		if (!ioWaitPromise) {
			var res = new Deferred();
			res.resolve();
			return res;
		} else {
			return ioWaitPromise;
		}
	}

	var fadeSpeed = 250; //ms
	var visible = 'block';
	var invisible = 'none';

	function displayReady(ready) {	
		var pageNode = document.getElementById('page');
		var waiterNode = document.getElementById('waiter');
		if (ready) {
			hideNode(waiterNode);
			showNode(pageNode);		
		} else {
			hideNode(pageNode);
			showNode(waiterNode);		
		}
	}

	function blockUI(block) {
		var waiterNode = document.getElementById('waiter');
		if (block) {
			showNode(waiterNode);
		} else {
			hideNode(waiterNode);
		}
	}

	function hideNode(domNode) {	
		if (domNode == null || invisible == dojo.style(domNode,'display'))
			return;
		dojo.style(domNode,'display', invisible);	
	}

	function showNode(domNode) {
		if (domNode == null || visible == dojo.style(domNode,'display'))
			return;
		dojo.style(domNode,'opacity',0);
		dojo.style(domNode,'display',visible);
		dojo.fadeIn({node:domNode,duration:fadeSpeed}).play();
	}

	return {
		displayReady: displayReady,
		isEntityId : isEntityId,
		getEntity : getEntity,
		storeAccessor : storeAccessor,
		findInCache : findInCache,
		afterIo : afterIo,
		fireRefreshEventIfNeeded: fireRefreshEventIfNeeded,
		requestDojoGridRefresh: requestDojoGridRefresh
	};

});
