var GrandChildComp = function($,Mustache,TXMBase) {

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

	class componentClass extends TXMBase {

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
	window["GrandChildComp"] = GrandChildComp($,Mustache,TXMBase);
} else {
	module.exports = function($,Mustache,TXMBase) {
		return GrandChildComp($,Mustache,TXMBase);
	};
}
