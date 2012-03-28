define([ 'utils/unitTestHelper', 'nlp/enabledWidget', 'dijit/form/Button' ], function(helper) {
	describe("nlp:enabled", function() {
		it("should disable the widget if the expression is false", function() {
			var c = helper.compile('<button data-dojo-type="dijit.form.Button"' + ' nlp:enabled="someflag"></button>');
			c.scope.someflag = false;
			c.scope.$digest();
			expect(c.widget.disabled).toBe(true);
			c.scope.someflag = true;
			c.scope.$digest();
			expect(c.widget.disabled).toBe(false);
		});
	});
});
