document.addEventListener('DOMContentLoaded', function() {
    initTabButtons();
  });
  
  function initTabButtons() {
  
    const buttons = document.querySelectorAll(".tab-button");
    const joinContent = document.getElementById('join-content');
    const createContent = document.getElementById('create-content');
  
    buttons.forEach(button => {
  
      button.addEventListener('click', () => {
  
        if(button.classList.contains('active')) return;
  
        buttons.forEach(button => {
          button.classList.toggle('active');
        });
  
        joinContent.classList.toggle('d-none');
        createContent.classList.toggle('d-none');
      });
    });
  }