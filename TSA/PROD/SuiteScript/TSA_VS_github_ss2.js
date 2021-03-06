/****************************************************************************************
 * Name:		SuiteScript 2.0 Scheduled (TSA_VS_github_ss2.js)
 *
 * Script Type:	Scheduled
 *
 * Author:		Viktor Schumann

 * Date:        13/07/2021
 *
 ****************************************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
**/

define(['N/record', 'N/search', 'N/render', 'N/format', 'N/runtime', 'N/task', 'N/https', 'N/file', 'N/encode'],
    /**
     * @param {record} record
     * @param {search} search
     */

    function (record, search, render, format, runtime, task, https, file, encode) {

        var TEST_MODE = false;
        var URL = 'https://api.github.com/repos/NetsuiteVS/VS_NS/contents/';

        var githubRootFolder;
        var lastUploadDates = [];
        var processedRecords = 0;
        var requestHeader;

        //************************** EXECUTE *****************************

        /**
        * @param {Object} scriptContext
        * @param {string} scriptContext.type
        * @Since 2018.2
        */
        function execute(scriptContext) {
            try {

                log.debug("execute", "Started");

                //Check account
                var accounts = runtime.getCurrentScript().getParameter({ name: "custscript_tsa_accounts" }).toUpperCase();
                var accountId = runtime.accountId.replace("_", "-").toUpperCase();

                if (accountId.indexOf("-") > -1) {
                    accountId = accountId.split("-")[1];
                }
                else {
                    accountId = "PROD";
                }
                //log.debug("execute", "accountId:" + accountId + ", accounts:" + accounts);

                if (accounts.indexOf(accountId) == -1) {
                    log.debug("execute", "Account '" + accountId + "' is not listed to run in parameter:" + accounts);
                    return;
                }
                
                //Get token
                var token = runtime.getCurrentScript().getParameter({ name: "custscript_tsa_token_param" });
                githubRootFolder = runtime.getCurrentScript().getParameter({ name: "custscript_tsa_root_folder" });
                githubRootFolder += "/" + accountId + "/SuiteScript";
                log.debug("execute", "token:" + token + ", githubRootFolder:" + githubRootFolder);
       
                requestHeader = {
                    "Content-Type": "application/vnd.github.v3+json",
                    "Authorization": "token " + token
                };

                //Get uploaded scripts
                var customrecord_tsa_vs_github_uploadsSearchObj = search.create({
                    type: "customrecord_tsa_vs_github_uploads",
                    filters: [["custrecord_tsa_status_gh", "is", "Processed"]],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_tsa_file_path", summary: "GROUP", label: "Path" }),
                            search.createColumn({ name: "custrecord_tsa_script_name_gh", summary: "GROUP", label: "Script ID" }),
                            search.createColumn({ name: "custrecord_tsa_last_modified_date_str", summary: "MAX", label: "Last Modified Date Str" }),
                        ]
                });
                customrecord_tsa_vs_github_uploadsSearchObj.run().each(function (result) {

                    var path = result.getValue({ name: 'custrecord_tsa_file_path', summary: "GROUP" });
                    var scriptName = result.getValue({ name: 'custrecord_tsa_script_name_gh', summary: "GROUP" });
                    var date = result.getValue({ name: 'custrecord_tsa_last_modified_date_str', summary: "MAX" });

                    //log.debug("checkFolder", "path:" + path + ", scriptName:" + scriptName + ", date:" + date);

                    lastUploadDates[path + "/" + scriptName] = date;

                    return true;
                });

                //Get suitescript folder id
                var folderSearchObj = search.create({
                    type: "folder",
                    filters: [["name", "is", "SuiteScripts"]],
                    columns: [search.createColumn({ name: "internalid", label: "Internal ID" })]
                });
                folderSearchObj.run().each(function (result) {
                    var suiteScriptFolderId = result.getValue({ name: 'internalid' });
                    log.debug("execute", "suiteScriptFolderId:" + suiteScriptFolderId);

                    //Check folders recursively started from SuiteScript folder
                    checkFolder(suiteScriptFolderId, githubRootFolder);

                    return false;//Check only first record
                });

                return true;
            }
            catch (e) {
                log.debug("execute - ERROR", e);
            }
            finally {
            }

            log.debug("execute", "Finished");
        }

        function checkFolder(folderIdPrm, folderPathPrm) {
            try {

                log.debug("checkFolder", "folderPathPrm:" + folderPathPrm + ", folderIdPrm:" + folderIdPrm);

                var subfolders = {};
                
                var folderSearchObj = search.create({
                    type: "folder",
                    filters:
                        [
                            ["internalid", "anyof", folderIdPrm],//Get files from actual folder
                            "OR",
                            ["parent", "anyof", folderIdPrm]//Get subfolders
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({ name: "name", label: "Name" }),
                            search.createColumn({ name: "name", join: "file", label: "Name" }),
                            search.createColumn({ name: "modified", join: "file", sort: search.Sort.DESC, label: "Last Modified" }),
                            search.createColumn({ name: "internalid", join: "file", label: "Internal ID" })
                        ]
                });
                folderSearchObj.run().each(function (result) {

                    processedRecords++;

                    if (TEST_MODE && processedRecords > 3) {
                        return false;
                    }

                    //log.debug("checkFolder", "result:" + JSON.stringify(result));
                    var folderId = result.getValue({ name: 'internalid' });
                    var folderName = result.getValue({ name: 'name'});
                    var fileName = result.getValue({ name: 'name', join: "file" }).replace(/#/g, '_HM_');
                    var fileId = result.getValue({ name: 'internalid', join: "file" });
                    var lastModifiedDate = result.getValue({ name: 'modified', join: "file" });
                    //15/02/2021 3:00 AM   ->  2021.02.15. AM03:00
                    //Set AM before time to be able to ordering
                    var lastModifiedDateStr = lastModifiedDate.substring(6, 10) + "." + lastModifiedDate.substring(3, 5) + "." + lastModifiedDate.substring(0, 2)  + ". " +
                        (lastModifiedDate.substring(13, 14) != ":" ? "0" : "") + lastModifiedDate.substring(11);
                    lastModifiedDateStr = lastModifiedDateStr.substring(0, 12) + lastModifiedDateStr.substring(18, 20) + lastModifiedDateStr.substring(12, 17);

                    var fullPath = folderPathPrm + "/" + fileName;
                  
                    if (folderId == folderIdPrm) {//File is in actual folder

                        if (fileName) {

                            //log.debug("checkFolder", "folderId:" + folderId + ", fileId:" + fileId + ", fullPath:" + fullPath + ", lastModifiedDate:" + lastModifiedDate);
                            //log.debug("checkFolder", "lastModifiedDateStr:" + lastModifiedDateStr + ", lastUploadDates[" + fullPath + "]:" + lastUploadDates[fullPath]);

                            if (!lastUploadDates[fullPath] || lastUploadDates[fullPath].length == 0 || lastUploadDates[fullPath] != lastModifiedDateStr) {

                                //log.debug("checkFolder", "Upload neccessary");

                                var uploadRecordID;
                                var errorMessage;

                                //Create new record if it doesn't exitst
                                var createdRecord = record.create({ type: "customrecord_tsa_vs_github_uploads", isDynamic: false, defaultValues: null });
                                createdRecord.setValue({ fieldId: "custrecord_tsa_file_path", value: folderPathPrm, ignoreFieldChange: true });
                                createdRecord.setValue({ fieldId: "custrecord_tsa_script_name_gh", value: fileName, ignoreFieldChange: true });
                                createdRecord.setValue({ fieldId: "custrecord_tsa_last_modified_date_str", value: lastModifiedDateStr, ignoreFieldChange: true });
                                uploadRecordID = createdRecord.save({ enableSourcing: false, ignoreMandatoryFields: true });

                                try {
                                    //Get sha
                                    //log.debug("checkFolder", "url:" + URL + fullPath);

                                    var fileObj = file.load({ id: fileId });
                                    var fileObjBase64 = encode.convert({ string: fileObj.getContents(), inputEncoding: encode.Encoding.UTF_8, outputEncoding: encode.Encoding.BASE_64 });

                                    var bodyObj = {
                                        "message": "commit message",
                                        "content": fileObjBase64
                                    };

                                    //Add SHA at file update 
                                    var apiResponseSha = https.get({
                                        url: URL + fullPath,
                                        headers: requestHeader
                                    });

                                    if (apiResponseSha.code != 200 && apiResponseSha.code != 404) {
                                        log.debug('checkFolder', "apiResponseSha:" + JSON.stringify(apiResponseSha));
                                        throw "Sha:" + JSON.parse(apiResponseSha.body).message;
                                    }

                                    try {
                                        bodyObj.sha = JSON.parse(apiResponseSha.body).sha;
                                    } catch (e) { }

                                    //log.debug("checkFolder", "bodyObj:" + JSON.stringify(bodyObj));

                                    var apiResponse = https.put({
                                        url: URL + fullPath,
                                        headers: requestHeader,
                                        body: JSON.stringify(bodyObj)
                                    });

                                    if (apiResponse.code != 200 && apiResponse.code != 201) {
                                        log.debug('checkFolder', "apiResponse:" + JSON.stringify(apiResponse));
                                        throw "Commit:" + JSON.parse(apiResponse.body).message;
                                    }

                                }
                                catch (e) {
                                    log.debug("checkFolder(api call) - ERROR", e);
                                    errorMessage = e;
                                }

                                //Update new record status
                                var recordToUpdate = record.load({ type: "customrecord_tsa_vs_github_uploads", id: uploadRecordID, isDynamic: true });
                                recordToUpdate.setValue({ fieldId: "custrecord_tsa_status_gh", value: (errorMessage ? "Error" : "Processed"), ignoreFieldChange: false });
                                if (errorMessage) {
                                    recordToUpdate.setValue({ fieldId: "custrecord_tsa_error_message_gh", value: JSON.stringify(errorMessage), ignoreFieldChange: false });
                                }
                                recordToUpdate.save({ enableSourcing: false, ignoreMandatoryFields: true });
                            }
                        }
                    }
                    else {//Get subfolders
                        if (!subfolders.hasOwnProperty(folderId)) {
                            subfolders[folderId] = folderPathPrm + "/" + folderName;
                        }
                    }

                    return true;
                });

                //Call this function for all subfolders
                log.debug("checkFolder", "subfolders:" + JSON.stringify(subfolders));
                Object.keys(subfolders).forEach(function (key) {
                    var actualKey = key;
                    var actualValue = subfolders[key];

                    if (!TEST_MODE) {
                        checkFolder(actualKey, actualValue);
                    }
                });              

            }
            catch (e) {
                log.debug("checkFolder - ERROR", e);
            }
            finally {
            }
        }
        
        return {
            execute: execute
        };

    });