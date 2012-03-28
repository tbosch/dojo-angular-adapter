define([ 'dojo/parser', 'angular/integration', 'dojox/rpc/JsonRest', 'dojox/rpc/Rest' ], function(parser, _, JsonRest, Rest) {
	function compile(text) {
		var element = angular.element(text);
		var root = angular.element("<div></div>").append(element);
		parser.parse(root);
		var widget = element.data("widget");
		var scope = element.scope();
		if (!scope) {
			scope = root.scope();
		}
		return {
			scope : scope,
			widget : widget,
			element : element
		};
	}

	var server = new MockHttpServer();
	var requests = [];

	beforeEach(function() {
		dijit.registry._destroyAll();
		for (var key in dijit.registry._hash) {
			delete dijit.registry._hash[key];
		}
		server.handle = function(request) {
		};
		server.start();
		requests = [];
		var old = window.MockHttpRequest;
		window.MockHttpRequest = function() {
			requests.push(this);
			return old.apply(this, arguments);
		};
		window.MockHttpRequest.prototype = old.prototype;

		// Reset the state for the Dojo Rest-Handling.
		JsonRest.getDirtyObjects().splice(0, JsonRest.getDirtyObjects().length);
		for ( var x in Rest._index) {
			if (x !== 'onchange') {
				delete Rest._index[x];
			}
		}
	});

	afterEach(function() {
		// Close all requests, required for /dojo/io/stop events to fire
		// correctly.
		for ( var i = 0; i < requests.length; i++) {
			var request = requests[i];
			if (request.readyState == request.OPENED) {
				request.receive(404, '');
			}
		}
		server.stop();
	});

	return {
		compile : compile,
		server : server
	};
});
