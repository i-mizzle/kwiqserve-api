import { parseResponse, snakeToCamel } from "../../utils/utils";

const requestPromise = require("request-promise");
const config = require('config')


interface InitializeFlutterwavePurchaseObject  {
    transactionReference: String;
    amount: number,
    customerEmail: String;
    customerName: String;
    customerPhone: String;
    redirectUrl: String;
    meta: any,
    subaccounts?: {
        id: string
        transaction_charge_type: string
        transaction_charge: number
    }[]
}
export const initializePurchase = async (input: InitializeFlutterwavePurchaseObject) => {    
    let url = 'https://api.flutterwave.com/v3/payments';
    let verb = "POST";

    const requestPayload: any = {
        tx_ref: input.transactionReference,
        amount: input.amount/100,
        currency: "NGN",
        redirect_url: input.redirectUrl,
        payment_options:"card, ussd, banktransfer, account",
        meta: {
            geoTravelReference: input.transactionReference
        },
        customer:{
           email: input.customerEmail,
           phonenumber: input.customerPhone,
           name: input.customerName
        },
        customizations:{
        //    title: "GeoTravel",
        //    description: "Pay for your flights or travel packages",
        //    logo: "https://gowithgeo.com/assets/images/wxhitelogo.png"
        }
    }

    if(input.subaccounts) {
        requestPayload.subaccounts = input.subaccounts
    }

    console.log('----------------> ', requestPayload)

    let initiateTransactionResponse = null;

    const requestHeaders = {
        Authorization: config.flutterwave.SECRET_KEY,
        "Content-Type": "application/json"
    }

    let requestOptions = { uri: url, method: verb, headers: requestHeaders, body: JSON.stringify(requestPayload) };

    try {
        initiateTransactionResponse = await requestPromise(requestOptions);
        console.log('RESPONSE ===> ', initiateTransactionResponse)
        initiateTransactionResponse = parseResponse(initiateTransactionResponse);

        initiateTransactionResponse.data.redirectUrl = input.redirectUrl

        return {
            error: false,
            errorType: '',
            data: initiateTransactionResponse.data
        }
    } catch (error: any) {
        console.log(error);
        return {
            error: true,
            errorType: 'error',
            data: error.message || error
        }
    }
}
interface InitializeFlutterwavePurchaseViaTransferObject  {
    transactionReference: String;
    amount: number,
    customerEmail: String;
    customerPhone: String;
    narration: String;
    currency: String;
}

export const initializePurchaseViaTransfer = async (input: InitializeFlutterwavePurchaseViaTransferObject) => {    
    let url = 'https://api.flutterwave.com/v3/charges?type=bank_transfer';
    let verb = "POST";

    const payload = {
        tx_ref: input.transactionReference,
        amount: input.amount,
        email: input.customerEmail,
        phone_number: input.customerPhone,
        currency:"NGN",
        narration: input.narration,
        is_permanent: false
     }

    let initiateTransactionResponse = null;

    const requestHeaders = {
        Authorization: config.flutterwave.SECRET_KEY,
        "Content-Type": "application/json"
    }

    let requestOptions = { uri: url, method: verb, headers: requestHeaders, body: JSON.stringify(payload) };

    console.log("Headers====>", requestHeaders)
    console.log("Requesters====>", requestOptions)
    try {
        initiateTransactionResponse = await requestPromise(requestOptions);
        console.log('RESPONSE ===> ', initiateTransactionResponse)
        initiateTransactionResponse = parseResponse(initiateTransactionResponse);

        return {
            error: false,
            errorType: '',
            data: initiateTransactionResponse
        }
    } catch (error: any) {
        console.log(error);
        return {
            error: true,
            errorType: 'error',
            data: error.message || error
        }
    }
}

interface InitializeTokenizedChargeObject  {
    token: String;
    transactionReference: String;
    amount: number,
    customerEmail: String;
    customerPhone: String;
    customerName: String;
    narration: String;
    currency: String;
}

