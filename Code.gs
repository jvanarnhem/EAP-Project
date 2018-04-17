var SPREADSHEET_ID = '1BCs9YjT1fyEm7Fe8hMp2FdjIxpB_EtaxLyts_dchWsY';
// Replace with your spreadsheet ID
var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
var subSheet = ss.getSheetByName("Submissions");
var compSheet = ss.getSheetByName("Completed");
var uploadFolderURL = "No link to Folder";

function doGet(e) {
  var status = e.parameter.idNum;
  if (status) {
    var template = HtmlService.createTemplateFromFile('admin');
  }
  else {
    var template = HtmlService.createTemplateFromFile('forms.html');
  }
  var html = template.evaluate();
  return HtmlService.createHtmlOutput(html).setTitle("EAP Verification");
}

function createFolder(parentFolderId, folderName) {
  try {
    var parentFolder = DriveApp.getFolderById(parentFolderId);
    var folders = parentFolder.getFoldersByName(folderName);
    var folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = parentFolder.createFolder(folderName);
    }
    var foldPath = "https://drive.google.com/drive/folders/"+folder.getId();
    setURL(foldPath);
    return {
      'folderId' : folder.getId()
    }
  } catch (e) {
    return {
      'error' : e.toString()
    }
  }
}

function uploadFile(base64Data, fileName, folderId) {
  try {
    var splitBase = base64Data.split(','), type = splitBase[0].split(';')[0]
    .replace('data:', '');
    var byteCharacters = Utilities.base64Decode(splitBase[1]);
    var ss = Utilities.newBlob(byteCharacters, type);
    ss.setName(fileName);
    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFilesByName(fileName);
    var file;
    while (files.hasNext()) {
      // delete existing files with the same name.
      file = files.next();
      folder.removeFile(file);
    }
    file = folder.createFile(ss);
    return {
      'folderId' : folderId,
      'fileName' : file.getName()
    };
  } catch (e) {
    return {
      'error' : e.toString()
    };
  }
}

function submitReport(data) { 
  var data3 = JSON.parse(data);

  try {
    var newStuff = [];
    var subNumber = +new Date();
    var timeStamp = new Date();
    newStuff.push(subNumber);
    newStuff.push(timeStamp);
    for (var i in data3) {
      if(i != data3.length) {
      if(typeof data3[i]=="object"){
        var dataString = data3[i].join(", ");
        newStuff.push(dataString);
      } else {
        newStuff.push(data3[i]);
      }
      Logger.log(i);
      }
    }
    var scriptProperties = PropertiesService.getScriptProperties();
    var thePath = scriptProperties.getProperty('foldURL');
    Logger.log(thePath);
    newStuff.push(thePath);
    subSheet.appendRow(newStuff);
    
    var htmlBody = "<p>The following discipline report was submitted:</p>";
    htmlBody += "<p>Submitter: " + "value" + "</p>";
    htmlBody += "<p>Date submitted: " + "value" + "</p>";
      htmlBody += "<p>Student involved: " + "value" + "</p>";
    htmlBody += "<p>&nbsp;</p>";
    htmlBody += '<p>Click <a href="' + ScriptApp.getService().getUrl()
       + '?idNum=' + subNumber
       + '">here</a> to see full details of report.</p>';
 
 // CHANGE EMAIL ADDRESS HERE   
    MailApp.sendEmail({
      to: "javanarnhem@gmail.com",
      subject: "Action Required: Discipline Report from " + "value",
      htmlBody: htmlBody
    });
    return "Submission successful. You may close this window now.";
    
  } catch(err) {
    Logger.log(err);
    return "Something went wrong.";
  }
}

// moves a row from a sheet to another when a magic value is entered in a column
function moveCompleted() {
  var sheetNameToWatch = "Submissions";
  var sheetNameToMoveTheRowTo = "Completed";
  var columnNumberToWatch = 16; // column A = 1, B = 2, etc.
  //var valueToWatch = "APPROVED";
    
  var data = subSheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    Logger.log(data[i][columnNumberToWatch]);
    if (data[i][columnNumberToWatch] != "") {
      var targetSheet = ss.getSheetByName(sheetNameToMoveTheRowTo);
      var targetRange = targetSheet.getRange(targetSheet.getLastRow() + 1, 1);
      subSheet.getRange(i+1, 1, 1, subSheet.getLastColumn()).moveTo(targetRange);
      subSheet.deleteRow(i+1);
    }
  };
}

function setURL(newPath) {
  var SCRIPT_PROP = PropertiesService.getScriptProperties(); // new property service
  SCRIPT_PROP.setProperty('foldURL', newPath);
}