/*
    Author: 	Viktor Schumann 24/07/2019

    This script will export Expense claims to csv file which has reserve but no journal
*	
 *	PARAMETERS:
 *	DESCRIPTION                     ID                                  TYPE                            LIST/RECORD
 *  Emial Recepient	                custscript_email_recipient	        List/Record	                    Employee
 *  Email CC Recipients	            custscript_email_cc_recipients	    Free-Form Text
*/

/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
**/
define(['N/record', 'N/search', 'N/email', 'N/render', 'N/format', 'N/runtime', 'N/task', './moment.min', 'N/file'],
    /**A
     * @param {record} record
     * @param {search} search
     */

    function (record, search, email, render, format, runtime, task, moment, file) {

   /**
     * @param {Object} scriptContext
     * @param {string} scriptContext.type
     * @Since 2018.2
     */


	 //**************** Execute ****************
	 
    function execute(scriptContext) {

        try {
			
          	log.debug("TSA_VS_export_exp_cl_ss20::execute", '*** Started ***');	
            var journals = [];
			journals.push(0); // to have a begining value in the JSON string later
            var createdFile; 
            var fileId;    
          	var nr_of_missing = 0;
			var ihq_only = runtime.getCurrentScript().getParameter({ name: 'custscript_ihq_only' });
          	var global_only = runtime.getCurrentScript().getParameter({ name: 'custscript_global_only' });
		    var ihq_subs = JSON.parse( runtime.getCurrentScript().getParameter({ name: "custscript_ihq_subs_list" }) );

          	log.debug("","ihq_only="+ihq_only);
          	//return;
			// Parent=1, ROAS=18, SAIT=19, SAIT Elim=30, SALT College=32, 
          	
            // #region SEARCHING FOR JOURNALS AND FILL JOURNAL ARRAY

            var journalEntrySearchObj = search.create({
                type: "journalentry",
                filters:
                    [
                      	["mainline", "is", "T"],
            			"AND",
                      	["posting","is","T"],
                      	"AND",
//                      	["formulatext: {custbody_wip_source_transaction}","contains","509"],
//                      	"AND",
                        ["type", "anyof", "Journal"],
                        "AND",
						["trandate","onorafter","01/01/2021"],
						"AND",
                        ["custbody_wip_source_transaction", "noneof", "@NONE@"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custbody_wip_source_transaction", label: "Reserve Source Transaction" })
						//search.createColumn({ name: "internalid", join: "CUSTBODY_WIP_SOURCE_TRANSACTION", label: "Internal ID" })
                    ]
            });

            // Loop through all search results in journalEntrySearchObj.
			var wipSourceTransaction=0; 
          	var wipSource_prev=0;
            var journalEntrySearchPaged = journalEntrySearchObj.runPaged({ pageSize: 1000 });
            journalEntrySearchPaged.pageRanges.forEach(function (page_range) {

                var journalEntryPage = journalEntrySearchPaged.fetch({ index: page_range.index });
                journalEntryPage.data.forEach(function (result) {

                    //var wipSourceTransaction = JSON.stringify(result.getText({ name: 'custbody_wip_source_transaction' }));
					wipSourceTransaction = parseInt(result.getValue({ name: 'custbody_wip_source_transaction' }));
                    //log.debug("TSA_VS_export_exp_cl_ss20::execute", 'wipSourceTransaction=' + wipSourceTransaction);

                    if (wipSourceTransaction!=wipSource_prev) {
                    	journals.push(wipSourceTransaction);
                      	wipSource_prev=wipSourceTransaction;
                    }
                    return true;
                });
            });
			journals.push(0); // to have an ending value in the JSON string later
			
          	log.debug("TSA_VS_export_exp_cl_ss20::execute", 'journal#=' + journals.length);	
          	log.debug("TSA_VS_export_exp_cl_ss20::execute", 'journals=' + JSON.stringify(journals));	
          
          
            // #endregion

            // #region SEARCHING FOR EXPENSE CLAIMS
			var ihq_global_filter = "noneof";
          	if(ihq_only==true) ihq_global_filter = "anyof";

            var expenseReportSearchObj = search.create({
                type: "transaction", //expensereport
                filters:
                    [
//                       ["type", "noneof", "Journal"],
				      	["custbody_wip_source_transaction","anyof","@NONE@"],
//                        ["type", "anyof", "ExpRept","Custom107","Custom108","Check"],
//                        "AND",
						//["formulatext: trim({custbody_wip_source_transaction})","isempty",""],
                       	"AND",
//						["internalid", "anyof", "181757"],
//            			"AND",
                      	["posting","is","T"],
                      	"AND",
//                        ["custcol_cseg_tsa_fundreserv", "noneof", "@NONE@"],
					    [["custcol_tsa_wip_mapping","noneof","@NONE@"],"OR",["custcol_cseg_tsa_fundreserv","noneof","@NONE@"]],
						"AND",
						["memomain","doesnotcontain","TB"],
                      	"AND",
						["tranid","doesnotcontain","print"],
						"AND",
						["memomain","doesnotcontain","correct"],
                        "AND",
						["trandate","onorafter","01/01/2021"],						
						"AND",
						["subsidiary",ihq_global_filter,ihq_subs],	//here					
						"AND",                      
						["internalidnumber","notequalto",331006],
                     	"AND",
						["internalid", "noneof", [417002,416902,416602,416402,416401,416003,416201,416101,416001,434524,434523,434522,434518,434516,434513,434512,434412,451211455743,455738,455737,455736,455734,455733,455732,453502,453501,453492,453491] ] //Pakistan & IHQ opening balance journals


    //"AND", 
    //["datecreated","onorafter","16/12/2019 12:00 am"], 

      					//[["memomain","doesnotcontain","TB"],"OR",["memomain","contains","TB"],"AND",["datecreated","noton","12/04/2019 11:59 pm"],"AND",["datecreated","noton","25/10/2018 11:59 pm"],"AND",["datecreated","noton","23/10/2018 11:59 pm"],"AND",["datecreated","noton","22/09/2018 11:59 pm"],"AND",["datecreated","noton","30/06/2018 11:59 pm"]]
                      
                    ],
                columns:
                    [
                    search.createColumn({ name: "type", sort: search.Sort.ASC, label: "Type" }), 
                    search.createColumn({name: "datecreated",sort: search.Sort.DESC, label: "Date Created" }),
					search.createColumn({ name: "internalid", label: "Internal ID" }),
                    search.createColumn({ name: "tranid", label: "Document Number" }),
                    search.createColumn({ name: "transactionnumber", sort: search.Sort.ASC, label: "Transaction Number" }),
                    search.createColumn({ name: "trandate", label: "Date" }),
                    search.createColumn({ name: "postingperiod", label: "Period" }),
                    //search.createColumn({ name: "entity", label: "Name" }),
                    search.createColumn({ name: "account", label: "Account" }),
                    search.createColumn({ name: "memomain", label: "Memo Main" }),
                    search.createColumn({ name: "memo", label: "Memo" }),
                    search.createColumn({ name: "fxamount", label: "Amount" }),
                    search.createColumn({ name: "custcol_cseg_tsa_fundreserv", label: "Reserve" }),
                    search.createColumn({ name: "custbody_wip_source_transaction", label: "Reserve Source Transaction" })
                    //search.createColumn({ name: "asofdate", label: "As-Of Date" }),
                    //search.createColumn({ name: "taxperiod", label: "Tax Period" }),
                    //search.createColumn({name: "ordertype", label: "Order Type"}),
                    //search.createColumn({ name: "mainline", label: "*" }),

                    ]
            });

            // #endregion

            // Loop through all search results in expenseReportSearchObj.
            var expenseReportSearchPaged = expenseReportSearchObj.runPaged({ pageSize: 1000 });
            var lastProcessedExpenseId = '';

            var fileHeader = "Type,Document Number,Date Created,Date,Period,Amount,Account,Memo,Memo Main,Reserve,Reserve Source Transaction,InternalId";

            /*result.columns.forEach(function (col) {
                              if (fileHeader.length > 0) {  fileHeader += ";";  }
                              fileHeader += col.label;
                          });*/

            createdFile = file.create({
              name: 'Transactions_without_journal-' + moment.utc().format('YYYYMMDD_HHmm') + '.csv',
              fileType: file.Type.CSV,
              folder: 2893,//SuiteScripts > SalvationArmy > Expense claims
              contents: fileHeader + '\n'
            });
			
            var j=0;
            expenseReportSearchPaged.pageRanges.forEach(function (page_range) {
              	//for debug - if(j>0)return;
                var expenseReportPage = expenseReportSearchPaged.fetch({ index: page_range.index });
                expenseReportPage.data.forEach(function (result) {
					j++;
                    //for debug - if(j>10)return;
                    var expenseId = JSON.stringify(result.getValue({ name: 'transactionnumber' })).replace(/"/g, '');
                    var tranid = JSON.stringify(result.getValue({ name: 'tranid' })).replace(/"/g, '');
					var internalid = result.getValue({ name: 'internalid' });

                    if (lastProcessedExpenseId == expenseId) {   return true;  }
                    lastProcessedExpenseId = expenseId;
                  	//log.debug("TSA_VS_export_exp_cl_ss20::execute", 'transaction number=' + expenseId+" ,tranid="+tranid+" ,internalid="+internalid);
                  	//
                    for (var i = 0; i < journals.length; i++) {
                        if (journals[i]==internalid || "To Print".indexOf(expenseId) != -1 || internalid==601) {
                            //log.debug("TSA_VS_export_exp_cl_ss20::execute", 'Expense claim has journal=' + expenseId);
                            return true; // If found in journals[] then jump to the next Transaction 
                        }
                    }

                        var line = "";
                        
                        line += result.getText({ name: "type"})+",";
                        line += result.getValue({ name: "transactionnumber"})+",";
                      	line += result.getValue({ name: "datecreated"})+",";
                        line += result.getValue({ name: "trandate"})+",";
                        line += result.getText({ name: "postingperiod"})+",";
                      	line += result.getValue({ name: "fxamount"})+",";
                        line += result.getText({ name: "account"})+",";
                        line += result.getValue({ name: "memo"})+",";
                  		line += result.getValue({ name: "memomain"})+",";
                        line += result.getText({ name: "custcol_cseg_tsa_fundreserv"})+",";
                        line += result.getText({ name: "custbody_wip_source_transaction"})+",";
                  		line += result.getValue({ name: "internalid"})+",";
                      
/*                        result.columns.forEach(function (col) {
                            if (line.length > 0) {  line += ";";  }
                          	if(col==0 ) { line += result.getText("type"); }	else{ line += result.getValue(col); } // #GET-TEXT || col==3 || col==8 / getText({fieldId:"type"})
                        });*/

                        createdFile.appendLine({  value: line  });
						nr_of_missing++;
                  
                    //log.debug("TSA_VS_export_exp_cl_ss20::execute", 'expenseId=' + expenseId);
                });
            });

            var fileId = createdFile.save();

            //log.debug("TSA_VS_export_exp_cl_ss20::execute", 'journals=' + JSON.stringify(journals));

            // #region SEND FILE AS EMAIL

            //log.debug("TSA_VS_export_exp_cl_ss20::execute", 'fileId= ' + fileId);

            var userId = 21053;
            //runtime.getCurrentUser().id;
            /*if (userId < 1) {
                userId = 4145;
            }*/
          
            //log.debug("TSA_VS_export_exp_cl_ss20::execute", 'userId= ' + userId);
            var emailRecepient = runtime.getCurrentScript().getParameter({ name: 'custscript_email_recipient' });
            //log.debug("TSA_VS_export_exp_cl_ss20::execute", 'emailRecepient= ' + JSON.stringify(emailRecepient));

            if (emailRecepient && emailRecepient.length > 0) {

                var ccEmailAddresses = runtime.getCurrentScript().getParameter({ name: 'custscript_email_cc_recipients' });
                //log.debug("TSA_VS_export_exp_cl_ss20::execute", 'ccEmailAddresses= ' + ccEmailAddresses);

                var ccEmailAddressesArray = ccEmailAddresses.split(",");
                //log.debug("TSA_VS_export_exp_cl_ss20::execute", 'ccEmailAddressesArray= ' + JSON.stringify(ccEmailAddressesArray));

                var mail_text = "There weren't any Reserve Transfer Journal missing.";
              	if(nr_of_missing==1){mail_text="There is one Reserve Transfer Journal missing.";}
              	if(nr_of_missing>1){mail_text="There are "+nr_of_missing+" Reserve Transfer Journals missing.";}
              	var attachmentArray = new Array();
                var fileToAttach = file.load({ id: fileId });
                attachmentArray.push(fileToAttach);
				
                if(nr_of_missing>=1){
                    email.send({
                        author: userId,
                        recipients: emailRecepient,
                        subject: "Reserve Transfer Journal check report",
                        body: mail_text+"\n\n Please find the transaction csv file attached.",
                        attachments: attachmentArray,
                        cc: ccEmailAddressesArray
                    });
                }
            }

            // #endregion

            log.debug("TSA_VS_export_exp_cl_ss20::execute", 'End of script');
            
        }
        catch (e) {
            log.debug("Error", 'Message: ' + e);
        }
        finally {
        }
    }
     
    return {
        execute: execute
    };
    
});
