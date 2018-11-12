$(document).ready(function() {
	let data = {"user_id":3333};
	helloWorld = new HelloWorld(data);
	
	let jqDom = helloWorld.render();
	
	$("body").append(jqDom);
});