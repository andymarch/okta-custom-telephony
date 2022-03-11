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
    logger.info(payload)
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

    // message status codes
    // <status no>:<no of credits used> <description> 
    // 0:  SMS successfully queued
    // 1:  Authentication error
    // 2:  Destination number(s) error
    // 3:  From error
    // 4:  Group not recognised
    // 5:  Message error
    // 6:  Send time error (YYYY-MM-DD HH:MM)
    // 7:  Insufficient credit
    // 8:  Invalid delivery receipt URL
    // 9:  Sub-account error (not recognised)
    // 10:  Repeat expiry/interval error (not recognised)
    // 11:  Repeat expiry error (YYYY-MM-DD)
    // 12:  Message loop detected

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
