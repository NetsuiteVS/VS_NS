/*******************************************************
 * Name: 		Library.FHL.js
 *
 * Script Type:	Library
 *
 * API Version:	1.0
 *
 * Version:		1.0.0 - 22/04/16 - IM  - First release
 * 				2.0.0 - 24/06/16 - MJL - Added encapsulation
 *
 * Author: 		FHL
 *
 * Purpose: 	To share useful functionality
 *
 * Notes:
 * 
 *
 * Function list:
 *
 * #errorHandler				   #getAllSearchResults			  	 #daysBetween				   #dateDiff							#escapeString
 * #							   #sortByUniqueOnly				 #reduceString				   #isDateinRange					    #jsDateToNsDate
 * #genericSearchFourParams		   #deleteAllRecords				 #deleteAllRecordsWithFilter   #genericSearchBetween				#lookupPostingPeriod
 * #genericSearchColumnReturn	   #encodeXML						 #UNencodeXML				   #checkGovernance					    #dealWithGovernance
 * #genericSearchArrayThreeParams  #genericSearchArrayWithFilterObj  #randomNumGen				   #genericSearch					    #removeAllLineItemsClient
 * #dateFormat					   #getDateSuffix					 #genericSearchNumeric		   #genericSearchTwoParamsTwoOperators  #getRecordName
 * #splitOutValue				   #replaceAll					     #removeAllLineItems		   #convertDateDDMMToMMDD			    #genericSearchText
 * #lookupLineItem				   #isOneWorld					     #getSubsidiaryPrefix		   #getRecordChildren				    #getScriptDeploymentInternalId
 * #getURLParameters			   #extOpenWindow					 #closeExt					   #dateConv							#lookUpParameters
 * #genericSearchJSON			   #lookupAddressInfo				 #genericSearchArrayTwoParams  #getDate							    #createDateTimeStamp
 * #notify						   #jsonToXML						 #xmlToJSON					   #addURLParameter					    #getURLParameter
 * #genericSearchTwoParams		   #								 #nsDateToJsDate			   #populateSelectFields 				#genericSearchArray
 * #addDaysToDate				   #getXMLNamespacePrefix			 #sendEmail 				   #JSONToCSV							#CSVToJSON
 * #getClientDateTime			   #ternary						  	 #booleanToCheckbox			   #checkboxToBoolean					#startTimer
 * #getCurrentTimeDifference	   #stopTimer						 #checkDate
 ********************************************************/

