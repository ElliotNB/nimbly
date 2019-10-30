var AnotherBadComponent = function($,Mustache,Nimbly) {
	
	const defaults = {
		"templates":{
			"t4m_template_2":`
				<p class="patient_data_container">
					Now viewing: {{patient_name}} <br>
					Date of birth: {{birth_date}} <br>
					Date of admission: {{admit_date}}<br>
				</p>
			`
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
	
	class componentClass extends Nimbly {

		constructor(data, options) {
			super("AnotherBadComponent", defaults);
		};

		_render() {
			this.data.patient_name = "modifying this.data in render method not allowed";
			return "<div></div>";
		}
	
	};
	
	return componentClass;
};

if (typeof module === "undefined") {
	window["AnotherBadComponent"] = AnotherBadComponent($,Mustache,Nimbly);
} else {
	module.exports = function($,Mustache,Nimbly) {
		return AnotherBadComponent($,Mustache,Nimbly);
	};
}