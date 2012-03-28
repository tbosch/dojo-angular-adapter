define(
		[ 'angular/angular', 'dojox/grid/DataGrid', 'nlp/util', 'dojo/parser', 'dojo/store/Memory', 'dojo/data/ObjectStore', 'dojo/_base/config', 'dojo/aspect', 'dojo/_base/lang','dojo/_base/declare' ],
		function(angular, DataGrid, util, parser, Memory, ObjectStore, config, aspect, lang, declare) {

			// Do not log deferred errors, as we are showing them in this grid!
			config.deferredOnError = function() {
			};
			// enable io events.
			config.ioPublish = true;

			var messagedGrid = declare('nlp.MessagesGrid', DataGrid, {
				constructor : function(args) {
					lang.mixin(this, args);
					this.inherited(arguments);
					var grid = this;
					var scope = this.scope;
					dojo.subscribe("/dojo/io/error", function(dfd, response) {
						setData(grid, prepareGridData(scope, response));
						scope.$broadcast("refreshDojoGrids");
					});
					scope.$on("clearCache", function() {
						setData(grid, []);
						clearDtoErrors(scope);
					});
				},
				onSelectionChanged : function() {
					this.inherited(arguments);
					var sel = this.selection.getSelected();
					if (sel.length == 1) {
						var dto = sel[0].dto;
						if (dto) {
							this.scope.$broadcast('selectId', dto.id);
						}
					}
				}
			});
			messagedGrid.markupFactory = DataGrid.markupFactory;

			function prepareGridData(scope, response) {
				clearDtoErrors(scope);
				var json = null;
				try {
					json = dojo.fromJson(response.responseText);
				} catch (e) {
					// xhr error that does not contain json in the payload.
					return [ {
						message : response.message
					} ];
				}
				var res = [];
				if (json.validationViolations) {
					// validation exception in payload
					dojo.forEach(json.validationViolations, function(violation) {
						var dto = getAndMarkDto(scope, violation.dtoId);
						res.push({
							message : violation.messages.join(';'),
							dto : dto
						});
					});
				} else if (json.message) {
					// general exception in payload
					res.push({
						message : json.message
					});
				}
				return res;
			}

			function clearDtoErrors(scope) {
				util.findInCache(function(dto) {
					if (dto.__error) {
						delete dto.__error;
					}
				});
			}

			function getAndMarkDto(scope, id) {
				var dto = util.getEntity(id);
				if (dto) {
					dto.__error = true;
				}
				return dto;
			}

			function setData(grid, items) {
				// Note: We do NOT use Item FileReadStore, as it destroys the
				// original
				// object structure (makes every property an array)
				var store = new ObjectStore({
					objectStore : new Memory({
						data : items
					})
				});
				grid.setStore(store);
			}

			return messagedGrid;
		});