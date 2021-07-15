/****************************************************************************************
 * Name:		SuiteScript 2.0 Client (TSA_VS_set_account_on_category_cs2.js)
 *
 * Script Type:	Client
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Allow usage of expense account & expense category
 * 
 * Date:        24/06/2021
 *
 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/log','N/search', 'N/runtime', 'N/record'],

    function (log,  search, runtime, record) {

        //#region ******************************  FIELD CHANGE  ************************************* 

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
        function fieldChanged(scriptContext) {

            try {

                console.log("set_account_on_category::fieldChanged Started");

                var sublistId = scriptContext.sublistId;
                var currentRecord = scriptContext.currentRecord;
                if (scriptContext.fieldId == "category") {

                    var category = currentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: "category" });
                    console.log("set_account_on_category::category=" + category);

                    if (category) {
                        window.nlapiDisableLineItemField("expense", "expenseaccount", true);
                        console.log("set_account_on_category::account disabled");
                    }
                    else {
                        window.nlapiDisableLineItemField("expense", "expenseaccount", false);
                        console.log("set_account_on_category::account enabled");
                    }
                }

                console.log("set_account_on_category::fieldChanged Finished");
            }
            catch (e) {
                console.log("set_account_on_category::fieldChanged Error message=" + e);
            }
            finally {
            }
        }

        //#endregion


        return {
            fieldChanged: fieldChanged
        };
    });

