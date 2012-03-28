define([ 'dojo/parser', 'angular/angular', "dojo/_base/lang", 'dojo/aspect', "dojo/_base/html", "dojo/_base/window" ],

function(parser, angular, dlang, aspect, dhtml, dwindow) {

	// current compile arguments. list to allow recursive calls.
	var compileArgs = [];
	// Map from widget name (ex: "dijit.form.Button") to constructor
	var _ctorMap = {};
	var oldParse = parser.parse;
	// This is a modified version of dojo.parser.parse.
	// Right now, it does not support scripts nor lang or dir attribute
	// inheritance.
	parser.parse = function(rootNode, args) {
		var root;
		if (!args && rootNode && rootNode.rootNode) {
			args = rootNode;
			root = args.rootNode;
		} else {
			root = rootNode;
		}
		if (args && args.template) {
			// E.g. for ScrollingTabController to parse it's html...
			return oldParse.call(parser, root, args);
		}
		root = root ? dhtml.byId(root) : dwindow.body();
		args = args || {};
		args.createdWidgets = [];
		// The original parse function only used the children of the given root node, 
		// so we do the same. But only if we have a parent scope.  
		// If we have no parent scope, we won't get into the problem of compiling a node twice,
		// so we are safe to also compile the root node.
		var scope = angular.element(root).scope();
		var rootChilds;
		if (!scope) {
			scope = angular.scope();
			rootChilds = angular.element(root);
		} else {
			rootChilds = angular.element(root).children();
		}
		
		if (rootChilds.length>0) {
			compileArgs.push(args);
			var oldNoStart = args.noStart;
			args.noStart = true;
			args.callbacks = [];
			// need to save the $element as we reuse the same scope for different elements!
			var old$element = scope.$element;
			// angular needs a single root element, so we call the compiler for every child
			angular.forEach(rootChilds, function(child) {
				angular.compile(angular.element(child))(scope);
			});
			scope.$element = old$element;
			// async eval is required, as
			// dojo reorders dom nodes (e.g. dialogs go last),
			// which confuses the angular compiler.
			angular.forEach(args.callbacks, function(callback)  {
				callback();
			});
			// Call startup on each top level instance if it makes sense (as for
			// widgets).  Parent widgets will recursively call startup on their
			// (non-top level) children
			angular.forEach(args.createdWidgets, function(instance){
				if( !oldNoStart && instance  &&
					dlang.isFunction(instance.startup) &&
					!instance._started
				){
					instance.startup();
				}
			});
			
			compileArgs.pop();
		}
		return args.createdWidgets;
	};

	angular.widget('@data-dojo-type',
			function(type, element) {
				var args = compileArgs[compileArgs.length-1];
				var ctor = type
						&& (_ctorMap[type] || (_ctorMap[type] = dlang
								.getObject(type)));
				// Do not process children of widgets with the stopParser flag (see
				// ContentPane)
				var noDescend = ctor && ctor.prototype.stopParser
						&& !(args && args.template);
				this.descend(!noDescend);
				this.directives(true);

				return function(element) {
					// async eval is required, as
					// dojo reorders dom nodes (e.g. dialogs go last),
					// which confuses the angular compiler.
					var scope = this;
					element.data('widgetType', type);
					element.data('widgetCallbacks', args.callbacks);
					args.callbacks.push(function() {
						var widget = parser.instantiate(element, {scope: scope}, args)[0];
						args.createdWidgets.push(widget);
						element.data("widget", widget);
					});

				};
			});
	
	// Deactivate angulars handling for inputs and selects.
	angular.widget("form", function() {
		this.descend(true);
		this.directives(true);
		return function() { };
	});

	angular.widget("input", function() {
		this.descend(true);
		this.directives(true);
		return function() { };
	});
	
	angular.widget("select", function() {
		this.descend(true);
		this.directives(true);
		return function() { };
	});
	
});