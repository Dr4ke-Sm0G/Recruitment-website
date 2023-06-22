const moment = require('moment');

const DEFAULT_PAGINATION_LIMIT = 15;

module.exports = {

    getRoleName: function(role) {

        const roles = {
            'candidate': 'Candidat',
            'recruiter': 'Recruteur',
            'admin': 'Administrateur'
        }
    
        return role in roles ? roles[role] : undefined;
    },
    
    getStatusName: function(status) {
    
        const statuses = {
            'active': 'Actif',
            'inactive': 'Inactif',
            'accepted': 'Accepté',
            'refused': 'Refusé',
            'pending': 'Attente',
            'editing': 'Edition',
            'published': 'Publié',
            'expired': 'Expiré'
        }
    
        return status in statuses ? statuses[status] : undefined;
    },

    getAttachementTypeName: function(type) {

        const types = {
            'CV': 'CV',
            'MotivationLetter': 'Lettre de motivation',
            'Other': 'Autre document'
        }

        return type in types ? types[type] : undefined;
    },

    isValidAttachementType: function(type) {
        const types = ['CV', 'MotivationLetter', 'Other'];
        return types.includes(type);
    },

    checkAttachementTypes: function(types) {
        return types.every(type => function() {
            return this.isValidAttachmentType(type);
        });
    },

    isValidOrganizationStatus: function(status) {
        const statuses = ['active', 'inactive'];
        return statuses.includes(status);
    },

    getOrganizationTypes: function(types) {
        return ['association', 'sarl', 'eurl', 'sasu'];
    },

    isValidOrganizationType: function(type) {
        const types = ['association', 'sarl', 'eurl', 'sasu'];
        return types.includes(type);
    },

    isValidApplicationStatus: function(status) {
        const statuses = ['accepted', 'refused'];
        return statuses.includes(status);
    },

    isValidRecruteurRequestStatus: function(status) {
        const statuses = ['accepted', 'refused'];
        return statuses.includes(status);
    },

    isValidAccountStatus: function(status) {
        const statuses = ['active', 'inactive'];
        return statuses.includes(status);
    },

    isValidAccountType: function(status) {
        const types = ['candidate', 'recruiter', 'admin'];
        return types.includes(status);
    },

    isDateInFuture: function(date) {

        if (!moment(date).isAfter()) {
          throw new Error('La date doit être dans le futur.');
        }

        return true;
    },

    calculatePages: function(currentPage, totalPages) {

        const pagesToShow = 5;
        const halfPagesToShow = Math.floor(pagesToShow / 2);

        let startPage = currentPage - halfPagesToShow;

        if (startPage < 1) {
            startPage = 1;
        }

        let endPage = startPage + pagesToShow - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = endPage - pagesToShow + 1;

            if (startPage < 1) {
                startPage = 1;
            }
        }
        const pageNumbers = [];

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return pageNumbers;
    },

    buildPagination: function(currentPage, limit, count) {

        if(isNaN(limit) || isNaN(currentPage)) {
            currentPage = 1;
            limit = DEFAULT_PAGINATION_LIMIT;
        } else {
            limit = parseInt(limit);
            currentPage = parseInt(currentPage);
        }

        // Dealing with limits.
        if(limit < 5) limit = 5;
        else if(limit > 20) limit = DEFAULT_PAGINATION_LIMIT;

        totalNbPages = Math.ceil(count / limit);
    
        if(currentPage <= 0) currentPage = 1;
        else if(currentPage > totalNbPages) currentPage = totalNbPages;

        // Building pagination.
        const offset = (currentPage - 1) * limit;
        const previous = currentPage - 1 > 0 ? currentPage - 1 : undefined;
        const next = currentPage + 1 <= totalNbPages ? currentPage + 1 : undefined;
        const pages = this.calculatePages(currentPage, totalNbPages);

        return pagination = {
            'limit': limit,
            'count': count,
            'offset': offset,
            'current': currentPage,
            'previous': previous,
            'next': next,
            'pages': pages
        };
    },

    buildPaginationURLs: function(url, pagination, params) {

        const queryString = params.join('&');

        // Previous page's url.
        pagination.previousURL = pagination.previous ? `${url}?page=${pagination.previous}&limit=${pagination.limit}&${queryString}` : url;

        // Next page's url.
        pagination.nextURL = pagination.next ? `${url}?page=${pagination.next}&limit=${pagination.limit}&${queryString}` : url;
        
        // Other pages's url.
        pagination.pagesURL = [];

        pagination.pages.forEach(page => {

            // This enables to keep both the page number and the url.
            // Useful when using it.
            const obj = {
                'number': page,
                'url': `${url}?page=${page}&limit=${pagination.limit}&${queryString}`
            }

            pagination.pagesURL.push(obj);
        });

        return pagination;
    }
}