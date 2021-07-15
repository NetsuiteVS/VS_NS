/****************************************************************************************
 * Name:		SuiteScript 1.0 Scheduled (#TSA_VS_reversal_jounal_mod_ss20.js)
 *
 * Script Type:	Scheduled
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Reversal journals doesn't trigger the userevent scripts, hence this scheduled script calls the reserve suitelet.
 *
 * Date:        26/06/2020
 *
 ****************************************************************************************/

/**
 * Main Scheduled Script function
 *
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled(type) {

    nlapiLogExecution("DEBUG", "reversal_jounal_mod::scheduled", "Script started");

    try {

        var filterDate = new Date();
        filterDate.setDate(filterDate.getDate() - 10);

        var month = (filterDate.getMonth() < 9 ? '0' : '') + (filterDate.getMonth() + 1);
        var day = (filterDate.getDate() < 10 ? '0' : '') + filterDate.getDate();
        var year = filterDate.getFullYear();
        var filterDateStr = day + "/" + month + "/" + year + " 0:00 am";

        var journalentrySearch = nlapiSearchRecord("journalentry", null,
            [
                ["type", "anyof", "Journal"],
                "AND",
                ["datecreated", "onorafter", filterDateStr],
                "AND",
                ["reversalofnumber", "isnotempty", ""],
                "AND",
                ["custcol_cseg_tsa_fundreserv", "noneof", "@NONE@"]
                //["internalid", "anyof", 464313]//For testing purposes
            ],
            [
                new nlobjSearchColumn("datecreated", null, "GROUP").setSort(true),
                new nlobjSearchColumn("tranid", null, "GROUP"),
                new nlobjSearchColumn("reversalofnumber", null, "MAX"),
                new nlobjSearchColumn("custbody_tsa_wip_transfer_complete", null, "GROUP"),
                new nlobjSearchColumn("internalid", null, "GROUP")
            ]
        );

        if (journalentrySearch != null) {

            nlapiLogExecution("DEBUG", "reversal_jounal_mod::scheduled", "journalentrySearch.count:" + journalentrySearch.length);

            for (var i = 0; journalentrySearch != null && i < journalentrySearch.length; i++) {

                var searchresult = journalentrySearch[i];
                var columns = searchresult.getAllColumns();
                var reversalOfNumber = searchresult.getValue(columns[2]);
                var transferComplete = searchresult.getValue(columns[3]);
                var recordId = searchresult.getValue(columns[4]);

                nlapiLogExecution("DEBUG", "reversal_jounal_mod::scheduled", "RecordId=" + recordId);
                nlapiLogExecution("DEBUG", "reversal_jounal_mod::scheduled", "transferComplete=" + transferComplete);

                if (transferComplete == "T") {
                    continue;
                }

                var posting = nlapiLookupField("journalentry", recordId, "posting", false);
                nlapiLogExecution("DEBUG", "reversal_jounal_mod::scheduled", "posting=" + posting);
                if (posting != "T") continue; 	// ******* EXIT if it is not a POSTING transaction *******

                nlapiLogExecution("DEBUG", "reversal_jounal_mod::scheduled", "Posting Transaction");
                var results = nlapiSearchRecord("journalentry", null, [new nlobjSearchFilter("custbody_wip_source_transaction", null, "anyof", recordId)], null);
                if (results) {
                    nlapiLogExecution("DEBUG", "reversal_jounal_mod::scheduled", "Checked existing reserve journals=" + JSON.stringify(results));
                    continue; // ******* EXIT if the reserve journals exists already *******       
                }

                var paramRecord = nlapiLoadRecord("journalentry", recordId);
                var createdJournalID = callPostJournalSuitlelet(paramRecord, "line");
                nlapiLogExecution("DEBUG", "createdJournalID=", createdJournalID);
                //callPostJournalSuitlelet(paramRecord, "item");

                //Update transfer journal link cross reference fields
                var originatingTransferJournalId = getOriginatingTransferJournalId(reversalOfNumber);

                if (createdJournalID.length > 0 && originatingTransferJournalId.length > 0) {

                    //Update originating transfer journal by newly created transfer journal id
                    nlapiSubmitField('journalentry', originatingTransferJournalId, 'custbody_tsa_linked_rvsl_trnsfr_jrnl', createdJournalID, true); 

                    //Update newly created transfer journal by originating transfer journal id
                    nlapiSubmitField('journalentry', createdJournalID, 'custbody_tsa_lnkd_orig_trnfr_jrnl', originatingTransferJournalId, true); 
                }
            }
        }
    } catch (exception) {
        nlapiLogExecution("ERROR", "FATAL", exception);
    }

    nlapiLogExecution("DEBUG", "reversal_jounal_mod::scheduled", "Script finished");

}


function callPostJournalSuitlelet(newRecord, sublistId) {
    var newRecordJson = JSON.parse(JSON.stringify(newRecord));

    //nlapiLogExecution("DEBUG", "sublist id= " + sublistId , "");
    nlapiLogExecution("DEBUG", "Post Journal", "suitelet call started sublist=" + sublistId);
    if (newRecord.getLineItemCount(sublistId) > 0) {

        //nlapiLogExecution("DEBUG", "linecount(" + sublistId + ")", ">0");

        //Add neccessary fields...
        newRecordJson["customform"] = nlapiGetContext().getSetting("SCRIPT", "custscript_tsa_wip_journal_form_2");
        newRecordJson["sublistId"] = sublistId;  // newRecordJson["sublistId"] = "line";
        newRecordJson["recordId"] = newRecord.getId();
        newRecordJson["reversal_flag"] = true;
        
        //nlapiLogExecution("DEBUG", "json", JSON.stringify(newRecordJson));

        //Call suitelet
        //var url = "https://825746-sb2.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=517&deploy=1&compid=825746_SB2&h=4d0f17c143905b664e50";
        var url = nlapiResolveURL('SUITELET', 'customscript_sa_vs_submit_journal_sl10', 'customdeploy_sa_vs_submit_journal_sl10', 'external');

        var suiteletResponse = nlapiRequestURL(url, JSON.stringify(newRecordJson), null, null, "POST");
        var suiteletText = suiteletResponse.getBody();
        nlapiLogExecution("DEBUG", "Post Journal", "response=" + JSON.stringify(suiteletText));

        return JSON.stringify(suiteletText).replace(/"/g, '');
    }
    return "";
}

function getOriginatingTransferJournalId(reversalOfNumber) {

    nlapiLogExecution("DEBUG", "reversalOfNumber=", reversalOfNumber);

    if (!reversalOfNumber) {
        return "";
    }

    //Find originating journal id
    var journalEntrySearch1 = nlapiSearchRecord("journalentry", null,
        [["numbertext", "is", reversalOfNumber]],
        [new nlobjSearchColumn("internalid")]
    );
    if (journalEntrySearch1 != null && journalEntrySearch1.length > 0) {

        var searchresult = journalEntrySearch1[0];
        var columns = searchresult.getAllColumns();
        var originatingJournalId = searchresult.getValue(columns[0]);

        nlapiLogExecution("DEBUG", "originatingJournalId=", originatingJournalId);
    }

    if (originatingJournalId) {
        //Find originating journal's transfer journal
        var journalEntrySearch2 = nlapiSearchRecord("journalentry", null,
            [["type", "anyof", "Journal"], "AND",
            ["custbody_wip_source_transaction", "anyof", originatingJournalId], "AND",
            ["mainline", "is", "T"]
            ],
            [new nlobjSearchColumn("internalid")]
        );

        if (journalEntrySearch2 != null && journalEntrySearch2.length > 0) {

            var searchresult = journalEntrySearch2[0];
            var columns = searchresult.getAllColumns();
            var originatingTransferJournalId = searchresult.getValue(columns[0]);

            nlapiLogExecution("DEBUG", "originatingTransferJournalId=", originatingTransferJournalId);
            return originatingTransferJournalId;
        }
    }

    return "";
}
