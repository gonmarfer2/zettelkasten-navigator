# My Zettelkasten Navigator App

I'm building this application to easily search for my zettlekasten documents when I need them.

## Functionalities

- [x] List documents
- [x] Open documents
- [x] Filter documents by title, tag, date or words contained
- [ ] Graph related documents

## Tasks

- [x] Open md files and read their yaml headings
- [x] Create a table and add the files' information
- [x] If an entry of the table is clicked, access its details
- [x] Details contain the files that point to that file as well as the files it points to
- [x] Handle sorting + filtering
- [ ] When a file link is not found, do not attempt to open it.
  - (node:19341) electron: Failed to load URL: file:///home/gonzalo/Proyectos/2025/zettelkasten-navigator/src/tecincas-para-docentes-preparar-una-clase-universitaria.md with error: ERR_FILE_NOT_FOUND
- [ ] Show errors when the loading button fails (and where it fails, all the document names)
- [x] Open external links in the browser
- [ ] Add a buton to see the graph of related documents
- [x] Instead of clicking the row, put a button to access the document view.

## Bugs

- [ ] The graph is not rendered unless the window is resized.