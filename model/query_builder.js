function buildDynamicWhere(query, fields, filters) {

    if(!Array.isArray(filters) || filters.length === 0) return;

    // Allowed operators in an SQL statement.
    const allowedOperators = ['<', '<=', '>', '>=', '=', '<>', 'like'];

    // Retrieving valid filters only.
    const validFilters = filters
        .filter(filter => filter.name && filter.operator && filter.value)
        .filter(filter => fields.includes(filter.name))
        .filter(filter => allowedOperators.includes(filter.operator));
    
    // No filter to add.
    if(validFilters.length === 0) return;

    let where = `${query.sql} WHERE `;
    let whereQuery = [];

    for(let filter of validFilters) {

        // Value is not an array.
        if(!Array.isArray(filter.value)) {
            whereQuery.push(`${filter.name} ${filter.operator} ?`);
            continue;
        }

        // Value is an array so we have to handle it as 'OR' statements.
        subqueries = [];

        for(let i = 0; i < filter.value.length; i++) {
            subqueries.push(`${filter.name} ${filter.operator} ?`);
        }

        if(subqueries.length >= 2) {
            whereQuery.push('(' + subqueries.join(' OR ') + ')');
        }
    }

    where = where + whereQuery.join(' AND ');
    query.sql = where;

    // Retrieving values in an array.
    for(let filter of validFilters) {
        query.values.push(filter.operator !== 'like' ? filter.value : `%${filter.value}%`);
    }
        
    query.values = query.values.flat()
}

function buildDynamicOrder(query, fields, orders) {

    if(!Array.isArray(orders) || orders.length === 0) return;

    const validOrders = orders
        .filter(order => order.field && order.type)
        .filter(order => fields.includes(order.field))
        .filter(order => order.type === 'ASC' || order.type === 'DESC');

    // No ordering to add.
    if(validOrders.length === 0) return;

    let sql = query.sql + ' ORDER BY ';
    const orderArray = [];

    for(let order of validOrders) {
        orderArray.push(` ${order.field} ${order.type} `);
    }

    sql += orderArray.join(",");

    query.sql = sql;
}

function buildDynamicLimitOffset(query, limit, offset) {

    // Building limit if set.
    if(limit !== undefined) {
        query.sql += ' LIMIT ?';
        query.values.push(limit);
    }

    // Building offset if set.
    if(offset !== undefined) {
        query.sql += ' OFFSET ?';
        query.values.push(offset);
    }
}

module.exports = { 

    buildDynamicQuery: function(request, fields, filters, orders, limit, offset) {
    
        const query = {'sql': request, 'values': []}

        buildDynamicWhere(query, fields, filters);
        buildDynamicOrder(query, fields, orders);
        buildDynamicLimitOffset(query, limit, offset);

        query.sql = query.sql + ';';

        return query;
    }
};