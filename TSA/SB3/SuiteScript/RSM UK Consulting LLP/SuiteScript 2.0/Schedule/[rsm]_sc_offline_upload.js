/**********************************************************************************************************
 * Name:			Create journal ([rsm]_sc_offline_upload.js)
 * 
 * Script Type:		ScheduledScript
 * 
 * API Version:		2.0
 * 
 * Version:			1.0.0 - 01/01/2019 - Initial Development - KR
 * 
 * Author:			Krish
 * 
 * Script:			
 * Deploy:			
 * 
 * Purpose:			
 * 
 * Notes:			
 * 
 * Dependencies:	
 ***********************************************************************************************************/
/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['../../Library.FHL.2.0', 'N/record', 'N/runtime', 'N/search', 'N/task','N/format', '../../../vs_lib'],

function(Library, record, runtime, search, task, format, vs_lib) {
	
'use strict';

	var GROUP           = 'custrecord_tsa_ouu_group';
	var SUBSIDIARY      = 'custrecord_tsa_ouu_subsidiary';
	var DEPARTMENT      = 'custrecord_tsa_ouu_department';
	var UNIT	        = 'custrecord_tsa_ouu_unit';
	var PARTY			= 'custrecord_tsa_ouu_rp';
	var UNITTYPE 		= 'custrecord_tsa_ouu_unit_type';
	var RELPARTYTYPE    = 'custrecord_tsa_ouu_rp_type';
	var CURRENCY        = 'custrecord_tsa_ouu_currency';
	var CREDIT			= 'custrecord_tsa_ouu_credit';
	var DEBIT			= 'custrecord_tsa_ouu_debit';
	var MEMO            = 'custrecord_tsa_ouu_memo';
	var DATE			= 'custrecord_tsa_ouu_date';
	var TRANNAME        = 'custrecord_tsa_ouu_transaction_name';
	var ACCOUNT         = 'custrecord_tsa_ouu_account';
	var PROJECT         = 'custrecord_tsa_ouu_project'
	var RESERVE         = 'custrecord_tsa_ouu_reserve';
	var ERROR           = 'custrecord_tsa_ouu_error';
	var ERRORDESC       = 'custrecord_tsa_ouu_error_desc'
	var PROCESSED       = 'custrecord_tsa_ouu_processed';
	var LINKEDJOURNAL   = 'custrecord_tsa_ouu_lin_journal';
	var INTERNALID      = 'internalid';
	var DEPRECIATION    = 'custbody_tsa_depreciation_inprogress';
	
	var LINE			= 'line';
	var JSUBSIDIARY     = 'subsidiary';
	var JUNIT	        = 'class';
	var JMEMO           = 'memo';
	var JDEPARTMENT     = 'department';
	var JACCOUNT		= 'account';
	var JCREDIT			= 'credit';
	var JDEBIT			= 'debit';
	var JLINEPARTY      = 'custcol_cseg_tsa_relatedpar';

    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function offlineUpload(scriptContext) {
    	
      	try {
            var offlineUpload = search.create({
                   type: "customrecord_tsa_ouu_group",
                   filters:
                   [
                      ["isinactive","is","F"], 
                      "AND",
                      ["custrecord_tsa_ouu_error","is","F"], 
                      "AND", 
                      ["custrecord_tsa_ouu_processed","is","F"]
                   ],
                   columns:
                   [
                      search.createColumn({name: "custrecord_tsa_ouu_currency", summary: "GROUP"}), //search.createColumn({name: "custrecord_tsa_ouu_subsidiary", summary: "GROUP"}),
					  search.createColumn({name: "custrecord_tsa_ouu_unit", summary: "GROUP"}),
					  search.createColumn({name: "custrecord_tsa_ouu_date", summary: "GROUP"}),
                      search.createColumn({name: "custrecord_tsa_ouu_credit", summary: "SUM"}),
                      search.createColumn({name: "custrecord_tsa_ouu_debit", summary: "SUM"})
                   ]
                });

            var offlineResult    = offlineUpload.run().getRange({start: 0, end: 1000});
            for ( var i = 0; i < offlineResult.length; i++) {
                var subsidiary = null;
                //var subsidiary = offlineResult[i].getValue({name: 'custrecord_tsa_ouu_subsidiary', summary:'GROUP'});
                var currency = offlineResult[i].getValue({name: 'custrecord_tsa_ouu_currency', summary:'GROUP'});
				var unit	 = offlineResult[i].getValue({name: 'custrecord_tsa_ouu_unit', summary:'GROUP'});
				var date_ouu = offlineResult[i].getValue({name: 'custrecord_tsa_ouu_date', summary:'GROUP'});
                var credit	 = offlineResult[i].getValue({name: 'custrecord_tsa_ouu_credit', summary:'SUM'});
                var debit	 = offlineResult[i].getValue({name: 'custrecord_tsa_ouu_debit', summary:'SUM'});

                log.debug("offlineUpload "," currency="+currency+', unit='+unit+', credit='+credit+', debit='+debit+', date_ouu='+date_ouu);

                if(credit != debit){
                    markOfflineRecordError(subsidiary, currency, unit,date_ouu);
                }else{
                    createJournalForOffline(subsidiary, currency, unit,date_ouu);
                }

            }
        }
		catch (e) {
			vs_lib.createErrorLog(runtime.getCurrentScript().id, "", JSON.stringify(e), runtime.getCurrentUser().id, "Offline Upload Journal Entry");
    	}
    }
    
    /**
	 * Determines what type of unit the trade goes to.
	 * 
	 * @since 1.0.0 - RL
	 * @private
	 * @param {String} subsidiary, currency, unit
	 * @returns {String} jouID
	 */
	function createJournalForOffline(subsidiary, currency, unit,date_ouu){
		
		var offlineJournal = search.create({
			   type: "customrecord_tsa_ouu_group",
			   filters:
			   [
			      ["isinactive","is","F"], 
			      "AND",
			      ["custrecord_tsa_ouu_error","is","F"], 
			      "AND", 
			      ["custrecord_tsa_ouu_processed","is","F"],   // "AND", ["custrecord_tsa_ouu_subsidiary","anyof",subsidiary], 
			      "AND", 
			      ["custrecord_tsa_ouu_unit","anyof",unit], 
			      "AND", 
				  ["custrecord_tsa_ouu_currency","anyof",currency],
				  "AND", 
			      ["custrecord_tsa_ouu_date","on",date_ouu]				  
			   ],
			   columns:
			   [
                  search.createColumn({name: "internalid"}),
			      search.createColumn({name: "custrecord_tsa_ouu_subsidiary"}),
			      search.createColumn({name: "custrecord_tsa_ouu_department"}),
			      search.createColumn({name: "custrecord_tsa_ouu_unit"}),
			      search.createColumn({name: "custrecord_tsa_ouu_rp"}),
			      search.createColumn({name: "custrecord_tsa_ouu_currency"}),
			      search.createColumn({name: "custrecord_tsa_ouu_credit"}),
			      search.createColumn({name: "custrecord_tsa_ouu_debit"}),
			      search.createColumn({name: "custrecord_tsa_ouu_memo"}),
			      search.createColumn({name: "custrecord_tsa_ouu_transaction_name"}),
			      search.createColumn({name: "custrecord_tsa_ouu_account"}),
			      search.createColumn({name: "custrecord_tsa_ouu_date"})
			   ]
			});
		
		var journalLineResult    = offlineJournal.run().getRange({start: 0, end: 1000});
		log.debug("offline - journalResult", JSON.stringify(journalLineResult) );

    	for ( var k = 0; k < journalLineResult.length; k++) {
    		var internalid = journalLineResult[k].getValue({name: INTERNALID});
    		var subsidiary = journalLineResult[k].getValue({name: SUBSIDIARY});
    		var unit       = journalLineResult[k].getValue({name: UNIT});
    		var department = journalLineResult[k].getValue({name: DEPARTMENT});
    		var party      = journalLineResult[k].getValue({name: PARTY});
    		var currency   = journalLineResult[k].getValue({name: CURRENCY});
    		var credit     = journalLineResult[k].getValue({name: CREDIT});
    		var debit      = journalLineResult[k].getValue({name: DEBIT});
    		var memo       = journalLineResult[k].getValue({name: MEMO});
    		var account    = journalLineResult[k].getValue({name: ACCOUNT});
    		var tranDate   = journalLineResult[k].getValue({name: DATE});
    		
    		log.debug("offline - k=",k+', account='+account+', credit='+credit+', debit='+debit+', internalid='+internalid+', subsidiary='+subsidiary+', tranDate='+tranDate);
    		
    		if(k == 0){
    			var newJouRec = record.create({
    				type : record.Type.JOURNAL_ENTRY,
    				isDynamic: true 
				});

				
				newJouRec.setValue(JSUBSIDIARY, subsidiary);
				var posting_period = newJouRec.getValue({fieldId:"postingperiod"});
				log.debug("offline","postingperiod="+posting_period);
				var date_split=tranDate.split("/");
				var month = String( (parseInt(date_split[1].substring(0,1))*10+parseInt(date_split[1].substring(1,2)))-1); // month has to be 1 less; also we needed to handle the server javascript parseInt("08")=NaN issue 
				log.debug( "offline - trandate object","month="+month+" date_split[1]="+date_split[1] );
				var date_ok = new Date(date_split[2],month,date_split[0]);
				log.debug("offline - trandate object","json="+JSON.stringify( date_ok ));
				newJouRec.setValue({ fieldId:'trandate', value: date_ok });

    			newJouRec.setValue(DEPRECIATION, false);
    			//newJouRec.setValue(UNIT, unit);
				//newJouRec.setValue(PARTY, party);
				newJouRec.setValue("custbody_tsa_vs_ce_auto_generated", true);
    			
    			newJouRec.selectNewLine({sublistId : LINE});
    			newJouRec.setCurrentSublistValue({ sublistId:LINE, fieldId:JACCOUNT, value:account });
    			newJouRec.setCurrentSublistValue({
    	                sublistId : LINE,
    	                fieldId   : JCREDIT,
    	                value     :	credit
    	             });
    			newJouRec.setCurrentSublistValue({
                    sublistId : LINE,
                    fieldId   : JDEBIT,
                    value     : debit
                 });
    			newJouRec.setCurrentSublistValue({
    	                sublistId : LINE,
    	                fieldId   : JMEMO,
    	                value     : memo
    	             });
    			newJouRec.setCurrentSublistValue({
                    sublistId : LINE,
                    fieldId   : JDEPARTMENT,
                    value     : department
                 });
    			newJouRec.setCurrentSublistValue({
    				sublistId : LINE, 
    				fieldId   : JUNIT, 
    				value     : unit
    			});
    			newJouRec.setCurrentSublistValue({
    				sublistId : LINE, 
    				fieldId   : JLINEPARTY, 
    				value     : party
    			});
    			newJouRec.commitLine({sublistId : LINE});
    		}else if (k > 0){
    			newJouRec.selectNewLine({sublistId : LINE});
    			newJouRec.setCurrentSublistValue({
    					   sublistId : LINE,
    		               fieldId   : JACCOUNT,
    		               value     : account
    		            });
    			newJouRec.setCurrentSublistValue({
    	                sublistId : LINE,
    	                fieldId   : JCREDIT,
    	                value     :	credit
    	             });
    			newJouRec.setCurrentSublistValue({
                    sublistId : LINE,
                    fieldId   : JDEBIT,
                    value     : debit
                 });
    			newJouRec.setCurrentSublistValue({
    	                sublistId : LINE,
    	                fieldId   : JMEMO,
    	                value     : memo
    	             });
    			newJouRec.setCurrentSublistValue({
                    sublistId : LINE,
                    fieldId   : JDEPARTMENT,
                    value     : department
                 });
    			newJouRec.setCurrentSublistValue({
    				sublistId : LINE, 
    				fieldId   : JUNIT, 
    				value     : unit
    			});
    			newJouRec.setCurrentSublistValue({
    				sublistId : LINE, 
    				fieldId   : JLINEPARTY, 
    				value     : party
    			});
    			newJouRec.commitLine({sublistId : LINE});
    		}
    		if (k == journalLineResult.length - 1){
    			var jouID =  newJouRec.save();
    			markOfflineRecordAsProcessed(journalLineResult, jouID);
    	        log.debug({    
    	            title: 'journal record created successfully - Offline Upload', 
    	            details: 'New journalId:  ' + jouID
    	        });
    		}
    	}
	}
    
    /**
	 * Determines what type of unit the trade goes to.
	 * 
	 * @since 1.0.0 - RL
	 * @private
	 * @param {String} subsidiary, currency, unit
	 * @returns {String} jouID
	 */
	function markOfflineRecordError(subsidiary, currency, unit,date_ouu){
		
		var offlineUploadLine = search.create({
			   type: "customrecord_tsa_ouu_group",
			   filters:
			   [
			      ["isinactive","is","F"], 
			      "AND",
			      ["custrecord_tsa_ouu_error","is","F"], 
			      "AND", 
			      ["custrecord_tsa_ouu_processed","is","F"], 
			      "AND", 
			      ["custrecord_tsa_ouu_unit","anyof",unit], 
			      "AND", 
				  ["custrecord_tsa_ouu_currency","anyof",currency],
				  "AND", 
			      ["custrecord_tsa_ouu_date","on",date_ouu]				  				  
			   ],
			   columns:
			   [
			      search.createColumn({name: "internalid"})
			   ]
			});
		
		var lineSResult    = offlineUploadLine.run().getRange({start: 0, end: 1000});
    	for ( var j = 0; j < lineSResult.length; j++) {
    		var internalid = lineSResult[j].getValue({name: INTERNALID});
    		
    		log.debug("offline - j-",j+', internalid-'+internalid);
    		
    		var id = record.submitFields({
    		    type: 'customrecord_tsa_ouu_group',
    		    id: internalid,
    		    values: {
    		    	'custrecord_tsa_ouu_error': true,
    		    	'custrecord_tsa_ouu_error_desc' : 'Sum of Debit and Credit not matched'
    		    }
    		});
    	}
	}
	
	/**
	 * Determines what type of unit the trade goes to.
	 * 
	 * @since 1.0.0 - RL
	 * @private
	 * @param {String} journalLineResult, jouID
	 * @returns {String} jouID
	 */
	function markOfflineRecordAsProcessed(journalLineResult, jouID){
		for ( var m = 0; m < journalLineResult.length; m++) {
			var internalid = journalLineResult[m].getValue({name: INTERNALID});
    		log.debug("offline - m-",m+', internalid-'+internalid);
    		var id = record.submitFields({
    		    type: 'customrecord_tsa_ouu_group',
    		    id: internalid,
    		    values: {
    		    	'custrecord_tsa_ouu_processed': true,
    		    	'custrecord_tsa_ouu_lin_journal' : jouID
    		    }
    		});
    	}
	}

    return {
        execute: offlineUpload
    };
    
});