export const initializeTokenizedCharge = async (input: InitializeTokenizedChargeObject) => {    
    let url = 'https://api.flutterwave.com/v3/tokenized-charges';
    let verb = "POST";

    const payload = {
        token: input.token,
        currency: "NGN",
        country: "NG",
        amount: input.amount,
        email: input.customerEmail,
        first_name: input.customerName.split(' ')[0],
        last_name: input.customerName.split(' ')[1],
        narration: "Sample tokenized charge",
        tx_ref: input.transactionReference,
    }

    let initiateTransactionResponse = null;

    const requestHeaders = {
        Authorization: config.flutterwave.SECRET_KEY,
        "Content-Type": "application/json"
    }

    let requestOptions = { uri: url, method: verb, headers: requestHeaders, body: JSON.stringify(payload) };

    console.log("Headers====>", requestHeaders)
    console.log("Reaquesters====>", requestOptions)
    try {
        initiateTransactionResponse = await requestPromise(requestOptions);
        console.log('RESPONSE ===> ', initiateTransactionResponse)
        initiateTransactionResponse = parseResponse(initiateTransactionResponse);
        return {
            error: false,
            errorType: '',
            data: initiateTransactionResponse.data
        }
    } catch (error: any) {
        console.log(error);
        return {
            error: true,
            errorType: 'error',
            data: error.message || error
        }
    }
}

interface InitializePayoutObject {
    bankCode: string,
    accountNumber: string,
    amount: number,
    narration: string,
    transactionReference: string,
}

export const initializePayout = async (input: InitializePayoutObject) => {    
    let url = 'https://api.flutterwave.com/v3/transfers';
    let verb = "POST";

    const payload = {
        account_bank: input.bankCode,
        account_number: input.accountNumber,
        amount: input.amount,
        narration: input.narration,
        currency: "NGN",
        reference: input.transactionReference,
        callback_url: "",
        debit_currency: "NGN"
    }

    let initiateTransactionResponse = null;

    const requestHeaders = {
        Authorization: config.flutterwave.SECRET_KEY,
        "Content-Type": "application/json"
    }

    let requestOptions = { uri: url, method: verb, headers: requestHeaders, body: JSON.stringify(payload) };

    console.log("Headers====>", requestHeaders)
    console.log("Reaquesters====>", requestOptions)
    try {
        initiateTransactionResponse = await requestPromise(requestOptions);
        console.log('RESPONSE ===> ', initiateTransactionResponse)
        initiateTransactionResponse = parseResponse(initiateTransactionResponse);
        return {
            error: false,
            errorType: '',
            data: initiateTransactionResponse.data
        }
    } catch (error: any) {
        console.log(error);
        return {
            error: true,
            errorType: 'error',
            data: error.message || error
        }
    }
}

interface NewSubAccountInterface {
    bankCode: string
    accountNumber: string
    accountName: string
    phone: string
    email: string
    accountReference: string
    splitType: string
    splitValue: number
}

export const createSubAccount = async (input: NewSubAccountInterface) => {    
    console.log('creating sub account ...')
    let url = 'https://api.flutterwave.com/v3/payout-subaccounts';
    let verb = "POST";

    const payload = {
        account_reference: input.accountReference,
        account_bank: input.bankCode,
        account_number: input.accountNumber,
        account_name: input.accountName,
        business_name: input.accountName,
        business_mobile: input.phone,
        email: input.email,
        country: "NG",
        split_type: input.splitType.toLowerCase(),
        split_value: input.splitValue
    }

    console.log('sub account payload ... ', payload)

    let subAccount = null;

    const requestHeaders = {
        Authorization: config.flutterwave.SECRET_KEY,
        "Content-Type": "application/json"
    }

    let requestOptions = { uri: url, method: verb, headers: requestHeaders, body: JSON.stringify(payload) };

    console.log("Sub-account Headers====>", requestHeaders)
    console.log("Sub-account Request options ====>", requestOptions)
    try {
        subAccount = await requestPromise(requestOptions);
        console.log('sub account creation response ===> ', subAccount)
        subAccount = parseResponse(subAccount);
        return {
            error: false,
            errorType: '',
            data: subAccount.data
        }
    } catch (error: any) {
        console.log(error);
        return {
            error: true,
            errorType: 'error',
            data: error.message || error
        }
    }
}
interface VerifyChargenObject {
    otp: String;
    flutterwaveRef: String;
}

