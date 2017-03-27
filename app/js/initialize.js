

/**
 * This function restores the predefined layout, to allow users to get back
 * to viable layout if the customized one failed to any sort of bugs (e.g. failing to load old state or accidently rumping it up)
*/
function resetLayout(byUser) {	
	lyt = layout.Layout.fromData([{
		alias: "page", children: [{
			alias: "flexer",
			dir: layout.DIR_COL,
			size: window.innerWidth/3 + "px",
			children: [{
				alias: "navigator",
				size: window.innerHeight/3 + "px"
			}, {
				alias: "explorer",
				size: ""
			}]
		}, {
			alias: "flexer",
			dir: layout.DIR_COL,
			size: "",
			children: [{
				alias: "editor",
				size: window.innerHeight/3*2 + "px"
			}, {
				alias: "console",
				size: ""
			}]
		}]
	}])[0]
	let mwrapper = document.getElementById("mod-wrapper")
	mwrapper.innerHTML = ""
	mwrapper.appendChild(lyt.root)
	
	warn("Default layout used (Forced by user: " + (byUser || "false") + ")")
}

let currentEditorMod, _focussedRes

let lyt

{
	/**
		Initializing block.
		This does take care of basic ui layout binding and reads out
		layout preferences.
	*/
	log("initialize...")	
	log("Node version: " + process.versions.node)
	log("Chromium version: " + process.versions.chrome)
	log("Electron version: " + process.versions.electron)
	log("Arch: " + process.arch)
	
	hook.in("onCurrEditorSet", (mod, res) => {
		currentEditorMod = mod
	})
	
	document.getElementById("tb-file").addEventListener("click", function(e) {
		let rect = this.getBoundingClientRect()
		new Contextmenu(rect.left, rect.bottom, [{
				label: "Open file",
				onclick: _ => openFilePicker()
			}, {
				label: "Save ...",
				onclick: _=> {}
				}, {
				label: "Save all",
				onclick: _=> {}
		}])
	})
	
	document.getElementById("minimizeWindow").addEventListener("click", _ => remote.getCurrentWindow().minimize())
	document.getElementById("toggleWindowMode").addEventListener("click", _ => {
		let win = remote.getCurrentWindow()
		
		if(win.isMaximized())
			win.unmaximize()
		else
			win.maximize()
	})
	document.getElementById("closeWindow").addEventListener("click", _ => remote.getCurrentWindow().close())
	
	// window controls
	
	document.ondragover = document.ondrop = (e) => {
		e.preventDefault()
	}

	document.body.ondrop = (e) => {
		let files = e.dataTransfer.files
		
		for(let i = 0; i < files.length; i++)
			receiveLocalResource(files[i].path)
		
		e.preventDefault()
	}
	/*
	document.getElementById("c4GroupPath").innerHTML = getConfig("c4group") || "not set"
	
	document.getElementById("c4GroupPicker").onchange = function(e) {
		let p = this.files[0].path
		
		if(path.basename(p).match(/^c4group/gi)) {
			setConfig("c4group", p)
			document.getElementById("c4GroupPath").innerHTML = p
		}
	}
	
	document.getElementById("ocExePath").innerHTML = getConfig("ocexe") || "not set"
	
	document.getElementById("ocExePicker").onchange = function(e) {
		let p = this.files[0].path
		
		if(path.basename(p).match(/^openclonk/gi)) {
			setConfig("ocexe", p)
			document.getElementById("ocExePath").innerHTML = p
			
			// start openclonk for a very short time and extract
			// version number from stdout
			var cp = cprocess.spawn(p, [`--editor`])
			var _inittime = (new Date()).getTime()
			
			cp.stdout.on('data', function (data) {
				let m = data.toString().match(/Version:\s*(.*?)\s/)
				if(m && m[1]) {
					setConfig("ocver", m[1])
					document.getElementById("version-input").value = m[1]
					cp.kill()
				} // if things did not happen as expected and reach 100ms, stop try
				else if((new Date()).getTime() - _inittime > 100)
					cp.kill()
			})
		}
	}*/
	
	// setting up settings-page visibilty toggle
	document.getElementById("sett-page-toggle").addEventListener("click", function () {
		let Dialog_SelectWorkspace = require(path.join(__rootdir, "js", "dialogs", "settings.js"))
		new Dialog_SelectWorkspace(800, 600)
	})
	
	try {
		if(!config)
			throw "No config given"
		
		let pages = config.get("pages")
		lyt = layout.Layout.fromData(pages)[0]
		document.getElementById("mod-wrapper").appendChild(lyt.root)
	}
	catch(e) {
		error(`Failed to restore layout from config (${e})`)
		resetLayout()
		
		// TODO: inform user
	}
	
	window.addEventListener("beforeunload", _ => {
		config.set("pages", [lyt.getLayoutInfo()])
	})
	
	require("./js/keybinding.js")
	
	requestAnimationFrame(_ => {
		require(path.join(__rootdir, "js", "logo.js"))(document.getElementById("logo"), 20)
	})
	
    log("end of initialize")
	
	window.addEventListener("beforeunload", _ => config.save())
}

