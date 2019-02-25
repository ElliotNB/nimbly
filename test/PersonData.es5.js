var PersonData = function($,Mustache,Nimbly) {
	var defaults = {
		"tagName":"person-data"
		,"templates":["t4m_template_2"]
		,"loadingTemplate":null
		,"initList":[]
		,"uiBindings":{
			"patient_name":true
			,"admit_date":true
			,"birth_date":true
			,"chained_update":true
		}
		,"dataBindings":{
			"chained_request":{"delayRefresh":false,"methods":["_fetchDummyData"]} 
		}
		,"data":{
			"patient_name":null
			,"birth_date":null
			,"admit_date":null
			,"chained_updated":null
			,"chained_request":null
		}
		,"delayInit":false
	};

	var constructor = function(data, options) {
		Nimbly.call(this,"PersonData", defaults, data || {}, options || {});
	};
	constructor.prototype = Object.create(Nimbly.prototype);
	constructor.prototype.constructor = constructor;
	
	constructor.prototype._render = function() {
		return $(Mustache.render(this.templates["t4m_template_2"], this.data));
	}
	
	constructor.prototype._fetchDummyData = function(resolve, reject) {
		var self = this;
		setTimeout(function() {
			self.data.chained_update = true;
			resolve();
		},100);
	};
	
	return constructor;
};

if (typeof module === "undefined") {
	window["PersonData"] = PersonData($,Mustache,Nimbly);
} else {
	module.exports = function($,Mustache,Nimbly) {
		return PersonData($,Mustache,Nimbly);
	};
}