/****************************************************************************************
 * Name:		Get Project Segments (getProjectSegments.js)
 *
 * Script Type:	RESTlet
 *
 * Version:		1.0.0 - 05/09/2018 - Initial Release - LM
 * 				1.0.1 - 20/09/2018 - Added isinactive column in saved search results - LM
 *
 * Author:		RSM
 *
 * Purpose:		Get list of project segments.
 *
 * Script:		customscript_getprojectsegments
 * Deploy:		customdeploy_getprojectsegments
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
define(['N/search'], //, './Library.FHL.2.0'
/**
 * @param {search} search
 */
function(nSearch) { //, Library

    /**
     * Function called upon sending a GET request to the RESTlet.
     *
     * @since 1.0.0
     * @public
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     */
    function getProjectSegments(requestParams)
    {
    	var recordSearch = null;
    	var runSearch = null;
    	var searchResults = [];

    	try
    	{
    		recordSearch = nSearch.create({
    			type : 'customrecord_cseg_tsa_project',
    			columns : ['name', 'parent', 'isinactive', 'custrecord_cseg_tsa_project_n101']
    		});

            var recordSearchPaged = recordSearch.runPaged({ pageSize: 1000 });
            recordSearchPaged.pageRanges.forEach(function (page_range) {

                var recordPage = recordSearchPaged.fetch({ index: page_range.index });
                recordPage.data.every(function (result) {

                    var resultJSON = JSON.parse(JSON.stringify(result));

                    resultJSON.values.name = resultJSON.values.name.replace(/"/g, ' ').replace(/\\/g, ' ');
                    resultJSON.values.custrecord_cseg_tsa_project_n101[0].text = resultJSON.values.custrecord_cseg_tsa_project_n101[0].text.replace(/"/g, ' ').replace(/\\/g, ' ');

                    searchResults.push(resultJSON);
                    return true;
                });
                return true;
            });
    	}
    	catch(e)
    	{
    		log.error('getProjectSegments', e);
    	}

    	return searchResults;
    }

    return {
        'get': getProjectSegments
    };

});
