# nanoMill

Yet small application to edit and create openclonk content files.

## Features
- Ace-editor integration to edit documents (with highlighting of c4script-syntax)
- Create contents from pre-defined templates
- Explorer to view and edit your clonk directories

## Run unstable
By using electron release:
- Download electron release from here https://github.com/electron/electron/releases
- Clone nanoMill repository or download zip
- Drag app folder onto the electron executable

By installing node.js:
- Download and install nods.js
- run npm in command line and install electron (pre-builds) as global
- start run.bat in app folder or launch electron within that folder manually

## When developing nanoMill
- If you ran nanoMill once, you can add "devmode": true in window.json in appdata folder (nanoMill has to be closed to not overwrite that)
- If done as stated, you can open/close Webkit console with Ctrl+Shift+I and reload the renderer process with Ctrl+R