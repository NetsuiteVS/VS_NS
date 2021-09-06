/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 
 */

/*
    20/06/2019 - Viktor Schumann

    Check the account before saving to be the only one default bank account for that particular subsidiary and currency
*/

define(['N/record', 'N/log', 'N/search', 'N/runtime', 'N/translation', 'N/error', 'SuiteScripts/vs_lib.js'],
    function (record, log, search, runtime, translation, error, vs_lib) {

        var errorMsg;

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {
            try {

              	//if (vs_lib.userSubsidiaryIsIHQ()) return true;
              
                log.debug("curr_and_sd_chk::beforeSubmit", "Started");

                var currentRecord = scriptContext.newRecord;
                var isDefaultIou = currentRecord.getValue({ fieldId: 'custrecord_tsa_default_iou' });
                var accountId = currentRecord.getValue({ fieldId: 'id' });
				log.debug("curr_and_sd_chk::beforeSubmit", "account id=" + accountId);
              
                if (accountId == null || accountId.length == 0) {
                    accountId = "0";
                }
                //var currentSubsidiary = JSON.stringify(currentRecord.getValue({ fieldId: 'subsidiary' }));
              	var currentSubsidiary = currentRecord.getValue({ fieldId: 'subsidiary' })[0];
				var unit = currentRecord.getValue({ fieldId: 'class' });
                //Cannot use directly gettext function in dynamic mode when creating new record
                //like "currentRecord.getText({ fieldId: 'currency' })"...
                var currentCurrencyTxt = "";
                var currentCurrencyValue = currentRecord.getValue({ fieldId: 'currency' });
                log.debug("curr_and_sd_chk::beforeSubmit", "currentCurrencyValue=" + currentCurrencyValue);

                if (currentCurrencyValue.length > 0) {
                    log.debug("curr_and_sd_chk::beforeSubmit", "gettext running");

                    //Tried this but didn't work - 30/08/2019" - getSelectOptions doesnt exits on field
                    //var currencyField = currentRecord.getField({ fieldId: 'currency' });
                    //var options = currencyField.getSelectOptions({ filter: currentCurrencyValue, filteroperator: 'is' });
                    //if (options.length > 0) {
                    //    currentCurrencyTxt = options[0].value;
                    //}

                    var currencyFields = search.lookupFields({
                        type: 'currency',
                        id: currentCurrencyValue,
                        columns: 'name'
                    });

                    currentCurrencyTxt = currencyFields.name;
                    log.debug("curr_and_sd_chk::beforeSubmit", "currencyFields.name=" + currencyFields.name);
                }

                if (currentCurrencyTxt.length == 0) {
                    log.debug("curr_and_sd_chk::beforeSubmit", "No currency was selected.");
                    return true;
                }

                //Don't do anything when actual record's not signed as default IOU bank...
                if (!isDefaultIou || isDefaultIou == "false") {
                    return;
                }

                //This function will return true and trhows error when there is an other Account record
                //with checked DEFAULT IOU BANK field and with the same currency and subsidiary as the current record.
                result_str = isThereAnyExitingDefaultIou(accountId, currentCurrencyTxt, currentSubsidiary, unit);
                if (result_str) {
                    errorMsg = 'MSG_ACCOUNT_ERR';
                }
            }
            catch (e) {
                log.debug("curr_and_sd_chk::beforeSubmit", "Error=" + e);
                throw (e);
            }
            finally {
                if (errorMsg) {
                    errorMsg = translation.get({ collection: 'custcollection__tsa_collection_01', key: errorMsg, locale: translation.Locale.CURRENT })();
                    //createAndThrowError("<h2>" + errorMsg + "</BR></BR>" + result_str + "</BR></BR></h2>");
                }
            }
        }

        function isThereAnyExitingDefaultIou(accountId, currencyTXT, subsidiary, unit) {

            log.debug("isThereAnyExitingDefaultIou", "accountId="+accountId+", currencyTXT="+currencyTXT+", subsidiary="+subsidiary+", unit="+unit);
			
			var logic="isempty";
			if(unit){logic="is";}
			else{
				unit=null;
			}
			
            var accountSearchObj = search.create({
                type: "account",
                filters:
                    [
                        ["internalid", "noneof", accountId],
                        "AND",
                        ["custrecord_tsa_default_iou", "is", "T"],
                        "AND",
                        ["custrecord_tsa_acc_currency", "is", currencyTXT],
                        "AND",
                       // ["class", logic, unit], // "restrict to class" field
                       // "AND",						
                        ["subsidiary", "anyof", subsidiary]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        search.createColumn({ name: "custrecord_tsa_default_iou", label: "Default IOU Bank" }),
                        search.createColumn({ name: "custrecord_tsa_acc_currency", label: "TSA Currency" }),
                        search.createColumn({ name: "subsidiary", label: "Subsidiary" }),
                        search.createColumn({ name: "number", label: "Number" })
                    ]
            });

            var result_str;
            accountSearchObj.run().each(function (result) {

                // .run().each has a limit of 4,000 results
                result_str = " internalid=" + result.getValue({ name: 'internalid' }) + " number=" + result.getValue({ name: 'number' }) + " name=" + result.getValue({ name: 'name' }) + " subs=" + result.getValue({ name: 'subsidiary' });

                log.debug("curr_and_sd_chk::isThereAnyExitingDefaultIou", JSON.stringify(result));

                return true;
            });

            return result_str;
        }

        function createAndThrowError(errorMsg) {
            var errorObj = error.create({
                name: 'ACC_EXITS_DEF_IOU',
                message: errorMsg,
                notifyOff: true
            });
            //throw errorObj;
            throw errorMsg;
        }

        return {
            beforeSubmit: beforeSubmit
        };

    });
