/****************************************************************************************
 * Name:		Get Project Segments (getProjectSegments.js)
 *
 * Script Type:	RESTlet
 **
 * Purpose:		Get list of project segments.
 *
 * Script:		customscript_getprojectsegments
 * Deploy:		customdeploy_getprojectsegments
 *
 * Notes: ****************************************************************************************/

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
                    searchResults.push(result);
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
