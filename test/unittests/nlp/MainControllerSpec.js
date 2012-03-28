define([ 'utils/unitTestHelper', 'nlp/util' ], function(helper, util) {
	describe("MainController", function() {
		var c;
		function init(attributes) {
			c = helper.compile('<div ng:controller="nlp.MainController"></div>');
		}
//TODO
//		it("should update the location in navigateTo", function() {
//			init();
//			spyOn(c.scope.$location, 'url');
//			c.scope.navigateTo('someURL');
//			expect(c.scope.$location.url).toHaveBeenCalledWith('someURL');
//		});
		it("should have storeAccess function mapped to util.storeAccessor", function() {
			init();
			spyOn(util, 'storeAccessor');
			c.scope.storeAccess(10, 'someProperty');
			expect(util.storeAccessor).toHaveBeenCalledWith(10, 'someProperty');
		});

		it("should call rpc.JsonRest.commit", function() {
			init();
			spyOn(dojox.rpc.JsonRest, 'commit');
			c.scope.save();
			expect(dojox.rpc.JsonRest.commit).toHaveBeenCalledWith({
				revertOnError : false
			});
		});

		it("should refresh after save is complete", function() {
			init();
			var saveActions = [ {
				deferred : new dojo.Deferred()
			} ];
			spyOn(dojox.rpc.JsonRest, 'commit').andReturn(saveActions);
			spyOn(c.scope, 'refresh');
			c.scope.save();
			expect(c.scope.refresh).not.toHaveBeenCalled();
			saveActions[0].deferred.callback();
			expect(c.scope.refresh).toHaveBeenCalled();
		});

		it("should not refresh on error", function() {
			init();
			var saveActions = [ {
				deferred : new dojo.Deferred()
			} ];
			spyOn(dojox.rpc.JsonRest, 'commit').andReturn(saveActions);
			spyOn(c.scope, 'refresh');
			c.scope.save();
			expect(c.scope.refresh).not.toHaveBeenCalled();
			saveActions[0].deferred.reject();
			expect(c.scope.refresh).not.toHaveBeenCalled();
		});

		it("should return a promise that will be called after save is complete and eval the scope", function() {
			var scopeData;
			init();
			var saveActions = [ {
				deferred : new dojo.Deferred()
			} ];
			spyOn(dojox.rpc.JsonRest, 'commit').andReturn(saveActions);
			c.scope.$watch('data', function(scope, newData) {
				scopeData = newData;
			});
			c.scope.save().then(function() {
				c.scope.data = "someValue";
			});
			expect(scopeData).toBeFalsy();
			saveActions[0].deferred.callback();
			expect(scopeData).toBe("someValue");
		});

		it("should call isDirty", function() {
			init();
			spyOn(dojox.rpc.JsonRest, 'isDirty').andReturn(true);
			var res = c.scope.isDirty();
			expect(res).toBeTruthy();
			expect(dojox.rpc.JsonRest.isDirty).toHaveBeenCalledWith();
		});

		it("should revert and emit clearCache and refresh events on refresh", function() {
			init();
			var clearCacheEvent;
			var refreshEvent;
			c.scope.$on("clearCache", function() {
				clearCacheEvent = true;
			});
			c.scope.$on("refresh", function() {
				refreshEvent = true;
			});
			spyOn(dojox.rpc.JsonRest, 'revert');
			c.scope.refresh();
			expect(dojox.rpc.JsonRest.revert).toHaveBeenCalledWith();
			expect(clearCacheEvent).toBeTruthy();
			expect(refreshEvent).toBeTruthy();
		});
		it("should fire a refreshDojoGrids event when requested", function() {
			init();
			var event = false;
			c.scope.$on("refreshDojoGrids", function() {
				event = true;
			});
			util.requestDojoGridRefresh();
			expect(event).toBe(false);
			c.scope.$apply();
			expect(event).toBe(true);
		});
		describe("service", function() {
			it("should call the server with POST and the given arguments", function() {
				var request;
				helper.server.handle = function(prequest) {
					request = prequest;
				};
				init();
				c.scope.service('crudService.newInstance', 'someParam', 23);
				expect(request.url).toEqual("/nlp-web/services/invoker/crudService.newInstance");
				expect(request.method).toEqual("POST");
				expect(request.requestText).toEqual(dojo.toJson([ 'someParam', 23 ]));
			});

			it("should return the service result as a promise and eval the scope", function() {
				var request, received, result;
				runs(function() {
					helper.server.handle = function(prequest) {
						request = prequest;
					};
					init();
					c.scope.$watch('result', function(scope, newValue) {
						result = newValue;
					});
					c.scope.service('crudService.newInstance').then(function(presult) {
						c.scope.result = presult;
					});
					request.receive(200, angular.toJson({
						status : 13
					}));
				});
				waitsFor(function() {
					return result;
				});
				runs(function() {
					expect(result).toEqual({
						status : 13
					});
				});
			});

		});

	});

});
