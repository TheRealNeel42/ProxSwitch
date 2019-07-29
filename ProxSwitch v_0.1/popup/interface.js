// Proxy class 
class ProxyObject {
	constructor(name, url){
		this.name = name;
		this.url = url;
	}

}

/*-----local object is created to make interfacing with the locatStorage API more convienient---*/
var local = (function(){

    var setData = function(key,obj){
        var values = JSON.stringify(obj);
        localStorage.setItem(key,values);
    }

    var getData = function(key){
        if(localStorage.getItem(key) != null){
        return localStorage.getItem(key);
        }else{
            return false;
        }
    }

    var updateData = function(key,newData){
        if(localStorage.getItem(key) != null){
            var oldData = JSON.parse(localStorage.getItem(key));
            for(keyObj in newData){
                oldData[keyObj] = newData[keyObj];
            }
            var values = JSON.stringify(oldData);
            localStorage.setItem(key,values);
        }else{
            return false;
        }
    }

    var removeData = function(key, dataIndex){
    	if(localStorage.getItem(key) != null){
    		var oldData = JSON.parse(localStorage.getItem(key));
        	oldData.splice(dataIndex, 1);
        	localStorage.removeItem(key);
        	local.set(key, oldData);
        	var newData = JSON.parse(localStorage.getItem(key));
        	console.log("Option removed!");
        	
        }else{
            return false;
        }
    }

    return {set:setData,get:getData,update:updateData, remove: removeData}
})();

/*--- data object is created to make manipulating Proxy list more convienient ---*/


var handleData = (function() {
	// loadProxyObject returns an object if it is found in localStorage, else it returns false
	/*!!!!! --- IMPORTANT: all data in local storage will be stored in ProxyList variable or Connected variable or ConnectedProxyIndex variable--- !!!!!!*/
	var loadProxiesObject = function(){

		var loadedStringFromStorage = local.get('ProxyList');

		if(loadedStringFromStorage != false)
		{
			var loadedObject = JSON.parse(loadedStringFromStorage);
			return loadedObject;	
		}
		else 
		{
			//if no ProxyList is stored create an empty array and push to localStorage
			var objectToReturn = new Array();
			local.set('ProxyList', objectToReturn);
			return objectToReturn;
		}
	}


	var saveNewProxy = function(newData){
		var loadedStringFromStorage = local.get('ProxyList');

		if(loadedStringFromStorage == false)
		{
			local.set('ProxyList', newData);	
		}
		else 
		{
			var loadedObject = JSON.parse(loadedStringFromStorage);
			loadedObject.push(newData);
			local.update('ProxyList', loadedObject);
		}
	
	}


	return {save:saveNewProxy, load:loadProxiesObject}

})();


/*---------------  LOAD HTML FUNCTION TO LOAD ALL HTML AND ALTER HTML -------------------------------*/

