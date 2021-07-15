/****************************************************************************************
 * Name:		Create Project Segment (createProjectSegment.js)
 *
 * Script Type:	RESTlet
 *
 * Version:		1.0.0 - 05/09/2018 - Initial Release - LM
 *
 * Author:		RSM
 *
 * Purpose:		Create a Project Segment custom record.
 *
 * Script:		customscript_createprojectsegment
 * Deploy:		customdeploy_createprojectsegment
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
define(["N/record"],
/**
 * @param {record} record
 */
function(nRecord) {

    /**
     * Function called upon sending a PUT request to the RESTlet.
     *
     * @since 1.0.0
     * @public
     * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
     * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     */
    function createProjectSegment(requestBody)
    {
    	var recordId = "";
    	var segmentRecord = null;

    	try
    	{
          	log.debug("*** create script started ***")
    		segmentRecord = nRecord.create({
    			type : "customrecord_cseg_tsa_project",
    		});

    		segmentRecord.setValue({
    			fieldId : "name",
    			value : requestBody.name
    		});

    		if(requestBody.parent.id)
    		{
    			segmentRecord.setValue({
        			fieldId : "parent",
        			value : requestBody.parent.id
        		});
    		}

    		if(requestBody.custrecord_cseg_tsa_project_n101)
    		{
    			segmentRecord.setValue({
        			fieldId : "custrecord_cseg_tsa_project_n101",
        			value : requestBody.custrecord_cseg_tsa_project_n101.id
        		});
    		}

    		recordId = segmentRecord.save();
    	}
    	catch(e)
    	{
    		log.debug("createProjectSegment", e);
            recordId = e.message;
    	}

    	return recordId;
    }

    return {
        put: createProjectSegment,
      	post: createProjectSegment
    };

});
