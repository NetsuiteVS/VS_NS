/****************************************************************************************
 * Name:		SuiteScript 2.0 Client (TSA_VS_disable_amount_cs20.js)
)
 *
 * Script Type:	Client
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Disables the modification of Amount and Gross amount columns when the price level is not Custom.
 * 
 * Date:        22/08/2019
 *
 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/log', 'N/search', 'N/runtime', 'N/record', 'SuiteScripts/vs_lib.js'],

    function (log, search, runtime, record, vs_lib) {

        //#region ******************************  LINE INIT  ************************************* 

        /**
         * Function to be executed after line is selected.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(context) {
            
            try {
				
				//if (vs_lib.userSubsidiaryIsIHQ()) return true;

                console.log("disable_amount::LI fired");

                var currentRecord = context.currentRecord;
                var sublistId = context.sublistId;
                var currIndex = currentRecord.getCurrentSublistIndex({ sublistId: sublistId });

                console.log("disable_amount::LI sublistId= " + sublistId);
                console.log("disable_amount::LI currIndex= " + currIndex);

                if (sublistId != "item") {
                    return true;
                }

                var item = currentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: "item" });
                console.log("disable_amount::LI item= " + item);
                if (item == null || item.length == 0) {
                    return true;
                }

                var priceLevelValue = currentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: "price" });
                console.log("disable_amount::LI priceLevelValue= " + priceLevelValue);
                var amountField = currentRecord.getSublistField({sublistId: sublistId, fieldId: 'amount', line: currIndex});
                var grossAmountField = currentRecord.getSublistField({ sublistId: sublistId, fieldId: 'grossamt', line: currIndex });

                if (priceLevelValue == null || priceLevelValue != -1) {
                    console.log("disable_amount::LI Set amount and gross amount disabled ");
                    amountField.isDisabled = true;
                    grossAmountField.isDisabled = true;
                }
            }
            catch (e) {
                console.log("disable_amount::LI - Error message=" + e);
                log.debug("disable_amount::LI  - Error", e);
            }
            finally {
            }
        }

        //#endregion

        //#region ******************************  FIELD ONCHANGE  ************************************* 

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
        function fieldChanged(context) {

            try {
				
				//if (vs_lib.userSubsidiaryIsIHQ()) return true;

                var currentRecord = context.currentRecord;
                var sublistId = context.sublistId;
                var fieldId = context.fieldId;
                var currIndex;
                if (sublistId != null) {
                    currIndex = currentRecord.getCurrentSublistIndex({ sublistId: sublistId });
                }

                console.log("disable_amount::FC fieldChanged fired : sublistId= " + sublistId + "; fieldId= " + fieldId + "; currIndex= " + currIndex);

                if ((fieldId != "price" && fieldId != "item")  || sublistId == null) {
                    return true;
                }

                var priceLevelValue = currentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: "price" });
                console.log("disable_amount::FC priceLevelValue= " + priceLevelValue);
                //var amountField = currentRecord.getSublistField({ sublistId: sublistId, fieldId: 'amount', line: currIndex });
                //var grossAmountField = currentRecord.getSublistField({ sublistId: sublistId, fieldId: 'grossamt', line: currIndex });

              	window.nlapiSetLineItemDisabled("item","amount",(priceLevelValue == null || priceLevelValue != -1));
              	window.nlapiSetLineItemDisabled("item","grossamt",(priceLevelValue == null || priceLevelValue != -1));
                //amountField.isDisabled = (priceLevelValue == null || priceLevelValue != -1);
                //grossAmountField.isDisabled = (priceLevelValue == null || priceLevelValue != -1);
            }
            catch (e) {
                console.log("disable_amount::FC - Error message=" + e);
                log.debug("disable_amount::FC - Error", e);
            }
            finally {
            }
        }

        //#endregion

        return {
            fieldChanged: fieldChanged,
            lineInit: lineInit
        };
    });

