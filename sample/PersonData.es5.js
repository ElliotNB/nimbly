var PersonData = function($,Mustache,TXMBase) {
	var defaults = {
		"tagName":"person-data"
		,"templates":{
			"t4m_template_2":`
				<p class="patient_data_container">
					Now viewing: {{patient_name}} <br>
					Date of birth: {{birth_date}} <br>
					Date of admission: {{admit_date}}<br>
				</p>
			`
		}
		,"loadingTemplate":null
		,"initList":[]
		,"uiBindings":{
			"patient_name":true
			,"admit_date":true
			,"birth_date":true
			,"chained_update":true
		}
		,"dataBindings":{
			"chained_request":{"delay_refresh":false,"methods":["_fetchDummyData"]} 
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
		TXMBase.call(this,"PersonData", defaults, data || {}, options || {});
	};
	constructor.prototype = Object.create(TXMBase.prototype);
	constructor.prototype.constructor = constructor;
	
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
	window["PersonData"] = PersonData($,Mustache,TXMBase);
} else {
	module.exports = function($,Mustache,TXMBase) {
		return PersonData($,Mustache,TXMBase);
	};
}