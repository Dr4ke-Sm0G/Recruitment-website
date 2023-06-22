document.addEventListener('DOMContentLoaded', function() {

    window.requestInProgress = false;

    const form = document.getElementById('application-form');
    const url = form.action;

    const buttons = document.querySelectorAll('.application-action .status-change');

    for(let button of buttons) { initChangeStatusButton(button, url); }

    initAttachementButton();
});

function initChangeStatusButton(button, url) {

    const actionContainer = document.querySelector('.application-action');

    button.addEventListener('click', function(event) {

        // If a request is currently in progress, do not send another one.
        if(requestInProgress) {
            event.preventDefault();
            return;
        }

        window.requestInProgress = true;

        // Showing toast messages.
        clearToasts();
        showToast("Requête en cours...");

        // Determining status depending on the current one.
        const status = button.dataset.status;

        // Building request.
        const headers = { "Content-Type": "application/json" };
        const body = JSON.stringify({ status: status });

        fetch(url, { method: 'PATCH', headers: headers, body: body })
        .then(response =>  response.json().then(data => ({response: response, body: data})))
        .then(data => {

            if(data.response.ok) {

                // Removing buttons.
                actionContainer.remove();
    
                // Upadting status container.
                updateStatusDisplay(status);
            }

            // Showing response toast.
            showToast(data.body.message);

        }).catch(error => {

            console.log(error);

            // Showing response toast.
            showToast("Une erreur est survenue.");

        }).finally(() => {

            window.requestInProgress = false;
        });
    });
}

function updateStatusDisplay (status) {
        
    const elements = document.getElementsByClassName('status');
    const statusText = getStatusName(status);

    for(let element of elements) {
        element.dataset.status = status;
        element.firstChild.data = statusText;
    }
}

function initAttachementButton() {

    const button = document.getElementById('attachements');
    const modal = new bootstrap.Modal(document.getElementById('attachements-modal'));

    button.addEventListener('click', function() {

        modal.show();
    });
}