define([ 'nlp/util', 'dojox/rpc/Rest', 'dojox/data/JsonRestStore', 'utils/unitTestHelper' ], function(util, Rest, JsonRestStore, helper) {
	describe('util', function() {
		describe("storeAccessor", function() {
			it("should get the property value", function() {
				var id = '/SomeEntity/12';
				var item = {
					id : id,
					__id : id,
					name : 'someName'
				};
				Rest._index[id] = item;
				expect(util.storeAccessor(id, 'name').get()).toBe('someName');
			});
			it("should get the non existent property value", function() {
				var id = '/SomeEntity/12';
				var item = {
					id : id,
					__id : id,
				};
				Rest._index[id] = item;
				expect(util.storeAccessor(id, 'nonExistentProperty').get()).toBeUndefined();
			});
			it("should set the property value", function() {
				var id = '/SomeEntity/12';
				var item = {
					id : id,
					__id : id,
					name : 'someName'
				};
				Rest._index[id] = item;
				util.storeAccessor(id, 'name').set('someName2');
				expect(item.name).toBe('someName2');
			});
			it("should set empty strings as nulls", function() {
				var id = '/SomeEntity/12';
				var item = {
					id : id,
					__id : id,
					name : 'someName'
				};
				Rest._index[id] = item;
				util.storeAccessor(id, 'name').set('');
				expect(item.name).toBe(null);
			});
			it("should get the nested entities as ids", function() {
				var id1 = '/SomeEntity/12';
				var id2 = '/SomeEntity/13';
				var item2 = {
					id : id2,
					__id : id2,
					name : 'someName'
				};
				var item = {
					id : id1,
					__id : id1,
					obj : item2
				};
				Rest._index[id1] = item;
				Rest._index[id2] = item2;
				expect(util.storeAccessor(id1, 'obj').get()).toBe(id2);
			});
			it("should get the property value of nested entities", function() {
				var id1 = '/SomeEntity/12';
				var id2 = '/SomeEntity/13';
				var item2 = {
					id : id2,
					__id : id2,
					name : 'someName'
				};
				var item = {
					id : id1,
					__id : id1,
					obj : item2
				};
				Rest._index[id1] = item;
				Rest._index[id2] = item2;
				expect(util.storeAccessor(id1, 'obj.name').get()).toBe('someName');
			});
			it("should get the property value of non existent nested entities", function() {
				var id1 = '/SomeEntity/12';
				var item = {
					id : id1,
					__id : id1
				};
				Rest._index[id1] = item;
				expect(util.storeAccessor(id1, 'nonExistentObj.name').get()).toBeUndefined();
			});
			it("should set the nested entities by ids", function() {
				var id1 = '/SomeEntity/12';
				var id2 = '/SomeEntity/13';
				var item2 = {
					id : id2,
					__id : id2,
					name : 'someName'
				};
				var item = {
					id : id1,
					__id : id1
				};
				Rest._index[id1] = item;
				Rest._index[id2] = item2;
				util.storeAccessor(id1, 'obj').set(id2);
				expect(item.obj).toBe(item2);
			});
			it("should set the property value of nested entities", function() {
				var id1 = '/SomeEntity/12';
				var id2 = '/SomeEntity/13';
				var item2 = {
					id : id2,
					__id : id2,
					name : 'someName'
				};
				var item = {
					id : id1,
					__id : id1,
					obj : item2
				};
				Rest._index[id1] = item;
				Rest._index[id2] = item2;
				util.storeAccessor(id1, 'obj.name').set('someName2');
				expect(item2.name).toBe('someName2');
			});
			it("should set the property value of non existent nested entities", function() {
				var id1 = '/SomeEntity/12';
				var item = {
					id : id1,
					__id : id1
				};
				Rest._index[id1] = item;
				util.storeAccessor(id1, 'nonExistentObj.name').set('someName2');
			});
			it("should request a dojoGridRefresh event when data is changed", function() {
				var id = '/SomeEntity/12';
				var item = {
					id : id,
					__id : id,
					name : 'someName'
				};
				Rest._index[id] = item;
				var scope = angular.scope();
				util.fireRefreshEventIfNeeded(scope);
				spyOn(scope, '$broadcast');
				util.storeAccessor(id, 'name').set('someName2');
				util.fireRefreshEventIfNeeded(scope);
				expect(scope.$broadcast).toHaveBeenCalledWith('refreshDojoGrids');
				
			});
			describe("get entity", function() {
				it("should get the entity", function() {
					var id = '/SomeEntity/12';
					var item = {
						id : id,
						__id : id,
						name : 'someName'
					};
					Rest._index[id] = item;
					expect(util.storeAccessor(id, 'name').entity()).toBe(item.id);
				});
				it("should find property if unknown property requested", function() {
					var id = '/SomeEntity/12';
					var item = {
						id : id,
						__id : id,
						name : 'someName'
					};
					Rest._index[id] = item;
					expect(util.storeAccessor(id, 'unknownproperty').entity()).toBe(item.id);
				});
				it("should get the entity from nested properties", function() {
					var id1 = '/SomeEntity/12';
					var id2 = '/SomeEntity/13';
					var item2 = {
						id : id2,
						__id : id2,
						name : 'someName'
					};
					var item = {
						id : id1,
						__id : id1,
						obj : item2
					};
					Rest._index[id1] = item;
					Rest._index[id2] = item2;
					expect(util.storeAccessor(id1, 'obj.name').entity()).toBe(id2);
				});
			});
		});

		describe("isEntityId", function() {
			it("should detect entity ids", function() {
				expect(util.isEntityId("/SomeEntity/12")).toBe(true);
				expect(util.isEntityId("/nlp-web/services/crud/SomeEntity/12")).toBe(true);
			});
			it("should detect non entity ids", function() {
				expect(util.isEntityId("/12")).toBe(false);
				expect(util.isEntityId("/12/SomeEntity")).toBe(false);
				expect(util.isEntityId("asdf")).toBe(false);
			});
		});

		describe("getEntity", function() {
			it("should resolve the entity from the Rest._index", function() {
				var id = "/SomeEntity/12";
				var item = {
					__id : id,
					id : id,
					name : 'someName'
				};
				Rest._index[id] = item;
				expect(util.getEntity(id)).toBe(item);
			});

		});

		describe("afterIo", function() {
			it("should return resolved promise when no io is in progress", function() {
				var resolved;
				util.afterIo().then(function() {
					resolved = true;
				});
				expect(resolved).toBe(true);
			});
			it("should return a promise that resolves when the io is finished", function() {
				var resolved;
				runs(function() {
					var request;
					helper.server.handle = function(prequest) {
						request = prequest;
						// request.receive(200, "");
					};
					dojo.xhrGet({
						url : 'someUrl'
					});
					util.afterIo().then(function() {
						resolved = true;
					});
					expect(resolved).toBeUndefined();
					request.receive(200, "");
				});
				waitsFor(function() {
					return resolved;
				});
			});

		});
		describe("findInCache", function() {
			it("should access the global cache of dojox.rpc.Rest", function() {
				dojox.rpc.Rest._index = ({
					a : {
						id : 10
					},
					b : {
						id : 11
					},
					c : function() {
					}
				});
				var res = util.findInCache(function(item) {
					return item.id == 11;
				});
				expect(res).toBe(dojox.rpc.Rest._index.b);
			});
		});
		describe("dojoGridRefresh", function() {
			var scope;
			beforeEach(function() {
				scope = angular.scope();
				util.fireRefreshEventIfNeeded(scope);
			});
			it("should fire a broadcast event when requested", function() {
				spyOn(scope, '$broadcast');
				util.fireRefreshEventIfNeeded(scope);
				expect(scope.$broadcast).not.toHaveBeenCalled();
				util.requestDojoGridRefresh();
				util.fireRefreshEventIfNeeded(scope);
				expect(scope.$broadcast).toHaveBeenCalledWith("refreshDojoGrids");
			});
		});

	});

});
