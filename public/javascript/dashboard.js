document.addEventListener('DOMContentLoaded', function() {

    const toggler = document.getElementById('toggler');
    
	toggler.addEventListener('click', function() {
		toggleSidebar();
	});

    const sidebar = document.getElementById('l-sidebar');
	const wrapper = document.getElementById('wrapper');
	const navbar = document.getElementById('top-navbar');

    sidebar.classList.toggle('no-transition');
    wrapper.classList.toggle('no-transition');
    navbar.classList.toggle('no-transition');
});

/* sidebar */
function toggleSidebar() {

	const sidebar = document.getElementById('l-sidebar');
	const wrapper = document.getElementById('wrapper');
	const navbar = document.getElementById('top-navbar');

    sidebar.classList.toggle('sidebar-active');
	wrapper.classList.toggle('body-padding');
	navbar.classList.toggle('body-padding');
}

/* Utils */
function getRoleName(role) {

    const roles = {
        'candidate': 'Candidat',
        'recruiter': 'Recruteur',
        'admin': 'Administrateur'
    }

    return role in roles ? roles[role] : undefined;
}

function getStatusName(status) {
    
    const statuses = {
        'active': 'Actif',
        'inactive': 'Inactif',
        'accepted': 'Accepté',
        'refused': 'Refusé',
        'pending': 'Attente'
    }

    return status in statuses ? statuses[status] : undefined;
}