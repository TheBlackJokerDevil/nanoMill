# Alpha (v0.9)
- Ensure functions in main toolbar do work
- Inform about dirty-state of editable modules (mostly texteditor)
- Prevent renaming when Copy/Paste files is no change at all
- Fix trailing explorer items persistance
- ~~Fix Drag'n'Drop Indicator of explorer~~
- ~~Properly add explorer items, when creating view after startup~~
- ~~Moving files within and across workspaces/Drag and Drop operations~~
- ~~Select items via shift in explorer~~
- ~~Solid keybindings API~~
- ~~Implement Copy/Paste/Cut functionality~~ (+icons, +hotkeys)
- ~~Add newly found files to its adjacent file in the tree structure~~
- ~~Display keybindings in contextmenus~~
- ~~Some styling to deck-navigation of dialogs~~
- ~~Fix navigating between pages in dialog wizards~~
- ~~Normalize config entries to lowercase-camel-case~~

# Official Beta (v1.0)
- Add bare folder.ocd
- validateFilename() take already existing trailing number into account
- Basic styling of Form components
- Saving and loading keybindings
- Workspace settings (renaming, workspace specific c4group and ocexe)
- Controls to navigate in explorer and navigator with arrow keys
- Remove move-module icon from module head and replace it by dragging modules over another one for swaping
- Add options to main toolbar
- Implement ocmapgen module (http://forum.openclonk.org/topic_show.pl?tid=3371)
- Correctly free memory from unused FileInfos after packaging

# Wishlist
- Procedural explorer loading (to prevent even trying to load whole C:-drive at once, if specified as workspaces)
- Formating whole script via hotkey
- Support for multiple languages(Only the API part, the coherent translations have to be shipped by native speakers)
- Replacing c4group usage by nodejs gzip stream preceding a custom transform-stream (to make things valid for gzip) and vice versa
- Xml based Documentation user-interface/any other way to create solid documentations for developers
- Scroll past end of ace document to give some ergonomic space (https://github.com/ajaxorg/ace/wiki/Configuring-Ace)

# Needed Hotkeys
- Explorer: DEL -> Open Dialog for file removal
- Explroer: CTRL+N -> Open Dialog for file creation