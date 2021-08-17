/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search','N/translation'],
/**
 * @param {search} search
 */
function(search,translation) {

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

    	if(scriptContext.fieldId != "custbody22") return true;

    	var selectedIOU = scriptContext.currentRecord.getValue({ fieldId : "custbody22" });
    	if(!selectedIOU) return true;

    	var iouLookUp = search.lookupFields({
    		type: "customtransaction_tsa_iou2",
    		id: selectedIOU,
    		columns: "custbody32"
    	});
    	console.log("Found:" + iouLookUp.custbody32[0].value);
    	var recordId = scriptContext.currentRecord.id || "";
		if( iouLookUp.custbody32[0].value != recordId && iouLookUp.custbody32[0].value ){
          
          //MSG_ADV_ALLOCATED
          	var msg = translation.get({collection: 'custcollection__tsa_collection_01', key: 'MSG_ADV_ALLOCATED', locale: translation.Locale.CURRENT })();
			alert(msg);
    		scriptContext.currentRecord.setValue({ fieldId : "custbody22", value : null });
    		return false;
		}
		return true;
    }

    return {
        validateField: validateField
    };
});
