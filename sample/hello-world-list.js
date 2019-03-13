var HelloWorldList = function($,Mustache,Nimbly,HelloWorldListItem) {

	const defaults = {
		tagName:"hello-world-list"
		,templates:{
			t4m_tpl_cm_hello_world_list:`
				<div>
					<div>Hello World list:</div>
					<ul>
						<list-items>
							<hello-world-list-item></hello-world-list-item>
						</list-items>
					</ul>
				</div>
			`
		}
		,uiBindings:{
			"/list_items.*selected/": ["ul"]
		}
		,dataBindings:{
			"/list_items.*selected/":{ delayRefresh:true, methods:["_setSelected"] }
		}
		,data:{
			list_items:null
			,selected_item:null
		}
		,delayInit:false
		,renderjQuery:true
	};
	
	class componentClass extends Nimbly {

		constructor(data, options) {
			super("HelloWorldList", defaults, data || {}, options || {});			
		};

		/**
		 * The method is invoked immediately after the component finishes initializing. In this method we
		 * instantiate the list items that become part of our "hello world" list and then register them as child components
		 * belonging to the <list-items></list-items> section.
		 * @method _init
		 * @memberof HelloWorldList#
		 *
		 * @returns {undefined}
		*/
		_init() {
			
			for (let i = 0; i < this.data.list_items.length; i++) {
				let helloWorldListItem = new HelloWorldListItem(this.data.list_items[i]);
				this.registerChild([helloWorldListItem], "list-items");
			}
		};
		
		/**
		 * Renders the Hello World list
		 * @method _render
		 * @memberof HelloWorldList#
		 * @returns {object} jQuery-referenced DOMNode.
		 */
		_render() {
			let jqDom = $(Mustache.render(this.templates["t4m_tpl_cm_hello_world_list"], null));
			return jqDom;
		};
		
		/**
		 * When a list item is selected we want to de-select the others.
		 * @method _setSelected
		 * @memberof HelloWorldList#
		 * @returns {object} jQuery-referenced DOMNode.
		 */
		_setSelected(resolve, reject, changes) {
			
			// if a list item was just selected... 
			if (changes[0].newValue === true) {
				
				// and deselect the other list items
				for (let i = 0; i < this.data.list_items.length; i++) {
					
					// if the list item is not the list item that was just selected, then de-select it
					if (this.data.list_items[i] !== changes[0].proxy) this.data.list_items[i].selected = false;
				}
			}
			resolve();
		};

	};

	return componentClass;

};


if (typeof module === "undefined") {
	window["HelloWorldList"] = HelloWorldList($,Mustache,Nimbly,HelloWorldListItem);
} else {
	module.exports = function($,Mustache,Nimbly,HelloWorldListItem) {
		return HelloWorldList($,Mustache,Nimbly,HelloWorldListItem);
	};
}