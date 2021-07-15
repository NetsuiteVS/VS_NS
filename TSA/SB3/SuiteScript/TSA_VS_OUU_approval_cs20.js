/****************************************************************************************
 * Name:		SuiteScript 2.0 Client (TSA_VS_OUU_approval_cs20.js)
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

                console.log("OUU_approval::fieldChanged() fired");

                var fieldId = scriptContext.fieldId;
                var currentRecord = scriptContext.currentRecord;

                if (fieldId == "custpage_datefrom_filter" || fieldId == "custpage_dateto_filter" || fieldId == "custpage_unit_filter" || fieldId == "custpage_owner_filter") {

                    //Get filter fields' values
                    var dateFrom = currentRecord.getValue({ fieldId: 'custpage_datefrom_filter' });
                    var dateTo = currentRecord.getValue({ fieldId: 'custpage_dateto_filter' });
                    var unit = currentRecord.getValue({ fieldId: 'custpage_unit_filter' });
                    var owner = currentRecord.getValue({ fieldId: 'custpage_owner_filter' });

                    var suitletURL = url.resolveScript({
                        scriptId: "customscript_tsa_ouu_approval",
                        deploymentId: "customdeploy_tsa_ouu_approval",
                        returnExternalUrl: false
                    });

                    suitletURL += (dateFrom ? "&dateFrom=" + parseDateBasedOnUserPreference(dateFrom, "", "String", "YYYY-MM-DD", 0, 0, 0) : "");
                    suitletURL += (dateTo ? "&dateTo=" + parseDateBasedOnUserPreference(dateTo, "", "String", "YYYY-MM-DD", 0, 0, 0) : "");
                    suitletURL += (unit ? "&unit=" + unit : "");
                    suitletURL += (owner ? "&owner=" + owner : "");
                    console.log("OUU_approval::fieldChanged() suitletURL:" + suitletURL);

                    if (window.onbeforeunload) {
                        window.onbeforeunload = function () { null; };
                    };
                    window.location.href = suitletURL;

                    console.log("OUU_approval::fieldChanged() Finished");
                }
            }
            catch (e) {
                console.log("OUU_approval::fieldChanged() Error message=" + e);
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

                    // Be careful using scriptContext, because of an artificial saveRecord() call from saveRecord2() which contains currentrecord ONLY
                    currentRecord = scriptContext.currentRecord;
                    var recordLineCount = currentRecord.getLineCount({ sublistId: sublistID });
                    numberOfSelected = 0;
                    var currencyKeys = [];
                    var totalAmountPerTransactionTypePerCurrency = [];
                    var totalAmountInGBP = 0.0;

                    console.log("OUU_approval::saveRecord() recordLineCount:" + recordLineCount);

                    //Find all marked line and set "IHQ Bulk Approve" to true 
                    for (i = 0; i < recordLineCount; i++) {
                        console.log("OUU_approval::saveRecord() i:" + i);
                        currentRecord.selectLine({ sublistId: sublistID, line: i });
                        var isChecked = currentRecord.getCurrentSublistValue({ sublistId: sublistID, fieldId: 'custpage_checked' });
                        if (isChecked) {
                            numberOfSelected++;
                            console.log("OUU_approval::saveRecord() i:" + i + " checked");
                            var internalId = currentRecord.getCurrentSublistValue({ sublistId: sublistID, fieldId: 'custpage_internalid' });
                        }
                    }

                    var message = "<b>Please click OK to Approve the selected Transactions</b><br><br><b>No. of Transactions Selected:</b> "+numberOfSelected;

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
                    console.log("OUU_approval::saveRecord() Finished(1)");
                    return finalResult;
                }

                console.log("OUU_approval::SaveRecord() Finished(2)");
            }
            catch (e) {
                console.log("OUU_approval::saveRecord() Error message=" + e);
            }
            finally {
            }
        }

        //Helper function called when user selects Ok or Cancel on confirm box
        function approve(result, scriptContext) {

            if (!result) {
                return;
            }

            console.log("OUU_approval::approve() Started");
			
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
            console.log("OUU_approval::fail() Started");
            return false;
        }

        //#endregion

        //#region ******************************  MARK AND UNMARK ALL  *************************************

        function markAll() {

            try {

                console.log("OUU_approval::markAll() Started");

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

                log.debug("OUU_approval::mark_all", "markAll() Finished");

            }
            catch (e) {
                console.log("OUU_approval::Field changed - Error message=" + e);
                log.debug("OUU_approval::Field changed - ERROR", e);
            }
            finally {
            }
        }

        function unmarkAll() {
            console.log("OUU_approval::unmarkAll() Started");

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

            log.debug("OUU_approval::mark_all", "unmarkAll() Finished");
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

        var dateFormatMapping;
        var inputDateFormatProps;
        var outputDateFormatProps;
        /**
        * Converts a Date to a given format and type. 
        * Month in Date to convert must be start by 1 not 0. Fe. in case of January: 1, 01, Jan, January. IMPORTANT! Only English Month names can be used.
        * In input and output format you can use the following: 
        *      Separators: '/' ; '.' ; '-' ; ', ' Last separator contains a space char too!
        *      Expressions: 'D' ; 'DD' ; 'M' ; 'MM' ; 'Mon' ; 'MONTH' ; 'YYYY' 
        *
        * @param {Object} date - Date or String. (Fe.: new Date() OR "2022.Feb.01")
        * @param {String} inputFormat - Used only when date parameter's type is String. You can use "User Preference" only at server side. (Fe.: "YYYY.Mon.DD", "User Preference")
        * @param {String} outputType - Possible values are: "String" or "Date"
        * @param {String} outputFormat - Used only when outputType is String. You can use "User Preference" only at server side. (Fe.: "YYYY.Mon.DD", "User Preference")
        * @param {Integer} addDay - Day(s) to add to input date.
        * @param {Integer} addMonth - Month(s) to add to input date.
        * @param {Integer} addYear - Year(s) to add to input date.
        * @Since 2015.2
        */
        function parseDateBasedOnUserPreference(date, inputFormat, outputType, outputFormat, addDay, addMonth, addYear) {

            //Define possible date format conversions at first call
            if (!dateFormatMapping) {
                dateFormatMapping = [];
                dateFormatMapping["D"] = { values: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"] };
                dateFormatMapping["DD"] = { values: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"] };
                dateFormatMapping["M"] = { values: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"] };
                dateFormatMapping["MM"] = { values: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"] };
                dateFormatMapping["MON"] = { values: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] };
                dateFormatMapping["MONTH"] = { values: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] };
            }

            var inputType = (typeof date.getMonth === 'function') ? "Date" : "String";
            inputFormat = inputType == "Date" ? "" : inputFormat.toUpperCase();
            outputFormat = outputType == "Date" ? "" : outputFormat.toUpperCase();

            log.debug("createDateFormatProp()", "date=" + date + ", inputType=" + inputType + ", inputFormat=" + inputFormat + ", outputType=" + outputType + ", outputFormat=" + outputFormat
                + ", addDay=" + addDay + ", addMonth=" + addMonth + ", addYear=" + addYear);

            //Init Date formats to use. 
            var userPreferenceFormat;
            if (typeof config !== 'undefined') {
                var companyInfo = config.load({ type: config.Type.USER_PREFERENCES });
                userPreferenceFormat = companyInfo.getValue({ fieldId: 'DATEFORMAT' }).toUpperCase();
                inputFormat = inputFormat == "USER PREFERENCE" ? userPreferenceFormat : inputFormat;
                outputFormat = outputFormat == "USER PREFERENCE" ? userPreferenceFormat : outputFormat;

                if (inputFormat == "USER PREFERENCE" || outputFormat == "USER PREFERENCE") {
                    log.debug("createDateFormatProp()", "In a client side script you cannot use 'user preference' format");
                    return "";
                }
            }
            else if (inputFormat == "USER PREFERENCE" || outputFormat == "USER PREFERENCE") {
                log.debug("createDateFormatProp()", "In a client side script you cannot use 'user preference' format");
                return "";
            }

            //If format doesn't changes use previously processed values
            if (inputFormat.length > 0) {
                inputDateFormatProps = createDateFormatProp(inputFormat, inputDateFormatProps);
                //log.debug("parseDateBasedOnUserPreference()", "inputFormat=" + inputFormat + ", inputDateFormatProps=" + JSON.stringify(inputDateFormatProps));
            }

            if (outputFormat.length > 0) {
                outputDateFormatProps = createDateFormatProp(outputFormat, outputDateFormatProps);
                //log.debug("parseDateBasedOnUserPreference()", "outputFormat=" + outputFormat + ", outputDateFormatProps=" + JSON.stringify(outputDateFormatProps));
            }

            //If input type is String, convert it to Date 
            var outputDate;
            if (inputType.toLowerCase() == "date") {
                outputDate = date;
            }
            else {

                var splittedDate = date.replace(".", "/").replace(".", "/").replace(/-/g, "/").replace(/, /g, "/").split("/");
                var day = splittedDate[inputDateFormatProps.dayPosition];
                var month = splittedDate[inputDateFormatProps.monthPosition];
                var year = splittedDate[inputDateFormatProps.yearPosition];

                //Convert to integer
                day = day[0] == 0 ? day[1] : day;//Remove leading zeros
                monthIndex = dateFormatMapping[inputDateFormatProps.monthFormat].values.indexOf(month);//Converts month to 0 based integer

                //Create new date
                outputDate = new Date(parseInt(year), parseInt(monthIndex), parseInt(day));
            }

            //Modifiy date if asked by parameter
            if (addDay && addDay > 0) { outputDate.setDate(outputDate.getDate() + addDay); }
            if (addMonth && addMonth > 0) { outputDate.setMonth(outputDate.getMonth() + addMonth); }
            if (addYear && addYear > 0) { outputDate.setFullYear(outputDate.getFullYear() + addYear); }

            //If output type is Date lets return
            if (outputType.toLowerCase() == "date") {
                log.debug("parseDateBasedOnUserPreference()", "Return outputDate=" + outputDate);
                return outputDate;
            }
            //log.debug("parseDateBasedOnUserPreference()", "outputDate=" + outputDate);

            //Create return date string in the asked format
            var outputDateStr = outputFormat;
            outputDateStr = outputDateStr.replace(outputDateFormatProps.dayFormat, dateFormatMapping[outputDateFormatProps.dayFormat].values[outputDate.getDate() - 1]);
            outputDateStr = outputDateStr.replace(outputDateFormatProps.monthFormat, dateFormatMapping[outputDateFormatProps.monthFormat].values[outputDate.getMonth()]);
            outputDateStr = outputDateStr.replace(outputDateFormatProps.yearFormat, outputDate.getFullYear());

            log.debug("parseDateBasedOnUserPreference()", "outputDateStr=" + outputDateStr);

            return outputDateStr;
        }

        function createDateFormatProp(dateFormat, dateFormatProps) {

            if (!dateFormatProps || dateFormatProps.dateFormat != dateFormat) {

                dateFormatProps = {};
                dateFormatProps.dateFormat = dateFormat;

                var unifiedDateFormat = dateFormat.replace(".", "/").replace(".", "/").replace(/-/g, "/").replace(/, /g, "/").split("/");
                dateFormatProps.dayFormat = unifiedDateFormat[0][0] == "D" ? unifiedDateFormat[0] : (unifiedDateFormat[1][0] == "D" ? unifiedDateFormat[1] : unifiedDateFormat[2]);
                dateFormatProps.monthFormat = unifiedDateFormat[0][0] == "M" ? unifiedDateFormat[0] : (unifiedDateFormat[1][0] == "M" ? unifiedDateFormat[1] : unifiedDateFormat[2]);
                dateFormatProps.yearFormat = unifiedDateFormat[0][0] == "Y" ? unifiedDateFormat[0] : (unifiedDateFormat[1][0] == "Y" ? unifiedDateFormat[1] : unifiedDateFormat[2]);

                dateFormatProps.dayPosition = unifiedDateFormat[0][0] == "D" ? 0 : (unifiedDateFormat[1][0] == "D" ? 1 : 2);
                dateFormatProps.monthPosition = unifiedDateFormat[0][0] == "M" ? 0 : (unifiedDateFormat[1][0] == "M" ? 1 : 2);
                dateFormatProps.yearPosition = unifiedDateFormat[0][0] == "Y" ? 0 : (unifiedDateFormat[1][0] == "Y" ? 1 : 2);
            }
            return dateFormatProps;
        }

        //#endregion

        return {
            fieldChanged: fieldChanged,
            saveRecord: saveRecord,
            saveRecord2: saveRecord2,
            markAll: markAll,
            unmarkAll: unmarkAll
        };
    });

