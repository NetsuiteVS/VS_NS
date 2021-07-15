/****************************************************************************************
 * Name:		SuiteScript 2.0 Client (#TSA_VS_mass_approval_v2_cs20.js)
 *
 * Script Type:	Client
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     
 * 
 * Date:        03/08/2020 - This is the file!
 *
 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/log', 'N/http', 'N/https', 'N/search', 'N/runtime', 'N/record', 'N/translation', 'N/currentRecord', 'N/ui/dialog'],

    function (url, log, http, https, search, runtime, record, translation, currentRecordParam, dialog) {

        var finalResult = false; //User provided final answer from confirm box        
        var finalResultSet = false;//Flag to indicate if user provided final answer or not
        var currentRecord;
        var sublistID = 'custpage_sublist';
        var numberOfSelected;

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

                console.log("mass_approval_v2::fieldChanged() fired");

                var fieldId = scriptContext.fieldId;

                if (fieldId == "custpage_saved_searches" || fieldId == "custpage_name_filter" || fieldId == "custpage_ihq_board_agenda" || fieldId == "custpage_ihq_board_passed" || fieldId == "custpage_trandate_from"
                    || fieldId == "custpage_trandate_to" || fieldId == "custpage_due_date_from" || fieldId == "custpage_due_date_to" || fieldId == "custpage_type") { }
                else { return; }
				
                currentRecord = scriptContext.currentRecord;
                var searchId = currentRecord.getValue({ fieldId: "custpage_saved_searches" });				
				if (fieldId == "custpage_saved_searches" && searchId && search!=""){ 
					currentRecord.setValue({ fieldId: "custpage_ihq_board_agenda", value: "T" });
					currentRecord.setValue({ fieldId: "custpage_ihq_board_passed", value: "T" }); 
				}
                //if (fieldId == "custpage_saved_searches") { currentRecord.setValue({ fieldId: "custpage_name_filter", value: "" }); }
                //var nameFilter = currentRecord.getValue({ fieldId: "custpage_name_filter" });
                var recordLineCount = currentRecord.getLineCount({ sublistId: sublistID });

                console.log("mass_approval_v2::fieldChanged() searchId:" + searchId);
                //console.log("mass_approval_v2::fieldChanged() nameFilter:" + nameFilter);
                console.log("mass_approval_v2::fieldChanged() recordLineCount:" + recordLineCount);

                console.log("mass_approval_v2::fieldChanged() searchId:" + searchId);

                //Refresh suitelet
                var suitletURL = url.resolveScript({
                    scriptId: 'customscript_tsa_vs_mass_appr_v2_sl20',
                    deploymentId: 'customdeploy_tsa_vs_mass_appr_v2_sl20',
                    returnExternalUrl: false
                });

                //console.log("mass_approval_v2::fieldChanged() suitletURL:" + suitletURL);
                console.log("mass_approval_v2::fieldChanged() custpage_trandate_from:" + convertDate(currentRecord.getValue({ fieldId: "custpage_trandate_from" })));

                suitletURL += "&selected_search=" + searchId + "&name_filter=" + currentRecord.getValue({ fieldId: "custpage_name_filter" });
                suitletURL += "&board_agenda_filter=" + currentRecord.getValue({ fieldId: "custpage_ihq_board_agenda" });
                suitletURL += "&passed_by_board_filter=" + currentRecord.getValue({ fieldId: "custpage_ihq_board_passed" });
                suitletURL += "&date_from_filter=" + convertDate(currentRecord.getValue({ fieldId: "custpage_trandate_from" }));
                suitletURL += "&date_to_filter=" + convertDate(currentRecord.getValue({ fieldId: "custpage_trandate_to" }));
                suitletURL += "&due_date_from_filter=" + convertDate(currentRecord.getValue({ fieldId: "custpage_due_date_from" }));
                suitletURL += "&due_date_to_filter=" + convertDate(currentRecord.getValue({ fieldId: "custpage_due_date_to" }));
                suitletURL += "&type_filter=" + currentRecord.getValue({ fieldId: "custpage_type" });

                console.log("mass_approval_v2::fieldChanged() suitletURL:" + suitletURL);

                if (window.onbeforeunload) {
                    window.onbeforeunload = function () { null; };
                };

                window.location.href = suitletURL;
            }
            catch (e) {
                console.log("mass_approval_v2::fieldChanged() Error message=" + e);
            }
            finally {
            }
        }

        //#endregion

        //#region ******************************  SAVE RECORD  *************************************

        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord2() {
            var currentRecord = currentRecordParam.get();
            var context = { "currentRecord": currentRecord };
            saveRecord(context);
        }

        function saveRecord(scriptContext) {

            try {

                if (!finalResultSet) {

                    // Be careful using scriptContext, because of an artificial saveRecord() call from saveRecord2()
                    currentRecord = scriptContext.currentRecord;
                    var recordLineCount = currentRecord.getLineCount({ sublistId: sublistID });
                    numberOfSelected = 0;
                    var currencyKeys = [];
                    var totalAmountPerTransactionTypePerCurrency = [];
                    var totalAmountInGBP = 0.0;

                    console.log("mass_approval_v2::saveRecord() recordLineCount:" + recordLineCount);

                    //Find all marked line and set "IHQ Bulk Approve" to true 
                    for (i = 0; i < recordLineCount; i++) {

                        console.log("mass_approval_v2::saveRecord() i:" + i);

                        currentRecord.selectLine({ sublistId: sublistID, line: i });
                        var isChecked = currentRecord.getCurrentSublistValue({ sublistId: sublistID, fieldId: 'custpage_checked' });
                        if (isChecked) {

                            numberOfSelected++;
                            console.log("mass_approval_v2::saveRecord() i:" + i + " checked");
                            var internalId = currentRecord.getCurrentSublistValue({ sublistId: sublistID, fieldId: 'custpage_internalid' });
                            console.log("mass_approval_v2::approve() internalId:" + internalId);

                            var amountInGBP = parseFloat(currentRecord.getCurrentSublistValue({ sublistId: sublistID, fieldId: 'custpage_amount' }));
                            var amountInForeignCurrency = parseFloat(currentRecord.getCurrentSublistValue({ sublistId: sublistID, fieldId: 'custpage_fxamount' }));
                            var currencyText = currentRecord.getCurrentSublistText({ sublistId: sublistID, fieldId: 'custpage_currency_txt' });
                            var currencyCode = currentRecord.getCurrentSublistValue({ sublistId: sublistID, fieldId: 'custpage_currency_code' });
                            var typeText = currentRecord.getCurrentSublistText({ sublistId: sublistID, fieldId: 'custpage_type_txt' });
                            var typeCode = currentRecord.getCurrentSublistValue({ sublistId: sublistID, fieldId: 'custpage_type_code' });
                            var exchangeRate = currentRecord.getCurrentSublistValue({ sublistId: sublistID, fieldId: 'custpage_exchange_rate' });

                            console.log("mass_approval_v2::saveRecord() amountInGBP[" + i + "]:" + amountInGBP);
                            console.log("mass_approval_v2::saveRecord() amountInForeignCurrency[" + i + "]:" + amountInForeignCurrency);
                            console.log("mass_approval_v2::saveRecord() currencyText[" + i + "]:" + currencyText);
                            console.log("mass_approval_v2::saveRecord() currencyCode[" + i + "]:" + currencyCode);
                            console.log("mass_approval_v2::saveRecord() typeText[" + i + "]:" + typeText);
                            console.log("mass_approval_v2::saveRecord() typeCode[" + i + "]:" + typeCode);
                            console.log("mass_approval_v2::saveRecord() exchangeRate[" + i + "]:" + exchangeRate);

                            totalAmountInGBP += parseFloat(amountInGBP);

                            var key = typeText + "[" + currencyText + "]";
                            if (!currencyKeys.includes(key)) {
                                currencyKeys.push(key);
                                totalAmountPerTransactionTypePerCurrency[key] = parseFloat(amountInForeignCurrency);
                                console.log("mass_approval_v2::saveRecord() totalAmountPerTransactionTypePerCurrency[" + i + "].push:" + parseFloat(amountInForeignCurrency));
                            }
                            else {
                                for (var j = 0; j < currencyKeys.length; j++) {
                                    if (currencyKeys[j] == key) {
                                        totalAmountPerTransactionTypePerCurrency[key] += parseFloat(amountInForeignCurrency);
                                        console.log("mass_approval_v2::saveRecord() totalAmountPerTransactionTypePerCurrency[" + j + "]+=:" + parseFloat(amountInForeignCurrency));
                                    }
                                }
                            }
                        }
                    }

                    currencyKeys.sort();
                    var amountPerTransactionTypePerCurrency = "";
                    for (var i = 0; i < currencyKeys.length; i++) {
                        amountPerTransactionTypePerCurrency += "<br>" + currencyKeys[i] + ": " + addCommas(parseFloat(totalAmountPerTransactionTypePerCurrency[currencyKeys[i]]).toFixed(2));
                    }

                    console.log("mass_approval_v2::saveRecord() amountPerTransactionTypePerCurrency:" + amountPerTransactionTypePerCurrency);

                    var message = "<b>Please click OK to Approve the selected Transactions</b><br><br><b>No. of Transactions Selected:</b> " + numberOfSelected + "<br><br><b>Summary Total by Currency and Transaction Type:</b>" + amountPerTransactionTypePerCurrency + "<br><br><b>Grand Total in £:</b> " + addCommas(parseFloat(totalAmountInGBP).toFixed(2));

                    dialog.confirm({
                        'title': 'Confirm',
                        'message': message
                    }).then(approve).catch(fail);

                    console.log("cs_fields_check::saveRecord() Finished(0)");
                    return false;

                }//If user provided a final answer from confirm box, return out
                else {
                    //Reset the finalResultSet flag to false in case user selected "Cancel" on the confirm box.
                    finalResultSet = false;

                    //Return will either give the control back to user or continue with saving of the record
                    console.log("mass_approval_v2::saveRecord() Finished(1)");
                    return finalResult;
                }

                console.log("mass_approval_v2::SaveRecord() Finished(2)");
            }
            catch (e) {
                console.log("mass_approval_v2::saveRecord() Error message=" + e);
            }
            finally {
            }
        }

        //Helper function called when user selects Ok or Cancel on confirm box
        function approve(result, scriptContext) {

            if (!result) {
                return;
            }

            console.log("mass_approval_v2::approve() Started");
			
			window.scrollTo(0, 0);
			window.showAlertBox('alert_info', 'Approval process started.', "Please wait it could take a while... The screen will refresh when it's ready.", NLAlertDialog.TYPE_MEDIUM_PRIORITY);
			console.log("custcol_approval:: start WIP checking");					
			setTimeout(function() { NLDoMainFormButtonAction('submitter', true); }, 200); //hideAlertBox('alert_info');
			console.log("custcol_approval:: Success");

            finalResult = result;//Sets value of finalResult to user provided answer            
            finalResultSet = true;//Updates the finalResultSet flag to true to indicate that user has made his/her choice
            //NLDoMainFormButtonAction('submitter', true);//clicking Save button programmatically
        }

        function fail(reason) {
            console.log("mass_approval_v2::fail() Started");
            return false;
        }

        //#endregion

        //#region ******************************  MARK AND UNMARK ALL  *************************************

        function markAll() {

            try {

                console.log("mass_approval_v2::markAll() Started");

                var currentRecord = currentRecordParam.get();
                var searchId = currentRecord.getValue({ fieldId: "custpage_saved_searches" });
                var sublistID = 'custpage_sublist';
                var recordLineCount = currentRecord.getLineCount({ sublistId: sublistID });

                //Mark all the sublistlines
                for (i = 0; i < recordLineCount; i++) {
                    currentRecord.selectLine({ sublistId: sublistID, line: i });
                    currentRecord.setCurrentSublistValue({ sublistId: sublistID, fieldId: 'custpage_checked', value: true, ignoreFieldChange: true });
                    currentRecord.commitLine({ sublistId: sublistID });
                }

                log.debug("mass_approval_v2::mark_all", "markAll() Finished");

            }
            catch (e) {
                console.log("mass_approval_v2::Field changed - Error message=" + e);
                log.debug("mass_approval_v2::Field changed - ERROR", e);
            }
            finally {
            }
        }

        function unmarkAll() {
            console.log("mass_approval_v2::unmarkAll() Started");

            var currentRecord = currentRecordParam.get();
            var searchId = currentRecord.getValue({ fieldId: "custpage_saved_searches" });
            var sublistID = 'custpage_sublist';
            var recordLineCount = currentRecord.getLineCount({ sublistId: sublistID });

            //Unmark all the sublistlines
            for (i = 0; i < recordLineCount; i++) {
                currentRecord.selectLine({ sublistId: sublistID, line: i });
                currentRecord.setCurrentSublistValue({ sublistId: sublistID, fieldId: 'custpage_checked', value: false, ignoreFieldChange: true });
                currentRecord.commitLine({ sublistId: sublistID });
            }

            log.debug("mass_approval_v2::mark_all", "unmarkAll() Finished");
        }

        function addCommas(nStr) {
            nStr += '';
            var x = nStr.split('.');
            var x1 = x[0];
            var x2 = x.length > 1 ? '.' + x[1] : '';
            var rgx = /(\d+)(\d{3})/;
            while (rgx.test(x1)) {
                x1 = x1.replace(rgx, '$1' + ',' + '$2');
            }
            return x1 + x2;
        }

        function convertDate(dateToConvert) {

            if (!dateToConvert || dateToConvert.length == 0) {
                return "";
            }
            console.log("mass_approval_v2::fieldChanged() dateToConvert:" + dateToConvert);
            var dateConverted = new Date(Date.parse(dateToConvert));
            console.log("mass_approval_v2::fieldChanged() dateConverted:" + dateConverted);
            console.log("mass_approval_v2::fieldChanged() dateConverted:" + JSON.stringify(dateConverted));
            var day = (dateConverted.getDate() < 10 ? '0' : '') + dateConverted.getDate();
            var month = (dateConverted.getMonth() < 9 ? '0' : '') + (dateConverted.getMonth() + 1);
            var year = dateConverted.getFullYear();

            console.log("mass_approval_v2::fieldChanged() day/month/year:" + day + "/" + month + "/" + year);

            return day + "/" + month + "/" + year;
        }

        //#endregion

        return {
            //pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord,
            saveRecord2: saveRecord2,
            markAll: markAll,
            unmarkAll: unmarkAll
        };
    });

