define([ 'utils/unitTestHelper', 'dojox/data/JsonRestStore', 'nlp/util' ], function(helper, JsonRestStore, util) {
	describe("nlp:model", function() {
		it("should save the value into the scope for normal properties", function() {
			var c = helper.compile('<input data-dojo-type="dijit.form.TextBox"' + ' nlp:model="someName"></input>');
			var someText = 'someText';
			c.widget.set('value', someText);
			expect(c.scope.someName).toBe(someText);
		});
		
		it("should save the value into the scope if the value has a set function by calling this function", function() {
			var c = helper.compile('<input data-dojo-type="dijit.form.TextBox"' + ' nlp:model="obj"></input>');
			c.scope.obj = { set: jasmine.createSpy() };			
			var someText = 'someText';
			c.widget.set('value', someText);
			expect(c.scope.obj.set).toHaveBeenCalledWith(someText);
		});

		it("should update the widget when the scope changes for normal properties", function() {
			var c = helper.compile('<input data-dojo-type="dijit.form.TextBox"' + ' nlp:model="someName"></input>');
			var someText = 'someText';
			c.scope.someName = someText;
			c.scope.$apply();
			expect(c.widget.get('value')).toBe(someText);
		});

		it("should update the widget when the scope changes for values with get function", function() {
			var someText = 'someText';
			var c = helper.compile('<input data-dojo-type="dijit.form.TextBox"' + ' nlp:model="obj"></input>');
			c.scope.obj =  { get : jasmine.createSpy().andReturn(someText) };
			c.scope.$digest();
			expect(c.widget.get('value')).toBe(someText);
		});

		it("should clear the widget text if not entity for values with entity function", function() {
			var c = helper.compile('<input data-dojo-type="dijit.form.TextBox"' + ' nlp:model="obj"></input>');
			c.scope.obj =  { entity: jasmine.createSpy().andReturn(undefined) };
			c.scope.$digest();
			expect(c.widget.get('value')).toBe('');
		});
		
		it("should disable the widget when there is no entity for values with entity function", function() {
			var c = helper.compile('<input data-dojo-type="dijit.form.TextBox"' + ' nlp:model="obj"></input>');
			c.scope.obj =  { entity: jasmine.createSpy().andReturn(undefined) };
			c.scope.$digest();
			expect(c.widget.get('disabled')).toBe(true);
		});
		
		it("should enable the widget when there is an entity for values with entity function", function() {
			var c = helper.compile('<input data-dojo-type="dijit.form.TextBox"' + ' nlp:model="obj"></input>');
			c.scope.obj =  { entity: jasmine.createSpy().andReturn({}) };
			c.scope.$digest();
			expect(c.widget.get('disabled')).toBe(false);
		});

		it("should reset the widget when the value is set to undefined or null", function() {
			var c = helper.compile('<input data-dojo-type="dijit.form.TextBox"' + ' nlp:model="someName"></input>');
			var someText = 'someText';
			c.scope.someName = someText;
			c.scope.$apply();
			expect(c.widget.get('value')).toBe(someText);
			c.scope.someName = null;
			c.scope.$apply();
			expect(c.widget.get('value')).toBe('');
			c.scope.someName = someText;
			c.scope.$apply();
			expect(c.widget.get('value')).toBe(someText);

			c.scope.someName = undefined;
			c.scope.$apply();
			expect(c.widget.get('value')).toBe('');
		});

		it("should save the id of the selected item for filteringSelect", function() {
			data = [ {
				id : '/someUrl/SomeEntity/12',
				name : 'city1',
				plz : 'plz1'
			} ];
			helper.server.handle = function(request) {
				request.receive(200, angular.toJson(data));
			};
			var store = new JsonRestStore({
				target : 'someUrl',
				syncMode : true
			});
			window.someStore = store;
			c = helper.compile('<input data-dojo-type="dijit.form.FilteringSelect" data-dojo-props="searchAttr:\'name\',store:someStore" nlp:model="somePerson""></input>');

			c.widget.set('displayedValue', 'city1');
			expect(c.scope.somePerson).toEqual(data[0].id);
		});
		
		it("should load the selected item from an id in the scope for filteringSelect", function() {
			data = [ {
				id : '/someUrl/SomeEntity/12',
				name : 'city1',
				plz : 'plz1'
			} ];
			helper.server.handle = function(request) {
				request.receive(200, angular.toJson(data));
			};
			var store = new JsonRestStore({
				target : 'someUrl',
				syncMode : true
			});
			window.someStore = store;
			c = helper.compile('<input data-dojo-type="dijit.form.FilteringSelect" data-dojo-props="searchAttr:\'name\',store:someStore" nlp:model="somePerson"></input>');
			c.scope.somePerson = '/someUrl/SomeEntity/12';
			c.scope.$digest();
			expect(c.widget.item.id).toEqual(data[0].id);
			expect(c.widget.item.name).toEqual(data[0].name);
		});
		

	});
});
