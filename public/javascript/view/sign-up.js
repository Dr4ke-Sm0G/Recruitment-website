document.addEventListener('DOMContentLoaded', function () {

    const signUpForm = document.getElementById('sign-up-form');

    signUpForm.addEventListener('submit', (event) => {

        // Form data validation.
        if (!signUpForm.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
            signUpForm.classList.add('was-validated');
            return;
        }

        event.preventDefault();

        signUpForm.classList.add('was-validated');

        // Sending form data.
        const formData = new FormData(signUpForm);

        fetch(signUpForm.action, { method: signUpForm.method, body: formData }).then(response => {

            if (response.ok) {

                const content = document.getElementById("form-view");
                content.classList.add('d-none');

                const checked = document.getElementById("form-checked");
                checked.classList.remove('d-none');
                
                return null;
            }

            return response.json();

        }).then(function(data) {

            if(data == null) return;

            const error = document.getElementById('submit-error');

            // Displaying error message.
            error.innerHTML = data.message;
            error.classList.remove('d-none');
        });
    });
});