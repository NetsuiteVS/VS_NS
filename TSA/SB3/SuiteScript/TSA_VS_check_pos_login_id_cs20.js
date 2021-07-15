/****************************************************************************************
 * Name:		SuiteScript 2.0 Client (#TSA_VS_check_pos_login_id_cs20.js)
 *
 * Script Type:	Client
 *
 * Author:		Viktor Schumann
 *
 * Purpose:     Check POS login id. It must be unique.
 * 
 * Date:        22/06/2020
 *
 ****************************************************************************************/


/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/log', 'N/search', 'N/runtime', 'N/record', 'N/ui/message' ],

    function (url, log, search, runtime, record, message) {

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
        function validateField(scriptContext) {

            try {

                console.log("check_pos_login_id::Validate field ,Script started");

                var recordId = scriptContext.currentRecord.getValue({ fieldId: "id" });
              	if(!recordId) recordId=0;
                var fieldId = scriptContext.fieldId;

                console.log("check_pos_login_id::Validate field ,recordId:" + recordId);
                console.log("check_pos_login_id::Validate field ,fieldId:" + fieldId);

                if (!fieldId == "custentity_pos3_user" || fieldId.length == 0) {
                  	console.log("check_pos_login_id::Validate field - return withhout check");
                    return true;
                }

                var loginId = scriptContext.currentRecord.getValue("custentity_pos3_user");

                if (!loginId) {
                    return true;
                }              	

                console.log("check_pos_login_id::Validate field ,loginId:" + loginId);

                var employeeSearchObj = search.create({
                    type: "employee",
                    filters: [["custentity_pos3_user", "is", loginId], "AND", ["internalid", "noneof", recordId]],
                    columns:[
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({ name: "custentity_pos3_user", label: "POS Login ID" })
                        ]
                });
                var searchResultCount = employeeSearchObj.runPaged().count;
                console.log("check_pos_login_id::Validate field ,searchResultCount:" + searchResultCount);
				
				
                if (searchResultCount > 0) {
                    //window.scrollTo(0, 0);
                    //window.showAlertBox('error_info', 'POS Login ID must be unique.', '', NLAlertDialog.TYPE_MEDIUM_PRIORITY);
					alert('POS Login ID must be unique.');					
					scriptContext.currentRecord.setValue("custentity_pos3_user",null);
                    return false;
                }

                return true;                
            }
            catch (e) {
              	console.log("check_pos_login_id::Validate field - ERROR "+" check_pos_login_id::Validate field ,searchResultCount:" + searchResultCount);
            }
            finally {
            }

            console.log("check_pos_login_id::Validate field ,Script finished");
        }

        //#endregion

        return {
            validateField: validateField
        };
    });

