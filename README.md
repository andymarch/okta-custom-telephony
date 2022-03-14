# Okta Custom Telephony 

This project is an example implementing Okta's custom telephony inline hook.

> :construction: ⚠️ This feature is currently in `beta` and will require Okta Support to enable on your tenant. :warning: :construction:


*Documentation* https://developer.okta.com/docs/reference/telephony-hook/

### Pre-requirments
- [Serverless Framework](https://www.serverless.com/).
- Okta [tenant](https://developer.okta.com/signup/) with beta feature enable.
- Firetext [account](https://www.firetext.co.uk/).

### Implemented Providers
- Firetext

### Configuration

This project is deployed with the Serverless framework (AWS quickstart guide [here](https://www.serverless.com/framework/docs/providers/aws/guide/quick-start/)). The following parameters need to be defined.

* ```fixed-secret``` This is the value that Okta will send in the Authorization header to initiate the hook.
* ```sender_id``` This is the value which is displayed to the user as the sender of the message.
* ```firetext-api-key``` This value is used to authenticate calls to the firetext api.
