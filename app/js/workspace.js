let LinkedTree = require(path.join(__dirname, "js/lib/linkedtree.js"))

/**
	The WorkspaceMaster manages and stores the single Workspace instances
	and handles opening single files.
*/
class WorkspaceMaster {
	constructor() {
		this.wspaces = []
		
		// restore workspaces by config
		let a = config.get("workspaces")
		
		if(a)
			a.forEach(this.addWorkspace.bind(this))
		
		this.opened = []
		
		this.viewOpened = require(path.join(__rootdir, "js", "lib", "navilist.js"))
		
		// remove finfo from file opened list
		hook.in("onFileClosed", (finfo) => {
			removeArrayItem(this.opened, finfo)
		})
	}
	
	/**
		Opens a file in editor
		@param {FileInfo} finfo - FileInfo Object to open
		@return {boolean} returns weather the file is already opened
	*/
	openFile(finfo) {
		// don't try to open directories
		if(finfo.stat.isDirectory())
			return false
		
		// check if this file allowed to be opened in our app
		if(!WorkspaceMaster.isEditableExt(finfo.ext))
			return false
		
		if(this.fileOpened(finfo.path)) {
			hook.exec("onOpenedFileSelect", finfo)
			return true
		}
		
		this.viewOpened.add(finfo)
		hook.exec("onFileOpen", finfo)
		
		return false
	}
	
	/**
		Checks if a file of the given path
		is already opened
		@param {string} p - path to check
	*/
	fileOpened(p) {
		let finfos = this.viewOpened.getValues()
		for(let finfo of finfos)
			if(finfo.path === p)
				return true
		
		return false
	}
	
	/**
		Returns the opened files
	*/
	getOpenedFiles() {
		// return this.opened
	}
	
	/**
		Opens a file by its path.
		If the file is already opened, an event is emitted to it instead.
		@param {string} p - The path of the file to open
	*/
	openFileByPath(p) {
		// check if file of this path is already opened
		let finfo = this.fileOpened(p)
		
		if(finfo) {
			hook.exec("onFileShow", finfo)
			return
		}
		
		// otherwise create FileInfo and open the file
		fs.stat(p, (err, stat) => {
			if(err)
				throw err
			
			finfo = new FileInfo(p, stat)
			this.opened.push(finfo)
			hook.exec("onFileOpen", finfo)
		})
	}
	
	/**
		Returns a copy of the internal workspace holder
		@return {array} - Array of Workspace instances
	*/
	getWorkspaces() {
		return this.wspaces.slice()
	}
	
	/**
		Creates a workspace directing to the given path
		@param {string} p - The path to create a workspace from
	*/
	addWorkspace(p) {
		let idx = this.wspaces.length
		let ws = new Workspace(p, idx)
		this.wspaces.push(ws)
		
		return ws
	}
	
	/**
		Stores paths of workspaces into thhe json config file
	*/
	saveInConfig() {
		let a = []
		
		for(let i = 0; i < this.wspaces.length; i++)
			a.push(this.wspaces[i].path)
		
		config.set('workspaces', a)
	}
	
	/**
		Returns the index of the given workspace
		@param {Workspace} workspace - Workspace instead to look for
	*/
	getIndexOf(workspace) {
		for(let i = 0; i < this.wspaces.length; i++)
			if(workspace === this.wspaces[i])
				return i
		
		return -1
	}
	
	/**
		Returns a workspace identified by its index
		@param {number} idx- Index of the workspace
	*/
	getWorkspace(idx) {
		return this.wspaces[idx]
	}
	
	/**
		Removes a workspace
		@param {Workspace} wspace - the workspace instance to remove
	*/
	removeWorkspace(wspace) {
		if(!wspace)
			return
		
		wspace.onRemove()
		removeArrayItem(this.wspaces, wspace)
		
		this.saveInConfig()
	}
	
	/**
		Checks if the given extension is one, that we want
		to open in an EditoView
		@param {string} ext - Extension to check. Must have preceding "."
	*/
	static isEditableExt(ext) {
		if( ext === ".c" ||
			ext === ".txt" ||
			ext === ".ocm" ||
			ext === ".glsl" ||
			ext === ".material")
			return true
		
		return false
	}
}

/**
	A Workspace instance holds information about a specific folder on the user's drive
	and collects data about editable components in that folder.
*/

