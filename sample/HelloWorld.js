var HelloWorld = function($,Mustache,TXMBase,PersonData) {

	const defaults = {
		"tagName":"hello-world"
		,"templates":{
			"t4m_template_1":`
				<div>
					<p class="hello_user_container">
						{{^have_name}}Hello world!{{/have_name}}
						{{#have_name}}Hello <b>{{user_name}}</b>!{{/have_name}}
					</p>
					<p>
						Set your name:
						<input type="text" value="" class="user_name_text"> <small>this.data.user_name = $(this).val();</small>
					</p>
					<person-data></person-data>
					<p>START</p>
					<repeat-person-data>
						<person-data>
					</repeat-person-data>
					<p>END</p>
					<p>
						<input type="button" value="Change patient name" class="patient_name_change_btn"> <small>this.data.patient_name = 'Bobby Smith';</small> <br><br>
						<input type="button" value="Switch patient" class="load_next_patient_btn"> <small>this.data.person_id = 5555555;</small>
					</p>
					<p class="throw_error_dupe"></p>
					<p class="throw_error_dupe"></p>
				</div>
			`
		}
		,"loadingTemplate":`<div>Loading...</div>`
		,"initList":[{"method":"_fetchPatient","preventRender":true}]
		,"uiBindings":{
			"user_name":[".hello_user_container"]
			,"dummy_field":[".throw_error_dupe"]
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
			,"dummy_field":"foobar"
		}
		,"delayInit":false
	};

	class componentClass extends TXMBase {
		
		constructor(data, options) {
			super("HelloWorld", defaults, data || {}, options || {});
		};
	
		_render() {
			
			var self = this;
			
			var personData = new PersonData(this.data,null);
			this.registerChild(personData);
			
			var i = 4;
			while (i--) {
				var temp = new PersonData(this.data,null);
				this.registerChild([temp], "repeat-person-data");
			}
			
			var tplData = {
				"have_name":(this.data.user_name.length > 0 ? true : false)
				,"user_name":this.data.user_name
				,"patient_name":this.data.patient_name
				,"birth_date":this.data.birth_date
				,"admit_date":this.data.admit_date
			};

			var jqDom = $(Mustache.render(this.templates["t4m_template_1"], tplData));

			jqDom.find(".user_name_text").on("keyup", function() {
				self.data.user_name = $.trim($(this).val());
			});

			jqDom.find(".patient_name_change_btn").on("click", function() {
				self.data.patient_name = "Bobby Smith";
			});

			jqDom.find(".load_next_patient_btn").on("click", function() {
				self.data.person_id = 5555555;
			});
				
			return jqDom;
		
		};
	  
		_fetchPatient(resolve, reject) {
			var self = this;
			setTimeout(function() {
				var response = {"patient_name":"Charlie Smith","birth_date":"August 9th, 1987","admit_date":"January 1st, 2018"};
				self.data.patient_name = response.patient_name;
				self.data.birth_date = response.birth_date;
				self.data.admit_date = response.admit_date;
				resolve();
			},500);
		};
	  

		_fetchNewPatient(resolve, reject) {

			var self = this;
			setTimeout(function() {
				var response = {"patient_name":"Larry Anderson","birth_date":"October 13th, 1985","admit_date":"January 2nd, 2018"};
				self.data.patient_name = response.patient_name;
				self.data.birth_date = response.birth_date;
				self.data.admit_date = response.admit_date;
				resolve();
			},500);

		};
	
	};
	
	return componentClass;

};

if (typeof module === "undefined") {
	window["HelloWorld"] = HelloWorld($,Mustache,TXMBase,PersonData);
} else {
	module.exports = function($,Mustache,TXMBase,PersonData) {
		return HelloWorld($,Mustache,TXMBase,PersonData);
	};
}