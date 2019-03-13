var NoRenderMethod = function($,Mustache,Nimbly) {
	
	const defaults = {
		"tagName":"person-data"
		,"templates":{
			"t4m_template_2":`
				<p class="no_render">
					Hello world
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
			super("NoRenderMethod", defaults, data || {}, options || {});
		};
	
	};
	
	return componentClass;
};

if (typeof module === "undefined") {
	window["NoRenderMethod"] = NoRenderMethod($,Mustache,Nimbly);
} else {
	module.exports = function($,Mustache,Nimbly) {
		return NoRenderMethod($,Mustache,Nimbly);
	};
}