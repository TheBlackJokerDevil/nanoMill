class EditorView extends layout.Deck {

	init(state) {
		this.files = []
		
		this.hookIn("onFileOpen", (finfo) => {
			
			let opts = EditorView.getEditorOptions(finfo.name, finfo.ext)
			
			if(!opts)
				throw new Error(`Tried to open file${ext} without options declared`)
			
			if(opts.readData) {				
				fs.readFile(finfo.path, 'utf8', (err, data) => {
					if(err)
						throw `Failed to read file in EditorView (${err})`
					
					this.openFileInModule(finfo, opts, data)
					hook.exec("onFileOpened", finfo)
					hook.exec("onFileShow", finfo)
				})
			}
			else {
				this.openFileInModule(finfo, opts)
				hook.exec("onFileOpened", finfo)
				hook.exec("onFileShow", finfo)
			}
			
			// prevent furthur event execution
			return true
		})

		this.hookIn("onFileShow", (file) => {
			this.showFile(file)
		})
		
		this.hookIn("closeOpenedFile", (file) => {
			let idx = this.getFileIndex(file)

			if(idx === -1)
				return false
			
			let child = this.children[idx]
			
			this.unregisterChild(child)
			
			return true
		})
		
		for(let i = 0; i < _dumped_editors.length; i++) {
			this.registerFile(_dumped_editors[i].file, _dumped_editors[i])
			this.registerChild(_dumped_editors[i])
		}
		
		hook.exec("onLayoutChange")
		_dumped_editors = []
	}

    openFileInModule(finfo, opts, text) {
        let mdl
		
		mdl = this.source.createModule(opts.mdlAlias)
		this.registerChild(mdl)
		mdl.setup(finfo, opts.mode, text)
		this.showChild(this.getChildIndex(mdl))
		
		this.hookIn("onFileClosed", (finfo) => {
			finfo.editor = null
			finfo.mdl = null
		})
		
		this.registerFile(finfo, mdl)

        return true
    }
	
	registerFile(file, mdl) {
		file.editor = this
		file.mdl = mdl
		
		this.files.push(file)
	}

    hasFile(file) {
        for(let i = 0; i < this.files.length; i++)
            if(this.files[i] === file)
                return true

        return false
    }

    getFileIndex(file) {
        for(let i = 0; i < this.files.length; i++)
            if(this.files[i] === file)
                return i

        return -1
    }
	
	showFile(file) {
		let idx = this.getChildIndex(file.mdl)

		if(idx === -1)
			return
		
		this.showChild(idx)
		this.shownFile = file
	}
	
	onChildShow(idx) {
		this.children[idx].onFocus()
	}
	
	onClose() {
		for(let i = 0; i < this.files.length; i++)
			this.files[i].editor = null
		
		// rescue submodules into global buffer (probably a global array, to prevent extra serialization)
		for(let i = 0; i < this.children.length; i++) {
			document.getElementById("submod-buffer").appendChild(this.children[i].root)
			_dumped_editors.push(this.children[i])
		}
	}
	
	static getEditorOptions(name, ext) {
		// the readData property tells the EditorView
		// weather to read out the file contents and then setup
		// the module with the data as parameter
		let opts = { readData: true }
		
		switch(ext){
            case ".c":
				opts.mdlAlias = "texteditor"
				opts.mode = "ocscript"
            break
            case ".txt":
				opts.mode = "text"
				
				if( name === "DefCore.txt" ||
					name === "Scenario.txt" ||
					name === "ParameterDefs.txt" ||
					name === "Teams.txt" ||
					name === "Particle.txt" ||
					name === "Objects.txt" ||
					name === "PlayerControls.txt"
				)
					opts.mode = "ini"
				
                opts.mdlAlias = "texteditor"
            break
			case ".glsl":
				opts.mode = "glsl"
                opts.mdlAlias = "texteditor"
            break
			case ".material":
                opts.mode = "txt"
                opts.mdlAlias = "texteditor"
            break
			case ".ocm":
                opts.mode = "ini"
                opts.mdlAlias = "texteditor"
            break
			
			case ".jpg":
			case ".jpeg":
			case ".png":
			case ".bmp":
				opts.mdlAlias = "imagepreview"
				opts.readData = false
			break
			
			default:
				return null
        }
		
		return opts
	}
	
	static isEditableExt(ext) {
		if( ext === ".c" ||
			ext === ".txt" ||
			ext === ".ocm" ||
			ext === ".glsl" ||
			ext === ".jpg" ||
			ext === ".jpeg" ||
			ext === ".png" ||
			ext === ".bmp" ||
			ext === ".material")
			return true
		
		return false
	}
}

EditorView.def = {
	alias: "editor",
	className: EditorView,
	title: "Editor"
}

layout.setModuleDef(EditorView.def)

let _dumped_editors = []