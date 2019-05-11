## Quick Start Guide

**Want to learn how to use Nimbly in 10 minutes or less? Follow this quick start guide:**

1. Copy the `sample` folder to a web accessible directory.
2. Open `sample/index.html` in a web browser.
3. Open `sample/hello-world.js`, `sample/hello-world-list.js` and `sample/hello-world-list-item.js` in your IDE.

The sample project is a simple hello world app containing a list of names.

The file `sample/hello-world.js` contains the top-level component (`HelloWorld`).

The file `sample/hello-world-list.js` contains the child component (`HelloWorldList`) used by `HelloWorld`.

The file `sample/hello-world-list-item.js` contains another child component (`HelloWorldListItem`) which is used by `HelloWorldList`.

### Key concepts for Nimbly components

#### 1. Components maintain their own state.

Component state is stored on `this.data`. Mutations to `this.data` or any nested attributes (e.g., `this.data.users[3].user_id = 123456;`) are observed by Nimbly.

#### 2. Components must define what state mutations cause UI updates.

Unlike other JS frameworks, state mutations do not automatically refresh the component UI. You must define what state mutations cause the component to refresh. This definition is specified on the `uiBindings` property of the component config.

  - An individual `uiBinding` is the pairing of a **qualifier string** and one or more **CSS selectors**. Example: `user_name: [".t4m-username-title"]`.
  - The **qualifier string** defines what state mutation triggers the `uiBinding`.
  - The **CSS selectors** define what portions of the component UI should be updated. 
  - For example, a mutation of `this.data.user_name` would trigger the uiBinding `user_name: [".t4m-username-title"]` which would then refresh the portion of the component matching the `.t4m-username-title` CSS selector.
  - If the **CSS selectors** are set to `true`, then the entire component is refreshed. Example: `user_name: true`.

#### 3. Components may define handler methods for state mutation.

Similar to `uiBindings`, each component may have a definition of what methods should execute in response to a given state mutation. This definition is stored on the `dataBindings` property of the component config.

  - An individual `dataBinding` is the pairing of a **qualifier string** and one or more **method names**. Example: `user_id:{methods:["_fetchUser"] }`.
  - Just like `uiBindings`, the **qualifier string** defines what state mutation triggers the `dataBinding`.
  - The **method names** specify which component methods will be executed when the `dataBinding` is triggered.
  - For example, a mutation of `this.data.user_id` would trigger the dataBinding `user_id:{methods:["_fetchUser"] }` which would then invoke the `_fetchUser` method.
  - The methods are executed as Promises. As such, the methods defined in `dataBindings` must accept two parameters: `resolve` and `reject`. Either `resolve` or `reject` must be invoked upon the completion of the method.
  
#### 4. All components extend the `Nimbly` class.

  - The constructor for Nimbly components is typically structured as `constructor(data, options)`.
  - The Nimbly super constructor must be invoked in the following manner: `super("ComponentClassName", defaults, data || {}, options || {});`
  - `defaults` refers to the default component config (see `const defaults` defined in the sample components above).
  - `data` allows you to overwrite the default state defined by `defaults`.
  - `options` allows you to  override any default behavior defined by `defaults`.

### Build a Nimbly component

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
class componentClass extends Nimbly { }
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
