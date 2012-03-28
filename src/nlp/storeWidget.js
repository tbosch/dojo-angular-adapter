define([ 'dojo/_base/lang', 'dojox/data/JsonRestStore', 'dojox/rpc/Rest', 'nlp/nlpConfig', 'dojo/_base/Deferred', 'dojo/DeferredList', 'nlp/util',
		"dojo/data/util/filter" ], function(dlang, JsonRestStore, RpcRest, nlpConfig, Deferred, DeferredList, util, filter) {
	// Patch für JsonRest.js: Per Default werden Rest-Transaktionen in Dojo via
	// "transaction"-Header übertragen,
	// der beim letzten Request auf "commit" gesetzt wird. Allerdings kann es
	// auf Grund von paralleler Verarbeitung in Servlets
	// vorkommen, dass die Requests sich im Server überholen.
	// Als Lösung wird bei jedem POST/PUT für eine Transaktion der zusätzliche
	// Header "TransactionActions" mitgesendet,
	// der angibt, wie viele Aktionen zu der Transaktion gehören.
	// Damit kann der Server selber bestimmen, ob alle Actions angekommen sind.
	var jr = dojox.rpc.JsonRest;
	var plainSendToServer = jr.sendToServer;
	jr.sendToServer = function(actions, kwArgs) {
		var plainXhr = dojo.xhr;
		dojo.xhr = function(method, args) {
			// keep the transaction open as we send requests
			args.headers = args.headers || {};
			// the last one should commit the transaction
			args.headers['TransactionActions'] = actions.length;
			return plainXhr.apply(dojo, arguments);
		};
		var res = plainSendToServer.call(this, actions, kwArgs);
		// revert back to the normal XHR handler
		dojo.xhr = plainXhr;
		return res;
	};

	var customStore = dojo.declare([ JsonRestStore ], {
		maxRows : 100,
		cacheByDefault : true,
		matchesQuery : function(item, request) {
			// Copy of ClientFilter#matchesQuery, but with extra handling for
			// the "finder"-Attribute.
			var query = request.query;
			var ignoreCase = request.queryOptions && request.queryOptions.ignoreCase;
			for ( var i in query) {
				// if anything doesn't match, than this should be in the query
				var match = query[i];
				var value = this.getValue(item, i);
				// Match für Entities wie einen match für deren Id betrachten.
				if (value && value.id) {
					value = value.id;
				}
				if (i != "finder") {
					if ((typeof match == 'string' && (match.match(/[\*\.]/) || ignoreCase)) ? !filter.patternToRegExp(match, ignoreCase).test(value)
							: value != match) {
						return false;
					}
				}
			}
			return true;
		},
		_doQuery : function(args) {
			// We need to set the max row count here, as we are using the
			// ClientFilter.
			// That filter will always remove all paging constrains given by
			// grids, ...
			// for better caching performance!
			if (!args.count) {
				args.count = this.maxRows;
			}
			var self = this;
			var sort = args.sort;
			// Always sort the results on the client, and never on the server!
			delete args.sort;
			var deferred = this.inherited(arguments);
			deferred.addCallback(function(items) {
				// Note: This is also called for fetching a single item.
				// In that case items is a single object, not an array!
				if (items.length && items.length > 0) {
					if (sort) {
						args.sort = sort;
					}
					return self.clientSideFetch(args, items);
				}
				return items;
			});
			return deferred;
		},
		querySuperSet : function(argsSuper, argsSub) {
			// If the result was restricted by the maximum amount per query (see
			// _doQuery above),
			// do not use client side filtering, as this would produce incorrect
			// results!
			if (!angular.Object.equals(argsSuper.query, argsSub.query) && argsSuper.count && argsSuper.cacheResults) {
				if (argsSuper.cacheResults.length >= argsSuper.count) {
					return false;
				}
			}
			return this.inherited(arguments);
		}
	});

	var newIdCounter = -1;

	angular.widget('nlp:store', function(element) {
		var entity = element.attr("entity");
		if (!entity) {
			throw new Error("No entity attribute defined for store " + element);
		}
		var storeAddress = nlpConfig.nlpUrl + "services/crud/" + entity;
		// Add trailing slash. This is important for ClientFilter to work
		// correctly!!
		if (storeAddress[storeAddress.length - 1] !== '/') {
			storeAddress += '/';
		}
		var maxRows = parseInt(element.attr("maxrows"), 10);
		return function(element) {
			var scope = this;
			var service = RpcRest(storeAddress, true);
			var initData = {
				service : service
			};
			if (maxRows) {
				initData.maxRows = maxRows;
			}
			var dataStore = new customStore(initData);
			dataStore.entityClass = entity;
			window[entity] = dataStore;
			scope.$on("clearCache", function() {
				dataStore.clearCache();
				dataStore._updates = [];
			});
			var scopeApi = {
				newItem : function() {
					var res = dataStore.newItem({
						id : newIdCounter--
					});
					// needs to be corrected...
					res.id = res.__id;
					return res.id;
				},
				deleteItem : function(id) {
					return dataStore.deleteItem(util.getEntity(id));
				},
				deleteItems : function(ids) {
					dojo.forEach(ids, function(id) {
						scopeApi.deleteItem(id);
					});
				}
			};
			scope[entity] = scopeApi;
		};
	});
});