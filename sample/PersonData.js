var PersonData = function($,Mustache,TXMBase) {
	var defaults = {
		"tagName":"person-data"
		,"templates":["t4m_template_2"]
		,"loadingTemplate":null
		,"initList":[]
		,"uiBindings":{
			"patient_name":true
			,"admit_date":true
			,"birth_date":true
		}
		,"dataBindings":{}
		,"data":{
			"patient_name":null
			,"birth_date":null
			,"admit_date":null
		}
		,"delayInit":false
	};

	var constructor = function(data, options) {
		TXMBase.call(this,"PersonData", defaults, data || {}, options || {});
	};
	
	constructor.prototype = Object.create(TXMBase.prototype);
	constructor.prototype.constructor = constructor;
	
	constructor.prototype._render = function() {
		var jqDom = $(Mustache.render(this.templates["t4m_template_2"], this._data));
		return jqDom;
	};
	return constructor;
};

if (typeof module === "undefined") {
	window["PersonData"] = PersonData($,Mustache,TXMBase);
} else {
	module.exports = function($,Mustache,TXMBase) {
		return PersonData($,Mustache,TXMBase);
	};
}