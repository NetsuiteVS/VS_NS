/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/ui/serverWidget', 'N/format'],
function(record, serverWidget, nFormat) {
	 /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onGetRequest(context) {
    	var form = serverWidget.createForm({
    		title : 'Partial Amount',
    		hideNavBar: true
    	});
    	var field = form.addField({
    		id : 'custpage_amount',
    		type : serverWidget.FieldType.CURRENCY,
    		label : 'Amount'
    	});
    	field.isMandatory = true;
    	var iouField = form.addField({
    		id : 'custpage_iou',
    		type : serverWidget.FieldType.TEXT,
    		label : 'IOU'
    	});
    	iouField.defaultValue = context.request.parameters.iou;
    	iouField.updateDisplayType({ displayType : serverWidget.FieldDisplayType.HIDDEN});
    	form.addSubmitButton({
    		label : 'Submit'
    	});
    	context.response.writePage(form);
    }

	 /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onPostRequest(context) {
    	var partialdate = null;
    	var convertedpartialdate = null;
    	var splitDate = null;
    	
    	try {
    		
    		partialdate = new Date();
    		convertedpartialdate = nFormat.format({"value" : partialdate, "type" : nFormat.Type.DATE});
    		
    		record.submitFields({
    			type: 'customtransaction_tsa_iou2',
    			id: context.request.parameters.custpage_iou,
    			values: {
    				custbody_tsa_partamtrec: context.request.parameters.custpage_amount,
    				custbody_tsapartialreturndate: convertedpartialdate
    			},
    			options: {
    				enableSourcing: false,
    				ignoreMandatoryFields : true
    			}
    		});
		} catch (e) {
			log.error({
				title : "Error Saving IOU",
				details : JSON.stringify(e)
			});
			//context.response.write( JSON.stringify(e) );
		}finally{
			context.response.writeLine({
        		output: "<script>(function closePopup(a){null!=parent.Ext.WindowMgr.getActive()?parent.Ext.WindowMgr.getActive().close():window.popupObj&&window.popupObj.isShowing?window.popupObj.close(a):window.parent.popupObj&&window.parent.popupObj.isShowing?window.parent.popupObj.close(a):\"undefined\"!=typeof opener&&null!=opener&&window.close()}());</script>"
        	});
		}
    }

    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	if(context.request.method == 'GET'){
    		onGetRequest(context);
    	}else{
    		onPostRequest(context);
    	}
    }

    return {
        onRequest: onRequest
    };
});