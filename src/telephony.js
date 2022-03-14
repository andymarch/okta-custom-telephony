const { default: axios } = require("axios");
const winston = require("winston");

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL,
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
    ],
});
 
 module.exports.handler = async (event) => {
    var payload = JSON.parse(event.body)
    logger.defaultMeta = {eventId: payload.eventId, oktaTransactionId: payload.data.context.request.id}

    if(payload.data.messageProfile.deliveryChannel != "SMS"){
        logger.error("Unable to deliver non-SMS delivery channel messages.")
        return {
            statusCode: 200,
            body: JSON.stringify(buildErrorPayload(payload.data.userProfile.login, "Non-SMS delivery channel not supported."))
        }
    }

    var result = await axios.get("https://www.firetext.co.uk/api/sendsms", 
        {
            params:
            {
                apiKey: process.env.FIRETEXT_KEY,
                message: payload.data.messageProfile.msgTemplate,
                from: process.env.SENDER_ID,
                to: payload.data.messageProfile.phoneNumber.replace('+','')//firetext does not handle + char
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

    if(result.data.startsWith("0")){
        logger.debug("Successfully delivered",{providerResponse: result.data})
        return {
            statusCode: 200,
            body: JSON.stringify(buildSuccessPayload('Firetext',result.data))
        }
    }

    logger.warn("Unexpected response from provider",{providerResponse: result.data})
    return {
        statusCode: 200,
        body: JSON.stringify(buildErrorPayload(payload.data.userProfile.login, result.data))
    }
 }

 function buildSuccessPayload(provider,meta){
    return {
        "commands":[
            {
               "type":"com.okta.telephony.action",
               "value":[
                 {
                    "status":"SUCCESSFUL",
                    "provider":provider,
                    "transactionMetadata": meta
                 }
              ]
            }
         ]
   }
}

 function buildErrorPayload(userid, reason){
     return {
        "error":{
           "errorSummary":"Failed to deliver OTP to "+userid,
           "errorCauses":[
              {
                 "errorSummary":"Unable to perform.",
                 "reason": reason
              }
           ]
        }
    }
 }
