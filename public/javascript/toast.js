function clearToasts() {

    const container = document.getElementById('toast-container');
    container.innerHTML = '';
}

function showToast(message) {

    const html = `
    <div class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="4000">
        <div class="toast-header d-flex align-items-center justify-content-between">
            <i class="fa-solid fa-circle-info"></i>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">${message}</div>
    </div>
    `

    const container = $('#toast-container');
    const toast = $(html);

    container.append(toast);
    toast.toast('show');
}