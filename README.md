# TXMBase - Component base class

Proposed base class for TransformativeMed web components. The objectives of the base class are as follows:

* Provide a common structure and organization for child components to follow.
* Reduce repetitive 'boiler plate' code contained in the child components.
* Encourage adoption of best practices and functionality of modern JS development and frameworks:
    * Templating
    * One-way data binding
    * State management
    * Elimination of explicit DOM manipulations
    * Dependency injection (to-do)
    * Unit testing intergation (to-do)
* Reduce level of effort required by non-author devs to understand and maintain components.
* Allow for easy re-factors of the legacy jQuery-heavy TransformativeMed code base.

## Requirements

TXMBase requires the following libraries:

* **[jQuery 1.9.0+](https://github.com/jquery/jquery)**
* **[ObservableSlim 0.0.1+](https://github.com/ElliotNB/observable-slim)**

While not explicitly required by the TXMBase, **[Mustache.js](https://github.com/janl/mustache.js/)** is typically used by all TransformativeMed components.

## Sample Usage

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
// declare a sample component
var HelloWorld = (function() {

	// declare the default definition for this component
	var defaults = {
		// what templates will this component use
		"templates":["t4m_template_1"]
    
		// if this component needs to display a loading message or a loading spinner, specify that template here
		,"loadingTemplate":null
    
		// what _fetch* methods do we need to execute when this component is instantiated?
		,"initList":[
    		{
      			"method":"_fetchPatient"
        		,"preventRender":true
      		}
       	]
    
		// define what changes to this.data.* should trigger what portions of the component to update.
		// in the example below, a change to this.data.user_name would trigger a refresh 
		// of <div class="hello_user_container">...</div>
		,"uiBindings":{
				"user_name":[".hello_user_container"]
        		,"patient_name":[".patient_data_container"]
        		,"admit_date":[".patient_data_container"]
       	 		,"birth_date":[".patient_data_container"]
		}
    
		// define what changes to this.data.* should trigger what _fetch* methods. when the _fetch* method(s)
		// return, they will store new data on this.data which could trigger UI updates if there's a matching
		// uiBinding entry above. delay_refresh:true tells the framework that we don't want to update the UI
		// while one or more fetch methods are still in progress. this prevents UI updates from triggering in rapid
		// succession if multiple _fetch* methods are invoked
		,"dataBindings":{
			"person_id":{
      			"delay_refresh":true	
				,"methods":["_fetchNewPatient"]
			} 
		}
		
		// this is the default data passed into the component. often times this data is just null because it
		// must first be populated by the _fetch* methods defined in the initList above.
		,"data":{
			"user_name":""
      		,"person_id":3453456
      		,"patient_name":null
     		,"birth_date":null
      		,"admit_date":null
		}
    
		// if set to true, then we do not fire off the _fetch* methods defined in the initList automatically
		// when the component is initialized -- we would have do it manually at a later time using the this.init() method.
		,"delayInit":false
	};

	var constructor = function(data, options) {
  
		if (typeof data == "undefined") var data = {};
		if (typeof options == "undefined") var options = {};

        // invoke the base class constructor
		TXMBase.call(this,"T4MHelloWorld", defaults, data, options);
		
	};
	
	// extend this class with the base class
	constructor.prototype = Object.create(TXMBase.prototype);
	constructor.prototype.constructor = constructor;
	
	// the render method is the only place where the UI for the component is generated. no other portion
	// of the component is allowed to modify the display or make any manual DOM manipulations. this gives
	// non-author devs a single place to inspect when they want to understand the display logic and figure
	// out why a component looks the way it does
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