define([ 'dojo', 'dojox/rpc/JsonRest', 'dojo/_base/Deferred', 'dojo/DeferredList', 'dojox/rpc/Rest', 'nlp/util', 'nlp/nlpConfig' ], function(dojo, rpcJsonRest,
		Deferred, DeferredList, Rest, util, nlpConfig) {

	function MainController($location) {
		this.$location = $location;
		this.$watch(util.fireRefreshEventIfNeeded);
	}
	MainController.$inject = ["$location"];
	
	MainController.prototype = {
		navigateTo : function(location) {
			window.location = location;
		},
		save : function() {
			var scope = this;
			var saveActions = rpcJsonRest.commit({
				revertOnError : false
			});
			var saveDeferreds = [];
			dojo.forEach(saveActions, function(action) {
				saveDeferreds.push(action.deferred);
			});
			var saveDeferredList = new DeferredList(saveDeferreds, false, true);
			var res = new Deferred();
			saveDeferredList.then(function() {
				scope.$apply(function() {
					scope.refresh();
					res.callback();
				});
			});
			return res;
		},
		isDirty : function() {
			return rpcJsonRest.isDirty();
		},
		refresh : function() {
			var scope = this;
			rpcJsonRest.revert();
			scope.$broadcast("clearCache");
			scope.$broadcast("refresh");
		},
		storeAccess : function(id, property) {
			return util.storeAccessor(id, property);
		},
		service : function(serviceName) {
			var scope = this;
			var url = nlpConfig.nlpUrl + "services/invoker/" + serviceName;
			var serviceArgs = Array.prototype.slice.call(arguments, 1);
			var xhrRes = dojo.xhrPost({
				headers : {
					"Content-Type" : "application/json"
				},
				url : url,
				postData : dojo.toJson(serviceArgs),
				handleAs : 'json'
			});
			// TODO error handling!
			var res = new Deferred();
			xhrRes.then(function(result) {
				scope.$apply(function() {
					res.callback(result);
				});
			});
			return res;
		}
	};

	dojo.setObject('nlp.MainController', MainController, window);

	return MainController;
});
