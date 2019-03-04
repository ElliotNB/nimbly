var BadComponent = function($,Mustache,Nimbly) {
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
		,"dataBindings":{
			"bad_request":{"delayRefresh":false,"methods":["_fetchBadData"]} 
		}
		,"data":{
			"patient_name":null
			,"birth_date":null
			,"admit_date":null
			,"bad_request":null
			,"chained_request":null
		}
		,"delayInit":false
		,"renderjQuery":true
	};

	var constructor = function(data, options) {
		Nimbly.call(this,"BadComponent", defaults, data || {}, options || {});
	};
	constructor.prototype = Object.create(Nimbly.prototype);
	constructor.prototype.constructor = constructor;
	
	constructor.prototype._render = function() {
		return "<div></div>";
	}
	
	constructor.prototype._fetchBadData = function(resolve, reject) {
		throw new Error("Bad component fails to fetch data.");
	}
	
	return constructor;
};

if (typeof module === "undefined") {
	window["BadComponent"] = BadComponent($,Mustache,Nimbly);
} else {
	module.exports = function($,Mustache,Nimbly) {
		return BadComponent($,Mustache,Nimbly);
	};
}