import { 
    Express,
    Request,
    Response 
} from 'express';
import { requiresUser, validateRequest } from './middleware';
import requiresAdministrator from './middleware/requiresAdministrator';
import { changePasswordSchema, createUserSchema, createUserSessionSchema, getUserDetailsSchema } from './schema/user.schema';
import { adminUpdateUserHandler, changePasswordHandler, confirmEmailHandler, createUserHandler, deleteUserHandler, getAllUsersHandler, getUserDetailsHandler, getUserProfileHandler, resendEmailConfirmationHandler, resetUserPassword, signupHandler, updateUserHandler } from './controller/user.controller';
import { businessSetupCompletionHandler, createBusinessHandler, getBusinessDetailsHandler, getBusinessesHandler, getCurrentBusinessHandler, updateBusinessHandler, validateSubdomainHandler } from './controller/business.controller';
import { createUserSessionHandler, invalidateUserSessionHandler } from './controller/session.controller';
import requiresPermissions from './middleware/requiresPermissions';
import { rejectForbiddenUserFields } from './middleware/rejectForbiddenUserFields';
import { exportReportPDF, statsHandler } from './controller/stats.controller';
import { upload } from './service/integrations/cloudinary.service';
import { newFileHandler, newFilesHandler } from './controller/file.controller';
import { createItemHandler, deleteItemHandler, getItemHandler, getItemsHandler } from './controller/item.controller';
import { updateItemHandler } from './controller/item-variant.controller';
import { createCategoryHandler, deleteCategoryHandler, getCategoriesHandler } from './controller/category.controller';
import { createMenuHandler, deleteMenuHandler, getMenuHandler, getMenusHandler, getPublicMenuHandler, updateMenuHandler } from './controller/menu.controller';
import { createMenuSchema } from './schema/menu.schema';
import { createOrderSchema } from './schema/order.schema';
import { addToOrderHandler, createOrderHandler, deleteOrderHandler, getOrderHandler, getOrdersHandler, publicGetOrderHandler, removeFromOrderHandler, updateOrderHandler } from './controller/order.controller';
import { exportTransactionsToCsvHandler, getAllTransactionsHandler } from './controller/transaction.controller';
import { initializePaymentHandler, receivePaymentHandler, verifyTransactionHandler } from './controller/payments.controller';
import { confirmationSchema, resendConfirmationSchema } from './schema/confirmation-code.schema';
import { getPermissionsHandler } from './controller/permission.controller';
import { createRoleHandler, getRoleHandler, getRolesHandler, updateRoleHandler } from './controller/role.controller';
import { createSubscriptionPlanSchema, getSubscriptionPlanSchema } from './schema/subscription-plan.schema';
import { requestPasswordResetHandler, resetPasswordHandler } from './controller/password-reset.controller';
import { resetPasswordSchema, resetRequestSchema } from './schema/password-reset.schema';
import { createBusinessSchema, getBusinessSchema } from './schema/business.schema';
import { 
    addPosDeviceHandler, 
    addReceivingAccountHandler, 
    findBusinessSettingHandler, 
    removePosDeviceHandler, 
    removeReceivingAccountHandler, 
    updateReviewSettingsHandler, 
    updateSettlementSettingsHandler, 
    updateTaxSettingsHandler 
} from './controller/business-setting.controller';
import { findBusinessSetting } from './service/business-setting.service';
import { createMultipleTablesHandler, createTableHandler, getTableHandler, getTablesHandler, updateTableHandler } from './controller/table.controller';
import { bulkCreateTableSchema, createTableSchema, getTableSchema } from './schema/table.schema';
import { deductFromCartHandler, getCartsHandler, getClientCartHandler, sendToCartHandler } from './controller/cart.controller';
import { checkoutCartSchema, deductFromCartSchema, sendToCartSchema } from './schema/cart.schema';
import { checkoutHandler } from './controller/checkout.controller';
import { listBanksHandler, validateAccountNumberHandler } from './controller/utility.controller';

