define([ 'utils/unitTestHelper', 'dojox/rpc/JsonRest', 'dojox/data/JsonRestStore' ], function(helper, JsonRest, JsonRestStore) {
	describe("nlp.MessagesGrid", function() {
		var c, store, items;
		var data = [ {
			id : '/someUrl/10',
			name : 'someName'
		} ];

		function runTest(statusCode, responseText, initCallback, callback) {
			var saveFinished;
			if (!callback) {
				callback = initCallback;
				initCallback = null;
			}
			runs(function() {
				helper.server.handle = function(request) {
					request.receive(200, dojo.toJson(data));
				};
				store = new JsonRestStore({
					target : '/someUrl',
					syncMode : true
				});
				store.fetch({
					onComplete : function(pitems) {
						items = pitems;
					}
				});
				c = helper.compile('<table data-dojo-type="nlp.MessagesGrid">' + '  <thead>'
						+ '<tr><th field="message" cellClasses="message">Message</th></tr>' + '  </thead></table>');
				initCallback && initCallback();
				helper.server.handle = function(request) {
					request.receive(statusCode, responseText);
				};
				store.setValue(items[0], 'name', 'someNewName');
				var actions = store.save({
					revertOnError : false
				});
				actions[0].deferred.then(function() {
					saveFinished = true;
				}, function() {
					saveFinished = true;
				});
			});
			waitsFor(function() {
				return saveFinished;
			});
			runs(callback);
		}

		it("should not contain dojo issue 10615, i.e. allow errors if revertOnError=false", function() {
			runTest(404, "nonJsonData", function() {
				// object should still be dirty
				expect(JsonRest.getDirtyObjects().length).toBe(1);
				expect(JsonRest.getDirtyObjects()[0].object).toBe(items[0]);
				expect(JsonRest.isDirty(items[0])).toBe(true);
			});

		});

		it("should show general xhr errors", function() {
			runTest(404, "nonJsonData", function() {
				expect(c.widget.rowCount).toBe(1);
				expect(c.widget.getItem(0).message).toBe("Unable to load /someUrl/10 status:404");
			});
		});

		it("should show the message of java exceptions", function() {
			var response = {
				message : 'SomeJavaException'
			};
			runTest(400, dojo.toJson(response), function() {
				expect(c.widget.rowCount).toBe(1);
				expect(c.widget.getItem(0).message).toBe("SomeJavaException");
			});
		});

		it("should show multiple validation messages for the same entity as concatenated list", function() {
			var response = {
				validationViolations : [ {
					dtoId : '/someUrl/10',
					messages : [ 'SomeValidationError1', 'SomeValidationError2' ]
				} ]
			};
			runTest(400, dojo.toJson(response), function() {
				expect(c.widget.rowCount).toBe(1);
				expect(c.widget.getItem(0).message).toBe("SomeValidationError1;SomeValidationError2");
			});
		});

		it("should find the object for a validation exception and mark it with the __error flag", function() {
			var response = {
				validationViolations : [ {
					dtoId : '/someUrl/10',
					messages : [ 'SomeValidationError' ]
				} ]
			};
			runTest(400, dojo.toJson(response), function() {
				expect(c.widget.rowCount).toBe(1);
				expect(items[0].__error).toBe(true);
				expect(c.widget.getItem(0).dto).toBe(items[0]);
			});
		});

		it("should fire a selectId event for the error object if a row was selected", function() {
			var response = {
				validationViolations : [ {
					dtoId : '/someUrl/10',
					messages : [ 'SomeValidationError' ]
				} ]
			};
			var selectedId;
			runTest(400, dojo.toJson(response), function() {
				c.scope.$on("selectId", function(scope, id) {
					selectedId = id;
				});
			}, function() {
				expect(selectedId).toBeUndefined();
				c.widget.selection.addToSelection(0);
				expect(selectedId).toBe(c.widget.getItem(0).dto.id);
			});
		});

		it("should keep the error flag for objects after reexecuting the query", function() {
			var response = {
				validationViolations : [ {
					dtoId : '/someUrl/10',
					messages : [ 'SomeValidationError' ]
				} ]
			};
			runTest(400, dojo.toJson(response), function() {
				expect(c.widget.rowCount).toBe(1);
				expect(items[0].__error).toBe(true);
				helper.server.handle = function(request) {
					request.receive(200, dojo.toJson(data));
				};
				var newItems;
				store.fetch({
					onComplete : function(pitems) {
						newItems = pitems;
					}
				});
				expect(c.widget.rowCount).toBe(1);
				expect(newItems[0]).toBe(items[0]);
				expect(newItems[0].__error).toBe(true);
			});
		});

		it("should fire the dojoGridRefresh event when an error occured", function() {
			var response = {
				validationViolations : [ {
					dtoId : '/someUrl/10',
					messages : [ 'SomeValidationError' ]
				} ]
			};
			var eventReceived = false;
			runTest(400, dojo.toJson(response), function() {
				c.scope.$on("refreshDojoGrids", function() {
					eventReceived = true;
				});
			}, function() {
				expect(eventReceived).toBe(true);
			});
		});

		it("should clean errors on clearCache event", function() {
			var response = {
				validationViolations : [ {
					dtoId : '/someUrl/10',
					messages : [ 'SomeValidationError' ]
				} ]
			};
			runTest(400, dojo.toJson(response), function() {
				expect(c.widget.rowCount).toBe(1);
				expect(items[0].__error).toBe(true);
				c.scope.$broadcast("clearCache");
				expect(c.widget.rowCount).toBe(0);
				expect(items[0].__error).toBeUndefined();
			});

		});

	});
});
