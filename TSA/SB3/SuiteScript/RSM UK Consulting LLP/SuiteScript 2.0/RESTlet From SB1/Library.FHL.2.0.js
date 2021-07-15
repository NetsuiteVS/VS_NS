/****************************************************************************************
 * Name:		FHL 2.0 Library (Library.FHL.2.0.js)
 *
 * Script Type:	Library
 *
 * API Version:	2.0
 *
 * Version:		1.0.0 - 01/06/2016 - Initial Release - JJ
 * 				1.0.1 - 26/07/2016 - Code-tidy - CW
 * 				1.0.2 - 20/12/2016 - Add 'use strict' directive and freeze return object - MJL
 *
 * Author:		FHL
 *
 * Purpose:		Library script to share useful functions for SS2
 *
 * Notes:		Needs to be added to a script via the define tag
 * 				define(['../Library.FHL.2.0'], function (Library) {});
 *
 * Functions:
 *
 * #errorHandler						#getNSErrorDetails						#checkDate									#daysBetween						#dateDiff
 * #escapeString						#reduceString							#encodeXML									#UNencodeXML						#randomNumGen
 * #sortByUniqueOnly					#sortByAscendingOrder					#sortByDescendingOrder						#jsonToXML							#xmlToJSON
 * #addURLParameter						#getURLParameter						#getURLParameters							#getURLQueryString					#extOpenWindow
 * #closeExt							#CSVToJSON								#JSONToCSV									#createCSVHeader					#createCSVLines
 * #createCSVLine						#ternary								#startTimer									#getCurrentTimeDifference			#stopTimer
 * #lookupLineItem						#jsDateToNsDate							#nsDateToJsDate								#dateConv							#genericSearch
 * #genericSearchNumeric				#genericSearchTwoParams					#genericSearchFourParams					#genericSearchArrayParams			#genericSearchJSON
 * #genericSearchArrayResultsTwoParams	#genericSearchArrayResultsThreeParams	#genericSearchArrayResultsWithFilterObj		#getAllSearchResults				#getCurrentTimeDifference
 * #genericSearchArrayResults			#genericSearchBetween                   #genericSearchColumnReturn 					#deleteAllRecords					#deleteAllRecordsWithFilter
 * #lookupPostingPeriod 				#populateSelectFields					#lookupAddressInfo 					 		#showNotification		  			#hideNotification
 * #isOneWorld							#getSubsidiaryPrefix					#isDateinRange								#booleanToCheckbox					#checkboxToBoolean
 * #getClientDateTime					#sendEmail								#createDateTimeStamp						#getScriptDeploymentInternalId		#dateFormat
 * #getDateSuffix						#getRecordName							#splitOutValue								#replaceAll							#removeAllLineItemsClient
 * #removeAllLineItems					#convertDateDDMMToMMDD					#genericSearchText							#lookUpParameters					#getRecordChildren
 * #addDaysToDate						#genericSearchTwoParamsTwoOperators
 ****************************************************************************************/

/**
 * @NApiVersion 2.x
 */
