// Log results as HTML on the page
var trivialReporter = new jasmine.TrivialReporter();
jasmine.getEnv().addReporter(trivialReporter);

// Log results as JSON
var ourReporter = new jasmine.JsApiReporter();
jasmine.getEnv().addReporter(ourReporter);

var indent = function(indentLevel) {
    var indent = '';
    for (var i = 0; i < indentLevel; i++) {
        indent += ' ';
    }
    return indent;
};

var buildMessages = function(messages) {
    var message = '';
    for (var i = 0; i < messages.length; i++) {
        message += '\n' + messages[i].message;
    }
    return message;
};

var buildReport = function(items, parentName) {
    var report = [];
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var name = (item.type == 'suite' ? 'describe ' : 'it ')+item.name;
        var reportedItem = {};
        reportedItem.name = name;
        reportedItem.type = item.type;

        if (item.type == 'spec') {
            var result = ourReporter.results()[item.id];
            reportedItem.result = result.result;
            if (result.result == 'failed') {
                reportedItem.messages = buildMessages(result.messages); 
            }
        }
        reportedItem.children = buildReport(item.children, name);
        report.push(reportedItem);
    }
    return report;
};

var run = function() {
    jasmine.getEnv().execute();
};

var report = function() {
    return JSON.stringify(buildReport(ourReporter.suites()));
};
