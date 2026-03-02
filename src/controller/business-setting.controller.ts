import { Request, Response } from "express";
import { get, omit } from "lodash";
import * as response from "../responses/index";
import log from "../logger";
import { createBusinessSetting, findAndUpdateBusinessSetting, findBusinessSetting } from "../service/business-setting.service";
import { findBusiness } from "../service/business.service";
import { createBankAccount } from "../service/bank-account.service";
import { createSubAccount, createTransferRecipient } from "../service/integrations/paystack.service";

/**
 * Add or update a receiving account for a business
 */
export const addReceivingAccountHandler = async (req: Request, res: Response) => {
    try {
        const userId = get(req, 'user._id');
        const businessId = req.currentBusiness?._id;
        const accountData = req.body;

        // Get or create business settings
        let businessSetting = await findBusinessSetting({ business: businessId });
        if (!businessSetting) {
            businessSetting = await createBusinessSetting({ 
                business: businessId,
                receivingAccounts: []
            });
        }

        let bankAccountId = accountData.account;

        // Create new bank account if not provided
        if (!bankAccountId) {
            let paystackData: any = null;

            // Only process on Paystack if this will be the preferred account
            if (accountData.preferredForRemittance === true) {
                const paystackResponse = await createTransferRecipient({
                    name: accountData.accountName,
                    accountNumber: accountData.accountNumber,
                    bankCode: accountData.bankCode
                });

                if (paystackResponse.error) {
                    log.error('Paystack error:', paystackResponse.data);
                    return response.badRequest(res, { 
                        message: `Failed to create transfer recipient on Paystack: ${paystackResponse.data}` 
                    });
                }

                paystackData = {
                    paystackAccountId: paystackResponse.data.id,
                    paystackRecipientCode: paystackResponse.data.recipient_code,
                    paystackIntegrationId: paystackResponse.data.integration
                };

                const paystackSubAccount = await createSubAccount({
                    businessName: req.currentBusiness.name,
                    accountNumber: accountData.accountNumber,
                    bankCode: accountData.bankCode
                })

                if (paystackSubAccount.error) {
                    log.error('Paystack subaccount error:', paystackSubAccount.data);
                    return response.badRequest(res, { 
                        message: `Failed to create subaccount on Paystack: ${paystackSubAccount.data}` 
                    });
                }
                paystackData.paystackSubAccountCode = paystackSubAccount.data.subaccount_code
            }

            // Create bank account in database
            const newBankAccount = await createBankAccount({
                business: businessId,
                bankCode: accountData.bankCode,
                bankName: accountData.bankName || '',
                accountNumber: accountData.accountNumber,
                accountName: accountData.accountName,
                preferredForRemittance: accountData.preferredForRemittance || false,
                createdBy: userId,
                ...paystackData
            });

            bankAccountId = newBankAccount._id;
        }

        // If this account is preferred, set all others to false
        if (accountData.preferredForRemittance === true && businessSetting.receivingAccounts) {
            businessSetting.receivingAccounts = businessSetting.receivingAccounts.map(acc => ({
                ...acc,
                preferredForRemittance: false
            }));
        }

        // Add new account to receivingAccounts array
        businessSetting.receivingAccounts = businessSetting.receivingAccounts || [];
        businessSetting.receivingAccounts.push({
            account: bankAccountId,
            preferredForRemittance: accountData.preferredForRemittance || false
        });

        // Save updated settings
        const updated = await findAndUpdateBusinessSetting(
            { _id: businessSetting._id },
            { receivingAccounts: businessSetting.receivingAccounts },
            { new: true }
        );

        return response.created(res, updated);
    } catch (error: any) {
        log.error(error);
        return response.error(res, { message: error.message });
    }
};

/**
 * Add a POS device to business settings
 */
