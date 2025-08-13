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
    // Load files after click
    document.getElementById('id-btn-load-folder').addEventListener('click',async () => {
        const fileTable = document.getElementById('id-files-table').querySelector('tbody');
        fileTable.children = fileTable.children[0];
        const files = await window.electronAPI.getFiles();
        for (file of files) {
            const newRow = createFileTableEntry(file);
            fileTable.insertAdjacentHTML('beforeend',newRow);
            // header = await extractMDFileInfo(file.handle);
        }
    });
});