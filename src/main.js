require([ 'dojox/data/ClientFilter', 'angular/integration', 'nlp/modelWidget', 'nlp/clickWidget', 'nlp/storeWidget'
		, 'nlp/DataGrid', 'nlp/scriptWidget', 'dijit/form/ValidationTextBox', 'dijit/form/FilteringSelect', 'nlp/MessagesGrid'
		, 'nlp/MainController', 'nlp/enabledWidget', 'dijit/Dialog'
		, 'dojox/grid/DataGrid', 'dijit/layout/TabContainer', 'dijit/layout/ContentPane', 'dijit/layout/SplitContainer', 'dijit/layout/BorderContainer'
		, 'dijit/form/Button' 
		, 'dojo/parser', 'dijit/Toolbar', 'dijit/Menu', 'dijit/MenuItem', 'dijit/MenuSeparator', 'dijit/PopupMenuItem', 'dijit/form/DropDownButton'
		, 'dijit/form/Select'
		, 'dojox/layout/TableContainer', 'dijit/dijit', 'dojo/domReady!', 'nlp/util'
		], function() { arguments[arguments.length-1].displayReady(true); }
);

function doLogin(isMandantSelected) {
	if (isMandantSelected) {
		dijit.byId("MustSelectMandant").show();
	} else {		
		document.forms["loginform"].submit();
	}
}
