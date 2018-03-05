/*	Class: TXMBase
		
		Proposed base class for TransformativeMed web components. The objectives of the base class are as follows:
			1. Provide a common structure and organization for child components to follow.
			2. Reduce repetitive 'boiler plate' code contained in the child components.
			3. Encourage adoption of best practices and functionality of modern JS development and frameworks (e.g., templating, one-way data binding, no explicit DOM manipulations, etc).
			4. Reduce level of effort required by non-author devs to understand and maintain components.
			5. Allow for easy re-factors of the legacy TransformativeMed code base.
		
		It is expected that this base class will be expanded to accomodate the needs of different web applications. The base class code below should therefore
		be considered 'core functionality' -- it is entirely allowable to expand upon, but not overwrite, the methods and properties below.
	
		In order to make use of this base class, child components must extend the base class in this manner (where CMAddTask is the name of the child component class):
		
			// Derived from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
			CMAddTask.prototype = Object.create(TXMBase.prototype);
			CMAddTask.prototype.constructor = CMAddTask;
	
	Parameters:
		
		className - String, the name of the child component class (e.g., CMAddTask) that instantiated the base class. This is useful for debugging when the error occurs
					inside the base class. Logging the className will tell you which class instantiated the base class and generated the error.
		
		defaults - Object, a variety of default options and preferences, see below:
			{
				// Array of strings, templates is an array containing all of the templates used by the component. allows for devs returning to the code later to 
				// quickly learn which templates are necessary for the component to run
				"templates":["t4m_tpl_add_task_list","t4m_tpl_add_task_list_item"]
				
				// String, loadingTemplate is the template used by the component to return a temporary loading message or spinner. if set to null, then an empty <div></div> element is used
				,"loadingTemplate":"t4m_tpl_component_loading"
				
				// Array of objects, 
					- method: the method that should be invoked when the component initializes itself
					- preventRender: optional, set to true if the method must return before the component can render itself, else the component can render before the method returns
					- condition: optional, must return true if the method is to be executed. if not supplied, then the method also executes. if false, then the method is not executed. 
				,"initList":[{"method":"_fetchTeamCoverage"
								
								,"preventRender":true
								
								// only fetch the list of teams for this service if a team list was 
								// not provided to the constructor during initialization
								,"condition":function() {
									return (self.data.teams.length == 0 && typeof self.data.code !== "number"); 
								}
							}]
				
				// Object, data is all the data that is required for the component to render itself. by default, data will most often be set to null because the component must first  
				// retrieve and store the data it needs to render via the this.init() method. however, options.data does allow the user to pre-populate data.
				,"data":null
				
				// Object, dictates what part of the rendered component should be updated when a given data change occurs. Each property on this object
				// corresponds to a property on this.data. In the example below, a change to data.participant_list will trigger refreshes of .t4m-jq-cm-convo-participant-container and
				// .t4m-jq-cm-create-convo-send-btn while a change to person_id will trigger a full refresh of the entire component. Please see the this.uiBindings property below for more details.
				,uiBindings":{
						"participant_list":[".t4m-jq-cm-convo-participant-container",".t4m-jq-cm-create-convo-send-btn"]
						,"person_id":true
					}
					
				// Object, dictates which 'fetch' methods should be executed when a change occurs to a given value on this.data. 
				// In the example below, a change to this.data.person_id will trigger the method this._fetchPersonList. The fetch methods are defined by the
				// child component. The "delayRefresh":true tells the component that we should not refresh the component until the fetch method completes and 
				// the new data has been retrieved. It will also trigger a modal loading cover/spinner preventing any user input while the new data is being retrieved.
				,"dataBindings":{
				
					// if person_id changes, invoke this._fetchPersonList, true means that will blur component while data is fetched
					"person_id":{
						"methods":["_fetchPersonList"]
						,"delayRefresh":true	
					} 
				}
				
				// If delayInit is set to true, then the component will not automatically initialize itself (i.e., fetch data) in the constructor.
				,"delayInit":false
			}
			
		data - Object, this is the data that the component uses to render itself. The component should require no other data to render itself. During the 
				initialization of the component, data is often just null -- the data must first be retrieved via XHR (see the _fetch* methods). But even if the data is null, 
				it's helpful to map out here what values are expected to be populated later. This gives other developers a blueprint of what model data this 
				component works with. Example:
				
				{
					"selected":false  // true if this team is selected
					,"full_name": null //"Berger-ONA, TTJessica",
					,"person_id": null // 14850867.000000
					,"mobile_messaging_enabled_ind": null // 0
					,"num_patients": null // 6
				}
		
		options - Object, optional, overrides the defaults by merging on top of it.
*/
var TXMBase = (function() {
	
	var baseClassInstance = 0;
	
	/* 	Function: _getTemplate(templateElmtId)
			Simple utility function for retrieving our Mustache templates
	
		Parameters:
			templateElmtId - String - The DOM element ID of the Mustache template. 
			
		Returns: 
			String, raw HTML Mustache template. 
	*/
	var _getTemplate = function(templateElmtId) {

		var templateElmt = document.getElementById(templateElmtId);
		if (templateElmt) {
			var template = templateElmt.innerHTML.trim();
		} else {
			throw new Error("TXMBase::_getTemplate() could not find the template with element ID: '"+templateElmtId+"'.");
		}
		return template;
	};
	
	/*	Constructor:
		Initializes an object instance of T4M component base class.
	*/
	var constructor = function(className, defaults, data, options) {
		
		var self = this;
		
		// if the user didn't provide any options, then instantiate an empty options object so we don't error out below
		if (typeof(options) == "undefined") var options = {};
		
		// we keep a reference to the original 'data' object (so that changes to the data are relayed back to
		// whatever initialized this component), but at the same time we merge in 'defaults' (which might contain 
		// more fields than are contained in 'data') but *without* overwriting anything in 'data'.
		defaults.data = $.extend(defaults.data,data);
		data = $.extend(data, defaults.data);
		
		// merge the default options with custom options passed into the component constructor. we do not want to keep a reference
		// to anything on defaults or options, so we can perform a deep copy instead of a shallow merge
		this.options = $.extend(true, {}, defaults, options);
	
		/*	Property: this.className
				String, the name of the class that initialized the base class. We store this value for debugging and logging purposes.
		*/
		this.className = className;
		
		/*	Property: this.baseClassInstance
				Integer, counts the number of times the base class has been initialized. Useful for debugging, identifying unique instances.
		*/
		this.baseClassInstance = baseClassInstance++;
		
		/*	Property: this.jqDom
				jQuery-referenced DocumentFragment of the page generated by this class.
		 */
		this.jqDom = null;
		
		/*	Property: this.initialized
				Boolean, set to true when the this.init() method has completed and the component is ready to render.
		*/
		this.initialized = false;
		
		/*	Property: this.initList
				Array, list of "fetch" method names that should be invoked in order to initialize the components. Typically ajax calls.
		*/
		this.initList = this.options.initList || [];
		
		/* Property: this.showLoadMask
				Function, executed when we need to display a loading mask over the component. Loading masks are displayed when we fetch data that must be retrieved
				before the UI can refresh.
		*/
		this.showLoadMask = this.options.showLoadMask || function() { return null; }
		
		/*	Property: this.hideLoadMask
				Function, executed when we need to hide the loading mask over the component.
		*/
		this.hideLoadMask = this.options.hideLoadMask || function() { return null; }
		
		/*	Property: this.initPending
				Boolean, set to true when this.init() is still actively processing.
		*/
		this.initPending = false;
		
		/*	Property: this.delayRefresh
				Boolean, set to true when there are one or more data requests in progress and we should not refresh the UI until they are all complete.
				Helps us avoid a situation where a UI refresh is processed immediately before a fetch method completes which would generate a UI refresh of its own.
		*/
		this.delayRefresh = false;
		
		this.excludeRefresh = false;
		
		/*	Property: this.childComponents
				Array, if the .render() method initializes and renders other components, then those child components should be added to this array.
				Tracking the child components here enables this base class to clean up and delete any orphaned components after a .refresh() occurs.
		*/
		this.childComponents = [];
		
		/*	Property: this.templates
				Hash, where the key is the name of the template and the value is a string containing the template.The hash contains each template used by the component. 
				The template element identifiers are passed in via options.templates and below we will populate this.templates with the content of the template.
		*/
		this.templates = {};
		
		/*	Property: this.refreshList
				Array or boolean, used to store CSS selectors for the portions of the component that must be updated given the recent data change. If set
				to true (boolean), then that implies the entire component needs to be refreshed.
		*/
		this.refreshList = [];
		
		// if no templates were provided, throw an error because we can't continue without something to render.
		if (this.options.templates.length == 0) {
			throw new Error("TXMBase::constructor cannot continue -- no templates provided.");
		// else loop over each Mustache template element identifier and add the content of the template to this.templates
		} else {
			for (var i = 0; i < this.options.templates.length; i++) {
				// _getTemplate will throw an error if the template doesn't exist
				this.templates[this.options.templates[i]] = (_getTemplate(this.options.templates[i]));
			}
		}
		
		/*	Property: this.loadingTemplate
				String, element identifier of the template used to display a loading spinner or loading message. The loadingTemplate
				is utilized only if the .render() method is invoked before the component has been initialized. It allows the component to return
				a rendered DomNode that will be subsequently updated as soon as initialization completes.
		*/
		if (typeof(this.options.loadingTemplate) == "string") {
			this.loadingTemplate = _getTemplate(this.options.loadingTemplate);
		} else {
			this.loadingTemplate = "<div>loading</div>";
		}
		
		/*	Property: this.uiBindings 
				Object, dictates what part of the rendered component should be updated when a given data change occurs. Each property on this object
				corresponds to a property on this.data. 
				Example: this.uiBindings = 
					"participant_list":[".t4m-jq-cm-convo-participant-container",".t4m-jq-cm-create-convo-send-btn"]
					,"person_id":true
				};
				
				In the above example, a change to this.data.participant_list will trigger an update of elements with classes ".t4m-jq-cm-convo-participant-container" 
				and ".t4m-jq-cm-create-convo-send-btn" while an update to "person_id" will trigger a full refresh of the component.
		*/
		this.uiBindings = this.options.uiBindings || {};		
		
		/*	Property: this.dataBindings
				Object, dictates which 'fetch' methods should be executed when a change occurs to a given value on this.data. 
				In the example below, a change to this.data.person_id will trigger the method this._fetchPersonList. The fetch methods are defined by the
				child component. The "delayRefresh":true tells the component that we should not refresh the component until the fetch method completes and 
				the new data has been retrieved. It will also trigger a modal loading cover/spinner preventing any user input while the new data is being retrieved.
				,"dataBindings":{
					"person_id":{"delayRefresh":true	// if person_id changes, invoke this._fetchPersonList, true means that will blur component while data is fetched
								,"methods":["_fetchPersonList"]
					} 
				}
		*/
		this.dataBindings = this.options.dataBindings || {};
		
		/* Property: this._data
				Object, holds all of the data required to render the component. However, it should *never* be modified directly. All changes to this._data
				should be made through this.data below.
		*/
		if (typeof(data) === "object") {
		this._data = data;
		} else {
			throw new Error("TXMBase::constructor cannot continue. Missing argument 'data'. The 'data' argument is required and must contain a full definition of the component model data.");
		}
		
		/*	Property: this.data
				ES6 Proxy for this._data
		
				The this._data parameter is where all the data for the component is stored. It holds all the data required for the component to render itself.
				However, this._data is only accessed via the property this.data which is an ES6 Proxy created by the ObservableSlim library. this.data allows us to
				monitor for changes to our data and trigger UI updates as necessary. Whenever this.data is modified, the handler function below is invoked with an 
				array of the changes that were made. 
				
				For example, this modification: 
				
				this.data.blah = 42;
				
				Would invokve the handler function with the following single 'changes' argument: 
					[{"type":"add","target":{"blah":42},"property":"blah","newValue":42,"currentPath":"testing.blah"}]
					
				Note for IE11 users: all properties must be defined at the time of initialization else their changes will not be observed.
		*/
		this.data = ObservableSlim.create(this._data, true, function(changes) { 
		
			// we don't process any changes until the component has marked itself as initialized, this prevents
			// a problem where the instantiation of the base class and passing in default this.data values triggers a change
			// and refresh before anything has even loaded
			if (self.initialized == true) {
			
				// by default any qualified fetch requests will not cause a refresh delay
				var delayRefresh = false;

				// fetchList is used to store the names of the methods we must invoke to retrieve new data. the updates done by the _fetch* methods
				// will typically then trigger ui refreshes after the ajax request returns
				var fetchList = [];
				
				// loop over every change that was just made to this.data and see if it qualifies against any data bindings.
				// if it does match any data bindings, then we will need to update the appropriate portions of the rendered component.
				var i = changes.length;
				while (i--) {
					console.log(changes[i].currentPath);
					// loop over each ui binding and see if any of the changes qualify to trigger a refresh
					for (var uiBinding in self.uiBindings) {
						
						// check if the user passed in a regular expression
						var regExpBinding = false;
						if (uiBinding.charAt(0) === "/" && uiBinding.charAt(uiBinding.length-1) === "/") {
							// if it is a regular expression, then test it against the current path
							var regExpBinding = (new RegExp(uiBinding.substring(1, uiBinding.length-1))).test(changes[i].currentPath);
						}
						
						// if we're not already refreshing the entire component and the recent change was made to a data property 
						// that we've bound, then we need to go update the appropriate portion of the UI.
						if (self.refreshList !== true && (uiBinding == changes[i].currentPath || regExpBinding)) {
							
							// if the data binding is simply set to 'true', then that means the entire component must be refreshed.
							if (self.uiBindings[uiBinding] === true) {
								self.refreshList = true;						
							// else add the CSS selectors from the data binding to the full list of CSS selectors that we'll be refreshing
							} else {
								self.refreshList = self.refreshList.concat(self.uiBindings[uiBinding]);
							}
						}
					}

					// loop over each data binding and see if any of the changes qualify to trigger a data request
					for (var dataBinding in self.dataBindings) {
						
						// check if the user passed in a regular expression
						var regExpBinding = false;
						if (dataBinding.charAt(0) === "/" && dataBinding.charAt(dataBinding.length-1) === "/") {
							// if it is a regular expression, then test it against the current path
							var regExpBinding = (new RegExp(dataBinding.substring(1,dataBinding.length-1))).test(changes[i].currentPath);
						}
						
						// if the recent change was made to a data property that we've bound, then we need to go update the appropriate portion of the UI.
						if (dataBinding == changes[i].currentPath || regExpBinding) {

							// check if this data binding requires us to delay refreshing the page
							if (self.dataBindings[dataBinding].delayRefresh == true) delayRefresh = true;
							
							// append to the fetchList array which fetch methods we will need to invoke
							var fetchList = fetchList.concat(self.dataBindings[dataBinding].methods);
						}
					}

				}
				
				// fire off methods to retrieve more data (if needed) and refresh the component (if needed)
			  	self._fetch(delayRefresh, fetchList);
				self.refresh();
			};
		});
		
		/*	Method: this.observe
				Allows external entities to observe changes that occur on the this.data property. This method is defined
				in the constructor rather than prototype because it must have access to "var data" which is only available in the constructor
				and is unique to each instantiation of the base class.
				
				This method is useful when one class has instantiated several others and it must monitor for any data changes that occur to those classes.
			
			Parameters:
				fnChanges - a function that is invoked with with a single argument whenever 'var data' is modified. The single argument will have
							the following format:
							[{"type":"add","target":{"blah":42},"property":"blah","newValue":42,"currentPath":"testing.blah"}]
		
			Returns:
				Nothing.
		*/
		constructor.prototype.observe = function(fnChanges) {
			return ObservableSlim.create(this._data, true, fnChanges);
		};

		// Unless we've been told to delay the initialization of the component, fire off initialization immediately
		var delayInit = this.options.delayInit || false;
		if (delayInit == false) this.init();
		
	};
	
	/*	Method: this.init
			Runs any initialization procedures required before the component renders for the first time. Typically this means retrieving data from external APIs.
	*/
	constructor.prototype.init = function() {

		var self = this;
		
		// this is where we'll store 'active promises'. active promises must be resolved before the component renders for the first time
		var listActivePromises = [];
		
		// this is where we'll store 'passive promises'. passive promises do not need to be resolved before the component renders for the first time
		var listPassivePromises = [];
		
		// loop over each fetch method required for initialization
		for (var i = 0; i < this.initList.length; i++) {
			// if the initList item has specified a conditional, then we need to evaluate it
			// if it returns true, then we proceed to create the new promise. if it returns false, then we can 
			// skip it and go to the next initList item
			if (typeof this.initList[i].condition === "function") {
				if (this.initList[i].condition() == false) continue;
			}
			
			// create a promise for the fetch method required for initialization
			var promise = new Promise((function(i) {
				return function(resolve, reject) { 
					self[self.initList[i].method](resolve,reject); 
				};
			})(i)).catch((function(i) {
				return function(error) {	
					console.error(error);
					throw new Error("TXMBase::init cannot continue, "+self.className+"."+self.initList[i].method+"() failed to resolve. Error: " + error);
				}
			})(i));
			
			// if this initialization method should prevent the component from rendering, then add it to the array of active promises
			if (this.initList[i].preventRender == true) {
				listActivePromises.push(promise);
			
			// else add it to the array of passive promises
			} else {
				listPassivePromises.push(promise);
			}
		}
		
		// if there are promises that must resolve before the component renders, then we need to start them and mark the initialization as pending
		if (listActivePromises.length > 0) {
		
			this.initPending = true;
			// Create a Promise all that resolves when all of the promises resolve
			Promise.all(listActivePromises).then(function() { 
				setTimeout(function() {
					self.initialized = true;
					self.initPending = false;
					self.refreshList = true;
					self.refresh();
				},50);
				
				// if the child class supplied a custom follow up initialization method, then invoke it
				if (typeof(self._init) == "function") self._init();
				
			}).catch(function(failedPromise) {console.error(failedPromise);});
		
		// else there's no data that we need to initialize so we can mark the component as initialized
		} else {
			this.initialized = true;
			
			// if the child class supplied a custom follow up initialization method, then invoke it
			if (typeof(self._init) == "function") self._init();
		}
		
		if (listPassivePromises.length > 0) Promise.all(listPassivePromises).catch(function(failedPromise) {console.error(failedPromise);});
	};
	
	/*	Method: this._fetch
			This method is invoked when we need to retrieve additional data from remote sources. This method is typically after 
			a change to this.data that qualifies on a this.dataBinding item.
			
			This is a private method (denoted by the underscore _), not intended to be executed externally.
			
		Parameters:
			delayRefresh - Boolean, set to true when these fetch requests should complete before the component is refreshed. Set to false if the component 
							is allowed to refresh while the fetch methods are in-progress.
							
			fetchList - Array of strings, a list of the fetch methods that should be executed.
	*/
	constructor.prototype._fetch = function(delayRefresh, fetchList) {
		var self = this;
		
		// will this fetch require a load mask?
		var loadMask = false;
		
		// if these fetches should finish before any UI refresh and there are changes present, then we need to
		// mark this.delayRefresh to true to prevent any refreshes from kicking off *and* produce a load mask (if the 
		// component has even supplied a load mask function)
		if (delayRefresh == true && fetchList.length > 0) {
			this.delayRefresh = delayRefresh;
			this.showLoadMask();
			loadMask = true;
		}
		
		var listPromises = [];
		
		// loop over each fetch method passed into this method
		var i = fetchList.length;
		while (i--) {
			// Create a promise for the data fetch method
			var fetchPromise = new Promise((function(i) {
				return function(resolve, reject) { 
					if (typeof(self[fetchList[i]]) == "function") {
						self[fetchList[i]](resolve,reject);
					} else {
						throw new Error("TXMBase::_fetch cannot continue, the method "+self.className+"."+fetchList[i]+"() does not exist or is not a function.");
					}
				}
			})(i)).catch((function(i) {
				return function(error) {
					console.error(error);
					throw new Error("An error occured in the "+self.className+"."+fetchList[i]+"() method.");
				}
			})(i));
			
			// add the promise to the full list of promises
			listPromises.push(fetchPromise);
		};	
		
		// Create a Promise all that resolves when all of the fetch promises resolve
	 	Promise.all(listPromises).then(function() { 
			
			// the fetches have all completed and the component is now safe to refresh UI, so we can turn off delayRefresh
			self.delayRefresh = false;
			
			// if we created a load mask earlier on, then we now need to remove it
			if (loadMask == true) self.hideLoadMask();
			
			// if there are pending UI updates (possibly triggered by these fetches), then kick off the refresh process
			if (self.refreshList == true || self.refreshList.length > 0) self.refresh();
			
		}).catch(function(failedPromise) {console.error(failedPromise);});		
	
	};
	
	/*	Method: this.render
			Renders and returns the component. The render method will first verify that the component has been initialized, if it has not been initialized, then
			it will invoke this.init(). If the initialization is already in progress, then it will return a temporary 'loading' display. If 
			the component has already been initialized, then the standard render method this._render() is invoked.
		
		Returns:
			jQuery-referenced DocumentFragment, the component ready to be inserted into the DOM.
	 */
	constructor.prototype.render = function() {
		
		if (this.excludeRefresh === false) {
			// if the component hasn't been initialized and there's no initialization in-progress, 
			// then we need to initialize it before attempting a render
			if (this.initialized == false && this.initPending == false) this.init();			
			
			// if the initialization is in progress, then render the 'loading' display
			if (this.initialized == false && this.initPending == true) {

				var jqDom = $(Mustache.render(this.loadingTemplate, null));
			
			// else the component is initialized and ready for the standard render
			} else {
				var jqDom = this._render();
			}
		
			this.jqDom = jqDom;
		} else {
			var jqDom = $("<div>Exclude from render</div>");
		}
		
		return jqDom;
	};
	
	/*	Method: this._render()
			This render method on the base class should be over-written by the child class. This is where the 
			component (not the temporary 'loading' display) is rendered and returned.
			
			The primary difference between this.render() and this._render() is that this.render() will 1. determine if the component is initalized
			, 2. render a loading page if necessary and 3. update the this.jqDom property. this._render() does not handle any of that. It simply
			renders the full component as it would if the component is fully initialized. It does not update this.jqDom. This distinction becomes
			important in the this.refresh() method where sometimes we don't want to overwrite the entire this.jqDom but instead refresh portions of it.
			Finally, this.render() is a public method while this._render() is a private method -- this._render() should not be invoked externally.
			
		Returns:
			jQuery-referenced DocumentFragment, the component ready to be inserted into the DOM.
	*/
	constructor.prototype._render = function() {
		// If the child class has not overwritten this method, then we just assume that 
		var jqDom = $(Mustache.render(this.templates[0], this.data));
		return jqDom;	
	};
	
	/*	Method: this.refresh
			This method is invoked when we want to re-render part or all of the component. This method is typically invoked after a new recipient or new 'regarding' entity has been added.
	*/
	constructor.prototype.refresh = function() {
	
		var self = this;
		
		// if the component hasn't been initialized yet, then we ignore any refresh requests. a component
		// cannot be rendered until it has been initialized so therefore there's nothing to refresh yet.
		// we also cannot perform a refresh if this.delayRefresh is set to true -- implies that there are pending data 
		// requests that need to complete before we can do any updating
		if (this.initialized == true && this.delayRefresh == false) {
			
			if (this.jqDom === null) {
				this.render();
			} else {
				
				// if a selector was provided, then we don't need to refresh the whole component, only a portion of it
				if (typeof this.refreshList == "object" && this.refreshList.length > 0) {
				
					// remove any duplicate selectors
					this.refreshList = this.refreshList.filter(function(item, pos) {
						return self.refreshList.indexOf(item) == pos;
					});
					
					// loop over each child component
					var a = this.childComponents.length;
					while (a--) {
					
						// by default, the component will not be part of the refresh, it will not execute ._render() and it will not update .jqDom
						this.childComponents[a].excludeRefresh = true;
						
						// loop over each selector a part of this refresh list -- tells us which parts of the component DOM will be updated
						var b = this.refreshList.length;
						while (b--) {
							var jqWillBeUpdated = this.jqDom.find(this.refreshList[b]);
							
							// if the child component is contained within the portion of the parent component that will be updated
							// then that child component *should* be included in the refresh
							if (jqWillBeUpdated.length > 0 && jqWillBeUpdated[0].contains(this.childComponents[a].jqDom[0])) {
								this.childComponents[a].excludeRefresh = false;
								break;
							}
						}
					}
					
					var jqNewPage = this._render();
					// the render method will set this.jqDom to whatever was rendered last, so we need to set it back to the old page since we're not refreshing the whole page
					var i = this.refreshList.length;
					while (i--) {
						
						var jqOld = this.jqDom.find(this.refreshList[i]);
						var jqNew = jqNewPage.find(this.refreshList[i]);
						
						// selectors should uniquely identify the element to be replaced, 
						// if there are multiple targets, the .replaceWith won't work properly so we need to throw an error
						if (jqOld.length > 1 || jqNew.length > 1) {
							console.error("TXMBase::refresh() cannot continue. Refresh selector has multiple targets.");
							break;
						} else {
							jqOld.replaceWith(jqNew);
						}
					}
					
					// reset all components back to the default -- that they are refreshed when the parent component is refreshed
					var i = this.childComponents.length;
					while (i--) this.childComponents[i].excludeRefresh = false;
					
					// component has been refreshed, so we can reset the pending list of refresh changes
					this.refreshList = [];
					
				// else if this.refreshList has been set to true (boolean) we must refresh the entire component
				} else if (this.refreshList == true) {
				
					var jqOldPage = this.jqDom;
					var jqNewPage = this.render();
				
					jqOldPage.replaceWith(jqNewPage);
					this.jqDom = jqNewPage;
					
					// component has been refreshed, so we can reset the pending list of refresh changes
					this.refreshList = [];
					
				}
				
				// since we've just refreshed our component, it's possible that our component could have instantiated
				// new child components in its .render() method. if that has happened, then we need to see if those components
				// are now part of our component's DOM or if they are just sitting orphaned in the virtual DOM. If they are orphaned
				// and not in use, then we need to clean them up. that's what we do here:
				var i = this.childComponents.length;
				while (i--) {
					// if the child component wasn't rendered or if it was rendered but is no longer contained within the parent component
					// then we need to destroy it to reduce memory usage
					if (this.childComponents[i].jqDom === null || !this.jqDom[0].contains(this.childComponents[i].jqDom[0])) {
						this.childComponents[i].destroy();
						this.childComponents.splice(i,1);
					}
				}	
			}
		}
	};
	
	/*	Method: this.registerChild
			When a component nests other components within it, we refer to the original component as the "parent component" and the nested component(s) as "child component(s)".
			In order for refreshes of the parent component to work properly, we must register the child components on the parent component. This will allow our .refresh() method
			to intelligently determine if it is necessary to re-render the child component(s) when an update occurs to the parent component.
	*/
	constructor.prototype.registerChild = function(childComponent) {
		
		// verify that the user passed in a valid component that extends the base class
		if (typeof childComponent !== "object" 
				|| childComponent.init !== this.init
				|| childComponent.render !== this.render
				|| childComponent.destroy !== this.destroy) {
			throw new Error("TXMBase::registerChild() cannot continue -- childComponent is not a valid component.");
		} else {
			this.childComponents.push(childComponent);
		}
	};
	
	/*	Method: this.destroy
			This method will remove this.jqDom from the DOM and delete the observable that was created during initialization.
			If the component initialized any child components, then those will be destroyed as well. This helps ensure that memory 
			usage does not balloon after repeated refreshes and UI updates.
		
		Returns:
			Nothing.
	*/
	constructor.prototype.destroy = function() {
		
		// Destroy any child components
		var i = this.childComponents.length;
		while (i--) this.childComponents[i].destroy();
		
		// Remove our data proxy from the ObservableSlim singleton. No further modifications to this.data will refreshes or fetches.
		ObservableSlim.remove(this.data);
		
		// if our component has been rendered, then remove it from the DOM (if it's even still in the DOM)
		if (this.jqDom !== null) this.jqDom.remove();
		
	};
	
	return constructor;
	
})();