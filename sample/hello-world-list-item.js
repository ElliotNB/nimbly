var HelloWorldListItem = function($,Mustache,Nimbly) {

	const defaults = {
		tagName:"hello-world-list-item"
		,templates:{
			t4m_tpl_cm_hello_world_list_item:`
				<li style="cursor:pointer;">
					{{#selected}}
						<b>{{customer_name}}</b>
					{{/selected}}
					{{^selected}}
						{{customer_name}}
					{{/selected}}
				</li>
			`
		}
		,uiBindings:{
			customer_name: true
		}
		,dataBindings:{
			//user_id:{ delayRefresh:false, methods:["_fetchUser"] }
		}
		,data:{
			customer_name:null
			,selected:null
		}
		,delayInit:false
	};
	
	class componentClass extends Nimbly {

		constructor(data, options) {
			super("HelloWorldListItem", defaults, data || {}, options || {});
		};
		
		/**
		 * Renders the Hello World list item
		 * @method _render
		 * @memberof HelloWorldListItem#
		 * @returns {object} jQuery-referenced DOMNode.
		 */
		_render() {
			let tplData = {
				"customer_name":this.data.customer_name
				,"selected":this.data.selected
			};
			let jqDom = $(Mustache.render(this.templates["t4m_tpl_cm_hello_world_list_item"], tplData));
			
			this._setupEvents(jqDom);
			
			return jqDom;
		};
		
		/**
		 * Assign event handlers to elements on the just rendered list item.
		 * @method _setupEvents
		 * @memberof HelloWorldListItem#
		 *
		 * @param {Object} jqDom - jQuery-referenced DOMNode for this component -- contains the elements in which event handlers are applied.
		 */
		_setupEvents(jqDom) {
			
			// select the list item when the user clicks on it
			jqDom.on("click", () => {
				this.data.selected = true;
			});
		}

	};

	return componentClass;

};


if (typeof module === "undefined") {
	window["HelloWorldListItem"] = HelloWorldListItem($,Mustache,Nimbly);
} else {
	module.exports = function($,Mustache,Nimbly) {
		return HelloWorldListItem($,Mustache,Nimbly);
	};
}