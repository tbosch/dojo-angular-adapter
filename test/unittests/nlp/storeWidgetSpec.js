define([ 'utils/unitTestHelper', 'dojox/grid/DataGrid', 'dijit/form/FilteringSelect', 'dojox/rpc/Rest' ], function(helper, _, _, Rest) {
	describe("nlp:store", function() {
		var c, someStore, request;
		function init(attributes) {
			if (!attributes) {
				attributes = '';
			}
			request = undefined;
			helper.server.handle = function(prequest) {
				request = prequest;
			};
			c = helper.compile('<nlp:store entity="SomeEntity"' + attributes + '></nlp:store>');
			someStore = window.SomeEntity;
		}

		it("should create a store", function() {
			init();
			expect(someStore.fetch).toBeTruthy();
		});

		it("should save the entityClass in the store", function() {
			init();
			expect(someStore.entityClass).toBe("SomeEntity");
		});

		it("should call the given url with uri of the crudservice and append a trailing slash", function() {
			init();
			someStore.fetch();
			expect(request.url).toEqual("/nlp-web/services/crud/SomeEntity/");
		});

		it("should set a query range of 100 be default", function() {
			init();
			someStore.fetch();
			expect(request.requestHeaders.range).toEqual("items=0-99");
		});

		it("should allow a custom query range by the maxrows attribute", function() {
			init(' maxRows="50"');
			someStore.fetch();
			expect(request.requestHeaders.range).toEqual("items=0-49");
		});

		it("should set the number of transaction actions as header attribute", function() {
			init();
			someStore.newItem({
				name : 'newName'
			});
			someStore.save();
			expect(request.requestHeaders.transactionactions).toEqual(1);
		});

		describe("getValue", function() {
			it("should resolve nested object properties", function() {
				init();
				var val = {
					obj1 : {
						obj2 : {
							name : 'test'
						}
					}
				};
				expect(someStore.getValue(val, 'obj1.obj2.name')).toBe('test');
			});

			it("should resolve not existing nested object properties", function() {
				init();
				var val = {
					obj1 : {
						obj2 : {
							name : 'test'
						}
					}
				};
				expect(someStore.getValue(val, 'obj1.obj10.nameasdf')).toBeUndefined();
			});
		});

		describe("setValue", function() {
			it("should resolve nested object properties", function() {
				init();
				var val = {
					obj1 : {
						obj2 : {
							name : ''
						}
					}
				};
				someStore.setValue(val, 'obj1.obj2.name', 'test')
				expect(val.obj1.obj2.name).toBe('test');
			});

			it("should resolve not existing nested object properties", function() {
				init();
				var val = {
					obj1 : {
						obj2 : {
							name : 'test'
						}
					}
				};
				someStore.setValue(val, 'obj1.obj10.nameasdf');
			});
		});

		describe("client caching", function() {
			var sampleData = dojo.toJson([ {
				id : 1
			}, {
				id : 12
			}, {
				id : 3
			} ]);

			var items;

			function fetchAndExpectXhr(fetchOptions, jsonResult) {
				fetchOptions.onComplete = function(pitems) {
					items = pitems;
				};
				runs(function() {
					items = undefined;
					request = undefined;
					someStore.fetch(fetchOptions);
					expect(request).toBeDefined();
					request.receive(200, jsonResult);
				});
				waitsFor(function() {
					return !!items;
				});
			}

			function fetchAndExpectCache(fetchOptions) {
				fetchOptions.onComplete = function(pitems) {
					items = pitems;
				};
				runs(function() {
					items = undefined;
					request = undefined;
					someStore.fetch(fetchOptions);
				});
				waitsFor(function() {
					return !!items;
				});
				runs(function() {
					expect(request).toBeUndefined();
				});
			}

			it("should cache calls on the client", function() {
				init();
				fetchAndExpectXhr({}, sampleData);
				runs(function() {
					expect(items.length).toBe(3);
				});
				fetchAndExpectCache({});
				runs(function() {
					expect(items.length).toBe(3);
				});
			});

			it("should sort on the client for non cached calls", function() {
				init();
				fetchAndExpectXhr({
					sort : [ {
						attribute : 'id',
						descending : true
					} ]
				}, sampleData);
				runs(function() {
					expect(items.length).toBe(3);
					expect(items[0].id).toEqual(12);
				});
			});

			it("should sort on the client for cached calls", function() {
				init();
				fetchAndExpectXhr({}, sampleData);
				fetchAndExpectCache({
					sort : [ {
						attribute : 'id',
						descending : true
					} ]
				});
				runs(function() {
					expect(items.length).toBe(3);
					expect(items[0].id).toEqual(12);
				});
			});

			it("should not include the sorting in server requests", function() {
				init();
				fetchAndExpectXhr({
					sort : [ {
						attribute : 'id',
						descending : true
					} ]
				}, sampleData);
				runs(function() {
					var sortIndex = request.url.indexOf('sort');
					expect(sortIndex).toBe(-1);
				});
			});

			it("should filter exact on the client", function() {
				init();
				fetchAndExpectXhr({}, sampleData);
				fetchAndExpectCache({
					query : {
						id : '1'
					}
				});
				runs(function() {
					expect(items.length).toBe(1);
					expect(items[0].id).toEqual(1);
				});
			});

			it("should filter on the client and ignore the finder filter attribute", function() {
				init();
				fetchAndExpectXhr({}, sampleData);
				fetchAndExpectCache({
					query : {
						id : '1',
						finder: 'someFinder'
					}
				});
				runs(function() {
					expect(items.length).toBe(1);
					expect(items[0].id).toEqual(1);
				});
			});

			it("should filter entites with an id in the filter on the client", function() {
				init();
				var sampleData = dojo.toJson([ {
					id : 1,
					person : {
						id : 2,
						name : 'test'
					}
				} ]);
				fetchAndExpectXhr({}, sampleData);
				fetchAndExpectCache({
					query : {
						person : '2'
					}
				});
				runs(function() {
					expect(items.length).toBe(1);
					expect(items[0].id).toEqual(1);
				});
			});

			it("should filter with wildcard on the client", function() {
				init();
				fetchAndExpectXhr({}, sampleData);
				fetchAndExpectCache({
					query : {
						id : '1*'
					}
				});
				runs(function() {
					expect(items.length).toBe(2);
					expect(items[0].id).toEqual(1);
					expect(items[1].id).toEqual(12);
				});
			});

			it("should not filter on the client when the server result was limited by maxrows", function() {
				init(' maxRows="3"');
				fetchAndExpectXhr({}, sampleData);
				fetchAndExpectXhr({
					query : {
						id : '1'
					}
				}, sampleData);
			});

			it("should return the cached query if the result was limited by maxrows but we had an exact cache match", function() {
				init(' maxRows="3"');
				fetchAndExpectXhr({}, sampleData);
				fetchAndExpectCache({}, sampleData);
			});

			it("should filter on the client when the server result was not limited by maxrows", function() {
				init(' maxRows="4"');
				fetchAndExpectXhr({}, sampleData);
				fetchAndExpectCache({
					query : {
						id : '1'
					}
				});
			});
		});

		describe("scope api", function() {

			it("should call store.newItem with an increasing negative id", function() {
				init();
				var someItem = {
					id : 10,
					__id : '/SomeWidget/-3'
				};
				spyOn(someStore, 'newItem').andReturn(someItem);
				c.scope.SomeEntity.newItem();
				var lastId = someStore.newItem.mostRecentCall.args[0].id;
				expect(lastId).toBeLessThan(0);
				c.scope.SomeEntity.newItem();
				var nextId = someStore.newItem.mostRecentCall.args[0].id;
				expect(nextId).toBe(lastId - 1);
			});

			it("should always create an absolute id in the new item", function() {
				// The original store did not provide an absolute id for new
				// items.
				// This was fixed and needs to be checked.
				init();
				var someItem = {
					id : 10,
					__id : '/SomeWidget/-3'
				};
				spyOn(someStore, 'newItem').andReturn(someItem);
				var res = c.scope.SomeEntity.newItem();
				expect(res).toBe(someItem.id);
				expect(someItem.id).toBe(someItem.__id);
			});

			it("should call store.deleteItem with the resolved id", function() {
				init();
				spyOn(someStore, 'deleteItem');
				var id = '/SomeEntity/10';
				var someItem = {
					id : id
				};
				Rest._index[id] = someItem;
				c.scope.SomeEntity.deleteItem(id);
				expect(someStore.deleteItem).toHaveBeenCalledWith(someItem);
			});
			it("should call deleteItems with the resolved ids", function() {
				init();
				spyOn(someStore, 'deleteItem');
				var id = '/SomeEntity/10';
				var someItem = {
					id : id
				};
				Rest._index[id] = someItem;
				c.scope.SomeEntity.deleteItems([ id ]);
				expect(someStore.deleteItem).toHaveBeenCalledWith(someItem);
			});

			it("should clear the caches on clearCache event", function() {
				init();
				someStore._updates = [ {
					id : 10
				} ];
				spyOn(someStore, 'clearCache');
				c.scope.$emit("clearCache");
				expect(someStore.clearCache).toHaveBeenCalled();
				expect(someStore._updates.length).toBe(0);
			});
		});

	});

});
