import { DocumentDefinition, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import Menu, { MenuDocument, MenuItem } from '../model/menu.model';
import { UserDocument } from '../model/user.model';

export interface NewMeuInterface {
    createdBy: UserDocument['_id'];
    name: string;
    description: string
    eCommerceMenu: boolean
    items: MenuItem[];
}

export async function createMenu (input: DocumentDefinition<MenuDocument>) {
    return Menu.create(input)
}

export async function findMenus(
    query: FilterQuery<MenuDocument>,
    perPage: number,
    page: number,
    expand: string,
    options: QueryOptions = { lean: true }
) {
    const total = await Menu.find(query, {}, options).countDocuments()
    let menus = null
    if(perPage===0&&page===0){
        menus = await Menu.find(query, {}, options).populate(expand)
    } else {
        menus = await Menu.find(query, {}, options).populate(expand)
            .sort({ 'createdAt' : -1 })
            .skip((perPage * page) - perPage)
            .limit(perPage);
    }

    return {
        total,
        menus 
    }
}

export async function findMenu(
    query: FilterQuery<MenuDocument>,
    expand?: string,
    options: QueryOptions = { lean: true }
) {
    return Menu.findOne(query, {}, options).populate(expand)
}

export async function findAndUpdateMenu(
    query: FilterQuery<MenuDocument>,
    update: UpdateQuery<MenuDocument>,
    options: QueryOptions
) {
    return Menu.findOneAndUpdate(query, update, options)
}