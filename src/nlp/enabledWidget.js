define([ 'angular/angular' ], function(angular) {
	angular.directive('nlp:enabled', function(enabledExpression) {
		return function(element) {
			var scope = this;
			element.data("widgetCallbacks").push(function() {
				var widget = element.data('widget');
				scope.$watch(enabledExpression, function(scope, enabled) {
					widget.set('disabled', !enabled);
				});				
			});
		};
	});
});