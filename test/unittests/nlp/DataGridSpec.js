define([ 'utils/unitTestHelper', 'dojox/data/JsonRestStore', 'nlp/util' ], function(helper, JsonRestStore, util) {
	describe("nlp.DataGrid", function() {
		var store, c, data, fetchSpy;

		beforeEach(function() {
			data = [];
			helper.server.handle = function(request) {
				request.receive(200, angular.toJson(data));
			};
			store = new JsonRestStore({
				target : '/someUrl',
				syncMode : true
			});
			window.someStore = store;
			fetchSpy = spyOn(store, 'fetch').andCallThrough();
		});

		function init(dojoAttrs, elementAttrs, extraCols) {
			var markup = '<table id="someGrid" data-dojo-type="nlp.DataGrid" data-dojo-props="store:someStore';
			if (dojoAttrs) {
				markup += "," + dojoAttrs;
			}
			markup += '"';
			if (elementAttrs) {
				markup += elementAttrs;
			}
			markup += '>' + '  <thead>' + '<tr><th field="name">Name</th>';
			if (extraCols) {
				markup+=extraCols;
			}
			markup += '</tr>' + '  </thead></table>';
			c = helper.compile(markup);
		}
		
		it("should mark rows with dirty entities", function() {
			init(null, ' ng:controller="nlp.MainController"');
			data = [ {
				id : '/someUrl/10',
				name : 'someName'
			} ];
			c.widget.filter();
			expect(c.widget.rowCount).toBe(1);
			expect(dojo.hasClass(c.widget.getRowNode(0), 'dirty')).toBe(false);
			var item = c.widget.getItem(0);
			c.scope.storeAccess(item.id, 'name').set('newName');
			c.scope.$apply();
			expect(dojo.hasClass(c.widget.getRowNode(0), 'dirty')).toBe(true);
		});
		
		it("should not mark rows with nested dirty entities that are not displays", function() {
			init(null, ' ng:controller="nlp.MainController"');
			data = [ {
				id : '/someUrl/10',
				obj : {
					id : '/someUrl/11',
					name: 'someName'
				}
			} ];
			c.widget.filter();
			expect(c.widget.rowCount).toBe(1);
			expect(dojo.hasClass(c.widget.getRowNode(0), 'dirty')).toBe(false);
			var item = c.widget.getItem(0);
			c.scope.storeAccess(item.id, 'obj.name').set('newName');
			c.scope.$apply();
			expect(dojo.hasClass(c.widget.getRowNode(0), 'dirty')).toBe(false);
		});

		it("should mark rows with nested dirty entities", function() {
			init(null, ' ng:controller="nlp.MainController"', '<th field="obj.id">nested object</th>');
			data = [ {
				id : '/someUrl/10',
				obj : {
					id : '/someUrl/11',
					name: 'someName'
				}
			} ];
			c.widget.filter();
			expect(c.widget.rowCount).toBe(1);
			expect(dojo.hasClass(c.widget.getRowNode(0), 'dirty')).toBe(false);
			var item = c.widget.getItem(0);
			c.scope.storeAccess(item.id, 'obj.name').set('newName');
			c.scope.$apply();
			expect(dojo.hasClass(c.widget.getRowNode(0), 'dirty')).toBe(true);
		});

		describe("selection", function() {
			beforeEach(function() {
				init();
			});
			it("should save the ids of the selected items in the selection.all property", function() {
				data = [ {
					id : '/someUrl/10',
					name : 'test'
				}, {
					id : '/someUrl/11',
					name : 'test2'
				} ];
				c.widget.filter();
				expect(c.scope.someGrid.selection.all).toEqual([]);
				c.widget.selection.addToSelection(0);
				expect(c.scope.someGrid.selection.all.length).toBe(1);
				expect(c.scope.someGrid.selection.all[0]).toBe(c.widget.getItem(0).id);
				c.widget.selection.addToSelection(1);
				expect(c.scope.someGrid.selection.all.length).toBe(2);
				expect(c.scope.someGrid.selection.all[1]).toBe(c.widget.getItem(1).id);
			});

			it("should save the id of the first selected row in the selection.single property", function() {
				data = [ {
					id : '/someUrl/10'
				}, {
					id : '/someUrl/11'
				} ];
				c.widget.filter();
				expect(c.scope.someGrid.selection.single).toBeFalsy();
				c.widget.selection.addToSelection(0);
				expect(c.scope.someGrid.selection.single).toBe(c.widget.getItem(0).id);
				c.widget.selection.addToSelection(1);
				expect(c.scope.someGrid.selection.single).toBeFalsy();
			});

			it("should call $apply on the scope when the selection changes", function() {
				data = [ {
					id : '/someUrl/10',
					name : 'someName'
				} ];
				c.widget.filter();
				spyOn(c.scope, '$apply').andCallThrough();
				c.widget.selection.addToSelection(0);
				expect(c.scope.$apply).toHaveBeenCalled();
			});

			it("should call $apply on the scope when the store data changes", function() {
				data = [ {
					id : '/someUrl/10',
					name : 'someName'
				} ];
				c.widget.filter();
				spyOn(c.scope, '$apply').andCallThrough();
				c.widget.store.setValue(c.widget.getItem(0), 'name', 'someNewName');
				expect(c.scope.$apply).toHaveBeenCalled();
			});

			it("should detect changes in the selection when the grid refreshes and update the selection in the scope", function() {
				data = [ {
					id : '/someUrl/10',
					name : 'someName'
				} ];
				c.widget.filter();
				c.widget.selection.addToSelection(0);
				expect(c.scope.someGrid.selection.all.length).toBe(1);
				spyOn(c.scope, '$apply').andCallThrough();
				c.widget.filter({}, true);
				expect(c.scope.$apply).toHaveBeenCalled();
				expect(c.widget.selection.getSelected().length).toBe(0);
				expect(c.scope.someGrid.selection.all.length).toBe(0);
			});
		});

		describe("filter", function() {
			it("should expose the grid.filter property as accessor function", function() {
				init();
				data = [ {
					id : '/someUrl/10',
					name : 'someName'
				} ];
				c.scope.someGrid.filter('name').set("someValue");
				expect(c.scope.someGrid.filter('name').get()).toBe("someValue");
			});

			it("should watch the grid.filter property in the scope", function() {
				init();
				data = [ {
					id : '/someUrl/10',
					name : 'someName'
				} ];
				c.scope.someGrid.filter('name').set("someValue");
				c.scope.$digest();
				expect(fetchSpy).toHaveBeenCalled();
				expect(fetchSpy.mostRecentCall.args[0].query).toEqual({
					name : 'someValue'
				});
			});

			it("should create filter widgets for every column", function() {
				init();
				data = [ {
					id : '/someUrl/10',
					name : 'someName'
				} ];
				c.widget.update();
				var filterNodes = dojo.query(".filter", c.widget.domNode);
				expect(filterNodes.length).toBe(1);
				var filterWidget = dijit.byNode(filterNodes[0]);
				expect(filterWidget).toBeTruthy();
				filterWidget.set('value', 'someValue1');
				expect(c.scope.someGrid.filter('name').get()).toBe("someValue1");
			});

			it("should set the filter widgets to selectable in ie", function() {
				var oldIe = require.has.cache.ie;
				var oldHasCache = dojo.clone(require.has.cache);
				require.has.cache.ie = 8;
				delete require.has.cache.khtml;
				delete require.has.cache.webkit;

				init();
				data = [ {
					id : '/someUrl/10',
					name : 'someName'
				} ];
				c.widget.update();
				expect(c.widget.domNode.unselectable).toEqual('on');
				var filterNodes = dojo.query(".filter", c.widget.domNode);

				expect(filterNodes[0].unselectable).toEqual('');
				require.has.cache = oldHasCache;
			});

			it("should remove empty properties from the query filter, but not properties with value 0", function() {
				init();
				c.scope.someGrid.filter('name').set(undefined);
				c.scope.$digest();
				expect(fetchSpy.mostRecentCall.args[0].query).toEqual({});
				c.scope.someGrid.filter('name').set(null);
				c.scope.$digest();
				expect(fetchSpy.mostRecentCall.args[0].query).toEqual({});
				c.scope.someGrid.filter('name').set('');
				c.scope.$digest();
				expect(fetchSpy.mostRecentCall.args[0].query).toEqual({});
				c.scope.someGrid.filter('name').set(0);
				fetchSpy.reset();
				c.scope.$digest();
				expect(fetchSpy.mostRecentCall.args[0].query).toEqual({
					name : 0
				});
			});

			it("should watch the selection of the parent grid", function() {
				init("parent:'parentGrid:parentProp'");
				data = [ {
					id : '/someUrl/10',
					name : 'someName'
				} ];
				c.scope.parentGrid = {
					selection : {
						single : 11
					}
				};
				c.scope.$digest();
				expect(fetchSpy.mostRecentCall.args[0].query).toEqual({
					'parentProp' : 11
				});
			});

			it("should use -1 for an empty parent id also for the initial load", function() {
				init("parent:'parentGrid:parentProp'");
				expect(fetchSpy.mostRecentCall.args[0].query).toEqual({
					'parentProp' : -1
				});
			});

			it("should use -1 for an empty parent id to prevent load of all rows", function() {
				init("parent:'parentGrid:parentProp'");
				data = [ {
					id : '/someUrl/10',
					name : 'someName'
				} ];
				c.scope.$digest();
				expect(fetchSpy.mostRecentCall.args[0].query).toEqual({
					'parentProp' : -1
				});
			});

			it("should merge normal filter and parent link when filter is called (even outside of the $digest cycle)", function() {
				init("parent:'parentGrid:parentProp'");
				data = [ {
					id : '/someUrl/10',
					name : 'someName'
				} ];
				c.scope.parentGrid = {
					selection : {
						single : 11
					}
				};
				fetchSpy.reset();
				c.scope.someGrid.filter('name').set('someName');
				c.widget.filter();
				expect(fetchSpy.argsForCall[0][0].query).toEqual({
					'parentProp' : 11,
					name : 'someName'
				});
			});

			it("should filter on the refresh event with the current query", function() {
				init();
				c.scope.someGrid.filter('name').set('test');
				c.scope.$emit("refresh");
				expect(fetchSpy.mostRecentCall.args[0].query).toEqual({
					name : 'test'
				});
			});

			it("should mark rows with error when the refreshDojoGrids event occured", function() {
				init();
				data = [ {
					id : '/someUrl/10',
					name : 'someName'
				} ];
				c.widget.filter();
				expect(c.widget.rowCount).toBe(1);
				expect(dojo.hasClass(c.widget.getRowNode(0), 'error')).toBe(false);
				var item = c.widget.getItem(0);
				item.__error = true;
				c.scope.$broadcast("refreshDojoGrids");
				expect(dojo.hasClass(c.widget.getRowNode(0), 'error')).toBe(true);
			});

			it("should rerender rows when the refreshDojoGrids event occured", function() {
				init();
				data = [ {
					id : '/someUrl/10',
					name : 'someName'
				} ];
				c.widget.filter();
				expect(c.widget.rowCount).toBe(1);
				var rowNode = c.widget.getRowNode(0);
				expect(rowNode.textContent || rowNode.innerText).toBe('someName');
				c.widget.getItem(0).name = 'someOtherName';
				c.scope.$broadcast("refreshDojoGrids");
				expect(rowNode.textContent || rowNode.innerText).toBe('someOtherName');
			});

			it("should select and scroll to the given item by id", function() {
				init();
				data = [];
				for ( var i = 0; i < 100; i++) {
					data.push({
						id : '/someUrl/' + (i + 100),
						name : 'someName' + i
					});
				}
				c.widget.filter();
				spyOn(c.widget, 'scrollToRow').andCallThrough();
				c.scope.someGrid.selectId('/someUrl/150');
				expect(c.scope.someGrid.selection.single).toBe('/someUrl/150');
				expect(c.widget.scrollToRow).toHaveBeenCalledWith(50);
			});

			it("should not change the selection when the id belongs to a different store", function() {
				init();
				data = [];
				for ( var i = 0; i < 100; i++) {
					data.push({
						id : '/someUrl/' + (i + 100),
						name : 'someName' + i
					});
				}
				c.widget.filter();
				c.scope.someGrid.selectId('/someOtherUrl/150');
				expect(c.scope.someGrid.selection.single).toBeFalsy();
			});

			it("should select the given item by id on selectId event", function() {
				init();
				data = [];
				for ( var i = 0; i < 100; i++) {
					data.push({
						id : '/someUrl/' + (i + 100),
						name : 'someName' + i
					});
				}
				c.widget.filter();
				c.scope.$broadcast("selectId", '/someUrl/150');
				expect(c.scope.someGrid.selection.single).toBe('/someUrl/150');
			});

			it("should call selectId for the parent, wait until io end and then select the id in the grid", function() {
				init("parent:'parentGrid:parentProp'");
				data = [ {
					id : '/someUrl/10',
					parentProp : {
						id : '/someUrl/11'
					}
				} ];
				c.widget.filter();

				var selectedParentId;
				c.scope.parentGrid = {
					selection : {
						single : 0
					},
					selectId : function(id) {
						selectedParentId = id;
					}
				};
				var afterIoDfr = new dojo.Deferred();
				spyOn(util, 'afterIo').andReturn(afterIoDfr);
				c.scope.someGrid.selectId('/someUrl/10');
				expect(selectedParentId).toBe(data[0].parentProp.id);
				expect(c.scope.someGrid.selection.single).toBeFalsy();
				afterIoDfr.resolve();
				expect(c.scope.someGrid.selection.single).toBe(data[0].id);
			});

		});
	});
});
