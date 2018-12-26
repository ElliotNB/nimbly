var PersonData = function($,Mustache,Nimbly) {

	const defaults = {
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
		,"initList":[{"method":"_dummyInitWait","preventRender":true}]
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

	class componentClass extends Nimbly {
	
		constructor(data, options) {
			super("PersonData", defaults, data || {}, options || {});
		};
		
		_renderLoading() {
			return $("<div>Testing _renderLoading</div>");
		}
	
		_fetchDummyData(resolve, reject) {
			var self = this;
			setTimeout(function() {
				self.data.chained_update = true;
				resolve();
			},100);
		};
		
		_afterInDocument() {
			// do nothing, just for unit testing coverage purposes
		}
		
		_dummyInitWait(resolve, reject) {
			setTimeout(function() {
				resolve();
			}, 2000);
		}
	};
	
	return componentClass;
};

if (typeof module === "undefined") {
	window["PersonData"] = PersonData($,Mustache,Nimbly);
} else {
	module.exports = function($,Mustache,Nimbly) {
		return PersonData($,Mustache,Nimbly);
	};
}