# :surfer: Nimbly 

[![Build Status](https://travis-ci.org/ElliotNB/nimbly.svg?branch=master)](https://travis-ci.org/ElliotNB/nimbly) [![Coverage Status](https://coveralls.io/repos/github/ElliotNB/nimbly/badge.svg?branch=master)](https://coveralls.io/github/ElliotNB/nimbly?branch=master)

https://github.com/elliotnb/nimbly

Version 0.1.1

Licensed under the MIT license:

http://www.opensource.org/licenses/MIT

## Quick Start

**Want to learn how to use Nimbly as quickly as possible? Follow this [quick start guide](https://github.com/ElliotNB/nimbly/blob/master/quick-start.md)!**

The README below is best used as a reference manual. Beginners should first consult the quick start guide.

## Overview

### What is Nimbly?

Nimbly is a JavaScript component framework for single page applications.

### Why yet another JS framework?

Modern web application development is run amok with excessive tooling and [leaky abstractions](https://www.joelonsoftware.com/2002/11/11/the-law-of-leaky-abstractions/). Babel, Webpack, JSX, virtual DOM, source maps, etc -- it's all unnecessarily complicated.  As the 2018 [npm developer survey](https://medium.com/npm-inc/this-year-in-javascript-2018-in-review-and-npms-predictions-for-2019-3a3d7e5298ef) concluded: 

> JavaScript in 2018 is somewhat notorious for requiring a lot of tooling to get going, which is quite a reversal from the situation in 2014... True to that, all of our survey respondents would like to see less tooling, less configuration required to get started, and better documentation of the tools that do exist.

The goal of Nimbly is to keep things simple.

### What makes Nimbly different?

* **Fewer abstractions** - Nimbly embraces the native DOM. It does not use a virtual DOM abstraction. Nimbly components render plain HTMLElements.
* **No build steps** - The code you write runs in the browser. Nimbly does not require transpiling (e.g., Babel) nor a build process (e.g., Webpack).
* **No DSLs** - Write code with plain HTML, CSS and JavaScript. You don't need to learn another domain specific language (e.g., React JSX).
* **Easy to debug** - Fewer abstractions, no DSLs and ES5 support without transpiling means that Nimbly components are easy to debug. Short stack traces and a minimum of framework-specific error sleuthing.
* **"Plays nice"** - Nimbly is self-contained and does not take over the page. Nimbly is perfectly happy existing alongside other non-Nimbly components.

The technical objectives of Nimbly are:

* Encourage adoption of SPA best practices:
	* Templating.
    * One-way data binding.
    * Intuitive and consistent state management.
    * Elimination of explicit DOM manipulations.
	* Loosely coupled modular components.
* Encourage expressive and easy-to-follow code:
	* Reduce boilerplate code.
	* Components follow a common structure and organization.
	* Easily identifiable state mutations.
	* Clear linking of state to display.
	* Common public methods and lifecycle hooks for all components.	
* Provide easy-to-use patterns for:
	* Dependency injection.
    * Automated unit testing.
* Coordinate DOM updates amongst all components to minimize page re-draws, optimize performance and improve the user experience.

## Requirements

Nimbly requires the following libraries:

* **[jQuery 1.9.0+](https://github.com/jquery/jquery)**
* **[ObservableSlim 0.1.5+](https://github.com/ElliotNB/observable-slim)**

### Why jQuery?

Nimbly started out as a project to facilitate easier refactors of jQuery-heavy web apps. 

For the time being, Nimbly requires jQuery. But fret not, components built with Nimbly *are not* required to use jQuery. 

Nimbly uses jQuery primarily for:
- Merging deeply nested objects via `$.extend`.
- Updating DOM nodes via `$.replaceWith`.
- Creation of new DOM elements `$("<div>hello world</div>");`

Eventually, this functionality will be bundled directly into Nimbly and jQuery will be retired.

Including jQuery v3.3.1 minified slim adds 69KB to the total footprint of the framework.

## Install

```html
<script src="observable-slim.min.js"></script>
<script src="jquery.min.js"></script>
<script src="nimbly.min.js"></script>
```

Also available via NPM:

```
$ npm install nimbly --save
```

## Parameters

The Nimbly constructor accepts four parameters:

1. **`className`** - String, required, the name of the component class (e.g., HelloWorld) that extends Nimbly. The class name is used for producing helpful debug messages when errors occur within Nimbly.

2. **`defaults`** - Object, required, a variety of default options and preferences. See below for a definition of each configurable setting.

3. **`data`** - Object, optional, a plain object that sets the initial state values (overwrites the default state defined in `defaults`).

4. **`options`** - Object, optional, overrides the `defaults` by merging over the top of it.


## Properties

All Nimbly components have the following public properties:

1. **`options`** - Object, the component default settings with any user-defined options merged over the top.

2. **`className`** - String, the name of the class that initialized the base class. We store this value for debugging and logging purposes.

3. **`domNode`** - the DOM Node rendered by this component.

4. **`jqDom`** - jQuery reference to `this.domNode`.

5. **`initialized`** - Boolean, set to true when the this.init() method has completed and the component is ready to render.

6. **`childComponents`** - Hash, if a component registers (via `.registerChild`) other components, then those child components will be added to the hash. Child components are indexed on the hash according to what list or repeatable section they belong to. If a component is not part of a list, then that component is added to `this.childComponents.default`.

7. **`templates`** - Hash, where the key is the name of the template and the value is a string containing the template. The hash contains each template used by the component. The template element identifiers are passed in via options.templates and below we will populate this.templates with the content of the template.

8. **`loadingTemplate`** - String, template content OR an element identifier of the template used to display a loading spinner or loading message. The loadingTemplate is utilized only if the .render() method is invoked before the component has been initialized. It allows the component to return a rendered DomNode that will be subsequently updated as soon as initialization completes.

9. **`data`** - ES6 Proxy, serves as a proxy to the component state data (this._data) and enables the component to observe any changes that occur to the data. All modifications to component data should be made through this property.

## Base Class Methods

These methods are implemented by the Nimbly base class and are available on all components that extend Nimbly:

### Public

All Nimbly components have the following public methods:

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
	
6. **`eachChildComponent`** - This method will iterate over each component that has been registered as a child of the current component. This method accepts one parameter, a callback function. That callback function invoked upon each interation of `eachChildComponent`. The callback function is passed three parameters: 1. a reference to the child component instance, 2. the template section the component belongs to, and 3. a method that when invoked will unregister and destroy the child component.
	* *Parameters:* 
		* `handler` - function, required, accepts three parameters: 1. the current section name (string), 2. the child component (object) and 3. a callback method to remove the child component (function)

### Protected

JavaScript does not support protected methods, but the following methods are **intended** to be used as protected methods. They should not be invoked externally, but they may be invoked within component class that extends the `Nimbly` base class.
	
1. **`registerChild(childComponent, sectionName)`** - When a component nests other components within it, we refer to the original component as the "parent component" and
	the nested component(s) as "child component(s)". In order for refreshes of the parent component to work properly,
	we must register the child components on the parent component. This will allow our ._refresh() method
	to intelligently determine if it is necessary to re-render the child component(s) when an update occurs to the parent component.

	This method is overloaded. It has two modes of operation depending on what arguments are passed in.

	**First mode - register single stand-alone component:**

	* *Parameters:*
		childComponents - required, a single Nimbly child component instance.
		targetName - required, a CSS selector that uniquely identifies the component in the parent component's template. For example, the tag `<foobar></foobar>` could be uniquely identified with the CSS selector `foobar`. Additionally, `<foobar field="test"></foobar>` could be uniquely identified with the selector `foobar[field=test]`.
		
	**Second mode - register multiple components to a repeatable section:**

	* *Parameters:*
		childComponents - required, an array of objects with the following structure:
		
		```
			[
				{
					"comp":child1,
					"tagName":"child-comp-one"
				}, 
				{
					"comp":child2,
					"tagName":"child-comp-two[attr=testing]"
				}    
			]
		```
		targetName - required, a CSS selector that uniquely identifies the repeatable section tag that the child components will be inserted into.

When using the second mode, `registerChild` should be invoked for each iteration of the repeatable section.

2. **`parseHTML(strHTML)`** - Utility method intended to assist components with the process of converting HTML into an HTMLElement that the components can then bind event handlers to.
	* *Parameters:*
		* `strHTML` - A string of HTML that should be converted into an HTMLElement. Should only have one top-level element (e.g., `<div>one</div><div>two</div>` is not allowed).
		
	* *Returns:* HTMLElement.

3. **`addTemplate(templateName, templateHtml)`** - Templates are typically defined statically in the component config. This method allows us to add more templates during runtime.
	* *Parameters:*
		* `templateName` - string, required, a descriptive alphanumeric for the template, dashes and underscores allowed (e.g., my_template_name).
		* `templateHtml` - string, required, the HTML content of the template.
		
	* *Returns:* HTMLElement.

4. **`getTemplateComponents(templateName)`** - Utility method that will fetch a breakdown of all the child components defined in a given template.
	* *Parameters:*
		* `templateName` - string, required, the name of the template that should be evaluated. The template should already be defined (or registered at runtime via this.addTemplate) on the component (i.e., present on this.templates).
		
	* *Returns:* Array of objects -- array contains a breakdown of all child components defined in the template as well as any attribute values defined in the template.
	
## Component Methods

The following methods are implemented by Nimbly components.

1. **`_render`** - Required, every component must have a `_render` method. The `_render` method is prefixed with an underscore denoting that it is private and should not be invoked externally. The `_render` method is the only place where the UI for the component is generated. No other portion of the component is allowed to modify the UI or make any manual DOM manipulations. The single `_render` method provides non-author devs a single place to inspect when they want to understand the display logic of a component or figure out why a component looks the way it does
	* *Parameters:* None.
	* *Returns:* jQuery-referenced DocumentFragment with bound event handlers ready for insertion into the main DOM.

2. **`_renderLoading()`** Sometimes loading displays require more logic than a simple HTML blurb can provide. In cases where the `loadingTemplate` alone is insufficient, you may define `_renderLoading` on your component that will be invoked when it comes time to render and display the loading screen.
	* *Returns:* jQuery-referenced DocumentFragment, the component ready to be inserted into the main DOM.
	
3. **`_fetch*(resolve, reject)`** Optional, the `dataBindings` and `initList` in the settings both contain references to `_fetch*` methods. Fetch methods retrieve data from external sources via ajax and update values stored on `this.data`. They are treated as `Promise`s in that they accept `resolve` and `reject` functions as parameters.
	* *Parameters:*
		* `resolve` - Function, required, invoked if the `_fetch*` method is successful in retrieving data and updating `this.data`.
		* `reject` - Function, required, invoked if the `_fetch*` method is unsuccessful in retrieving data and updating `this.data`.
		* `changes` - Array of objects, optional, if the `_fetch*` method is invoked as a result of a `dataBinding` a copy of the changes that triggered the `dataBinding` is passed along via this parameter.
	* *Returns:* Nothing.
	
4. **`showLoadMask()`** - Executed when we need to display a loading mask over the component. Loading masks are displayed when we fetch data that must be retrieved before the UI can refresh.
	* *Parameters:* None.
	* *Returns:* Nothing.

5. **`hideLoadMask()`** - Executed when we need to hide the loading mask over the component.
	* *Parameters:* None.
	* *Returns:* Nothing.

### Lifecycle Hooks

Components have a lifecycle that is managed by Nimbly. Nimbly offers lifecycle hooks that provide visibility into key life moments and the ability to act when they occur.

The implementation of lifecycle hooks is optional.

1. **`_init()`** - this method is invoked immediately after the component has initialized (i.e., after the methods defined in `this.initList` have completed).

2. **`_afterRender()`** - invoked immediately after the child components are inserted into this component. Passes in a reference to the just rendered component.
	* *Parameters:*
		* `jqDom` - a jQuery-referenced DocumentFragment of the just rendered component.

3. **`_afterRefresh()`** - invoked immediately after the display of a component is refreshed.
	* *Parameters:*
		* `fullRefresh` - boolean, set to true if the entire component was refreshed, set to false is the refresh only affected part of the component.
		* `jqOldDom` - jQuery-referenced DocumentFragment of the component's previous display state.
		
4. **`_afterInDocument()`** - invoked immediately after the component is inserted into the document for the first time. Re-invoked after every full refresh of the component, but not a partial refresh. Useful for performing manipulations that must be done in the visible `document`, such as drawing `<canvas>` elements or conditionally sizing elements with JavaScript.

5. **`_destroy()`** - invoked immediately before a component is destroyed. A place to perform any component-specific clean-up procedures and avoid memory leaks.

 	
## Settings

The `defaults` and `options` parameters are the two most significant parameters passed into the Nimbly constructor. Together they dictate how the component initializes itself, how the UI should update in response to data changes, what actions to take after data changes occur, what templates the component should use, etc.

`defaults` is a plain JavaScript object that is the same for each component class that extends Nimbly -- it does not change per instance of the component. `options` however can change per instance of the component. `options` is intended to allow users the ability to customize the behavior or display of a component for a particular use case. When `options` is supplied to the `Nimbly` constructor function, `options` simply merges on top of (overwrites) the settings stored in `defaults`.

The full list of component settings is as follows:

1. **`tagName`** - String, required, if this component is registered as a child of another component, then the `tagName` defines what custom tag in the template will include this component (e.g., `tagName:"hello-world" == <hello-world></hello-world>`).

2. **`templates`** - Object, required, a set of name value pairs -- the name being the template name and the value being a string (or template litereal) containing the template (typically a Mustache template). 

	For ES5 support (e.g., IE11, no support for template literals) , `templates` may also be an Array of element IDs pointing to `<script>` tags on the document whose innerHTML contains the template.

	Example:
	
	```javascript
	templates:{
			t4m_tpl_cm_temp_page:`
				<div data-role="page" data-theme="b" class="t4m-cm-generic-loading-page" location_hash="{{location_hash}}">
					<div class="t4m-cm-spinner-container">
							<i class="fa fa-asterisk fa-spin fa-5x fa-fw"></i>
					</div>
				</div>
			`
			,t4m_tpl_cm_handoff_page_new:`
				<div>
					Hello {{first_name}}, this is the home page.
				</div>
			`
	}
	```
	
	ES5 example:
	```javascript
	templates:["t4m_tpl_cm_temp_page","t4m_tpl_cm_handoff_page_new"]
	```

3. **`loadingTemplate`** - String, optional, if this component needs to display a loading message or a loading spinner, specify that template here.

4. **`initList`** - Array, optional, list of "fetch" methods (defined on the component, see below for details) that should be invoked in order to initialize the components. 

	Each item of `initList` is an object containing two properties: `method` and `preventRender`. `method` is a string that refers to which method on the component should be invoked and `preventRender` is a boolean which when set to true will prevent the component from rendering until the initialization method has resolved (the loading template will be displayed until then).

	Example:

	```javascript
	initList:[
		{"method":"_fetchUserOrgDetails","preventRender":true},
		{"method":"_fetchProviderInfo","preventRender":true}
	]
	```
	
	The methods defined in the `initList` (as well as for the `dataBindings` below) should accept two parameters `resolve` and `reject` which should be invoked as appropriate when the method is complete.

5. **`uiBindings`** - Object, optional, key value pairs that define what changes to `this.data` should trigger what portions of the component to update. The key is a string or regular expression that defines which part of `this.data` should be observed for changes. The value is either an array or boolean. If set to true, then the whole component will refresh. If set to an array, then the portions of the component that match the CSS selectors in the array will be refreshed. In the example below, a change to `this.data.new_issue.show` would trigger refresh of `<div class="t4m_issuetracker_issue_list_header"></div>` and `<div class="t4m_issuetracker_issue_list_footer"></div>`, but the rest of the component would remain unchanged. 

	Example:

	```javascript
	uiBindings:{
		"/issuelist.*selected/": [".t4m_issuetracker_issue_list_expanded_row"]
		,"issuelist":true
		,"new_issue.show": [".t4m_issuetracker_issue_list_header",".t4m_issuetracker_issue_list_footer"]
	}
	```

	**Note:** `uiBindings` do not take effect until the component has initialized (i.e., when `this.initialized === true`). This prevents `this.data` modifications in the constructor from triggering UI refreshes.

6. **`dataBindings`** - Object, optional, key value pairs that define what data `fetch` methods should be invoked when specified data changes occur. Follows the same logic as `uiBindings` above, except that instead of specifying portions of the component to refresh, the value specifies which methods should be invoked and whether or not we should delay refreshing the component until the fetch method returns. 

	Example:

	```javascript
	dataBindings:{
		"categoryId":{"delayRefresh": true,"methods": ["_fetchIssueList", "_fetchStatSummary"]}
		,"/^filters/":{"delayRefresh": false,"methods": ["_applyFilters"]}
		,"filters.issue_open_closed":{"delayRefresh": false,"methods": ["_fetchIssueList", "_fetchStatSummary"]}
		,"/quick_filters/":{"delayRefresh": true,"methods": ["_fetchIssueList", "_fetchStatSummary"]}
		,"new_issue.save_issue":{"delayRefresh": false,"methods": ["_fetchIssueList", "_fetchStatSummary"]}
	}
	```
	
	As above with the methods used in the `initList`, each method that is paired with a dataBinding should accept two parameters `resolve` and `reject` which are callback methods that should be invoked as appropriate when the method completes.

	**Note:** `dataBindings` do not take effect until the component has initialized (i.e., when `this.initialized === true`). This prevents `this.data` modifications in the constructor from triggering data retrievals.

7. **`data`** - Object, required, this is the default data passed into the component. often times this data is just null because it must first be populated by the _fetch* methods defined in the `initList` above. 

	Example:

	```javascript
	data:{
		"user_name":""
		,"person_id":3453456
		,"patient_name":null
		,"birth_date":null
		,"admit_date":null
	}
	```

8. **`delayInit`** - Boolean, optional, defaults to true. If true, then we do not fire off the _fetch* methods defined in the initList automatically when the component is initialized -- we would have do it manually at a later time using the this.init() method.

9. **`renderjQuery`** - Boolean, optional, defaults to false. Only set this to true if your component's `._render` method and `._renderLoading` methods return a jQuery-referenced HTMLElement (i.e., `return $("<div>Hello world</div>");`).
	
## Usage

### Sample Component

Please see the [sample folder](sample/) for examples of components built with Nimbly.

### Registering Child Components

If your component renders and inserts other components within itself, then those child components must be explicitly registered. Typically the registration of child components is done directly in the `_render` method or `_init` method.

Example:

```javascript
// instantiate an instance of the issue list component
var issueList = new ITIssueList(this.data);

// register the issue list as a child of this component
this.registerChild(this.issueList);
```

Registering a child component will enable Nimbly to handle component refreshes without ballooning memory usage and avoid unnecessary child component re-renders.

## IE11 Notes

### Proxy polyfill restrictions

Nimbly relies on the Observable Slim library to observe changes to `this.data` and trigger `uiBindings` and `dataBindings`. The Observable Slim library in turn relies on ES6 `Proxy` to perform those observations. ES6 `Proxy` is supported by Chrome 49+, Edge 12+, Firefox 18+, Opera 36+ and Safari 10+, but it is not supported by IE11.

For IE11, the `Proxy` polyfill must be used. However, the polyfill does have limitations, notably:

1. Object properties must be known at creation time. New properties cannot be added later.
2. Modifications to .length cannot be observed.
3. Array re-sizing via a .length modification cannot be observed.
4. Property deletions (e.g., delete proxy.property;) cannot be observed.

**This means that if you intend to support IE11, you must:**
1. Declare all properties on `this.data` at the time of initialization. New properties on `this.data` cannot be observed.
2. Do not use `uiBindings` or `dataBindings` that rely a property being deleted (e.g., `delete this.data.some_property`).

### Bypassing the Proxy for reads

IE11 performs considerably worse than other modern browsers when iterating through very large nested objects. The performance degradation is only exacerbated with the `Proxy` polyfill, because `Proxy` intercepts both modifying object properties and reading object properties.

In order to keep IE11 performing well with very large nested objects, it can be beneficial to bypass the `this.data` proxy and access the original data object `this._data` directly. **However, take care to do so only when reading values -- all data modifications still must be done through `this.data` else they will not be observed** and will not trigger the appropriate `uiBinding`s or `dataBinding`s.
