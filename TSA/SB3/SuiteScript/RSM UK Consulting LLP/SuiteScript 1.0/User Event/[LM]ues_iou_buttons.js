/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       15 Feb 2018     Leon Munir
 * 
 * 
 * !!!!!!!!!!!!!!!! Maybe this Script Utterly useless !!!!!!!!!!!!!!!! 
 * 
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function iouBeforeLoad(type, form, request)
{
	var journalentrySearch = null;
	var partialRecievedDate = null;
	var advanceID = null;
	
	advanceID = nlapiGetRecordId();
	
	journalentrySearch = nlapiSearchRecord("journalentry",null,
			[
			   ["type","anyof","Journal"], 
			   "AND", 
			   ["custbody_tsa_linked_iou","anyof", advanceID]
			], 
			[
			   new nlobjSearchColumn("mainline"), 
			   new nlobjSearchColumn("trandate").setSort(true)
			]
			);
	
	nlapiLogExecution('debug' , 'journalentrySearch', journalentrySearch);
	
	if(journalentrySearch)
	{
		// removed due to being suspicious on triggering the WF and aftersubmit event that resulted multiplicated advance journals
      // nlapiSubmitField('customtransaction_tsa_iou2', advanceID, 'custbody_tsapartialreturndate', journalentrySearch[0].getValue("trandate"), true); 
	}
	
	
	form.setScript("customscript_lm_cls_iou_transaction");
}
