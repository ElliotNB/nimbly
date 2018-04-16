if (typeof module === "undefined") {
	window["HelloWorld"] = HelloWorld($,Mustache,TXMBase);
} else {
	module.exports = function($,Mustache,TXMBase) {
		return HelloWorld($,Mustache,TXMBase);
	};
}
var HelloWorld = function($,Mustache,TXMBase) {

	var defaults = {
		"templates":["t4m_template_1"]
		,"loadingTemplate":null
		,"initList":[
    		{
      			"method":"_fetchPatient"
        		,"preventRender":true
      		}
		]
		,"uiBindings":{
			"user_name":[".hello_user_container"]
			,"patient_name":[".patient_data_container"]
			,"admit_date":[".patient_data_container"]
			,"birth_date":[".patient_data_container"]
		}
		,"dataBindings":{
			"person_id":{
      			"delay_refresh":true	
				,"methods":["_fetchNewPatient"]
			} 
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
			url:'https://jsfiddle.net/echo/js/?js={"patient_name":"Charlie Smith","birth_date":"August 9th, 1987","admit_date":"January 1st, 2018"}',
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
			url:'https://jsfiddle.net/echo/js/?js={"patient_name":"Larry Anderson","birth_date":"October 13th, 1985","admit_date":"January 2nd, 2018"}',
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

};