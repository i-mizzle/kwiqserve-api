import { Request, Response } from "express";
import { get } from "lodash";
import * as response from '../responses'
import { getJsDate, slugify } from "../utils/utils";
import { createAuditLog } from "../service/audit-log.service";
import { createTable, findAndUpdateTable, findTable, findTables } from "../service/table.service";
import { sendQrCodeJob } from "../queues/qrcode.queue";
import { findOrders } from "../service/order.service";

const parseTableFilters = (query: any) => {
    const { business, searchTerm, menu, minDateCreated, maxDateCreated } = query; 

    const filters: any = {}; 

    // if (name) {
    //     filters.name = { $regex: name, $options: "i" }; 
    // } 

    if (searchTerm && searchTerm !== '') {
        filters.$or = [
            { name: { $regex: searchTerm, $options: "i" } },
            // { description: { $regex: searchTerm, $options: "i" } },
            { tableCode: { $regex: searchTerm, $options: "i" } }
        ];
    }

    if (business) {
        filters.business = business
    } 

    if (menu) {
        filters.menu = menu
    } 

    if (minDateCreated && !maxDateCreated) {
        filters.createdAt = { $gte: (getJsDate(minDateCreated)) }; 
    }

    if (maxDateCreated && !minDateCreated) {
        filters.createdAt = { $lte: getJsDate(maxDateCreated) }; 
    }

    if (minDateCreated && maxDateCreated) {
        filters.createdAt = { $gte: getJsDate(minDateCreated), $lte: getJsDate(maxDateCreated) };
    }
  
    return filters

}

export async function createTableHandler (req: Request, res: Response) {
    try {
        const userId = get(req, 'user._id')
        const body = req.body
    
        // const business = 
    
        const table = await createTable({ ...body, ...{createdBy: userId, slug: slugify(body.name), business: req.currentBusiness?._id} })
        // const tableQRCode = 
        await sendQrCodeJob({
            tableId: table._id.toString(),
            data: {
                tableUrl: `https://${req.businessSubdomain}.scanserve.cloud/tables/${table._id}`
            }
        })
        // return res.send(post)
        await createAuditLog({
            actionType: 'create',
            description: `created table ${body.name}`,
            actor: userId,
            item: table._id,
            requestPayload: body,
            responseObject: table
        })
        return response.created(res, table)
    } catch (error:any) {
        return response.error(res, error)
    }
}

export async function createMultipleTablesHandler (req: Request, res: Response) {
    try {
        const userId = get(req, 'user._id')
        const body = req.body

        let tablesCreated: number = 0
        for (let index = 0; index < body.quantity; index++) {  
            const tableNumber: string = (index+1).toString().padStart(4, '0')
            const tableData = {
                name: body.name + ' ' + tableNumber,
                code: `${body.code}-${tableNumber}`,
                business: req.currentBusiness?._id,
                description: body.description,
                menu: body.menu,
                deleted: false,
                createdBy: userId
            }      

            const table = await createTable(tableData)
            // const tableQRCode = 
            sendQrCodeJob({
                tableId: table._id.toString(),
                data: {
                    tableUrl: `https://${req.businessSubdomain}.${process.env.FRONTEND_URL}/tables/${table._id}`
                }
            })
            // return res.send(post)
            await createAuditLog({
                actionType: 'create',
                description: `created table ${body.name} as one of ${body.quantity} tables`,
                actor: userId,
                item: table._id,
                requestPayload: body,
                responseObject: table
            })
        }
        return response.created(res, {message: `${tablesCreated} tables created successfully`})
    } catch (error:any) {
        return response.error(res, error)
    }
}


export const getTablesHandler = async (req: Request, res: Response) => {
    try {
        const queryObject: any = req.query;

        const filters = parseTableFilters(queryObject)
        const resPerPage = +queryObject.perPage || 25; // results per page
        const page = +queryObject.page || 1; // Page 
        let expand = queryObject.expand || null

        if(expand && expand.includes(',')) {
            expand = expand.split(',')
        }
        
        const tables = await findTables({deleted: false, business: req.currentBusiness?._id}, resPerPage, page, expand)

        const responseObject = {
            page,
            perPage: resPerPage,
            total: tables.total,
            tables: tables.data
        }

        return response.ok(res, responseObject)        
    } catch (error:any) {
        return response.error(res, error)
    }
}

export async function getTableHandler (req: Request, res: Response) {
    try {
        const tableId = get(req, 'params.tableId');
        const queryObject: any = req.query;
        let expand = queryObject.expand || null
    
        if(expand && expand.includes(',')) {
            expand = expand.split(',')
        }
        const table = await findTable({ _id: tableId, deleted: false}, expand);
        if(!table) {
            return response.notFound(res, { message: `table was not found` })
        }
        
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Fetch all paid orders for this table
        const allOrdersResult = await findOrders(
            { table: tableId, paymentStatus: 'paid' },
            0,
            0,
            ''
        );

        // Fetch today's paid orders for this table
        const todayOrdersResult = await findOrders(
            { table: tableId, paymentStatus: 'paid', createdAt: { $gte: today, $lt: tomorrow } },
            0,
            0,
            ''
        );

        // Calculate stats
        const allOrdersStats = {
            count: allOrdersResult.orders.length,
            total: allOrdersResult.orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
        };

        const todayOrdersStats = {
            count: todayOrdersResult.orders.length,
            total: todayOrdersResult.orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
        };

        const tableWithStats = {
            ...table.toObject?.() || table,
            orders: {
                today: todayOrdersStats,
                total: allOrdersStats
            }
        };

        return response.ok(res, tableWithStats)
        
    } catch (error:any) {
        return response.error(res, error)
    }
}

export async function updateTableHandler (req: Request, res: Response) {
    try {
        const tableId = get(req, 'params.tableId');
        const userId = get(req, 'user._id');
        const updateQuery = req.body
        const table = await findTable({ _id: tableId }, '');
        if (!table) {
            return response.notFound(res, { message: `table not found` })
        }
    
        const updated = await findAndUpdateTable({ _id: tableId }, updateQuery, {new: true});
        
        await createAuditLog({
            actionType: 'update',
            description: `update table ${table.name}`,
            actor: userId,
            item: tableId,
            requestPayload: {...req.params, ...updateQuery},
            responseObject: {message: 'table updated successfully', table: updated}
        })
        return response.ok(res, {message: 'table updated successfully', table: updated});
        
    } catch (error:any) {
        return response.error(res, error)
    }
}

export async function deleteTableHandler (req: Request, res: Response) {
    try {
        const tableId = get(req, 'params.tableId');
        const userId = get(req, 'user._id');
    
        const table = await findTable({ _id: tableId }, '');
        if (!table) {
            return response.notFound(res, { message: `table not found` })
        }
    
        await findAndUpdateTable({ _id: tableId }, {deleted: true}, {new: true});
        await createAuditLog({
            actionType: 'delete',
            description: `delete table ${table.name}`,
            actor: userId,
            item: tableId,
            requestPayload: req.params,
    
        })
        return response.ok(res, {message: 'table deleted successfully'});
        
    } catch (error:any) {
        return response.error(res, error)
    }
}