## Quick Start Guide

Want to learn how to use Nimbly in 10 minutes or less? Follow this quick start guide:

1. Copy the `sample` folder to a web accessible directory.
2. Open `sample/index.html` in a web browser.
3. Open `sample/hello-world.js`, `sample/hello-world-list.js` and `sample/hello-world-list-item.js` in your IDE.

The sample project is a simple hello world app containing a list of names.

The file `sample/hello-world.js` contains the top-level component (`HelloWorld`).

The file `sample/hello-world-list.js` contains the child component (`HelloWorldList`) used by `HelloWorld`.

The file `sample/hello-world-list-item.js` contains another child component (`HelloWorldListItem`) which is used by `HelloWorldList`.

There are four key concepts to understanding Nimbly components:

1. Component state is stored on `this.data`. Modifications to `this.data` (e.g., `this.data.user_id = 123456;`) are observed by Nimbly.

2. Component UI updates are controlled by the `uiBindings` specified in the component config.
  - A `uiBinding` is a pairing of a **match string** and an **update definition**.
  - The **match string** defines what state mutation triggers the `uiBinding`.
  - The **update definition**, using CSS selectors, defines what portions of the component UI should be updated. 
  - For example, a mutation of `this.data.user_name` would trigger the uiBinding: `user_name: [".t4m-username-title"]` and would only portion of the component matching the `.t4m-username-title` CSS selector.
  - If the update definition is set to `true`, the entire component is refreshed. For example: `user_name: true`.

3. State mutations (i.e., modifying `this.data`) may also be configured to trigger methods on the component class. These are called `dataBindings` and they are also specified in the component config.
  - The following `dataBinding` will invoke the `_fetchUser` method whenever `this.data.user_id` is modified: `user_id:{ delayRefresh:false, methods:["_fetchUser"] }`.
  - In the above example, `delayRefresh:false` informs Nimbly that it may refresh the UI while the method is processing.
  - The methods defined in `dataBindings` must accept two parameters: `resolve` and `reject`. Either `resolve` or `reject` must be invoked upon the completion of the method.
  
4. Nimbly components extend the `Nimbly` class.
	- The constructor for Nimbly components is typically structured as `constructor(data, options)`.
	- The Nimbly super constructor must be invoked in the following manner: `super("ComponentClassName", defaults, data || {}, options || {});`
	- `defaults` refers to the static component definition (see `const defaults` defined in the samle components above).
	- `data` allows you to overwrite the default state defined by `const defaults`.
	- `options` allows you to runtime override any default behavior defined in the component config (e.g., `const defaults`).


To build a Nimbly component, follow these steps:

1. Name the class for your component (e.g., `HelloWorld`) and encapsulate it with a dependency injection wrapper. The wrapper function argument list should contain all dependencies required by the component:

As per `sample/hello-world.js`:

```javascript
const HelloWorld = function($,Mustache,Nimbly,HelloWorldList) {

    // component code will go here

}

``` 

This `HelloWorld` component requires jQuery, Mustache, Nimbly and the child component `HelloWorldList`.

2. Inside the dependency injection wrapper, define your component config (see `const defaults` in `samples/hello-world.js` for a sample config).
  - Define your component template on your component config (e.g., `const defaults`).
  - Use `uiBindings` to define which  parts of the component UI should update when component state modifications occur (i.e., `this.data.user_id = 123456;`).

3. Beneath your component config, declare your class and extend the `Nimbly` class:

```javascript
class componentClass extends Nimbly {

}
```

4. Create the `constructor` function for your component. Nimbly components typically accept `data` and `options` as consructor arguments.

5. Inside your `constructor` function, invoke the `super` constructor for Nimbly.

Your `class` and `constructor` should look something like this:

```javascript
class componentClass extends Nimbly {

		constructor(data, options) {
			super("HelloWorld", defaults, data || {}, options || {});			
		};
		
}
```
  
6. Define a `_render` method that returns a jQuery-referenced `HTMLElement` (e.g., `return $(Mustache.render(this.templates["t4m_tpl_cm_hello_world"], templateData));`).

7. Run it in a web browser!