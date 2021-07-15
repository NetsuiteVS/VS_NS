/****************************************************************************************
 * Name:		SuiteScript 2.0 Scheduled (TSA_VS_sc_offline_upload_ss.js)
 *
 * Script Type:	Scheduled
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     
 * 
 * Date:        13/01/2021
 *
 ****************************************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search', 'N/task', 'N/format','N/config'],

    function (record, runtime, search, task, format, config) {

        //************************** EXECUTE *****************************

        function execute(scriptContext) {
          
            var EXPENSE = "1";
            var INCOME = "2";

            try {

                log.debug("sc_offline_upload::execute()", "Started");

                var offlineUpload = search.create({
                    type: "customrecord_tsa_ouu_group",
                    filters:
                        [
                            ["isinactive", "is", "F"],
                            "AND", ["custrecord_tsa_ouu_error", "is", "F"],
                          	"AND", ["custrecord_tsa_ouu_approval_status", "anyof", "3"],
                            "AND", ["custrecord_tsa_ouu_processed", "is", "F"],
                            "AND", ["custrecord_tsa_ouu_bank_acc","noneof","@NONE@"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_tsa_ouu_currency", summary: "GROUP" }),
                            search.createColumn({ name: "custrecord_tsa_ouu_unit", summary: "GROUP" }),
                          	search.createColumn({ name: "custrecord_tsa_ouu_rp", summary: "GROUP" }),
                            search.createColumn({ name: "custrecord_tsa_ouu_inc_exp", summary: "GROUP" }),
                            search.createColumn({ name: "custrecord_tsa_ouu_bank_acc", summary: "GROUP" }),
                          	search.createColumn({ name: "custrecord_tsa_ouu_usage", summary: "GROUP" }),
                            search.createColumn({ name: "custrecord_tsa_ouu_date", summary: "GROUP" }),
                            search.createColumn({ name: "custrecord_tsa_ouu_credit", summary: "SUM" }),
                            search.createColumn({ name: "custrecord_tsa_ouu_debit", summary: "SUM" }),
                          	search.createColumn({ name: "custrecord_tsa_ouu_amount", summary: "SUM" }),
                        ]
                });
              
                var offlineResult = offlineUpload.run().getRange({ start: 0, end: 1000 });
                log.debug("sc_offline_upload::execute()", "offlineResult="+JSON.stringify(offlineResult));
              
                for (var i = 0; i < offlineResult.length; i++) {
                    var subsidiary = null;
                    var currency = offlineResult[i].getValue({ name: 'custrecord_tsa_ouu_currency', summary: 'GROUP' });
                    var unit = offlineResult[i].getValue({ name: 'custrecord_tsa_ouu_unit', summary: 'GROUP' });
                  	var related_party = offlineResult[i].getValue({ name: 'custrecord_tsa_ouu_rp', summary: 'GROUP' });
                  	
                    var incomeOrExpense = offlineResult[i].getValue({ name: 'custrecord_tsa_ouu_inc_exp', summary: 'GROUP' });
                  	var usage = offlineResult[i].getValue({ name: 'custrecord_tsa_ouu_usage', summary: 'GROUP' });
                    var bankAccount = offlineResult[i].getValue({ name: 'custrecord_tsa_ouu_bank_acc', summary: 'GROUP' });
                    var date_ouu = offlineResult[i].getValue({ name: 'custrecord_tsa_ouu_date', summary: 'GROUP' });
                    var creditSum = offlineResult[i].getValue({ name: 'custrecord_tsa_ouu_credit', summary: 'SUM' });
                    var debitSum = offlineResult[i].getValue({ name: 'custrecord_tsa_ouu_debit', summary: 'SUM' });
                  	var amountSum = offlineResult[i].getValue({ name: 'custrecord_tsa_ouu_amount', summary: 'SUM' });
                    var isIncome = (incomeOrExpense == INCOME);

                    log.debug("sc_offline_upload::execute() ", " currency="+currency+', unit='+unit+', amountSum='+amountSum+', creditSum='+creditSum+', debitSum='+debitSum+', date_ouu='+date_ouu
                       +', incomeOrExpense='+incomeOrExpense+', bankAccount='+bankAccount+' ,usage='+usage);

                    createJournal(currency, unit,related_party, date_ouu, incomeOrExpense, bankAccount, amountSum, isIncome, usage);
                }
            }
            catch (e) {
                log.debug("sc_offline_upload::execute() - Error", e);
            }

            log.debug("sc_offline_upload::execute()", "Finished");

            return true;
        }

        //************************** CREATE JOURNAL *****************************

        function createJournal(currency, unit, related_party, date_ouu, incomeOrExpense, bankAccount, sumValue, isIncome, usage) {
			
          	log.debug("sc_offline_upload::createJournal()", "related_party="+related_party);
/*
                            search.createColumn({ name: "custrecord_tsa_ouu_currency", summary: "GROUP" }),
                            search.createColumn({ name: "custrecord_tsa_ouu_unit", summary: "GROUP" }),
                          	search.createColumn({ name: "custrecord_tsa_ouu_rp", summary: "GROUP" }),
                            search.createColumn({ name: "custrecord_tsa_ouu_inc_exp", summary: "GROUP" }),
                            search.createColumn({ name: "custrecord_tsa_ouu_bank_acc", summary: "GROUP" }),
                          	search.createColumn({ name: "custrecord_tsa_ouu_usage", summary: "GROUP" }),
                            search.createColumn({ name: "custrecord_tsa_ouu_date", summary: "GROUP" }),
 */
            var offlineJournal = search.create({
                type: "customrecord_tsa_ouu_group",
                filters:
                    [
                        ["isinactive", "is", "F"],
                        "AND", ["custrecord_tsa_ouu_approval_status", "anyof", "3"],                      
                        "AND", ["custrecord_tsa_ouu_error", "is", "F"],
                        "AND", ["custrecord_tsa_ouu_processed", "is", "F"],
                        "AND", ["custrecord_tsa_ouu_unit", "anyof", unit],
                      	"AND", ["custrecord_tsa_ouu_rp", (related_party ? "anyof":"isempty"), related_party],
                        "AND", ["custrecord_tsa_ouu_currency", "anyof", currency],
                        "AND", ["custrecord_tsa_ouu_date", "on", date_ouu],
                        "AND", ["custrecord_tsa_ouu_inc_exp", "anyof", incomeOrExpense],
                      	"AND", ["custrecord_tsa_ouu_usage", "anyof", usage],
                        "AND", ["custrecord_tsa_ouu_bank_acc", "anyof", bankAccount]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid" }),
                        search.createColumn({ name: "custrecord_tsa_ouu_subsidiary" }),
                        search.createColumn({ name: "custrecord_tsa_ouu_department" }),
                        search.createColumn({ name: "custrecord_tsa_ouu_rp" }),
                        search.createColumn({ name: "custrecord_tsa_ouu_credit" }),
                        search.createColumn({ name: "custrecord_tsa_ouu_debit" }),
                      	search.createColumn({ name: "custrecord_tsa_ouu_amount" }),
                        search.createColumn({ name: "custrecord_tsa_ouu_memo" }),
                        //search.createColumn({ name: "custrecord_tsa_ouu_transaction_name" }),
                        search.createColumn({ name: "custrecord_tsa_ouu_account" }),
                      	search.createColumn({ name: "custrecord_tsa_ouu_usage" }),
                      	search.createColumn({ name: "custrecord_tsa_ouu_unit_shared_key" }),
                        search.createColumn({ name: "custrecord_tsa_ouu_date" }),
                      	search.createColumn({ name: "custrecord_tsa_ouu_project" }),
            			search.createColumn({ name: "custrecord_tsa_ouu_reserve" }),
          				search.createColumn({ name: "custrecord_tsa_ouu_cost_centre" }),
          				search.createColumn({ name: "custrecord_tsa_ouu_pac" })
                      
                    ]
            });

            var journalLineResult = offlineJournal.run().getRange({ start: 0, end: 1000 });
            log.debug("sc_offline_upload::createJournal()", JSON.stringify(journalLineResult));
			var error_flag=false; 
			
			try{
				for (var i = 0; i < journalLineResult.length; i++) {

					var internalid = journalLineResult[i].getValue({ name: 'internalid' });
					var subsidiary = journalLineResult[i].getValue({ name: 'custrecord_tsa_ouu_subsidiary' });
					var department = journalLineResult[i].getValue({ name: 'custrecord_tsa_ouu_department' });
					var party = journalLineResult[i].getValue({ name: 'custrecord_tsa_ouu_rp' });
					var value = journalLineResult[i].getValue({ name: 'custrecord_tsa_ouu_amount' }); //(isIncome ? 'custrecord_tsa_ouu_credit' : 'custrecord_tsa_ouu_debit')
					var memo = journalLineResult[i].getValue({ name: 'custrecord_tsa_ouu_memo' });
					var account = journalLineResult[i].getValue({ name: 'custrecord_tsa_ouu_account' });
					var tranDate = journalLineResult[i].getValue({ name: 'custrecord_tsa_ouu_date' });
					var usage = journalLineResult[i].getValue({ name: 'custrecord_tsa_ouu_usage' });
					var unit_shared_key = journalLineResult[i].getValue({ name: 'custrecord_tsa_ouu_unit_shared_key' });
				  
					var project = journalLineResult[i].getValue({ name: 'custrecord_tsa_ouu_project' });
					var reserve = journalLineResult[i].getValue({ name: 'custrecord_tsa_ouu_reserve' });
					var cost_centre = journalLineResult[i].getValue({ name: 'custrecord_tsa_ouu_cost_centre' });
					var project_activity_code = journalLineResult[i].getValue({ name: 'custrecord_tsa_ouu_pac' });
				  
					log.debug("sc_offline_upload::createJournal()", 'account='+account+' ,value='+value+' ,internalid='+internalid+' ,subsidiary='+subsidiary+' ,tranDate='+tranDate+' ,sumValue='+sumValue);

					//Create Journal and add sum line
					if (i == 0) {

						var newJouRec = record.create({ type: record.Type.JOURNAL_ENTRY, isDynamic: true });

						//Set body fields
						newJouRec.setValue('subsidiary', subsidiary);
						newJouRec.setValue({ fieldId: 'trandate', value: parseDateBasedOnUserPreference(tranDate) });
						newJouRec.setValue('custbody_tsa_depreciation_inprogress', false);
						newJouRec.setValue("custbody_tsa_vs_ce_auto_generated", true);
						newJouRec.setValue("custbody_tsa_oou_txn", true); // this shows it's specifically an OUU journal
						if(usage==3) newJouRec.setValue("custbody_tsa_inter_unit", true);                  
						
						var location_found = find_location_from_shared_key(unit_shared_key);                  
						newJouRec.setValue({ fieldId: "location" , value: location_found});
						newJouRec.setValue({ fieldId: "custbody_tsa_location_main_jrn" , value: location_found});


						//Add sum line
						newJouRec.selectNewLine({ sublistId: 'line' });
						newJouRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: bankAccount });
						newJouRec.setCurrentSublistValue({ sublistId: 'line', fieldId: (isIncome ? 'debit' : 'credit'), value: sumValue });
						newJouRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: memo });
						newJouRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: department });
						newJouRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: unit });
						newJouRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'custcol_cseg_tsa_relatedpar', value: party });
						newJouRec.commitLine({ sublistId: 'line' });
					}

					//Add line
					newJouRec.selectNewLine({ sublistId: 'line' });
					newJouRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: account });
					newJouRec.setCurrentSublistValue({ sublistId: 'line', fieldId: (isIncome ? 'credit' : 'debit'), value: value });
					newJouRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: memo });
					newJouRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: department });
					newJouRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: unit });
					newJouRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'custcol_cseg_tsa_relatedpar', value: party });
					if(project) newJouRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'custcol_cseg_tsa_project', value: project });
					if(reserve) newJouRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'custcol_cseg_tsa_fundreserv', value: reserve });
					if(cost_centre) newJouRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_tsa_cost_cen', value: cost_centre });
					if(project_activity_code) newJouRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'cseg_tsa_act_code', value: project_activity_code });              
					newJouRec.commitLine({ sublistId: 'line' });
				}
				var jouID = newJouRec.save();
			}
			catch(e){
				record.submitFields({ type: 'customrecord_tsa_ouu_group', id: internalid, values: { 'custrecord_tsa_ouu_error': true, 'custrecord_tsa_ouu_error_desc': e.message } });
				log.debug( "Error Creating the Journal", "error saved in OUU: "+e.message );
				error_flag=true;
			}
			//Mark offline record as processed
			if(!error_flag){
				for (var j = 0; j < journalLineResult.length; j++){
					var internalid = journalLineResult[j].getValue({ name: 'internalid' });
					log.debug("sc_offline_upload:: createJournal()", 'Mark TSA Offline Unit Upload record line [' + j + '] as processed. Internalid=' + internalid);
					record.submitFields({ type: 'customrecord_tsa_ouu_group', id: internalid, values: { 'custrecord_tsa_ouu_processed': true, 'custrecord_tsa_ouu_lin_journal': jouID } });
				}
			}
			log.debug("sc_offline_upload:: createJournal()", 'New journalId:  ' + jouID);			
		}

  //******************************** Find Location from Shared Key ************************************
	function find_location_from_shared_key(shared_key){
		var return_result="-1";
		var locationSearchObj = search.create({
		  type: "location",
		  filters:
		  [
			//["internalid","anyof",code],
			["custrecord_tsa_iu_shared_key_loc", "is", shared_key],
            "AND",
            ["custrecord_tsa_loc_type", "is", 1]
		  ],
		  columns:
		  [
			search.createColumn({ name: "internalid", label: "Internal ID" })
		  ]
		});
		log.debug("location_lookup::find_location_id_from_shared_key", "Looked up shared_key:"+shared_key);
		
		locationSearchObj.run().each(function (result) {
		  log.debug("location_lookup::find_location_id_from_shared_key", "location internalid: " + result.getValue({ name: "internalid" }));
		  return_result = result.getValue({ name: "internalid" });
		  return false;
		});
		return return_result;
        }

        function parseDateBasedOnUserPreference(dateToParse) {

            companyInfo = config.load({ type: config.Type.USER_PREFERENCES });
            var dateformat = companyInfo.getValue({ fieldId: 'DATEFORMAT' });
            var splittedDateFormat = dateformat.replace(".", "/").replace("-", "/").toLowerCase().split("/");
            var splittedDate = dateToParse.replace(".", "/").replace("-", "/").split("/");
            var year = splittedDateFormat[0][0] == "y" ? splittedDate[0] : (splittedDateFormat[1][0] == "y" ? splittedDate[1] : splittedDate[2]);
            var month = splittedDateFormat[0][0] == "m" ? splittedDate[0] : (splittedDateFormat[1][0] == "m" ? splittedDate[1] : splittedDate[2]);
            var day = splittedDateFormat[0][0] == "d" ? splittedDate[0] : (splittedDateFormat[1][0] == "d" ? splittedDate[1] : splittedDate[2]);

            //Remove leading zeros
            month = month[0] == 0 ? month[1] : month;
            day = day[0] == 0 ? day[1] : day;
            //log.debug("ouu_approval_v2 POST", "year=" + year + ", month=" + month + ", day=" + day);

            return new Date(parseInt(year), parseInt(month)-1, parseInt(day));
        }
  
  
  
        return {
            execute: execute
        };

    });