var Library = (function ()
{
	/**
	 * Error handler.
	 *
	 * @scope Public
	 * @param {String | Error | nlobjError} source - The source of the error as a string, or the error (see next param).
	 * @param {Error | nlobjError} error - The error.
	 */
	function errorHandler(source, error)
	{
		var titleContent = [];
		var detailsContent = [];
		var functionFileAndLine = {};
		var title = "";
		var details = "";
		
		try
		{
			if(source instanceof Error || source instanceof nlobjError)
			{
				error = source;
				source = "";
			}
			if(error instanceof nlobjError)
			{
				functionFileAndLine = getNSErrorDetails(error);
				if(source)
				{
					titleContent.push("Source: \"" + source + "\"");
				}
				if(error.code)
				{
					titleContent.push("Code: \"" + error.code + "\"");
				}
				if(error.message)
				{
					detailsContent.push("Message: " + error.message);
				}
				if(nlapiGetRecordType())
				{
					detailsContent.push("Record Type: \"" + nlapiGetRecordType() + "\"");
				}
				if(nlapiGetRecordId())
				{
					detailsContent.push("Record ID: #" + nlapiGetRecordId() + "");
				}
				if(error.userEvent)
				{
					detailsContent.push("User Event Method: \"" + error.userEvent + "\"");
				}
				if(functionFileAndLine["function"])
				{
					detailsContent.push("Function: \"" + functionFileAndLine["function"] + "\"");
				}
				if(functionFileAndLine["file"])
				{
					detailsContent.push("File: \"" + functionFileAndLine["file"] + "\"");
				}
				if(functionFileAndLine["line"])
				{
					detailsContent.push("Line Number: #" + functionFileAndLine["line"]);
				}
			}
			else
			{
				if(source)
				{
					titleContent.push("Source: \"" + source + "\"");
				}
				if(error.message)
				{
					detailsContent.push("Message: " + error.message);
				}
				if(nlapiGetRecordType())
				{
					detailsContent.push("Record Type: \"" + nlapiGetRecordType() + "\"");
				}
				if(nlapiGetRecordId())
				{
					detailsContent.push("Record ID: #" + nlapiGetRecordId() + "");
				}
				if(error.fileName)
				{
					detailsContent.push("File: \"" + error.fileName.split("$")[0] + "\"");
				}
				if(error.lineNumber)
				{
					detailsContent.push("Line Number: #" + error.lineNumber);
				}
			}
				title = titleContent.join(", ");
				details = detailsContent.join(", ");
			try
			{
				nlapiLogExecution("ERROR", title, details);
				alert("An unexpected error occurred in a script running on this page.");
				console.error(title + "\n" + details);
			}
			catch(ex)
			{
				// empty catch.
			}
		}
		catch(e)
		{
			nlapiLogExecution("ERROR", "Library: errorHandler", e.message);
		}
	}
		
	/**
	 * Get details of nlobjError.
	 *
	 * @scope Private
	 * @param {nlobjError} error - The error to get the details of.
	 * @return {Object} - Object with <code>function</code>, <code>file</code> and <code>line</code> properties.
	 */
	function getNSErrorDetails(error)
	{
		var stackTrace = null;
		var trigger = "";
		var fileAndLine = "";
		var retVal = {
			"function" : "",
			"file" : ""	,
			"line" :""
		};
		
		try
		{
			// get stack trace.
			stackTrace = error.getStackTrace();
			if(typeof stackTrace === "string")
			{
				// remove "stacktrace: " and split into array.
				stackTrace = stackTrace.replace("stacktrace: ", "").split("\n\n");
				for(var i = 0, length = stackTrace.length; i < length; i++)
				{
					stackTrace[i] = stackTrace[i].replace("function ", "");
					if(stackTrace[i].substring(0, 5) != "nlapi" && stackTrace[i].substring(0, 5) != "nlobj" && stackTrace[i].substring(0, 5) != "nsapi")
					{
						// get error caller.
						trigger = stackTrace[i];
						// get function name.
						retVal["function"] = trigger.split("(")[0];
						break;
					}
				}
			}
			else
			{
				for(var i = 0, length = stackTrace.length; i < length; i++)
				{
					if(stackTrace[i].substring(0, 5) != "nlapi" && stackTrace[i].substring(0, 5) != "nlobj" && stackTrace[i].substring(0, 5) != "nsapi")
					{
						// split to get first elements function, file and line number.
						trigger = stackTrace[i].split("(");
						// get function.
						retVal["function"] = trigger[0];
						// get file and line number, remove function name.
						fileAndLine = trigger[1].split(")")[0];
						// get file.
						retVal["file"] = fileAndLine.split("$")[0];
						// get line.
						retVal["line"] = fileAndLine.split("$")[1].split(":")[1];
						break;
					}
				}
			}
		}
		catch(e)
		{
			// empty catch.
		}
		return retVal;
	}

	/**
	 * Perform a search, retrieving all results.
	 *
	 * @param {String} recordType - The record internal ID of the record type you are searching (for example, customer|lead|prospect|partner|vendor|contact).
	 * @param {nlobjSearchFilter} filters [optional] - A single nlobjSearchFilter object or an array of nlobjSearchFilter object or a search filter expression.
	 * @param {nlobjSearchColumn} columns [optional] - A single nlobjSearchColumn object or an array of nlobjSearchColumn objects.
	 * @return {nlobjSearchResult} All the results of the search, as an array.
	 */
	function getAllSearchResults(recordType, filters, columns)
	{
		var search = null;
		var resultSet = null;
		var searchResults = null;
		var results = null;
		var start = 0;
		
		try
		{
			search = nlapiCreateSearch(recordType, filters, columns);
			resultSet = search.runSearch();
			do
			{
				searchResults = resultSet.getResults(start, start + 1000); // API GOV: 10 units.
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
	 * Preform's a search for one or more lines on a record
	 *
	 * @param {String} [Required] recordType - The record you wish to search to be preformed on
	 * @param {String} [Required] recordId - The internal id of the record
	 * @param {Array | String} [Required] fields - The fields that you would like returned, i.e. [{id : "item" type : "text"}, "rate"]
	 * @param {Integer} [Optional] lineNumber - The line number you want the values from
	 * @param {String} [Optional] sublistType - The internal id of the sublist
	 * @param {String} [Optional] fieldName - The field internal id you wish to use to find another value on the same row
	 * @param {String | Integer} [Optional] fieldValue - The field value you wish to look for to find another value on the same row
	 *
	 * @return {Array | Object} retVal - The array which contains a object with the value you requested
	 */
	function lookupLineItem(recordType, recordId, fields, lineNumber, sublistType, fieldName, fieldValue)
	{
		var retVal = [];
		var search = null;
		var resultSet = null;
		var filters = [];
		var columns = [];
		var hasResults = true;
		var custFromRange = 0;
		var custToRange = 0;
		var documentResults = [];
		var localObject = {};
		var line = 0;
		var record = null;
		
		try
		{
			filters = [
					   new nlobjSearchFilter("mainline", null, "is", "F"),
					   new nlobjSearchFilter("internalid", null, "is", recordId),
					   new nlobjSearchFilter("taxline", null, "is", "F"),
					   new nlobjSearchFilter("cogs", null, "is", "F"),
			];
			
			//If the field is a object or just a string
			for(var i = 0; i < fields.length; i++)
			{
				if(typeof fields[i] == "string")
				{
					columns.push(new nlobjSearchColumn(fields[i]));
				}
				else
				{
					columns.push(new nlobjSearchColumn(fields[i].id));
				}
			}
			
			//If the user is looking for the item on the same line but does not know the line number
			if(sublistType && fieldName && fieldValue && (lineNumber == null || lineNumber == ""))
			{
				record = nlapiLoadRecord(recordType, recordId);
				
				lineNumber = record.findLineItemValue(sublistType, fieldName, fieldValue);
			}
					
			//If the user wants the values from a line
			if(lineNumber)
			{
				columns.push(new nlobjSearchColumn("line"));
			}
					  		
			search = nlapiCreateSearch(recordType, filters, columns);
			resultSet = search.runSearch();

			while (hasResults)
			{
				custFromRange = custToRange;
				custToRange = custFromRange + 1000;
				
				documentResults = resultSet.getResults(custFromRange, custToRange);

				if (documentResults)
				{
					if (documentResults.length < 1000)
	 				{
						hasResults = false;
					}
					
					for (var i = 0; i < documentResults.length; i++)
					{
						//Resets the local object
						localObject = {};
						
						for(var j = 0; j < fields.length; j++)
						{
							//If the field is a string or a object
							if(typeof fields[j] == "string")
							{
								localObject[fields[j]] = documentResults[i].getValue(fields[j]);
							}
							else
							{
								//If the user wants the value as a value or a text
								if(fields[j].type.toLowerCase() == "text")
								{
									localObject[fields[j].id] = documentResults[i].getText(fields[j].id);
								}
								else
								{
									localObject[fields[j].id] = documentResults[i].getValue(fields[j].id);
								}
							}
						}
						
						//If the user want the values from a line
						if(lineNumber)
						{
							line = documentResults[i].getValue("line");
							
							if(line == lineNumber)
							{
								retVal.push(localObject);
							}
						}
						else
						{
							retVal.push(localObject);
						}
					}
				}
				else
				{
					hasResults = false;
				}
			}
			
			//If there is only one item return the object
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
	 * Compares two dates and checks if the departure date is greater than the return date.
	 * 1 = datDepart > datReturn
	 * 0 = datReturn > datDepart
	 *
	 * @param {Date} departDate
	 * @param {Date} returnDate
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
			dateCheckDepart = nlapiStringToDate(departDate);
			dateCheckReturn = nlapiStringToDate(returnDate);
			datDepart = Date.parse(dateCheckDepart);
			datReturn = Date.parse(dateCheckReturn);

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
	 *
	 * @param  {Date}			The departure or start date.
	 * @param  {Date}			The return or finish date.
	 * @return {invalidDate}	 Returns the number of days between the two dates.
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
			first = nlapiStringToDate(date1);
			second = nlapiStringToDate(date2);

			// Copy date parts of the timestamps, discarding the time parts.
			one = new Date(first.getFullYear(), first.getMonth(), first.getDate());
			two = new Date(second.getFullYear(), second.getMonth(), second.getDate());

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
	 *  Find the difference between 2 dates.
	 *  Dates must use full 00/00/0000 format
	 *
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
			newDepartDate = nlapiStringToDate(departDate);
			newReturnDate = nlapiStringToDate(returnDate);
			datDepart = Date.parse(newDepartDate);
			datReturn = Date.parse(newReturnDate);

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
	 *
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
	 *
	 * @param  {String}		String input.
	 * @return {String}	 Returns the escaped string.
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
			input = dateConv(date,0);
			start = dateConv(startDate,0);
			end = dateConv(endDate,0);

			//Convert both dates to milliseconds
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
	 * Converts date from JS (obj) form to NS (string) form
	 *
	 * @param jsdate (year,month,day)
	 *
	 * @returns {String} (day/month/year)
	 */
	function jsDateToNsDate(jsdate)// used for dateConv
	{
		var theDay = null;
		var theMonth = null;
		var theYear = null;
		var nsdate = null;
		var retVal = '';

		try
		{
			theYear = jsdate.getFullYear();
			theMonth = jsdate.getMonth()+1;
			theDay = jsdate.getDate();
			nsdate = theDay + "/" + theMonth + "/" + theYear;
			retVal = nsdate;
		}
		catch(e)
		{
			errorHandler('Library: jsDate_To_nsDate', e);
		}
		return retVal;
	}


	/**
	 * Convert from NS (string) date form to JS (obj) date form
	 *
	 * @param {String} nsdate
	 *
	 * @returns {Date} retVal
	 */
	function nsDateToJsDate(nsdate)// used for dateConv
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
				retVal = new Date(theYear ,theMonth ,theDay);
			}
		}
		catch(e)
		{
			errorHandler('Library: nsDate_To_jsDate', e);
		}
		return retVal;
	}

	/**
	 * Converts date depending on format chosen
	 *
	 * mode 0 = NetSuite to JS | mode 1 = JS to NetSuite
	 *
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
			errorHandler('Library: dateConv',e);
		}
		return retVal;
	}

	/**
	 * generic search - returns internal ID
	 *
	 * @param table
	 * @param {String} fieldToSearch
	 * @param {String | Integer} valueToSearch
	 */
	function genericSearch(table, fieldToSearch, valueToSearch)
	{
		var retVal = 'not found';

		// Arrays
		var invoiceSearchFilters = new Array();
		var invoiceSearchColumns = new Array();
		var itemSearchResults = null;
		var itemSearchResult = null;
		var internalID = 0;

		try
		{
			//search filters
			invoiceSearchFilters[0] = new nlobjSearchFilter(fieldToSearch, null, 'is',valueToSearch);

			// return columns
			invoiceSearchColumns[0] = new nlobjSearchColumn('internalid');

			// perform search
			itemSearchResults = nlapiSearchRecord(table, null, invoiceSearchFilters, invoiceSearchColumns);

			if(itemSearchResults!=null)
			{
				if(itemSearchResults.length>0)
				{
					itemSearchResult = itemSearchResults[0];
					internalID = itemSearchResult.getValue('internalid');
				}
			}
			
			retVal = internalID;
		}
		catch(e)
		{
			errorHandler("Library: genericSearch", e);
		}
		return retVal;
	}

	/**
	 * @param {String} table
	 * @param {String} fieldToSearch1
	 * @param {String | Integer} valueToSearch1
	 * @param {String} fieldToSearch2
	 * @param {String | Integer} valueToSearch2
	 *
	 * generic search - returns internal ID
	 */
	function genericSearchTwoParams(table, fieldToSearch1, valueToSearch1, fieldToSearch2, valueToSearch2)
	{
		var retVal ='not found';

		// Arrays
		var invoiceSearchFilters = new Array();
		var invoiceSearchColumns = new Array();
		var itemSearchResults = null;
		var itemSearchResult = null;

		try
		{
			//search filters
			invoiceSearchFilters[0] = new nlobjSearchFilter(fieldToSearch1, null, 'is',valueToSearch1);
			invoiceSearchFilters[1] = new nlobjSearchFilter(fieldToSearch2, null, 'is',valueToSearch2);

			// return columns
			invoiceSearchColumns[0] = new nlobjSearchColumn('internalid');

			// perform search
			itemSearchResults = nlapiSearchRecord(table, null, invoiceSearchFilters, invoiceSearchColumns);

			if(itemSearchResults!=null)
			{
				if(itemSearchResults.length>0)
				{
					itemSearchResult = itemSearchResults[ 0 ];
					retVal = itemSearchResult.getValue('internalid');
				}
			}
		}
		catch(e)
		{
			errorHandler("Library: genericSearchTwoParams", e);
		}

		return retVal;
	}

	/**
	 * generic search - returns internal ID
	 *
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
	 */
	function genericSearchFourParams(table, fieldToSearch1, valueToSearch1, fieldToSearch2, valueToSearch2, fieldToSearch3, valueToSearch3, fieldToSearch4, valueToSearch4)
	{
		var retVal = 'not found';

		// Arrays
		var SearchFilters = new Array();
		var SearchColumns = new Array();
		var itemSearchResults = null;
		var itemSearchResult = null;

		try
		{
			//search filters
			SearchFilters[0] = new nlobjSearchFilter(fieldToSearch1, null, 'is',valueToSearch1);
			SearchFilters[1] = new nlobjSearchFilter(fieldToSearch2, null, 'is',valueToSearch2);
			SearchFilters[2] = new nlobjSearchFilter(fieldToSearch3, null, 'is',valueToSearch3);
			SearchFilters[3] = new nlobjSearchFilter(fieldToSearch4, null, 'is',valueToSearch4);

			// return columns
			SearchColumns[0] = new nlobjSearchColumn('internalid');

			// perform search
			itemSearchResults = nlapiSearchRecord(table, null, SearchFilters, SearchColumns);

			if(itemSearchResults!= null)
			{
				if(itemSearchResults.length>0)
				{
					itemSearchResult = itemSearchResults[ 0 ];
					retVal = itemSearchResult.getValue('internalid');
				}
			}
		}
		catch(e)
		{
			errorHandler("Library: genericSearchFourParams", e);
		}
		return retVal;
	}

	/**
	 * usage: deleteallrecords('customrecord_xml_load_audit','custrecord_description');
	 *
	 * @param {Sting} recordType
	 * @param {String} columnName
	 *
	 */
	function deleteAllRecords(recordType, columnName)
	{
		// Arrays
		var itemSearchFilters = new Array();
		var itemSearchColumns = new Array();
		var searchResults = null;

		//search filters
		itemSearchFilters[0] = new nlobjSearchFilter(columnName, null, 'isnotempty');
		// search columns
		itemSearchColumns[0] = new nlobjSearchColumn(columnName);

		searchResults = nlapiSearchRecord(recordType, null, itemSearchFilters, itemSearchColumns);

		for ( var i = 0; searchResults != null && i < searchResults.length; i++ )
		{
			try
			{
				nlapiDeleteRecord(searchresults[i].getRecordType(), searchResults[i].getId());
			}
			catch(e)
			{
				errorHandler('Library: deleteAllRecords', e);
			}
		}
	}

	/**
	 * @param {String} recordType
	 * @param {String} columnName
	 * @param {String} filterValue
	 *
	 * usage: deleteallrecords('customrecord_xml_load_audit','custrecord_description');
	 */
	function deleteAllRecordsWithFilter(recordType, columnName, filterValue)
	{
		// Arrays
		var itemSearchFilters = new Array();
		var itemSearchColumns = new Array();
		var searchResults = null;

		//search filters
		itemSearchFilters[0] = new nlobjSearchFilter(columnName, null, 'is', filterValue);
		// search columns
		itemSearchColumns[0] = new nlobjSearchColumn(columnName);

		searchResults = nlapiSearchRecord(recordtype, null, itemSearchFilters, itemSearchColumns);

		for ( var i = 0; searchResults != null && i < searchResults.length; i++ )
		{
			try
			{
				nlapiDeleteRecord(searchResults[i].getRecordType(), searchResults[i].getId());
			}
			catch(e)
			{
				errorHandler ('Library: deleteAllRecordsWithFilter', e);
			}
		}
	}

	/**
	 * Generic search between - returns internal ID
	 *
	 * @param {String} tableName
	 * @param {String} fieldToSearchFrom
	 * @param {String} fieldToSearchTo
	 * @param {String | Integer} valueToSearch
	 *
	 * example use: crIntId = genericSearchBetween('accountingperiod','startdate','enddate',a);
	 */
	function genericSearchBetween(tableName, fieldToSearchFrom, fieldToSearchTo, valueToSearch)
	{
		var retVal='not found';
		// Arrays
		var searchFilters = new Array();
		var searchColumns = new Array();
		var searchResults = null;

		try
		{
			//search filters
			searchFilters[0] = new nlobjSearchFilter(fieldToSearchFrom, null, 'onOrBefore', valueToSearch);
			searchFilters[1] = new nlobjSearchFilter(fieldToSearchTo, null, 'onOrAfter', valueToSearch);
			// return columns
			searchColumns[0] = new nlobjSearchColumn('internalid');
			// perform search
			searchResults = nlapiSearchRecord(tableName, null, searchFilters, searchColumns);

			if(searchResults)
			{
				if(searchResults.length>0)
				{
					retVal = searchResults[0].getValue('internalid');
				}
			}
		}
		catch(e)
		{
			errorHandler("Library: genericSearchBetween", e);
		}
		return retVal;
	}

	/**
	 * Generic search between - returns internal ID
	 *
	 * @param {String} tableName
	 * @param {String | Integer} valueToSearch
	 *
	 * example use: crIntId = genericSearchBetween('accountingperiod','startdate','enddate',a);
	 */
	function lookupPostingPeriod(tableName, valueToSearch)
	{
		var retVal = 'not found';
		// Arrays
		var searchFilters = new Array();
		var searchColumns = new Array();
		var searchResults = null;

		try
		{
			//search filters
			searchFilters[0] = new nlobjSearchFilter('startdate', null, 'onOrBefore', valueToSearch);
			searchFilters[1] = new nlobjSearchFilter('enddate', null, 'onOrAfter', valueToSearch);
			searchFilters[2] = new nlobjSearchFilter('isadjust', null, 'is', 'F');
			searchFilters[3] = new nlobjSearchFilter('isyear', null, 'is', 'F');
			searchFilters[4] = new nlobjSearchFilter('isquarter', null, 'is', 'F');

			// return columns
			searchColumns[0] = new nlobjSearchColumn('internalid');

			// perform search
			searchResults = nlapiSearchRecord(tableName, null, searchFilters, searchColumns);

			if(searchResults!=null)
			{
				if(searchResults.length>0)
				{
					retVal = searchResults[0].getValue('internalid');
				}
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
	 *
	 * @param {String} recordType
	 * @param {SelectField} fieldObj
	 *
	 */
	function populateSelectFields(recordType, fieldObj)
	{
		//var filters = new Array();
		var columns = new Array();
		var results = null;

		try
		{
			// return columns
			columns[0] = new nlobjSearchColumn('internalid');
			columns[1] = new nlobjSearchColumn('name');
			// perform search
			results = nlapiSearchRecord(recordType, null, null, columns);

			if(results != null)
			{
				//add blank select option at top of list
				fieldObj.addSelectOption('', '', true);

				for (var i = 0; i < results.length; i++)
				{
					fieldObj.addSelectOption(results[i].getValue(columns[0]), results[i].getValue(columns[1]), false);
				}
			}
		}
		catch(e)
		{
			errorHandler("Library: populateSelectFields", e);
		}
	}

	/**
	 * Takes an array of JSON column:value pairs and uses them as filters
	 *
	 * @param {String} table
	 * @param {Array} filtersArrayJSON
	 * @returns {Number}
	 */
	function genericSearchJSON(table, filtersArrayJSON)
	{
		var retVal = 0;
		var filters = new Array();
		var searchResults = null;

		try
		{
			for (var i = 0; i < filtersArrayJSON.length; i++)
			{
				filters.push(new nlobjSearchFilter(filtersArrayJSON[i].column, null, 'is', filtersArrayJSON[i].value));
			}

			searchResults = nlapiSearchRecord(table, null, filters, new Array());

			if (searchResults)
			{
				retVal = searchResults[0].getId();
			}
		}
		catch(e)
		{
			errorHandler("Library: genericSearchJSON",e);
		}
		return retVal;
	}

	/**
	 * Gets any field value from address sublist on pre-defined record
	 *
	 * @param recType {string} type of record (either Contact, Customer, Partner, Vendor or Employee)
	 * @param recId {string} record ID
	 * @param defShip {boolean} is the desired address the default shipping address?
	 * @param defBill {boolean} is the desired address the default billing address?
	 * @param field {string} ID of the desired field
	 * @returns {any} field
	 */
	function lookupAddressInfo(recType, recId, defShip, defBill, field)
	{
		var record = null;
		var lineNum = 0;
		var retVal = null;

		try
		{
			//Load record
			record = nlapiLoadRecord(recType, recId);
			//Find line number from default shipping or billing address

			if (defShip)
			{
				lineNum = record.findLineItemValue('addressbook', 'defaultshipping', 'T');
			}
			else if (defBill)
			{
				lineNum = record.findLineItemValue('addressbook', 'defaultbilling', 'T');
			}

			if (lineNum > 0)
			{
				retVal = record.getLineItemValue('addressbook', field, lineNum);
			}
		}
		catch (e)
		{
			errorHandler('Library: lookupAddressInfo', e);
		}
		return retVal;
	}

	/**
	 * generic search - returns a specified column
	 */
	function genericSearchColumnReturn(table, fieldToSearch, valueToSearch, columnReturn)
	{
		var retVal = 'not found';

		// Arrays
		var invoiceSearchFilters = new Array();
		var invoiceSearchColumns = new Array();
		var itemSearchResults = null;

		try
		{
			//search filters
			invoiceSearchFilters[0] = new nlobjSearchFilter(fieldToSearch, null, 'is',valueToSearch);

			// return columns
			invoiceSearchColumns[0] = new nlobjSearchColumn('internalid');
			invoiceSearchColumns[1] = new nlobjSearchColumn(columnReturn);

			// perform search
			itemSearchResults = nlapiSearchRecord(table, null, invoiceSearchFilters, invoiceSearchColumns);

			if(itemSearchResults!=null)
			{
				if(itemSearchResults.length>0)
				{
					retVal  = itemSearchResults[0].getValue(columnReturn);
				}
			}
		}
		catch(e)
		{
			errorHandler("Library: genericSearchColumnReturn", e);
		}
		return retVal;
	}

	/**
	 * encode xml
	 * @param xml
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
	 * deal with governance i.e. yield
	 */
	function checkGovernance()
	{
		var context = null;
		var remaining = 0;
		var state = null;
		var retVal = false;

		try
		{
			context = nlapiGetContext();
			remaining = context.getRemainingUsage();

			if(remaining < 200)
			{
				state = nlapiYieldScript();
				nlapiLogExecution("AUDIT", "Script yielded remaining",remaining);
				if( state.status == 'FAILURE')
				{
					errorHandler("checkGovernance", 'checkGovernance');
				}
				else
				{
					if ( state.status == 'RESUME' )
					{
						nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
						retVal = true;
					}
				}
			}
			else
			{
				retVal = true;
			}
		}
		catch(e)
		{
			errorHandler("Library: checkGovernance", e);
		}
		return retVal;
	}

	/**
	 * Deal with governance i.e. yield
	 *
	 * @param {Integer} Counter
	 * @param {Integer} threshold
	 *
	 * @return {Boolean} retVal
	 */
	function dealWithGovernance(counter, threshold)
	{
		var retVal = false;

		try
		{
			if(counter % threshold == 0)
			{
				if(checkGovernance()==true)
				{
					retVal = true;
				}
			}
		}
		catch(e)
		{
			errorHandler("Library: dealWithGovernance", e);
		}
		return retVal;
	}

	/**
	 * Generic search - returns array of internal IDs
	 *
	 * @param {String} table
	 * @param {String} fieldToSearch
	 * @param {String} valueToSearch
	 *
	 * @return {Array} internalIDs
	 */
	function genericSearchArray(table, fieldToSearch, valueToSearch)
	{
		var internalIDs = new Array();

		// Arrays
		var filters = new Array();
		var columns = new Array();
		var results = null;

		try
		{
			//search filters
			filters[0] = new nlobjSearchFilter(fieldToSearch, null, 'is',valueToSearch);

			// return columns
			columns[0] = new nlobjSearchColumn('internalid');

			// perform search
			results = nlapiSearchRecord(table, null, filters, columns);

			if(results != null)
			{
				for (var i = 0; i < results.length; i++)
				{
					internalIDs[i] = results[i].getValue('internalid');
				}
				internalIDs.sort(compare);
			}
		}
		catch(e)
		{
			errorHandler("Library: genericSearchArray", e);
		}
		return internalIDs;
	}

	/**
	 * generic search with two params - returns array of internal IDs
	 */
	function genericSearchArrayTwoParams(table, field1ToSearch, value1ToSearch, field2ToSearch, value2ToSearch)
	{
		var internalIDs = new Array();
		// Arrays
		var filters = new Array();
		var columns = new Array();
		var results = null;

		try
		{
			//search filters
			filters[0] = new nlobjSearchFilter(field1ToSearch, null, 'is', value1ToSearch);
			filters[1] = new nlobjSearchFilter(field2ToSearch, null, 'is', value2ToSearch);
			// return columns
			columns[0] = new nlobjSearchColumn('internalid');
			// perform search
			results = nlapiSearchRecord(table, null, filters, columns);

			if(results != null)
			{
				for (var i = 0; i < results.length; i++)
				{
					internalIDs[i] = results[i].getValue('internalid');
				}

				internalIDs.sort(compare);
			}
		}
		catch(e)
		{
			errorHandler("Library: genericSearchArrayTwoParams", e);
		}
		return internalIDs;
	}

	/**
	 * generic search with two params - returns array of internal IDs
	 */
	function genericSearchArrayThreeParams(table, field1ToSearch, oper1, value1ToSearch, field2ToSearch, oper2, value2ToSearch, field3ToSearch, oper3, value3ToSearch)
	{
		var retVal = new Array();
		// Arrays
		var filters = new Array();
		var columns = new Array();
		var results = null;

		try
		{
			//search filters
			filters[0] = new nlobjSearchFilter(field1ToSearch, null, oper1, value1ToSearch);
			filters[1] = new nlobjSearchFilter(field2ToSearch, null, oper2, value2ToSearch);
			filters[2] = new nlobjSearchFilter(field3ToSearch, null, oper3, value3ToSearch);

			// return columns
			columns[0] = new nlobjSearchColumn('internalid');

			// perform search
			results = nlapiSearchRecord(table, null, filters, columns);

			if(results != null)
			{
				for (var i = 0; i < results.length; i++)
				{
					retVal[i] = results[i].getValue('internalid');
				}
			}
		}
		catch(e)
		{
			errorHandler("Library: genericSearchArrayTwoParams", e);
		}
		return retVal;
	}

	/**
	 * generic search with filter object array passed as parameter
	 *
	 * @param Array of nlobjSearchFilter objects
	 * @returns Array of internal IDs
	 */
	function genericSearchArrayWithFilterObj(table, filters)
	{

		// Arrays
		var columns = new Array();
		var retVal = null;

		try
		{
			// return columns
			columns[0] = new nlobjSearchColumn('internalid');
			// perform search
			retVal = nlapiSearchRecord(table, null, filters, columns);

		}
		catch(e)
		{
			errorHandler("Library: genericSearchArrayWithFilterObj", e);
		}
		return retVal;
	}

	/**
	 * Creates the  Random part of the GUID
	 * @returns {String} hexadecimal
	 */
	function randomNumGen()
	{
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
	 * Creates a date and time stamp string from a JS Date object
	 *
	 * @param {Date} date
	 * @returns {String}
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
	 * Clears all lines on sublist - for use in a client-side script
	 *
	 * @param sublist {String}
	 * @returns void
	 */
	function removeAllLineItemsClient(sublist)
	{
		var lineCount = null;

		try
		{
			lineCount = nlapiGetLineItemCount(sublist);

			for (var i = lineCount; i >= 1; i--)
			{
				nlapiRemoveLineItem(sublist, i);
			}
		}
		catch(e)
		{
			alert("Library: removeAllLineItemsClient" + e.message);
		}
	}

	/**
	 * Adds the specified number of days to the date parameter, then returns the new date.
	 *
	 * @param {Date} date
	 * @param {Integer} noOfDays
	 *
	 * @return {String} retVal
	 */
	function addDaysToDate (date, noOfDays)
	{
		var jsDate = null;
		var dateAddition = null;
		var retVal = null;

		try
		{
			jsDate = nlapiStringToDate (date);
			dateAddition = nlapiAddDays (jsDate, noOfDays);
			retVal = nlapiDateToString (dateAddition);
		}
		catch (e)
		{
			errorHandler("Library: addDaysToDate", e);
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

			jsDate = nlapiStringToDate (date);

			day = jsDate.getDate ();
			month = jsDate.getMonth ();
			year = jsDate.getFullYear ();

			retVal = getDateSuffix (day) + " " + dateMonths [month] + " " + year;
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
	 * Generic search - returns internal ID
	 *
	 * @param {String} table
	 * @param {String} fieldToSearch
	 * @param {String} valueToSearch
	 *
	 * @return {Integer] retVal - internal id
	 */
	function genericSearchNumeric(table, fieldToSearch, valueToSearch)
	{
		var retVal = 0;
		var searchResults = null;

		// Arrays
		var searchFilters = new Array();
		var searchColumns = new Array();

		try
		{
			//search filters
			searchFilters[0] = new nlobjSearchFilter(fieldToSearch, null, 'equalto',valueToSearch);

			// return columns
			searchColumns[0] = new nlobjSearchColumn('internalid');

			// perform search
			searchResults = nlapiSearchRecord(table, null, searchFilters, searchColumns);

			if(searchResults!=null)
			{
				if(searchResults.length>0)
				{
					retVal = searchResults[0].getValue('internalid');
				}
			}
		}
		catch(e)
		{
			errorHandler("Library: genericSearchNumeric", e);
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
		var invoiceSearchFilters = new Array();
		var invoiceSearchColumns = new Array();
		var itemSearchResults = null;

		try
		{
			//search filters
			invoiceSearchFilters[0] = new nlobjSearchFilter(fieldToSearch1, null, operator1 ,valueToSearch1);
			invoiceSearchFilters[1] = new nlobjSearchFilter(fieldToSearch2, null, operator2 ,valueToSearch2);

			// return columns
			invoiceSearchColumns[0] = new nlobjSearchColumn('internalid');

			// perform search
			itemSearchResults = nlapiSearchRecord(table, null, invoiceSearchFilters, invoiceSearchColumns);

			if(itemSearchResults!=null)
			{
				if(itemSearchResults.length>0)
				{
					retVal = itemSearchResults[0].getValue('internalid');
				}
			}
		}
		catch(e)
		{
			errorHandler("Library: genericSearchTwoParamsTwoOperators", e);
		}
		return retVal;
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
	 * Extract namespace
	 *
	 * @param {XML} theXML
	 * @return {String} retVal
	 */
	function getXMLNamespacePrefix(theXML)
	{
		var retVal = '';
		var xmlDoc = null;
		var	order = null;
		var nodeName = '';
		var pos = 0;

		try
		{
			xmlDoc = nlapiStringToXML(theXML);
			order = nlapiSelectNode(xmlDoc, '//*[local-name()="ORDER"]');		// [todo] node name into this routine
			nodeName = order.nodeName;
			pos = nodeName.indexOf(':');
			
			if(pos!=-1)
			{
				retVal = nodeName.substring(0,pos);
			}
		}
		catch (e)
		{
			errorHandler("Library: getXMLNamespacePrefix", e);
		}
		return retVal;
	}


	/**
	 * get netsuite useable date
	 */
	function getDate(dateStr)
	{
		var retVal = null;
		var day=0;
		var month=0;
		var year = '';
		var newDate='';

		try
		{
			year = dateStr.substring(6, 10);
			month = dateStr.substring(3, 5);
			day = dateStr.substring(0, 2);

			month = month.replace(/\b0(?=\d)/g, '');
			day = day.replace(/\b0(?=\d)/g, '');

			newDate = day + "/" + month + "/" + year;
			retVal =  newDate;
		}
		catch(e)
		{
			errorHandler('Library: getDate', e);
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
	function replaceAll(inputString,stringToReplace,stringToReplaceWith)
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
			lineCount = record.getLineItemCount(sublist);

			for (var i = lineCount; i >= 1; i--)
			{
				record.removeLineItem(sublist, i);
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
		var retVal = '';

		try
		{
			date = dateStr.split(sep);

			if(!parseInt(date[1]) > 12)
			{
				retVal = date[1] + sep + date[0] + sep + date[2];
			}
			else
			{
				retVal = 'N/A';
			}
		}
		catch(e)
		{
			errorHandler('Library: removeAllLineItems', e);
		}
		return retVal;
	}

	/**
	 * generic search for text rather than internal ID
	 */
	function genericSearchText(table, fieldToSearch, valueToSearch)
	{
		var retVal = 0;
		var searchFilters = new Array();
		var searchColumns = new Array();
		var searchResults = null;
		
		try
		{
			searchFilters[0] = new nlobjSearchFilter('formulatext', null, 'is', valueToSearch).setFormula('{' + fieldToSearch + '}');
			searchColumns[0] = new nlobjSearchColumn('internalid');

			searchResults = nlapiSearchRecord(table, null, searchFilters, searchColumns);

			if(searchResults!=null)
			{
				if(searchResults.length>0)
				{
					retVal = searchResults[0].getValue('internalid');
				}
			}
		}
		catch(e)
		{
			errorHandler("Library: genericSearchText", e);
		}
		return retVal;
	}

	/**
	 * Lookup parameters
	 */
	function lookUpParameters(category, paramName)
	{
		var retVal = null;
		var internalID = 0;
		var paramValue = '';
		var paramFormID = 0;
		
		try
		{
			internalID = genericSearchTwoParams('customrecord_deploymentparameters', 'custrecord_parametercategory', category, 'name', paramName);
			paramValue = nlapiLookupField('customrecord_deploymentparameters', internalID, 'custrecord_deploymentparametervalue');
			paramFormID = nlapiLookupField('customrecord_deploymentparameters', internalID, 'custrecord_formname');
			
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
	 * Filters the array and returns values that are only unique, no duplicates returned
	 *
	 * usage: sortedArray = nonSortedArray.filter(sortByUniqueOnly);
	 * example: [1, 2, 3, 1, 2]
	 * returns: [1, 2, 3]
	 *
	 * @param value
	 * @param index
	 * @param self
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
	 * Display a NetSuite "Heads Up" notification.
	 *
	 * @param {String} dialogType - Either:
	 * 	<ul>
	 * 		<li>confirmation</li>
	 * 		<li>information</li>
	 * 		<li>warning</li>
	 * 		<li>error</li>
	 * 	</ul>
	 * @param {String} message - The message to display.
	 * @param {String} title [optional] - Name to prefix message title with.
	 * @param {Function} callback [optional] - A callback function to run after the dialog has been displayed.
	 * @since 1.4.0.
	 */
	function notify(dialogType, message, title, callback)
	{
		var dialogTitle = "";
		var dialogHTML = '<div class="[CLASS]" width="100%">' +
		'<div class="icon [ICON_CLASS]"></div>' +
		'<div class="content"><div class="title">[TYPE_TITLE]</div>' +
		'[CONTENT]' +
		'</div></div>';
		var dialogClass = 'uir-alert-box [TYPE] session_confirmation_alert';
		var dialogContentHTML = '<div class="descr">[MESSAGE]</div>';
		var elements = [];
		var element = null;
		
		try
		{
			if(dialogType && typeof dialogType === "string")
			{
				dialogTitle = title || dialogType.charAt(0).toUpperCase() + dialogType.slice(1, dialogType.length);
				
				switch(dialogType.toLowerCase())
				{
					case "confirmation":
						dialogClass = dialogClass.replace(new RegExp("\\[TYPE\\]"), "confirmation ");
						dialogHTML = dialogHTML.replace(new RegExp("\\[ICON_CLASS\\]"), "confirmation ");
						dialogHTML = dialogHTML.replace(new RegExp("\\[TYPE_TITLE\\]"), "Confirmation");
						break;
					case "information":
						dialogClass = dialogClass.replace(new RegExp("\\[TYPE\\]"), "info");
						dialogHTML = dialogHTML.replace(new RegExp("\\[ICON_CLASS\\]"), "info");
						dialogHTML = dialogHTML.replace(new RegExp("\\[TYPE_TITLE\\]"), dialogTitle);
						break;
					case "warning":
						dialogClass = dialogClass.replace(new RegExp("\\[TYPE\\]"), "warning");
						dialogHTML = dialogHTML.replace(new RegExp("\\[ICON_CLASS\\]"), "warning");
						dialogHTML = dialogHTML.replace(new RegExp("\\[TYPE_TITLE\\]"), dialogTitle);
						break;
					case "error":
						dialogClass = dialogClass.replace(new RegExp("\\[TYPE\\]"), "error");
						dialogHTML = dialogHTML.replace(new RegExp("\\[ICON_CLASS\\]"), "error");
						dialogHTML = dialogHTML.replace(new RegExp("\\[TYPE_TITLE\\]"), dialogTitle);
						break;
				}
				
				//always do this
				dialogContentHTML = dialogContentHTML.replace(new RegExp("\\[MESSAGE\\]"), message || "");
				dialogHTML = dialogHTML.replace(new RegExp("\\[CLASS\\]"), dialogClass);
				dialogHTML = dialogHTML.replace(new RegExp("\\[CONTENT\\]"), dialogContentHTML);
				
				// if there is no existing alert section, add it.
				if(!jQuery("#div__alert").length)
				{
					jQuery("#body").prepend('<div id="div__alert"></div>');
				}
				
				// if same type of notification already appears and has the same title as the new notification.
				if(jQuery("div." + dialogClass.split(" ").join(".")).length)
				{
					elements = jQuery("div." + dialogClass.split(" ").join("."));
					
					jQuery.each(elements, function(index, value)
					{
						if(elements.eq(index).find("div.content div.title").text() == title)
						{
							element = elements.eq(index);
						}
					});
				}
					
				if(element)
				{
					// add message to existing notification.
					element.find("div.content").append(dialogContentHTML);
				}
				else
				{
					// show new notification.
					jQuery('#div__alert').append(dialogHTML);
				}
			}
		}
		catch(e)
		{
			errorHandler("Library: notify", e);
		}
	}

	/**
	 * Checks to see if the account is one world.
	 *
	 * @return {Boolean} Boolean indication of whether account is one world.
	 */
	function isOneWorld()
	{
		var context = null;
		var retVal = false;
		
		try
		{
			context = nlapiGetContext();
			
			retVal = context.getFeature("SUBSIDIARIES");
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
				fieldValues = nlapiLookupField("subsidiary", subsidiaryId, ["tranprefix", "name"]); // API GOV: 5 units.
				
				retVal = fieldValues["tranprefix"] || fieldValues["name"];
			}
			else if(!subsidiaryId)
			{
				throw nlapiCreateError("NO_SUBSIDIARY", "No subsidiary was supplied to get the prefix of.");
			}
			else if(!isOneWorld())
			{
				throw nlapiCreateError("NOT_ONE_WORLD", "You have attempted to get the Subsidiary prefix in an account where Subsidiaries are not enabled.");
			}
		}
		catch (e)
		{
			errorHandler("Library: getSubsidiaryPrefix", e);
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
		var filters = [];
		var columns = [];
		var results = null;
		var recordssMap = {};
		
		var recordsArray = [];
		
		try
		{
			// search all subsidiaries.
			columns =	[
					 		new nlobjSearchColumn("parent")
					 	];
			
			results = nlapiSearchRecord(recordType, null, filters, columns); // API GOV: 10 units.
			
			// set parent subsidiaries as object identifiers.
			for(var i = 0; results && i < results.length; i++)
			{
				if(!results[i].getValue("parent"))
				{
					recordssMap[results[i].getId()] = {};
				}
			}
			
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
						records[recordId][results[i].getId()] = {};
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
	 * Get the numeric internal id of a Deployment record.
	 *
	 * @param {String} deploymentId - The deployment id to find.
	 * @return {Number} The internal id of the deployment record.
	 */
	function getScriptDeploymentInternalId(deploymentId)
	{
		var filters = [];
		var columns = [];
		var results = null;
		
		var retVal = 0;
		
		try
		{
			filters =	[
					   		new nlobjSearchFilter("scriptid", null, "is", deploymentId)
						];
			
			columns =	[
							// no columns.
						];
			
			results = nlapiSearchRecord("scriptdeployment", null, filters, columns); // API GOV: 10 units.
			
			if(results && results.length > 0)
			{
				retVal = results[0].getId();
			}
		}
		catch(e)
		{
			errorHandler("Library: getScriptDeploymentInternalId", e);
		}
		
		return retVal;
	}

	/**
	 * Convert JSON to XML string.
	 *
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
	 *
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
				xml = nlapiStringToXML(xml);
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
	 * Get the name of a record dependent on rename records screen.
	 *
	 * @param {String} recordType - The internal id of the record type.
	 * @return {String} The name of the record.
	 */
	function getRecordName(recordType)
	{
		var context = null;
		
		var recordName = "";
		
		try
		{
			context = nlapiGetContext();
			
			recordName = context.getPreference("NAMING_" + recordType.toUpperCase());
			
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
	 * Add parameter to url.
	 *
	 * @param {String} url - The url to add the parameter to.
	 * @param {String} identifier - The identifier of the parameter.
	 * @param {String | Number} value - The value of the parameter.
	 * @return {String} The url with the parameter added.
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
	 *
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
	 *
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
	 *
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
	 *
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
			errorHandler("Library: name", e);
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
	 * Sends a email
	 *
	 * @param {String} Sender
	 * @param {Array} emailRecipients
	 * @param {String} subjust
	 * @param {String} message
	 *
	 * @return {Boolean} sendEmail
	 */
	function sendEmail(sender, emailRecipients, subject, message)
	{
		var sendEmail = false;
		
		try
		{
			if(!sender)
			{
				sender = nlapiGetUser();
			}
			
			nlapiSendEmail(sender, emailRecipients, subject, message);
			sendEmail = true;
		}
		catch(e)
		{
			errorHandler('Library: sendEmail', e);
		}

		return sendEmail;
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
			csvArray = CSV.replace(/"/g, "").replace(/'/g, "").split("\n");
			
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
	 * @scope Private
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
				csvHeaders.push(header);
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
	 * @scope Private
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
				for(var i = 0, length = jsonObject.length; i < length; i++)
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
	 * @scope Private
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
	 * Gets the client date time
	 *
	 * @param {String} savedSearch - internal id of saved search
	 * @returns {Object} - {date : "", time : ""}
	 */
	function getClientDateTime(savedSearch)
	{
		var search = null;
		var result = "";
		var splitResult = [];
		var searchResult = [];
		var retVal = {};
		
		try
		{
			search = nlapiSearchRecord('account', savedSearch, null, null);
			
			result = search[0].getValue("formuladatetime");

			splitResult = result.split(" ");
			
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
	 * @param comparisonValue {Boolean}
	 * @param whenTrue {Any}
	 * @param whenFalse {Any}
	 * @returns {Boolean}
	 *
	 * Usage: variable = ternary(value > 10, overTen, underTen);
	 * Usage: variable = ternary(value > 10, 'over', 'under');
	 * Usage: callbackObj = {callback: alert, parameters: 'Hello World!'}
	 * 		  variable = ternary(value > 10, callbackObj, 'under');
	 */
	function ternary(comparisonValue, whenTrue, whenFalse)
	{
		var returnValue = null;
		
		try
		{
			//If the comparisonValue is a function
			//comparisonValue will equal the result of that function
			if(typeof comparisonValue == 'function')
			{
				comparisonValue = comparisonValue();
			}
			//If the comparisonValue is an object
			//comparisonValue will equal the result of the callback with optional user defined parameters
			//User defined parameters can either be an Array or Object
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
			
			//If the comparisonValue is not boolean
			//comparisonValue will be converted to a boolean
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
			
			//If the returnValue is a function
			//returnValue will equal the result of that function
			if(typeof returnValue == 'function')
			{
				returnValue = returnValue();
			}
			//If the returnValue is an object
			//returnValue will equal the result of the callback with optional user defined parameters
			//User defined parameters can either be an Array or Object
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
			if(input == true)
			{
				retVal = "T";
			}
			else
			{
				retVal = "F";
			}
		}
		catch(e)
		{
			errorHandler("Library: booleanToCheckbox", e);
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
			if(input == "T")
			{
				retVal = true;
			}
			else
			{
				retVal = false;
			}
		}
		catch(e)
		{
			errorHandler("Library: checkboxToBoolean", e);
		}

		return retVal;
	}

	/**
	 * Starts a timer
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
			errorHandler("Library: startTimer", e);
		}
	}

	/**
	 * Gets the current time difference in miliseconds
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
			errorHandler("Library: getCurrentTimeDifference", e);
		}

		return retVal;
	}


	/**
	 * Stops the timer and returns the difference from the start to the end in miliseconds
	 */
	function stopTimer()
	{
		var retVal = null;
		var newDate = null;
		
		try
		{
			newDate = new Date();
			
			retVal = newDate.getTime() - this.date.getTime();
			
			this.date = null;
		}
		catch(e)
		{
			errorHandler("Library: stopTimer", e);
		}

		return retVal;
	}
	
	return {
		errorHandler: errorHandler
	,	getAllSearchResults: getAllSearchResults
	,	daysBetween: daysBetween
	,	dateDiff: dateDiff
	,	escapeString: escapeString
	,	sortByUniqueOnly: sortByUniqueOnly
	,	reduceString: reduceString
	,	isDateinRange: isDateinRange
	,	jsDateToNsDate: jsDateToNsDate
	,	genericSearchFourParams: genericSearchFourParams
	,	deleteAllRecords: deleteAllRecords
	,	deleteAllRecordsWithFilter: deleteAllRecordsWithFilter
	,	genericSearchBetween: genericSearchBetween
	,	lookupPostingPeriod: lookupPostingPeriod
	,	genericSearchColumnReturn: genericSearchColumnReturn
	,	encodeXML: encodeXML
	,	UNencodeXML: UNencodeXML
	,	checkGovernance: checkGovernance
	,	dealWithGovernance: dealWithGovernance
	,	genericSearchArrayThreeParams: genericSearchArrayThreeParams
	,	genericSearchArrayWithFilterObj: genericSearchArrayWithFilterObj
	,	randomNumGen: randomNumGen
	,	genericSearch: genericSearch
	,	removeAllLineItemsClient: removeAllLineItemsClient
	,	dateFormat: dateFormat
	,	getDateSuffix: getDateSuffix
	,	genericSearchNumeric: genericSearchNumeric
	,	genericSearchTwoParamsTwoOperators: genericSearchTwoParamsTwoOperators
	,	getRecordName: getRecordName
	,	splitOutValue: splitOutValue
	,	replaceAll: replaceAll
	,	removeAllLineItems: removeAllLineItems
	,	convertDateDDMMToMMDD: convertDateDDMMToMMDD
	,	genericSearchText: genericSearchText
	,	lookupLineItem: lookupLineItem
	,	isOneWorld: isOneWorld
	,	getSubsidiaryPrefix: getSubsidiaryPrefix
	,	getRecordChildren: getRecordChildren
	,	getScriptDeploymentInternalId: getScriptDeploymentInternalId
	,	getURLParameters: getURLParameters
	,	extOpenWindow: extOpenWindow
	,	closeExt: closeExt
	,	dateConv: dateConv
	,	lookUpParameters: lookUpParameters
	,	genericSearchJSON: genericSearchJSON
	,	lookupAddressInfo: lookupAddressInfo
	,	genericSearchArrayTwoParams: genericSearchArrayTwoParams
	,	getDate: getDate
	,	createDateTimeStamp: createDateTimeStamp
	,	notify: notify
	,	jsonToXML: jsonToXML
	,	xmlToJSON: xmlToJSON
	,	addURLParameter: addURLParameter
	,	getURLParameter: getURLParameter
	,	genericSearchTwoParams: genericSearchTwoParams
	,	nsDateToJsDate: nsDateToJsDate
	,	populateSelectFields: populateSelectFields
	,	genericSearchArray: genericSearchArray
	,	addDaysToDate: addDaysToDate
	,	getXMLNamespacePrefix: getXMLNamespacePrefix
	,	sendEmail: sendEmail
	,	JSONToCSV: JSONToCSV
	,	CSVToJSON: CSVToJSON
	,	getClientDateTime: getClientDateTime
	,	ternary: ternary
	,	booleanToCheckbox: booleanToCheckbox
	,	checkboxToBoolean: checkboxToBoolean
	,	startTimer: startTimer
	,	getCurrentTimeDifference: getCurrentTimeDifference
	,	stopTimer: stopTimer
	,	checkDate: checkDate
	};
})();
