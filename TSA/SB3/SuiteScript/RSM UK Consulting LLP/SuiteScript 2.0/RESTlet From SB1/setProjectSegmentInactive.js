/****************************************************************************************
 * Name:		Set Project Segment Inactive (setProjectSegmentInactive.js)
 *
 * Script Type:	RESTlet
 *
 * Version:		1.0.0 - 05/09/2018 - Initial Release - LM
 *
 * Author:		RSM
 *
 * Purpose:		Update a Project Segment custom record and set Inactive checkbox field to true.
 *
 * Script:		customscript_setprojectsegmentinactive
 * Deploy:		customdeploy_setprojectsegmentinactive
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
define(["N/record", "./Library.FHL.2.0"],
/**
 * @param {record} record
 */
function(nRecord, Library) {

    /**
     * Function called upon sending a POST request to the RESTlet.
     *
     * @since 1.0.0
     * @public
     * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
     * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     */
    function setProjectSegmentInactive(requestBody)
    {
    	var recordId = "";

    	try
    	{
    		recordId = nRecord.submitFields({
    			type : "customrecord_cseg_tsa_project",
    			id : requestBody.id,
    			values : {
    				"isinactive" : true
    			}
    		});
    	}
    	catch(e)
    	{
    		Library.errorHandler("setProjectSegmentInactive", e);
    	}

    	return recordId;
    }

    return {
        post: setProjectSegmentInactive
    };

});
