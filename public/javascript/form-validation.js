(function () {
    'use strict'
  
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll('form')
  
    // Loop over them and prevent submission
    Array.prototype.slice.call(forms)
      .forEach(function (form) {
        form.addEventListener('submit', function (event) {
          if (!form.checkValidity()) {
            event.preventDefault()
            event.stopPropagation()
          }
  
          form.classList.add('was-validated')
        }, false)
      })
  })();

  document.addEventListener('DOMContentLoaded', function() {

    const container = document.getElementsByClassName('password-container')[0];
    const password = container.querySelector("input[type='password']");
    const showPassword = container.querySelector('.toggle-password');

    showPassword.addEventListener('click', function() {
        password.type = password.type === 'password' ? 'text' : 'password';
    });
});