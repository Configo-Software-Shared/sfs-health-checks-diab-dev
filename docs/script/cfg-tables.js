/**
 * Sets up column filtering inputs for a DataTable.
 * @param {string} id - Table selector.
 * @param {object} api - DataTable API instance.
 */
function setUpColumnFiltering(id, api) {
  const $filterHeaders = $(`${id} .filters th`);
  api.columns().eq(0).each(function (colIdx) {
    const $cell = $filterHeaders.eq($(api.column(colIdx).header()).index());
    const title = $cell.text();
    $cell.html(`<div class="ui input" style="width:100%"><input type="text" placeholder="${title}" /></div>`);
    const $input = $('input', $cell);

    $input
      .off('keyup change')
      .on('change', function () {
        $(this).attr('title', $(this).val());
        let searchValue = this.value;
        let useRegex = false;
        if (searchValue && searchValue.startsWith('/')) {
          // Remove the leading slash for regex search
          searchValue = searchValue.substring(1);
          useRegex = true;
        }
        api
          .column(colIdx)
          .search(
            searchValue,
            useRegex,
            searchValue === '' // Use smart search when not empty
          )
          .draw();
      })
      .on('keyup', function (e) {
        e.stopPropagation();
        const cursorPosition = this.selectionStart;
        $(this).trigger('change');
        $(this).focus()[0].setSelectionRange(cursorPosition, cursorPosition);
      });
  });
}

/**
 * Clears all column filters in a DataTable.
 * @param {string} id - Table selector.
 */
function clearAllFilters(tableId) {
  $(`${tableId} .filters th input`).each(function () {
    $(this).val('').trigger('change');
  });
}

/**
 * Sets the filter value for a specific column in a DataTable.
 * @param {string} tableId - Table selector.
 * @param {number} columnIndex - Index of the column to filter.
 * @param {string} value - Value to set as the filter.
 */
function setColumnFilter(tableId, columnIndex, value) {
  const $input = $(`${tableId} .filters th:eq(${columnIndex}) input`);
  if ($input.length > 0) {
    $input.val(value).trigger('change');
  }
}

/**
 * Scrolls the specified table into view smoothly and centers it in the viewport.
 * @param {string} tableId - Table selector.
 */
function scrollTableIntoView(tableId) {
  const tableElem = document.querySelector(tableId);
  if (tableElem) {
    tableElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Renders a list for DataTable display/filter.
 */
function renderList(data, type) {
  if (data && Array.isArray(data) && data.length > 0) {
    if (type === 'filter') {
      return data.join('||');
    } else if (type === 'display') {
      return `<div class="ui list">${data.map(id => `<div class="item">${id}</div>`).join('')}</div>`;
    } else {
      return data[0];
    }
  }
  return null;
}

/**
 * Renders an object that represents a potential Xoom reference.
 * The following options are supported:
 * { ref='Type[KeyValues]', value='elementValue' }
 * { unresolved='Type[Key=Value]', value='elementValue' }
 * { value='elementValue' }
 * {}
 */
function renderXoomReference(includeType) {
  return function (data, type) {
    if (type === 'display') {
      if (data && typeof data === 'object') {
        if (data.ref) {
          return `<div class="ui green label">${data.value}` +
            (includeType ? `<div class="detail">${data.ref.split('[')[0]}</div>` : '') +
            '</div>';
        } else if (data.unresolved) {
          return `<div class="ui red label">${data.unresolved}</div>`;
        } else if (data.value) {
          return `<div class="ui grey label">${data.value}</div>`;
        } else {
          return `<div class="ui label">&lt;empty></div>`;
        }
      }
    }
    else {
      return data.ref ?? data.unresolved ?? data.value;
    }
  }
}

/**
 * Renders an array of Xoom reference objects.
 */
function renderXoomReferences(includeType, topClasses, wrapRef, divider) {
  const wrapUsed = wrapRef ?? ((item) => `<div class='item'>${item}</div>`);
  const header = `<div class="ui ${topClasses ?? 'list'}">`;
  const dividerUsed = divider ?? '';
  return function (data, type) {
    if (Array.isArray(data) && data.length > 0) {
      if (type === 'display') {
        return header +
          data.map(item => renderXoomReference(includeType)(item, 'display')).map(wrapUsed).join(dividerUsed) +
          '</div>';
      } else {
        return data.map(item => renderXoomReference(includeType)(item, type)).join('||');
      }
    }
    return null;
  }
}

/**
 * Initializes a DataTable with optional filtering.
 */
function initDataTable(id, filterColumns, options) {
  let opts = { responsive: true };

  if (filterColumns) {
    opts = {
      ...opts,
      orderCellsTop: true,
      initComplete: function () {
        setUpColumnFiltering(id, this.api());
      }
    };
    const $thead = $(`${id} thead`);
    $thead.find('tr').first().clone(true).addClass('filters').appendTo($thead);
  }

  if (options) {
    opts = { ...opts, ...options };
  }

  return $(id).DataTable(opts);
}

/**
 * Initializes a DataTable with export/visibility buttons and optional column hiding.
 */
function initDataTableWithButtons(
  id, title,
  includeColumnVisibility, filterColumns,
  options,
  hideColumnsWithIdenticalValues,
) {
  const baseButtons = [
    { extend: 'copy', title },
    { extend: 'csvHtml5', title },
    { extend: 'excelHtml5', title },
    { extend: 'pdfHtml5', title },
    'print'
  ];
  if (includeColumnVisibility) {
    baseButtons.push({ extend: 'colvis', text: 'Columns' });
  }

  const top1Start = {
    ...options?.layout?.top1Start,
    buttons: baseButtons
  };

  const table = initDataTable(id, filterColumns, {
    ...options,
    layout: {
      ...options?.layout,
      top1Start
    }
  });

  if (hideColumnsWithIdenticalValues && table.rows().count() > 0) {
    table.columns().every(function () {
      const column = this;
      if (!column.visible()) return;
      const data = column.data().toArray();
      if (data.length === 0) return;
      const first = data[0];
      if (data.every(val => val === first)) {
        column.visible(false);
      }
    });
  }

  return table;
}
