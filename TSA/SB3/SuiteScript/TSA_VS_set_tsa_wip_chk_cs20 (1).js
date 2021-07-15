/****************************************************************************************
 * Name:		SuiteScript 2.0 Client (TSA_VS_custcol_tsa_wip_checked.js)
 *
 * Script Type:	Client
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Set custcol_tsa_wip_checked to true in saveRecord() method
 *
 * Date:        02/08/2019
 *
 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/https', 'N/search', 'N/runtime', 'N/record', 'N/ui/message' ],
    function (https, search, runtime, record, message) {

 //********  BEFORE RETURN **********
	function beforeReturn(sublistId1, scriptContext, booleanValue){
		scriptContext.currentRecord.setCurrentSublistValue({ sublistId: sublistId1, fieldId: "custcol_tsa_wip_checked", value: true, ignoreFieldChange: true });
		return booleanValue;
	}


//*****************************  VALIDATE LINE ***************************
    function validateLine(scriptContext, sublistId1, line) {

    	var transferComplete = scriptContext.currentRecord.getValue({	fieldId : 'custbody_tsa_wip_transfer_complete' 	});  
		 
    	if(transferComplete){
    		scriptContext.currentRecord.setCurrentSublistValue({ sublistId: sublistId1,	fieldId: "custcol_tsa_wip_mapping",	value: "", ignoreFieldChange: true });
    		return beforeReturn(sublistId1 , scriptContext, true);
    	}

    	var postObject = { internalType : scriptContext.currentRecord.getValue({ fieldId : "ntype" }) };
    	var currentRecord = scriptContext.currentRecord;
		var currentLine = currentRecord.getCurrentSublistIndex({ sublistId: sublistId1 }); //!!!
		//console.log("currentLine="+currentLine);
		
    	if(!_recordType){
    		// Pick up record type from the DOM record title
    		_recordType = document.querySelector("h1.uir-record-type").innerText;
    	}
    	postObject.recordType = _recordType;
		console.log("sublist="+sublistId1+" | current line="+currentLine);
		
    	if(["item","expense","line"].indexOf(sublistId1) == -1)
    		return beforeReturn(sublistId1,scriptContext,true);
		
      	var tmp_category;
		if(scriptContext.sublistId=="expense"){
			tmp_value = currentRecord.getCurrentSublistValue({ sublistId : sublistId1, fieldId : "account" });
         	tmp_category = currentRecord.getCurrentSublistValue({ sublistId : sublistId1, fieldId : "category" });
          
			if((!tmp_value || tmp_value=="") && !tmp_category ){
				
				console.log("*** account is empty ***");
				return beforeReturn(sublistId1,scriptContext, true);	
				
				// *** lines for debug and test 
				//currentRecord.selectLine({ sublistId: 'expense', line: currentLine });
				//currentRecord.cancelLine({ sublistId: 'expense' });
				
				//currentRecord.removeLine({ sublistId: 'expense', line: currentLine, ignoreRecalc: true });
				//expense_machine.clearline(true);
				//currentRecord.setCurrentSublistValue({ sublistId : sublistId1, fieldId : "category", value : 1, ignoreFieldChange: true });
				
				//custcol_nondeductible_account 
				//custcol_tsa_wip_checked 
			}
		}
		
        if (scriptContext.sublistId == "item") {
            var itemType = currentRecord.getCurrentSublistValue({ sublistId: sublistId1, fieldId: "custcol_tsa_vs_item_type" });
            if (itemType == '10') {
                console.log("itemTypeValue=" + itemType);
                return beforeReturn(sublistId1, scriptContext, true);
            }
			tmp_value = currentRecord.getCurrentSublistValue({ sublistId : sublistId1, fieldId : "item" });
			if(!tmp_value || tmp_value==""){
				return beforeReturn(sublistId1,scriptContext, true);	
			}
		}
		
    	postObject.accountId = currentRecord.getCurrentSublistValue({ sublistId : sublistId1, fieldId : "account" });
    	postObject.item = currentRecord.getCurrentSublistValue({ sublistId : sublistId1, fieldId : "item" });
    	postObject.category = currentRecord.getCurrentSublistValue({ sublistId : sublistId1, fieldId : "category" });
    	postObject.reserve = currentRecord.getCurrentSublistValue({	sublistId : sublistId1,	fieldId : "custcol_cseg_tsa_fundreserv"	});
		
    	postObject.side = (function(){
			if(sublistId1 != "line") return;
			var amt = currentRecord.getCurrentSublistValue({
				sublistId : sublistId1,
				fieldId : "debit"
			});
			// Debit = 2 : Credit = 1
			return amt? "2" : "1";
		}());

		if(postObject.reserve){
			var reserveFields = search.lookupFields({ type:'customrecord_cseg_tsa_fundreserv', id: postObject.reserve, columns: 'parent' });
			if(reserveFields.parent[0]){
				postObject.reserve = reserveFields.parent[0].value;
			}
		}
		
		console.log("postObject="+JSON.stringify(postObject));
		
		var response  = https.post({
			url : '/app/site/hosting/scriptlet.nl?script=customscript_lm_slet_wip_server_2&deploy=customdeploy_lm_slet_wip_server_2&compid=' + runtime.accountId,
			body : JSON.stringify(postObject)
		});
		
		console.log(JSON.parse(response.body));
		currentRecord.setCurrentSublistValue({ sublistId: sublistId1, fieldId: "custcol_tsa_wip_mapping",	value: "", ignoreFieldChange: true });
		console.log(sublistId1);
		var objLine = JSON.parse(response.body);
		if(objLine.error){
			var translation = _translations[objLine.error];
			if(translation){
				alert("(1) "+translation.value);
			}
			else{
				alert("(2) "+objLine.error);
			}
			return false;
		}
		else if(objLine.id){
			currentRecord.setCurrentSublistValue({ sublistId: sublistId1, fieldId: "custcol_tsa_wip_mapping", value: objLine.id, ignoreFieldChange: true });
			return beforeReturn(sublistId1,scriptContext,true); 
		}
		return beforeReturn(sublistId1,scriptContext,true);
    }
//******** END of Validate Line
  
  
    	var _recordType = "";
		var _translations = {
			NO_MAPPING		: {field : "custbody_wip_error_no_mapping", value : ""},
			VALIDATE_LINES	: {field : "custbody_wip_error_line_validated", value : ""},
			MULIPLE_MAPPING : {field : "custbody_wip_error_multiple_mapping", value : ""}
		};
		var what_was_checked = "";

        //#region ****************************** Field Changed /(SAVE RECORD) ************************************* 

        function fieldChanged(scriptContext) {   //saveRecord

            try {
				
				var checkAll = scriptContext.currentRecord.getValue({ fieldId : "custbody_tsa_vs_check_all_res" });
				if(scriptContext.fieldId=="custbody_tsa_vs_check_all_res" && checkAll){
                  	window.scrollTo(0, 0);
                  	//var msg=message.create({ title: "WIP checking Started", message: "Please wait it could take a minute...", type: message.Type.INFORMATION }).show();
                  	window.showAlertBox('alert_info', 'WIP checking Started.', 'Please wait it could take a minute...', NLAlertDialog.TYPE_MEDIUM_PRIORITY);
					console.log("custcol_tsa_wip_checked:: start WIP checking");					
                  	setTimeout(function() { updateTsaWipCheckedForAllSublists(scriptContext);hideAlertBox('alert_info'); }, 200);
					
					//scriptContext.currentRecord.setValue({ fieldId : "custbody_tsa_vs_check_all_res", value: false, ignoreFieldChange: true });
					console.log("custcol_tsa_wip_checked:: Success");
				}
            } catch (e) {

                console.log("custcol_tsa_wip_checked:: Error: " + e);
                log.debug("custcol_tsa_wip_checked::saveRecord", e);

                return false;
            }

            return true;
        }

        //#endregion

        //#region *****************  UPDATE TSA_WIP_CHECKED FOR ALL SUBLISTS  **************************** 

        function updateTsaWipCheckedForAllSublists(scriptContext) {

            var userId = runtime.getCurrentUser().id;
            console.log("custcol_tsa_wip_checked:: userId: " + userId);

            /*
          	if (userId != 4145) {
                console.log("custcol_tsa_wip_checked:: Do not run for this user");
                return true;
            }
			*/
          
            updateTsaWipCheckedForASublist(scriptContext, "item");
            console.log("custcol_tsa_wip_checked:: Item has been checked");

            updateTsaWipCheckedForASublist(scriptContext, "expense");
            console.log("custcol_tsa_wip_checked:: Expense has been checked");

            updateTsaWipCheckedForASublist(scriptContext, "line");
            console.log("custcol_tsa_wip_checked:: Line has been checked");
			
          
            return true;
        }

        //#endregion

        //#region *****************  UPDATE TSA_WIP_CHECKED FOR A SUBLISTS  ****************************

        function updateTsaWipCheckedForASublist(scriptContext, sublistId) {

            var lineCount = scriptContext.currentRecord.getLineCount({ sublistId: sublistId });

            if (lineCount <= 0) {
                console.log("custcol_tsa_wip_checked:: This sublist has no lines: " + sublistId);
                return true;
            }

            //Check if this was a Void of Cheque - no need to check WIP field
            var source = scriptContext.currentRecord.getValue({ fieldId: 'transform' });
            var is_void = scriptContext.currentRecord.getValue({ fieldId: 'void' });
            //console.log("custcol_tsa_wip_checked:: void=" + is_void + " source=" + source);
            if (source == "check" && is_void == "T") {
                //alert("custcol_tsa_wip_checked:: saving");
                return true;
            }

            console.log("custcol_tsa_wip_checked:: Processed sublist= " + sublistId);

            var currentRecord = scriptContext.currentRecord;

            for (var i = 0; i < lineCount; i++) {
				console.log("custcol_tsa_wip_checked:: Processed sublist= " + sublistId + " ,line="+i);
                currentRecord.selectLine({ sublistId: sublistId, line: i });
              	// Actually, we don't need to call the calculation in case of doing this on fieldchange, because the commitLine (below) will trigger the onchange client script.
              	//validateLine(scriptContext,sublistId,i);
                //currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custcol_tsa_wip_checked', value: true, ignoreFieldChange: true });
                currentRecord.commitLine({ sublistId: sublistId });
            }

            return true;
        }

        //#endregion

        return {
            //saveRecord: saveRecord,
			fieldChanged: fieldChanged
        };
    });

