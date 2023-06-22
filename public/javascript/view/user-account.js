document.addEventListener('DOMContentLoaded', function() {

    window.requestInProgress = false;
    
    initChangeRoleButtons();
    initChangeStatusButton(window.location.href);
});

function initChangeRoleButtons() {

    const changeRoleButtons = document.getElementsByClassName('change-role');

    for(let button of changeRoleButtons) {

        button.addEventListener('click', function(event) {

            // If a request is currently in progress, do not send another one.
            if(window.requestInProgress) {
                event.preventDefault();
                return;
            }

            window.requestInProgress = true;

            // Role that button allows to change.
            const type = button.dataset.type;

            // Showing toasts messages.
            clearToasts();
            showToast("Requête en cours...");

            // Building request.
            const url = window.location.href;
            const headers = { "Content-Type": "application/json" };
            const body = JSON.stringify({ 'type': type });

            fetch(url, { method: 'PATCH', headers: headers, body: body })
            .then(response => response.json().then(data => ({response: response, body: data})))
            .then(data => {

                if(data.response.ok) {

                    // Upadating change role button.
                    updateChangeRoleButton(data.body.type);

                    // Removing the 'show organization' element, has an update of the role
                    // necessarily leads to the organization beeing removed from the user account.
                    const element = document.getElementById('user-organization');

                    if(element) element.remove();
                }

                // Showing response.
                showToast(data.body.message);

            }).catch((error) => {

                console.error(error);

                // Showing response.
                showToast("Une erreur est survenue.");
            })
            .finally(() => {
                window.requestInProgress = false;
            });
        });
    }
}

function updateChangeRoleButton(type) {

    const roleName = getRoleName(type);
    const dropdown = document.getElementById('role-dropdown');

    const menu = dropdown.querySelector('.dropdown-menu');
    menu.dataset.type = type !== 'admin' ? 'admin' : 'candidate';

    menu.innerHTML = `<li class="change-role dropdown-item" data-type="${menu.dataset.type}">
        Passer ${getRoleName(menu.dataset.type)} 
    </li>`;

    const button = dropdown.getElementsByTagName('button')[0];
    button.firstChild.data = roleName;

    initChangeRoleButtons();
}