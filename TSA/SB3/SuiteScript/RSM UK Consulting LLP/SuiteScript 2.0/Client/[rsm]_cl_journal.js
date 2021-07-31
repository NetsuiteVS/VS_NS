/**********************************************************************************************************
 * Name:			Create journal ([rsm]_cl_journal.js)
 * 
 * Script Type:		UserEventScript
 * 
 * API Version:		2.0
 * 
 * Version:			1.0.0 - 05/06/2019 - Initial Development - KR
 * 
 * Author:			Krish
 * 
 * Script:			
 * Deploy:			
 * 
 * Purpose:			Create journal from initiating journal
 * 
 * Notes:			
 * 
 * Dependencies:	
 ***********************************************************************************************************/
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', '../../../vs_lib', 'N/translation', 'N/search', 'N/log'], 			
function(record, vs_lib, translation, search, log) {
	
	'use strict';

	var ACTIVITYTYPE	= 'customrecord_tsa_unit_activity_types';
	var LINKEDICTRANS   = 'custbody_linked_ic_trans';
	var LINE			= 'line';
	var LINELINKEDTRAN  = 'custcol_linked_ic_trans';	
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {

        try {
            if (scriptContext.mode === 'copy') {
                var currentRecord = scriptContext.currentRecord;

                var inter_unit_flag = currentRecord.getValue("custbody_tsa_inter_unit");
                if (!inter_unit_flag) {
                    console.log("Not creating Offsetting Journal due to custbody_tsa_inter_unit is false");
                    return true;
                }

                var numLines = currentRecord.getLineCount({ sublistId: 'line' });
                log.debug({ title: 'currentRecord:', details: currentRecord + ', type-' + scriptContext.mode + ', numLines-' + numLines });
                for (var i = 0; i < numLines; i++) {
                    currentRecord.selectLine({ sublistId: LINE, line: i });
                    currentRecord.setCurrentSublistValue({ sublistId: LINE, fieldId: LINELINKEDTRAN, value: null });
                    currentRecord.commitLine({ sublistId: LINE });
                }
            }
        }
        catch (e) {
            vs_lib.createErrorLog(runtime.getCurrentScript().id, scriptContext.currentRecord.getValue({ fieldId: "id" }), e, runtime.getCurrentUser().id, scriptContext.currentRecord.type);
        }
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function validateLine(context) {

        var currentRecord = context.currentRecord;

        var interunit = currentRecord.getValue("custbody_tsa_inter_unit");
        if (!interunit) {
            console.log("Not creating Offsetting Journal due to custbody_tsa_inter_unit is false");
            return true;
        }

        console.log("[rsm]_cl_journal::validateLine *** Started *** context=" + JSON.stringify(context));
        //custcol_unit_type
        //custcol_tsa_acc_iu_pay_type
        var account = currentRecord.getCurrentSublistValue({ sublistId: "line", fieldId: "account" });
      	var unit = currentRecord.getCurrentSublistValue({ sublistId: "line", fieldId: "class" });
        var account_display = currentRecord.getCurrentSublistValue({ sublistId: "line", fieldId: "account_display" });
        var a = account_display.substring(0, 1);
        var unit_type = currentRecord.getCurrentSublistValue({ sublistId: "line", fieldId: "custcol_unit_type" });
        var relParty_type = currentRecord.getCurrentSublistValue({ sublistId: "line", fieldId: "custcol_rp_type" });
        var acc_unit_type = currentRecord.getCurrentSublistValue({ sublistId: "line", fieldId: "custcol_tsa_acc_unit_type" });
        var acc_pay_type = currentRecord.getCurrentSublistValue({ sublistId: "line", fieldId: "custcol_tsa_acc_iu_pay_type" });
        var tsa_rel_party = currentRecord.getCurrentSublistValue({ sublistId: "line", fieldId: "custcol_cseg_tsa_relatedpar" });
        var tsa_rel_party_shared_key = currentRecord.getCurrentSublistValue({ sublistId: "line", fieldId: "custcol_relparty_shared_key" });

        console.log("[rsm]_cl_journal::validateLine - interunit=" + interunit + " ,tsa_rel_party=" + tsa_rel_party + " ,tsa_rel_party_shared_key=" + tsa_rel_party_shared_key + " ,acc_pay_type=" + acc_pay_type);

        /* in theory we Money Flow journal doesn't use shared key. Also this check can't work when user has subsidiary restricted permissions          
                    if (tsa_rel_party_shared_key) {
        
                        var accountSearchObj = search.create({
                            type: "account",
                            filters: [
                                ["isinactive", "is", "F"],
                                "AND",
                                ["custrecord_tsa_iu_shared_key_acc", "anyof", tsa_rel_party_shared_key]
                            ],
                            columns: [search.createColumn({ name: "custrecord_tsa_iu_shared_key_acc", label: "IU Shared Key (Account)" })]
                        });
        
                        if (accountSearchObj.runPaged().count == 0) {
                            alert(translation.get({ collection: 'custcollection__tsa_collection_01', key: 'MSG_MISSING_RELPARTY_ACCOUNT', locale: translation.Locale.CURRENT })());
                            return false;
                        }
                    }
        */

        if (!tsa_rel_party) {
            alert(translation.get({ collection: 'custcollection__tsa_collection_01', key: 'MSG_MISSING_RELPARTY', locale: translation.Locale.CURRENT })());
            return false;
        }
      
        //Check RelParty for Unit
        var customrecord_cseg_tsa_relatedparSearchObj = search.create({
          type: "customrecord_cseg_tsa_relatedpar",
          filters:  [ ["internalid","anyof",tsa_rel_party],"AND",
                     ["custrecord_cseg_tsa_relatedpar_n101","anyof",unit]
                    ],
          columns:  [
            search.createColumn({ name: "internalid", label: "internalid" })
          ]
        });
        var rp_unit_ok=false;
        customrecord_cseg_tsa_relatedparSearchObj.run().each(function (result) {
          console.log("related party unit check is ok: "+result.getValue({ name: 'internalid' }));
          rp_unit_ok=true;
        });
        if(!rp_unit_ok)	{
          	alert(translation.get({ collection: 'custcollection__tsa_collection_01', key: 'MSG_RELPARTY_UNIT', locale: translation.Locale.CURRENT })());
          	return false;
        }

        //Check if Related Party Record is not complete for InterUnit usage
        var customrecord_cseg_tsa_relatedparSearchObj = search.create({
            type: "customrecord_cseg_tsa_relatedpar",
            filters:
                [
                    ["internalid", "anyof", tsa_rel_party],
                    "AND",
                    ["custrecord_tsa_rp_type", "noneof", "@NONE@"],
                    "AND",
                    ["custrecord_tsa_def_bank", "noneof", "@NONE@"],
                    "AND",
                    ["custrecord_tsa_def_cash_on_hand", "noneof", "@NONE@"],
                    /*                        "AND",
                                            ["custrecord_tsa_def_location", "noneof", "@NONE@"],*/
                    "AND",
                    ["custrecord_rp_division", "noneof", "@NONE@"],
                    "AND",
                    ["custrecord_tsa_subsidiary", "noneof", "@NONE@"],
                    "AND",
                    ["custrecord_tsa_iu_shared_key_rp", "noneof", "@NONE@"]
                ],
            columns:
                [
                    search.createColumn({ name: "name" })
                ]
        });

        if (customrecord_cseg_tsa_relatedparSearchObj.runPaged().count == 0) {

            alert(translation.get({ collection: 'custcollection__tsa_collection_01', key: 'MSG_RELPARTY_NOT_COMPLETE', locale: translation.Locale.CURRENT })());
            return false;
        }

        //DHQ=1 THQ=2 Unit=3
        //if((a=="D" || a=="U" || a=="T") ){ //1=DHQ, 2=THQ, 3=Unit
        if (!acc_pay_type) { //|| acc_unit_type ; 1=DHQ, 2=THQ, 3=Unit , left the letters there for safety if acc_unit_type was not populated
            if (acc_unit_type != unit_type && acc_unit_type != relParty_type) {
                alert(translation.get({ collection: 'custcollection__tsa_collection_01', key: 'ACCOUNT_UNIT_MISMATCH', locale: translation.Locale.CURRENT })());
                return false;
            }
            /*          
                        if(a=="D" && unit_type!=1){
                            alert(translation.get({ collection: 'custcollection__tsa_collection_01', key: 'ACCOUNT_UNIT_MISMATCH', locale: translation.Locale.CURRENT })());
                            return false;
                        }
                        if(a=="T" && unit_type!=2){
                            alert(translation.get({ collection: 'custcollection__tsa_collection_01', key: 'ACCOUNT_UNIT_MISMATCH', locale: translation.Locale.CURRENT })());
                            return false;
                        }
            */
            console.log("Function getAccount | unit_type=" + unit_type + " | relParty_type=" + relParty_type + " | account=" + account);

            var internalid;
            var accountSearch = search.create({
                type: ACTIVITYTYPE,
                filters:
                    [
                        ["isinactive", "is", "F"],
                        "AND",
                        ["custrecord_uat_formusage", "is", 6],	// 3=Interunit , 6-Offset
                        "AND",
                        ["custrecord_uat_unittype", "is", unit_type],
                        "AND",
                        ["custrecord_uat_relatedpartytype", "is", relParty_type],
                        "AND",
                        //["custrecord_uat_glaccount","is",account]
                        ["custrecord_tsa_ini_gl_account", "is", account]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "internalid" }),
                        search.createColumn({ name: "custrecord_uat_formusage", label: "custrecord_uat_formusage" }),
                        search.createColumn({ name: "custrecord_uat_unittype", label: "custrecord_uat_unittype" }),
                        search.createColumn({ name: "custrecord_uat_glaccount", label: "custrecord_uat_glaccount" })
                    ]
            });

            var accountResult = accountSearch.run().getRange({ start: 0, end: 1000 });
            console.log('getAccount : result=' + JSON.stringify(accountResult));
            if (accountResult[0]) internalid = accountResult[0].getValue({ name: 'internalid' });
            console.log('getAccount : internalid=' + internalid);
            if (!internalid) {
                alert(translation.get({ collection: 'custcollection__tsa_collection_01', key: 'ACCOUNT_MAPPING_MISMATCH', locale: translation.Locale.CURRENT })());
                return false;
            }


        }

        return true;
    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(context) {
		
		try
        {	
            var currentRecord = context.currentRecord;

            var inter_unit_flag = currentRecord.getValue("custbody_tsa_inter_unit");
            if (!inter_unit_flag) {
                console.log("Not creating Offsetting Journal due to custbody_tsa_inter_unit is false");
                return true;
            }
            
            // currentRecord.setCurrentSublistValue({sublistId : LINE, fieldId : DEBIT, value : currentRecord.getValue({fieldId : AMOUNT})});						
			var unit_shared_key=currentRecord.getCurrentSublistValue({sublistId : "line", fieldId : "custcol_unit_div_shared_key"});
			var relparty_shared_key=currentRecord.getCurrentSublistValue({sublistId : "line", fieldId : "custcol_relparty_shared_key"});

			console.log("postSourcing:context.fieldId="+context.fieldId);
			console.log("postSourcing: unit_shared_key="+unit_shared_key+" ,relparty_shared_key="+relparty_shared_key);
			
			switch (context.fieldId)
			{
                case "custcol_unit_div_shared_key":
					if( relparty_shared_key == unit_shared_key ){ 
						context.currentRecord.setCurrentSublistValue({sublistId : "line", fieldId : "custcol_dhq_excl", value : true});  
						console.log("postSourcing: shared keys match");
					}
					else{ 
						context.currentRecord.setCurrentSublistValue({sublistId : "line", fieldId : "custcol_dhq_excl", value : false}); 
						console.log("postSourcing: shared keys DOESN't match");
					}
                break;
					
				case "custcol_relparty_shared_key":
					if( relparty_shared_key == unit_shared_key ){ 
						context.currentRecord.setCurrentSublistValue({sublistId : "line", fieldId : "custcol_dhq_excl", value : true});  
						console.log("postSourcing: shared keys match");
					}  					
					else{ 
						context.currentRecord.setCurrentSublistValue({sublistId : "line", fieldId : "custcol_dhq_excl", value : false}); 
						console.log("postSourcing: shared keys DOESN't match");
					}
                break;

			}
			
		}
		catch(e)
		{
			console.log(e);
//        	vs_lib.createErrorLog(Runtime.getCurrentScript().id, context.currentRecord.getValue({ fieldId: "id" }), e, Runtime.getCurrentUser().id, context.currentRecord.type,true);
//			Library.errorHandler('fieldChanged', e);
		}
		
    }


    return {
        pageInit: pageInit,
        //fieldChanged: fieldChanged
        //postSourcing: postSourcing
        //sublistChanged: sublistChanged,
        //lineInit: lineInit,
        //validateField: validateField
        validateLine: validateLine
        //validateInsert: validateInsert,
        //validateDelete: validateDelete,
        //saveRecord: saveRecord
    };
    
});