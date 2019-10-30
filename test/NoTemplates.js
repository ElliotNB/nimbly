var NoTemplates = function($,Mustache,Nimbly) {
	
	const defaults = {
		"templates":[]
		,"uiBindings":{
			"patient_name":true
			,"admit_date":true
			,"birth_date":true
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
			super("BadLoadingTpl", defaults, data || {}, options || {});
		};

		_render() {
			return $(Mustache.render(this.templates["t4m_template_does_not_exist"]));
		}
	
	};
	
	return componentClass;
};

if (typeof module === "undefined") {
	window["NoTemplates"] = NoTemplates($,Mustache,Nimbly);
} else {
	module.exports = function($,Mustache,Nimbly) {
		return NoTemplates($,Mustache,Nimbly);
	};
}