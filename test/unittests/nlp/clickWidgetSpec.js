define([ 'utils/unitTestHelper', 'nlp/clickWidget', 'dijit/form/Button' ], function(helper) {
	describe("nlp:click", function() {
		it("should eval the scope function expression on click", function() {
			var c = helper.compile('<button data-dojo-type="dijit.form.Button"' + ' nlp:click="someFunction()"></button>');
			c.scope.someFunction = jasmine.createSpy();
			c.widget._onClick({preventDefault: function() { }});
			expect(c.scope.someFunction).toHaveBeenCalledWith();
		});
	});
});
