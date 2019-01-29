/*
 * 	Nimbly
 *	Version 0.0.7
 * 	https://github.com/elliotnb/nimbly
 *
 * 	Licensed under the MIT license:
 * 	http://www.opensource.org/licenses/MIT
 *
 *	Nimbly is a JavaScript component framework for single page applications. The objectives of Nimbly are as follows:
 *
 *	1. Provide a common structure and organization for child components to follow.
 *	2. Reduce repetitive 'boiler plate' code contained in the child components.
 *	3. Encourage adoption of best practices and functionality of modern JS development and frameworks:
 *		- Templating.
 *		- One-way data binding.
 *		- State management.
 *		- Elimination of explicit DOM manipulations.
 *		- Dependency injection.
 *		- Automated unit testing.
 *	4. Reduce effort level for non-author devs to understand and maintain components.
 *	5. Allow for easy re-factors of jQuery-driven legacy code.
 *	6. Coordinate refreshes amongst all components on the page to minimize re-draws and improve the user experience.
 */
var Nimbly = function($,Mustache,ObservableSlim,MutationObserver,HTMLElement, document) {

	if (typeof $ === "undefined") throw new Error("Nimbly requires jQuery 1.9+.");
	if (typeof Mustache === "undefined") throw new Error("Nimbly requires Mustache.");
	if (typeof ObservableSlim === "undefined") throw new Error("Nimbly requires ObservableSlim 0.1.0+.");

	var baseClassInstance = 0;

	// The queueRefresh function is used for queueing up refreshes of all components on the page and triggering them in batches
	// in order to avoid the unnecessary page re-draws that would occur if we updated the DOM immediately when a component refresh
	// is invoked
	var refreshQueue = [];
	var uniqueIndex = [];
	var queueRefresh = function(refreshData) {
		if (refreshQueue.indexOf(refreshData.instanceId) === -1) {
			uniqueIndex.push(refreshData.instanceId);
			refreshQueue.push(refreshData.refresh)
		}

		var refreshCount = refreshQueue.length;
		setTimeout(function() {
			if (refreshCount == refreshQueue.length) {
				var i = refreshQueue.length;
				while (i--) refreshQueue.pop()();
				uniqueIndex.length = 0;
			}
		},10);
	};
	
	//monitoredInsertion is an array of every component that has been rendered with a _afterInDocument defined that has not
	// already been inserted into the document.
	var monitoredInsertion = [];
	
	// observe all mutations on the document, we use this as a means to trigger the `_afterInDocument` method
	// when a component has been inserted to the page
	var documentObserver = new MutationObserver(function(mutations) {
		var i = monitoredInsertion.length;
		
		// loop over every component that we're monitoring for insertion into the DOM
		while (i--) {
			// if the component is now in the document
			if (document.body.contains(monitoredInsertion[i].jqDom[0])) {
				
				// invoke the _afterInDocument lifecycle method for the component
				monitoredInsertion[i]._afterInDocument();
				
				// the component is now in the document so we can remove it from the array of components we're monitoring
				// for insertion into the document
				monitoredInsertion.splice(i,1);
			}
		}
	});
	documentObserver.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});

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
			throw new Error("Nimbly::_getTemplate() could not find the template with element ID: '"+templateElmtId+"'.");
		}
		return template;
	};
	
	var isValidComponent = function(component) {
		if (typeof component.render !== "function" || typeof component.init !== "function" || typeof component.isReady !== "function") {
			return false;
		}
		return true;
	};

	/*	Constructor:
		Initializes an object instance of T4M component base class.
	*/
	var constructor = function(className, defaults, data, options) {

		var self = this;

		// if the user didn't an object for state data, then instantiate an empty plain object
		if (typeof(data) == "undefined") var data = {};
		
		// if the user didn't provide any options, then instantiate an empty options object so we don't error out below
		if (typeof(options) == "undefined") var options = {};

		// we keep a reference to the original 'data' object (so that changes to the data are relayed back to
		// whatever initialized this component), but at the same time we merge in 'defaults' (which might contain
		// more fields than are contained in 'data') but *without* overwriting anything in 'data'.
		var dataSuperSet = {};
		$.extend(true, dataSuperSet, defaults.data, data);
		$.extend(true, data, dataSuperSet);

		// merge the default options with custom options passed into the component constructor. we do not want to keep a reference
		// to anything on defaults or options, so we can perform a deep copy instead of a shallow merge
		this.options = $.extend(true, {}, defaults, options, {"data":data});

		/* Property: this._data
			Object, holds all of the data required to render the component. However, it should *never* be modified directly. All changes to this._data
			should be made through this.data below.
		*/
		this._data = data;
		
		/*	Property: this.className
				String, the name of the class that initialized the base class. We store this value for debugging and logging purposes.
		*/
		this.className = className;

		/*	Property: this._baseClassInstance
				Integer, counts the number of times the base class has been initialized. Useful for debugging, identifying unique instances.
		*/
		this._baseClassInstance = baseClassInstance++;

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

		/*	Property: this._pendingInit
				Boolean, set to true when this.init() is still actively processing.
		*/
		this._pendingInit = false;

		/*	Property: this._pendingFetchCount
				Integer, a count of the number of unresolved and still in-progress fetch promises.
		*/
		this._pendingFetchCount = 0;

		/*	Property: this._initRendered
			Boolean, set to true when the component has fully rendered. This property is important for determining whether
			or not a child component needs to be re-rendered (refreshed) when a parent component is refreshed.
		*/
		this._initRendered = false;

		/*	Property: this._delayRefresh
				Boolean, set to true when there are one or more data requests in progress and we should not refresh the UI until they are all complete.
				Helps us avoid a situation where a UI refresh is processed immediately before a fetch method completes which would generate a UI refresh of its own.
		*/
		this._delayRefresh = false;
		
		/*	Property: this._renderRunning
				Boolean, set to true when the component's _render() method is running. This boolean is used to catch this.data mutations while the component is rendering.
				Such mutations are liable to result in an infinite loop via uiBindings and are disallowed.
		*/
		this._renderRunning = false;

		this._cleanUpChildren = null;

		/*	Property: this.childComponents
				Object, if the rendering of this component requires other components (children), then those child components should
				be registered on the parent component and tracked on this property. Tracking the child components here enables this
				base class to clean up and delete any orphaned components after a ._refresh() occurs.
		*/
		this.childComponents = {"default":[]};

		/*	Property: this._refreshList
				Array or boolean, used to store CSS selectors for the portions of the component that must be updated given the recent data change. If set
				to true (boolean), then that implies the entire component needs to be refreshed.
		*/
		this._refreshList = [];

		/*	Property: this.templates
				Hash, where the key is the name of the template and the value is a string containing the template. The hash contains each template used by the component.
				The template element identifiers are passed in via options.templates and below we will populate this.templates with the content of the template.
		*/
		this.templates = {};

		// if the component defined the templates as an array, then that means the component has identifier their templates
		// using element IDs of <script> tags -- we now need to go retrieve the contents of those templates
		if (this.options.templates instanceof Array) {
			// if no templates were provided, throw an error because we can't continue without something to render.
			if (this.options.templates.length == 0) {
				throw new Error("Nimbly::constructor cannot continue -- no templates provided.");
			// else loop over each Mustache template element identifier and add the content of the template to this.templates
			} else {
				for (var i = 0; i < this.options.templates.length; i++) {
					// _getTemplate will throw an error if the template doesn't exist
					this.templates[this.options.templates[i]] = (_getTemplate(this.options.templates[i]));
				}
			}
		// else the templates were passed in as a hash using name value pairs with template literals containing the template content
		} else {
			this.templates = this.options.templates;
		}

		/*	Property: this.loadingTemplate
				String, template content OR an element identifier of the template used to display a loading spinner or loading message. The loadingTemplate
				is utilized only if the .render() method is invoked before the component has been initialized. It allows the component to return
				a rendered DomNode that will be subsequently updated as soon as initialization completes.
		*/
		if (typeof(this.options.loadingTemplate) === "string") {
			
			// throw an error if the loading template is an empty string
			if (this.options.loadingTemplate.length === 0) {
				throw new Error("Nimbly::constructor cannot continue -- the loadingTemplate cannot be an empty string.");
			}
			
			// if the user supplied an element identifier, then go fetch the content of the
			if (document.getElementById(this.options.loadingTemplate)) {
				this.loadingTemplate = _getTemplate(this.options.loadingTemplate);
			} else {
				this.loadingTemplate = this.options.loadingTemplate;
			}
		} else {
			this.loadingTemplate = "<div class=\"default_nimbly_loading_template\"></div>";
		}

		/*	Property: this._uiBindings
				Object, dictates what part of the rendered component should be updated when a given data change occurs. Each property on this object
				corresponds to a property on this.data.
				Example: this._uiBindings =
					"participant_list":[".t4m-jq-cm-convo-participant-container",".t4m-jq-cm-create-convo-send-btn"]
					,"person_id":true
				};

				In the above example, a change to this.data.participant_list will trigger an update of elements with classes ".t4m-jq-cm-convo-participant-container"
				and ".t4m-jq-cm-create-convo-send-btn" while an update to "person_id" will trigger a full refresh of the component.
		*/
		this._uiBindings = this.options.uiBindings || {};

		/*	Property: this._dataBindings
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
		this._dataBindings = this.options.dataBindings || {};

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
		this.data = ObservableSlim.create(this._data, false, function(changes) {
		
			// if the component is attempting to modify this.data from inside the ._render method, then we need to throw an error.
			// doing so is a bad practice -- it's liable to result in an infinite loop
			if (self._renderRunning === true) {
				throw new Error(self.className + "._render() is attempting to modify this.data. Mutating this.data while rendering is disallowed because it's likely to generate infinite loops via uiBindings.");
			}
		
			// we don't process any changes until the component has marked itself as initialized, this prevents
			// a problem where the instantiation of the base class and passing in default this.data values triggers a change
			// and refresh before anything has even loaded
			if (self.initialized == true) {
			
				// by default any qualified fetch requests will not cause a refresh delay
				var delayRefresh = false;

				// fetchList is used to store the names of the methods we must invoke to retrieve new data. the updates done by the _fetch* methods
				// will typically then trigger ui refreshes after the ajax request returns
				var fetchList = {};

				// loop over every change that was just made to this.data and see if it qualifies against any data bindings.
				// if it does match any data bindings, then we will need to update the appropriate portions of the rendered component.
				var i = changes.length;
				while (i--) {

					// loop over each ui binding and see if any of the changes qualify to trigger a refresh
					for (var uiBinding in self._uiBindings) {

						// check if the user passed in a regular expression
						var regExpBinding = false;
						if (uiBinding.charAt(0) === "/" && uiBinding.charAt(uiBinding.length-1) === "/") {
							// if it is a regular expression, then test it against the current path
							var regExpBinding = (new RegExp(uiBinding.substring(1, uiBinding.length-1))).test(changes[i].currentPath);
						}

						// if we're not already refreshing the entire component and the recent change was made to a data property
						// that we've bound, then we need to go update the appropriate portion of the UI.
						if (self._refreshList !== true && (uiBinding == changes[i].currentPath || regExpBinding)) {

							// if the data binding is simply set to 'true', then that means the entire component must be refreshed.
							if (self._uiBindings[uiBinding] === true) {
								self._refreshList = true;
							// else add the CSS selectors from the data binding to the full list of CSS selectors that we'll be refreshing
							} else {
								self._refreshList = self._refreshList.concat(self._uiBindings[uiBinding]);
							}
						}
					}

					// loop over each data binding and see if any of the changes qualify to trigger a data request
					for (var dataBinding in self._dataBindings) {

						// check if the user passed in a regular expression
						var regExpBinding = false;
						if (dataBinding.charAt(0) === "/" && dataBinding.charAt(dataBinding.length-1) === "/") {
							// if it is a regular expression, then test it against the current path
							var regExpBinding = (new RegExp(dataBinding.substring(1,dataBinding.length-1))).test(changes[i].currentPath);
						}

						// if the recent change was made to a data property that we've bound, then we need to go update the appropriate portion of the UI.
						if (dataBinding == changes[i].currentPath || regExpBinding) {

							// check if this data binding requires us to delay refreshing the page
							if (self._dataBindings[dataBinding].delayRefresh == true) delayRefresh = true;

							// append to the fetchList array which fetch methods we will need to invoke
							// fetchList = fetchList.concat(self._dataBindings[dataBinding].methods);
							var a = self._dataBindings[dataBinding].methods.length;
							while (a--) {
								if (typeof fetchList[self._dataBindings[dataBinding].methods[a]] === "undefined") {
									fetchList[self._dataBindings[dataBinding].methods[a]] = [];
								}
								
								fetchList[self._dataBindings[dataBinding].methods[a]].push(changes[i]);
							}
							
						}
					}

				}

				// fire off methods to retrieve more data (if needed) and refresh the component (if needed)
			  	self._fetch(delayRefresh, fetchList);

				// if we have a list of changes to process or if the whole component needs to be refreshed, then queue up the refresh
				if (self._refreshList === true || self._refreshList.length > 0) {
					self.pendingRefresh = true;
					queueRefresh({
						"instanceId": self._baseClassInstance
						,"refresh":function() { self._refresh();}
					});
				}
			};
		});
		
		// Unless we've been told to delay the initialization of the component, fire off initialization immediately
		var delayInit = this.options.delayInit || false;
		if (delayInit == false) this.init();

	};
	
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

	/*	Method: this.init
			Runs any initialization procedures required before the component renders for the first time. Typically this means retrieving data from external APIs.
	*/
	constructor.prototype.init = function() {

		var self = this;
		
		// run a quick sanity check, verify that the dataBindings defined by the component refer to actual methods on the component
		// if they don't exist, then we want to throw a warning notifying the developer of the potential misconfiguration
		for (var dataBinding in this._dataBindings) {
			for (var b = 0; b < this._dataBindings[dataBinding].methods.length; b++) {
				if (typeof this[this._dataBindings[dataBinding].methods[b]] !== "function") {
					throw new Error("Nimbly::init cannot continue. Please review the dataBindings on class "+self.className+". The method "+this._dataBindings[dataBinding].methods[b]+" does not exist or is not a function.");
				}
			}
		}

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
				if (this.initList[i].condition.call(self) == false) continue;
			}

			// create a promise for the fetch method required for initialization
			var promise = new Promise((function(i) {
				return function(resolve, reject) {
					self[self.initList[i].method](resolve,reject);
				};
			})(i)).catch((function(i) {
				return function(error) {
					console.error(error);
					throw new Error("Nimbly::init cannot continue, "+self.className+"."+self.initList[i].method+"() failed to resolve. Error: " + error);
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
			// we have one or more in-progress promises, so increment the count
			this._pendingFetchCount++;
			this._pendingInit = true;
			// Create a Promise all that resolves when all of the promises resolve
			var initListPromise = Promise.all(listActivePromises).then(function() {
				initListPromise.done = true;
				self.initialized = true;
				self._pendingInit = false;
				self._refreshList = true;
				self.pendingRefresh = true;
				queueRefresh({
					"instanceId": self._baseClassInstance
					,"refresh":function() { self._refresh();}
				});

				// if the child class supplied a custom follow up initialization method, then invoke it
				if (typeof(self._init) == "function") self._init();

				// the promises have all been fulfilled so we decrement the outstanding promise count
				self._pendingFetchCount--;

			}).catch(function(failedPromise) {initListPromise.done = true; console.error(failedPromise);});
			
			setTimeout(function() {
				if (initListPromise.done !== true) {
					console.warn(self.className + " initList methods have not resolved after 15 seconds. Please ensure that your initList methods properly resolve or reject.");
				}
			}, 15000);

		// else there's no data that we need to initialize so we can mark the component as initialized
		} else {
			this.initialized = true;

			// if the child class supplied a custom follow up initialization method, then invoke it
			if (typeof(self._init) == "function") self._init();
		}

		if (listPassivePromises.length > 0) {
			this._pendingFetchCount++;
			var initListPassivePromises = Promise.all(listPassivePromises).then(function() {
				initListPassivePromises.done = true;
				self._pendingFetchCount--;
			}).catch(function(failedPromise) {initListPassivePromises.done = true; console.error(failedPromise);});

			setTimeout(function() {
				if (initListPassivePromises.done !== true) {
					console.warn(self.className + " initList methods have not resolved after 15 seconds. Please ensure that your initList methods properly resolve or reject.");
				}
			}, 15000);
		}
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
		// mark this._delayRefresh to true to prevent any refreshes from kicking off *and* produce a load mask (if the
		// component has even supplied a load mask function)
		if (delayRefresh == true && Object.keys(fetchList).length > 0) {
			this._delayRefresh = delayRefresh;
			
			// if the component has defined a load mask method to display during refresh delays, then we run the method to display the load mask
			if (typeof this.showLoadMask === "function") this.showLoadMask();
			loadMask = true;
		}

		if (Object.keys(fetchList).length > 0) {

			this._pendingFetchCount++;

			var listPromises = [];

			// loop over each fetch method passed into this method
			for (var fetchMethod in fetchList) {
				// Create a promise for the data fetch method
				var fetchPromise = new Promise((function(fetchMethod) {
					return function(resolve, reject) {
						if (typeof(self[fetchMethod]) == "function") {
							self[fetchMethod](resolve,reject,fetchList[fetchMethod]);
						} else {
							throw new Error("Nimbly::_fetch cannot continue, the method "+self.className+"."+fetchMethod+"() does not exist or is not a function.");
						}
					}
				})(fetchMethod)).catch((function(fetchMethod) {
					return function(error) {
						console.error(error);
						throw new Error("An error occured in the "+self.className+"."+fetchMethod+"() method.");
					}
				})(fetchMethod));

				// add the promise to the full list of promises
				listPromises.push(fetchPromise);
			};

			// Create a Promise all that resolves when all of the fetch promises resolve
			var dataBindingPromise = Promise.all(listPromises).then(function() {

				dataBindingPromise.done = true;

				// the fetches have all completed and the component is now safe to refresh UI, so we can turn off delayRefresh
				self._delayRefresh = false;

				// if we created a load mask earlier on, then we now need to remove it
				if (loadMask == true && typeof self.hideLoadMask === "function") self.hideLoadMask();

				// if there are pending UI updates (possibly triggered by these fetches), then kick off the refresh process
				if (self._refreshList == true || self._refreshList.length > 0) {
					queueRefresh({"instanceId": self._baseClassInstance,"refresh":function() { self._refresh();}});
				}

				self._pendingFetchCount--;

			}).catch(function(failedPromise) {dataBindingPromise.done = true; console.error(failedPromise);});

			setTimeout(function() {
				if (dataBindingPromise.done !== true) {
					console.warn(self.className + " dataBinding methods have not resolved after 15 seconds. Please ensure that your dataBinding methods properly resolve or reject.");
				}
			}, 15000);

		}

	};

	/*	Method: this.render
			Renders and returns the component. The render method will first verify that the component has been initialized, if it has not been initialized, then
			it will invoke this.init(). If the initialization is already in progress, then it will return a temporary 'loading' display. If
			the component has already been initialized, then the standard render method this._render() is invoked.

		Returns:
			jQuery-referenced DocumentFragment, the component ready to be inserted into the DOM.
	 */
	constructor.prototype.render = function() {

		var self = this;
	
		// if the component hasn't been initialized and there's no initialization in-progress,
		// then we need to initialize it before attempting a render
		if (this.initialized == false && this._pendingInit == false) this.init();

		// if the initialization is in progress, then render the 'loading' display
		if (this.initialized == false && this._pendingInit == true) {

			// if the component has defined a loading render method, then we use that first
			if (typeof this._renderLoading === "function") {
				var jqDom = this._renderLoading();
			} else {
				var jqDom = $(Mustache.render(this.loadingTemplate, null));
			}
			
			// throw an error if the rendered loading display does not contain 1 top-level element.
			if (jqDom.length !== 1) {
				throw new Error(this.className +".render() cannot continue. The loadingTemplate or _renderLoading method has returned an object with "+jqDom.length+" top-level elements. There must be one top-level element that encapsulates the loading display.");
			}

		// else the component is initialized and ready for the standard render
		} else {
			// if the component does not have any pending changes and it has already been fully rendered once
			// then we don't need to re-render this component, we can just return what has already been rendered
			if (this._refreshList instanceof Array && this._refreshList.length == 0 && this._initRendered == true) {
				var jqDom = this.jqDom;

			// else the component does have pending changes or has not been fully rendered yet -- so we must invoke the normal .render() method.
			} else {
				this._renderRunning = true;
				var jqDom = this._render();
				this._renderRunning = false;

				// verify that the component ._render method correctly returned a jQuery-referenced HTMLElement
				if (!(jqDom.length > 0 && jqDom instanceof $ && jqDom[0] instanceof HTMLElement)) {
					throw new Error(this.className + ".render() cannot continue. Component ._render() method must return a jQuery-referenced DOM element. Example: $('<div>hello world</div>');");
				}
				
				// verify that the component template has a single parent element that wraps the entire component. we need a single element to encapsulate the component
				// for later portions of the framework that will search for child components with .find and .replaceWith -- those commands break down if multiple elements 
				// are returned by the ._render method
				if (jqDom.length > 1) {
					throw new Error(this.className + ".render() cannot continue. "+this.className+"._render() must return a single jQuery-referenced DOM element -- instead it returned "+jqDom.length+" elements. Ensure that your component template is wrapped (encapsulated) by a single element.");
				}

				// insert (if any) child components that have been registered to this component
				var insertedChildren = this._insertChildren(jqDom);

				var i = insertedChildren.length;
				while (i--) {
					insertedChildren[i].comp.jqDom = insertedChildren[i].elmt;
				};

				// invoke the lifecycle method informing the component rendering has just finished
				if (typeof this._renderFinalize === "function") this._renderFinalize(jqDom);
				
				// _renderFinalize was renamed to _afterRender on 10/21/2018 -- _renderFinalize is deprecated and will eventually be removed
				if (typeof this._afterRender === "function") this._afterRender(jqDom);
				
				// if this is the first time the component has been rendered, then add this component to the insertion monitoring list
				if (this._initRendered === false) {
					if (typeof this._afterInDocument === "function" && monitoredInsertion.indexOf(this) === -1) monitoredInsertion.push(this);
					
					// check if this component has any child components (or nested child components) with the _afterInDocument lifecycle method defined
					this.eachChildComponent(function(childComponent) {
						if (typeof childComponent._afterInDocument === "function" && monitoredInsertion.indexOf(childComponent) === -1) {
							monitoredInsertion.push(childComponent);
						}
					}, true);
					
				}
				
				// the component has now been fully rendered, so mark the initial render boolean as true
				this._initRendered = true;
				
			}
		}
		
		// now that we've rendered the component, reset the refresh list back to an empty array, otherwise it'll be left to true
		// and the next state mutation on the component (or parent component) will trigger a full refresh of this component
		this._refreshList = [];

		this.jqDom = jqDom;

		return jqDom;
	};

	constructor.prototype._renderWithChildren = function() {

		// if the component hasn't been initialized and there's no initialization in-progress,
		// then we need to initialize it before attempting a render
		if (this.initialized == false && this._pendingInit == false) this.init();

		// if the initialization is in progress, then render the 'loading' display
		if (this.initialized == false && this._pendingInit == true) {

			// if the component has defined a loading render method, then we use that first
			if (typeof this._renderLoading === "function") {
				var jqDom = this._renderLoading();
			} else {
				var jqDom = $(Mustache.render(this.loadingTemplate, null));
			}
			
			// throw an error if the rendered loading display does not contain 1 top-level element.
			if (jqDom.length !== 1) {
				throw new Error(this.className +".render() cannot continue. The loadingTemplate or _renderLoading method has returned an object with "+jqDom.length+" top-level elements. There must be one top-level element that encapsulates the loading display.");
			}

		// else the component is initialized and ready for the standard render
		} else {

			this._renderRunning = true;
			var jqDom = this._render();
			this._renderRunning = false;

			// verify that the component ._render method correctly returned a jQuery-referenced HTMLElement
			if (!(jqDom.length > 0 && jqDom instanceof $ && jqDom[0] instanceof HTMLElement)) {
				throw new Error(this.className + "._renderWithChildren() cannot continue. Component ._render() method must return a jQuery-referenced DOM element. Example: $('<div>hello world</div>');");
			}
			
			// verify that the component template has a single parent element that wraps the entire component. we need a single element to encapsulate the component
			// for later portions of the framework that will search for child components with .find and .replaceWith -- those commands break down if multiple elements 
			// are returned by the ._render method
			if (jqDom.length > 1) {
				throw new Error(this.className + "._renderWithChildren() cannot continue. "+this.className+"._render() must return a single jQuery-referenced DOM element -- instead it returned "+jqDom.length+" elements. Ensure that your component template is wrapped (encapsulated) by a single element.");
			}

			// insert (if any) child components that have been registered to this component
			var insertedChildren = this._insertChildren(jqDom);
			
			// invoke the lifecycle method informing the component rendering has just finished
			if (typeof this._renderFinalize === "function") this._renderFinalize(jqDom);
			
			// _renderFinalize was renamed to _afterRender on 10/21/2018 -- _renderFinalize is deprecated and will eventually be removed
			if (typeof this._afterRender === "function") this._afterRender(jqDom);

		}


		return {
			"elmt": jqDom
			,"insertedChildren":insertedChildren
		};

	};

	/*	Method: this._render()
			This render method on the base class should be over-written by the child class. This is where the
			component (not the temporary 'loading' display) is rendered and returned.

			The primary difference between this.render() and this._render() is that this.render() will 1. determine if the component is initalized
			, 2. render a loading page if necessary and 3. update the this.jqDom property. this._render() does not handle any of that. It simply
			renders the full component as it would if the component is fully initialized. It does not update this.jqDom. This distinction becomes
			important in the this._refresh() method where sometimes we don't want to overwrite the entire this.jqDom but instead refresh portions of it.
			Finally, this.render() is a public method while this._render() is a private method -- this._render() should not be invoked externally.

		Returns:
			jQuery-referenced DocumentFragment, the component ready to be inserted into the DOM.
	*/
	constructor.prototype._render = function() {
		// If the child class has not overwritten this method, then we just assume that it's a component
		// with one template whose data points are provided by this.data

		// grab the first template
		for (var tplName in this.templates) break;

		var jqDom = $(Mustache.render(this.templates[tplName], this.data));
		return jqDom;
	};

	/*	Method: this._insertChildren
			This method will iterate over all child components that have been registered to this component, search
			for a corresponding tag name (or tag name within a repeatable section) and replace that custom tag name
			with a rendered child component.

		Parameters:
			jqDom - jQuery-referenced DOM element of the component.
	*/
	constructor.prototype._insertChildren = function(jqDom) {

		var insertedChildren = [];

		// loop over each repeatable section thats been registered on this component
		for (var sectionName in this.childComponents) {

			// if the section name is 'default' then that's not a repeatable section (default is the deafult holder for child components in non-repeatable sections), so skip and continue
			if (sectionName === "default") continue;

			// this array will hold the rendered content of each iteration of this repeatable section
			var sectionContent = [];

			// the sectoonName should match up with precisely one custom HTML tag returned by the initial render of the component
			var repeatSection = jqDom.find(sectionName);

			if (repeatSection.length === 0) {
				repeatSection = jqDom.find("table[is='"+sectionName+"'], tbody[is='"+sectionName+"'], select[is='"+sectionName+"'], ul[is='"+sectionName+"'], ol[is='"+sectionName+"']");
			}

			// if we found one tag matching the repeatable section, then we can proceed to populate that tag with iterations of child components
			if (repeatSection.length === 1) {

				// loop over each set of child components registered to this repeatable sectionName
				//	each set of components (sectionItemComponents below) represents one iteration of the repeatable section
				var sectionComponents = this.childComponents[sectionName];
				for (var a = 0; a < sectionComponents.length; a++) {

					// create a clone of the repeatable section we identified above
					var cloneRepeatSection = repeatSection.clone();

					// loop over the child components registered to this iteration of the repeatable section
					// and replace the custom tag for that child component with the rendered content of the child component
					var sectionItemComponents = sectionComponents[a];
					for (var b = 0; b < sectionItemComponents.length; b++) {
						var childComponent = sectionItemComponents[b];

						// find the custom tag for where we'll be inserting the rendered child component
						var childTarget = cloneRepeatSection.find(childComponent.options.tagName);

						// if we didn't find a matching custom tag for the child component, then it's possible it could be contained
						// in a special tag that must be used in order to appear within <select> <table> <ul> or <ol> elements
						if (childTarget.length === 0) {
							var possibleAltMatches = cloneRepeatSection.find("tbody, tr, td, li, option");

							possibleAltMatches.each(function(i, elmt) {
								var jqElmt = $(elmt);
								if (jqElmt.attr("is") === childComponent.options.tagName) {
									childTarget = jqElmt;

									// remove the is attribute as an indicator that the component has been populated
									childTarget.removeAttr("is");

									// break out of the each loop
									return false;
								}
							});

						}

						// only render the child component if we've found exactly one target to insert to
						// 	( if this component was only partially refreshed, then we may not need to re-render all child components -- invoking .render()
						//	would actually cause this.jqDom on the child component to update leading to problems)
						if (childTarget.length === 1) {

							var renderResult = childComponent._renderWithChildren();

							insertedChildren.push({
								comp:childComponent
								,elmt:renderResult.elmt
							});

							insertedChildren.push.apply(insertedChildren, renderResult.insertedChildren);

							childTarget.replaceWith(renderResult.elmt);

						// else if there are multiple tags in the rendered component that match this child component's tag, then we need to throw an error
						// if there are duplicate tags in the repeatable section that match this child component, then it's impossible to know which one is the right one
						// to insert the child component
						} else if (childTarget.length > 1) {
							throw new Error("Nimbly::_insertChildren() cannot continue. Found multiple <"+childComponent.options.tagName+"> tags. A repeatable section must not contain duplicate child tags.");
						}

					}

					// add the fully rendered content of this iteration of the repeatable section to the array we're using to keep track of all of them
					sectionContent.push(cloneRepeatSection.contents());

				}

				// insert the fully rendered repeatable section into the component DOM
				if (repeatSection.attr("is") === sectionName) {
					repeatSection.html("");
					// remove the is attribute as an indicator that the repeatable section has been populated
					repeatSection.removeAttr("is");
					repeatSection.append(sectionContent);
				} else {
					repeatSection.replaceWith(sectionContent);
				}

			// else if we found more than one tag that matches the repeatable section, that's a problem. you should never have a template
			// that has two repeatable sections with the same tag name because we wouldn't know which one is the right place to populate the repeatable section
			} else if (repeatSection.length > 1) {
				throw new Error("Nimbly::_insertChildren() cannot continue. Found multiple <"+sectionName+"> tags. A repeatable section must have one insertion target (i.e., one matching custom tag).");
			}

		}

		var i = this.childComponents["default"].length;
		while (i--) {
			var insertTarget = jqDom.find(this.childComponents["default"][i].options.tagName);
			if (insertTarget.length === 1) {

				var renderResult = this.childComponents["default"][i]._renderWithChildren();

				insertedChildren.push({
					comp:this.childComponents["default"][i]
					,elmt:renderResult.elmt
				});

				insertedChildren.push.apply(insertedChildren, renderResult.insertedChildren);

				insertTarget.replaceWith(renderResult.elmt);
			} else if (insertTarget.length > 1) {
				throw new Error("Nimbly::_insertChildren() cannot continue. Found multiple <"+this.childComponents["default"][i].options.tagName+"> tags. A child component must match exactly one tag in the parent component. If you require instances of the same child component, use a repeatable section or provide each instance a unique tag name via the options.");
			}
		};

		return insertedChildren;
	};

	/*	Method: this.refresh
			Public refresh method that is invoked when we want to manually refresh the component.
	*/
	constructor.prototype.refresh = function() {
		var self = this;
		this.pendingRefresh = true;
		this._refreshList = true;
		queueRefresh({"instanceId": self._baseClassInstance,"refresh":function() { self._refresh();}});
	};

	/*	Method: this._refresh
			This method is invoked when we want to re-render part or all of the component.
	*/
	constructor.prototype._refresh = function() {

		var self = this;

		// if the component hasn't been initialized yet, then we ignore any refresh requests. a component
		// cannot be rendered until it has been initialized so therefore there's nothing to refresh yet.
		// we also cannot perform a refresh if this._delayRefresh is set to true -- implies that there are pending data
		// requests that need to complete before we can do any updating
		if (this.initialized == true && this._delayRefresh == false) {

			if (this.jqDom === null) {
				this.render();
			} else {

				// if a selector was provided, then we don't need to refresh the whole component, only a portion of it
				if (typeof this._refreshList == "object" && this._refreshList.length > 0) {

					// remove any duplicate selectors
					this._refreshList = this._refreshList.filter(function(item, pos) {
						return self._refreshList.indexOf(item) == pos;
					});

					// determine if any of the selectors in the refreshList contain other selectors (we can skip the inner selectors beacuse the parent is getting updated anyway)
					if (this._refreshList.length > 1) {
						var a = this._refreshList.length;
						while (a--) {
							
							var jqCurr = this.jqDom.find(this._refreshList[a]);
							
							// verify that we were able to find a matching target for the insertion target (uiBinding)
							// if we did not find a target, then that means the uiBinding doesn't match anything in the 
							// component which indicates a *possible* misconfiguration
							if (jqCurr.length === 0) {
								console.warn("Did not find a match for the selector '"+this._refreshList[a]+"'. Please review the uiBindings for class '"+this.className+"'.");
								continue;
							}
							
							var domCurr = jqCurr[0];

							var b = this._refreshList.length;
							while (b--) {
								if (a !== b) {
									var jqCheck = this.jqDom.find(this._refreshList[b]);
									
									// if the selector didn't find a match in the current component DOM, then we continue to 
									// avoid throwing an error below (we've already thrown a warning above)
									if (jqCheck.length === 0) continue;
									
									var domCheck = jqCheck[0];
									if (domCheck.contains(domCurr)) {
										this._refreshList.splice(a,1);
										break;
									}
								}
							};
						}
					}

					var renderResult = this._renderWithChildren();
					var jqNewComponent = renderResult.elmt;
					var insertedChildren = renderResult.insertedChildren;
					// the render method will set this.jqDom to whatever was rendered last, so we need to set it back to the old page since we're not refreshing the whole page
					var i = this._refreshList.length;
					while (i--) {

						var jqOld = this.jqDom.find(this._refreshList[i]);
						var jqNew = jqNewComponent.find(this._refreshList[i]);

						// selectors should uniquely identify the element to be replaced,
						// if there are multiple targets, the .replaceWith won't work properly so we need to throw an error
						if (jqOld.length > 1 || jqNew.length > 1) {
							throw new Error("Nimbly::refresh() cannot continue. Refresh selector has multiple targets.");
						} else {
							jqOld.replaceWith(jqNew);
						}
					}

					// insert (if any) child components that have been registered to this component
					var i = insertedChildren.length;
					while (i--) {
						if (this.jqDom[0].contains(insertedChildren[i].elmt[0])) {
							insertedChildren[i].comp.jqDom = insertedChildren[i].elmt;
						}
					}

					// component has been refreshed, so we can reset the pending list of refresh changes
					this._refreshList = [];

				// else if this._refreshList has been set to true (boolean) we must refresh the entire component
				} else if (this._refreshList == true) {

					var jqOldComponent = this.jqDom;
					var jqNewComponent = this.render();
					jqOldComponent.replaceWith(jqNewComponent);

					// component has been refreshed, so we can reset the pending list of refresh changes
					this._refreshList = [];

					// invoke the lifecycle method informing the component rendering has just refreshed
					if (typeof this._postRefresh === "function") this._postRefresh(true, jqOldComponent);
					
					// _postRefresh was renamed to _afterRefresh on 10/21/2018 -- _postRefresh is deprecated and will eventually be removed
					if (typeof this._afterRefresh === "function") this._afterRefresh(true, jqOldComponent);
					
					if (typeof this._afterInDocument === "function") monitoredInsertion.push(this);
					
					// check if this component has any child components (or nested child components) with the _afterInDocument lifecycle method defined
					this.eachChildComponent(function(childComponent) {
						if (typeof childComponent._afterInDocument === "function" && monitoredInsertion.indexOf(childComponent) === -1) {
							monitoredInsertion.push(childComponent);
						}
					}, true);

				}

				// since we've just refreshed our component, it's possible that our component could have instantiated
				// new child components in its .render() method. if that has happened, then we need to see if those components
				// are now part of our component's DOM or if they are just sitting orphaned in the virtual DOM. If they are orphaned
				// and not in use, then we need to clean them up. that's what we do here. we execute it on a delayed settimeout so the clean-up
				// does not block the UI and extend the amount of time before the page updates are displayed
  			 	this._cleanUpChildren = Math.floor(Math.random() * 1000000000);
				var cleanUpTime = this._cleanUpChildren;
				setTimeout(function() {
					// only execute the last setTimeout clean-ups, prevent multiple successive clean ups triggered by rapid refreshes
					if (cleanUpTime == self._cleanUpChildren) {
						self.eachChildComponent(function(childComponent, sectionName, removeChild) {
							// if the child component wasn't rendered or if it was rendered but is no longer contained within the parent component
							// then we need to destroy it to reduce memory usage
							if (childComponent.jqDom === null || !self.jqDom[0].contains(childComponent.jqDom[0])) {
								removeChild();
							}
						});
					}
				},500);
			}
		}
	};

	/*	Method: this.eachChildComponent(handler)
			This method is resposible for invoking a callback function for each child component registered on this component.
		Parameters:
			handler - function, accepts three parameters: 1. the current section name (string), 2. the child component (object) and 3. a callback method to remove the child component (function)
			includeNested - boolean, optional, if set to true then we will iterate over both the nested child *and* any children of those children recursively
	*/
	constructor.prototype.eachChildComponent = function(handler, includeNested) {
		var self = this;
		for (var sectionName in this.childComponents) {
			var a = this.childComponents[sectionName].length;
			while (a--) {
				
				if (sectionName === "default") {
					
					// if we've included nested child components in this lookup (as opposed to only the top-level immediate child components),
					// then we must invoke eachChildComponent recursively for all nested child components.
					if (includeNested === true) {
						this.childComponents[sectionName][a].eachChildComponent(handler, includeNested);
					}
					
					handler(this.childComponents[sectionName][a], sectionName, function(destroyComp) {
						
						// by default, we destroy the component when it is removed. destroyComp can be set to false when you just want to unregister the component
						if (destroyComp === true || typeof destroyComp === "undefined") self.childComponents[sectionName][a].destroy();
						self.childComponents[sectionName].splice(a, 1);
					});
				} else {
					var b = this.childComponents[sectionName][a].length;
					while (b--) {
						
						// if we've included nested child components in this lookup (as opposed to only the top-level immediate child components),
						// then we must invoke eachChildComponent recursively for all nested child components.
						if (includeNested === true) {
							this.childComponents[sectionName][a][b].eachChildComponent(handler, includeNested);
						}
						
						handler(this.childComponents[sectionName][a][b], sectionName, function(destroyComp) {
							// by default, we destroy the component when it is removed. destroyComp can be set to false when you just want to unregister the component
							if (destroyComp === true || typeof destroyComp === "undefined") self.childComponents[sectionName][a][b].destroy();
							self.childComponents[sectionName][a].splice(b, 1);
							if (self.childComponents[sectionName][a].length === 0) self.childComponents[sectionName].splice(a, 1);
							if (self.childComponents[sectionName].length === 0) delete self.childComponents[sectionName];
						});
					}
				}
			}
		}
	};

	/*	Method: this.registerChild
			When a component nests other components within it, we refer to the original component as the "parent component" and
			the nested component(s) as "child component(s)". In order for refreshes of the parent component to work properly,
			we must register the child components on the parent component. This will allow our ._refresh() method
			to intelligently determine if it is necessary to re-render the child component(s) when an update occurs to the parent component.
		Parameters:
			childComponent - required, either a single child component instance or an array of child components. If the latter, then the sectionName is also required.
			sectionName - optional, specifies the tag name of the repeatable section that a set of child components should be added to.
	*/
	constructor.prototype.registerChild = function(childComponent, sectionName) {
		
		// verify that the childComponent is a valid component
		if (childComponent instanceof Array) {
			var i = childComponent.length;
			while (i--) {
				if (isValidComponent(childComponent[i]) === false) {
					throw new Error("Nimbly cannot register this component. It is not a valid Nimbly component.");
				}
			};
		} else {
			if (isValidComponent(childComponent) === false) {
				throw new Error("Nimbly cannot register this component. It is not a valid Nimbly component.");
			}
		}

		// if a section name was not specified (meaning that the child component does not belong to a repeatable section
		// then we simply assign the component to the default section
		if (typeof sectionName === "undefined") {
				sectionName = "default";

		// else the user is passing in one or more components that will populate a single list item in a repeatable section
		// therefore we must enforce that components be supplied in an array.
		} else {
			if (!(childComponent instanceof Array)) {
				throw new Error("When registering child components in a repeatable section, the child components must be registered in an array with each registration representing one repetition of the section (e.g., this.registerChild([childA, childB], 'section-name');).");
			}
		}
		if (typeof this.childComponents[sectionName] === "undefined") this.childComponents[sectionName] = [];

		// if the child component has not already been registered, then register it
		if (this.childComponents[sectionName].indexOf(childComponent) === -1) {
			this.childComponents[sectionName].push(childComponent);
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

		var self = this;
	
		// invoke the 'destroy' lifecycle method on the class if one has been defined
		if (typeof this._destroy === "function") this._destroy();
	
		// destroy the child components -- we've just destroyed the parent component so we don't need to track the child components any longer
		this.eachChildComponent(function(childComponent, sectionName) {
			childComponent.destroy();
		});
		

		// Remove our data proxy from the ObservableSlim singleton. No further modifications to this.data will refreshes or fetches.
		ObservableSlim.remove(this.data);

		// if our component has been rendered, then remove it from the DOM (if it's even still in the DOM)
		if (this.jqDom !== null) {
			this.jqDom.remove();
			this.jqDom = null;
		}
		

		// null out all object references to help release memory, but do so only after the component has settled in order
		// to avoid generating errors if, for example, ajax requests haven't returned yet
		var maxWait = 20;
		var clearCheck = setInterval(function() {
			maxWait--;
			if (self.isReady() || maxWait === 0) {
				self.childComponents = null;
				self.data = null;
				self._data = null;
				self.templates = null;
				self._uiBindings = null;
				self._dataBindings = null;
				self.initList = null;
				self.showLoadMask = null;
				self.hideLoadMask = null;
				self._refreshList = null;
				clearInterval(clearCheck);
			}
		}, 1000);


	};

	/*	Method: this.isReady
			This method is used to determine if the component is both initialized and no longer procesing any display updates or fetch methods (e.g., ajax requests).

		Returns:
			Boolean - true if the component is initliazed and no longer processing any fetch methods or display updates.

	*/
	constructor.prototype.isReady = function() {
		var allChildrenReady = true;
		this.eachChildComponent(function(childComponent, sectionName) {
			if (childComponent.isReady() === false) allChildrenReady = false;
		});
		
		var noPendingRefreshes = (this._refreshList === null || this._refreshList.length === 0);
		var noPendingFetches = (this._pendingFetchCount === null || this._pendingFetchCount === 0);
		var noPendingInit = (this._pendingInit === false);
		
		return (allChildrenReady === true && noPendingRefreshes && noPendingFetches && noPendingInit);
	};

	return constructor;

};

if (typeof module === "undefined") {
	window["Nimbly"] = Nimbly($,Mustache,ObservableSlim,MutationObserver,HTMLElement, document);
} else {
	module.exports = function($,Mustache,ObservableSlim,MutationObserver,HTMLElement, document) {
		return Nimbly($,Mustache,ObservableSlim,MutationObserver,HTMLElement, document);
	};
}