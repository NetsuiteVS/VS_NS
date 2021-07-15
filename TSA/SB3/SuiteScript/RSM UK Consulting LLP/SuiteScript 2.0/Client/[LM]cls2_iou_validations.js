/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([], function() {

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
    	var objField = scriptContext.currentRecord.getField({
    		fieldId: 'custbody_tsa_linemessage'
    	});
    	var lc = scriptContext.currentRecord.getLineCount({sublistId: "line"});
    	if(lc > 1){
    		alert(objField.label);
    		return false;
    	}
      console.log("lines:" + lc);
    	return true;
    }

    return {
        saveRecord: iouSaveRecord
    };
});
