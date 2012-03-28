require([
    "unittests/angular/integrationSpec",
    "unittests/nlp/clickWidgetSpec.js",
    "unittests/nlp/DataGridSpec",
    "unittests/nlp/enabledWidgetSpec",
    "unittests/nlp/MainControllerSpec",
    "unittests/nlp/MessagesGridSpec",
    "unittests/nlp/modelWidgetSpec", 
    "unittests/nlp/scriptWidgetSpec",
    "unittests/nlp/storeWidgetSpec",
    "unittests/nlp/utilSpec",
    "dojo/domReady!"
], function() {
    	jasmine.getEnv().addReporter(new jasmine.TrivialReporter());
		jasmine.getEnv().execute();
});