class Workspace {
	constructor(dir_path, idx) {
		this.index = idx
		this.path = dir_path
		// file info storage
		this.finfo = []
		// represents the directory hierarchy with indices for finfo
		this.tree = null
		// holder of indices of opened files
		this.opened = new Set()
		// weather the first execution of loadDirectory has been finished
		this.loaded = false
		
		this.views = new Set()
		
		this.loadDirectory(dir_path, (tree) => {
			this.loaded = true
			wmaster.saveInConfig()
			this.tree = tree
			
			// update views
			for(let view of this.views)
				view.addItem(tree, -1)
		})
	}
	
	/**
		Returns a new WorkspaceView() instance, that gets maintained
		by the workspace object
		@return {WorkspaceView}
	*/
	getView() {
		let view = new WorkspaceView(this)
		this.views.add(view)
		
		return view
	}
	
	removeView(view) {
		if(!view)
			return
		
		view.innerHTML = ''
		if(this.views)
			this.views.delete(view)
	}
	
	onRemove() {
		for(let view of this.views)
			view.root.innerHTML = ""
		
		this.views = null
	}
	
	/**
		Loads data of a directory into internal file info holder
		and invokes a callback with a linked tree as paramter, which reperesents the file hiearchy
		@param {string} dir_path Path of the directory
		@param {function} callback - Callback that gets called when loading has finished.
				Takes a LinkedTree as argument holding the hierarchy of the files
				represented by the indices of their FileInfo objects.
	*/
	loadDirectory(dir_path, callback) {
		// collect directory information
		fs.readdir(dir_path, (err, files) => {
			if(err) {
				error( "Could not list the directory.", err )
				return
			}
			
			// make a recursive call to iterate all directories and fill in the linked tree
			let fn = (files, dir, tree) => {
				for(let i = 0; i < files.length; i++) {
										
					let p = path.join(dir, files[i])
					
					let stat = fs.statSync(p)
					if(!stat || !(stat.isDirectory() || Workspace.isAcceptedFileType(path.extname(files[i]))))
						continue
					
					// add information about the file to local info holder
					// and save its array index into the linked tree
					let idx = this.addFileInfo(new FileInfo(p, stat, files[i]))
					let branch = new LinkedTree(idx)
					tree.addChild(branch)
					
					// subdirectory to take a look into
					if(stat.isDirectory()) {
						
						let subdir = path.join(dir, files[i])
						
						let items = fs.readdirSync(subdir)
						
						if(items)
							fn(items, subdir, branch)
						
						// if there are no valid files found in subdirectory,
						// still assign an Array to branch, so it gets recoginized as
						// a parent tree item
						if(!branch.children)
							branch.children = []
						// otherwise sort in an clonk typical manner
						else
							branch.children = this.sortFileIndicesByExt(branch.children)
					}
				}
			}
			
			let tree = new LinkedTree("root")
			fn(files, dir_path, tree)
			tree.children = this.sortFileIndicesByExt(tree.children)
			
			if(callback)
				callback(tree)
		})
	}
	
	/**
		Similar to loadDirectory() but with a single target
		@param {string} p - path to file/directory
		@param {number} parIdx - index of parent FileInfo object
	*/
	loadFile(p, parIdx) {
		if(parIdx < -1)
			throw new Error("loadFile parent index is not a valid input")
		
		fs.stat(p, (err, stat) => {
			if(err)
				return
			
			let branch = this.tree.getElementByVal(parIdx)
			if(!branch)
				branch = this.tree
			
			let idx = this.addFileInfo(new FileInfo(p, stat))
			let tree = new LinkedTree(idx)
			
			branch.addChild(tree)
			// update views
			for(let view of this.views)
				view.addItem(tree, parIdx)
		})
	}
	
	/**
		Deletes a file or folder with all its descendants
		@param {number} idx - Index of the FileInfo instance, which is to delete
	*/
	removeFile(idx) {
		// sanity check
		if(!this.finfo[idx])
			return
		
		fs.remove(this.finfo[idx].path, e => {
			this.finfo[idx] = undefined
			// detach from tree
			let branch = this.tree.removeElementOfVal(idx)
			// dereference any file info object, which is referenced by the descendants
			// of branch
			branch.forEach((idx) => {
				this.finfo[idx] = undefined
			})
			
			for(let view of this.views)
				view.removeItem(idx)
		})
	}
	
