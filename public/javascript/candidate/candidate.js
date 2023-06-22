document.addEventListener('DOMContentLoaded', function () {

  // List of files to upload.
  const filesToUpload = [];

  // List of files to delete.
  const filesToDelete = [];

  initTabButtons();
  initFileUploader(filesToUpload, filesToDelete);
  initForm(filesToUpload, filesToDelete);
  initDeleteButtons(filesToUpload, filesToDelete);
});

function initTabButtons() {

  const buttons = document.querySelectorAll(".tab-button");
  const offerContent = document.getElementById('offer-content');
  const applyContent = document.getElementById('apply-content');

  buttons.forEach(button => {

    button.addEventListener('click', () => {

      if (button.classList.contains('active')) return;

      buttons.forEach(button => {
        button.classList.toggle('active');
      });

      offerContent.classList.toggle('d-none');
      applyContent.classList.toggle('d-none');
    });
  });
}
function validateFileType(file) {
  const allowedTypes = ['application/pdf'];
  return allowedTypes.includes(file.type);
}

function initFileUploader(files, filesToDelete) {

  const uploader = document.getElementById("file-uploader");
  const fileType = document.getElementById("file-type");
  const addFileButton = document.getElementById('add-file');

  // Case in which elements are not present.
  if (!uploader || !fileType || !addFileButton) return;

  uploader.addEventListener('change', function () {

    if (!uploader.checkValidity()) {
      uploader.classList.add('is-invalid');
    } else {
      uploader.classList.remove('is-invalid');
    }
  });

  fileType.addEventListener('change', function () {

    if (!fileType.checkValidity()) {
      fileType.classList.add('is-invalid');
    } else {
      fileType.classList.remove('is-invalid');
    }
  });

  addFileButton.addEventListener('click', function (event) {

    // Button is in a form and sends it by default. Disabling that.
    event.preventDefault();
    event.stopPropagation();

    if (!uploader.checkValidity()) {
      uploader.classList.add('is-invalid');
      return;
    }

    if (!fileType.checkValidity()) {
      fileType.classList.add('is-invalid');
      return;
    }

    uploader.classList.remove('is-invalid');
    fileType.classList.remove('is-invalid');

    // Storing selected files to send them later.
    const id = 'file-' + files.length;
    const file = uploader.files[0];
    const type = fileType.value;
    // Only PDF Files
    if (!validateFileType(file)) {
      alert('Seuls les fichiers PDF sont autorisés.');
      return;
    }

    files.push({ 'id': id, 'file': file, 'type': type });

    // Resetting inputs.
    uploader.value = "";
    fileType.value = "";

    // Updating table.
    updateFileTable(files, id, file, type, filesToDelete);
  });
}

function updateFileTable(files, id, file, type, filesToDelete) {

  const table = document.getElementById('file-table');
  const body = table.querySelector('tbody');

  const row = body.insertRow(-1); // Insert line at the end of the table.
  row.dataset.fileId = id;

  // Inserting cells.
  const nameCell = row.insertCell(0);
  const typeCell = row.insertCell(1);
  const actionCell = row.insertCell(2);

  // Updating cells.
  nameCell.innerHTML = file.name;
  typeCell.innerHTML = type;

  actionCell.classList.add('action-delete');
  actionCell.innerHTML = '<i class="fa-solid fa-trash action action-delete"></i>';

  // Adding delete action.
  const action = actionCell.querySelector('i');
  initDeleteButton(action, row, files, filesToDelete);
}

function initForm(files, filesToDelete) {

  const form = document.getElementById('apply-content');

  // Checking that the form is present.
  if (!form) return;

  form.addEventListener('submit', (event) => {

    event.preventDefault();
    event.stopPropagation();

    // Error handling.
    const displayError = message => {

      const error = form.getElementsByClassName('submit-error')[0];

      error.innerHTML = message;
      error.classList.remove('d-none');
    };

    // Sending form data.
    const formData = new FormData();
    formData.append('filesToDelete', filesToDelete);

    for (let file of files) {
      formData.append('files', file.file);
      formData.append('types', file.type);
    }

    fetch(form.action, { method: form.dataset.method, body: formData, redirect: "follow" })
      .then(response => {

        // Follow redirection when detected.
        if (response.redirected) {
          window.location.href = response.url;
          return true;
        }

        return response.json();
      })
      .then(data => {

        // Redirection detected.
        if (data === true) return;

        if (!data.message) {
          data.message = "Une erreur est survenue.";
        }

        displayError(data.message);
      })
      .catch(error => {

        console.error(error);

        // Displaying error message.
        displayError("Une erreur est survenue.");
      });
  });
}

function initDeleteButtons(files, filesToDelete) {

  const rows = document.querySelectorAll('.attachements-table tbody tr');

  for (let row of rows) {

    const deleteButton = row.querySelector('i.action-delete');
    if (deleteButton) initDeleteButton(deleteButton, row, files, filesToDelete);
  }
}

function initDeleteButton(button, row, files, filesToDelete) {

  button.addEventListener('click', function () {

    // This case means that the row has an id, so the file is stored on the server.
    // We need to indicate to the server to delete this file using its id.
    if (row.dataset.id) filesToDelete.push(row.dataset.id);

    row.remove();

    // Removing file from array.
    const index = files.findIndex(obj => obj.id === row.dataset.id);

    if (index !== -1) files.splice(index, 1);
  });
}
