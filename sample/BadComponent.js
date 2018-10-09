var BadComponent = function($,Mustache,Nimbly) {
	
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
	};
	
	class componentClass extends Nimbly {

		constructor(data, options) {
			super("BadComponent", defaults, data || {}, options || {});
		};

		_render() {
			return "<div></div>";
		}
		
		_fetchBadData(resolve, reject) {
			throw new Error("Bad component fails to fetch data.");
		}
	
	};
	
	return componentClass;
};

if (typeof module === "undefined") {
	window["BadComponent"] = BadComponent($,Mustache,Nimbly);
} else {
	module.exports = function($,Mustache,Nimbly) {
		return BadComponent($,Mustache,Nimbly);
	};
}