	/**
		Executes the c4group application to unpack a file
		@param {number} idx - FileInfo index
	*/
	packFile(idx) {
		// command the c4group(.exe) to unpack our targeted file
		runC4Group([this.finfo[idx].path, "-p"], false, () => {
			// find element in tree
			let branch = this.tree.getElementByVal(idx)
			// remove all file infos referenced by the found element's children
			branch.forEach((val) => {
				this.finfo[val] = undefined
			})
			// detach children from element
			branch.removeChildren()
			// update file info
			this.finfo[idx].updateSync()
			// update workspace views
			for(let view of this.views)
				view.replaceItem(idx, branch)
		})
	}
	
	/**
		Executes the c4group executable to unpack the file, given by the index
		of the local file info holder
		@param {number} idx - FileInfo index
	*/
	unpackFile(idx) {
		runC4Group([this.finfo[idx].path, "-u"], false, () => {
			// branch to update
			let branch = this.tree.getElementByVal(idx)
			
			let unpack_dir = this.finfo[idx].path
			this.loadDirectory(unpack_dir, (tree) => {
				// if there are no valid files found in subdirectory,
				// still assign an assign to branch, so it gets recoginized as
				// a parent tree item
				if(!tree.children)
					tree.children = []
				else // otherwise do the cr typical sorting
					tree.children = this.sortFileIndicesByExt(tree.children)
				
				// transfer children
				branch.children = tree.children
				
				// update stat (sync, because we are already in an async thread)
				this.finfo[idx].updateSync()
				
				// update workspace views
				for(let view of this.views)
					view.replaceItem(idx, branch)
			})
		})
	}
	
	/**
		Returns the name of the workspace.
		@return {string} Name of the workspace, otherwise the basename of its path
	*/
	getName() {
		if(!this.name)
			return path.basename(this.path)
		
		return name
	}
	
	/**
		Pushes a FileInfo instance to the internal array and returns
		its index in the array
		@param {FileInfo} finfo - FileInfo instance to add
	*/
	addFileInfo(finfo) {
		let idx = this.finfo.length
		
		this.finfo[idx] = finfo
		
		return idx
	}
	
	getFileInfo(idx) {
		return this.finfo[idx]
	}
	
	/**
		Renames the file of the given index
		@param {number} idx - FileInfo index of the file
		@param {string} fname - New name of the file
	*/
	renameFile(idx, fname) {
		let finfo = this.finfo[idx]
		
		if(!finfo)
			return
		
		let newPath = path.join(path.dirname(finfo.path), fname)
		// check if file already exists
		fs.stat(newPath, (err) => {
			if(err) {
				fs.renameSync(finfo.path, newPath)
				finfo.setPath(newPath)
				finfo.updateSync()
				// update workspace views
				for(let view of this.views)
					view.renameItem(idx, fname)
			}
			else
				alert("Such file already exists.\n${newPath}")
		})
	}
	
	/**
		Moves file to another directory
		@param {number} idx - the index of the FileInfo Object
		@param {number} newParIdx - the index of the FileInfo
				Object of the target directory
	*/
	moveFileTo(idx, newParIdx) {
		let newPar = this.tree.getElementByVal(newParIdx)
		
		if(!newPar)
			throw new Error("moveFileTo has undefined parent target")
		
		let branch = this.tree.getElementByVal(idx)
		branch.parent.removeChild(branch)
		
		newPar.addChild(branch)
		
		// and do the sorting stuff
		newPar.children = this.sortFileIndicesByExt(newPar)
		
		/*
		for(let view of this.views)
			
		*/
	}
	
	/**
		Checks weather the given extension is editable and
		can therefore be opened in the editor frame
		@param {string} ext - Extension to check. Requires preceding "."
	*/
	static isAcceptedFileType(ext) {
		
		if(config.get("hidenonocfiles") === false)
			return true
		
		switch(ext) {
			case ".png":
			case ".jpg":
			case ".jpeg":
			case ".bmp":
			case ".ogg":
			case ".wav":
			case ".ocf":
			case ".ocd":
			case ".ocg":
			case ".ocs":
			case ".txt":
			case ".glsl":
			case ".c":
				return true;
			default:
				return false;
		}
	}
	
	/**
		Returns a score for file extensions, indicating where to place
		them in file hierarchy. The highigher a score is, the higher its meant
		to be placed in difference to others.
		@param {string} ext - Extension to get the score of. Requires preceding "."
		@return {number} The score of the extension
	*/
	static getExtSortValue(ext) {
		switch(ext) {
			case ".ocf":
			return 15
			case ".ocg":
			return 10
			case ".ocd":
			return 1
			
			default:
			return 5
		}
	}
	