export const addPosDeviceHandler = async (req: Request, res: Response) => {
    try {
        const businessId = req.currentBusiness?._id;
        const deviceData = req.body;

        if (!deviceData.deviceName || !deviceData.provider || !deviceData.serialNumber) {
            return response.badRequest(res, { 
                message: 'deviceName, provider, and serialNumber are required' 
            });
        }

        // Get or create business settings
        let businessSetting = await findBusinessSetting({ business: businessId });
        if (!businessSetting) {
            businessSetting = await createBusinessSetting({ 
                business: businessId,
                posDevices: []
            });
        }

        // Initialize posDevices structure if not exists
        if (!businessSetting.posDevices) {
            businessSetting.posDevices =  [];
        }
        if (!businessSetting.posDevices) {
            businessSetting.posDevices = [];
        }

        // Add new device
        businessSetting.posDevices.push({
            deviceName: deviceData.deviceName,
            provider: deviceData.provider,
            serialNumber: deviceData.serialNumber
        });

        // Save updated settings
        const updated = await findAndUpdateBusinessSetting(
            { _id: businessSetting._id },
            { posDevices: businessSetting.posDevices },
            { new: true }
        );

        return response.created(res, updated);
    } catch (error: any) {
        log.error(error);
        return response.error(res, { message: error.message });
    }
};

/**
 * Update tax settings for a business
 */
export const updateTaxSettingsHandler = async (req: Request, res: Response) => {
    try {
        const businessId = req.currentBusiness?._id;
        const taxData = req.body;

        // Get or create business settings
        let businessSetting = await findBusinessSetting({ business: businessId });
        if (!businessSetting) {
            businessSetting = await createBusinessSetting({ 
                business: businessId,
                taxes: taxData
            });
        }

        // Update tax settings
        const updated = await findAndUpdateBusinessSetting(
            { _id: businessSetting._id },
            { taxes: taxData },
            { new: true }
        );

        return response.ok(res, updated);
    } catch (error: any) {
        log.error(error);
        return response.error(res, { message: error.message });
    }
};

/**
 * Update settlement settings for a business
 */
export const updateSettlementSettingsHandler = async (req: Request, res: Response) => {
    try {
        const businessId = req.currentBusiness?._id;
        const settlementData = req.body;

        if (!settlementData.preferred || !['next-working-day', 'on-demand', 'instant'].includes(settlementData.preferred)) {
            return response.badRequest(res, { 
                message: 'preferred must be one of: next-working-day, on-demand, instant' 
            });
        }

        // Get or create business settings
        let businessSetting = await findBusinessSetting({ business: businessId });
        if (!businessSetting) {
            businessSetting = await createBusinessSetting({ 
                business: businessId,
                settlements: settlementData
            });
        }

        // Update settlement settings
        const updated = await findAndUpdateBusinessSetting(
            { _id: businessSetting._id },
            { settlements: settlementData },
            { new: true }
        );

        return response.ok(res, updated);
    } catch (error: any) {
        log.error(error);
        return response.error(res, { message: error.message });
    }
};

/**
 * Update review settings for a business
 */
export const updateReviewSettingsHandler = async (req: Request, res: Response) => {
    try {
        const businessId = req.currentBusiness?._id;
        const reviewData = req.body;

        // Get or create business settings
        let businessSetting = await findBusinessSetting({ business: businessId });
        if (!businessSetting) {
            businessSetting = await createBusinessSetting({ 
                business: businessId,
                reviews: reviewData
            });
        }

        // Update review settings
        const updated = await findAndUpdateBusinessSetting(
            { _id: businessSetting._id },
            { reviews: reviewData },
            { new: true }
        );

        return response.ok(res, updated);
    } catch (error: any) {
        log.error(error);
        return response.error(res, { message: error.message });
    }
};

/**
 * Get business settings
 */
export const findBusinessSettingHandler = async (req: Request, res: Response) => {
    try {
        const queryObject: any = req.query;
        let expand = queryObject.expand || null
        const business = await findBusiness({ subdomain: req.businessSubdomain });
        
        if (!business) {
            return response.notFound(res, { message: 'business not found' });
        }

        const businessSetting = await findBusinessSetting({ business: business._id }, expand);

        if (!businessSetting) {
            return response.notFound(res, { message: 'business setting not found' });
        }

        return response.ok(res, { ...businessSetting, storeDetails: business });
    } catch (error: any) {
        log.error(error);
        return response.error(res, error);
    }
};