export default function(app: Express) {
    app.get('/ping', (req: Request, res: Response) => res.sendStatus(200))

    app.get("/utilities/business-setup-progress",
        requiresUser,
        businessSetupCompletionHandler
    )

    app.get("/utilities/banks",
        requiresUser,
        listBanksHandler
    )

    app.post("/utilities/validate-account",
        requiresUser,
        validateAccountNumberHandler
    )

    app.post('/onboarding/signup', 
        // checkUserType,
        validateRequest(createUserSchema), 
        signupHandler
    )
    
        // Confirm email
    app.post('/onboarding/email-confirmation/resend', 
        validateRequest(resendConfirmationSchema), 
        resendEmailConfirmationHandler
    )

    // Confirm email
    app.post('/onboarding/email-confirmation', 
        validateRequest(confirmationSchema),
        confirmEmailHandler
    )

    app.get('/validate-subdomain/:subdomain', 
        validateSubdomainHandler
    )

    app.post('/reset-password/:user', 
        requiresUser,
        requiresAdministrator,
        resetUserPassword
    )

    app.post('/businesses', 
        // requiresUser,
        // requiresAdministrator,
        validateRequest(createBusinessSchema), 
        createBusinessHandler
    )

    app.get('/businesses', 
        requiresAdministrator,
        requiresPermissions(['*', 'stores.*', 'stores.read']),
        getBusinessesHandler
    )

    // app.get('/stores/qr-codes/generate', 
    //     requiresAdministrator,
    //     requiresPermissions(['*', 'stores.*', 'stores.create']),
    //     generateStoreQrCodesHandler
    // )

    app.get('/business', 
        getCurrentBusinessHandler
    )

    app.get('/business/:businessId', 
        requiresUser,
        requiresAdministrator,
        requiresPermissions(['*', 'businesses.*', 'businesses.read']),
        validateRequest(getBusinessSchema), 
        getBusinessDetailsHandler
    )

    app.patch('/businesses/:businessId', 
        requiresUser,
        requiresAdministrator,
        requiresPermissions(['*', 'businesses.*', 'businesses.update']),
        validateRequest(getBusinessSchema), 
        updateBusinessHandler
    )

    // Business Settings Routes
    app.get('/settings', 
        findBusinessSettingHandler
    )

    app.post('/settings/receiving-accounts', 
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.settings.*', 'business.settings.update']),
        addReceivingAccountHandler
    )

    app.delete('/settings/receiving-accounts/:settingsAccountId', 
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.settings.*', 'business.settings.update']),
        removeReceivingAccountHandler
    )

    app.post('/settings/pos-devices', 
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.settings.*', 'business.settings.update']),
        addPosDeviceHandler
    )

    app.delete('/settings/pos-devices/:deviceId', 
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.settings.*', 'business.settings.update']),
        removePosDeviceHandler
    )

    app.patch('/settings/taxes', 
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.settings.*', 'business.settings.update']),
        updateTaxSettingsHandler
    )

    app.patch('/settings/settlements', 
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.settings.*', 'business.settings.update']),
        updateSettlementSettingsHandler
    )

    app.patch('/settings/reviews', 
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.settings.*', 'business.settings.update']),
        updateReviewSettingsHandler
    )

    // Login
    app.post('/auth/sessions', 
        validateRequest(createUserSessionSchema), 
        createUserSessionHandler
    )

//     // Get user sessions
//     app.get('/auth/sessions', 
//         requiresUser, 
//         getUserSessionsHandler
//     )

    // logout
    app.delete('/auth/sessions', 
        requiresUser, 
        invalidateUserSessionHandler
    )

    // confi

//     // Get user sessions
//     app.get('/user/sessions', 
//         requiresUser, 
//         getUserSessionsHandler
//     )

//     // Get user profile
    app.get('/user/profile', 
        requiresUser, 
        getUserProfileHandler
    )

    // Update user profile
    app.patch('/user/profile', 
        requiresUser, 
        rejectForbiddenUserFields, 
        updateUserHandler
    )

    // Update user profile
    app.patch('/user/profile/:userId', 
        requiresUser, 
        requiresPermissions(['*', 'business.*', 'business.users.*', 'business.users.update']),
        validateRequest(getUserDetailsSchema),
        adminUpdateUserHandler
    )

//  Get all users 
    app.post('/users/create-user', 
        // checkUserType,
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.users.*', 'business.users.create']),
        validateRequest(createUserSchema), 
        createUserHandler
    )

    app.get('/users/all', 
        requiresUser, 
        requiresPermissions(['*', 'business.*', 'business.users.*', 'business.users.read']),
        getAllUsersHandler
    )

//  Get user account details by admin
    app.get('/users/profile/:userId', 
        requiresUser, 
        requiresPermissions(['*', 'business.*', 'business.users.*', 'business.users.read']),
        validateRequest(getUserDetailsSchema),
        getUserDetailsHandler
    )

//     Delete user account
    app.delete('/users/delete/:userId', 
        requiresUser, 
        requiresAdministrator,
        requiresPermissions(['can_manage_users']),
        validateRequest(getUserDetailsSchema),
        deleteUserHandler
    )

    app.post('/auth/password-reset/request', 
        validateRequest(resetRequestSchema),
        requestPasswordResetHandler
    )

    app.post('/auth/password-reset', 
        validateRequest(resetPasswordSchema),
        resetPasswordHandler
    )

    app.post('/user/change-password', 
        requiresUser,
        validateRequest(changePasswordSchema),
        changePasswordHandler
    )

    app.get('/dashboard/stats', 
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.reports.*']),
        statsHandler
    )

    // app.get('/dashboard/stats/e-commerce', 
    //     requiresUser,
    //     requiresPermissions(['*', 'business.*', 'business.stats.read']),
    //     eCommerceStatsHandler
    // )

    // app.get('/dashboard/stats/reviews', 
    //     requiresUser,
    //     requiresPermissions(['*', 'business.*', 'business.stats.read']),
    //     reviewsStatsHandler
    // )
    
    app.get('/dashboard/stats/export/pdf', 
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.stats.read']),
        exportReportPDF
    )

    // Categories
    // create category
    app.post('/categories',
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.item-categories.*', 'business.item-categories.create']),
        createCategoryHandler
    )
    
    // get all categories
    app.get('/categories/:businessId',
        // requiresUser,
        // requiresAdministrator,
        // requiresPermissions(['can_manage_items']),
        getCategoriesHandler
    )

    // get all categories
    app.delete('/categories/:categoryId', 
        requiresUser,
        requiresAdministrator,
        requiresPermissions(['can_manage_items']),
        deleteCategoryHandler
    )
    
    // Items
    // create item
    app.post('/items',
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.items.*', 'business.items.create']),
        // validateRequest(createItemSchema),
        createItemHandler
    )
    
    // fetch items
    app.get('/items',
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.items.*', 'business.items.read']),
        getItemsHandler
    )

    // fetch item details
    app.get('/items/:itemId/:businessId',
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.items.*', 'business.items.read']),
        getItemHandler
    )

    // update items
    app.patch('/items/:itemId',
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.items.*', 'business.items.update']),
        updateItemHandler
    )

    // delete items
    app.delete('/items/:itemId',
        requiresUser,
        requiresAdministrator,
        requiresPermissions(['*', 'business.*', 'business.items.*', 'business.items.delete']),
        deleteItemHandler
    )

    // Tables
    // create table
    app.post('/tables',
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.tables.*', 'business.tables.create']),
        validateRequest(createTableSchema),
        createTableHandler
    )

    // bulk create tables
    app.post('/tables/bulk/create',
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.tables.*', 'business.tables.create']),
        validateRequest(bulkCreateTableSchema),
        createMultipleTablesHandler
    )

    // fetch menus
    app.get('/tables',
        requiresUser,
        getTablesHandler
    )

    app.get('/tables/:tableId',
        validateRequest(getTableSchema),
        getTableHandler
    )

    app.patch('/tables/:tableId',
        requiresUser,
        requiresPermissions(['*', "business.*", 'business.tables.*', 'business.tables.update']),
        updateTableHandler
    )

    app.delete('/tables/:tableId',
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.tables.*', 'business.tables.delete'])
    )

    // SHOPPING CARTS
    
    // fetch store shopping carts
    app.get('/shopping-carts/:storeId',
        requiresUser,
        requiresAdministrator,
        requiresPermissions(['can_manage_shopping_carts']),
        getCartsHandler
    )
    
    // fetch store shopping carts
    app.get('/shopping-carts/:businessId/:clientId',
        getClientCartHandler
    )
    
    // send item to shopping cart
    app.post('/shopping-carts/add/:businessId',
        validateRequest(sendToCartSchema),
        sendToCartHandler
    )
    
    // send item to shopping cart
    app.post('/shopping-carts/deduct/:businessId',
        validateRequest(deductFromCartSchema),
        deductFromCartHandler
    )

    // checkout shopping carts
    app.post('/shopping-carts/:cartId/checkout',
        validateRequest(checkoutCartSchema),
        checkoutHandler
    )

    // Menus
    // create menu
    app.post('/menus',
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.items.*', 'business.items.create']),
        validateRequest(createMenuSchema),
        createMenuHandler
    )
    
    // fetch business public menu
    app.get('/menus/public/:storeId',
        requiresAdministrator,
        requiresPermissions(['*', 'business.*', 'business.menus.*', 'menus.read']),
        getPublicMenuHandler
    )

    // fetch business public menu
    // app.get('/public-menu',
    //     getCurrentStorePublicMenuHandler
    // )
    
    // fetch menus
    app.get('/menus',
        requiresUser,
        getMenusHandler
    )

    // fetch menu details
    app.get('/menus/:menuId',
        // requiresUser,
        getMenuHandler
    )

    // update menu
    app.patch('/menus/:menuId',
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.pice-cards.*', 'business.price-cards.update']),
        updateMenuHandler
    )

    // delete menu
    app.delete('/menus/:menuId',
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.pice-cards.*', 'business.price-cards.delete']),
        deleteMenuHandler
    )
    
    /**
     * ORDERS
     */

    // create order
    app.post('/orders',
        requiresUser,
        // requiresAdministrator,
        requiresPermissions(['*', 'business.*', 'business.orders.*', 'business.orders.create']),
        validateRequest(createOrderSchema),
        createOrderHandler
    )
    
    // fetch orders
    // app.get('/orders',
    //     requiresUser,
    //     requiresPermissions(['*', 'business.*', 'business.orders.*', 'business.orders.read']),
    //     getOrdersByStoreHandler
    // )
    
    // fetch orders
    app.get('/orders',
        requiresUser,
        // requiresAdministrator,
        requiresPermissions(['*', 'business.*', 'business.orders.*', 'business.orders.read']),
        getOrdersHandler
    )

    // fetch order details
    app.get('/orders/details/:orderId',
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.orders.*', 'business.orders.read']),
        getOrderHandler
    )

    // fetch public order details
    app.get('/public/orders/details/:orderRef',
        publicGetOrderHandler
    )

    // add to order
    app.patch('/orders/:orderId/add-item',
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.orders.*', 'business.orders.update']),
        addToOrderHandler
    )

    // remove from order
    app.patch('/orders/:orderId/remove-item',
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.orders.*', 'business.orders.update']),
        removeFromOrderHandler
    )

    // update order
    app.patch('/orders/:orderId',
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.orders.*', 'business.orders.update']),
        updateOrderHandler
    )

    // delete order
    app.delete('/orders/:orderId',
        requiresUser,
        requiresAdministrator,
        requiresPermissions(['*', 'business.*', 'business.orders.*', 'business.orders.delete']),
        deleteOrderHandler
    )

    /**
     * TRANSACTIONS
     */
    app.post('/transactions',
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.transactions.*', 'business.transactions.create']),
        receivePaymentHandler
    )

    app.get('/transactions/export/csv',
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.transactions.*', 'business.transactions.export']),
        exportTransactionsToCsvHandler
    )

    app.get('/transactions',
        requiresUser,
        requiresPermissions(['*', 'business.*', 'business.transactions.*', 'business.transactions.read']),
        getAllTransactionsHandler
    )

    // Permissions
    app.get('/permissions', 
        requiresUser,
        getPermissionsHandler
    )

    // Roles
    app.post('/roles', 
        requiresUser,
        createRoleHandler
    )

    app.get('/roles', 
        requiresUser,
        getRolesHandler
    )

    app.get('/roles/:roleId', 
        requiresUser,
        getRoleHandler
    )

    app.patch('/roles/:roleId', 
        requiresUser,
        updateRoleHandler
    )

    app.post('/initialize-purchase',
        initializePaymentHandler
    )

    app.get('/verify-payment/:paystackReference',
        verifyTransactionHandler
    )

    // UPLOAD FILE
    app.post("/files/new", 
        requiresUser,
        upload.single("file"),
        newFileHandler
    )
    
    // UPLOAD MULTIPLE FILES
    app.post("/files/new/multiple", 
        requiresUser,
        upload.array("files", 10),
        newFilesHandler
    )


}