	/**
		Sorts an array of LinkedTrees with file indices as their values
		by their corresponding extension (cr editor sorting)
		@param {array} fa - Array of LinkedTree to sort
		@return {array} Sorted array of LinkedTrees
	*/
	sortFileIndicesByExt(fa) {
		if(!fa)
			return fa
		
		// copy input to not corrupt things outside this function
		fa = fa.slice()
		let a = []
		
		for(let q = 0; q < fa.length; q++) {
			let lowest
			let value = 0
			for(let i = 0; i < fa.length; i++) {
				let branch = fa[i]
				// ignore deleted entries
				if(branch !== null) {
					let val = Workspace.getExtSortValue(this.finfo[branch.value].ext)
					if(val > value) {
						lowest = i
						value = val
					}
				}
			}
			
			a.push(fa[lowest])
			// delete item from source list
			fa[lowest] = null
		}
		
		return a
	}
	
	/**
		Checks if the given file extension is allowed to be
		packed by the c4group
	*/
	static isOcPackable(ext) {
		if( ext === ".ocs" || 
			ext === ".ocd" ||
			ext === ".ocf" ||
			ext === ".ocg")
			return true
		
		return false
	}
	
	// TODO: watcher: detecting removal or change of opened files and inform user (n++ style)
	// (and show newly added files, could be checked when window gets the focused)
}

// create a global instance
var wmaster = new WorkspaceMaster()

/**
	The file info class represents single files in a workspace, containing
	the most basic information of their files.
	The stat property, containg the result from from fs.stat* may not be up-to-date.
	Therefor you can use update() and updateSync() to achieve that.
*/
class FileInfo {
	/**
		@param {string} p - The path of the file
		@param {Stat} stat - The stat object returned by fs.stat*()
		@param {string} name - Name of the file. Can be omitted.
	*/
	constructor(p, stat, name) {
		this.path = p
		this.stat = stat
		this.name = name || path.basename(p)
		this.ext = path.extname(this.name)
	}
	
	/**
		Sets the and updates name and ext property based
		on that path
		@param {string} p - Path to the file
	*/
	setPath(p) {
		this.path = p
		this.name = path.basename(p)
		this.ext = path.extname(this.ext)
	}
	
	/**
		Updates the stat property by calling fs.statSync()
	*/
	updateSync() {
		this.stat = fs.statSync(this.path)
	}
	
	/**
		Updates the stat property given by fs.stat() asynchronously
		and invokes the given callback afterwards with the
		FileInfo instance as argument
	*/
	update(callback) {
		fs.statSync(this.path, (stat) => {
			this.stat = stat
			
			if(callback)
				callback(this)
		})
	}
}

class WorkspaceView {
	constructor(wspace) {
		this.wspace = wspace
		
		this.root = document.createElement("div")
		
		// indexed by their corresponding finfo index
		// in workspace object
		this.entries = []
		this.items = []
		this.rootItem = new WorkspaceViewRootItem(this.root)
		
		this.selected = []
		
		if(wspace.tree)
			this.addItem(wspace.tree, -1)
	}
	
	addItem(tree, parIdx) {
		// ignore root element
		if(tree.value === "root") {
			for(let i = 0; i < tree.children.length; i++)
				this.addItem(tree.children[i], parIdx)
			return
		}
		
		let idx = tree.value
		let finfo = this.wspace.finfo[idx]
		let root = this.createViewItem(idx, finfo, tree.children ? true : false)
		
		if(parIdx === -1)
			root.setParent(this.rootItem)
		else
			root.setParent(this.items[parIdx])
		
		this.items[idx] = root
		
		let rec = (children, par) => {
			for(let i = 0; i < children.length; i++) {
				let child = children[i]
				let idx = child.value
				let finfo = this.wspace.getFileInfo(idx)
				let item = this.createViewItem(idx, finfo, child.children ? true : false)
				item.setParent(par)
				
				this.items[idx] = item
				
				if(child.children)
					rec(child.children, item)
			}
		}
		
		if(tree.children)
			rec(tree.children, root)
	}
	
	createViewItem(idx, finfo, isDir) {
		let item = new WorkspaceViewItem(idx, finfo, isDir)
		item.bindEventHandlers(this)
		
		return item
	}
	
