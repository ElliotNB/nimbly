[![Build Status](https://travis-ci.com/TransformativeMed/txmbase.svg?token=YHpZnkxTeYHnDBM645Y8&branch=master)](https://travis-ci.com/TransformativeMed/txmbase)

# Overview

TXMBase is the proposed base class for TransformativeMed web components. The objectives of TXMBase are as follows:

* Provide a common structure and organization for child components to follow.
* Reduce repetitive 'boiler plate' code contained in the child components.
* Encourage adoption of best practices and functionality of modern JS development and frameworks:
    * Templating.
    * One-way data binding.
    * State management.
    * Elimination of explicit DOM manipulations.
    * Dependency injection.
    * Automated unit testing.
* Reduce effort level for non-author devs to understand and maintain components.
* Allow for easy re-factors of the jQuery-heavy TransformativeMed legacy code base.
* Coordinate refreshes amongst all components on the page to minimize re-draws and improve the user experience.

# Requirements

TXMBase requires the following libraries:

* **[jQuery 1.9.0+](https://github.com/jquery/jquery)**
* **[Mustache.js 2.0.0+](https://github.com/janl/mustache.js)**
* **[ObservableSlim 0.0.2+](https://github.com/ElliotNB/observable-slim)**

# Parameters

The TXMBase constructor accepts four parameters, they are:

1. **`className`** - String, required, the name of the child component class (e.g., HelloWorld) that instantiated the base class. This is useful for debugging when the error occurs inside the base class. Logging the className will tell you which class instantiated the base class and generated the error.

2. **`defaults`** - Object, required, a variety of default options and preferences. See below for a definition of each configurable setting.

3. **`data`** - Object, required, this is a plain JavaScript object that contains all the data required by the component to render itself. For IE11 (ES5) compatibility, all properties must be defined at the time of initialization even if they are assigned null values (see IE11 notes below for details). Even when IE11 is not a requirement, defining all properties at the time of initialization is recommended -- it provides other developers a blueprint of what data your component will use and/or track.

4. **`options`** - Object, optional, overrides the defaults by merging on top of it.


# Properties

All TXMBase components have the following public properties:

1. **`options`** - Object, the component default settings with any used-defined options merged over the top.

2. **`className`** - String, the name of the class that initialized the base class. We store this value for debugging and logging purposes.

3. **`baseClassInstance`** - Integer, counts the number of times the base class has been initialized. Useful for debugging, identifying unique instances.

4. **`jqDom`** - jQuery-referenced DOM Node rendered by this component.

5. **`initialized`** - Boolean, set to true when the this.init() method has completed and the component is ready to render.

6. **`childComponents`** - Array, if the .render() method initializes and registers (via `.registerChild`) other components, then those child components will be added to this array.

7. **`templates`** - Hash, where the key is the name of the template and the value is a string containing the template.The hash contains each template used by the component. The template element identifiers are passed in via options.templates and below we will populate this.templates with the content of the template.

8. **`loadingTemplate`** - String, element identifier of the template used to display a loading spinner or loading message. The loadingTemplate is utilized only if the .render() method is invoked before the component has been initialized. It allows the component to return a rendered DomNode that will be subsequently updated as soon as initialization completes.

9. **`data`** - ES6 Proxy, serves as a proxy to the component model data (this._data) and enables the component to observe any changes that occur to the data. All modifications to component data should be made through this property.

# Methods

## Public

All TXMBase components have the following public methods:

1. **`observe(fnChanges)`** - Allows external entities to observe changes that occur on the this.data property.
	* *Parameters:*
		* `fnChanges` - a function that is invoked with with a single argument whenever 'var data' is modified. The single argument will have the following format: `[{"type":"add","target":{"blah":42},"property":"blah","newValue":42,"currentPath":"testing.blah"}]`
	* *Returns:* ES6 Proxy.

2. **`init()`** - Runs any initialization procedures (stored on this.options.initList or defined in the defaults) required before the component renders for the first time. Typically this means retrieving data from external APIs.
	* *Parameters:* None.
	* *Returns:* Nothing.
	
3. **`render()`** - Renders and returns the component. The render method will first verify that the component has been initialized, if it has not been initialized, then it will invoke `this.init()`. If the initialization is already in progress, then it will return a temporary 'loading' display. If the component has already been initialized, then the standard render method `this._render()` is invoked.
	* *Parameters:* None.
	* *Returns:* jQuery-referenced DocumentFragment, the component ready to be inserted into the main DOM.
	
4. **`refresh()`** - This method is invoked when we want to re-render the component.
	* *Parameters:* None.
	* *Returns:* Nothing.

5. **`destroy()`** - This method will remove this.jqDom from the DOM and delete the observable that was created during initialization. If the component initialized any child components, then those will be destroyed as well. This helps ensure that memory usage does not balloon after repeated refreshes and UI updates.
	* *Parameters:* None.
	* *Returns:* Nothing.

## Protected

JavaScript does not support protected methods, but the following methods are **intended** to be used as protected methods. They should not be invoked externally, but they may be invoked within component class that extends the `TXMBase` base class.
	
1. **`registerChild(childComponent)`** - When a component nests other components within it, we refer to the original component as the "parent component" and the nested component(s) as "child component(s)". In order for refreshes of the parent component to work properly, we must register the child components on the parent component. This will allow our .refresh() method to intelligently determine if it is necessary to re-render the child component(s) when an update occurs to the parent component.
	* *Parameters:*
		* `childComponent` - an instance of a component that extends this base class (TXMBase).
	* *Returns:* Nothing.

2. **`showLoadMask()`** - Executed when we need to display a loading mask over the component. Loading masks are displayed when we fetch data that must be retrieved before the UI can refresh. Defined via `defaults` or `options`.
	* *Parameters:* None.
	* *Returns:* Nothing.

3. **`hideLoadMask()`** - Executed when we need to hide the loading mask over the component. Defined via `defaults` or `options`.
	* *Parameters:* None.
	* *Returns:* Nothing.

# Settings

The `defaults` and `options` parameters are the two most significant parameters passed into the TXMBase constructor. Together they dictate how the component initializes itself, how the UI should update in response to data changes, what actions to take after data changes occur, what templates the component should use, etc.

`defaults` is a plain JavaScript object that is the same for each component class that extends TXMBase -- it does not change per instance of the component. `options` however can change per instance of the component. `options` is intended to allow users the ability to customize the behavior or display of a component for a particular use case. When `options` is supplied to the `TXMBase` constructor function, `options` simply merges on top of (overwrites) the settings stored in `defaults`.

The full list of component settings is as follows:

1. **`templates`** - Array, required, what templates the component will use identified by their `<script>` tag element ID.

2. **`loadingTemplate`** - String, optional, if this component needs to display a loading message or a loading spinner, specify that template here.

3. **`showLoadMask`** - Function, optional, executed when we need to display a loading mask over the component. Loading masks are typically displayed when we fetch data that must be retrieved before the UI can render.

4. **`hideLoadMask`** - Function, optional, executed when we need to hide the loading mask over the component.

5. **`initList`** - Array, optional, list of "fetch" methods (defined on the component, see below for details) that should be invoked in order to initialize the components. Example:

```javascript
[
	{"method":"_fetchUserOrgDetails","preventRender":true},
	{"method":"_fetchProviderInfo","preventRender":true}
]
```

6. **`uiBindings`** - Object, optional, key value pairs that define what changes to `this.data` should trigger what portions of the component to update. The key is a string or regular expression that defines which part of `this.data` should be observed for changes. The value is either an array or boolean. If set to true, then the whole component will refresh. If set to an array, then the portions of the component that match the CSS selectors in the array will be refreshed. In the example below, a change to `this.data.new_issue.show` would trigger refresh of `<div class="t4m_issuetracker_issue_list_header"></div>` and `<div class="t4m_issuetracker_issue_list_footer"></div>`, but the rest of the component would remain unchanged. Example:

```javascript
{
	"/issuelist.*selected/": [".t4m_issuetracker_issue_list_expanded_row"]
	,"issuelist":true
	,"new_issue.show": [".t4m_issuetracker_issue_list_header",".t4m_issuetracker_issue_list_footer"]
}
```

7. **`dataBindings`** - Object, optional, key value pairs that define what data `fetch` methods should be invoked when specified data changes occur. Follows the same logic as `uiBindings` above, except that instead of specifying portions of the component to refresh, the value specifies which `fetch` methods should be invoked and whether or not we should delay refreshing the component until the fetch method returns. Example:

```javascript
{
	"categoryId":{"delayRefresh": true,"methods": ["_fetchIssueList", "_fetchStatSummary"]}
	,"/^filters/":{"delayRefresh": false,"methods": ["_applyFilters"]}
	,"filters.issue_open_closed":{"delayRefresh": false,"methods": ["_fetchIssueList", "_fetchStatSummary"]}
	,"/quick_filters/":{"delayRefresh": true,"methods": ["_fetchIssueList", "_fetchStatSummary"]}
	,"new_issue.save_issue":{"delayRefresh": false,"methods": ["_fetchIssueList", "_fetchStatSummary"]}
}
```

8. **`data`** - Object, required, this is the default data passed into the component. often times this data is just null because it must first be populated by the _fetch* methods defined in the `initList` above. Example:

```javascript
{
	"user_name":""
	,"person_id":3453456
	,"patient_name":null
	,"birth_date":null
	,"admit_date":null
}
```

9. **`delayInit`** - Boolean, optional, if set to true, then we do not fire off the _fetch* methods defined in the initList automatically when the component is initialized -- we would have do it manually at a later time using the this.init() method.

# Component classes

`TXMBase` is a base class that cannot function by itself. It must be extended by component classes (child classes) in order to be useful.

Component classes have their own set of methods that interact with the base class. Those methods are:

1. **`_render`** - Required, every component must have a `_render` method. The `_render` method is prefixed with an underscore denoting that it is private and should not be invoked externally. The `_render` method is the only place where the UI for the component is generated. No other portion of the component is allowed to modify the UI or make any manual DOM manipulations. The single `_render` method provides non-author devs a single place to inspect when they want to understand the display logic of a component or figure out why a component looks the way it does
	* *Parameters:* None.
	* *Returns:* jQuery-referenced DocumentFragment with bound event handlers ready for insertion into the main DOM.
	
2. **`_init`** - Optional, this method is executed after the component initialization completes. It may contain any manner of custom logic or data processing. Typically the `_init` method is used as a good place to initialize and register child components (see below for details).
	* *Parameters:* None.
	* *Returns:* Nothing.

3. **`_fetch*(resolve, reject)`** Optional, the `dataBindings` and `initList` in the settings both contain references to `_fetch*` methods. Fetch methods retrieve data from external sources via ajax and update values stored on `this.data`. They are treated as `Promise`s in that they accept `resolve` and `reject` functions as parameters.
	* *Parameters:*
		* `resolve` - Function, required, invoked if the `_fetch*` method is successful in retrieving data and updating `this.data`.
		* `reject` - Function, required, invoked if the `_fetch*` method is unsuccessful in retrieving data and updating `this.data`.
	* *Returns:* Nothing.
	
# Usage

## Sample Component

To see a live working example of a component built with TXMBase, please visit the **[Hello World component jsFiddle](https://jsfiddle.net/qz55k4az/13/)**.

The code for the above jsFiddle is as follows:

**Template:**
```html
<script type="text/template" id="t4m_template_1">
<div>
	<p class="hello_user_container">
		{{^have_name}}Hello world!{{/have_name}}
    {{#have_name}}Hello <b>{{user_name}}</b>!{{/have_name}}
  </p>
  <p>
  	Set your name:
		<input type="text" value="" class="user_name_text"> <small>this.data.user_name = $(this).val();</small>
  </p>
  <p class="patient_data_container">
  	Now viewing: {{patient_name}} <br>
    Date of birth: {{birth_date}} <br>
    Date of admission: {{admit_date}}<br>
  </p>
	<p>
  	<input type="button" value="Change patient name" class="patient_name_change_btn"> <small>this.data.patient_name = 'Bobby Smith';</small> <br><br>
    <input type="button" value="Switch patient" class="load_next_patient_btn"> <small>this.data.person_id = 5555555;</small>
  </p>
</div>
</script>
```

**JavaScript:**
```javascript
var HelloWorld = (function() {

	var defaults = {
		"templates":["t4m_template_1"]
		,"loadingTemplate":null
		,"initList":[
    		{"method":"_fetchPatient","preventRender":true}
		]
		,"uiBindings":{
			"user_name":[".hello_user_container"]
			,"patient_name":[".patient_data_container"]
			,"admit_date":[".patient_data_container"]
			,"birth_date":[".patient_data_container"]
		}
		,"dataBindings":{
			"person_id":{"delay_refresh":true,"methods":["_fetchNewPatient"]} 
		}
		,"data":{
			"user_name":""
      		,"person_id":3453456
      		,"patient_name":null
     		,"birth_date":null
      		,"admit_date":null
		}
		,"delayInit":false
	};

	var constructor = function(data, options) {
  
		if (typeof data == "undefined") var data = {};
		if (typeof options == "undefined") var options = {};

        // invoke the base class constructor
		TXMBase.call(this,"HelloWorld", defaults, data, options);
		
	};
	
	// extend this class with the base class
	constructor.prototype = Object.create(TXMBase.prototype);
	constructor.prototype.constructor = constructor;

	constructor.prototype._render = function() {
		
		var self = this;
		
		var tplData = {
			"have_name":(this.data.user_name.length > 0 ? true : false)
			,"user_name":this.data.user_name
			,"patient_name":this.data.patient_name
			,"birth_date":this.data.birth_date
			,"admit_date":this.data.admit_date
		};

		// render using the first template defined by our component
		var jqDom = $(Mustache.render(this.templates["t4m_template_1"], tplData));
    
		// when the user types in their name, we update this.data.user_name which then
		// triggers a uiBinding to refresh the .hello_user_container div
		jqDom.find(".user_name_text").on("keyup", function() {
			self.data.user_name = $.trim($(this).val());
		});

		// when the user clicks this button, we change this.data.patient_name to "Bobby Smith"
		// which in turn triggers a uiBinding to refresh the .patient_data_container div
		jqDom.find(".patient_name_change_btn").on("click", function() {
			self.data.patient_name = "Bobby Smith";
		});

		// when the user clicks this button, we update this.data.person_id. unlike the two buttons above,
		// there is no uiBinding for this.data.person_id, but there is a dataBinding. The dataBinding for "person_id"
		// invokes the _fetchLarry method. THe _fetchNewPatient method fires off an XHR request that retrieves 
		// new patient data once that new patient data is stored on this.data it triggers a uiBinding 
		// which updates the display automatically
		jqDom.find(".load_next_patient_btn").on("click", function() {
			self.data.person_id = 5555555;
		});
			
		return jqDom;
    
	};
  
	// this is a fetch method retrives the data set for our imaginary Charlie patient. this is the first patient we load
	// because _fetchPatient is listed in the "initList" above so this fetch method gets executed when the component
	// is initialized. we're using the jsfiddle echo request -- it simply echos back the data in the URI
	constructor.prototype._fetchPatient = function(resolve, reject) {

		var self = this;

		$.ajax({
			url:'/echo/js/?js={"patient_name":"Charlie Smith","birth_date":"August 9th, 1987","admit_date":"January 1st, 2018"}',
			dataType:"json",
			success: function (response) {
			
				// at this point we've successfully retrieved the patient data. now we need to store the patient data
				// on the component by updating this.data. when we make these updates to this.data, it will trigger
				// uiBindings that will refresh the appropriate parts of the component with the patient info
				self.data.patient_name = response.patient_name;
				self.data.birth_date = response.birth_date;
				self.data.admit_date = response.admit_date;
				resolve();
			},
			error: function (error) {
				console.error(error);
				reject();
			}
		});

	};
  
	// this is a fetch method retrives the data set for our next patient, Larry. this method is invoked whenever
	// any change is made to this.data.person_id because of the dataBinding we've defined above. this XHR is just a
	// hard-coded example, but in reality a _fetch* method would use this.data.person_id to request the correct data
	// for whichever patient was just selected.
	constructor.prototype._fetchNewPatient = function(resolve, reject) {
		var self = this;
		$.ajax({
			url:'/echo/js/?js={"patient_name":"Larry Anderson","birth_date":"October 13th, 1985","admit_date":"January 2nd, 2018"}',
			dataType:"json",
			success: function (response) {
			
				// now that we've successfully retrieved the patient data, we need to store it on the component by
				// updating this.data. when we modify this.data it will trigger uiBindings to update the appropriate 
				// part of the DOM
				self.data.patient_name = response.patient_name;
				self.data.birth_date = response.birth_date;
				self.data.admit_date = response.admit_date;
				resolve();
			},
			error: function (error) {
				console.error(error);
				reject();
			}
		});

	};
	
	return constructor;

})();

// instantiate the component, accept the default config, not passing in any custom options
var test = new HelloWorld();

// render the component 
var rendered = test.render();

// insert the component to the page
$("body").append(rendered);
```

## Registering Child Components

If your component renders and inserts other components within itself, then those child components must be explicitly registered. Typically the registration of child components is done directly in the `_render` method or `_init` method.

Example:

```javascript
// instantiate an instance of the issue list component
var issueList = new ITIssueList(this.data);

// register the issue list as a child of this component
this.registerChild(this.issueList);
```

Registering a child component will enable TXMBase to handle component refreshes without ballooning memory usage and avoid unnecessary child component re-renders.

# IE11 Notes

## Proxy polyfill restrictions

TXMBase relies on the Observable Slim library to observe changes to `this.data` and trigger `uiBindings` and `dataBindings`. The Observable Slim library in turn relies on ES6 `Proxy` to perform those observations. ES6 `Proxy` is supported by Chrome 49+, Edge 12+, Firefox 18+, Opera 36+ and Safari 10+, but it is not supported by IE11.

For IE11, the `Proxy` polyfill must be used. However, the polyfill does have limitations, notably:

1. Object properties must be known at creation time. New properties cannot be added later.
2. Modifications to .length cannot be observed.
3. Array re-sizing via a .length modification cannot be observed.
4. Property deletions (e.g., delete proxy.property;) cannot be observed.

**This means that if you intend to support IE11, you must:**
1. Declare all properties on `this.data` at the time of initialization. New properties on `this.data` cannot be observed.
2. Do not use `uiBindings` or `dataBindings` that rely a property being deleted (e.g., `delete this.data.some_property`).

## Bypassing the Proxy for reads

IE11 performs considerably worse than other modern browsers when iterating through very large nested objects. The performance degradation is only exacerbated with the `Proxy` polyfill, because `Proxy` intercepts both modifying object properties and reading object properties.

In order to keep IE11 performing well with very large nested objects, it can be beneficial to bypass the `this.data` proxy and access the original data object `this._data` directly. **However, take care to do so only when reading values -- all data modifications still must be done through `this.data` else they will not be observed** and will not trigger the appropriate `uiBinding`s or `dataBinding`s.