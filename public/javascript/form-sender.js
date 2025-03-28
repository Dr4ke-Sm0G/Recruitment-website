document.addEventListener('DOMContentLoaded', function() {
    
    const forms = document.getElementsByTagName('form');

    for(let form of forms) { initForm(form); }
});

function initForm(form) {

    form.addEventListener('submit', (event) => {

        // Form data validation.
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
            form.classList.add('was-validated');
            return;
        }

        event.preventDefault();

        form.classList.add('was-validated');

        // Error handling.
        const displayError = message => {

            const error = document.getElementById('submit-error');

            // Displaying error message.
            error.innerHTML = message;
            error.classList.remove('d-none');
        };

        // Sending form data.
        const formData = new FormData(form);

        fetch(form.action, { method: form.method, body: formData, redirect: "follow" })
            .then(response => {

                if(response.redirected) {
                    window.location.href = response.url;
                    return true;
                }

                return response.json();
            })
            .then(data => {

                if(data === true) return;
                
                if(!data.message) {
                    data.message = "Une erreur est survenue.";
                }

                displayError(data.message);
            })
            .catch(error => {

                console.log(error);
                displayError("Une erreur est survenue.");
            });
    });
}