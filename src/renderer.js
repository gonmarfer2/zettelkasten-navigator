const FILES_PROPERTY = 'files';

function createFileTableEntry(file) {
    let tagsHTML = '';
    file.tags.forEach(tag => {
        tagsHTML += `<span class="badge rounded-pill bg-primary">${tag}</span>`;
    });

    const entry = `<tr data-index="${file.index}">
    <td>${file.title}</td>
    <td>${tagsHTML}</td>
    <td>${file.date.toLocaleDateString()}</td>
    <td>${file.name}</td>
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
            }
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

function insertTableRows(files,fileTable,fileModal) {
    for (const file of files) {
        const newRow = createFileTableEntry(file);
        fileTable.insertAdjacentHTML('beforeend',newRow);
    }
    
    // Open file data
    fileTable.querySelectorAll('tr').forEach(element => {
        element.addEventListener('click', (e) => {
            const rowId = e.target.parentElement.dataset.index;
            loadModalData(fileModal,files,rowId);
            fileModal.show();
        });
    });
}

document.addEventListener('DOMContentLoaded',async () => {

    var fileModal = new bootstrap.Modal(document.getElementById('id-file-modal'), {
        backdrop: true,
        keyboard: false
    })

    // Session storage files
    const files = loadJSONEntry(FILES_PROPERTY);
    if (files) {
        const fileTable = document.getElementById('id-files-table').querySelector('tbody');
        insertTableRows(files,fileTable,fileModal);
    }

    // Load button
    document.getElementById('id-btn-load-folder').addEventListener('click',async () => {
        const fileTable = document.getElementById('id-files-table').querySelector('tbody');
        const files = await window.electronAPI.getFiles();
        if (files) {
            fileTable.innerHTML = '';
            window.localStorage.setItem('files',JSON.stringify(files));
            insertTableRows(files,fileTable,fileModal);
        }
    });

    // Sort table
    document.getElementById('id-files-table').querySelectorAll('th').forEach(element => {
        element.addEventListener('click', (e) => {
            let th = e.target;
            const sortOrder = th.dataset.sort;
            const sortProp = th.dataset.name;
            th.dataset.sort = -1 * sortOrder;
            const files = loadJSONEntry(FILES_PROPERTY);
            if (files) {
                const fileTable = document.getElementById('id-files-table').querySelector('tbody');
                files.sort(propertyComparator(sortOrder,sortProp));
                fileTable.innerHTML = '';
                insertTableRows(files,fileTable,fileModal);
            }
        });
    });

});