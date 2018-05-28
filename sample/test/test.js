var expect = require('chai').expect;
var jsdom = require('jsdom').JSDOM;
var fs = require('fs');
var Mustache = require('mustache');
var ObservableSlim = require('observable-slim');
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

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

describe('HelloWorld component test suite.', function() {
	
	// web components might take a bit longer to render if ajax replies are slow
	// extend the default timeout from 2 seconds to 5 seconds
	this.timeout(5000);

	// create a fake DOM using jsdom and the templates provided by the component
	var htmlHelloWorld = fs.readFileSync('./sample/templates.html').toString();
	var window = (new jsdom(htmlHelloWorld)).window;
	global.document = window.document;
	
	// initialize jquery with the fake DOM we've created
	var $ = require('jquery')(window);
	
	// apply adjustments to jquery so that ajax requests work in a node environment
	$.support.cors = true;
	$.ajaxSettings.xhr = function() {
		return new XMLHttpRequest();
	};
	
	// initialize the base class and our components with all required dependencies
	var TXMBase = require("../../txmbase.js")($,Mustache,ObservableSlim,Object);
	var PersonData = require("../PersonData.js")($,Mustache,TXMBase);
	var HelloWorld = require("../HelloWorld.js")($,Mustache,TXMBase,PersonData);
	var helloWorld;
	
	// before each test we instantiate the component and allow it to finish rendering before starting the tests
	beforeEach(async () => { 
		helloWorld = new HelloWorld();
		helloWorld.render();
		await whenReady(helloWorld);
	});
	
	// verify that the HelloWorld component rendered with the correct title
	it('Initial title reads "Hello world".', () => {	
		var initialMessage = $.trim(helloWorld.jqDom.find(".hello_user_container").html());
		expect(initialMessage).to.equal("Hello world!");
	});
	
	// simulate a button click on 'Change patient name' and verify that the patient name changes
	it('Click button, change patient name to "Bobby Smith".', async () => {

		helloWorld.jqDom.find(".patient_name_change_btn").click();
		
		// wait until the component has finished re-rendering
		await whenReady(helloWorld);
		
		// verify that the patient name has been updated in the component data and in the display
		var namePresent = helloWorld.jqDom.find(".patient_data_container").html().indexOf("Bobby Smith");
		expect(namePresent).to.be.above(-1)
		expect(helloWorld._data.patient_name).to.equal("Bobby Smith");

	});
	
	// simulate a button click on 'Switch patient' and verify that the patient is updated
	it ('Click button, switch to patient "Larry Anderson".', async () => {
	
		helloWorld.jqDom.find(".load_next_patient_btn").click();
		
		await whenReady(helloWorld);
		var namePresent = helloWorld.jqDom.find(".patient_data_container").html().indexOf("Larry Anderson");
		expect(namePresent).to.be.above(-1);
		expect(helloWorld._data.patient_name).to.equal("Larry Anderson");
	
	});
});