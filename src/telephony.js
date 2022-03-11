const { default: axios } = require("axios");
const winston = require("winston");

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
    ],
});
 
 module.exports.handler = async (event) => {
    var payload = JSON.parse(event.body)

    if(payload.data.messageProfile.deliveryChannel != "SMS"){
        return {
            statusCode: 200,
            body: JSON.stringify(buildErrorPayload("Non-SMS delivery channel not supported."))
        }
    }

    var result = await axios.get("https://www.firetext.co.uk/api/sendsms", 
        {
            params:
            {
                apiKey: process.env.FIRETEXT_KEY,
                message: payload.data.messageProfile.msgTemplate,
                from: process.env.SENDER_ID,
                to: payload.data.messageProfile.phoneNumber.replace('+','')
            }
        }
    )

    if(result.data === '1: Authentication error'){
        var msg = "Service failed to perform due to authentication error."
        logger.error("Service failed to perform due to authentication error.")
        return {
            statusCode: 200,
            body: JSON.stringify(buildErrorPayload(msg))
        }
    }

    if(result.data === '0:1 SMS successfully queued'){
        return {
            statusCode: 200,
            body: JSON.stringify(buildSuccessPayload('Firetext'))
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify(buildErrorPayload(result.data))
    }
 }

 function buildSuccessPayload(provider){
    return {
        "commands":[
            {
               "type":"com.okta.telephony.action",
               "value":[
                 {
                    "status":"SUCCESSFUL",
                    "provider":provider,
                 }
              ]
            }
         ]
   }
}

 function buildErrorPayload(reason){
     return {
        "error":{
           "errorSummary":"Unable to perform",
           "errorCauses":[
              {
                 "errorSummary":"Unable to perform.",
                 "reason": reason
              }
           ]
        }
    }
 }
