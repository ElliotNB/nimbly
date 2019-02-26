var expect = require('chai').expect;
var should = require('chai').should();
var jsdom = require('jsdom').JSDOM;
var fs = require('fs');
var Mustache = require('mustache');
var ObservableSlim = require('observable-slim');
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var MutationObserver = require('./mock-mutation-observer.js');

// the Promise returned by this function will resolve when the component is not initliaziing,
// does not have any UI updates pending and is not waiting for any fetch (data retrieval) methods to return.
// In other words, the Promise only returns once the component is in an idle state and is ready for evaluation
var whenReady = function(component) {
	return new Promise((resolve) => {
		 var checkRefreshed = setInterval(() => {
			if (component.isReady()) { clearInterval(checkRefreshed);resolve(); }
		}, 50);
	});
};


describe('HelloWorld ES5 component test suite.', function() {
	
	// web components might take a bit longer to render if ajax replies are slow
	// extend the default timeout from 2 seconds to 5 seconds
	this.timeout(5000);

	// create a fake DOM using jsdom
	var window = (new jsdom(fs.readFileSync("./test/index.es5.html"))).window;
	global.document = window.document;

	// initialize jquery with the fake DOM we've created
	var $ = require('jquery')(window);

	// apply adjustments to jquery so that ajax requests work in a node environment
	$.support.cors = true;
	$.ajaxSettings.xhr = function() { return new XMLHttpRequest(); };

	// initialize the base class and our components with all required dependencies
	var Nimbly = require("../../nimbly.js")($,ObservableSlim,MutationObserver,Object, window.document);
	
	var PersonData = require("../PersonData.es5.js")($,Mustache,Nimbly);
	var HelloWorld = require("../HelloWorld.es5.js")($,Mustache,Nimbly,PersonData);
	var helloWorld = new HelloWorld();
	helloWorld.render();
	
	var observedChanges = false;
	helloWorld.observe(function(changes) {
		observedChanges = true;
	});
	
	beforeEach(async () => {
		await whenReady(helloWorld);
	});
	
	it('Five instances of PersonData child component are rendered and inserted.', () => {
		expect(helloWorld.jqDom.find(".patient_data_container").length).to.equal(5);
	});
	
	// verify that the HelloWorld component rendered with the correct title
	it('Initial title reads "Hello world".', () => {
		var initialMessage = $.trim(helloWorld.jqDom.find(".hello_user_container").html());
		expect(initialMessage).to.equal("Hello world!");
	});

	it('"Charlie Smith" is the first person displayed.', () => {
		var charliePresent = helloWorld.jqDom.find(".patient_data_container").html().indexOf("Charlie Smith");
		expect(charliePresent).to.be.above(-1);
		expect(helloWorld._data.patient_name).to.equal("Charlie Smith");
	});

	it('Set a new user name.', async () => {
		var jqUserNameTextBox = helloWorld.jqDom.find(".user_name_text");
		jqUserNameTextBox.val("Elliot").keyup();

		await helloWorld.isReady();

		expect(helloWorld._data.user_name).to.equal("Elliot");
		expect(jqUserNameTextBox.val()).to.equal("Elliot");
	});
	
	it('Observe changes on a component.', () => {
		expect(observedChanges).to.equal(true);
	});
	
	it('Re-render manually.', () => {
		var jqDom = helloWorld.render();
		expect(jqDom.find(".patient_data_container").length).to.equal(5);
	});
	
});

