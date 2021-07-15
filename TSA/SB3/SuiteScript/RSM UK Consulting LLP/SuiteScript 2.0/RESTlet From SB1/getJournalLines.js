/****************************************************************************************
 * Name:		Get Journal Lines (getJournalLines.js)
 *
 * Script Type:	RESTlet
 *
 * Version:		1.0.0 - 05/10/2018 - Initial Release - LM
 *
 * Author:		RSM
 *
 * Purpose:		Get List of Journal Entry lines from Search.
 *
 * Script:		customscript_getjournallines
 * Deploy:		customdeploy_getjournallines
 *
 * Notes:
 *
 * Libraries: 	Library.FHL.2.0
 ****************************************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/runtime', './Library.FHL.2.0'],
/**
 * @param {search} Search
 * @param {runtime} Runtime
 */
function(Search, Runtime, Library)
{
	'use strict';

    /**
     * Function called upon sending a GET request to the RESTlet.
     *
     * @since 1.0.0
     * @public
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     */
    function getJournalLines(requestParams)
    {
    	var journalSearch = null;
    	var runSearch = null;
    	var returnString = '';
    	var lineString = '';
    	var lineArray = [];
    	var cellString = '';
    	var objScript = null;
    	var searchId = '';
    	var columns = [];
    	var idFilter = null;
    	var projectFilter = null;

    	try
    	{
    		objScript = Runtime.getCurrentScript();
    		searchId = objScript.getParameter({ name : 'custscript_journalsearch' });

    		journalSearch = Search.load({ id : searchId });
    		columns = journalSearch.columns;

    		if(requestParams.fromid)
    		{
    			idFilter = Search.createFilter({
    				name : 'internalidnumber',
    				operator : Search.Operator.GREATERTHANOREQUALTO,
    				values : requestParams.fromid
    			});

    			journalSearch.filters.push(idFilter);
    		}

    		if(requestParams.project)
    		{
    			projectFilter = Search.createFilter({
    				name : 'custcol_cseg_tsa_project',
    				operator : Search.Operator.ANYOF,
    				values : requestParams.project
    			});

    			journalSearch.filters.push(projectFilter);
    		}

    		runSearch = journalSearch.run();

    		runSearch.each(function(result){

    			lineArray = [];

    			cellString = '';

    			for(var x in columns)
    			{
    				cellString = result.getText(columns[x]);

    				if(!cellString || cellString === '')
    				{
    					cellString = result.getValue(columns[x]);
    				}

    				cellString = '"' + cellString + '"';

    				lineArray.push(cellString);
    			}

    			returnString += lineArray.join(',');

    			returnString += '\r\n';

    			return true;
    		});
    	}
    	catch(e)
    	{
    		Library.errorHandler("getJournalLines", e);
    	}

    	return returnString;
    }

    return {
        'get': getJournalLines,
    };

});