export const verifyCharge = async (input: VerifyChargenObject) => {    
    let url = `https://api.flutterwave.com/v3/validate-charge`;
    let verb = "POST";

    let verificationResponse = null;

    const requestHeaders = {
        Authorization: config.flutterwave.SECRET_KEY,
        "Content-Type": "application/json"
    }

    const requestPayload = {
        otp: input.otp,
        flw_ref: input.flutterwaveRef,
        type: "account"
      }

    let requestOptions = { uri: url, method: verb, headers: requestHeaders, body: JSON.stringify(requestPayload) };

    try {
        verificationResponse = await requestPromise(requestOptions);
        verificationResponse = parseResponse(verificationResponse);
        return {
            error: false,
            errorType: '',
            data: verificationResponse.data
        }
    } catch (error: any) {
        return {
            error: true,
            errorType: 'error',
            data: error.message || error
        }
    }
}
interface VerifyFlutterwaveTransactionObject {
    transactionReference: String;
}

export const verifyTransaction = async (input: VerifyFlutterwaveTransactionObject) => {
    const transactionReference = input.transactionReference
    
    let url = `https://api.flutterwave.com/v3/transactions/${transactionReference}/verify`;
    let verb = "GET";

    let verificationResponse = null;

    const requestHeaders = {
        Authorization: config.flutterwave.SECRET_KEY,
        "Content-Type": "application/json"
    }

    let requestOptions = { uri: url, method: verb, headers: requestHeaders, body: null };

    try {
        verificationResponse = await requestPromise(requestOptions);
        verificationResponse = parseResponse(verificationResponse);

        console.log('________________________ ', verificationResponse)

        return {
            error: false,
            errorType: '',
            data: snakeToCamel(verificationResponse.data)
        }
    } catch (error: any) {
        return {
            error: true,
            errorType: 'error',
            data: error.message || error
        }
    }
}
// interface Bvn {
//     user: String,
//     bvn: String
// }

// export const getBvnData = async (input: Bvn) => {
//     const url = `https://api.flutterwave.com/v3/kyc/bvns/${input.bvn}`
//     const verb = "GET";

//     let bvnData = null 
//     const requestHeaders = {
//         Authorization: config.flutterwave.SECRET_KEY,
//         "Content-Type": "application/json"
//     }

//     let requestOptions = { uri: url, method: verb, headers: requestHeaders, body: null };

//     try {
//         bvnData = await requestPromise(requestOptions);
//         bvnData = parseResponse(bvnData);

//         if(bvnData.success && bvnData.status === 'success') {
//             // send OTP to the bvn phone number
//             return {
//                 error: false,
//                 errorType: '',
//                 data: bvnData.data
//             }
//         } else {
//             return {
//                 error: true,
//                 errorType: 'error',
//                 data: "Sorry, we could not establish communication with BVN database, please try again later"
//             }
//         }
//     } catch (error: any) {
//         // const err = JSON.parse(error.error)
//         const returnError = {
//             error: true,
//             errorType: 'error',
//             data: "Sorry, we could not establish communication with BVN database, please try again later"
//         }
//         // produceMessage({
//         //     topic: 'logs',
//         //     message: JSON.stringify({
//         //         service: 'FLW',
//         //         response: error.error,
//         //         input: JSON.stringify(input),
//         //         description: "error trying to get user BVN data",
//         //         errorReturned: JSON.stringify(returnError)
//         //     })
//         // })
//         return returnError
//     }

// }

// interface FlutterwaveWebhookObject {
//     status: String,
//     t
// }

// export const handleWebhook = async (req: Request, res: Response) => {
//     try {
//         if (input.status === 'successful') {
//             const updatePayload = {
//                 transactionStatus: 'SUCCESSFUL',
//                 channelResponse: req.body
//             }
//             const transactionRef = req.body.txRef
//             const user = {
//                 name: req.body.customer.fullName || null,
//                 email: req.body.customer.email || null
//             }
//             // const updateResponse = await transactionHelper.update(updatePayload, transactionRef, user)

//             // Vebd Tokens
//             if (updateResponse.error) {
//                 return response[updateResponse.errorType](res, updateResponse.data);
//             } else {
//                 return response.ok(res, updateResponse.data);
//             }
//         }
//     } catch (error) {
//         console.log(error)
//         response.error(res, error)
//     }
// }