describe('HelloWorld component test suite.', function() {

	// web components might take a bit longer to render if ajax replies are slow
	// extend the default timeout from 2 seconds to 5 seconds
	this.timeout(5000);

	// create a fake DOM using jsdom
	var window = (new jsdom("<!DOCTYPE html><head></head><body></body></html>")).window;
	global.document = window.document;

	// initialize jquery with the fake DOM we've created
	var $ = require('jquery')(window);

	// apply adjustments to jquery so that ajax requests work in a node environment
	$.support.cors = true;
	$.ajaxSettings.xhr = function() { return new XMLHttpRequest(); };

	// initialize the base class and our components with all required dependencies
	var Nimbly = require("../../nimbly.js")($,ObservableSlim,MutationObserver,Object, window.document);
	var GrandChildComp = require("../GrandChildComp.js")($,Mustache,Nimbly);
	var PersonData = require("../PersonData.js")($,Mustache,Nimbly);
	var ListItemComp = require("../ListItemComp.js")($,Mustache,Nimbly,GrandChildComp);
	var BadComponent = require("../BadComponent.js")($,Mustache,Nimbly);
	var AnotherBadComponent = require("../AnotherBadComponent.js")($,Mustache,Nimbly);
	var EmptyLoadingTpl = require("../EmptyLoadingTpl.js")($,Mustache,Nimbly);
	var NonExistBindingMethod = require("../NonExistBindingMethod.js")($,Mustache,Nimbly);
	var HelloWorld = require("../HelloWorld.js")($,Mustache,Nimbly,PersonData,ListItemComp);
	var helloWorld = new HelloWorld();
	$("body").append(helloWorld.render());

	
	// before each test we instantiate the component and allow it to finish rendering before starting the tests
	beforeEach(async () => {
		await whenReady(helloWorld);
	});

	it('Five instances of PersonData child component are rendered and inserted.', () => {
		expect(helloWorld.jqDom.find(".patient_data_container").length).to.equal(5);
	});

	it('Four instances of ListItemComp child component are rendered and inserted.', () => {
		expect(helloWorld.jqDom.find(".list-item-test").length).to.equal(4);
	});
	
	it('Simulated  _afterInDocument handler.', (done) => {		
		setTimeout(() => {
			expect(helloWorld.data.in_document).to.equal(true);
			done();
		}, 300);
	});

	// verify that the HelloWorld component rendered with the correct title
	it('Initial title reads "Hello world".', () => {
		var initialMessage = $.trim(helloWorld.jqDom.find(".hello_user_container").text());
		expect(initialMessage).to.equal("Hello world!");
	});

	it('"Charlie Smith" is the first person displayed.', () => {
		var charliePresent = helloWorld.jqDom.find(".patient_data_container").html().indexOf("Charlie Smith");
		expect(charliePresent).to.be.above(-1);
		expect(helloWorld._data.patient_name).to.equal("Charlie Smith");
	});
	
	it('Verify that grand child components (child of a child) show up correctly.', () => {
		var grandChildPresent = helloWorld.jqDom.find(".list-item-test").html().indexOf("grand child component");
		expect(grandChildPresent).to.be.above(-1);
	});

	it('Set a new user name.', async () => {
		var jqUserNameTextBox = helloWorld.jqDom.find(".user_name_text");
		jqUserNameTextBox.val("Elliot").keyup();

		await helloWorld.isReady();

		expect(helloWorld._data.user_name).to.equal("Elliot");
		expect(jqUserNameTextBox.val()).to.equal("Elliot");
	});

	it('Verify that the list items in <repeat-list></repeat-list> remain at a count of four.', () => {
		var listItemsCount = helloWorld.jqDom.find(".list-item-test").length;

		expect(listItemsCount).to.equal(4);
	});

	// simulate a button click on 'Change patient name' and verify that the patient name changes
	it('Click button, change patient name to "Bobby Smith".', async () => {

		helloWorld.jqDom.find(".patient_name_change_btn").click();

		// wait until the component has finished re-rendering
		await whenReady(helloWorld);

		// verify that the patient name has been updated in the component data and in the display
		var bobbyPresent = helloWorld.jqDom.find(".patient_data_container").html().indexOf("Bobby Smith");
		var charliePresent = helloWorld.jqDom.find(".patient_data_container").html().indexOf("Charlie Smith");
		expect(bobbyPresent).to.be.above(-1);
		expect(charliePresent).to.equal(-1);
		expect(helloWorld._data.patient_name).to.equal("Bobby Smith");


	});

	// simulate a button click on 'Switch patient' and verify that the patient is updated
	it('Click button, switch to patient "Larry Anderson".', async () => {

		helloWorld.jqDom.find(".load_next_patient_btn").click();

		await whenReady(helloWorld);
		var namePresent = helloWorld.jqDom.find(".patient_data_container").html().indexOf("Larry Anderson");
		expect(namePresent).to.be.above(-1);
		expect(helloWorld._data.patient_name).to.equal("Larry Anderson");

	});

	// verify that we're performing garbage clean-up on old components correctly
	it('Number of registered child components should not increase after a refresh.', () => {

		expect(helloWorld.childComponents["default"].length).to.equal(1);
		expect(helloWorld.childComponents["repeat-person-data"].length).to.equal(4);

	});

	it('A refresh selector with multiple targets should throw an error.', () => {

		helloWorld.data.dummy_field = "hello";
		expect(function() {
			helloWorld._refresh();
		}).to.throw();
		helloWorld._refreshList = [];

	});

	it('Event handlers in repeatable sections still work after a refresh of that section.', async () => {
		// click the 'add item' button to add another list item
		helloWorld.jqDom.find(".add_list_item").click();

		await whenReady(helloWorld);

		var listItemCount = helloWorld.jqDom.find(".list-item-test").length;

		// there should now be 5 items in the list
		expect(listItemCount).to.equal(5);

		$(helloWorld.jqDom.find(".list-item-test")[0]).click();

		expect(helloWorld.data.dummy_field_2).to.equal("foobar test");

	});

	it('Trigger a manual refresh.', async() => {

		helloWorld.refresh();
		whenReady(helloWorld);
		expect(helloWorld.jqDom.find(".hello_user_container").length).to.equal(1);

	});
	
	it('Destroy a component.', (done) => {
		helloWorld.destroy();

		// during component destruction, the compoent is immediately removed from the DOM
		expect($(global.document).find(".hello_user_container").length).to.equal(0);
		
		// but the properties aren't nulled out until later, when isReady returns true (checked via setInterval @ 1 second iteration)
		setTimeout(function() {
			should.not.exist(helloWorld.childComponents);
			done();
		},2000);

	});

	it('Improper object returned by _render method should throw an error.', () => {
		var badComponent = new BadComponent();
		expect(function() {
			badComponent.render();
		}).to.throw();
	});
	
	it('Data change triggers fetch method whose response triggers a data change and a refresh.', async() => {
		var personComp = new PersonData();
		await whenReady(personComp);
		personComp.data.chained_request = true;
		await whenReady(personComp);
		expect(personComp.data.chained_update).to.equal(true);
	});
	
	it('Registering an non-Nimbly component as child should throw an error.', () => {
		var notAComponent = {};
		expect(function() {
			helloWorld.registerChild(notAComponent);
		}).to.throw();
	});
	
	it('Modifying this.data while rendering should throw an error.', () => {
		var anotherBadComponent = new AnotherBadComponent();
		expect(function() {
			anotherBadComponent.render();
		}).to.throw();
	});
	
	it('A component with an empty string for a loading template should throw an error.', () => {
		expect(function() {
			var emptyLoadingTpl = new EmptyLoadingTpl();
		}).to.throw();
	});
	
	it('A component with an non-existent method defined in a data binding should throw an error.', () => {
		expect(function() {
			var nonExist = new NonExistBindingMethod();
		}).to.throw();
	});
	
	

});
