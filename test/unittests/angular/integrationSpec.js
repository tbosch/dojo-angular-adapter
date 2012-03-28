define([ 'utils/unitTestHelper', 'dijit/form/TextBox' ], function(helper) {
	describe("compile integration", function() {
		it("should create dojo widgets when using the angular compiler", function() {
			var c = helper.compile('<input data-dojo-type="dijit.form.TextBox"' + '+nlp:model="someName"></input>');
			var widget = c.widget;
			expect(widget).toBeDefined();
		});
	});
});
