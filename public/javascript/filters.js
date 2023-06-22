document.addEventListener('DOMContentLoaded', function () {

  // Retrieving all the filter modals.
  const modals = document.getElementsByClassName("filter-modal");

  for (let modal of modals) { initFilterModal(modal); }
});

function getFilterModal(button) {

  const modalId = button.dataset.bsTarget;

  if (!modalId) {
    console.error(`Modal not defined for ${button}.`);
    return;
  }

  const modal = document.getElementById(modalId);

  if (!modal) {
    console.error(`Cannot find modal ${modalId}.`);
    return;
  }

  return modal;
}

function initFilterModal(modal) {

  if (!modal) {
    console.error("Cannot initialize filter modal: invalid modal.");
    return;
  }

  // Adding default values to filters depending on the current url.
  modal.addEventListener('show.bs.modal', function() {
    initFilters(modal);
  });

  const button = modal.getElementsByClassName("modal-filter-button")[0];

  if (!button) {
    console.error(`Filter button not found for modal ${modal}`);
    return;
  }

  button.addEventListener("click", function () {

    let filterQuery = buildFilterQueryString(modal);

    if (!filterQuery) filterQuery = "";
    else filterQuery = "?" + filterQuery;

    const origin = window.location.href.split('?')[0]
    const url = origin + filterQuery;

    window.location.href = url;
  });

  const reset = modal.getElementsByClassName('modal-clear-filter-button')[0];

  if (!reset) {
    console.error(`Reset button not found for modal ${modal}`);
    return;
  }

  reset.addEventListener("click", function () {

    const filters = modal.getElementsByClassName("filter");

    for(let filter of filters) { filter.value = ""; }

    button.click();
  });
}

function buildFilterQueryString(modal) {

  const filters = modal.getElementsByClassName("filter");
  const params = [];

  for (let filter of filters) {

    const filterName = filter.dataset.filterName;
    const filterType = filter.dataset.filterType;
    const filterValue = filter.value;

    // Case in which one value is missing.
    if(!filterName || !filterValue || !filterType) continue;

    const prefix = `${filterName}[:${filterType}]`;
    const suffix = encodeURIComponent(filterValue);

    const filterParam = prefix + "=" + suffix;

    params.push(filterParam);
  }

  return params.join('&');
}

function initFilters(modal) {

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  const filters = modal.getElementsByClassName("filter");

  for(let filter of filters) {

    const filterName = filter.dataset.filterName;
    const filterType = filter.dataset.filterType;

    const prefix = `${filterName}[:${filterType}]`;

    if(!urlParams.has(prefix)) continue;

    const value = urlParams.get(prefix);
    
    filter.value = value;
  }
}