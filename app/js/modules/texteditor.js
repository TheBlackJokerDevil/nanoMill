// provide every editor dom instace with a unique id by this index
let nextTextEditorId = 0

class TextEditor extends layout.DeckItem {
	
	init() {
		this.root.innerHTML = `<div id='TE-${nextTextEditorId}' class='ace_mill'></div>`
		
		this.tid = nextTextEditorId++
		
		this.hookIn("onLayoutChange", _ => {
			if(this.editor)
				this.editor.resize()
		})
	}

    setup(file, txt, mode) {
        if(!this.editor)
            this.editor = ace.edit("TE-"+this.tid)

		let editor = this.editor
		
        this.file = file

		this.isUnchanged = true
		
		editor.$blockScrolling = Infinity
		
        editor.setOptions({
			fontSize: config.get("aceFontSize") + "px" || "14px",
            enableBasicAutocompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: true,
			// fontFamily: "SpaceMono",
            wrapBehavioursEnabled: true
        })

        editor.getSession().setUseWrapMode(true)
        editor.getSession().setMode("ace/mode/" + mode)
		editor.session.setValue(txt, -1)
		
		editor.on("focus", _ => {
			hook.exec("onCurrEditorSet", this, this.file)
		})
		
		editor.on("change", _ => {
			setTimeout(this.checkFileState.bind(this), 1)
		})
		
		// get rid of the local lang tool, since it will suggest any word in the document
		let langtools = ace.require("ace/ext/language_tools")
		langtools.setCompleters([langtools.snippetCompleter, langtools.keyWordCompleter])
		
		// set keyboard mode
		this.setKeyBoardMode(config.get("aceKbMode"))
    }
	
	setFontSize(size) {
		this.editor.setOptions({
			fontSize: size + "px"
		})
	}
	
	setKeyBoardMode(mode) {
		if(mode === "vim")
			this.editor.setKeyboardHandler("ace/keyboard/vim")
		else if(mode === "emacs")
			this.editor.setKeyboardHandler("ace/keyboard/emacs")
		else
			this.editor.setKeyboardHandler(null)
	}
	
	checkFileState() {
		if(this.editor.getSession().getUndoManager().isClean() === this.isUnchanged)
			return
		
		this.isUnchanged = !this.isUnchanged
		
		hook.exec("onFileChangeStateChange", this.file, this.isUnchanged)
	}
	
	save() {
		fs.writeFile(this.file.path, this.editor.getSession().getDocument().getValue(), 'utf8', (err) => {
			if(err)
				throw `Failed to save file (${err})`
			else {
				this.editor.getSession().getUndoManager().markClean()
				this.checkFileState()
			}
		})
	}
	
	onFocus() {
		this.editor.focus()
	}
	
	onClosePrevent() {
		if(!this.editor)
			return false
		
		if(this.editor.getSession().getUndoManager().isClean())
			return false
		else {
			let result = dialog.showMessageBox({
					type: "question",
					buttons: ["Save", "Discard Changes", "Cancel"],
					defaultId: 0,
					title: "Unsaved changes",
					message: "The file you are about to close contains some unsaved changes.",
					cancelId: 2,
					noLink: true
				}
			)
			// on "Save"
			if(result === 0) {
				this.save()
				return false
			} // on "Discard Changes"
			else if(result === 1)
				return false
			else // on "Cancel"
				return true
		}
	}
	
	onClose() {
		this.editor.destroy()
		this.editor = false
		Elem.remove("TE-"+this.tid)
	}
}

TextEditor.def = {
	alias: "texteditor",
	className: TextEditor,
	title: "Texteditor",
	isSub: true
}

layout.setModuleDef(TextEditor.def)

function setTextEditorFontSize(val) {
	// delegate new value
	// don't use instance of, but check for equal alias since instanceof would throw
	// an error if such a class is not defined
	let mdls = lyt.getModulesSet()
	for(let mdl of mdls)
		if(mdl.constructor.def.alias === "texteditor")
			mdl.setFontSize(val)
}

function setTextEditorKbMode(mode) {
	// delegate new value
	// don't use instance of, but check for equal alias since instanceof would throw
	// an error if such a class is not defined
	let mdls = lyt.getModulesSet()
	for(let mdl of mdls)
		if(mdl.constructor.def.alias === "texteditor")
			mdl.setKeyBoardMode(mode)
}