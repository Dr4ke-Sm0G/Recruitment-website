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

            fetch(url, { method: "PATCH", headers: headers, body: body })
            .then((response) => response.json())
            .then(data => {

                // Showing response.
                showToast(data.message);

                // Removing request from table.
                updateChangeRoleButton(data.type);
            })
            .catch((error) => {

                console.log(error);

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
    const menu = dropdown.querySelector('.dropdown-menu li');
    const button = dropdown.getElementsByTagName('button')[0];

    button.firstChild.data = roleName;

    menu.dataset.type = type !== 'admin' ? 'admin' : 'candidate';
    menu.innerHTML = 'Passer ' + getRoleName(menu.dataset.type);
}