define(['N','N/runtime'], function Library(N, runtime)
{
	'use strict'; //1.0.2 MJL

    /**
     * Error handler.
     *
     * @scope Public
     * @param {String | Error | nlobjError} source - The source of the error as a string, or the error (see next param).
     * @param {Error | nlobjError} error - The error.
     */
    function errorHandler(source, errorObj)
    {
		var titleContent = [];
		var detailsContent = [];
		var fileDetails = {};
		var title = "";
		var details = "";
		var scriptDetails = null;
		var nSplit = null;
		var nString = null;
		var message = '';

		try
		{
		    if (source instanceof Error || source instanceof nlobjError)
		    {
		    	errorObj = source;
		    	source = "";
		    }

		    scriptDetails = runtime.getCurrentScript();

		    if(source)
		    {
		    	titleContent.push("Source: \"" + source + "\"");
		    }
		    if(errorObj.code)
		    {
		    	titleContent.push("Code: \"" + errorObj.code + "\"");
		    }
		    if(errorObj.message)
		    {
		    	detailsContent.push("Message: " + errorObj.message);
		    }
		    if(scriptDetails.id)
		    {
		    	detailsContent.push("Script Id: \"" + scriptDetails.id + "\"");
		    }
		    if(scriptDetails.deploymentId)
		    {
		    	detailsContent.push("Deployment Id: \"" + scriptDetails.deploymentId + "\"");
		    }
		    if(errorObj.eventType)
		    {
		    	detailsContent.push("User Event Type: \"" + errorObj.eventType + "\"");
		    }
		    if(errorObj.recordId)
		    {
		    	detailsContent.push("Record Id: \"" + errorObj.recordId + "\"");
		    }
		    if(errorObj.stack)
		    {
		    	fileDetails = getNSErrorDetails(errorObj);

				if (fileDetails.functionName)
				{
				    detailsContent.push("Function: \"" + fileDetails.functionName + "\"");
				}
				if (fileDetails.line)
				{
				    detailsContent.push("Line Number: #" + fileDetails.line);
				}

		    	detailsContent.push("Stack Trace: \"" + fileDetails.stack + "\"");
		    }

			title = titleContent.join(", ");
			details = detailsContent.join(", ");

		    try
		    {
				log.error(title, details);
				//console.error(title + "\n" + details);
		    }
		    catch (ex)
		    {
			    log.error("Library: errorHandler", ex.message);
		    	// Empty catch.
		    }
		}
		catch (e)
		{
		    log.error("Library: errorHandler", ex.message);
		}
	}

    /**
     * Get NetSuite Error Details
     *
     * @scope Public
     * @param {Object} - Error object generated when the error was thrown
     * @returns {Object}
     */
    function getNSErrorDetails(errorObj)
    {
    	var errorDetail = {};
    	var stackTrace = null;

    	var stackTraceSplit = null;
    	var functionName = null;
    	var line = null;

    	try
    	{
    		stackTrace = errorObj.stack;

    		if(typeof stackTrace == 'string')
    		{
    			stackTrace = stackTrace.split('\n');
    		}

			for(var i = 0; i < stackTrace.length; i++)
			{
				if(stackTrace[i].indexOf('>:') != -1)
				{
					stackTraceSplit = stackTrace[i].split(' (')[0];
					errorDetail.functionName = stackTraceSplit.split('at ')[1];

					stackTraceSplit = stackTrace[i].split('>:')[1];
					errorDetail.line = stackTraceSplit.split(':')[0];

					stackTrace[i] = stackTrace[i].split(' (')[0];
				}
				else if(stackTrace[i].indexOf(' [as') != -1)
				{
					stackTrace[i] = stackTrace[i].split(' [as')[0];
				}
				else
				{
					stackTrace[i] = stackTrace[i].split(' (')[0];
				}

				if(i != 0)
				{
					stackTrace[i] = stackTrace[i].replace(' ', '');
				}
			}

			errorDetail.stack = stackTrace.join(", ");
    	}
    	catch(e)
    	{
    		errorHandler('Library: getNSErrorDetails', e);
    	}
    	return errorDetail;
    }

    /**
     * Compares two dates and checks if the departure date is greater than the return date.
     * 1 = datDepart > datReturn
     * 0 = datReturn > datDepart
     * @scope Public
     * @param {String} departDate  must be of iso standard 'Tue Jul 26 2016 09:23:43 GMT+0100 (BST)'
     * @param {String} returnDate
     *
     * @returns {Integer} retVal
     */
    function checkDate(departDate, returnDate)
    {
    	var dateCheckDepart = null;
    	var dateCheckReturn = null;
    	var datDepart = null;
    	var datReturn = null;
    	var retVal = 0;

    	try
    	{
    		datDepart = new Date(departDate);
    		datReturn = new Date(returnDate);

    		if(datDepart > datReturn)
    		{
    			retVal = 1;
    		}
    	}
    	catch(e)
    	{
    		errorHandler('Library: checkDate', e);

    	}
    	return retVal;
    }

    /**
     * Finds the difference between 2 dates in unix time and then returns this in a integer whole number.
     * @scope Public
     * @param  {Int}    	    The departure or start date.
     * @param  {Int}	        The return or finish date.
     * @return {Int}    		Returns the number of days between the two dates.
     */
    function daysBetween(date1, date2)
    {
    	var first = "";
    	var second= "";
    	var one = null;
    	var two = null;
    	var millisecondsPerDay = 0;
    	var millisBetween = 0;
    	var days = 0;
    	var retVal = 0;

    	try
    	{
    		one = new Date(date1);
    		two = new Date(date2);

    		// Do the math.
    		millisecondsPerDay = 1000 * 60 * 60 * 24;
    		millisBetween = two.getTime() - one.getTime();
    		days = millisBetween / millisecondsPerDay;

    		// Round down.
    		retVal = Math.floor(days);
    	}
    	catch(e)
    	{
    		errorHandler('Library: daysBetween', e);
    	}

    	return retVal;
    }

    /**
     * Find the difference between 2 dates.
     * Dates must use iso standard
     * @scope Public
     * @param {Date}  departDate
     * @param {Date}  returnDate
     */
    function dateDiff(departDate, returnDate)
    {
    	var retVal = 0;
    	var newDepartDate = 0;
    	var newReturnDate = 0;
    	var datDepart = 0;
    	var datReturn = 0;
    	var dateDifference = 0;

    	try
    	{
    		datDepart = new Date(departDate);
    		datReturn = new Date(returnDate);

    		dateDifference = ((datReturn - datDepart)/(24*60*60*1000)-1);

    		if(dateDifference > 0)
    		{
    			retVal = Math.round(dateDifference, 1);
    		}
    		else
    		{
    			retVal = dateDifference;
    		}
    	}
    	catch(e)
    	{
    		errorHandler('Library: dateDiff', e);
    	}

    	return retVal;
    }

    /**
     * Escapes a string
     * @scope Public
     * @param {String} inputString
     * @returns {String} retVal
     */
    function escapeString(inputString)
    {
    	var retVal = "";
    	try
    	{
    		retVal = inputString;

    		retVal = retVal.replace("'","\\'");
    		retVal = retVal.replace(/\\n/gi, " ");
    		retVal = retVal.replace(/&/gi,"&amp;");
    	}
    	catch(e)
    	{
    		errorHandler('Library: escapeString', e);
    	}

    	return retVal;
    }

    /**
     * This function will manually escape a string escaping instances of line break and
     *  new line and replacing them with a whitespace. Use for converting a text area.
     * @scope Public
     * @param  {String}    	String input.
     * @return {String}     Returns the escaped string.
     */
    function reduceString(str)
    {
    	var retVal = '';

    	try
    	{
    		retVal = str.replace(/\n/g,' ').replace(/\r/g,'');
    	}
    	catch(e)
    	{
    		errorHandler('Library: reduceString');
    	}
    	return retVal;
    }

    /**
     * encode xml
     * @scope Public
     * @param {String} xml
     * @returns {String}
     */
    function encodeXML(XMLString)
    {
    	var retVal='';
    	try
    	{
    		XMLString = XMLString.replace(/</gi,"&lt;");
    		XMLString = XMLString.replace(/>/gi,"&gt;");
    		XMLString = XMLString.replace(/&/gi,"&amp;");

    		XMLString = XMLString.replace(/\n/gi,"&#xA;");
    		XMLString = XMLString.replace(/\r/gi,"&#xD;");
    		XMLString = XMLString.replace(/\'/gi,"&quot;");

    		retVal = XMLString;
    	}
    	catch(e)
    	{
    		errorHandler("Library: encodeXML", e);
    	}
    	return retVal;
    }

    /**
     * convert xml converted characters back
     * @scope Public
     * @param xml
     * @returns {String}
     */
    function UNencodeXML(xmldecode)
    {
    	var retVal='';

    	try
    	{
    		xmldecode = xmldecode.replace(/&amp;/g,'&');
    		xmldecode = xmldecode.replace(/&lt;/g,'<');
    		xmldecode = xmldecode.replace(/&gt;/g,'>');
    		xmldecode = xmldecode.replace(/&quot;/g,'\'');
    		xmldecode = xmldecode.replace(/&#xD;/g,'\r');
    		xmldecode = xmldecode.replace(/&#xA;/g,'\n');

    		retVal = xmldecode;

    	}
    	catch(e)
    	{
    		errorHandler("Library: UNencodeXML", e);
    	}

    	return retVal;
    }

    /**
     * Creates the  Random part of the GUID
     *
     *
     * @returns {String} hexadecimal
     */
    function randomNumGen()
    {// TODO pretty pointless function
    	var retVal = null;

    	try
    	{
    		retVal = Math.floor((1 + Math.random()) * 0x10000);
    		retVal = retVal.toString(16);
    		retVal = retVal.substring(1);
    	}
    	catch(e)
    	{
    		errorHandler('Library: randomNumGen', e);
    	}
    	return retVal;
    }

    /**
     * Filters the array and returns values that are only unique, no duplicates returned
     *
     * usage: sortedArray = nonSortedArray.filter(sortByUniqueOnly);
     * example: [1, 2, 3, 1, 2]
     * returns: [1, 2, 3]
     * @scope Public
     * @param {number} value
     * @param {int} index
     * @param {array} self
     * @returns {Boolean}
     */
    function sortByUniqueOnly(value, index, self)
    {
    	var uniqueValue = null;
    	try
    	{
    		uniqueValue = self.indexOf(value) === index;
    	}
    	catch(e)
    	{
    		errorHandler('Library: sortByUniqueOnly', e);
    	}
    	return uniqueValue;
    }

    /**
     * Sorts an array into values that are placed in ascending order
     *
     * usage: sortedArray = nonSortedArray.sort(sortByAscendingOrder);
     * example: [3, 2, 4, 1]
     * returns: [1, 2, 3, 4]
     * @scope Public
     * @param {number} valueA
     * @param {number} valueB
     * @returns {Boolean}
     */
    function sortByAscendingOrder(valueA, valueB)
    {
    	var comp = null;
    	try
    	{
    		comp = valueA - valueB;
    	}
    	catch(e)
    	{
    		errorHandler('Library: sortByAscendingOrder', e);
    	}
    	return comp;
    }

    /**
     * Sorts an array into values that are placed in ascending order
     *
     * usage: sortedArray = nonSortedArray.sort(sortByDescendingOrder);
     * example: [3, 2, 4, 1]
     * returns: [1, 2, 3, 4]
     * @scope Public
     * @param {number} valueA
     * @param {number} valueB
     * @returns {Boolean}
     */
    function sortByDescendingOrder(valueA, valueB)
    {
    	var comp = null;
    	try
    	{
    		comp = valueB - valueA;
    	}
    	catch(e)
    	{
    		errorHandler('Library: sortByDescendingOrder', e);
    	}
    	return comp;
    }

    /**
     * Convert JSON to XML string.
     * @scope Public
     * @param {Object} json - The JSON object to convert to XML. The JSON object should be structured with XML properties as object identifiers, each of which being an object containing @attributes and child identifier properties. @attributes should be an associative array of attributes and values. The parent element should only contain one identifer.
     * @return {String} XML content of JSON object, in string format.
     */
    function jsonToXML(jsonObject)
    {
    	var json = jsonObject;
    	var attribute = "";
    	var attributes = [];
    	var childrenXmlString = "";
    	var child = {};

    	var xmlString = "";

    	try
    	{
    		// for each xml node.
    		for(var key in json)
    		{
    			// if the value of the identifier is an object, it should contain @attributes and @children.
    			if(typeof json[key] === "object")
    			{
    				// if xml node has children.
    				for(var childKey in json[key])
    				{
    					if(childKey === "@attributes")
    					{
    						for(var attributeKey in json[key]["@attributes"])
    						{
    							attribute = attributeKey + "=\"" + json[key]["@attributes"][attributeKey] + "\"";

    							attributes.push(attribute);
    						}
    					}
    					else if(childKey === "#text")
    					{
    						childrenXmlString += json[key][childKey];
    					}
    					else
    					{
    						child = {};
    						child[childKey] = json[key][childKey];

    						childrenXmlString += jsonToXML(child);
    					}
    				}

    				// open xml node.
    				if(attributes && attributes instanceof Array && attributes.length > 0)
    				{
    					xmlString += "<" + key + " " + attributes.join(" ") + ">";
    				}
    				else
    				{
    					xmlString += "<" + key + ">";
    				}

    				xmlString += childrenXmlString;

    				// close xml node.
    				xmlString += "</" + key + ">";
    			}
    			else if(key !== "#text")
    			{
    				// open xml node.
    				xmlString += "<" + key + ">";

    				xmlString += json[key];

    				// close xml node.
    				xmlString += "</" + key + ">";
    			}
    		}
    	}
    	catch(e)
    	{
    		errorHandler("Library: jsonToXML", e);
    	}

    	return xmlString;
    }

    /**
     * Code from http://davidwalsh.name/convert-xml-json.
     *
     * Refactored to comply with FHL standards.
     *
     * Convert a Document object into a JSON object.
     * @scope Public
     * @param {Document | String} xml - An XML Document
     * @return {Object} The equvilant JSON object
     */
    function xmlToJSON(xml)
    {
    	var attribute = null;
    	var item = null;
    	var nodeName = null;
    	var old = null;

    	var jsonObject = {};

    	try
    	{
    		if(typeof xml === "string")
    		{
    			log.error('STRING_TO_XML', 'STRING TO XML NOT YET SUPPORTED');
    			// xml = nlapiStringToXML(xml);
    		}

    		// if node is an element.
    		if(xml.nodeType == 1)
    		{
    			// construct attributes.
    			if (xml.attributes.length > 0)
    			{
    				jsonObject["@attributes"] = {};

    				for(var j = 0, length = xml.attributes.length; j < length; j++)
    				{
    					attribute = xml.attributes.item(j);
    					jsonObject["@attributes"][attribute.nodeName] = attribute.nodeValue;
    				}
    			}
    		}
    		else if (xml.nodeType == 3)  // text
    		{
    			jsonObject = xml.nodeValue;
    		}

    		// child nodes
    		if (xml.hasChildNodes())
    		{
    			for(var i = 0, childCount = xml.childNodes.length; i < childCount; i++)
    			{
    				item = xml.childNodes.item(i);
    				nodeName = item.nodeName;

    				if (typeof(jsonObject[nodeName]) == "undefined")
    				{
    					jsonObject[nodeName] = xmlToJSON(item);
    				}
    				else
    				{
    					if (typeof(jsonObject[nodeName].push) == "undefined")
    					{
    						old = jsonObject[nodeName];
    						jsonObject[nodeName] = [];
    						jsonObject[nodeName].push(old);
    					}

    					jsonObject[nodeName].push(xmlToJSON(item));
    				}
    			}
    		}
    	}
    	catch(e)
    	{
    		errorHandler("Library: xmlToJSON", e);
    	}

    	return jsonObject;
    }

    /**
     * Add parameter to URL.
     * @scope Public
     * @param {String} URL - The URL to add the parameter to. no trailing "/"
     * @param {String} identifier - The identifier of the parameter.
     * @param {String | Number} value - The value of the parameter.
     * @return {String} The URL with the parameter added.
     */
    function addURLParameter(url, identifier, value)
    {
    	var mUrl = url;

    	try
    	{
    		if(mUrl.split("?").length > 1)
    		{
    			mUrl += "&";
    		}
    		else
    		{
    			mUrl += "?";
    		}

    		mUrl += identifier;
    		mUrl += "=";
    		mUrl += value;
    	}
    	catch(e)
    	{
    		errorHandler("Library: addURLParameter", e);
    	}

    	return mUrl;
    }

    /**
     * Get parameter from url.
     * @scope Public
     * @param {String} parameterIdentifier - The identifier of the parameter to get the value(s) of.
     * @param {String} url [optional] - The url to get the parameters of. If no url is provided, it is assumed that the script is executing client side and the current url is to be used.
     * @return {String | Number | Array} The value of the url parameter.
     */
    function getURLParameter(parameterIdentifier, url)
    {
    	var parameters = {};
    	var parameterValues = [];

    	try
    	{
    		// get parameters/
    		parameters = getURLParameters(url);

    		// walk over each parameter, looking for a matching identifier.
    		for(var i = 0; parameters && i < parameters.length; i++)
    		{
    			if(parameters[i].hasOwnProperty(parameterIdentifier))
    			{
    				parameterValues.push(parameters[i][parameterIdentifier]);
    			}
    		}

    		if(parameterValues.length === 1)
    		{
    			parameterValues = parameterValues[0];
    		}
    		else if(parameterValues.length === 0)
    		{
    			parameterValues = null;
    		}
    	}
    	catch(e)
    	{
    		errorHandler("Library: getURLParameter", e);
    	}

    	return parameterValues;
    }

    /**
     *
     * Get all parameters from a url.
     * @scope Public
     * @param {String} url [optional] - The url to get the parameters of. If no url is provided, it is assumed that the script is executing client side and the current url is to be used.
     * @return {Object] Associative array of parameter identifiers and values.
     */
    function getURLParameters(url)
    {
    	var queryString = "";
    	var parameterQueries = [];
    	var parameterQuery = [];
    	var identifier = "";
    	var value = "";

    	var parameters = [];

    	try
    	{
    		queryString = getURLQueryString(url);

    		if(queryString)
    		{
    			// get each parameter query.
    			parameterQueries = queryString.split("&");

    			// for each parameter query.
    			for(var i = 0; i < parameterQueries.length; i++)
    			{
    				// split into identifer and value.
    				parameterQuery = parameterQueries[i].split("=");

    				identifier = parameterQuery[0];
    				value = parameterQuery[1];

    				if(parameters.hasOwnProperty(identifier))
    				{
    					parameters[identifier] = [parameters[identifier]];
    					parameters[identifier].push(value);
    				}
    				else
    				{
    					parameters[identifier] = value;
    				}
    			}
    		}
    	}
    	catch(e)
    	{
    		errorHandler("Library: getURLParameters", e);
    	}

    	return parameters;
    }

    /**
     * Get query string of a url.
     *@scope Public
     * @param {String} url [optional] - The url to get the query string of. If no url is provided, it is assumed that the script is executing client side and the current url is to be used.
     * @return {String} Query string of the url.
     */
    function getURLQueryString(url)
    {
    	var queryString = "";

    	try
    	{
    		if(url)
    		{
    			queryString = url.split("?")[1];
    		}
    		else
    		{
    			queryString = window.location.search;
    		}

    		// remove question mark if it is first character.
    		if(queryString && queryString.charAt(0) === "?")
    		{
    			queryString = queryString.substring(1);
    		}
    	}
    	catch(e)
    	{
    		errorHandler("Library: getURLQueryString", e);
    	}

    	return queryString;
    }

    /**
     * Open an ext window with an iframe in.
     * @scope Public
     * @param {String} url - The url of the window.
     * @param {String} windowName - The name/id of the window.
     * @param {Number} width [optional] - The width of the window.
     * @param {Number} height [optional] - The height of the window.
     * @param {String} windowTitle [optional] - The title of the window. If not provided, <code>windowName</code> is used for the window title.
     * @param {String} target [optional] - The element id to produce the window from.
     * @return {Object} Ext Window object.
     */
    function extOpenWindow(url, windowName, width, height, windowTitle, target)
    {
    	var extWindow = null;

    	try
    	{
    		// add url parameter that allows select fields to work correctly.
    		// without this parameter, select field values are not selectable by mouse click.
    		url = addURLParameter(url, "ifrmcntnr", "T");

    		extWindow = new Ext.Window({
    			title		:	(windowTitle != undefined ? windowTitle : windowName)
    		,	id			:	windowName
    		,	name		:	windowName
    		,	stateful	:	false
    		,	modal		:	true
    		,	autoScroll	:	false
    		,	style		: 	{
    				"background-color"	:	"#FFFFFF"
    			}
    		,	bodyStyle	:	{
    				"background-color"	:	"#FFFFFF"
    			}
    		,	resizable	:	true
    		,	bodyCfg		:	{
    				tag			:	"iframe"
    			,	name		:	windowName + "_frame"
    			,	id			:	windowName + "_frame"
    			,	src			:	url
    			,	style		:	{
    					"border"			:	"0 none"
    				,	"background-color"	:	"#FFFFFF"
    				}
    			}
    		});

    		if(width)
    		{
    			extWindow.width = width;
    		}

    		if(height)
    		{
    			extWindow.height = height;
    		}

    		if(target)
    		{
    			extWindow.show(target);
    		}
    		else
    		{
    			extWindow.show();
    		}
    	}
    	catch(e)
    	{
    		errorHandler("Library: extOpenWindow", e);
    	}

    	return extWindow;
    }

    /**
     * Close Ext window.
     *
     * @scope Public
     */
    function closeExt()
    {
    	var activeWindow = null;

    	try
    	{
    		// get active window.
    		activeWindow = parent.Ext.WindowMgr.getActive();

    		// close active window.
    		activeWindow.close();
    	}
    	catch(e)
    	{
    		errorHandler("Library: closeExt", e);
    	}
    }

    /**
     * Convert CSV format to JSON array.
     *
     * @scope Public
     * @param {String} CSV - The CSV string to convert to JSON.
     * @return {Object} The data in JSON format.
     */
    function CSVToJSON(CSV)
    {
    	var csvArray = [];
    	var jsonArray = [];
    	var jsonObject = {};
    	var headers = null;
    	var currentLine = null;

    	try
    	{
    		csvArray = CSV.replace(/"/g, "").replace(/'/g, "").split("\r\n");

    		headers = csvArray[0].split(",");

    		for(var i = 1; i < csvArray.length; i++)
    		{
    			if(csvArray[i])
    			{
    				currentLine = csvArray[i].split(",");

    				jsonObject = {};

    				for(var j = 0; j < headers.length; j++)
    				{
    					jsonObject[headers[j]] = currentLine[j];
    				}

    				jsonArray.push(jsonObject);
    			}
    		}
    	}
    	catch(e)
    	{
    		errorHandler("Library: CSVToJSON", e);
    	}

    	return jsonArray;
    }

    /**
     * Convert JSON object to CSV format.
     *
     * @scope Public
     * @param {Object} jsonObject - The JSON object to convert to CSV.
     * @return {String} The data in CSV format.
     */
    function JSONToCSV(jsonObject)
    {
    	var csvContents = "";

    	try
    	{
    		csvContents = createCSVHeader(jsonObject);
    		csvContents += "\n";
    		csvContents += createCSVLines(jsonObject);
    	}
    	catch(e)
    	{
    		errorHandler("Library: JSONToCSV", e);
    	}

    	return csvContents;
    }

    /**
     * Create the header for the object provided, using the object identifiers as the headers.
     *
     * @scope Public
     * @param {Object} jsonObject - The JSON object to get the headers of.
     * @return {String} The headers for the JSON object, in CSV format.
     */
    function createCSVHeader(jsonObject)
    {
    	var headerObject = {};
    	var csvHeaders = [];

    	var csvHeader = "";

    	try
    	{
    		// get object to use for header values, dependent on whether object parameter is array of not.
    		if(jsonObject instanceof Array && jsonObject.length > 0)
    		{
    			headerObject = jsonObject[0];
    		}
    		else
    		{
    			headerObject = jsonObject;
    		}

    		// for each header.
    		for(var header in headerObject)
    		{
    			// add header to csv header.
    			csvHeaders.push(headerObject[header]);
    		}

    		csvHeader = csvHeaders.join(",");
    	}
    	catch(e)
    	{
    		errorHandler("Library: createCSVHeader", e);
    	}
    	return csvHeader;
    }

    /**
     * Create the content of the CSV lines for the object provided.
     *
     * @scope Public
     * @param {Object} jsonObject - The JSON object to get the headers of.
     * @return {String} The contents for the JSON object, in CSV format.
     */
    function createCSVLines(jsonObject)
    {
    	var csvContents = [];

    	var csvLines = "";

    	try
    	{
    		// create array of values for each line.
    		if(jsonObject instanceof Array)
    		{
    			for(var i = 1, length = jsonObject.length; i < length; i++)
    			{
    				csvContents.push(createCSVLine(jsonObject[i]));
    			}
    		}
    		else
    		{
    			csvContents.push(createCSVLine(jsonObject));
    		}

    		// convert all lines to CSV.
    		csvLines = csvContents.join("\n");
    	}
    	catch(e)
    	{
    		errorHandler("Library: createCSVLines", e);
    	}
    	return csvLines;
    }

    /**
     * Create the content of a single CSV line for the object provided.
     *
     * @scope Public
     * @param {Object} jsonObject - The JSON object to get the headers of.
     * @return {String} Line value, in CSV format.
     */
    function createCSVLine(jsonObject)
    {
    	var csvContents = [];

    	var csvLine = "";

    	try
    	{
    		for(var key in jsonObject)
    		{
    			csvContents.push(jsonObject[key]);
    		}

    		csvLine = csvContents.join(",");
    	}
    	catch(e)
    	{
    		errorHandler("Library: createCSVLine", e);
    	}
    	return csvLine;
    }

    /**
     * Ternary statement replacement:
     *
     * When the comparison value is true then return whenTrue otherwise return whenFalse
     *
     * If comparisonValue is a function then call that function
     * If comparisonValue is an object call the callback function and pass optional user defined parameters
     * If comparisonValue is not a boolean then convert it to one
     * If the return value is a function then return the result of that function
     * If the return value is an object then call the callback function and pass optional user defined parameters
     *
     * @scope Public
     * @param comparisonValue {Boolean}
     * @param whenTrue {Any}
     * @param whenFalse {Any}
     * @returns {Boolean}
     *
	 * Usage: variable = library.ternary(value > 10, overTen, underTen);
	 * Usage: variable = library.ternary(value > 10, 'over', 'under');
	 * Usage: callbackObj = {callback: alert, parameters: 'Hello World!'}
	 * 		  variable = library.ternary(value > 10, callbackObj, 'under');
	 */
    function ternary(comparisonValue, whenTrue, whenFalse)
    {
    	var returnValue = null;

    	try
    	{
    		// If the comparisonValue is a function
    		// comparisonValue will equal the result of that function
    		if(typeof comparisonValue == 'function')
    		{
    			comparisonValue = comparisonValue();
    		}
    		// If the comparisonValue is an object
    		// comparisonValue will equal the result of the callback with optional user defined parameters
    		// User defined parameters can be any value
    		else if(typeof comparisonValue == 'object')
    		{
    			if(comparisonValue.callback)
    			{
        			if(typeof comparisonValue.callback == 'function')
        			{
	        			if(comparisonValue.parameters)
	        			{
	        				comparisonValue = comparisonValue.callback(comparisonValue.parameters);
	        			}
	        			else
	        			{
	        				comparisonValue = comparisonValue.callback();
	        			}
        			}
    			}
    		}

    		// If the comparisonValue is not boolean
    		// comparisonValue will be converted to a boolean
    		if(typeof comparisonValue != 'boolean')
    		{
    			comparisonValue = !!(comparisonValue);
    		}

    		if(comparisonValue)
    		{
    			returnValue = whenTrue;
    		}
    		else
    		{
    			returnValue = whenFalse;
    		}

    		// If the returnValue is a function
    		// returnValue will equal the result of that function
    		if(typeof returnValue == 'function')
    		{
    			returnValue = returnValue();
    		}
    		// If the returnValue is an object
    		// returnValue will equal the result of the callback with optional user defined parameters
    		// User defined parameters can be any value
    		else if(typeof returnValue == 'object')
    		{
    			if(returnValue.callback)
    			{
        			if(typeof returnValue.callback == 'function')
        			{
	        			if(returnValue.parameters)
	        			{
	        				returnValue = returnValue.callback(returnValue.parameters);
	        			}
	        			else
	        			{
	        				returnValue = returnValue.callback();
	        			}
        			}
    			}
    		}
    	}
    	catch(e)
    	{
    		errorHandler('Library: ternary', e);
    	}

    	return returnValue;
    }

    /**
     * Starts a timer
     * @scope Public
     * @returns {void}
     */
    function startTimer()
    {
    	this.date = null;

    	try
    	{
    		this.date = new Date();
    	}
    	catch(e)
    	{
    		errorHandler("startTimer", e);
    	}
    }

    /**
     * Gets the current time difference in milliseconds to the started timer
     * @scope Public
     * @returns {number}
     */
    function getCurrentTimeDifference()
    {
    	var retVal = null;
    	var newDate = null;

    	try
    	{
    		newDate = new Date();

    		retVal = newDate.getTime() - this.date.getTime();
    	}
    	catch(e)
    	{
    		errorHandler("getCurrentTimeDifference", e);
    	}

    	return retVal;
    }


    /**
     * Stops the timer and returns the difference from the start to the end in miliseconds
     * @scope public
     * @returns {number}
     */
    function stopTimer()
    {
    	var retVal = null;
    	var newDate = null;

    	try
    	{
    		retVal = getCurrentTimeDifference();

    		this.date = null;
    	}
    	catch(e)
    	{
    		errorHandler("stopTimer", e);
    	}

    	return retVal;
    }

    /**
     * Preform's a search for one or more lines on a record
     * @scope public
     * @param {String} [Required] recordType - The record you wish to search to be preformed on
     * @param {String} [Required] recordId - The internal id of the record
     * @param {Array | String} [Required] fields - The fields that you would like returned, i.e. [{id : "item", type : "text"}, "rate"]
     * @param {Integer} [Optional] lineNumber - The line number you want the values from
     * @param {String} [Optional] sublistType - The internal id of the sublist
     * @param {String} [Optional] fieldName - The field internal id you wish to use to find another value on the same row
     * @param {String | Integer} [Optional] fieldValue - The field value you wish to look for to find another value on the same row
     *
     * @return {Array | Object} retVal - The array which contains a object with the value you requested
     *
     * Usage: library.lookupLineItem('salesorder', '3431', [{id : "item", type : "text"}, "rate"], 1, 'item');
     */
    function lookupLineItem(recordType, recordId, fields, lineNumber, sublistType, fieldName, fieldValue)
    {
    	var retVal = [];
    	var searchObj = null;
    	var resultSet = null;
    	var filters = [];
    	var columns = [];
    	var localObject = {};
    	var line = 0;
    	var recordObj = null;

    	try
    	{
    	    filters.push(N.search.createFilter({
	    		name: 'mainline',
	    		operator: N.search.Operator.IS,
	    		values: 'F'
    	    }));

    	    filters.push(N.search.createFilter({
	    		name: 'internalid',
	    		operator: N.search.Operator.IS,
	    		values: recordId
    	    }));

    	    filters.push(N.search.createFilter({
	    		name: 'taxline',
	    		operator: N.search.Operator.IS,
	    		values: 'F'
    	    }));

    	    filters.push(N.search.createFilter({
	    		name: 'cogs',
	    		operator: N.search.Operator.IS,
	    		values: 'F'
    	    }));

    	    for(var field in fields)
	    	{
	    		if(typeof fields[field] == 'string')
	    		{
	    			columns.push(N.search.createColumn({
	    				name: fields[field]
        	    	}));
	    		}
	    		else
	    		{
        	    	columns.push(N.search.createColumn({
        	    		name: fields[field].id
        	    	}));
	    		}
	    	}

    		// If the user is looking for the item on the same line but does not know the line number
    		if(sublistType && fieldName && fieldValue && (lineNumber == null || lineNumber == ""))
    		{
    			recordObj = N.record.load({
    				type: recordType,
    				id: recordId
    			});

    			lineNumber = recordObj.findSublistLineWithValue({
    				sublistId: sublistType,
    				fieldId: fieldName,
    				value: fieldValue
    			});
    		}

    		// If the user wants the values from a line
    		if(lineNumber)
    		{
    			columns.push(N.search.createColumn({
    				name: 'line'
    			}));
    		}

    		searchObj = N.search.create({
    			type: recordType,
    			columns: columns,
    			filters: filters
    		});

    		searchObj.run().each(function(result){
    			localObject = {};

    			for(var field in fields)
    			{
    				if(typeof fields[field] == 'string')
    				{
    					localObject[fields[field]] = result.getValue(fields[field]);
    				}
    				else
    				{
    					if(fields[field].type.toLowerCase() == 'text')
    					{
    						localObject[fields[field].id] = result.getText(fields[field].id);
    					}
    					else
    					{
    						localObject[fields[field].id] = result.getValue(fields[field].id);
    					}
    				}
    			}

				// If the user want the values from a line
				if(lineNumber)
				{
					line = result.getValue('line');

					if(line == lineNumber)
					{
						retVal.push(localObject);
					}
				}
				else
				{
					retVal.push(localObject);
				}
    		});

    		// If there is only one item return the object
    		if(retVal.length == 1)
    		{
    			retVal = retVal[0];
    		}
    	}
    	catch(e)
    	{
    		errorHandler("Library: lookupLineItems", e);
    	}

    	return retVal;
    }

    /**
     * Converts date from JS (obj) form to NS (string) form
     * @scope public
     * @param {Date} (year,month,day)
     *
     * @returns {String} (day/month/year)
     */
    function jsDateToNsDate(jsdate)
    {
    	var retVal = '';
    	try
    	{
    		retVal = N.format.format({
    			value: jsdate,
    			type: N.format.Type.DATE
    		});
    	}
    	catch(e)
    	{
    		errorHandler('Library: jsDateToNsDate', e);
    	}
    	return retVal;
    }

    /**
     * Convert from NS (string) date form to JS (obj) date form
     * @scope public
     * @param {String} nsdate
     *
     * @returns {Date} retVal
     */
    function nsDateToJsDate(nsdate)
    {
    	var dateStr = new Array();
    	var theDay = '';
    	var theMonth = '';
    	var theYear = '';
    	var retVal = null;

    	try
    	{
    		dateStr = nsdate.split("/");

    		if (dateStr.length != 1)
    		{
    			theDay = dateStr[0];
    			theMonth = dateStr[1] - 1;
    			theYear = dateStr[2];
    			retVal = new Date(theYear, theMonth, theDay);
    		}
    	}
    	catch(e)
    	{
    		errorHandler('Library: nsDateToJsDate', e);
    	}
    	return retVal;
    }

    /**
     * Converts date depending on format chosen
     *
     * mode 0 = NetSuite to JS | mode 1 = JS to NetSuite
     * @scope public
     * @param {Date} date
     * @param {Integer} mode
     * @returns {Date | String}
     */
    function dateConv(date,mode)
    {
    	var retVal = null;

    	try
    	{
    		switch (mode)
    		{
    			case 0:
    				retVal = nsDateToJsDate(date);
    				break;
    			case 1:
    				retVal = jsDateToNsDate(date);
    				break;
    		}
    	}
    	catch(e)
    	{
    		errorHandler('Library: dateConv', e);
    	}
    	return retVal;
    }

    /**
     * Generic search - returns internal ID
     * @scope public
     * @param table
     * @param {String} fieldToSearch
     * @param {String | Integer} valueToSearch
     *
     * Usage - library.genericSearch('employee', 'firstname', 'James');
     */
    function genericSearch(table, fieldToSearch, valueToSearch)
    {
    	var retVal = 'not found';

    	var filter = null;
    	var column = null;
    	var searchObj = null;
    	var searchResults = null;

    	try
    	{
    		filter = N.search.createFilter({
	    		name: fieldToSearch,
	    		operator: N.search.Operator.IS,
	    		values: valueToSearch
    	    });

    		column = N.search.createColumn({
    			name: 'internalid'
    		});

    		searchObj = N.search.create({
    			type: table,
    			columns: column,
    			filters: filter
    		});

    		searchResults = searchObj.run().getRange({
    			start: 0,
    			end: 1
    		});

    		for(var result in searchResults)
    		{
    			retVal = searchResults[result].getValue('internalid');
    		}
    	}
    	catch(e)
    	{
    		errorHandler("Library: genericSearch", e);
    	}
    	return retVal;
    }

    /**
     * Generic search - returns internal ID
     * @scope public
     * @param {String} table
     * @param {String} fieldToSearch
     * @param {String} valueToSearch
     *
     * @return {Integer] retVal - internal id
     *
     * Usage - library.genericSearchNumeric('salesorder', 'memo', '10');
     */
    function genericSearchNumeric(table, fieldToSearch, valueToSearch)
    {
    	var retVal = 0;
    	var searchResults = null;
    	var searchObj = null;

    	// Arrays
    	var searchFilters = [];
    	var searchColumns = [];

    	try
    	{
    		// search filters
    		searchFilters = N.search.createFilter({
	    		name: fieldToSearch,
	    		operator: N.search.Operator.EQUALTO,
	    		values: valueToSearch
    	    });

    		// return columns
    		searchColumns = N.search.createColumn({
    			name: 'internalid'
    		});

    		searchObj = N.search.create({
    			type: table,
    			columns: searchColumns,
    			filters: searchFilters
    		});

    		searchResults = searchObj.run().getRange({
    			start: 0,
    			end: 1
    		});

    		for(var result in searchResults)
    		{
    			retVal = searchResults[result].getValue('internalid');
    		}
    	}
    	catch(e)
    	{
    		errorHandler("Library: genericSearchNumeric", e);
    	}

    	return retVal;
    }

    /**
     * Generic search with two filters - returns internal ID
     * @scope public
     * @param {String} table
     * @param {String} fieldToSearch1
     * @param {String | Integer} valueToSearch1
     * @param {String} fieldToSearch2
     * @param {String | Integer} valueToSearch2
     *
     * Usage - library.genericSearchTwoParams('employee', 'firstname', 'James', 'comments', 'Test');
     */
    function genericSearchTwoParams(table, fieldToSearch1, valueToSearch1, fieldToSearch2, valueToSearch2)
    {
    	var retVal ='not found';

    	var filters = [];
    	var column = null;
    	var searchObj = null;
    	var searchResults = null;

    	try
    	{
    		filters.push(N.search.createFilter({
	    		name: fieldToSearch1,
	    		operator: N.search.Operator.IS,
	    		values: valueToSearch1
    	    }));

    		filters.push(N.search.createFilter({
	    		name: fieldToSearch2,
	    		operator: N.search.Operator.IS,
	    		values: valueToSearch2
    	    }));

    		column = N.search.createColumn({
    			name: 'internalid'
    		});

    		searchObj = N.search.create({
    			type: table,
    			columns: column,
    			filters: filters
    		});

    		searchResults = searchObj.run().getRange({
    			start: 0,
    			end: 1
    		});

    		for(var result in searchResults)
    		{
    			retVal = searchResults[result].getValue('internalid');
    		}
    	}
    	catch(e)
    	{
    		errorHandler("Library: genericSearchTwoParams", e);
    	}

    	return retVal;
    }

    /**
     * Generic search with four filters - returns internal ID
     * @scope public
     * @param {String} table
     * @param {String} fieldToSearch1
     * @param {String | Integer} valueToSearch1
     * @param {String} fieldToSearch2
     * @param {String | Integer} valueToSearch2
     * @param {String} fieldToSearch3
     * @param {String | Integer} valueToSearch3
     * @param {String} fieldToSearch4
     * @param {String | Integer} valueToSearch4
     * @return {Integer} retVal
     *
     * Usage - library.genericSearchFourParams('employee', 'firstname', 'James', 'comments', 'Test', 'email', 'example@example.com', 'giveaccess', 'T');
     */
    function genericSearchFourParams(table, fieldToSearch1, valueToSearch1, fieldToSearch2, valueToSearch2, fieldToSearch3, valueToSearch3, fieldToSearch4, valueToSearch4)
    {
    	var retVal ='not found';

    	var filters = [];
    	var column = null;
    	var searchObj = null;
    	var searchResults = null;

    	try
    	{
    		filters.push(N.search.createFilter({
	    		name: fieldToSearch1,
	    		operator: N.search.Operator.IS,
	    		values: valueToSearch1
    	    }));

    		filters.push(N.search.createFilter({
	    		name: fieldToSearch2,
	    		operator: N.search.Operator.IS,
	    		values: valueToSearch2
    	    }));

    		filters.push(N.search.createFilter({
	    		name: fieldToSearch3,
	    		operator: N.search.Operator.IS,
	    		values: valueToSearch3
    	    }));

    		filters.push(N.search.createFilter({
	    		name: fieldToSearch4,
	    		operator: N.search.Operator.IS,
	    		values: valueToSearch4
    	    }));

    		column = N.search.createColumn({
    			name: 'internalid'
    		});

    		searchObj = N.search.create({
    			type: table,
    			columns: column,
    			filters: filters
    		});

    		searchResults = searchObj.run().getRange({
    			start: 0,
    			end: 1
    		});

    		for(var result in searchResults)
    		{
    			retVal = searchResults[result].getValue('internalid');
    		}
    	}
    	catch(e)
    	{
    		errorHandler("Library: genericSearchFourParams", e);
    	}
    	return retVal;
    }

    /**
     * Generic search with two arrays for fields and value filters - returns internal ID
     * @scope public
     * @param {String} netsuite record type
     * @param {String} fieldToSearch
     * @param {String | Integer} valueToSearch
     *
     * Usage - library.genericSearchArrayParams('employee', ['firstname'], ['James']);
     */
    function genericSearchArrayParams(table, fields, values)
    {
    	var retVal = 'not found';

    	var filters = [];
    	var column = null;
    	var searchObj = null;
    	var searchResults = null;

    	try
    	{
    		if(fields.length == values.length)
    		{
        		for(var i = 0; i < fields.length; i++)
        		{
            		filters.push(N.search.createFilter({
        	    		name: fields[i],
        	    		operator: N.search.Operator.IS,
        	    		values: values[i]
            	    }));
        		}

        		column = N.search.createColumn({
        			name: 'internalid'
        		});

        		searchObj = N.search.create({
        			type: table,
        			columns: column,
        			filters: filters
        		});

        		searchResults = searchObj.run().getRange({
        			start: 0,
        			end: 1
        		});

        		for(var result in searchResults)
        		{
        			retVal = searchResults[result].getValue('internalid');
        		}
    		}
    	}
    	catch(e)
    	{
    		errorHandler("Library: genericSearchArrayParams", e);
    	}
    	return retVal;
    }

    /**
     * Takes an array of JSON column:value pairs and uses them as filters
     * @scope public
     * @param {String} netsuite record type
     * @param {Array} filtersArrayJSON
     * @returns {Number}
     *
     * Usage - library.genericSearchJSON('employee', [{column: 'firstname', value: 'James'}, {column: 'comments', value: 'Test'}]);
     */
    function genericSearchJSON(table, filtersArrayJSON)
    {
    	var retVal = 'not found';

    	var filters = [];
    	var column = null;
    	var searchObj = null;
    	var searchResults = null;

    	try
    	{
    		for(var filter in filtersArrayJSON)
    		{
        		filters.push(N.search.createFilter({
    	    		name: filtersArrayJSON[filter].column,
    	    		operator: N.search.Operator.IS,
    	    		values: filtersArrayJSON[filter].value
        	    }));
    		}

    		column = N.search.createColumn({
    			name: 'internalid'
    		});

    		searchObj = N.search.create({
    			type: table,
    			columns: column,
    			filters: filters
    		});

    		searchResults = searchObj.run().getRange({
    			start: 0,
    			end: 1
    		});

    		for(var result in searchResults)
    		{
    			retVal = searchResults[result].getValue('internalid');
    		}
    	}
    	catch(e)
    	{
    		errorHandler("Library: genericSearchJSON",e);
    	}
    	return retVal;
    }

    /**
     * Generic search - returns array of internal IDs
     * @scope public
     * @param {String} table
     * @param {String} fieldToSearch
     * @param {String} valueToSearch
     *
     * @return {Array} internalIDs
     */
    function genericSearchArrayResults(table, fieldToSearch, valueToSearch)
    {
    	var internalIDs = [];

    	var searchObj = null;
    	var filter = null;
    	var column = null;
    	var results = null;

    	try
    	{
    		filter = N.search.createFilter({
	    		name: fieldToSearch,
	    		operator: N.search.Operator.IS,
	    		values: valueToSearch
    	    });

    		column = N.search.createColumn({
    			name: 'internalid'
    		});

    		searchObj = N.search.create({
    			type: table,
    			columns: column,
    			filters: filter
    		});

    		searchObj.run().each(function(result){
    			internalIDs.push(result.id);
        		return true;
    		});

    		internalIDs.sort(sortByAscendingOrder);
    	}
    	catch(e)
    	{
    		errorHandler("Library: genericSearchArrayResults", e);
    	}
    	return internalIDs;
    }

    /**
     * Generic search - returns array of internal IDs
     * @scope public
     * @param {String} table
     * @param {String} field1ToSearch
     * @param {String} value1ToSearch
     * @param {String} field2ToSearch
     * @param {String} value2ToSearch
     *
     * @return {Array} internalIDs
     */
    function genericSearchArrayResultsTwoParams(table, field1ToSearch, value1ToSearch, field2ToSearch, value2ToSearch)
    {
    	var internalIDs = [];

    	var searchObj = null;
    	var filters = [];
    	var column = null;
    	var results = null;

    	try
    	{
    		filters.push(N.search.createFilter({
	    		name: field1ToSearch,
	    		operator: N.search.Operator.IS,
	    		values: value1ToSearch
    	    }));

    		filters.push(N.search.createFilter({
	    		name: field2ToSearch,
	    		operator: N.search.Operator.IS,
	    		values: value2ToSearch
    	    }));

    		column = N.search.createColumn({
    			name: 'internalid'
    		});

    		searchObj = N.search.create({
    			type: table,
    			columns: column,
    			filters: filters
    		});

    		searchObj.run().each(function(result){
    			internalIDs.push(result.id);
        		return true;
    		});

    		internalIDs.sort(sortByAscendingOrder);
    	}
    	catch(e)
    	{
    		errorHandler("Library: genericSearchArrayTwoParams", e);
    	}
    	return internalIDs;
    }

    /**
     * Generic search - returns array of internal IDs
     * @scope public
     * @param {String} table
     * @param {String} field1ToSearch
     * @param {String} oper1 [optional]
     * @param {String} value1ToSearch
     * @param {String} field2ToSearch
     * @param {String} oper2 [optional]
     * @param {String} value2ToSearch
     * @param {String} field3ToSearch
     * @param {String} oper3 [optional]
     * @param {String} value3ToSearch
     *
     * @return {Array} internalIDs
     */
    function genericSearchArrayResultsThreeParams(table, field1ToSearch, oper1, value1ToSearch, field2ToSearch, oper2, value2ToSearch, field3ToSearch, oper3, value3ToSearch)
    {
    	var internalIDs = [];

    	var searchObj = null;
    	var filters = [];
    	var column = null;
    	var results = null;

    	try
    	{
    		filters.push(N.search.createFilter({
	    		name: field1ToSearch,
	    		operator: (oper1) ? oper1 :N.search.Operator.IS,
	    		values: value1ToSearch
    	    }));

    		filters.push(N.search.createFilter({
	    		name: field2ToSearch,
	    		operator: (oper2) ? oper2 : N.search.Operator.IS,
	    		values: value2ToSearch
    	    }));

    		filters.push(N.search.createFilter({
	    		name: field3ToSearch,
	    		operator: (oper3) ? oper3 : N.search.Operator.IS,
	    		values: value3ToSearch
    	    }));

    		column = N.search.createColumn({
    			name: 'internalid'
    		});

    		searchObj = N.search.create({
    			type: table,
    			columns: column,
    			filters: filters
    		});

    		searchObj.run().each(function(result){
    			internalIDs.push(result.id);
        		return true;
    		});

    		internalIDs.sort(sortByAscendingOrder);
    	}
    	catch(e)
    	{
    		errorHandler("Library: genericSearchArrayTwoParams", e);
    	}
    	return internalIDs;
    }

    /**
     * generic search with filter object array passed as parameter
     * @scope public
     * @param Array of nlobjSearchFilter objects
     * @returns Array of internal IDs
     */
    function genericSearchArrayResultsWithFilterObj(table, filters)
    {

    	var internalIDs = [];
    	var column = null;
    	var searchObj = null;

    	try
    	{
    		column = N.search.createColumn({
    			name: 'internalid'
    		});

    		searchObj = N.search.create({
    			type: table,
    			columns: column,
    			filters: filters
    		});

    		searchObj.run().each(function(result){
    			internalIDs.push(result.id);
        		return true;
    		});

    		internalIDs.sort(sortByAscendingOrder);
    	}
    	catch(e)
    	{
    		errorHandler("Library: genericSearchArrayWithFilterObj", e);
    	}
    	return internalIDs;
    }

    /**
     * Perform a search, retrieving all results.
     * @scope public
     * @param {String} recordType - The record internal ID of the record type you are searching (for example, customer|lead|prospect|partner|vendor|contact).
     * @param {search.Filter} filters [optional] - A single nlobjSearchFilter object or an array of nlobjSearchFilter object or a search filter expression.
     * @param {search.Column} columns [optional] - A single nlobjSearchColumn object or an array of nlobjSearchColumn objects.
     * @return {Array[search.Result]} All the results of the search, as an array.
     */
    function getAllSearchResults(recordType, filters, columns)
    {
    	var searchObj = null;
    	var resultSet = null;
    	var searchResults = null;
    	var results = null;
    	var start = 0;

    	try
    	{
    		searchObj = N.search.create({
    			type: recordType,
    			columns: columns,
    			filters: filters
    		});

    		resultSet = searchObj.run();
    		do
    		{
    			searchResults = resultSet.getRange(start, start + 1000);
    			if(searchResults)
    			{
    				if(!results)
    				{
    					results = [];
    				}
    				results = results.concat(searchResults);
    			}
    			start += 1000;
    		}
    		while(results && results.length > 0 && results.length % 1000 === 0);

    		if(!results || results.length <= 0)
    		{
    			results = null;
    		}
    	}
    	catch(e)
    	{
    	    errorHandler("Library: getAllSearchResults", e);
    	}

    	return results;
    }

    /**
     * Will delete records of the specified record type where the column ISNOTEMPTY
     *
     * NOTE: run().each is limited to 4000 records
     * @scope Public
     * @param {Sting} recordType
     * @param {String} columnName
     * @returns {void}
     * Usage: library.deleteAllRecords('customrecord_xml_load_audit','custrecord_description');
     */
    function deleteAllRecords(recordType, columnName)
    {
    	var filter = null;
    	var column = null;
    	var searchObj = null;
    	var searchResults = null;

    	try
    	{

    		filter = N.search.createFilter({
    			name: columnName,
    			operator: N.search.Operator.ISNOTEMPTY
    		});

    		column = N.search.createColumn({
    			name: columnName
    		});

    		searchObj = N.search.create({
    			type: recordType,
    			columns: column,
    			filters: filter
    		});

    		searchObj.run().each(function(result){
    			try
    			{
    				//N.record.delete({
    				N.record['delete']({
        				type: result.recordType,
        				id: result.id
        			});
        			return true;
    			}
    			catch(er)
    			{
    				errorHandler('Library: deleteAllRecords: searchObj.run().each: ID - ' + result.id, er);
    			}
    		});
    	}
    	catch(e)
    	{
    		errorHandler('Library: deleteAllRecords', e);
    	}
    }

    /**
     * Will delete records of the specified record type with a column value of the value specified
     *
     * NOTE: run().each is limited to 4000 records
     * @scope Public
     * @param {String} recordType
     * @param {String} columnName
     * @param {String} filterValue
     * @returns {void}
     * Usage: library.deleteAllRecordsWithFilter('customrecord_userevent', 'name', 'test');
     */
    function deleteAllRecordsWithFilter(recordType, columnName, filterValue)
    {
    	var filter = null;
    	var column = null;
    	var searchObj = null;
    	var searchResults = null;

    	try
    	{
    		filter = N.search.createFilter({
    			name: columnName,
    			operator: N.search.Operator.IS,
    			values: filterValue
    		});

    		column = N.search.createColumn({
    			name: columnName
    		});

    		searchObj = N.search.create({
    			type: recordType,
    			columns: column,
    			filters: filter
    		});

    		searchObj.run().each(function(result){
    			try
    			{
    				//N.record.delete({
    				N.record['delete']({
        				type: result.recordType,
        				id: result.id
        			});
        			return true;
    			}
    			catch(er)
    			{
    				errorHandler('Library: deleteAllRecordsWithFilter: searchObj.run().each: ID - ' + result.id, er);
    			}
    		});
    	}
    	catch(e)
    	{
    		errorHandler ('Library: deleteAllRecordsWithFilter', e);
    	}
    }

    /**
     * Generic search between - returns internal ID
     * @scope Public
     * @param {String} tableName
     * @param {String} fieldToSearchFrom
     * @param {String} fieldToSearchTo
     * @param {String | Integer} valueToSearch
     * @returns {any}
     * Usage: library.genericSearchBetween('accountingperiod', 'startdate', 'enddate', '1/1/2016');
     */
    function genericSearchBetween(tableName, fieldToSearchFrom, fieldToSearchTo, valueToSearch)
    {
    	var retVal = 'not found';

    	var filters = [];
    	var column = null;
    	var searchObj = null;
    	var searchResults = null;
    	try
    	{
    		filters.push(N.search.createFilter({
    			name: fieldToSearchFrom,
    			operator: N.search.Operator.ONORBEFORE,
    			values: valueToSearch
    		}));

    		filters.push(N.search.createFilter({
    			name: fieldToSearchTo,
    			operator: N.search.Operator.ONORAFTER,
    			values: valueToSearch
    		}));

    		column = N.search.createColumn({
    			name: 'internalid'
    		});

    		searchObj = N.search.create({
    			type: tableName,
    			columns: column,
    			filters: filters
    		});

    		searchResults = searchObj.run().getRange({
    			start: 0,
    			end: 1
    		});

    		for(var result in searchResults)
    		{
    			retVal = searchResults[result].getValue('internalid');
    		}
    	}
    	catch(e)
    	{
    		errorHandler("Library: genericSearchBetween", e);
    	}
    	return retVal;
    }

    /**
     * generic search - returns a specified column
     * @scope Public
     * @param {String} - tableName
     * @param {String} - fieldToSearch
     * @param {String} - valueToSearch
     * @param {String} - columnReturn
     * @returns {any}
     * Usage: library.genericSearchColumnReturn('employee', 'firstname', 'James', 'firstname');
     */
    function genericSearchColumnReturn(tableName, fieldToSearch, valueToSearch, columnReturn)
    {
    	var retVal = 'not found';
    	var filter = null;
    	var columns = [];
    	var searchObj = null;
    	var searchResults = null;
    	try
    	{
    		filter = N.search.createFilter({
    			name: fieldToSearch,
    			operator: N.search.Operator.IS,
    			values: valueToSearch
    		});

    		columns.push(N.search.createColumn({
    			name: 'internalid'
    		}));

    		columns.push(N.search.createColumn({
    			name: columnReturn
    		}));

    		searchObj = N.search.create({
    			type: tableName,
    			columns: columns,
    			filters: filter
    		});

    		searchResults = searchObj.run().getRange({
    			start: 0,
    			end: 1
    		});

    		for(var result in searchResults)
    		{
    			retVal = searchResults[result].getValue(columnReturn);
    		}
    	}
    	catch(e)
    	{
    		errorHandler("Library: genericSearchColumnReturn", e);
    	}
    	return retVal;
    }

    /**
     * Look up posting period - returns internal ID
     * @scope Public
     * @param {String} tableName
     * @param {String | Integer} valueToSearch
     * @returns {int}
     * example use: crIntId = genericSearchBetween('accountingperiod','startdate','enddate');
     */
    function lookupPostingPeriod(tableName, valueToSearch)
    {
    	var retVal = 'not found';

    	var filters = [];
    	var column = null;
    	var searchObj = null;
    	var searchResults = null;
    	try
    	{
    		filters.push(N.search.createFilter({
    			name: 'startdate',
    			operator: N.search.Operator.ONORBEFORE,
    			values: valueToSearch
    		}));

    		filters.push(N.search.createFilter({
    			name: 'enddate',
    			operator: N.search.Operator.ONORAFTER,
    			values: valueToSearch
    		}));

    		filters.push(N.search.createFilter({
    			name: 'isadjust',
    			operator: N.search.Operator.IS,
    			values: 'F'
    		}));

    		filters.push(N.search.createFilter({
    			name: 'isyear',
    			operator: N.search.Operator.IS,
    			values: 'F'
    		}));

    		filters.push(N.search.createFilter({
    			name: 'isquarter',
    			operator: N.search.Operator.IS,
    			values: 'F'
    		}));

    		column = N.search.createColumn({
    			name: 'internalid'
    		});

    		searchObj = N.search.create({
    			type: tableName,
    			columns: column,
    			filters: filters
    		});

    		searchResults = searchObj.run().getRange({
    			start: 0,
    			end: 1
    		});

    		for(var result in searchResults)
    		{
    			retVal = searchResults[result].getValue('internalid');
    		}
    	}
    	catch(e)
    	{
    		errorHandler("Library: lookupPostingPeriod", e);
    	}
    	return retVal;
    }

    /**
     * Populate select fields from record types
     * works only in client/UE
     * @scope Public
     * @param {String} recordType
     * @param {SelectField} fieldObj
     * @returns {void}
     */
    function populateSelectFields(recordType, fieldObj)
    {
    	var columns = [];
    	var searchObj = null;
    	var searchObj = null;

    	try
    	{
    		columns.push(N.search.createColumn({
    			name: 'internalid'
    		}));

    		columns.push(N.search.createColumn({
    			name: 'name'
    		}));

    		searchObj = N.search.create({
    			type: recordType,
    			columns: columns
    		});

    		fieldObj.addSelectOption({
    			value: '',
    			text: '',
    			isSelected: true
    		});

    		searchObj.run().each(function(result){
        		fieldObj.addSelectOption({
        			value: result.getValue('internalid'),
        			text: result.getValue('name'),
        			isSelected: false
        		});
    		});
    	}
    	catch(e)
    	{
    		errorHandler("Library: populateSelectFields", e);
    	}
    }

    /**
     * Gets any field value from address sublist on pre-defined record
     * @scope Public
     * @param recType {string} type of record (either Contact, Customer, Partner, Vendor or Employee)
     * @param recId {string} record ID
     * @param defShip {boolean} is the desired address the default shipping address?
     * @param defBill {boolean} is the desired address the default billing address?
     * @param field {string} ID of the desired field
     * @returns {any} field
     */
    function lookupAddressInfo(recType, recId, defShip, defBill, field)
    {
    	var recordObj = null;
    	var lineNum = 0;
    	var retVal = null;

    	try
    	{
    		recordObj = N.record.load({
    			type: recType,
    			id: recId
    		});

    		if (defShip)
    		{
				lineNum = recordObj.findSublistLineWithValue({
					sublistId: 'addressbook',
					fieldId: 'defaultshipping',
					value: 'T'
				});
    		}
    		else if(defBill)
    		{
				lineNum = recordObj.findSublistLineWithValue({
					sublistId: 'addressbook',
					fieldId: 'defaultbilling',
					value: 'T'
				});
    		}

    		if (lineNum > 0)
    		{
    			retVal = recordObj.getSublistValue({
    				sublistId: 'addressbook',
    				fieldId: field,
    				line: lineNum
    			});
    		}
    	}
    	catch (e)
    	{
    		errorHandler('Library: lookupAddressInfo', e);
    	}
    	return retVal;
    }

    /**
     * Display a NetSuite "Heads Up" notification.
     * Works only in client/UE
     * @scope Public
     * @param {String} dialogType [case insensitive] - Either:
     * 	<ul>
     * 		<li>confirmation</li>
     * 		<li>information</li>
     * 		<li>warning</li>
     * 		<li>error</li>
     * 	</ul>
     * @param {String} text - The message to display.
     * @param {String} title - Name to prefix message title with.
     * @param {Number} duration [optional] - Duration in milliseconds
     * @returns {object}
     * @since 1.4.0.
     */
    function showNotification(type, title, text, duration)
    {
    	var message = null;
    	var msg = null;
    	var msgType = null;

    	try
    	{
    		if (title && text)
    		{
    			message = N.ui.message;

    			// Get the requested message type, or default to message.Type.INFORMATION
    			msgType = (((typeof type === 'string') && message.Type[type.toUpperCase()]) || message.Type.INFORMATION);

    			// Create message object
    			msg = message.create({
    				title: title,
    				message: text,
    				type: msgType
    			});

    			// Show message
    			msg.show({
    				// If duration is a number and greater than 0, use duration, or fix to default '0'
    				duration: (Number.isInteger(duration) && duration > 0 ? duration : 0)
    			});
    		}

    		/*
    		if(typeof type == 'string')
    		{
        		switch(type)
        		{
        		case 'confirmation':
        			msgType = N.ui.message.Type.CONFIRMATION;
        			break;
        		case 'information':
        			msgType = N.ui.message.Type.INFORMATION;
        			break;
        		case 'warning':
        			msgType = N.ui.message.Type.WARNING;
        			break;
        		case 'error':
        			msgType = N.ui.message.Type.ERROR;
        			break;
        		default:
        			msgType = N.ui.message.Type.INFORMATION;
        			break;
        		}
    		}
    		else
    		{
    			msgType = N.ui.message.Type.INFORMATION;
    		}

    		msg = N.ui.message.create({
    			title: title,
    			message: text,
    			type: msgType
    		});

    		if(duration)
    		{
    			msg.show({
    				duration: duration
    			});
    		}
    		else
    		{
    			msg.show();
    		}
    		*/
    	}
    	catch(e)
    	{
    		errorHandler('Library: showNotification', e);
    	}
    	return msg;
    }

    /**
     * Hides message created from notify
     * Works only in client/UE
     * @scope Public
     * @param {message.Message} msg - Message box to hide
     * @param {Number} timeoutDuration [optional] - Assign a timeout duration
     * @returns {void}
     */
    function hideNotification(msg, timeoutDuration)
    {
    	try
    	{
    		if(timeoutDuration)
    		{
    			setTimeout(msg.hide, timeoutDuration);
    		}
    		else
    		{
    			msg.hide();
    		}
    	}
    	catch(e)
    	{
    		errorHandler('Library: hideNotification', e);
    	}
    }

    /**
     * Checks to see if the account is one world.
     *
     * @return {Boolean} Boolean indication of whether account is one world.
     */
    function isOneWorld()
    {
    	var retVal = false;

    	try
    	{
    		retVal = N.isFeatureInEffect({feature: "SUBSIDIARIES"});
    	}
    	catch(e)
    	{
    		errorHandler("Library: isOneWorld", e);
    	}

    	return retVal;
    }

    /**
     * Get transaction prefix from Subsidiary record.
     *
     * @param {String|Number} subsidiaryId [optional] - The internal id of Subsidiary to get the Prefix of.
     * @return {String} Transaction prefix from Subsidiary record.
     */
    function getSubsidiaryPrefix(subsidiaryId)
    {
    	var fieldValues = {};

    	var retVal = "";

    	try
    	{
    		if(isOneWorld() && subsidiaryId)
    		{
    			fieldValues = N.search.lookupFields({
    				type: 'subsidiary',
    				id: subsidiaryId,
    				columns: ['tranprefix', 'name']
    			});

    			retVal = fieldValues["tranprefix"] || fieldValues["name"];
    		}
    		else
    		{

    			if(!subsidiaryId)
    			{
    				throw N.error.create({
    					name: 'NO_SUBSIDIARY',
    					message: 'No subsidiary was supplied to get the prefix of.',
    					notifyOff: true
    				});
    			}
    			else if(!isOneWorld())
    			{
    				throw N.error.create({
    					name: 'NOT_ONE_WORLD',
    					message: 'You have attempted to get the Subsidiary prefix in an account where Subsidiaries are not enabled.',
    					notifyOff: true
    				});
    			}
    		}
    	}
    	catch (e)
    	{
    		errorHandler("Library: getSubsidiaryPrefix", e);
    	}

    	return retVal;
    }


    /**
     * checks if date is in the range of startdate/enddate
     *
     * @param {Date} date
     * @param {Date} startdate
     * @param {Date} enddate
     *
     * @returns {Boolean} retVal
     */
    function isDateinRange(date, startDate, endDate)
    {
    	var input = '';
    	var start = '';
    	var end = '';
    	var inputMs = 0;
    	var startMs = 0;
    	var endMs = 0;
    	var retVal = false;

    	try
    	{
    		input = N.format.format({
    			value: date,
    			type: N.format.Type.DATE
    		});

    		start = N.format.format({
    			value: startDate,
    			type: N.format.Type.DATE
    		});

    		end = N.format.format({
    			value: endDate,
    			type: N.format.Type.DATE
    		});

    		// Convert both dates to milliseconds
    		inputMs = input.getTime();
    		startMs = start.getTime();
    		endMs = end.getTime();

    		if (inputMs >= startMs && inputMs <= endMs)
    		{
    			retVal = true;
    		}
    	}
    	catch(e)
    	{
    		errorHandler('Library: isDateinRange', e);
    	}
    	return retVal;
    }

    /**
     * Converts a boolean to a checkbox value
     *
     * @param {Boolean} input - true or false
     * @return {String} retVal - "T" or "F"
     */
    function booleanToCheckbox(input)
    {
    	var retVal = null;

    	try
    	{
    		retVal = (input ? 'T' : 'F');
    		/*
    		if(input == true)
    		{
    			retVal = "T";
    		}
    		else
    		{
    			retVal = "F";
    		}
    		*/
    	}
    	catch(e)
    	{
    		errorHandler("booleanToCheckbox", e);
    	}

    	return retVal;
    }

    /**
     * Converts a checkbox value to a boolean value
     *
     * @param {String} input - "T" or "F"
     * @return {Boolean} retVal - true or false
     */
    function checkboxToBoolean(input)
    {
    	var retVal = null;

    	try
    	{
    		retVal = (input === 'T' ? true : false);
    		/*
    		if(input == "T")
    		{
    			retVal = true;
    		}
    		else
    		{
    			retVal = false;
    		}
    		*/
    	}
    	catch(e)
    	{
    		errorHandler("checkboxToBoolean", e);
    	}

    	return retVal;
    }

    /**
     * Gets the client date time
     *
     * @param {String} savedSearch - internal id of saved search
     * @returns {Object} - {date : "", time : ""}
     */
    function getClientDateTime(savedSearch)
    {
    	var searchObj = null;
    	var dateTime = "";
    	var splitResult = [];
    	var searchResults = null;
        var retVal = {};

    	try
    	{
    		searchObj = N.search.load({
    			id: savedSearch
    		});

    		searchResults = searchObj.run().getRange({
    			start: 0,
    			end: 1
    		});

    		for(var result in searchResults)
    		{
    			dateTime = searchResults[result].getValue('formuladatetime');
    		}

    		splitResult = dateTime.split(" ");

    		retVal.date = splitResult[0];
    		retVal.time = splitResult[1];
    	}
    	catch(e)
    	{
    		errorHandler("Library: getClientDateTime", e);
    	}

    	return retVal;
    }

    /**
     * Sends a email
     *
     * @param {Number} [optional] Sender
     * @param {Array|String} emailRecipients
     * @param {String} subject
     * @param {String} message
     *
     * @return {Boolean} sendEmail
     */
    function sendEmail(sender, emailRecipients, subject, message)
    {
    	var currentUser = null;
    	var sendEmail = false;

    	try
    	{
    		if(!sender)
    		{
    			currentUser = N.getCurrentUser();
            	sender = currentUser.id;
            }

    		N.email.send({
    			author: sender,
    			recipients: emailRecipients,
    			subject: subject,
    			body: message
    		});

        	sendEmail = true;
    	}
    	catch(e)
    	{
    		errorHandler('Library: sendEmail', e);
    	}

    	return sendEmail;
    }

    /**
     * Creates a date and time stamp string from a JS Date object
     *
     * @param {Date} date time to convert
     * @param {Boolean} includeTime
     *
     * @returns {String}
     *
     * Usage - library.createDateTimeStamp(date, true);
     */
    function createDateTimeStamp(date, includeTime)
    {
    	var retVal = '';
    	var currentTime = '';

    	var day = '';
    	var month = '';
    	var year = '';
    	var hours = '';
    	var minutes = '';
    	var seconds = '';

    	try
    	{
    		day = date.getDate();

    		if (day < 10)
    		{
    			day = '0' + day;
    		}

    		month = date.getMonth() + 1;

    		if (month < 10)
    		{
    			month = '0' + month;
    		}

    		year = date.getFullYear();

    		retVal = year + '-' + month + '-' + day;

    		if (includeTime)
    		{
    			hours = date.getHours();
    			minutes = date.getMinutes();
    			seconds = date.getSeconds();

    			if (hours < 10)
    			{
    				hours = '0' + hours;
    			}

    			if (minutes < 10)
    			{
    				minutes = '0' + minutes;
    			}

    			if (seconds < 10)
    			{
    				seconds = '0' + seconds;
    			}

    			currentTime = hours + minutes + seconds;
    			retVal += ' ' + currentTime;
    		}
    	}
    	catch (e)
    	{
    		errorHandler('Library: createDateString', e);
    	}
    	return retVal;
    }

    /**
     * Get the numeric internal id of a Deployment record.
     *
     * @param {String} deploymentId - The deployment id to find.
     * @return {Number} The internal id of the deployment record.
     *
     * Usage - library.getScriptDeploymentInternalId("custdeploy_script");
     */
    function getScriptDeploymentInternalId(deploymentId)
    {
    	var filters = [];
    	var columns = [];
    	var results = null;
    	var retVal = 0;
    	var searchObj = null;

    	try
    	{
    		filters.push(N.search.createFilter({
    			name: 'scriptid',
    			operator: N.search.Operator.IS,
    			values: deploymentId
    		}));

      		searchObj = N.search.create({
    			type: "scriptdeployment",
    			columns: columns,
    			filters: filters
    		});

      		results = searchObj.run().getRange({
    			start: 0,
    			end: 1
    		});

    		for(var result in results)
    		{
    			retVal = searchResults[result].getId();
    		}
    	}
    	catch(e)
    	{
    		errorHandler("Library: getScriptDeploymentInternalId", e);
    	}

    	return retVal;
    }

	/**
	 * Formats the date parameter to be returned in a long hand manner.
	 * E.g. "1st January 2013".
	 *
	 * @param {Date} date
	 * @return {String} retVal
	 */
	function dateFormat(date)
	{
		var dateMonths = new Array ();
		var jsDate = null;
		var day = null;
		var month = null;
		var year = null;
		var retVal = '';

		try
		{
			dateMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

			jsDate = N.format.parse({
			    value: date,
			    type: N.format.Type.DATE
			    });

			day = jsDate.getDate();
			month = jsDate.getMonth();
			year = jsDate.getFullYear();

			retVal = getDateSuffix(day) + " " + dateMonths[month] + " " + year;
		}
		catch (e)
		{
			errorHandler("Library: dateFormat", e);
		}

		return retVal;
	}

	/**
	 * Using the day of the month number parameter to determine its suffix, then returns a string in the format dd[suffix].
	 *
	 * @param {Integer} day
	 *
	 * @return {String} retVal
	 */
	function getDateSuffix(day)
	{
		var retVal = '';

		try
		{
			switch (day)
			{
				case 1:
				case 21:
				case 31:
					retVal = day + "st";
					break;
				case 2:
				case 22:
					retVal = day + "nd";
					break;
				case 3:
				case 23:
					retVal = day + "rd";
					break;
				default:
					retVal = day + "th";
			}
		}
		catch (e)
		{
			errorHandler("Library: getDateSuffix()", e);
		}

		return retVal;
	}

	/**
	 * Get the name of a record dependent on rename records screen.
	 *
	 * @param {String} recordType - The internal id of the record type.
	 * @return {String} The name of the record.
	 */
	function getRecordName(recordType)
	{
		var recordName = "";

		var userObj = null;

		try
		{
			userObj = N.runtime.getCurrentUser();
			recordName = userObj.getPreference({name: "NAMING_" + recordType.toUpperCase()});

			if(!recordName)
			{
				recordName = recordType.charAt(0).toUpperCase() + recordType.slice(1, recordType.length);
			}
		}
		catch(e)
		{
			errorHandler("Library: getRecordName", e);
		}

		return recordName;
	}

	/**
	 * Splits out values and returns from an XML element
	 *
	 * @param {String} element
	 * @param {String} elementTag
	 */
	function splitOutValue(element, elementTag)
	{
		var retVal = '';
		var splitArray = null;

		try
		{
			//if element is not empty...
			if(element.indexOf(elementTag) != -1)
			{
				//...remove tags and return value
				element = element + '</' + elementTag + '>';
				splitArray = element.split(elementTag);

				retVal = splitArray[1];
				retVal = '' + retVal.substring(1, retVal.length - 2).toString();
			}
		}
		catch(e)
		{
			errorHandler("Library: splitOutValue", e);
		}
		return retVal;
	}

	/**
	 * replaceAll - A function which uses Regular Expressions to replace all
	 * instances of the given text in the input string
	 *
	 * @governance 0.
	 *
	 * @param inputString - The source string you wish to replace the text FROM
	 * @param stringToReplace - The text you wish to REPLACE
	 * @param stringToReplaceWith - The text you wish to REPLACE IT WITH
	 * @returns {String}	-	The inputString, with all text replaced
	 *
	 */
	function replaceAll(inputString, stringToReplace, stringToReplaceWith)
	{
		var retVal = "";
		var regExReplace = null;
		var caseSensitive = "gi";	//force case insensitive

		try
		{
			regExReplace = new RegExp(stringToReplace,caseSensitive);
			retVal = inputString.replace(regExReplace, stringToReplaceWith);
		}
		catch(e)
		{
			errorHandler('Library: replaceAll', e);
		}
		return retVal;
	}

	/**
	 * Clears all lines on sublist - for use in a client-side script
	 *
	 * @param sublist {String}
	 * @returns void
	 */
	function removeAllLineItemsClient(sublist)
	{
		var lineCount = null;
		var currentRecord = N.currentRecord;
		var sublistFieldText = null;
		try
		{
			lineCount = currentRecord.getLineCount({
			    sublistId: sublist
			});

			for (var i = lineCount-1; i >= 0; i--)
			{
				currentRecord.removeLine({
				    sublistId: sublist,
				    line: i,
				});
			}
		}
		catch(e)
		{
			errorHandler("Library: removeAllLineItemsClient", e);
		}
	}

	/**
	 * removeAllLineItems - Removes all lines from a defined sublist
	 * 						on a defined record
	 *
	 * @governance 0.
	 *
	 * @param record - The Record object whose sublist you wish to clear
	 * @param sublist - The ID of the sublist that you wish to clear
	 * @returns void
	 *
	 */
	function removeAllLineItems(record, sublist)
	{
		var lineCount = null;

		try
		{
			lineCount = record.getLineCount({
			    sublistId: sublist
			});

			for (var i = lineCount-1; i >= 0; i--)
			{
				record.removeLine({
				    sublistId: sublist,
				    line: i,
				});
			}
		}
		catch(e)
		{
			errorHandler('Library: removeAllLineItems', e);
		}
	}

	/**
	 * convertDateDDMMToMMDD - Converts a date from dd/mm/yyyy
	 * 						   format to mm/dd/yyyy format
	 *
	 * @governance 0.
	 *
	 * @param dateStr - date formatted as a string
	 * @param sep - date separator (eg. '/' or '.')
	 * @returns newDate - formatted as string
	 *
	 */
	function convertDateDDMMToMMDD(dateStr, sep)
	{
		var date = null;
		var newDate = '';

		try
		{
			date = dateStr.split(sep);

			if(parseInt(date[1]) <= 12)
			{
				newDate = date[1] + sep + date[0] + sep + date[2];
			}
			else
			{
				newDate = 'N/A';
			}
		}
		catch(e)
		{
			errorHandler('Library: convertDateDDMMToMMDD', e);
		}
		return newDate;
	}

	/**
	 * generic search for text rather than internal ID
	 */
	function genericSearchText(table, fieldToSearch, valueToSearch)
	{
    	var retVal = 0;
    	var searchResults = null;
    	var searchObj = null;

    	// Arrays
    	var searchFilters = [];
    	var searchColumns = [];

		try
		{
    		searchFilters = N.search.createFilter({
	    		name: fieldToSearch,
	    		operator: N.search.Operator.IS,
	    		values: valueToSearch
    	    });

    		// return columns
    		searchColumns = N.search.createColumn({
    			name: 'internalid'
    		});

    		searchObj = N.search.create({
    			type: table,
    			columns: searchColumns,
    			filters: searchFilters
    		});

    		searchResults = searchObj.run().getRange({
    			start: 0,
    			end: 1
    		});

    		for(var result in searchResults)
    		{
    			retVal = searchResults[result].getValue('internalid');
    		}
		}
		catch(e)
		{
			log.error("Library: genericSearchText", e);
		}
		return retVal;
	}

	/**
	 * Lookup parameters
	 *CW moved to one lookup
	 *AB fixed contents of if statment now sets the value
	 */
	function lookUpParameters(category, paramName)
	{
		var retVal = null;
		var internalID = 0;
		var paramValue = '';
		var paramFormID = 0;
		var fieldLookup = null;

		try
		{
			internalID = genericSearchTwoParams('customrecord_deploymentparameters', 'custrecord_parametercategory', category, 'name', paramName);

			fieldLookup = N.search.lookupFields({
			    type: 'customrecord_deploymentparameters',
			    id: internalID,
			    columns: ['custrecord_deploymentparametervalue', 'custrecord_formname']//TODO
			});

			paramValue  = fieldLookup['custrecord_deploymentparametervalue'];
			paramFormID = fieldLookup['custrecord_formname'];

			if(paramValue)
			{
				retVal = paramValue;
			}
			else
			{
				retVal = paramFormID;
			}

		}
		catch (e)
		{
			errorHandler('Library: lookUpParameters', e);
		}
		return retVal;
	}

	/**
	 * Get the ancestors of a supplied record.
	 *
	 * @param {String|Number} recordType - The internal id of the record type to get the children of.
	 * @param {String|Number} recordId - The internal id of the record to get the children of.
	 * @return {Array} internal id's of valid records (including the supplied record).
	 */
	function getRecordChildren(recordType, recordId)
	{
		var columns = [];
		var results = [];
		var recordssMap = {};
		var searchObj = null;
		var recordsArray = [];

		try
		{
			// search all subsidiaries.
    		columns = N.search.createColumn({
    			name: 'parent'
    		});

    		searchObj = N.search.create({
    			type: 'item',
    			columns: columns,
    		});

    		searchObj.run().each(function(result) {
    			results.push(result);
				if(!result.getValue("parent"))
				{
					recordssMap[result.id] = {};
				}
    	        return true;
    	    });

			// set children recordsArray
			getRecordsChildren(recordssMap, results);

			// find recordsArray for provided param
			recordsArray = findRecords(recordssMap, recordId);
		}
		catch(e)
		{
			errorHandler("Library: getRecordChildren", e);
		}

		return recordsArray;
	}

	/**
	 * Get children of record id's provided in records associative array.
	 *
	 * @param {Object} records - associative array of record internal id's.
	 * @param {nlobjSearchResult} results - Array of search results of all records.
	 */
	function getRecordsChildren(records, results)
	{
		try
		{
			// for each Subsidiary ID.
			for(var recordId in records)
			{
				// check if key is a results parent.
				for(var i = 0; results && i < results.length; i++)
				{
					if(results[i].getValue("parent") == recordId)
					{
						// set identifier for parent and get children.
						records[recordId][results[i].id] = {};
						getRecordsChildren(records[recordId], results);
					}
				}
			}
		}
		catch(e)
		{
			errorHandler("Library: getRecordsChildren", e);
		}
	}

	/**
	 * Get valid values for records, i.e. record itself and its children, and grandchildren etc, to be used in search filter.
	 *
	 * @param {Object} records - associative array of records and their children.
	 * @param {Number} recordId - internal id of record to find valid values for.
	 * @returns {Array} Array of valid records.
	 */
	function findRecords(records, recordId)
	{
		var retVal = [];

		try
		{
			// for each identifier in records associative array.
			for(var key in records)
			{
				// if no retval and recordId is found.
				if(retVal.length == 0 && key == recordId)
				{
					// get child records and set in array.
					retVal = getRecords(records[key]);
					retVal.push(key);
				}
				else if(retVal.length == 0 && Object.keys(records[key]).length > 0) // if current record is parent, check children.
				{
					retVal = findRecords(records[key], recordId);
				}
			}
		}
		catch(e)
		{
			errorHandler("Library: findRecords", e);
		}

		return retVal;
	}

	/**
	 * Get valid values for record, i.e. record itself and its children, and grandchildren etc, as array.
	 *
	 * @param {Object} record - associative array of record and its children, to convert to array.
	 * @return {Array} Array of record internal id's to be searched.
	 */
	function getRecords(record)
	{
		var records = [];

		try
		{
			// for each child subsidiary.
			for(var key in record)
			{
				// add to array.
				records.push(key);

				// if child has children.
				if(Object.keys(record[key]).length > 0)
				{
					// get children subsidiaries and add to array.
					records = records.concat(getRecords(record[key]));
				}
			}
		}
		catch(e)
		{
			errorHandler("Library: getRecords", e);
		}

		return records;
	}

	/**
	 * Adds the specified number of days to the date parameter, then returns the new date.
	 *
	 * @param {Date} date
	 * @param {Integer} noOfDays
	 *
	 * @return {String} retVal
	 */
	function addDaysToDate(date, noOfDays)
	{
		var jsDate = null;
		var dateAddition = null;
		var retVal = null;
		var msec = null;
		try
		{
			jsDate = N.format.parse({
			    value: date,
			    type: N.format.Type.DATE
			    });

			msec = jsDate.setDate(jsDate.getDate() + Number(noOfDays));

			dateAddition = new Date(msec);

			retVal = N.format.format({
			    value: dateAddition,
			    type: N.format.Type.DATE
			    });
		}
		catch (e)
		{
			errorHandler("Library: addDaysToDate", e);
		}
		return retVal;
	}

	/**
	 * Generic search for two fields and two operators
	 *
	 * @param {String} table
	 * @param {String} fieldToSearch1
	 * @param {String} operator1
	 * @param {String} valueToSearch1
	 * @param {String} fieldToSearch2
	 * @param {String} operator2
	 * @param {String} valueToSearch2
	 *
	 * @return {Integer] retVal - internal id
	 */
	function genericSearchTwoParamsTwoOperators(table, fieldToSearch1, operator1, valueToSearch1, fieldToSearch2, operator2 ,valueToSearch2)
	{
		var retVal = 0;

		// Arrays
		var searchFilters = [];
		var searchColumns = [];
    	var searchObj = null;
    	var searchResults = null;

		try
		{

    		searchFilters = N.search.createFilter({
	    		name: fieldToSearch1,
	    		operator: operator1,
	    		values: valueToSearch1
    	    });

    		searchFilters = N.search.createFilter({
	    		name: fieldToSearch2,
	    		operator: operator2,
	    		values: valueToSearch2
    	    });

    		searchColumns = N.search.createColumn({
    			name: 'internalid'
    		});

    		searchObj = N.search.create({
    			type: table,
    			columns: searchColumns,
    			filters: searchFilters
    		});

    		searchResults = searchObj.run().getRange({
    			start: 0,
    			end: 1
    		});

    		for(var result in searchResults)
    		{
    			retVal = searchResults[result].getValue('internalid');
    		}
		}
		catch(e)
		{
			errorHandler("Library: genericSearchTwoParamsTwoOperators", e);
		}
		return retVal;
	}

	//1.0.2 MJL
    return Object.freeze({
		errorHandler : errorHandler,
		checkDate: checkDate,
		daysBetween: daysBetween,
		dateDiff: dateDiff,
		escapeString: escapeString,
		reduceString: reduceString,
		encodeXML: encodeXML,
		UNencodeXML: UNencodeXML,
		randomNumGen: randomNumGen,
		sortByUniqueOnly: sortByUniqueOnly,
		sortByAscendingOrder: sortByAscendingOrder,
		sortByDescendingOrder: sortByDescendingOrder,
		jsonToXML: jsonToXML,
		xmlToJSON: xmlToJSON,
		addURLParameter: addURLParameter,
		getURLParameter: getURLParameter,
		getURLParameters: getURLParameters,
		getURLQueryString: getURLQueryString,
		extOpenWindow: extOpenWindow,
		closeExt: closeExt,
		CSVToJSON: CSVToJSON,
		JSONToCSV: JSONToCSV,
		createCSVHeader: createCSVHeader,
		createCSVLines: createCSVLines,
		createCSVLine: createCSVLine,
		ternary: ternary,
		startTimer: startTimer,
		getCurrentTimeDifference: getCurrentTimeDifference,
		stopTimer: stopTimer,
		lookupLineItem: lookupLineItem,
		jsDateToNsDate: jsDateToNsDate,
		nsDateToJsDate: nsDateToJsDate,
		dateConv: dateConv,
		genericSearch: genericSearch,
		genericSearchNumeric: genericSearchNumeric,
		genericSearchTwoParams: genericSearchTwoParams,
		genericSearchFourParams: genericSearchFourParams,
		genericSearchArrayParams: genericSearchArrayParams,
		genericSearchJSON: genericSearchJSON,
		genericSearchArrayResults: genericSearchArrayResults,
		genericSearchArrayResultsTwoParams: genericSearchArrayResultsTwoParams,
		genericSearchArrayResultsThreeParams: genericSearchArrayResultsThreeParams,
		genericSearchArrayResultsWithFilterObj: genericSearchArrayResultsWithFilterObj,
		getAllSearchResults: getAllSearchResults,
		deleteAllRecords: deleteAllRecords,
		deleteAllRecordsWithFilter: deleteAllRecordsWithFilter,
		genericSearchBetween: genericSearchBetween,
		genericSearchColumnReturn: genericSearchColumnReturn,
		lookupPostingPeriod: lookupPostingPeriod,
		populateSelectFields: populateSelectFields,
		lookupAddressInfo: lookupAddressInfo,
		showNotification: showNotification,
		hideNotification: hideNotification,
		isOneWorld: isOneWorld,
		isDateinRange: isDateinRange,
		booleanToCheckbox: booleanToCheckbox,
		checkboxToBoolean: checkboxToBoolean,
		getClientDateTime: getClientDateTime,
		sendEmail: sendEmail,
		createDateTimeStamp: createDateTimeStamp,
		getScriptDeploymentInternalId : getScriptDeploymentInternalId,
		dateFormat: dateFormat,
		getDateSuffix: getDateSuffix,
		getRecordName: getRecordName,
		splitOutValue: splitOutValue,
		replaceAll: replaceAll,
		removeAllLineItemsClient: removeAllLineItemsClient,
		removeAllLineItems: removeAllLineItems,
		convertDateDDMMToMMDD: convertDateDDMMToMMDD,
		genericSearchText: genericSearchText,
		lookUpParameters: lookUpParameters,
		getRecordChildren: getRecordChildren,
		addDaysToDate: addDaysToDate,
		genericSearchTwoParamsTwoOperators: genericSearchTwoParamsTwoOperators
	});
});