	selectItem(item, multiSelect) {
		if(!multiSelect)
			this.deselectItems(item)
		
		this.selected.push(item)
		
		item.onSelect()
		
		// loose active
		if(this.activeItem)
			this.activeItem.onBlur()
		
		this.activeItem = item
		item.onFocus(item)
	}
	
	deselectItem(item) {
		removeArrayItem(this.selected, item)
		item.onDeselect()
		
		// if the item was active set it to the most recent element
		if(item.hasFocus()) {
			item.onBlur()
			
			if(this.selected.length) {
				let active = this.selected[this.selected.length - 1]
				active.onFocus()
				this.activeItem = active
			}
			else
				this.activeItem = null
		}
	}
	
	deselectItems() {
		for(let i = 0; i < this.selected.length; i++)
			this.selected[i].onDeselect()
		
		this.selected = []
		
		if(this.activeItem)
			this.activeItem.onBlur()
		
		this.activeItem = null
	}
	
	getNextValidDirectoryElement(el) {
		if(Elem.hasClass(el, "tree-parent"))
			return el
		
		el = el.parentNode
		if(Elem.hasClass(el, "tree-children"))
			return el.parentNode
		else
			return null
	}
	
	renameItem(idx, newName) {
		let item = this.items[idx]
		if(!item)
			throw new Error("Trying to rename unknown WorkspaceView entry")
		
		item.rename(newName)
	}
	
	removeItem(idx) {
		let item = this.items[idx]
		if(!item)
			throw new Error("Trying to remove unknown WorkspaceView entry")
		
		removeArrayItem(this.items, item)
		item.onRemove()
	}
	
	replaceItem(idx, tree) {
		let item = this.items[idx]
		if(!item)
			throw new Error("Trying to remove unknown WorkspaceView entry")
		
		let parIdx = item.getParent().idx
		
		// remove old
		this.removeItem(idx)
		
		// create new item
		this.addItem(tree, parIdx)
	}
	
	getTreeMenuProps(item, nextDirItem) {
		let props = []
		
		// get file info from workspace
		// explicit parse as integer, for the linked tree compares with ===
		let finfo = this.wspace.finfo[item.idx]
		
		// add run option for scenarios
		if(finfo.ext === ".ocs")
			props.push({
				label: "Run",
				icon: "icon-play",
				onclick: _ => runOCEditor([finfo.path]),
				onvalidate: _ => hasOcRunnable()
			})
		
		props.push({
			label: "New file",
			icon: "icon-plus",
			onclick: _ => {
				let dirEl = this.getNextValidDirectoryElement(par)
				let idx, tpath
				if(!dirEl) {
					idx = -1
					tpath = this.wspace.path
				}
				else {
					idx = dirEl.dataset.value
					tpath = this.wspace.finfo[idx].path
				}
				
				this.newFileDialog(tpath, idx || -1)
			}
		})
		
		// add unpack/pack commands
		if(Workspace.isOcPackable(finfo.ext)) {
			props.push({
				label: "Pack",
				icon: "icon-pack",
				onclick: _ => { this.wspace.packFile(item.idx) },
				onvalidate: _ => hasC4group() && finfo.stat.isDirectory()
			})
			props.push({
				label: "Unpack",
				icon: "icon-unpack",
				onclick: () => { this.wspace.unpackFile(item.idx) },
				onvalidate: _ => hasC4group() && !finfo.stat.isDirectory()
			})
		}
		
		props.push({
			label: "Rename",
			icon: "icon-pencil",
			onclick: () => {
				let Dialog_Rename = require(path.join(__rootdir, "js", "dialogs", "rename.js"))
				new Dialog_Rename(300, 150, finfo.name, (result) => {
					// check for valid file name
					if(result && typeof result === "string" && result !== finfo.name)
						this.wspace.renameFile(item.idx, result)
				})
			}
		})
		
		props.push({
			label: "Delete",
			icon: "icon-trashbin",
			onclick: _ => {this.wspace.removeFile(item.idx)}
		})
		
		return props
	}
	
	/**
		Opens a dialog to create a new file from template
		@param {tpath} path of the directory where the new file will be created
		@param {parentfIndex} file index of the directory in which the file
			shall be placed (-1 for root)
	*/
	newFileDialog(tpath, parentfIndex) {
		let Dialog_NewFile = require(path.join(__rootdir, "js", "dialogs", "newfile.js"))
		new Dialog_NewFile(500, 300, tpath, (result) => {
			if(!result)
				return
			
			if(typeof result === "string") {
				this.wspace.loadFile(result, parentfIndex)
			}
		})
	}
}

