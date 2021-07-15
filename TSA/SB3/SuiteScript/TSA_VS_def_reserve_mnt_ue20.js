/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 
 *	14/08/2019 Viktor S. 
 *	The beforeload function adds a field to the Item form
	
 *
 
 */
 
define(['N/record', 'N/search', 'N/email', 'N/render', 'N/format', 'N/runtime', 'N/ui/serverWidget', 'N/translation', 'SuiteScripts/vs_lib10.js'],
function(record, search, email, render, format, runtime, serverWidget, translation, vs_lib10) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {

        //#region HERE IS THE WORKING AND TESTED VERSION: DEFAULT RESERVE FILTERED BY UNIT (USED FIELDS WITH JSON CONTENT)

        //try {

        //    if (scriptContext.type == scriptContext.UserEventType.DELETE) return;

        //    var itemId = scriptContext.newRecord.getValue("id");
        //    if (itemId != 667) {
        //        return true;//11-3KYA-CAP BAND - SOLDIER (ENGLISH)
        //    }

        //    //Load Reserve custom segment to JSON to enable filtering later.
        //    //We must use three fields because of 100000 char limit of a field.
        //    var itemReserveCsegIdField = scriptContext.form.addField({ id: 'custpage_reserve_cseg_id', type: serverWidget.FieldType.LONGTEXT, label: 'Reserve Cseg_Id' });
        //    var itemReserveCsegValueField = scriptContext.form.addField({ id: 'custpage_reserve_cseg_value', type: serverWidget.FieldType.LONGTEXT, label: 'Reserve Cseg_Value' });
        //    var itemReserveCsegUnitField = scriptContext.form.addField({ id: 'custpage_reserve_cseg_unit', type: serverWidget.FieldType.LONGTEXT, label: 'Reserve Cseg Unit' });

        //    var customrecord_cseg_tsa_fundreservSearchObj = search.create({
        //        type: "customrecord_cseg_tsa_fundreserv",
        //        filters: [],
        //        columns: [
        //            search.createColumn({ name: "internalid", label: "Internal ID" }),
        //            search.createColumn({ name: "name", sort: search.Sort.ASC, label: "Name" }),
        //            search.createColumn({ name: "custrecord_cseg_tsa_fundreserv_n101", label: 'filter by "Unit"' })
        //        ]
        //    });

        //    var cseg_id_array = [];
        //    var cseg_value_array = [];
        //    var cseg_unit_array = [];
        //    customrecord_cseg_tsa_fundreservSearchObj.run().each(function (result) {

        //        cseg_id_array.push(result.getValue({ name: "internalid" }));
        //        cseg_value_array.push(result.getValue({ name: "name" }));
        //        cseg_unit_array.push(result.getValue({ name: "custrecord_cseg_tsa_fundreserv_n101" }));

        //        return true;
        //    });

        //    itemReserveCsegIdField.defaultValue = JSON.stringify(cseg_id_array);
        //    itemReserveCsegValueField.defaultValue = JSON.stringify(cseg_value_array);
        //    itemReserveCsegUnitField.defaultValue = JSON.stringify(cseg_unit_array);
        //    log.debug("TSA_VS_item_default_reserve_ue20::beforeLoad", 'JSON.stringify(cseg_value_array).length: ' + JSON.stringify(cseg_value_array).length);
        //    log.debug("TSA_VS_item_default_reserve_ue20::beforeLoad", 'JSON.stringify(cseg_value_array): ' + JSON.stringify(cseg_value_array));

        //    itemReserveCsegIdField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
        //    itemReserveCsegValueField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
        //    itemReserveCsegUnitField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

        //    //Create Default Reserve field and fill it from cseg JSON
        //    var default_reserve_label = translation.get({ collection: 'custcollection__tsa_collection_01', key: 'DEFAULT_RESERVE', locale: translation.Locale.CURRENT })();
        //    var itemReserveField = scriptContext.form.addField({ id: 'custpage_default_reserve', type: serverWidget.FieldType.SELECT, label: default_reserve_label });
        //    var itemUnit = scriptContext.newRecord.getValue("class");

        //    log.debug("TSA_VS_item_default_reserve_ue20::beforeLoad", 'cseg_id_array.length: ' + cseg_id_array.length);
            
        //    //Fill "Default Reserve" field from JSON
        //    for (var i = 0; i < cseg_id_array.length; i++) {

        //        if (!itemUnit || itemUnit.length == 0 || cseg_unit_array[i] == itemUnit) {

        //            itemReserveField.addSelectOption({ value: cseg_id_array[i], text: cseg_value_array[i] });
        //        }
        //    }

        //    //Set "Default Reserve" field from "Item Default Reserve" custom record type
        //    var customrecord_item_def_reserveSearchObj = search.create({
        //        type: "customrecord_item_def_reserve",
        //        filters: [["custrecord_item_id", "anyof", itemId]],
        //        columns: [search.createColumn({ name: "custrecord_tsa_ihq_def_reserve2", label: "Default Reserve 2" })]
        //    });
            
        //    customrecord_item_def_reserveSearchObj.run().each(function (result) {

        //        itemReserveField.defaultValue = result.getValue({ name: "custrecord_tsa_ihq_def_reserve2" });
        //        return false;
        //    });

        //    return true;
        //}
        //catch (e) {
        //    log.debug("TSA_VS_item_default_reserve_ue20::beforeLoad - Error", 'Message: ' + e);
        //}
        //finally {
        //}

        //#endregion
        
        try {

            if (scriptContext.type == scriptContext.UserEventType.DELETE) return;

            var itemId = scriptContext.newRecord.getValue("id");

            var customrecord_cseg_tsa_fundreservSearchObj = search.create({
                type: "customrecord_cseg_tsa_fundreserv",
                filters: [
                    ["isinactive", "is", "F"]
                ],
                columns: [
                    search.createColumn({ name: "internalid", label: "Internal ID" }),
                    search.createColumn({ name: "name", sort: search.Sort.ASC, label: "Name" }),
                    search.createColumn({ name: "custrecord_cseg_tsa_fundreserv_n101", label: 'filter by "Unit"' })
                ]
            });

            //Create Default Reserve field and fill it from cseg JSON
            var default_reserve_label = translation.get({ collection: 'custcollection__tsa_collection_01', key: 'DEFAULT_RESERVE', locale: translation.Locale.CURRENT })();
            var itemReserveField = scriptContext.form.addField({ id: 'custpage_default_reserve', type: serverWidget.FieldType.SELECT, label: default_reserve_label });

          	itemReserveField.addSelectOption({ value: String(""), text: ""});
            customrecord_cseg_tsa_fundreservSearchObj.run().each(function (result) {

                itemReserveField.addSelectOption({ value: result.getValue({ name: "internalid" }), text: result.getValue({ name: "name" }) });
                return true;
            });
            
            //Set "Default Reserve" field from "Item Default Reserve" custom record type
            var customrecord_item_def_reserveSearchObj = search.create({
                type: "customrecord_item_def_reserve",
                filters: [["custrecord_item_id", "anyof", itemId]],
                columns: [search.createColumn({ name: "custrecord_tsa_ihq_def_reserve2", label: "Default Reserve 2" })]
            });

            customrecord_item_def_reserveSearchObj.run().each(function (result) {

                itemReserveField.defaultValue = result.getValue({ name: "custrecord_tsa_ihq_def_reserve2" });
                return false;
            });

            return true;
        }
        catch (e) {
            log.debug("TSA_VS_item_default_reserve_ue20::beforeLoad - Error", 'Message: ' + e);
        }
        finally {
        }
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {

        if (scriptContext.type == scriptContext.UserEventType.DELETE) return;

        /*
         * if (scriptContext.newRecord.getValue("id") != 667) {
            return true;//11-3KYA-CAP BAND - SOLDIER (ENGLISH)
        }
		*/
      
        try {

            var currentRecord = scriptContext.newRecord;
            var id = currentRecord.getValue({ fieldId: 'id' });
            var name = currentRecord.getText({ fieldId: 'itemid' });
            var customDefaultReserve = currentRecord.getValue({ fieldId: "custpage_default_reserve" });
            var defaultReserveRecord;

            log.debug("TSA_VS_item_default_reserve_ue20::afterSubmit", "id= " + id);
            log.debug("TSA_VS_item_default_reserve_ue20::afterSubmit", "name= " + name);
            //log.debug("TSA_VS_item_default_reserve_ue20::afterSubmit", "currentRecord= " + JSON.stringify(currentRecord));
            log.debug("TSA_VS_item_default_reserve_ue20::afterSubmit", "customDefaultReserve= " + customDefaultReserve);

            var customrecord_item_def_reserveSearchObj = search.create({
                type: "customrecord_item_def_reserve",
                filters: [["custrecord_item_id", "anyof", id]],
                columns: [search.createColumn({ name: "internalid", label: "Internal ID" })]
            });

            var searchResultCount = customrecord_item_def_reserveSearchObj.runPaged().count;

            if (searchResultCount > 0) {
                log.debug("TSA_VS_item_default_reserve_ue20::afterSubmit", "Load record ");
                customrecord_item_def_reserveSearchObj.run().each(function (result) {
                    defaultReserveRecord = record.load({ type: "customrecord_item_def_reserve", id: result.getValue({ name: "internalid" }), isDynamic: true });
                    return false;
                });
                customDefaultReserve = currentRecord.getText({ fieldId: "custpage_default_reserve" });
            }
            else {
                log.debug("TSA_VS_item_default_reserve_ue20::afterSubmit", "Create record ");

                defaultReserveRecord = record.create({
                    type: "customrecord_item_def_reserve",
                    isDynamic: true
                });
            }

            defaultReserveRecord.setValue({ fieldId: "name", value: name, ignoreFieldChange: false });
            defaultReserveRecord.setValue({ fieldId: "custrecord_item_id", value: id, ignoreFieldChange: false });
            defaultReserveRecord.setValue({ fieldId: "custrecord_tsa_ihq_def_reserve2", value: customDefaultReserve, ignoreFieldChange: false });

            log.debug("TSA_VS_item_default_reserve_ue20::afterSubmit", "defaultReserveRecord= " + JSON.stringify(defaultReserveRecord));

            defaultReserveRecord.save({ enableSourcing: false, ignoreMandatoryFields: true });
        }
        catch (e) {
            log.debug("TSA_VS_item_default_reserve_ue20::afterSubmit - Error", 'Message: ' + e);
        }
        finally {
        }
    }

    return {
        beforeLoad: beforeLoad,
        afterSubmit: afterSubmit
    };
    
}); 