var RendersDouble = function($,Mustache,Nimbly) {
	
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
		,"dataBindings":{}
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
			super("RendersDouble", defaults, data || {}, options || {});
		};

		_render() {
			return $("<div>one top level element</div><div>second top level element, BAD</div>");
		}
	
	};
	
	return componentClass;
};

if (typeof module === "undefined") {
	window["RendersDouble"] = RendersDouble($,Mustache,Nimbly);
} else {
	module.exports = function($,Mustache,Nimbly) {
		return RendersDouble($,Mustache,Nimbly);
	};
}