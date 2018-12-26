var GrandChildComp = function($,Mustache,Nimbly) {

	const defaults = {
		"tagName":"grand-child"
		,"templates":{
			"t4m_template_grand_child":`
				<span>grand child component</span>
			`
		}
		,"loadingTemplate":null
		,"initList":[{"method":"_dummyInitWait","preventRender":true}]
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
		
		_dummyInitWait(resolve, reject) {
			setTimeout(function() {
				resolve();
			}, 2000);
		}
		
		_afterInDocument() {
			//do nothing, testing coverage
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
