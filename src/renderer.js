const FILES_PROPERTY = 'files';

function createFileTableEntry(file) {
    let tagsHTML = '';
    file.tags.forEach(tag => {
        tagsHTML += `<span class="badge rounded-pill bg-primary">${tag}</span>`;
    });

    const actionButtons = `<button class="btn btn-primary" data-action="view"><i class="bi bi-eye-fill text-light"></i></button>`;

    const entry = `<tr data-index="${file.index}">
    <td class="align-middle">${actionButtons}</td>
    <td class="align-middle">${file.title}</td>
    <td class="align-middle">${tagsHTML}</td>
    <td class="align-middle">${file.date.toLocaleDateString()}</td>
    <td class="align-middle">${file.name}</td>
    </tr>`;
    return entry;
}

function loadJSONEntry(property) {
    let files = window.localStorage.getItem(property);
    if (files) {
        files = JSON.parse(files);
        files.forEach(element => {
            element.date = new Date(element.date);
        });
    }
    return files;
}

function propertyComparator(order,property) {
    return function (a,b) {
        a = a[property];
        b = b[property];
        if (typeof(a)==='string') {
            a = a.toLowerCase();
            b = b.toLowerCase();
        }
        if (a > b) return order;
        if (a < b) return -1*order;
        return 0;
    }
}

function getFilesThatReference(files,file) {
    let referencersList = '';
    files.filter((f) => f.body.includes(file.name)).forEach(f => {
        referencersList += `<li><a href="#" data-index="${f.index}">${f.title}</a></li>`;
    });
    return referencersList;
}

function changeFileLinksWithPageLinks(modal,files) {
    const links = modal._element.querySelector('.modal-body').querySelectorAll('a');
    links.forEach(element => {
        if (/^file:/.test(element.href)) {
            const thisPath = element.href.split('/');
            const file = files.filter((f) => f.name == thisPath[thisPath.length - 1]);
            if (file.length > 0) {
                element.dataset.index = file[0].index;
                element.href = '#';
                element.addEventListener('click',() => loadModalData(modal,files,file[0].index))
            } else {
                const simpleText = document.createElement('span');
                simpleText.innerHTML = element.innerHTML;
                element.replaceWith(simpleText);
            }
        } else {
            element.target = "_blank";
        }
    });
}

function loadModalData(modal,files,fileId) {
    const thisFile = files.filter((f) => f.index == fileId)[0];
    const converter = new showdown.Converter();
    const bodyText = converter.makeHtml(thisFile.body);
    
    modal._element.querySelector('.modal-title').innerHTML = thisFile.title;
    const modalBody = modal._element.querySelector('.modal-body');
    modalBody.innerHTML = bodyText;
    changeFileLinksWithPageLinks(modal,files,modal);

    const referencers = getFilesThatReference(files,thisFile);
    let footerList = modal._element.querySelector('.modal-footer ul');
    footerList.innerHTML = referencers;

    footerList.querySelectorAll('li > a').forEach(f => {
        f.addEventListener('click', () => {
            loadModalData(modal,files,f.dataset.index);
        });
    });
}

function showMessage(message,type,box) {
    const VALID_TYPES = ['info','success','error']
    if (VALID_TYPES.includes(type)) {
        const messageBox = `<div class="alert alert-${type} d-flex gap-2" role="alert"><i class="bi bi-check-circle-fill"></i>
          <span class="flex-grow-1">${message}</span>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`
        box.insertAdjacentHTML('beforeend',messageBox);
    }

}

function insertTableRows(files,fileTable,fileModal,informationBox) {
    fileTable.innerHTML = '';

    for (const file of files) {
        const newRow = createFileTableEntry(file);
        fileTable.insertAdjacentHTML('beforeend',newRow);
    }
    
    // Open file data
    fileTable.querySelectorAll('[data-action="view"]').forEach(element => {
        element.addEventListener('click', (e) => {
            const rowId = e.target.closest('tr').dataset.index;
            loadModalData(fileModal,files,rowId);
            fileModal.show();
        });
    });

    if (informationBox) {
        showMessage('The table has been reloaded.','success',informationBox);
    }
}

document.addEventListener('DOMContentLoaded',async () => {

    let currentFiles = [];
    const fileTable = document.getElementById('id-files-table').querySelector('tbody');

    var fileModal = new bootstrap.Modal(document.getElementById('id-file-modal'), {
        backdrop: true,
        keyboard: false
    })

    const informationBox = document.getElementById('id-information-window');

    // Session storage files
    const files = loadJSONEntry(FILES_PROPERTY);
    if (files) {
        currentFiles = files;
        insertTableRows(currentFiles,fileTable,fileModal);
    }

    // Load button
    document.getElementById('id-btn-load-folder').addEventListener('click',async () => {
        const files = await window.electronAPI.getFiles();
        if (files) {
            window.localStorage.setItem('files',JSON.stringify(files));
            currentFiles = files;
            insertTableRows(currentFiles,fileTable,fileModal,informationBox);
        }
    });

    // Sort table
    document.getElementById('id-files-table').querySelectorAll('th').forEach(element => {
        element.addEventListener('click', (e) => {
            let th = e.target;
            const sortOrder = th.dataset.sort;
            const sortProp = th.dataset.name;
            th.dataset.sort = -1 * sortOrder;
            // const files = loadJSONEntry(FILES_PROPERTY);
            // if (files) {
            //     files.sort(propertyComparator(sortOrder,sortProp));
            //     insertTableRows(files,fileTable,fileModal);
            // }
            currentFiles.sort(propertyComparator(sortOrder,sortProp));
            insertTableRows(currentFiles,fileTable,fileModal);
        });
    });

    // Filtering
    document.getElementById('id-search-form').querySelectorAll('input').forEach(inputForm => {
        let eventType = 'keyup';
        if (inputForm.type === 'date') {
            eventType = 'change'
        }

        inputForm.addEventListener(eventType,(event) => {
            const formInputs = document.getElementById('id-search-form').querySelectorAll('input');
            let filterFiles = files.slice();
            formInputs.forEach(element => {
                if (element.value != "") {
                    if (element.type === 'date') {
                        const searchDate = element.valueAsDate;
                        filterFiles = filterFiles.filter((f) => searchDate.getTime() == f.date.getTime());
                    } else {
                        const searchRegex = new RegExp(RegExp.escape(element.value),"giu");
                        filterFiles = filterFiles.filter((f) => searchRegex.test(f[element.dataset.name]));
                    }
                }
            });
            currentFiles = filterFiles;
            insertTableRows(filterFiles,fileTable,fileModal);
        });
    });

    // Reset filters
    document.getElementById('id-form-reset').addEventListener('click',(event) => {
        const formInputs = document.getElementById('id-search-form').querySelectorAll('input');
        formInputs.forEach(element => {
            element.value = "";
        });
        currentFiles = files;
        insertTableRows(currentFiles,fileTable,fileModal);
    });

});