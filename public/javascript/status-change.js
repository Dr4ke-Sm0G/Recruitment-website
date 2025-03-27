function initChangeStatusButton(url) {

    const button = document.getElementById('status-change');

    button.addEventListener('click', function(event) {

        // If a request is currently in progress, do not send another one.
        if(requestInProgress) {
            event.preventDefault();
            return;
        }

        window.requestInProgess = true;

        // Showing toast messages.
        clearToasts();
        showToast("Requête en cours...");

        // Determining status depending on the current one.
        const status = button.classList.contains('enable') ? 'active' : 'inactive';

        // Building request.
        const headers = { "Content-Type": "application/json" };
        const body = JSON.stringify({ status: status });

        fetch(url, { method: 'PATCH', headers: headers, body: body })
        .then(response => response.json())
        .then(data => {

            // Modifying button text and appearance.
            button.classList.toggle('enable');
            button.classList.toggle('disable');

            const text = button.classList.contains('enable') ? 'Activer' : 'Désactiver';
            button.firstChild.data = text;

            // Upadting status container.
            updateStatusDisplay(status);

            // Showing response toast.
            showToast(data.message);

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