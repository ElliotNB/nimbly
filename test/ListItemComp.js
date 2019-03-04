var ListItemComp = function($,Mustache,Nimbly,GrandChildComp) {

	const defaults = {
		"tagName":"list-item-test"
		,"templates":{
			"t4m_template_3":`
				<li class="list-item-test">testing list items <grand-child></grand-child></li>
			`
		}
		,"loadingTemplate":null
		,"initList":[]
		,"uiBindings":{
		}
		,"dataBindings":{
		}
		,"data":{
		}
		,"delayInit":false
		,"renderjQuery":true
	};

	class componentClass extends Nimbly {

		constructor(data, options) {
			super("ListItemComp", defaults, data || {}, options || {});
			
			var grandChild = new GrandChildComp();
			this.registerChild(grandChild);
		};

		_render() {

			var self = this;

			var jqDom = $(Mustache.render(this.templates["t4m_template_3"], null));

			jqDom.on("click", function() {
				self.data.dummy_field_2 = "foobar test";
			});

			return jqDom;
		};

		_fetchDummyData(resolve, reject) {
			var self = this;
			setTimeout(function() {
				self.data.chained_update = true;
				resolve();
			},100);
		};
	};

	return componentClass;
};

if (typeof module === "undefined") {
	window["ListItemComp"] = ListItemComp($,Mustache,Nimbly,GrandChildComp);
} else {
	module.exports = function($,Mustache,Nimbly,GrandChildComp) {
		return ListItemComp($,Mustache,Nimbly,GrandChildComp);
	};
}