var loadHTML = (function() {

	var populateList = function() {
		var proxyArray = handleData.load();
		var count = 0;
		if(proxyArray != null)
		{
			if(proxyArray.length == 0)
			{
				$(".main").append("<div><p>Add proxies to continue...</p></div>");
			}
			else 
			{
				proxyArray.forEach(function (i) {
					var name = i.name;
					var url = i.url;
					$(".main").append("<div><label class='options'><input type='radio' name='radio' class='radio' value='" + count +  "' id='" + count +  "'><span class=''>" + name +":  " + url + "</span></label></div>");
					count++;
				})
			}
			if(local.get('Connected') == 'true')
			{
				var ConnectedProxyIndex;

				if(local.get('ConnectedProxyIndex') != null && local.get('ConnectedProxyIndex') != false)
				{
					ConnectedProxyIndex = local.get('ConnectedProxyIndex');
					console.log(typeof ConnectedProxyIndex);

					var hash = "#";
					var scrubbedString = ConnectedProxyIndex.replace(/"/g, '');
					var idVar = hash + scrubbedString;
					console.log(idVar);
					
					$(idVar).prop("checked", true);
					
				}
			}
		}
		else
		{
			return false;
		}
		
	}

	var clearList = function() {
		$(".main").empty();
	}

	return { populate: populateList, clear: clearList}

})();


//!!!!!!!!!!!!!!!! MAIN BODY CODE !!!!!!!!!!!!!!!!!!!!!!!!1

$(document).ready(function() {

	//Load List of Proxies first 
	loadHTML.populate();

	// Set Connected flag that sets a string called connected to true or false in local storage.
	// retrieves flag if present, if not it creates the flag and sets it to 'false'
	//Begin flag set
	var connected;
	if(local.get('Connected') != null){
		connected = local.get('Connected');
	}
	else
	{
		connected = false;
		local.set('Connected', connected);
	}

	if(connected == 'false')
	{
		$(".connectButton").html("Connect");
	}
	else if(connected == 'true')
	{
		$(".connectButton").html("Disconnect");
	}
	else
	{
		console.log("Error in type:  'Connected' should be string");
		console.log("Current 'Connected' type" + typeof connected);
	}

	//End Flag set 


	//MAIN INTERFACE BUTTONS

	//----------- Add Option button toggles interface between add form and menu --------------------------
	$(".addOption").click(function() {
		$(".main").toggle();
		$(".addNewProxyForm").toggle();
		$(".connectButton").toggle();
		$(".removeButton").toggle();		
	});

	//------------- Connect button connects to the designated option from the menu --------------------------
	$(".connectButton").click(function() {

		if(!connected) {

			var selectedIndex = $("input[name='radio']:checked").val();

			var proxyArray = handleData.load();
			if(selectedIndex != null && proxyArray != false)
			{

				var name = proxyArray[selectedIndex].name;
				var url = proxyArray[selectedIndex].url;
				console.log("Connecting to " + name + " at " + url);

				let proxySettings = {
					proxyType: "manual",
					httpProxyAll: true,
					http: url,
					socksVersion: 4,
				};

				browser.proxy.settings.set({value: proxySettings});
				
				
				$(".connectButton").html("Disconnect");

				connected = true;
				local.set('Connected', connected);

				local.set('ConnectedProxyIndex', selectedIndex);

				loadHTML.clear();
				loadHTML.populate();

			}
			else
			{
				console.log("No connection option chosen");
			}
			
		}
		else if(connected)
		{	
			console.log("Disconnecting from proxy...");
				
			let proxySettings = {
				proxyType: "none",
			};

			browser.proxy.settings.set({value: proxySettings});

			$(".connectButton").html("Connect");

			connected = false;
			local.set('Connected', connected);

			localStorage.removeItem('ConnectedProxyIndex');

			loadHTML.clear();
			loadHTML.populate();
		}
	});

/*------------------------REMOVE button removes the selected option then refreshes display -----------------------*/
	$(".removeButton").click(function() {	

		var selectedIndex = $("input[name='radio']:checked").val();

		var proxyArray = handleData.load();
		if(selectedIndex != null && proxyArray != false)
		{
			
			local.remove('ProxyList', selectedIndex);
			loadHTML.clear();
			loadHTML.populate();
		}
		else
		{
			console.log("Nothing to remove");
		}
		
	});

/*---------------------  ADD NEW ITEM TO ARRAY -------------------------------*/
	$(".submitProxyForm").click(function() { 
		var name = $("#name").val();
		var url = $("#url").val();
		console.log(name);
		console.log(url);
		if(name != null && url != null)
		{
			var submitedObject = new ProxyObject(name, url);
			handleData.save(submitedObject);
			loadHTML.clear();
			loadHTML.populate();
		}
		else
		{
			console.log("No Values Specified for Form Submittal");
		}

		// Toggle display back to menu
		$(".main").toggle();
		$(".addNewProxyForm").toggle();
		$(".connectButton").toggle();
		$(".removeButton").toggle();
	});

});