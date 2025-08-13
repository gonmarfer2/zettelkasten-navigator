function createFileTableEntry(file) {
    const entry = `<tr>
    <td>${file.title}</td>
    <td>${file.tags}</td>
    <td>${file.date}</td>
    <td>${file.name}</td>
    </tr>`;
    return entry;
}

document.addEventListener('DOMContentLoaded',async () => {

    const files = window.sessionStorage.getItem('files');
    if (files) {
        const fileTable = document.getElementById('id-files-table').querySelector('tbody');
        for (file of JSON.parse(files)) {
            const newRow = createFileTableEntry(file);
            fileTable.insertAdjacentHTML('beforeend',newRow);
        }
    }

    document.getElementById('id-btn-load-folder').addEventListener('click',async () => {
        const fileTable = document.getElementById('id-files-table').querySelector('tbody');
        const files = await window.electronAPI.getFiles();
        if (files) {
            fileTable.innerHTML = '';
            window.sessionStorage.setItem('files',JSON.stringify(files));
            for (file of files) {
                const newRow = createFileTableEntry(file);
                fileTable.insertAdjacentHTML('beforeend',newRow);
            }
        }
    });
});