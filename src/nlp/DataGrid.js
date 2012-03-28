define([ 'angular/angular', 'dojox/grid/DataGrid', 'dojo/aspect', 'nlp/util', 'dojo/parser', 'dojo/_base/lang', 'dojo/_base/declare', 'dojox/grid/_View', 'dojox/rpc/JsonRest' ],
		function(angular, DataGrid, aspect, util, parser, lang, declare, View, JsonRest) {

			/*
			 * Eine DataGrid-View, die Filter-Header anzeigt.
			 */
			declare('nlp.GridFilterView', View, {
				constructor : function(args) {
					lang.mixin(this, args);
					this.inherited(arguments);
					var self = this;

					function updateFilterSelectableState() {
						if (self.filterRow) {
							dojo.setSelectable(self.filterRow, true);
						}
					}
					aspect.after(this.grid, "postrender", updateFilterSelectableState);
					aspect.after(this.grid, "_onFetchComplete", updateFilterSelectableState);

				},
				renderHeader : function() {
					if (this.filterWidgets) {
						// If the filter widgets were already built, remove them
						// from
						// the dom to prevent the children of their domNode from
						// destruction.
						// Needed for IE, as IE seems to destroy children
						// when innerHTML of the parent is set to another value.
						for ( var i = 0; i < this.filterWidgets.length; i++) {
							angular.element(this.filterWidgets[i].domNode).remove();
						}
						;
					}
					this.inherited(arguments);
					var tbody = this.headerContentNode.firstChild.firstChild;
					this.filterRow = document.createElement("tr");
					tbody.appendChild(this.filterRow);
					if (!this.filterWidgets) {
						for ( var i = 0, cell; (cell = this.structure.cells[0][i]); i++) {
							var td = document.createElement("td");
							var field = cell.field;
							
							this.filterRow.appendChild(td);
							angular.element(td).append(
									'<input data-dojo-type="dijit.form.TextBox" style="width:100%;" class="filter '+cell.cellClasses+'" nlp:model="' + this.grid.id + '.filter(\'' + field
											+ '\')"></input>');
						}
						this.filterWidgets = dojo.parser.parse(this.filterRow);
					} else {
						for ( var i = 0; i < this.filterWidgets.length; i++) {
							var td = document.createElement("td");
							this.filterRow.appendChild(td);
							var fieldDiv = this.filterWidgets[i].domNode;
							td.appendChild(fieldDiv);
						}
					}
					dojo.setSelectable(this.filterRow, true);
				}
			});

			var NlpDataGrid = declare('nlp.DataGrid', DataGrid, {
				constructor : function(args) {
					lang.mixin(this, args);
					this.inherited(arguments);
					var parent = (args.parent || '').split(":");
					var parentGridId, parentPropertyName;
					if (parent.length) {
						parentGridId = parent[0];
						parentPropertyName = parent[1];
					}
					var widget = this;
					var scope = this.scope;
					var gridName = this.id;
					scope[gridName] = {};
					initSelectionHandling(scope, widget, gridName);
					initFilterHandling(scope, widget, gridName, parentGridId, parentPropertyName);
					createSelectId(scope, widget, gridName, parentGridId, parentPropertyName);
					scope.$on("refresh", function() {
						widget.filter(widget.query);
					});
					scope.$on("refreshDojoGrids", function() {
						widget.updateRows(0, widget.rowCount);
					});
				},
				onStyleRow : function(row) {
					this.inherited(arguments);
					var item = this.getItem(row.index);
					if (!item) {
						return;
					}
					var i,j,k,cell,entityId,dirty;
					for (var i=0; i<this.structure.length && !dirty; i++) {
						for (var j=0; j<this.structure[i].cells.length && !dirty; j++) {
							for (var k=0; k<this.structure[i].cells[j].length && !dirty; k++) {
								cell = this.structure[i].cells[j][k];
								entityId = util.storeAccessor(item.id, cell.field).entity();
								if (JsonRest.isDirty(util.getEntity(entityId))) {
									dirty = true;
								}
							}
						}
					}
					if (dirty) {
						row.customClasses += " dirty";
					}
					if (item && item.__error) {
						row.customClasses += " error";
					}
				},
				createView : function(inClass, idx) {
					arguments[0] = "nlp.GridFilterView";
					return this.inherited(arguments);
				}

			});
			NlpDataGrid.markupFactory = DataGrid.markupFactory;

			function initSelectionHandling(scope, widget, gridName) {
				scope[gridName].selection = {};
				aspect.after(widget, "onSelectionChanged", updateScopeWithApply);
				aspect.after(widget.store, "onSet", updateScopeWithApply);
				// When the grid calls the store to fetch data,
				// it deletes it's selection without fireing a selection changed
				// event!
				aspect.after(widget.store, "fetch", updateScopeWithApply);
				function updateScopeWithApply(originalResult) {
					if (!scope.$$phase) {
						scope.$apply(updateScope);
					} else {
						updateScope();
					}
					return originalResult;
				}
				var ignoreScopeUpdate = false;
				function updateScope() {
					if (!ignoreScopeUpdate) {
						ignoreScopeUpdate = true;
						var selectionInScope = {};
						var sel = widget.selection.getSelected();
						selectionInScope.all = [];
						for ( var i = 0; i < sel.length; i++) {
							selectionInScope.all.push(sel[i].id);
						}
						if (sel.length == 1) {
							selectionInScope.single = sel[0].id;
						} else {
							selectionInScope.single = null;
						}
						scope[gridName].selection = selectionInScope;
						ignoreScopeUpdate = false;
					}
				}
			}

			function initFilterHandling(scope, widget, gridName, parentGridId, parentPropertyName) {
				var scopeFilter = {};
				scope[gridName].filter = function(prop) {
					return {
						get : function() {
							return scopeFilter[prop];
						},
						set : function(value) {
							scopeFilter[prop] = value;
						}
					};
				};
				var parentAccessor = function() {
					return scope[parentGridId] && scope[parentGridId].selection && scope[parentGridId].selection.single;
				};
				scope.$watch(function() {
					return {
						filter : scopeFilter,
						parent : parentAccessor()
					};
				}, function(scope, newValue, oldValue) {
					widget.filter();
				});
				// Apply the correct filter, even if outside of the $apply phase
				aspect.before(widget, '_fetch', function() {
					this.query = calcQuery(scope, widget, scopeFilter, parentPropertyName, parentAccessor());
				});
			}

			function calcQuery(scope, widget, filter, parentProp, parentPropValue) {
				// remove empty filter conditions.
				// this is needed for the ClientFilter to work correctly!
				var filterValue = {};
				for ( var key in filter) {
					var value = filter[key];
					if (value !== undefined && value !== null && value !== '') {
						filterValue[key] = value;
					}
				}
				if (parentProp) {
					// Always use a parent filter, even if no parent is given,
					// to prevent loading of all rows!
					if (parentPropValue === null || parentPropValue === undefined) {
						parentPropValue = -1;
					}
					filterValue[parentProp] = parentPropValue;
				}
				if (widget.finder) {
					filterValue.finder = widget.finder;
				}
				return filterValue;
			}

			function createSelectId(scope, widget, gridName, parentGridId, parentPropertyName) {
				function selectLocalItem(item) {
					var index = widget.getItemIndex(item);
					if (index === undefined) {
						return;
					}
					widget.scrollToRow(index);
					widget.selection.deselectAll();
					widget.selection.addToSelection(index);
				}
				var selectId = function(id) {
					var item = util.getEntity(id);
					if (parentGridId) {
						var parentItem = item[parentPropertyName];
						scope[parentGridId].selectId(parentItem.id);
						util.afterIo().then(function() {
							selectLocalItem(item);
						});
					} else {
						selectLocalItem(item);
					}
				};
				scope[gridName].selectId = selectId;
				scope.$on("selectId", function(scope, id) {
					if (id.indexOf(widget.store.service.servicePath) !==-1) {
						selectId(id);
					}
				});
			}

			function addWatch(widget, cell) {
				widget.watch('value', function(propName, oldValue, newValue) {
					console.log("setting field " + cell.field + " to " + newValue);
				});
			}

			return NlpDataGrid;

		});