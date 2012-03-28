define([ 'angular/angular' ], function(angular) {
	angular.directive('nlp:click', function(clickExpression) {
		return function(element) {
			var scope = this;
			element.data("widgetCallbacks").push(function() {
				var widget = element.data('widget');
				widget.onClick = function() {
					scope.$apply(clickExpression);
				};
			});
		};
	});
});