const FILES_PROPERTY = 'files';
const GRAPH_PROPERTY = 'graph';
showdown.setFlavor('github');

function createFileTableEntry(file) {
    let tagsHTML = '';
    file.tags.forEach(tag => {
        tagsHTML += `<span class="badge rounded-pill bg-primary">${tag}</span>`;
    });

    const actionButtons = `<div class="dropdown">
        <button class="btn btn-primary dropdown-toggle" id="id-actionButtons-${file.index}" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            Actions
        </button>
        <ul class="dropdown-menu" aria-labelledby="id-actionButtons-${file.index}">
            <li><a class="dropdown-item" href="#" data-action="view"><i class="bi bi-eye-fill text-dark"></i>&nbsp;View</a></li>
            <li><a class="dropdown-item" href="#" data-action="graph"><i class="bi bi-share-fill text-dark"></i>&nbsp;Graph connections</a></li>
            <li><a class="dropdown-item" href="#" data-action="graph-1"><i class="bi bi-share-fill text-dark"></i>&nbsp;Direct connections</a></li>
            <li><a class="dropdown-item" href="#" data-action="graph-tags"><i class="bi bi-share-fill text-dark"></i>&nbsp;Connections by tags</a></li>
        </ul>
        </div>`
    // const actionButtons = `<button class="btn btn-primary" data-action="view"><i class="bi bi-eye-fill text-light"></i></button>
    // <button class="btn btn-primary" data-action="graph"><i class="bi bi-share-fill text-light"></i></button>`;

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
    let entry = window.localStorage.getItem(property);
    if (entry) {
        if (property == FILES_PROPERTY) {
            entry = JSON.parse(entry);
            entry.forEach(element => {
                element.date = new Date(element.date);
            });
        }
    }
    return entry;
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
    const converter = new showdown.Converter({tables:true});
    const bodyText = converter.makeHtml(thisFile.body);
    
    modal._element.querySelector('.modal-title').innerHTML = thisFile.title;
    const modalBody = modal._element.querySelector('.modal-body');
    modalBody.innerHTML = bodyText;
    changeFileLinksWithPageLinks(modal,files,modal);

    const referencers = getFilesThatReference(files,thisFile);
    let footerList = modal._element.querySelector('.modal-footer');
    footerList.innerHTML = '';
    footerList.insertAdjacentHTML('beforeend','<h6 style="width: 100%;">Files that reference this:</h6>');
    footerList.insertAdjacentHTML('beforeend',`<ul>${referencers}</ul>`);

    footerList.querySelectorAll('li > a').forEach(f => {
        f.addEventListener('click', () => {
            loadModalData(modal,files,f.dataset.index);
        });
    });
}

async function loadModalGraph(modal,files,fileId) {
    const thisFile = files.filter((f) => f.index == fileId)[0];
    
    modal._element.querySelector('.modal-title').innerHTML = thisFile.title;
    const modalBody = modal._element.querySelector('.modal-body');
    modalBody.innerHTML = '';
    modalBody.insertAdjacentHTML('beforeend','<div class="graph-container"></div>');

    const partialGraph = await window.electronAPI.getPartialGraph(files,fileId);
    const graph = new graphology.Graph();
    graph.import(partialGraph);
    const graphRenderer = new Sigma(graph,modalBody.querySelector('.graph-container'),{allowInvalidContainer:true});

    let footerList = modal._element.querySelector('.modal-footer');
    footerList.innerHTML = '';
    return graphRenderer;
}

async function loadModalGraphLevel1(modal,files,fileId) {
    const thisFile = files.filter((f) => f.index == fileId)[0];
    
    modal._element.querySelector('.modal-title').innerHTML = thisFile.title;
    const modalBody = modal._element.querySelector('.modal-body');
    modalBody.innerHTML = '';
    modalBody.insertAdjacentHTML('beforeend','<div class="graph-container"></div>');

    const partialGraph = await window.electronAPI.getPartialGraphLevel1(files,fileId);
    const graph = new graphology.Graph();
    graph.import(partialGraph);
    const graphRenderer = new Sigma(graph,modalBody.querySelector('.graph-container'),{allowInvalidContainer:true});

    let footerList = modal._element.querySelector('.modal-footer');
    footerList.innerHTML = '';
    return graphRenderer;
}

