document.addEventListener('DOMContentLoaded', function() {
  initTabButtons();
});

function initTabButtons() {

  const buttons = document.querySelectorAll(".tab-button");
  const offerContent = document.getElementById('offer-content');
  const applyContent = document.getElementById('apply-content');

  buttons.forEach(button => {

    console.log(button);

    button.addEventListener('click', () => {

      buttons.forEach(button => {
        button.classList.toggle('active');
      });

      offerContent.classList.toggle('d-none');
      applyContent.classList.toggle('d-none');

    });
  });
}

/*
const tabs = document.querySelector(".wrapper");
const tabButton = document.querySelectorAll(".tab-button");
const contents = document.querySelectorAll(".content");
const form = document.querySelector('form');
const table = document.querySelector('table');
const deleteButtons = document.querySelectorAll('table button.delete-button');

tabs.onclick = (e) => {
  const id = e.target.dataset.id;
  if (id) {
    tabButton.forEach((btn) => {
      btn.classList.remove("active");
    });
    e.target.classList.add("active");

    contents.forEach((content) => {
      content.classList.remove("active");
    });
    const element = document.getElementById(id);
    element.classList.add("active");
  }
};

// Ajouter un événement "submit" au formulaire
form.addEventListener('submit', (e) => {
  e.preventDefault(); // Empêcher le comportement par défaut du formulaire

  // Récupérer les informations soumises dans le formulaire
  const fileInput = form.querySelector('input[type="file"]');
  const commentInput = form.querySelector('select[id="comments"]');
  const fileName = fileInput.files[0].name;
  const comment = commentInput.value;

  // Créer une nouvelle ligne pour le tableau
  const newRow = table.insertRow(-1); // Insérer une ligne à la fin du tableau
  const commentCell = newRow.insertCell(0);
  const nameCell = newRow.insertCell(1);
  const actionCell = newRow.insertCell(2);

  // Ajouter les informations soumises à la nouvelle ligne
  commentCell.innerHTML = comment;
  nameCell.innerHTML = fileName;
  actionCell.innerHTML = '<button type="button" class="btn btn-link delete-button">Supprimer</button>';

  // Parcourir tous les boutons de suppression et ajouter un gestionnaire d'événements "click"
  const deleteButtons = document.querySelectorAll('table button.delete-button');
  deleteButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      // Obtenez la ligne parente du bouton cliqué
      const row = event.target.parentNode.parentNode;
      // Supprimez la ligne du tableau
      row.remove();
    });
  });

  // Réinitialiser le formulaire
  form.reset();
});
*/
