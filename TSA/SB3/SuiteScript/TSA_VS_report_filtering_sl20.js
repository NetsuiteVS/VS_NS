/****************************************************************************************
 * Name:		SuiteScript 2.0 Suitelet (TSA_VS_report_filtering_sl20.js)
 *
 * Script Type:	Suitelet
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Filtering of some reports' dropdown lists
 * 
 * Date:        27/08/2020
 *
 ****************************************************************************************/



/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/redirect', 'N/record', 'N/format', 'N/runtime', 'N/file', 'N/format', 'N/transaction'],

    function (serverWidget, search, redirect, record, format, runtime, file, format, transaction) {

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(scriptContext) {

            //#region ******************************  GET  ************************************* 

            if (scriptContext.request.method == 'GET') {
                try {

                    log.debug("report_filtering::GET", "STARTED");

                    var request = scriptContext.request;
                    var reportTitle = request.parameters.report_title;
                    var userID = runtime.getCurrentUser().id;

                    log.debug("report_filtering::GET", "userID:" + userID);

                    //var userUnit = search.lookupFields({ type: 'employee', id: userID, columns: 'class' });
                    //log.debug("report_filtering::GET", "userUnitObj:" + JSON.stringify(userUnit));
                    //log.debug("report_filtering::GET", "userUnit:" + userUnit.class[0].value);
                    //var userSubsidiary = search.lookupFields({ type: 'employee', id: userID, columns: 'subsidiary' }).subsidiary[0].value;
                    //log.debug("report_filtering::GET", "userSubsidiary:" + JSON.stringify(userSubsidiary));

                    //Filter array size could be max 1000 so we may have to run query more than once
                    var reportFilterArrayInitialization = "var reportFilterArray = [";
                    var userUnits = [];
                    var checkSum = 0;

                    var userUnitSearchObj = search.create({
                        type: "classification",
                        filters: [
                            ["subsidiary", "anyof", "@CURRENT@"], "AND",
                            ["isinactive", "is", "F"]
                        ],
                        columns: [
                            search.createColumn({ name: "name", sort: search.Sort.ASC, label: "Name" }),
                            search.createColumn({ name: "internalid", label: "Internal ID" })
                        ]
                    });
                    var count = userUnitSearchObj.runPaged().count;
                    log.debug("report_filtering::GET", "count:" + count);
                    var userUnitSearchPaged = userUnitSearchObj.runPaged({ pageSize: 1000 });
                    //log.debug("report_filtering::GET", "userSubsidiary:" + JSON.stringify(userSubsidiary));

                    //Reserves
                    userUnitSearchPaged.pageRanges.forEach(function (page_range) {

                        var userUnitPage = userUnitSearchPaged.fetch({ index: page_range.index });
                        userUnits = [];

                        userUnitPage.data.every(function (result) {

                            userUnits.push(result.getValue({ name: 'internalid' }));
                            return true;
                        });

                        search.create({
                            type: "customrecord_cseg_tsa_fundreserv",
                            filters: [["custrecord_cseg_tsa_fundreserv_n101", "anyof", userUnits]],
                            columns: [search.createColumn({ name: "name", sort: search.Sort.ASC, label: "Name" }),
                            search.createColumn({ name: "parent", label: "Parent" })
                            ]
                        }).run().each(function (result) {
                            var unitName = result.getValue({ name: 'name' });
                            //log.debug("report_filtering::GET", "unitName:" + unitName);
                            var unitParent = result.getText({ name: 'parent' }) + " :";
                            //log.debug("report_filtering::GET", "unitParent:" + unitParent);
                            var unitWithoutParent = unitName.replace(unitParent, '').trim();
                            //log.debug("report_filtering::GET", "unitWithoutParent:" + unitWithoutParent);
                            var hashCode = getHash(unitWithoutParent);
                            //log.debug("report_filtering::GET", "hashCode:" + hashCode);
                            reportFilterArrayInitialization += "," + hashCode;
                            checkSum++;
                            return true;
                        });

                        return true;
                    });

                    userUnitSearchPaged.pageRanges.forEach(function (page_range) {

                        var userUnitPage = userUnitSearchPaged.fetch({ index: page_range.index });
                        userUnits = [];

                        userUnitPage.data.every(function (result) {

                            userUnits.push(result.getValue({ name: 'internalid' }));
                            return true;
                        });

                        search.create({
                            type: "customrecord_cseg_tsa_project",
                            filters: [["custrecord_cseg_tsa_project_n101", "anyof", userUnits]],
                            columns: [search.createColumn({ name: "name", sort: search.Sort.ASC, label: "Name" }),
                            search.createColumn({ name: "parent", label: "Parent" })
                            ]
                        }).run().each(function (result) {
                            var unitName = result.getValue({ name: 'name' });
                            //log.debug("report_filtering::GET", "unitName:" + unitName);
                            var unitParent = result.getText({ name: 'parent' }) + " :";
                            //log.debug("report_filtering::GET", "unitParent:" + unitParent);
                            var unitWithoutParent = unitName.replace(unitParent, '').trim();
                            //log.debug("report_filtering::GET", "unitWithoutParent:" + unitWithoutParent);
                            var hashCode = getHash(unitWithoutParent);
                            //log.debug("report_filtering::GET", "hashCode:" + hashCode);
                            reportFilterArrayInitialization += "," + hashCode;
                            checkSum++;
                            return true;
                        });

                        return true;
                    });
                    
                    log.debug("report_filtering::GET", "checkSum:" + checkSum);

                    reportFilterArrayInitialization += "];"
                    reportFilterArrayInitialization = reportFilterArrayInitialization.replace('[,', '[');
                    log.debug("report_filtering::GET", "reportFilterArrayInitialization:" + reportFilterArrayInitialization);

                    var reportScript =
                        reportFilterArrayInitialization +
                        "jQuery(document).ready(function()" +
                        "{" +
                        "   var projectTranslations = ['Project', 'Proyecto', 'Bagian Proyek'];" +
                        "   var reserveTranslations = ['Reserve', 'Reserva', 'Cadangan'];" +
                        "   var projectPlaceholderName;" +
                        "   var reservePlaceholderName;" +
                        "   for (var i = 0; i < 29; i++) {" +
                        "      var filterFieldLabel = jQuery('td[fieldname=\"crit_' + String(i) + '\"]').attr(\"fieldlabel\");" +
                        "      if (filterFieldLabel == undefined) {" +
                        "          continue;" +
                        "      }" +
                        "   filterFieldLabel=filterFieldLabel.split(':')[0].trim();" +
                        "      if (projectTranslations.includes(filterFieldLabel)){" +
                        //"          alert('Project: crit_' + String(i) + '_popupIcon');" +
                        "          eventFire(document.getElementById('crit_' + String(i) + '_popupIcon'), 'click'); " +
                        "          eventFire(document.getElementById('crit_' + String(i) + '_popupIcon'), 'click'); " +
                        "          projectPlaceholderName = '#' + jQuery('td[id^=\"row_crit_' + String(i) + '\"][id$=\"_0\"]:not([id$=\"row_crit_' + String(i) + '_0\"])').attr(\"id\");" +
                        "          projectPlaceholderName = projectPlaceholderName.substring(0, projectPlaceholderName.length-1);" +
                        //"          alert('projectPlaceholderName:' + projectPlaceholderName);" +
                        "      }" +
                        "      if (reserveTranslations.includes(filterFieldLabel)){" +
                        //"          alert('Reserve: crit_' + String(i) + '_popupIcon');" +
                        "          eventFire(document.getElementById('crit_' + String(i) + '_popupIcon'), 'click'); " +
                        "          eventFire(document.getElementById('crit_' + String(i) + '_popupIcon'), 'click'); " +
                        "          reservePlaceholderName = '#' + jQuery('td[id^=\"row_crit_' + String(i) + '\"][id$=\"_0\"]:not([id$=\"row_crit_' + String(i) + '_0\"])').attr(\"id\");" +
                        "          reservePlaceholderName = reservePlaceholderName.substring(0, reservePlaceholderName.length-1);" +
                        //"          alert('reservePlaceholderName:' + reservePlaceholderName);" +
                        "      }" +
                        "   }" +
                        "   var dropDownElement;" +
                        "   for (var i = 0; i < 2000; i++) {" +
                        "       jQuery(projectPlaceholderName + String(i)).each(function () { dropDownElement = jQuery(this); });" +
                        "       if (dropDownElement) {" +
                        "          var elementValue = dropDownElement[0].children[0].text;" +
                        "          if (elementValue) {" +
                        "               var elementHash = getHash(elementValue);" +
                        "               if (!reportFilterArray.includes(elementHash)) { jQuery(projectPlaceholderName + String(i)).hide(); }" +
                        "          }" +
                        "       }" +
                        "   }" +
                        "   for (var i = 0; i < 2000; i++) {" +
                        "       jQuery(reservePlaceholderName + String(i)).each(function () { dropDownElement = jQuery(this); });" +
                        "       if (dropDownElement) {" +
                        "          var elementValue = dropDownElement[0].children[0].text;" +
                        "          if (elementValue) {" +
                        "               var elementHash = getHash(elementValue);" +
                        "               if (!reportFilterArray.includes(elementHash)) { jQuery(reservePlaceholderName + String(i)).hide(); }" +
                        "          }" +
                        "       }" +
                        "   }" +
                        "});";

                    scriptContext.response.write(reportScript);

                    return true;
                }
                catch (e) {
                    log.debug("report_filtering::GET - ERROR", e);
                }
                finally {
                }
            }

            //#endregion

        }

        function getHash(stringToHash) {
            var h = 0, l = stringToHash.length, i = 0;
            if (l > 0)
                while (i < l)
                    h = (h << 5) - h + stringToHash.charCodeAt(i++) | 0;
            return h;
        };

        return {
            onRequest: onRequest
        };

    });
