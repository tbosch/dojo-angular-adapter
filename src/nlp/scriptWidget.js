define([], function() {
	angular.widget('nlp:script', function(element) {
		var id = element.attr("id");
		if (!id) {
			throw new Error("No id attribute defined for action " + element);
		}
		var body = element.text();
		var evalScript = "window.tmpFn = \n" + body + "\n";
		// We use the require.eval function so that the script gets a name and
		// is debuggable!
		require.eval(evalScript, id);
		// Note: We use window.tmpFn, as IE8 is not able to return functions from evals.
		// TODO use var fn = require.eval... again when IE8 is no more in use!
		// Note2: We cannot remove tmpFn from the window object, as IE8 does not support this! 
		var fn = window.tmpFn;
		element.replaceWith("<!-- " + evalScript + "-->");
		return function(element) {
			var scope = this;
			scope[id] = fn;
		};
	});
});