class WorkspaceViewItem {
	constructor(idx, finfo, isDir) {
		this._par = null
		this.finfo = finfo
		this.idx = idx
		
		let el = document.createElement("div")
		el.className = "tree-item"
		el.innerHTML = `<div class="tree-label">${this.parseLabelName(finfo.name)}</div><div class="tree-children"></div>`
		
		if(isDir) {
			el.className += " tree-parent tree-collapsed"
			el.firstChild.addEventListener('dblclick', (e) => {
				Elem.toggleClass(el, 'tree-collapsed')
			})
		}
		
		this.isDir = isDir
		this.el = el
		this.childrenEl = el.lastChild
	}
	
	update(idx, finfo) {
		this.idx = idx
		this.finfo = finfo
	}
	
	getParent() {
		return this._par
	}
	
	setParent(newPar) {
		if(newPar === this._par)
			return
		
		newPar.childrenEl.appendChild(this.el)
		
		this._par = newPar
	}
	
	parseLabelName(fname) {
		return fname.replace(/(\.[^.]+?$)/, `<span style="color: grey">$1</span>`)
	}
	
	rename(fname) {		
		this.el.firstChild.innerHTML = this.parseLabelName(fname)
	}
	
	onRemove() {
		this.el.parentNode.removeChild(this.el)
	}
	
	onSelect() {
		Elem.addClass(this.el, "tree-selected")
	}
	
	onDeselect() {	
		Elem.removeClass(this.el, "tree-selected")
	}
	
	onFocus() {
		Elem.addClass(this.el, "tree-active")
		this.focused = true
	}
	
	onBlur() {
		Elem.removeClass(this.el, "tree-active")
		this.focused = false
	}
	
	hasFocus() {
		return this.focused
	}
	
	isRootItem() {
		return false
	}
	
	bindEventHandlers(wview) {
		// get label element
		let label = this.el.firstChild
		
		// select on single click
		label.addEventListener("mousedown", (e) => {
			if(Elem.hasClass(this.el, "tree-selected") && e.ctrlKey)
				wview.deselectItem(this)
			else
				wview.selectItem(this, e.ctrlKey)
		})
		
		// open editable files; expand/collapse directories on dblclick
		label.addEventListener("dblclick", (e) => {
			let finfo = wview.wspace.finfo[this.idx]
			
			if(Elem.hasClass(this.el, "tree-parent"))
				return
			
			// open file
			if(WorkspaceMaster.isEditableExt(finfo.ext))
				wmaster.openFile(finfo)
		})
		
		// attach contextmenu on right click
		label.addEventListener("contextmenu", (e) =>  {
			wview.selectItem(this, false)
			new Contextmenu(e.pageX, e.pageY, wview.getTreeMenuProps(this))
		})
		
		// dragging elements
		label.draggable = true
		
		label.addEventListener("dragstart", e => {
			isDragging = true
		})
		
		label.addEventListener("dragend", e => {
			isDragging = false
		})
		
		label.addEventListener("drop", e => {log("dragend")
			if(currentDropTarget)
				Elem.removeClass(currentDropTarget, "droptarget")
			
			// don't react on non workspace drag events
			if(!isDragging)
				return
			// and also check for operations to be only within the same workspace
			// (for now)
			if(wview.wview.index !== sourcewview)
				return
			else
				wview.wview.moveFileTo(sourceFileIndex, this.idx)
			
			isDragging = false
			
			// claim event
			e.preventDefault()
			e.stopPropagation()
		})
		
		label.addEventListener("dragenter", e => {
			if(!isDragging)
				return
			
			let par = wview.getNextValidDirectoryElement(this.el)
			if(!par)
				par = wview.root
			
			//check if anything has changed
			if(currentDropTarget === par)
				return
			
			currentDropTarget = par
			Elem.addClass(par, "droptarget")
		})
		
		label.addEventListener("dragleave", e => {
			if(!isDragging)
				return
			
			let par = wview.getNextValidDirectoryElement(this.el)
			if(!par)
				par = wview.root
			
			// check if anything has changed
			if(currentDropTarget === par)
				return
			
			Elem.removeClass(par, "droptarget")
		})
	}
}

class WorkspaceViewRootItem {
	constructor(el) {
		this.childrenEl = el
		this.idx = -1
	}
	
	isRootItem() {
		return true
	}
}