async function loadModalGraphTags(modal,files,fileId) {
    const thisFile = files.filter((f) => f.index == fileId)[0];
    
    modal._element.querySelector('.modal-title').innerHTML = thisFile.title;
    const modalBody = modal._element.querySelector('.modal-body');
    modalBody.innerHTML = '';
    modalBody.insertAdjacentHTML('beforeend','<div class="graph-container"></div>');

    const partialGraph = await window.electronAPI.getPartialGraphTags(files,fileId);
    const graph = new graphology.Graph();
    graph.import(partialGraph);
    const graphRenderer = new Sigma(graph,modalBody.querySelector('.graph-container'),{allowInvalidContainer:true});

    graphRenderer.on("clickNode", ({node}) => {
        if (!graph.getNodeAttribute(node, "hidden")) {
            const thisNodeId = files.filter((f) => f.name == node)[0].index;
            loadModalData(modal,files,thisNodeId);
        }
    });

    let footerList = modal._element.querySelector('.modal-footer');
    footerList.innerHTML = '';
    return graphRenderer;
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

function insertTableRows(files,allFiles,fileTable,fileModal,informationBox) {
    fileTable.innerHTML = '';

    for (const file of files) {
        const newRow = createFileTableEntry(file);
        fileTable.insertAdjacentHTML('beforeend',newRow);
    }
    
    // Open file data
    fileTable.querySelectorAll('[data-action="view"]').forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            const rowId = e.target.closest('tr').dataset.index;
            loadModalData(fileModal,allFiles,rowId);
            fileModal.show();
        });
    });

    fileTable.querySelectorAll('[data-action="graph"]').forEach(element => {
        element.addEventListener('click', async (e) => {
            e.preventDefault();
            const rowId = e.target.closest('tr').dataset.index;
            const graphRenderer = await loadModalGraph(fileModal,allFiles,rowId);
            fileModal.show();
            graphRenderer.refresh();
        });
    });

    fileTable.querySelectorAll('[data-action="graph-1"]').forEach(element => {
        element.addEventListener('click', async (e) => {
            e.preventDefault();
            const rowId = e.target.closest('tr').dataset.index;
            const graphRenderer = await loadModalGraphLevel1(fileModal,allFiles,rowId);
            fileModal.show();
            graphRenderer.refresh();
        });
    });

    fileTable.querySelectorAll('[data-action="graph-tags"]').forEach(element => {
        element.addEventListener('click', async (e) => {
            e.preventDefault();
            const rowId = e.target.closest('tr').dataset.index;
            const graphRenderer = await loadModalGraphTags(fileModal,allFiles,rowId);
            fileModal.show();
            graphRenderer.refresh();
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
    let files = loadJSONEntry(FILES_PROPERTY);
    if (files) {
        currentFiles = files.slice();
        insertTableRows(currentFiles,files,fileTable,fileModal);
    }

    // Load button
    document.getElementById('id-btn-load-folder').addEventListener('click',async () => {
        files = await window.electronAPI.getFiles();
        // let graph = filesAndGraph[1];
        if (files) {
            // graph = await window.electronAPI.exportGraph(graph);
            // const g = new graphology.Graph();
            // g.import(graph);
            // const s = new Sigma(g,document.getElementById('id-information-window'));
            window.localStorage.setItem('files',JSON.stringify(files));
            // window.localStorage.setItem('graph',graph);
            currentFiles = files.slice();
            insertTableRows(currentFiles,files,fileTable,fileModal,informationBox);
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
            insertTableRows(currentFiles,files,fileTable,fileModal);
        });
    });

    // Filtering
    document.getElementById('id-search-form').querySelectorAll('input').forEach(inputForm => {
        let eventType = 'keyup';
        if (inputForm.type === 'date') {
            eventType = 'change'
        }

        inputForm.addEventListener(eventType,(event) => {
            event.preventDefault();
            const formInputs = document.getElementById('id-search-form').querySelectorAll('input');
            let filterFiles = files.slice();
            formInputs.forEach(element => {
                if (element.value != "") {
                    if (element.type === 'date') {
                        const searchDate = element.valueAsDate;
                        filterFiles = filterFiles.filter((f) => searchDate.getTime() == f.date.getTime());
                    } else {
                        const searchRegex = new RegExp(RegExp.escape(element.value),"iu");
                        if(element.dataset.name === 'tags') {
                            filterFiles = filterFiles.filter((f) => f[element.dataset.name].some((t) => searchRegex.test(t)));
                        } else {
                            filterFiles = filterFiles.filter((f) => searchRegex.test(f[element.dataset.name]));
                        }
                    }
                }
            });
            currentFiles = filterFiles.slice();
            insertTableRows(filterFiles,files,fileTable,fileModal);
        });
    });

    // Reset filters
    document.getElementById('id-form-reset').addEventListener('click',(event) => {
        const formInputs = document.getElementById('id-search-form').querySelectorAll('input');
        formInputs.forEach(element => {
            element.value = "";
        });
        currentFiles = files.slice();
        insertTableRows(currentFiles,files,fileTable,fileModal);
    });

});