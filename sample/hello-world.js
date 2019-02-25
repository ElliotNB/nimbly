var HelloWorld = function($,Mustache,Nimbly,HelloWorldList) {

	const defaults = {
		tagName:"hello-world"
		,templates:{
			t4m_tpl_cm_hello_world:`
				<div>
					<input type="button" value="Toggle this.data.user_id 3333/4444;" class="set-user-id">
					<br>
					<span class="t4m-username-title">Hello {{user_name}}!</span>
					<br>
					<hello-world-list></hello-world-list>
				</div>
			`
		}
		,initList:[
			{method:"_fetchUser",preventRender:true}
			,{method:"_fetchList",preventRender:true}
		]
		,uiBindings:{
			user_name: [".t4m-username-title"]
		}
		,dataBindings:{
			user_id:{ delayRefresh:false, methods:["_fetchUser"] }
		}
		,data:{
			user_id:null
			,user_name:null
			,list_items:null
		}
		,delayInit:false
	};
	
	class componentClass extends Nimbly {

		constructor(data, options) {
			super("HelloWorld", defaults, data || {}, options || {});
			
			this.helloWorldList = null;
			
		};
		
		_init() {
			let listData = {
				"list_items":this.data.list_items
			};
			this.helloWorldList = new HelloWorldList(listData);
			this.registerChild(this.helloWorldList);
		}

		/**
		 * Renders the Hello World page
		 * @method _render
		 * @memberof HelloWorld#
		 * @returns {object} jQuery-referenced DOMNode.
		 */
		_render() {

			let tplData = {"user_name":this.data.user_name};
		
			let jqDom = $(Mustache.render(this.templates["t4m_tpl_cm_hello_world"], tplData));

			this._setupEvents(jqDom);
			
			return jqDom;
		};
		
		/**
		 * Assign event handlers to elements on the just rendered component.
		 * @method _setupEvents
		 * @memberof HelloWorld#
		 *
		 * @param {Object} jqDom - jQuery-referenced DOMNode for this component -- contains the elements in which event handlers are applied.
		 */
		_setupEvents(jqDom) {
			jqDom.find(".set-user-id").on("click", () => {
				if (this.data.user_id === 3333) {
					this.data.user_id = 4444;
				} else {
					this.data.user_id = 3333;
				}
			});
		};

		/**
		 * Fake ajax retrieve the user details given the current user_id.
		 * @method _fetchUser
		 * @memberof HelloWorld#
		 * @param {function} resolve - callback function that we invoke when the user details were successfully retrieved.
		 * @param {function} reject - callback function that we invoke when the user details were not successfully retrieved.
		 */
		_fetchUser(resolve, reject) {
			
			// Using a setTimeout to simulate an async ajax request
			setTimeout(() => {
				if (this.data.user_id === 3333) { 
					this.data.user_name = "Bill";
				} else if(this.data.user_id = 4444) {
					this.data.user_name = "Michael";
				}
				resolve();
			}, 250);
			
		};
		
		_fetchList(resolve, reject) {
			
			setTimeout(() => {
				this.data.list_items = [
					{"customer_name":"Maggie", "selected":true},
					{"customer_name":"Sarah", "selected":false},
					{"customer_name":"Tim", "selected":false},
					{"customer_name":"Michael", "selected":false},
					{"customer_name":"Anderson", "selected":false}
				];
				resolve();
			}, 750);
			
		}

	};

	return componentClass;

};


if (typeof module === "undefined") {
	window["HelloWorld"] = HelloWorld($,Mustache,Nimbly,HelloWorldList);
} else {
	module.exports = function($,Mustache,Nimbly,HelloWorldList) {
		return HelloWorld($,Mustache,Nimbly,HelloWorldList);
	};
}