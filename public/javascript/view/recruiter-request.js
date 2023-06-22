/* Recruiter requests table. */
function initRecruiterRequestTable(url) {

    window.requestInProgess = false;

    const table = document.getElementById("recruiter-requests-table");
    const rows = table.querySelectorAll("table tbody tr");

    for (let row of rows) setActions(url, row);
}

function setActions(url, row) {

    const candidate = row.dataset.candidate;
    const organization = row.dataset.organization;

    const actionCell = row.getElementsByClassName("cell-edit")[0];

    if(!actionCell) return;

    const acceptAction = actionCell.getElementsByClassName("action-accept")[0];
    const refuseAction = actionCell.getElementsByClassName("action-refuse")[0];
    const deleteAction = actionCell.getElementsByClassName("action-delete")[0];

    // Accept request action.
    if (acceptAction !== undefined) {
        setChangeStatusAction(
            url,
            row,
            acceptAction,
            candidate,
            organization,
            "accepted"
        );
    }
    
    // Refuse request action.
    if (refuseAction !== undefined) {
        setChangeStatusAction(
            url,
            row,
            refuseAction,
            candidate,
            organization,
            "refused"
        );
    }

    // Delete request action.
    setDeleteAction(url, row, deleteAction, candidate, organization);
}

function setChangeStatusAction(url, row, element, candidate, organization, status) {

    element.addEventListener("click", function (event) {

        // If a request is currently in progress, do not send another one.
        if (window.requestInProgess) {
            event.preventDefault();
            return;
        }

        window.requestInProgess = true;

        // Showing toast messages.
        clearToasts();
        showToast("Requête en cours...");

        // Building request.
        const headers = { "Content-Type": "application/json" };
        const body = JSON.stringify({
            candidate: candidate,
            organization: organization,
            status: status,
        });

        // Sending request.
        fetch(url, { method: "PATCH", headers: headers, body: body })
            .then(response =>  response.json().then(data => ({response: response, body: data})))
            .then((data) => {

                // Showing response.
                showToast(data.body.message);

                if(data.response.ok) {

                    const newStatus = data.body.status;

                    // Updating status in table row.
                    const statusName = getStatusName(newStatus);

                    const statusElement = row.querySelector(".cell-status .status");
                    statusElement.dataset.status = newStatus;
                    statusElement.innerHTML = statusName;

                    // Removing actions as the request has been handled.
                    const actions = row.querySelectorAll(".action-accept, .action-refuse");

                    for(let action of actions) action.remove();
                }

            }).catch((error) => {

                console.error(error);

                // Showing response.
                showToast("Une erreur est survenue.");
            })
            .finally(() => {
                window.requestInProgess = false;
            });
    });
}

function setDeleteAction(url, row, element, candidate, organization) {

    element.addEventListener("click", function () {

        // If a request is currently in progress, do not send another one.
        if (window.requestInProgess) return;

        window.requestInProgess = true;

        // Showing toasts messages.
        clearToasts();
        showToast("Requête en cours...");

        // Building request.
        const headers = { "Content-Type": "application/json" };
        const body = JSON.stringify({
            candidate: candidate,
            organization: organization,
        });

        // Sending request.
        promise = fetch(url, { method: "DELETE", headers: headers, body: body })
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