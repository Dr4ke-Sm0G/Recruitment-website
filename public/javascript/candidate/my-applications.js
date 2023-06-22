document.addEventListener('DOMContentLoaded', function() {

    const table = document.getElementById('applications-table');
    const rows = table.getElementsByClassName('application');

    for(let row of rows) initDeleteButton(row);
});

function initDeleteButton(row) {

    const deleteButton = row.querySelector('.action-delete');

    // Case in which the delete button is not present.
    if(!deleteButton) return;

    deleteButton.addEventListener('click', function(event) {

        event.preventDefault();

        // If a request is currently in progress, do not send another one.
        if (window.requestInProgess) return;

        window.requestInProgess = true;

        // Showing toasts messages.
        clearToasts();
        showToast("Requête en cours...");

        const url = '/candidate/my-applications/' + row.dataset.offerId;

        fetch(url, { method: "DELETE" })
            .then(response =>  response.json().then(data => ({response: response, body: data})))
            .then(data => {

                // Showing response.
                showToast(data.body.message);

                // Removing request from table.
                if(data.response.ok) { row.remove(); }

            })
            .catch((error) => {
                
                console.error(error);

                // Showing response.
                showToast("Une erreur est survenue.");
            })
            .finally(() => {
                window.requestInProgess = false;
            });
    });
}