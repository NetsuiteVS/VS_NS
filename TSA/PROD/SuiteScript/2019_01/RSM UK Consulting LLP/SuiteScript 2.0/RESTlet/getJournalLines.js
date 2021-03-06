/****************************************************************************************
 * Name:		Get Journal Lines (getJournalLines.js)
 *
 * Script Type:	RESTlet
 *
 * Purpose:		Get List of Journal Entry lines from Search.
 *
 * Script:		customscript_getjournallines
 * Deploy:		customdeploy_getjournallines

 ****************************************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/runtime'], //,'./Library.FHL.2.0'
/**
 * @param {search} Search
 * @param {runtime} Runtime
 */
function(Search, Runtime) //, Library
{
	'use strict';

    /**
     * Function called upon sending a GET request to the RESTlet.
     *
     * @since 1.0.0
     * @public
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     */
    function getJournalLines(requestParams)
    {
    	var journalSearch = null;
    	var runSearch = null;
    	var returnString = '';
    	var lineString = '';
    	var lineArray = [];
    	var cellString = '';
    	var objScript = null;
    	var searchId = '';
    	var columns = [];
    	var idFilter = null;
    	var projectFilter = null;

    	//try
    	//{
    		log.debug("","*** Restlet Started ***");
    		objScript = Runtime.getCurrentScript();
    		searchId = objScript.getParameter({ name : 'custscript_journalsearch' });
            log.debug("", "searchId=" + searchId);

            if (!requestParams.project) {
                return "Project parameter is mandatory in the request.";
            }

            var journalSearchObj = Search.create({
                type: "transaction",
                filters: [
                        ["posting", "is", "T"], "AND",
                        ["account", "noneof", "3417", "3419", "3421", "3423", "3425", "3427", "3429", "3431", "3418", "3420", "3422", "3424", "3426", "3428", "3430", "3432"], "AND",
                        ["accounttype", "anyof", "OthIncome", "OthExpense", "Expense", "Income", "COGS", "FixedAsset"]
                    ],
                columns:
                    [
                        Search.createColumn({ name: "subsidiary", label: "Subsidiary" }),
                        Search.createColumn({ name: "class", label: "Unit" }),
                        Search.createColumn({ name: "department", label: "Department" }),
                        Search.createColumn({ name: "custcol_cseg_tsa_fundreserv", label: "Reserve" }),
                        Search.createColumn({ name: "internalid", join: "CUSTCOL_CSEG_TSA_PROJECT", label: "Internal ID" }),
                        Search.createColumn({ name: "custcol_cseg_tsa_project", label: "Project" }),
                        Search.createColumn({ name: "internalid", join: "line.cseg_tsa_act_code", label: "Internal ID" }),
                        Search.createColumn({ name: "line.cseg_tsa_act_code", label: "Project Activity Code" }),
                        Search.createColumn({ name: "trandate", label: "Date" }),
                        Search.createColumn({ name: "postingperiod", label: "Period" }),
                        Search.createColumn({ name: "type", label: "Type" }),
                        Search.createColumn({ name: "tranid", label: "Document Number" }),
                        Search.createColumn({ name: "transactionnumber", label: "Transaction Number" }),
                        Search.createColumn({ name: "entity", label: "Name" }),
                        Search.createColumn({ name: "account", label: "Account" }),
                        Search.createColumn({ name: "name", join: "account", label: "Name" }),
                        Search.createColumn({ name: "number", join: "account", label: "Number" }),
                        Search.createColumn({ name: "accounttype", label: "Account Type" }),
                        Search.createColumn({ name: "amount", label: "Amount" }),
                        Search.createColumn({ name: "currency", label: "Currency" }),
                        Search.createColumn({ name: "memo", label: "Memo" }),
                        Search.createColumn({ name: "memomain", label: "Memo (Main)" }),
                        Search.createColumn({ name: "lineuniquekey", label: "Line Unique Key" }),
                        Search.createColumn({ name: "linelastmodifieddate", label: "Line Last Modified" })
                    ]
            });

            log.debug("", "project=" + requestParams.project);
            projectFilter = Search.createFilter({ name: 'custcol_cseg_tsa_project', operator: Search.Operator.ANYOF, values: requestParams.project });
            journalSearchObj.filters.push(projectFilter);

            if (requestParams.fromid) {
                log.debug("", "fromid=" + requestParams.fromid);
                idFilter = Search.createFilter({ name: 'internalidnumber', operator: Search.Operator.GREATERTHANOREQUALTO, values: requestParams.fromid });
                journalSearchObj.filters.push(idFilter);
            }

            log.debug("transactionSearchObj result count", journalSearchObj.runPaged().count);
            columns = journalSearchObj.columns;
            log.debug("", "search columns=" + JSON.stringify(columns));
            log.debug("", "journalSearch=" + JSON.stringify(journalSearchObj));
            log.debug("", "runSearch");

            var i = 0;
            var journalSearchPaged = journalSearchObj.runPaged({ pageSize: 1000 });
            journalSearchPaged.pageRanges.forEach(function (page_range) {

                var journalPage = journalSearchPaged.fetch({ index: page_range.index });
                journalPage.data.every(function (result) {

                    i++;
                    log.debug("i=" + i, "result=" + JSON.stringify(result));
                    lineArray = [];
                    cellString = '';

                    for (var x in columns) {
                        cellString = result.getText(columns[x]);

                        if (!cellString || cellString === '') {
                            cellString = result.getValue(columns[x]);
                        }

                        cellString = '"' + cellString + '"';
                        lineArray.push(cellString);
                    }

                    returnString += lineArray.join(',');
                    returnString += '\r\n';

                    return true;
                });
                return true;
            });
    	//}
    	//catch(e)
        //   {
        //       Library.errorHandler("getJournalLines", e);
    	//}

    	return returnString;
    }

    return {
        'get': getJournalLines,
    };

});
