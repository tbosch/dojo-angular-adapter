define([ 'angular/angular', 'dijit/form/_FormWidget', 'nlp/util' ], function(angular, _FormWidget, util) {
	
	var DISABLED = {};
	angular.directive('nlp:model', function(modelName) {
		return function(element) {
			var scope = this;			
			element.data("widgetCallbacks").push(function() {
				var widget = element.data('widget');
				var disableWatch = false;
				scope.$watch(function() {
					var value = scope.$eval(modelName);
					if (value && typeof value.entity === 'function' && !value.entity()) {
						 return DISABLED;
					}
					if (value && typeof value.get === 'function') {
						return value.get();
					}
					return value;
				}, function(scope, newValue, oldValue) {					
					if (!disableWatch) {
						disableWatch = true;
						widget.set('disabled', DISABLED === newValue);
						if (newValue === undefined || newValue === null || newValue === DISABLED) {
							widget.reset();
						} else {
							// Support for FilteringSelect
							if (widget._setItemAttr) {
								widget.set('item', util.getEntity(newValue));
							} else {
								widget.set('value', newValue);
							}
						}
						disableWatch = false;
					}
				});
				widget.watch('value', function(propName, oldValue, newValue) {
					if (!disableWatch) {
						disableWatch = true;
						scope.$apply(function(currScope) {
							// Support for FilteringSelect
							if (widget.item) {
								newValue = widget.item.id; 
							}
							var model = scope.$eval(modelName);
							if (model && typeof model.set === 'function') {
								model.set(newValue);
								return;
							}
							// setting a plain value in the scope.
							// TODO this is a hack as angular does no more
							// provide the $set function.
							// See FormController.prototype.$createWidget, which
							// uses the private function
							// parser(params.model).assignable()
							currScope.tmpValue = newValue;
							scope.$eval(modelName + "=tmpValue");
							delete currScope.tmpValue;
						});
						disableWatch = false;
					}
				});
			});
		};
	});
});