# ~~Alpha (v0.9)~~
- ~~Add bare Folder.ocd template~~
- ~~Fix trailing explorer items persistance~~
- ~~Ensure functions in main toolbar do work~~
- ~~Prevent renaming when Cut/Paste files is no change at all~~
- ~~Fix Drag'n'Drop Indicator of explorer~~
- ~~Properly add explorer items, when creating view after startup~~
- ~~Moving files within and across workspaces/Drag and Drop operations~~
- ~~Select items via shift in explorer~~
- ~~Solid keybindings API~~
- ~~Implement Copy/Paste/Cut functionality~~
- ~~Add newly found files to its adjacent file in the tree structure~~
- ~~Display keybindings in contextmenus~~
- ~~Some styling to deck-navigation of dialogs~~
- ~~Fix navigating between pages in dialog wizards~~
- ~~Normalize config entries to lowercase-camel-case~~

# Alpha (v0.9.5)
- validateFilename() take already existing trailing number into account
- Show Workspace name in Module head
- Contextmenu Icons for Cut/Copy/Paste
- Hotkeys for Explorer Operations (See below)
- Correctly free memory from unused FileInfos after packaging
- ~~Inform about save-state of editable modules (e.g. texteditor)~~
- ~~Image preview~~

# Official Beta (v1.0)
- Saving and loading keybindings
- Basic styling of Form components
- Workspace settings (renaming, workspace specific c4group and ocexe)
- Remove move-module icon from module head and replace it by dragging modules over another one for swaping
- Add options to main toolbar
- Implement ocmapgen module (http://forum.openclonk.org/topic_show.pl?tid=3371)

# Wishlist
- (Lazy explorer loading (to prevent even trying to load whole C:-drive at once, if specified as workspaces))
- Formating whole script via hotkey
- Multilanguage support(Only the API part, the coherent translations have to be shipped by native speakers)
- Replacing c4group usage by nodejs gzip stream preceding a custom transform-stream (to make things valid for gzip) and vice versa
- Xml based Documentation user-interface/any other way to create solid documentations for developers
- Scroll past end of ace document to give some ergonomic space (https://github.com/ajaxorg/ace/wiki/Configuring-Ace)

# Needed Hotkeys
- Explorer: DEL -> Open Dialog for file removal
- Explorer: CTRL+N -> Open Dialog for file creation
- Explorer: CTRL+C
- Explorer: CTRL+X
- Explorer: CTRL+V
- Explorer: Arrow-right: Expand folder
- Explorer: Arrow-left: Collapse folder
- Explorer: Arrow-down: Select bottom next item
- Explorer: Arrow-up: Select up next item
- Explorer: Enter: Open file or run scenario
- Global: CTRL+R? Rerun most recent launched game