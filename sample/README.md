# :surfer: Nimbly 

[![Build Status](https://travis-ci.org/ElliotNB/nimbly.svg?branch=master)](https://travis-ci.org/ElliotNB/nimbly) [![Coverage Status](https://coveralls.io/repos/github/ElliotNB/nimbly/badge.svg?branch=master)](https://coveralls.io/github/ElliotNB/nimbly?branch=master)

The see a working example of components built with Nimbly, open `sample/index.html` in a web browser.

The sample project is very simple, but it demonstrates the most important functionality, including:

- Initializing a component with `initList`.
- Linking state changes (i.e., `this.data` mutations) to UI updates via `uiBindings`.
- Linking state changes to class methods via `dataBindings`.
- Initializing and registering child components.
- Registering child component in a repeatable section (e.g., a list).
- State mutation on a child component triggers `dataBinding` and `uiBinding` on parent component.


For a live working example of a stand-alone component built with Nimbly (i.e., no child components), please visit the **[Hello World component jsFiddle](https://jsfiddle.net/rh74dj6f/)**.