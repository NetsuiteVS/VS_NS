/****************************************************************************************
 * Name:		SuiteScript 2.0 Client (TSA_VS_Update_Tax_Code_On_Expense_Category.js)
 *
 * Script Type:	Client
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     NetSuite has the concept of a default tax code, but this is 1 tax code for the whole nexus and is setup in 
 * “Setup Taxes” For expense categories customisation would need to built because as standard you can’t default a tax code 
 * specific to expense categories. If an expense category will be used in multiple subsidiaries with different tax codes and 
 * nexus then the best solution would be to build an intermediate record where the tax code is looked up via script.
 * 
 * Date:        16/08/2019
 *
 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/log', 'N/https', 'N/search', 'N/runtime', 'N/record', 'N/translation'],

    function (url, log, https, search, runtime, record, translation) {

        //#region ******************************  FIELD CHANGED  ************************************* 

        function fieldChanged(context) {

            try {

                console.log("Update_Tax_Code_On_Expense_Category:: *** fieldChanged fired ***");

                var currentRecord = context.currentRecord;
                var recordType = currentRecord.type;
                var id = currentRecord.getValue("id");
                var sublistId = context.sublistId;
                var fieldId = context.fieldId;
                var TaxNoLoopStorageKey = "TaxNoLoopStorageKey";
                var idCheck = true;//(id == 58381 || id == 62708 || id == 62703 || id == "");//2814

                console.log("Update_Tax_Code_On_Expense_Category:: id= " + id);
                console.log("Update_Tax_Code_On_Expense_Category:: recordType= " + recordType);
                console.log("Update_Tax_Code_On_Expense_Category:: sublistID= " + sublistId);
                console.log("Update_Tax_Code_On_Expense_Category:: fieldID= " + fieldId);
                console.log("Update_Tax_Code_On_Expense_Category:: localstorage= " + localStorage.getItem(TaxNoLoopStorageKey));

                if (sublistId == "expense" && fieldId == "category") {//2814

                    localStorage.setItem(TaxNoLoopStorageKey, "Disabled");
                }

                var taxOnchangeEnabled = (String(localStorage.getItem(TaxNoLoopStorageKey))) == "Disabled";
                
                if ((recordType == "expensereport" && sublistId == "expense" && fieldId == "category" && idCheck)
                    || (recordType == "purchaseorder" && sublistId == "expense" && fieldId == "taxcode" && taxOnchangeEnabled && idCheck)
                    || (recordType == "vendorbill" && sublistId == "expense" && fieldId == "taxcode" && taxOnchangeEnabled && idCheck)) {

                    localStorage.setItem(TaxNoLoopStorageKey, "Enabled");

                    var subsidiary = currentRecord.getValue("subsidiary");
                    var subsidiaryText = currentRecord.getText("subsidiary");
                    var category = currentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'category' });
                    var categoryText = currentRecord.getCurrentSublistText({ sublistId: sublistId, fieldId: 'category' });
                    var currentLine = context.line;

                    console.log("Update_Tax_Code_On_Expense_Category:: subsidiary= " + subsidiary);
                    console.log("Update_Tax_Code_On_Expense_Category:: subsidiaryText= " + subsidiaryText);
                    console.log("Update_Tax_Code_On_Expense_Category:: category= " + category);
                    console.log("Update_Tax_Code_On_Expense_Category:: categoryText= " + categoryText);
                    console.log("Update_Tax_Code_On_Expense_Category:: currentLine= " + currentLine);

                    var customrecord_tsa_vs_tax_code_per_exp_catSearchObj = search.create({
                        type: "customrecord_tsa_vs_tax_code_per_exp_cat",
                        filters:[["custrecord_tsa_vs_expense_category", "anyof", category],
                                "AND",
                                ["custrecord_tsa_vs_subsidiary", "anyof", subsidiary]],
                        columns:[search.createColumn({ name: "custrecord_tsa_vs_tax_code", label: "Tax Code" })]
                    });

                    customrecord_tsa_vs_tax_code_per_exp_catSearchObj.run().each(function (result) {

                        var taxCode = currentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'taxcode' });
                        console.log("Update_Tax_Code_On_Expense_Category:: Tax Code before change= " + taxCode);

                        taxCode = result.getValue({ name: "custrecord_tsa_vs_tax_code" });
                        console.log("Update_Tax_Code_On_Expense_Category:: Tax Code update value= " + taxCode);
                        currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'taxcode', value: taxCode, ignoreFieldChange: false });
                
                        taxCode = currentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'taxcode' });
                        console.log("Update_Tax_Code_On_Expense_Category:: Tax Code after update= " + taxCode);
                        return false;
                    });
                }

            }
            catch (e) {
                console.log("Error message=" + e);
                log.debug("Update_Tax_Code_On_Expense_Category::fieldChanged - Error", e);
            }
            finally {
            }
        }

        //#endregion

        return {
            fieldChanged: fieldChanged
        };
    });

