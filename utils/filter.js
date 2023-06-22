// Allowed operators and their SQL equivalent.
const OPERATORS = {
    "eq": "=",
    "le": "<=",
    "lt": "<",
    "ge": ">=",
    "gt": ">",
    "contains": "like"
}

module.exports = {

    getFilterOperator: function(type) {
        return OPERATORS[type];
    },

    getOperatorFilter: function(operator) {
        return Object.keys(OPERATORS).find(key => OPERATORS[key] === operator);
    },

    // Parsing filters to an intermediate representation.
    parseFilterQuery: function(query, allowedFilters) {

        const filters = [];

        for(let param of Object.keys(query)) {

            // Checking that the filter is in the correct format.
            if(typeof query[param] !== 'object') continue;

            // Checking that the filter is allowed.
            if(!allowedFilters.includes(param)) continue;

            const obj = query[param];

            for(let key of Object.keys(obj)) {

                const value = obj[key];
                const operator = this.getFilterOperator(key.substring(1));

                // Case in which no oprator has been provided.
                if(!operator) continue;

                // Building the interdimate representation and adding the filter to the list.
                filters.push({ name: param, operator: operator, value: value });
            }
        }

        return filters;
    },

    // Creating a filter query from the intermediate representation.
    createFilterQuery: function(filters, allowedFilters) {

        const params = [];

        for(let filter of filters) {

            // Checking that the filter is allowed.
            if(!allowedFilters.includes(filter.name)) continue;

            let type = this.getOperatorFilter(filter.operator);
            let value = encodeURIComponent(filter.value);

            // Case in which operator or value is not provided.
            if(!type || !value) continue;

            params.push(`${filter.name}[:${type}]=${value}`);
        }

        return params.join("&");
    }
}