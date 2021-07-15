/****************************************************************************************
 * Name:		Get Currency Rates (getCurencyRates.js)
 *
 * Script Type:	RESTlet
 *
 * Date:		12/03/2019 
 *
 * Author:		Viktor Schumann 
 *
 * Purpose:		Get List of Currency Exchange Rates of Currencies required in restlet call parameters.
 *
 
 ****************************************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/runtime'],
/**
 * @param {search} Search
 * @param {runtime} Runtime
 */
function(search, runtime)
{
	
	function getCurrencyList(currencies, base_prm, source_prm, base_filter, source_filter, currency_symbols){
				
		var currencySearchObj = search.create({
		   type: "currency",
		   filters: [],
		   columns:
		   [
			  search.createColumn({name: "internalid", label: "internalid"}),
			  search.createColumn({name: "name", label: "name"}),
			  search.createColumn({name: "symbol", label: "symbol"}),
			  search.createColumn({name: "exchangerate", label: "exchangerate"}),
		   ]
		});
		var searchResultCount = currencySearchObj.runPaged().count;
		log.debug("Hive Currency Restlet","currencySearchObj result count="+searchResultCount);
		currencySearchObj.run().each(function(result){
		   // .run().each has a limit of 4,000 results
		   currencies.push(result);
		   //log.debug("Hive Currency Restlet", " name="+result.getValue("name")+" | base_prm="+base_prm);
		   if(base_prm.indexOf(result.getValue("name")) > -1){
				log.debug("Hive Currency Restlet", " ****** Found !!! ******** name="+result.getValue("name")+" | internalid="+result.getValue("internalid")+" | base_prm="+base_prm);
				//base_filter+='"'+result.getValue('internalid')+'",';
				base_filter.push(result.getValue("internalid"));
		   }
		   if(source_prm.indexOf(result.getValue("name")) > -1){
				log.debug("Hive Currency Restlet", " ****** Found !!! ******** name="+result.getValue("name")+" | internalid="+result.getValue("internalid")+" | source_prm="+source_prm);
				//source_filter+='"'+result.getValue('internalid')+'",';
				source_filter.push(result.getValue("internalid"));
		   }
		   
		   currency_symbols[result.getValue("internalid")]=result.getValue("symbol");

		   //log.debug("Hive Currency Restlet"," All result="+JSON.stringify(result) );

		   return true;
		});
	}

	
    /**
     * Function called upon sending a GET request to the RESTlet.
     *
     * @since 1.0.0
     * @public
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     */
    function getCurrencyRates(requestParams)
    {
    	var currencySearch = null;
    	var runSearch = null;
    	var returnString = '';
    	var lineString = '';
    	var lineArray = [];
    	var cellString = '';
    	var objScript = null;
    	var searchId = '';
    	var columns = [];
		
    	var date_filter = null;
    	var base_filter = new Array();
		var source_filter = new Array();
		var currencies = new Array();
		var currency_symbols = new Array;
		

//    	try
//    	{
    		log.debug("Hive Currency Restlet","*** Hive Currency Restlet Started ***");
			
			var date_prm="";
			date_prm=requestParams.date;
			var base_prm=requestParams.base;
			var source_prm=requestParams.source;
			
			var search_filter= new Array;
			
			log.debug("Hive Currency Restlet","date="+date_prm+" | base="+base_prm+" | source="+source_prm);

			/*
			if( !base_prm || base_prm=="undefined" || !source_prm || base_prm=="undefined" ){
				log.debug("Hive Currency Restlet","Missing Parameter - exit");
				return "Missing Parameter";
			}
			*/
			
			getCurrencyList(currencies, base_prm, source_prm, base_filter, source_filter, currency_symbols);
			//log.debug(" currencies=", JSON.stringify(currencies) );
			log.debug("Hive Currency Restlet", " base_filter="+JSON.stringify(base_filter)+" | source_filter="+JSON.stringify(source_filter));

			
		//*************
			
			if(base_prm){
				search_filter.push(["basecurrency","anyof",base_filter]);
			}
			
			if(source_prm){
				if(base_prm) search_filter.push("AND");
				search_filter.push(["transactioncurrency","anyof",source_filter]);
			}
			
			date_prm=date_prm.replace(/-/gi,"/");
			
			if(Date.parse(date_prm) || date_prm=="today"){
				if(base_prm || source_prm) search_filter.push("AND");
				search_filter.push(["effectivedate","on", date_prm]);				
			}
			else if(date_prm=="latest" || !date_prm){
				// we can continue to the search and date will be handled in the search result processing
			}
			else{
				log.debug("Hive Currency Restlet","Missing Parameter - exit");
				return "Invalid DATE parameter = "+date_prm;
			}
			
			
			
			/*
						   [
				  ["basecurrency","anyof",base_filter], 
				  "AND", 
				  ["transactioncurrency","anyof",source_filter]
			   ]
			*/
			
			var currencyrateSearchObj = search.create({
			   type: "currencyrate",
			   filters: search_filter,
			   columns:
			   [
				  //search.createColumn({name: "internalid", label: "Internal ID"}),
				  search.createColumn({name: "basecurrency", label: "Base Currency"}),
				  search.createColumn({name: "transactioncurrency", label: "Transaction Currency"}),
				  search.createColumn({name: "exchangerate", label: "Exchange Rate"}),
				  search.createColumn({
					 name: "effectivedate",
					 sort: search.Sort.DESC,
					 label: "Effective Date"
				  })
			   ]
			});
			
			
			var searchResultCount = currencyrateSearchObj.runPaged().count;
			log.debug("Hive Currency Restlet","currencyrateSearchObj result count"+searchResultCount);

			var date_y = "";
			var y=0;
			var return_object = [];
			var return_date;
			columns = currencyrateSearchObj.columns;
			currencyrateSearchObj.run().each(function(result){
			   // .run().each has a limit of 4,000 results
			   //log.debug("Hive Currency Restlet", " rate="+result.getValue("exchangerate"));
			   
				//log.debug( "","result="+JSON.stringify(result) );
              
    			lineArray = [];
				line_array2 = [];
    			cellString = '';
				cells = [];
				var header = "";
				var exch_rate;
				var currency_x;
				
    			for(var x in columns)
    			{
    				header += columns[x].name+",";
					cellString = result.getText(columns[x]);
					
    				if(!cellString || cellString === '')
    				{
    					cellString = result.getValue(columns[x]);
    				}
					if(columns[x].name=="basecurrency" || columns[x].name=="transactioncurrency") cellString=currency_symbols[parseInt(cellString)];
					if(columns[x].name=="effectivedate" && date_y!=cellString && date_prm=="latest") {
						if(!return_date) return_date=cellString;
						date_y=cellString;
						y++; 
					}
					if(columns[x].name=="transactioncurrency") currency_x=cellString;
					if(columns[x].name=="exchangerate") exch_rate=cellString;
					
    				line_array2.push(cellString);
					
					cellString = '"' + cellString + '"';
    				lineArray.push(cellString);	
    			}
				var curr_obj={};
				curr_obj[currency_x]=1/parseFloat(exch_rate);
				
    			if( y==2 ) return false; // exiting from the each() loop since the date_prm was "latest" and currency symbol changed
				
				returnString += lineArray.join(',');
    			returnString += '\r\n';
				//return_object.push(line_array2);
				return_object.push(curr_obj);
				//returnString = header; //****** remove this 
				
				log.debug("Hive Currency Restlet"," y="+y);
				
				
    			return true;
				
			});
			
		
//    	}
//    	catch(e)
//    	{
//    		Library.errorHandler("getJournalLines", e);
//    	}

    	//return returnString; // "internalid,basecurrency,transactioncurrency,exchangerate,effectivedate,"
		//return_object="test";
		
		var obj2={};
		obj2["rates"]=return_object;
		obj2["base"]=base_prm;
		obj2["date"]=date_prm;
		return JSON.stringify(obj2);
		
    }

    return {
        'get': getCurrencyRates,
    };

});
