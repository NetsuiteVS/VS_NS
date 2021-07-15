/****************************************************************************************
 * Name:		SuiteScript 2.0 Suitelet (TSA_VS_mass_approval_v2_sl20.js)
 *
 * Script Type:	Suitelet
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     

 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/url', 'N/http', 'N/https', 'N/ui/serverWidget', 'N/search', 'N/redirect', 'N/record', 'N/format', 'N/runtime', 'N/file', 'N/format'],

    function (url, http, https, serverWidget, search, redirect, record, format, runtime, file, format) {

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */

        var sublistID = 'custpage_sublist';

        function onRequest(context) {

            if (context.request.method == 'GET') {

                try {

                    log.debug("mass_approval_v2", "Script started (Get)");

                    var roleId = runtime.getCurrentUser().roleId.toLowerCase();

                    if (!roleId.equals("administrator") && !roleId.equals("customrole_ihqapp_board")) {
                        log.debug("mass_approval_v2", "Only users with IHQ Board or Administrator Role are eligible to use the Board Approval.");
                        context.response.write("Only users with IHQ Board or Administrator Role are eligible to use the Board Approval.");
                        return false;
                    }

                    var request = context.request;
                    var selectedSearch = request.parameters.selected_search;
                    var nameFilter = request.parameters.name_filter;
                    var boardAgendaFilter = request.parameters.board_agenda_filter;
                    var passedByBoardFilter = request.parameters.passed_by_board_filter;
                    var dateFromFilter = request.parameters.date_from_filter;
                    var dateToFilter = request.parameters.date_to_filter;
                    var dueDateFromFilter = request.parameters.due_date_from_filter;
                    var dueDateToFilter = request.parameters.due_date_to_filter;
                    var typeFilter = request.parameters.type_filter;

                    log.debug("mass_approval_v2", "selectedSearch:" + selectedSearch + " ,nameFilter:" + nameFilter);
                    log.debug("mass_approval_v2", "selectedSearch:" + selectedSearch + " ,boardAgendaFilter:" + boardAgendaFilter);
                    log.debug("mass_approval_v2", "selectedSearch:" + selectedSearch + " ,passedByBoardFilter:" + passedByBoardFilter);
                    log.debug("mass_approval_v2", "selectedSearch:" + selectedSearch + " ,dateFromFilterField:" + dateFromFilter);
                    log.debug("mass_approval_v2", "selectedSearch:" + selectedSearch + " ,dateToFilterField:" + dateToFilter);
                    log.debug("mass_approval_v2", "selectedSearch:" + selectedSearch + " ,dueDateFromFilter:" + dueDateFromFilter);
                    log.debug("mass_approval_v2", "selectedSearch:" + selectedSearch + " ,dueDateToFilter:" + dueDateToFilter);
                    log.debug("mass_approval_v2", "selectedSearch:" + selectedSearch + " ,typeFilterField:" + typeFilter);

                    var searchId1 = runtime.getCurrentScript().getParameter({ name: "custscript_search_1_v2" });
                    var searchId1_label = runtime.getCurrentScript().getParameter({ name: "custscript_search1_label_v2" });
                    var searchId2 = runtime.getCurrentScript().getParameter({ name: "custscript_search_2_v2" });
                    var searchId2_label = runtime.getCurrentScript().getParameter({ name: "custscript_search2_label_v2" });
                    var searchId3 = runtime.getCurrentScript().getParameter({ name: "custscript_search_3_v2" });
                    var searchId3_label = runtime.getCurrentScript().getParameter({ name: "custscript_search3_label_v2" });
                    var searchId4 = runtime.getCurrentScript().getParameter({ name: "custscript_search_4_v2" });
                    var searchId4_label = runtime.getCurrentScript().getParameter({ name: "custscript_search4_label_v2" });
                    var searchId5 = runtime.getCurrentScript().getParameter({ name: "custscript_search_5_v2" });
                    var searchId5_label = runtime.getCurrentScript().getParameter({ name: "custscript_search5_label_v2" });

                    var counterSearchId1 = runtime.getCurrentScript().getParameter({ name: "custscript_counter_search_1_v2" });
                    var counterSearchId2 = runtime.getCurrentScript().getParameter({ name: "custscript_counter_search_2_v2" });
                    var counterSearchId3 = runtime.getCurrentScript().getParameter({ name: "custscript_counter_search_3_v2" });
                    var counterSearchId4 = runtime.getCurrentScript().getParameter({ name: "custscript_counter_search_4_v2" });
                    var counterSearchId5 = runtime.getCurrentScript().getParameter({ name: "custscript_counter_search_5_v2" });

                    log.debug("mass_approval_v2", "Counter Search Id 1:" + counterSearchId1);
                    log.debug("mass_approval_v2", "Search Id 1:" + searchId1);

                    var searchCount1 = "0";
                    var searchCount2 = "0";
                    var searchCount3 = "0";
                    var searchCount4 = "0";
                    var searchCount5 = "0";
                    var searchObj1;
                    var searchObj2;
                    var searchObj3;
                    var searchObj4;
                    var searchObj5;

                    //Find searches and their result count
                    if (counterSearchId1 && searchId1) {
                        counterSearchObj1 = search.load({ id: counterSearchId1 });
                        counterSearchObj1.run().each(function (result) {
                            searchCount1 = result.getValue({ name: 'internalid', summary: "COUNT" });
                            return false;
                        });
                        log.debug("mass_approval_v2", "searchCount1:" + searchCount1);
                        searchObj1 = search.load({ id: searchId1 })
                    };
                    if (counterSearchId2 && searchId2) {
                        counterSearchObj2 = search.load({ id: counterSearchId2 });
                        counterSearchObj2.run().each(function (result) {
                            searchCount2 = result.getValue({ name: 'internalid', summary: "COUNT" });
                            return false;
                        });
                        searchObj2 = search.load({ id: searchId2 })
                    };
                    if (counterSearchId3 && searchId3) {
                        counterSearchObj3 = search.load({ id: counterSearchId3 });
                        counterSearchObj3.run().each(function (result) {
                            searchCount3 = result.getValue({ name: 'internalid', summary: "COUNT" });
                            return false;
                        });
                        searchObj3 = search.load({ id: searchId3 })
                    };
                    if (counterSearchId4 && searchId4) {
                        counterSearchObj4 = search.load({ id: counterSearchId4 });
                        counterSearchObj4.run().each(function (result) {
                            searchCount4 = result.getValue({ name: 'internalid', summary: "COUNT" });
                            return false;
                        });
                        searchObj4 = search.load({ id: searchId4 })
                    };
                    if (counterSearchId5 && searchId5) {
                        counterSearchObj5 = search.load({ id: counterSearchId5 });
                        counterSearchObj5.run().each(function (result) {
                            searchCount5 = result.getValue({ name: 'internalid', summary: "COUNT" });
                            return false;
                        });
                        searchObj5 = search.load({ id: searchId5 })
                    };

                    //Create form
                    var form = serverWidget.createForm({ title: "IHQ Board Approval" });
                    form.clientScriptFileId = 317901;

                    //Show search counts
                    var fieldgroup = form.addFieldGroup({ id: 'fieldgroup1', label: 'IBB Approval' });
                    var fieldgroup = form.addFieldGroup({ id: 'fieldgroup2', label: 'IFC Approval' });
                    var fieldgroup = form.addFieldGroup({ id: 'fieldgroup3', label: 'SAITCO Approval' });
                    var fieldgroup = form.addFieldGroup({ id: 'fieldgroup4', label: 'IHQ Board Approval Selector' });
                    var fieldgroup = form.addFieldGroup({ id: 'fieldgroup5', label: 'Filters' });
                    var savedSearchCountField1 = form.addField({ id: 'custpage_saved_search_counter_1', label: "NO. OF " + searchId1_label, type: serverWidget.FieldType.INLINEHTML, container: "fieldgroup1" });
                    var savedSearchCountField2 = form.addField({ id: 'custpage_saved_search_counter_2', label: "NO. OF " + searchId2_label, type: serverWidget.FieldType.INLINEHTML, container: "fieldgroup1" });
                    var savedSearchCountField3 = form.addField({ id: 'custpage_saved_search_counter_3', label: "NO. OF " + searchId3_label, type: serverWidget.FieldType.INLINEHTML, container: "fieldgroup2" });
                    var savedSearchCountField4 = form.addField({ id: 'custpage_saved_search_counter_4', label: "NO. OF " + searchId4_label, type: serverWidget.FieldType.INLINEHTML, container: "fieldgroup2" });
                    var savedSearchCountField5 = form.addField({ id: 'custpage_saved_search_counter_5', label: "NO. OF " + searchId5_label, type: serverWidget.FieldType.INLINEHTML, container: "fieldgroup3" });

                    /*
					savedSearchCountField1.defaultValue = '<p style="font-size:14px;">No. of ' + searchId1_label + ' transactions: ' + searchCount1 + '</p>';
                    savedSearchCountField2.defaultValue = '<p style="font-size:14px;">No. of ' + searchId2_label + ' transactions: ' + searchCount2 + '</p>';
                    savedSearchCountField3.defaultValue = '<p style="font-size:14px;">No. of ' + searchId3_label + ' transactions: ' + searchCount3 + '</p>';
                    savedSearchCountField4.defaultValue = '<p style="font-size:14px;">No. of ' + searchId4_label + ' transactions: ' + searchCount4 + '</p>';
                    savedSearchCountField5.defaultValue = '<p style="font-size:14px;">No. of ' + searchId5_label + ' transactions: ' + searchCount5 + '</p>';
					*/
                    savedSearchCountField1.defaultValue = '<p style="font-size:14px;">NO. OF TRANSACTIONS PENDING IBB APPROVAL: ' + searchCount1 + '</p>';
                    savedSearchCountField2.defaultValue = '<p style="font-size:14px;">NO. OF INTERIM APPROVED TRANSACTIONS FOR IBB APPROVAL: ' + searchCount2 + '</p>';
                    savedSearchCountField3.defaultValue = '<p style="font-size:14px;">NO. OF TRANSACTIONS PENDING IFC APPROVAL: ' + searchCount3 + '</p>';
                    savedSearchCountField4.defaultValue = '<p style="font-size:14px;">NO. OF INTERIM APPROVED TRANSACTIONS FOR IFC APPROVAL: ' + searchCount4 + '</p>';
                    savedSearchCountField5.defaultValue = '<p style="font-size:14px;">NO. OF TRANSACTIONS PENDING SAITCO APPROVAL: ' + searchCount5 + '</p>';

                    //Add list of selectable saved searches
                    var savedSearchesField = form.addField({ id: 'custpage_saved_searches', type: serverWidget.FieldType.SELECT, label: "BOARD APPROVAL TYPE", container: "fieldgroup4" });
                    savedSearchesField.isMandatory = true;
                    savedSearchesField.addSelectOption({ value: "", text: "" });
                    if (counterSearchId1 && searchId1) { savedSearchesField.addSelectOption({ value: searchId1, text: searchId1_label }); }
                    if (counterSearchId2 && searchId2) { savedSearchesField.addSelectOption({ value: searchId2, text: searchId2_label }); }
                    if (counterSearchId3 && searchId3) { savedSearchesField.addSelectOption({ value: searchId3, text: searchId3_label }); }
                    if (counterSearchId4 && searchId4) { savedSearchesField.addSelectOption({ value: searchId4, text: searchId4_label }); }
                    if (counterSearchId5 && searchId5) { savedSearchesField.addSelectOption({ value: searchId5, text: searchId5_label }); }
                    if (selectedSearch) {
                        savedSearchesField.defaultValue = selectedSearch;
                    }

                    //Add filters
                    //****************
                    var nameFilterField = form.addField({ id: 'custpage_name_filter', type: serverWidget.FieldType.TEXT, label: "Name", container: "fieldgroup5" });
                    if (nameFilter) {
                        nameFilterField.defaultValue = nameFilter;
                    }
                    nameFilterField.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.STARTROW }); //here                
                    //nameFilterField.updateBreakType({ breakType : serverWidget.FieldBreakType.STARTCOL });

                    var boardAgendaFilterField = form.addField({ id: 'custpage_ihq_board_agenda', type: serverWidget.FieldType.SELECT, label: "On Board Agenda", container: "fieldgroup5" });
                    boardAgendaFilterField.addSelectOption({ value: "All", text: "All" });
                    boardAgendaFilterField.addSelectOption({ value: "T", text: "Yes" });
                    boardAgendaFilterField.addSelectOption({ value: "F", text: "No" });
                    if (boardAgendaFilter) {
                        boardAgendaFilterField.defaultValue = boardAgendaFilter;
                    }
                    boardAgendaFilterField.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.STARTROW })

                    var passedByBoardFilterField = form.addField({ id: 'custpage_ihq_board_passed', type: serverWidget.FieldType.SELECT, label: "Passed by Board", container: "fieldgroup5" });
                    passedByBoardFilterField.addSelectOption({ value: "All", text: "All" });
                    passedByBoardFilterField.addSelectOption({ value: "T", text: "Yes" });
                    passedByBoardFilterField.addSelectOption({ value: "F", text: "No" });
                    if (passedByBoardFilter) {
                        passedByBoardFilterField.defaultValue = passedByBoardFilter;
                    }
                    passedByBoardFilterField.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.STARTROW }); //here                  

                    /*var dateFromFilterField = form.addField({ id: 'custpage_trandate_from', type: serverWidget.FieldType.DATE, label: "Date (from)", container: "fieldgroup5" });
						if (dateFromFilter) {
							dateFromFilterField.defaultValue = dateFromFilter;
						}
						dateFromFilterField.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.MIDROW }); //here
						//dateFromFilterField.updateBreakType({ breakType : serverWidget.FieldBreakType.STARTCOL }); 
					*/

                    //****************
                    var typeFilterField = form.addField({ id: 'custpage_type', type: serverWidget.FieldType.SELECT, label: "Type", container: "fieldgroup5" });
                    typeFilterField.addSelectOption({ value: "All", text: "All" });
                    typeFilterField.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.STARTROW }); //here                  
                    typeFilterField.updateBreakType({ breakType: serverWidget.FieldBreakType.STARTCOL });

                    var dateToFilterField = form.addField({ id: 'custpage_trandate_to', type: serverWidget.FieldType.DATE, label: "Date Up to", container: "fieldgroup5" });
                    if (dateToFilter) {
                        dateToFilterField.defaultValue = dateToFilter;
                    }
                    dateToFilterField.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.STARTROW }); //here

                    /*
                                        var dueDateFromFilterField = form.addField({ id: 'custpage_due_date_from', type: serverWidget.FieldType.DATE, label: "Due Date (from)", container: "fieldgroup5" });
                                        if (dueDateFromFilter) {
                                            dueDateFromFilterField.defaultValue = dueDateFromFilter;
                                        }
                                        dueDateFromFilterField.updateBreakType({ breakType : serverWidget.FieldBreakType.STARTCOL });
                                            dueDateFromFilterField.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.STARTROW }); //here                  
                      */
                    var dueDateToFilterField = form.addField({ id: 'custpage_due_date_to', type: serverWidget.FieldType.DATE, label: "Due Date Up to", container: "fieldgroup5" });
                    if (dueDateToFilter) {
                        dueDateToFilterField.defaultValue = dueDateToFilter;
                    }
                    dueDateToFilterField.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.STARTROW }); //here                  

                    var tab = form.addTab({ id: 'custpage_tab_list', label: "Transactions" });
                    //serverWidget.SublistType.INLINEEDITOR; serverWidget.SublistType.LIST
                    var sublist = form.addSublist({ id: sublistID, type: serverWidget.SublistType.LIST, label: 'Transactions to approve', tab: 'custpage_tab_list' });
                    sublist.addButton({ id: 'custpage_mark_all', label: 'Mark All', functionName: "markAll()" });
                    sublist.addButton({ id: 'custpage_unmark_all', label: 'Unmark All', functionName: "unmarkAll()" });
                    sublist.addButton({ id: 'custpage_approve2', label: 'Approve', functionName: "saveRecord2()" });

                    var labelSearch = search.load(searchId1);
                    sublist.addField({ id: 'custpage_checked', label: 'Selected', type: serverWidget.FieldType.CHECKBOX });//Technical field
                    sublist.addField({ id: 'custpage_document_number_enabled', label: labelSearch.columns[0].label, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    sublist.addField({ id: 'custpage_type_txt_enabled', label: labelSearch.columns[1].label, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    sublist.addField({ id: 'custpage_formula1_enabled', label: labelSearch.columns[2].label, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    sublist.addField({ id: 'custpage_formula2_enabled', label: labelSearch.columns[3].label, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    sublist.addField({ id: 'custpage_formula3_enabled', label: labelSearch.columns[4].label, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    sublist.addField({ id: 'custpage_due_date_enabled', label: labelSearch.columns[5].label, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    sublist.addField({ id: 'custpage_fxamount_enabled', label: labelSearch.columns[6].label, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    sublist.addField({ id: 'custpage_amount_enabled', label: labelSearch.columns[7].label, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'DISABLED' });
                    var linkField = sublist.addField({ id: 'custpage_link_url_enabled', label: "Transaction", type: serverWidget.FieldType.URL }).updateDisplayType({ displayType: 'DISABLED' });
                    linkField.linkText = "View";
                    sublist.addField({ id: 'custpage_document_number', label: labelSearch.columns[0].label, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'HIDDEN' });
                    sublist.addField({ id: 'custpage_type_txt', label: labelSearch.columns[1].label, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'HIDDEN' });
                    sublist.addField({ id: 'custpage_formula1', label: labelSearch.columns[2].label, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'HIDDEN' });
                    sublist.addField({ id: 'custpage_formula2', label: labelSearch.columns[3].label, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'HIDDEN' });
                    sublist.addField({ id: 'custpage_formula3', label: labelSearch.columns[4].label, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'HIDDEN' });
                    sublist.addField({ id: 'custpage_due_date', label: labelSearch.columns[5].label, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'HIDDEN' });
                    sublist.addField({ id: 'custpage_amount', label: labelSearch.columns[7].label, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'HIDDEN' });
                    sublist.addField({ id: 'custpage_fxamount', label: labelSearch.columns[6].label, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'HIDDEN' });
                    var linkField = sublist.addField({ id: 'custpage_link_url', label: "Transaction", type: serverWidget.FieldType.URL }).updateDisplayType({ displayType: 'HIDDEN' });
                    linkField.linkText = "View";
                    sublist.addField({ id: 'custpage_currency_txt', label: labelSearch.columns[5].label, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'HIDDEN' });
                    sublist.addField({ id: 'custpage_exchange_rate', label: labelSearch.columns[6].label, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'HIDDEN' });
                    sublist.addField({ id: 'custpage_internalid', label: labelSearch.columns[7].label, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'HIDDEN' });
                    sublist.addField({ id: 'custpage_type_code', label: 'Type Code', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'HIDDEN' });//Technical field
                    sublist.addField({ id: 'custpage_currency_code', label: 'Currency Code', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: 'HIDDEN' });//Technical field  

                    //Fill up list if user already had chosen a search
                    var typeListTxt = [];
                    var typeListCode = [];
                    if (selectedSearch) {

                        log.debug("mass_approval_v2", "selectedSearch run");

                        var searchObj = search.load({ id: selectedSearch });
                        var accountId = runtime.accountId.replace("_", "-");
                        log.debug("mass_approval_v2", "accountId:" + accountId);
                        var i = -1;


                        //Copy the filters from objSearch into defaultFilters
                        var defaultFilters = searchObj.filters;
                        if (nameFilter) { defaultFilters.push(search.createFilter({ name: "formulatext", formula: "NVL({name},{custbody_tsa_nsipurps})", operator: search.Operator.CONTAINS, values: nameFilter })); }
                        if (boardAgendaFilter) {
                            if (boardAgendaFilter.equals("All")) {
                                defaultFilters.push(search.createFilter({ name: "custbody_ihq_board_agenda", operator: search.Operator.ANY, values: '' }));
                            }
                            else {
                                defaultFilters.push(search.createFilter({ name: "custbody_ihq_board_agenda", operator: search.Operator.IS, values: boardAgendaFilter }));
                            }
                        }
                        if (passedByBoardFilter) {
                            if (passedByBoardFilter.equals("All")) {
                                defaultFilters.push(search.createFilter({ name: "custbody_ihq_board_passed", operator: search.Operator.ANY, values: '' }));
                            }
                            else {
                                defaultFilters.push(search.createFilter({ name: "custbody_ihq_board_passed", operator: search.Operator.IS, values: passedByBoardFilter }));
                            }
                        }
                        if (dateFromFilter) { defaultFilters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: dateFromFilter })); }
                        if (dateToFilter) { defaultFilters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: dateToFilter })); }
                        if (dueDateFromFilter) { defaultFilters.push(search.createFilter({ name: "duedate", operator: search.Operator.ONORAFTER, values: dueDateFromFilter })); }
                        if (dueDateToFilter) { defaultFilters.push(search.createFilter({ name: "duedate", operator: search.Operator.ONORBEFORE, values: dueDateToFilter })); }
                        if (typeFilter && !typeFilter.equals('All')) { defaultFilters.push(search.createFilter({ name: "type", operator: search.Operator.ANYOF, values: typeFilter })); }

                        //log.debug("mass_approval_v2", "defaultFilters:" + JSON.stringify(defaultFilters));

                        //We will copy the modified defaultFilters back into objSearch
                        searchObj.filters = defaultFilters;

                        //Add selected saved search records
                        searchObj.run().each(function (result) {

                            i++;

                            var tranId = result.getValue({ name: 'tranid' });
                            var typeTxt = result.getText({ name: 'type' });
                            var formula1 = result.getValue(result.columns[2]);
                            var formula2 = result.getValue(result.columns[3]);
                            var formula3 = result.getValue(result.columns[4]);
                            var dueDate = result.getValue({ name: 'duedate' });
                            var amount = result.getValue({ name: 'amount' });
                            var fxamount = result.getValue({ name: 'fxamount' });
                            var currencyTxt = result.getText({ name: 'currency' });
                            var exchangeRate = result.getValue({ name: 'exchangerate' });
                            var internalId = result.getValue({ name: 'internalid' });
                            var typeCode = result.getValue({ name: 'type' });
                            var currencyCode = result.getValue({ name: 'currency' });
                            var link = "https://" + accountId + ".app.netsuite.com/app/accounting/transactions/transaction.nl?id=" + internalId + "&amp;whence=";

                            typeListTxt.push(typeTxt);
                            typeListCode.push(typeCode);

                            sublist.setSublistValue({ id: "custpage_checked", value: "F", line: i });
                            if (tranId) sublist.setSublistValue({ id: 'custpage_document_number_enabled', value: tranId, line: i });
                            if (typeTxt) sublist.setSublistValue({ id: 'custpage_type_txt_enabled', value: typeTxt, line: i });
                            if (formula1) sublist.setSublistValue({ id: 'custpage_formula1_enabled', value: formula1, line: i });
                            if (formula2) sublist.setSublistValue({ id: 'custpage_formula2_enabled', value: formula2, line: i });
                            if (formula3) sublist.setSublistValue({ id: 'custpage_formula3_enabled', value: formula3, line: i });
                            if (dueDate) sublist.setSublistValue({ id: 'custpage_due_date_enabled', value: dueDate, line: i });
                            if (amount) sublist.setSublistValue({ id: 'custpage_amount_enabled', value: addCommas(amount), line: i });
                            if (fxamount) sublist.setSublistValue({ id: 'custpage_fxamount_enabled', value: addCommas(fxamount) + " " + currencyTxt, line: i });
                            if (link) sublist.setSublistValue({ id: 'custpage_link_url_enabled', value: link, line: i });
                            if (tranId) sublist.setSublistValue({ id: 'custpage_document_number', value: tranId, line: i });
                            if (typeTxt) sublist.setSublistValue({ id: 'custpage_type_txt', value: typeTxt, line: i });
                            if (formula1) sublist.setSublistValue({ id: 'custpage_formula1', value: formula1, line: i });
                            if (formula2) sublist.setSublistValue({ id: 'custpage_formula2', value: formula2, line: i });
                            if (formula3) sublist.setSublistValue({ id: 'custpage_formula3', value: formula3, line: i });
                            if (dueDate) sublist.setSublistValue({ id: 'custpage_due_date', value: dueDate, line: i });
                            if (amount) sublist.setSublistValue({ id: 'custpage_amount', value: amount, line: i });
                            if (fxamount) sublist.setSublistValue({ id: 'custpage_fxamount', value: fxamount, line: i });
                            if (link) sublist.setSublistValue({ id: 'custpage_link_url', value: link, line: i });
                            if (currencyTxt) sublist.setSublistValue({ id: 'custpage_currency_txt', value: currencyTxt, line: i });
                            if (exchangeRate) sublist.setSublistValue({ id: 'custpage_exchange_rate', value: exchangeRate, line: i });
                            if (internalId) sublist.setSublistValue({ id: 'custpage_internalid', value: internalId, line: i });
                            if (typeCode) sublist.setSublistValue({ id: 'custpage_type_code', value: typeCode, line: i });
                            if (currencyCode) sublist.setSublistValue({ id: 'custpage_currency_code', value: currencyCode, line: i });

                            return true;
                        });
                    }

                    //Add types to dropdownlist
                    var uniqueTypeListTxt = typeListTxt.filter(onlyUnique);
                    var uniqueTypeListCode = typeListCode.filter(onlyUnique);
                    for (i = 0; i < uniqueTypeListTxt.length; i++) {
                        typeFilterField.addSelectOption({ value: uniqueTypeListCode[i], text: uniqueTypeListTxt[i] });
                    }
                    if (typeFilter) {
                        typeFilterField.defaultValue = typeFilter;
                    }

                    form.addSubmitButton({ label: "Approve" });

                    log.debug("mass_approval_v2", "Script finished");

                    context.response.writePage(form);
                }
                catch (e) {
                    log.debug("Error", 'Message: ' + e);
                }
                finally {
                }

            }
            else {
                if (context.request.method == 'POST') {

                    try {
                        log.debug("mass_approval_v2 POST", "Script started (Post)");

                        var request = context.request;
                        var sublist_data = request.parameters.custpage_sublistdata;
                        var sublist_lines = sublist_data.split("\u0002");
                        var recordLineCount = sublist_lines.length;
                        var selectedSearch = request.parameters.custpage_saved_searches;
                        log.debug("mass_approval_v2 POST", "recordLineCount:" + recordLineCount);
                        log.debug("mass_approval_v2 POST", "selectedSearch:" + selectedSearch);

                        var recordTypes = [];
                        recordTypes["Advance"] = "customtransaction_tsa_iou2";
                        recordTypes["TSA Expense"] = "customtransaction_tsa_non_s_expense";
                        recordTypes["TSA Income"] = "customtransaction_tsa_nonsalesincome";
                        recordTypes["TSA Interunit"] = "customtransaction_tsa_unit_intracompany";
                        recordTypes["TSA Unit Expense"] = "customtransaction_tsa_unit_expense";
                        recordTypes["TSA Unit Income"] = "customtransaction_tsa_unit_income";
                        recordTypes["Cash Refund"] = record.Type.CASH_REFUND;
                        recordTypes["Cash Sale"] = record.Type.CASH_SALE;
                        recordTypes["Cheque"] = record.Type.CHECK;
                        recordTypes["Credit Memo"] = record.Type.CREDIT_MEMO;
                        recordTypes["Currency Revaluation"] = "fxreval";
                        recordTypes["Customer Deposit"] = record.Type.CUSTOMER_DEPOSIT;
                        recordTypes["Customer Refund"] = record.Type.CUSTOMER_REFUND;
                        recordTypes["Deposit"] = record.Type.Deposit;
                        recordTypes["Deposit Application"] = record.Type.DEPOSIT_APPLICATION;
                        recordTypes["Expense Claim"] = "expensereport";
                        recordTypes["Inventory Adjustment"] = record.Type.INVENTORY_ADJUSTMENT;
                        recordTypes["Inventory Count"] = record.Type.INVENTORY_COUNT;
                        recordTypes["Inventory Worksheet"] = "inventoryworksheet";
                        recordTypes["Item Fulfillment"] = record.Type.ITEM_FULFILLMENT;
                        recordTypes["Item Receipt"] = record.Type.ITEM_RECEIPT;
                        recordTypes["Journal"] = record.Type.JOURNAL_ENTRY;
                        recordTypes["Payment"] = record.Type.CUSTOMER_PAYMENT;
                        recordTypes["Purchase Order"] = record.Type.PURCHASE_ORDER;
                        recordTypes["Return Authorisation"] = record.Type.RETURN_AUTHORIZATION;
                        recordTypes["Sales invoice"] = record.Type.INVOICE;
                        recordTypes["Sales Order"] = record.Type.SALES_ORDER;
                        recordTypes["Supplier credit"] = record.Type.VENDOR_CREDIT;
                        recordTypes["Supplier invoice"] = record.Type.VENDOR_BILL;
                        recordTypes["Supplier invoice payment"] = record.Type.VENDOR_PAYMENT;
                        recordTypes["Supplier Return Authorization"] = record.Type.VENDOR_RETURN_AUTHORIZATION;
                        recordTypes["Transfer"] = "Transfer";

                        //Find all marked line and set "IHQ Bulk Approve" to true
                        for (var i = 0; i < recordLineCount; i++) {

                            var fields = sublist_lines[i].split("\u0001");

                            var isChecked = fields[0];

                            if (isChecked == "T") {
                                try {
                                    var transactionType = fields[2];
                                    var internalId = fields[21];

                                    log.debug("mass_approval_v2", "internalId:" + internalId);
                                    log.debug("mass_approval_v2", "transactionType:" + transactionType);

                                    transactionType = transactionType.replace(/"/g, '').replace(/"\\/g, "");

                                    if (!recordTypes[transactionType]) {
                                        log.debug("mass_approval_v2 POST", "Record type doesn't exit in type array:" + transactionType);
                                        continue;
                                    }

                                    logGovernanceMonitoring("Update custbody_ihq_bulk_approve");

                                    record.submitFields({
                                        type: recordTypes[transactionType],
                                        id: internalId,
                                        values: {
                                            custbody_ihq_bulk_approve: true
                                        },
                                        options: {
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true
                                        }
                                    });

                                    log.debug("mass_approval_v2 POST", "internalId:" + internalId + " - Success");
                                }
                                catch (e) {
                                    log.debug("mass_approval_v2 POST", "internalId:" + internalId + " - Error:" + e.message);
                                }
                            }
                        }

                        redirect.toSuitelet({ scriptId: 'customscript_tsa_vs_mass_appr_v2_sl20', deploymentId: 'customdeploy_tsa_vs_mass_appr_v2_sl20', parameters: { 'selected_search': selectedSearch } });
                    }
                    catch (e) {
                        log.debug("Error", 'Message: ' + e);
                    }
                    finally {
                    }
                }
            }
        }

        function logGovernanceMonitoring(caller) {
            var script = runtime.getCurrentScript();
            log.debug("mass_approval_v2::logGovernanceMonitoring", caller + " - Remaining Usage = " + script.getRemainingUsage());
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

        function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
        }

        return {
            onRequest: onRequest
        };

    });