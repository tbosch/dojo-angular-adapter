define([ 'dojo'], function(dojo) {
	var nlpUrl = dojo.config.nlpUrl;
	if (!nlpUrl) {
		nlpUrl = '/nlp-web/';
		dojo.config.nlpUrl = nlpUrl;
	}
	return dojo.config;
});