function setTextEditorFontSize(val) {
	// delegate new value
	// don't use instance of, but check for equal alias since instanceof would throw
	// an error if such a class is not defined
	let mdls = lyt.getModulesSet()
	for(let mdl of mdls)
		if(mdl.constructor.def.alias === "texteditor")
			mdl.setFontSize(val)
}

/**
	opens the file-picker dialog and executes the given callback on completion
*/
function pickFile(callback) {
	let el = document.getElementById("filepicker")
	
	el.onchange = callback
	el.click()
}

function receiveLocalResource(p) {
	let name = path.basename(p),
		ext = path.extname(p)
	
	if(name.match(/^c4group/gi))
		return config.set("c4group", p)
	else if(name.match(/^openclonk/gi))
		return config.set("ocexe", p)
	
	wmaster.openFileByPath(p)
}

function insertTemplateSpecials(s) {
	let author = config.get("author")
	
	return s.replace(/<<\$(.*?)>>/gi, function(m, p1) {
		if(p1 === "author")
			return author
		
		return m
	})
}

function reloadCss() {
	require('./js/sass_processor.js').parseScss()
}

function save() {
	if(!currentEditorMod)
		return
	
	currentEditorMod.save()
}

function openFilePicker() {
	dialog.showOpenDialog((fileNames) => {
        if(fileNames !== undefined)
			for(let i = 0; i < fileNames.length; i++)
				receiveLocalResource(fileNames[i])
	})
}

// checks weather "ocexe" is set in configs,
// to indicate that we can give operations to it (e.g. running the game)
function hasOcRunnable() {
	return config.get("ocexe")
}

// checks weather "c4group" is set in configs,
// to indicate that we can give operations to it (e.g. unpacking, ...)
function hasC4group() {
	return config.get("c4group")
}

/** ui object containing small layout items to fill any page */
var ui = {
	urlPicker: function(txt = "...", callback) {
		let el = Elem.fromString(`<div class="flex-row"><p class="url flex-fill">${txt}</p><div class="url-browse">Browse</div></div>`)
		
		el.getElementsByClassName("url-browse")[0].addEventListener("click", _ => {
			let p = remote.dialog.showOpenDialog({
				properties: ['openDirectory']
			})
			
			if(!p)
				return
			
			el.getElementsByClassName("url")[0].innerHTML = p[0]
			
			if(callback)
				callback(p[0])
		})
		
		return el
	}
}

let editor_proc

function runOCEditor(args) {
	if(!editor_proc) {
		if(args)
			editor_proc = cprocess.spawn(config.get("ocexe"), [`--editor`, ...args])
		else
			editor_proc = cprocess.spawn(config.get("ocexe"), [`--editor`])
		
		editor_proc.stdout.on('data', function (data) {
			hook.exec("onStdOut", ConsoleView.validateStdout(data.toString()))
		})
		
		editor_proc.on('exit', function (code) {
			editor_proc = false
		})
	}
}

/**
Commands: -l List
          -x Explode
          -u Unpack
          -p Pack
          -t [filename] Pack To
          -y [ppid] Apply update (waiting for ppid to terminate first)
          -g [source] [target] [title] Make update
          -s Sort

Options:  -v Verbose -r Recursive
          -i Register shell -u Unregister shell
          -x:<command> Execute shell command when done

Examples: c4group pack.ocg -x
          c4group update.ocu -g ver1.ocf ver2.ocf New_Version
          c4group -i
*/

function runC4Group(args, fListenStdOut, callback) {
	if(!args)
		return false
	
	let proc = cprocess.spawn(config.get("c4group"), args)
	
		
	if(fListenStdOut) {
		proc.stdout.on('data', function (data) {
			hook.exec("onStdOut", Console.validateStdout(data.toString()))
		})
	}
	
	proc.on('exit', function (code) {
		if(callback)
			callback(code)
	})
	
	return true
}