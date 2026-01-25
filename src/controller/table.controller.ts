import { Request, Response } from "express";
import { get } from "lodash";
import * as response from '../responses'
import { getJsDate, slugify } from "../utils/utils";
import { createAuditLog } from "../service/audit-log.service";
import { createTable, findAndUpdateTable, findTable, findTables } from "../service/table.service";
import { sendQrCodeJob } from "../queues/qrcode.queue";

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
    return response.ok(res, table)
}

export async function updateTableHandler (req: Request, res: Response) {
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
}

export async function deleteTableHandler (req: Request, res: Response) {
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
}