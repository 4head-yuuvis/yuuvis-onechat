require('dotenv').config({ path: '../../../env' });
const request = require('request')

const fs = require('fs')

var key = process.env.OCP_APIM_SUBSCRIPTION_KEY;
var baseUrl = "https://api.yuuvis.io/"

var doc_name = ""
var doc_filename = ""
var doc_cid = ""
var doc_mimeType = ""

function yuuvisUploadItem(name, filename, cid, mimeType) {
    doc_name = name;
    doc_filename = filename;
    doc_cid = cid;
    doc_mimeType = mimeType;
    var requestObject = createRequest(doc_name, doc_filename, doc_cid, doc_mimeType)
    executeRequest(requestObject)
}

function createDocumentMetadata(doc_title, doc_fileName, doc_cid, doc_contentType) {
  return {
    "objects":[
      {
        "properties": {
            "enaio:objectTypeId": {
                "value": "document"
            },
            "Name": {
                "value": doc_title
            }
        },
        "contentStreams": [{
            "mimeType": doc_contentType,
            "fileName": doc_fileName,
            "cid": doc_cid
        }]
      }
    ]
  };
}

function createImportFormdata(doc_title, doc_fileName, doc_cid, doc_contentType){
  var formData = {}
  formData['data'] = {
    value: JSON.stringify(createDocumentMetadata(doc_title, doc_fileName, doc_cid, doc_contentType)),
    options: {
      contentType: 'application/json'
    }
  }
  formData[doc_cid]= {
    value: fs.createReadStream(doc_fileName),
    options: {
      contentType: doc_contentType,
      filename: doc_fileName
    }
  }
  return formData;
}

function createRequest(doc_title, doc_fileName, doc_cid, doc_contentType) {
  return{
    method: 'POST',
    uri: baseUrl + 'dms/objects/',
    headers: {
      'Accept': 'application/json',
      'Ocp-Apim-Subscription-Key': key
    },
    formData: createImportFormdata(doc_title, doc_fileName, doc_cid, doc_contentType)
  }
}




function executeRequest(request_object){
  console.log("UPLOAD");
  request.post(request_object, function callback(err, httpResponse, body) {
    if(err) throw err;
    else {
      console.log(httpResponse.statusCode)
      console.log(body)
    }
  })
}

