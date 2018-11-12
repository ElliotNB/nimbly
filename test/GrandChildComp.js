var GrandChildComp = function($,Mustache,Nimbly) {

	const defaults = {
		"tagName":"grand-child"
		,"templates":{
			"t4m_template_grand_child":`
				<span>grand child component</span>
			`
		}
		,"loadingTemplate":null
		,"initList":[]
		,"uiBindings":{}
		,"dataBindings":{}
		,"data":{}
		,"delayInit":false
	};

	class componentClass extends Nimbly {

		constructor(data, options) {
			super("GrandChildComp", defaults, data || {}, options || {});
		};

		_render() {
			var jqDom = $(Mustache.render(this.templates["t4m_template_grand_child"], null));
			return jqDom;
		};

	};

	return componentClass;
};

if (typeof module === "undefined") {
	window["GrandChildComp"] = GrandChildComp($,Mustache,Nimbly);
} else {
	module.exports = function($,Mustache,Nimbly) {
		return GrandChildComp($,Mustache,Nimbly);
	};
}
