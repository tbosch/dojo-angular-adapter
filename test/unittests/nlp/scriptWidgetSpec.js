define([ 'utils/unitTestHelper' ], function(helper) {
	describe("nlp:script", function() {
		it("should create a function on the current scope", function() {
			var c = helper.compile('<nlp:script id="someAction">function() { }</nlp:script>');
			expect(c.scope.someAction).toBeDefined();
		});
		it("should be able to access scope properties by using this", function() {
			var c = helper.compile('<nlp:script id="someAction">function() { return this.scopeProp;}</nlp:script>');
			c.scope.scopeProp = 10;
			expect(c.scope.someAction()).toBe(10);
		});
		
	});
});
