/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/translation'], function(translation) {

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function iouSaveRecord(scriptContext) {
    	//var objField = scriptContext.currentRecord.getField({ fieldId: 'custbody_tsa_linemessage'	});
		var msg = translation.get({collection: 'custcollection__tsa_collection_01', key: 'MSG_ONLY_ONE_LINE_ALLOWED', locale: translation.Locale.CURRENT })();
								
    	var lc = scriptContext.currentRecord.getLineCount({sublistId: "line"});
    	if(lc > 1){
    		alert(msg);
    		return false;
    	}
      console.log("lines:" + lc);
    	return true;
    }

    return {
        saveRecord: iouSaveRecord
    };
});
