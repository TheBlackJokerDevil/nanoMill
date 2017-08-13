let LinkedTree = require(path.join(__dirname, "js/lib/linkedtree.js"))

// maximum amount of tree recursion
// implement this properly as depth parameter
// not bare counter
const MAX_RECURSION = 100

/**
	The WorkspaceMaster manages and stores the single Workspace instances
	and handles opening single files.
*/
class WorkspaceMaster {
	constructor() {
		this.wspaces = []
		// file info holder
		this.finfo = []
		
		// restore workspaces by config
		let a = config.get("workspaces")
		
		if(a)
			a.forEach(v => this.addWorkspace(v.path, v.name))
		
		this.opened = []
		
		this.viewOpened = require(path.join(__rootdir, "js", "lib", "navilist.js"))
		
		// remove finfo from file opened list
		hook.in("onFileClosed", (finfo) => {
			removeArrayItem(this.opened, finfo)
		})
		
		// storage of information to drag files
		// around and across workspaces
		this.dragStorage = null
		
		// holder of FileInfo indices for Copy/Cut/Paste
		this.clipboardData = null
		// holder of Fileinfo indices for file drag'n'drop
		this.dragCache = null
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
	
	removeFileInfo(idx) {
		this.finfo[idx] = undefined
	}
	
	/**
		Deletes a file or folder with all its descendants
		@param {number} idx - Index of the FileInfo instance, which is to delete
	*/
	removeFile(idx) {
		// sanity check
		if(!this.finfo[idx])
			return
	
		fs.remove(this.finfo[idx].path)
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
			hook.exec("onFileShow", finfo)
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
	fileOpened(p) {log()
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
		@param {string} name - A name to identify to workspace by the user
	*/
	addWorkspace(p, name) {
		let idx = this.wspaces.length
		let ws = new Workspace(p, idx, name)
		this.wspaces.push(ws)
		
		// save workspace across sessions
		this.saveInConfig()
		
		return ws
	}
	
	/**
		Stores paths of workspaces into thhe json config file
	*/
	saveInConfig() {
		let a = []
		
		for(let i = 0; i < this.wspaces.length; i++)
			a.push({
				path: this.wspaces[i].path,
				name: this.wspaces[i].getName()
			})
		
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
		Executes the c4group application to unpack a file
		@param {number} idx - FileInfo index
	*/
	packFile(idx) {
		// command the c4group(.exe) to unpack our targeted file
		runC4Group([this.finfo[idx].path, "-p"], false, () => {
			// update file info
			this.finfo[idx].updateSync()
		})
	}
	
	/**
		Executes the c4group executable to unpack the file, given by the index
		of the local file info holder
		@param {number} idx - FileInfo index
	*/
	unpackFile(idx) {
		runC4Group([this.finfo[idx].path, "-u"], false, () => {
			// update stat (sync, because we are already in an async thread)
			this.finfo[idx].updateSync()
		})
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
			if(!err)
				alert(`Such file already exists.\n${newPath}`)
			else
				fs.renameSync(finfo.path, newPath)
		})
	}
	
	
	/**
	*/
	
	setClipboardData(data, fCut) {
		this.clipboardData = data
		this.cutOnPaste = fCut
	}
	
	hasClipboardData() {
		return this.clipboardData && this.clipboardData.length
	}
	
	performClipboardPaste(destination) {
		
		if(!this.clipboardData)
			return
		
		let ncp = require('ncp').ncp
		// remember option, as it will get reset before the callbacks
		// of validateFilename() will trigger
		let fCut = this.cutOnPaste
		
		for(let i = 0; i < this.clipboardData.length; i++) {
			let idx = this.clipboardData[i]
			let finfo = this.finfo[idx]
			// don't even try to access outdated FileInfos
			if(!finfo)
				continue
			
			let fileName = path.join(destination, finfo.name)
			
			validateFilename(fileName, validName => {
				// prevent recursive copying
				if(isChildPathOf(validName, finfo.path)) {
					alert("Target-directory is subfolder of source-directory.")
					return
				}
				
				// paste via cut
				if(fCut) {
					// check for obsolete operation
					if(path.dirname(finfo.path) === path.dirname(fileName))
						return
					
					fs.move(finfo.path, validName, err => {
						if(err)
							error(err)
					})
				}
				// paste via copy
				else {
					ncp(finfo.path, validName, function (err) {
						if (err)
							error(err)
					})
				}
			})
		}
		
		this.cutOnPaste = false
	}
	
	setDragCache(idxList) {
		this.dragCache = idxList
	}
	
	isInDragCache(idx) {
		if(!this.dragCache)
			return false
		
		for(let i = 0; i < this.dragCache.length; i++)
			if(this.dragCache[i] === idx)
				return true
		
		return false
	}
	
	performDrag(destIdx) {
		// sanity check
		if(!this.dragCache || !this.dragCache.length)
			return
		
		let destination = path.dirname(this.finfo[destIdx].path)
		
		for(let i = 0; i < this.dragCache.length; i++) {
			let idx = this.dragCache[i]
			let finfo = this.finfo[idx]
			// don't even try to access outdated FileInfos
			if(!finfo || destination === path.dirname(finfo.path))
				continue
			
			let fileName = path.join(destination, finfo.name)
			
			validateFilename(fileName, validName => {
				// prevent recursive copying
				if(isChildPathOf(validName, finfo.path)) {
					alert("Target-directory is subfolder of source-directory.")
					return
				}
				
				fs.move(finfo.path, validName, err => {
					if(err)
						error(err)
				})
			})
		}
	}
	
	/**
		Checks if the given extension is one, that we want
		to open in an EditoView
		@param {string} ext - Extension to check. Must have preceding "."
	*/
	static isEditableExt(ext) {
		return EditorView && EditorView.isEditableExt(ext)
	}
}

class Workspace {
	constructor(dir_path, idx, name) {
		this.index = idx
		this.path = dir_path
		this.name = name
		
		this.tree = null
		
		this.views = new Set()
		this.finfo = []
		
		// update workspace entries periodically
		let fn = tree => {
			
			setTimeout(_ => {
				this.updateDirectoryData(fn)
			},
			// respect what the user has as update rate set
			config.get("expUpdateRate"))
		}
		
		this.updateDirectoryData(fn)
	}
	
	updateDirectoryData(callback) {
		// seperate into own thread
		fs.readdir(this.path, (err, files) => {
			if(err) {
				error("Could not read workspace directory.", err)
				return
			}
			
			let changes = {
				changed: false,
				changeset: "",
				count: 0
			}
			
			let onChange = (str) => {
				changes.changeset += str += "\n"
				changes.changed = true
				changes.count++
			}
			
			// counter of recursion depth
			let recCounter = 0
			
			// declare recursive function
			let rec = (tree, files, dirPath, parIdx) => {
				let output = []
				
				let oldChildPointer = 0
				let oldChildren = tree.children
				let pointedChildExists = false
				
				if(oldChildren === undefined)
					oldChildren = new Array(0)
				
				let len = files.length
				let idxPreviousSibling = -1
				
				for(let i = 0; i < len; i++) {					
					let fname = files[i]
					let entryPath = path.join(dirPath, fname)
					
					let stat
					// read out file information
					try {
						stat = fs.statSync(entryPath)
					}
					catch(e) {
						error(entryPath)
						continue
					}
					
					// skip files that are not important for development
					/*if(this.isStatToIgnore(stat, fname))
						continue
					*/
					
					let idx = -1, branch
					if(oldChildren[oldChildPointer]) {
						branch = oldChildren[oldChildPointer]
						idx = branch.value
					}
					
					let finfo = wmaster.getFileInfo(idx)
					
					// check if the current pointer in the current and older file lists are different
					if(!branch || !finfo || fname !== finfo.name) {
						// look ahead if the old entry we are comparing with
						// will be needed
						if(finfo && !pointedChildExists) {
							for(let j = i; j < len; j++) {
								if(files[j] === finfo.name) {
									pointedChildExists = true
									break
								}
							}
							
							// skip item if its deprecated
							if(!pointedChildExists) {
								oldChildPointer++
								// remove from views
								this.propagateRemoveItem(idx)
								// remove from WorkspaceMaster
								wmaster.removeFileInfo(idx)
								// redo loop step with updated configurations
								i--
								
								onChange("REMOVAL: " + finfo.name)
								continue
							}
						}
						
						// add as new item
						idx = wmaster.addFileInfo(new FileInfo(entryPath, stat, fname))
						branch = new LinkedTree(idx)
						this.propagateAddItem(branch, parIdx, idxPreviousSibling)
						
						// remember sibling
						idxPreviousSibling = idx
						
						onChange("ADDITION: " + wmaster.finfo[idx].name)
					}
					// otherwise assume its the file has not been updated, so do not do any
					// fancy stuff then moving the pointer and reset the existence flag
					else {
						oldChildPointer++
						pointedChildExists = false
						
						// remember sibling
						idxPreviousSibling = idx
						
						// detect packaging differences
						if(stat.isDirectory() !== finfo._isDir) {
							if(finfo._isDir) {
								branch.forEach(idx => {
									this.propagateRemoveItem(idx)
									wmaster.removeFileInfo(idx)
								})
							}
							onChange("DIRCHANGE: " + finfo.name)
							
							this.propagateSetItemDirState(idx, stat.isDirectory())
							finfo._isDir = !finfo._isDir
						}
					}
					
					output.push(branch)
					
					// perform recursion for subfolders
					if(stat.isDirectory() && recCounter < MAX_RECURSION) {
						recCounter++
						let subFiles = fs.readdirSync(entryPath)
						// error handling?
						rec(branch, subFiles, entryPath, idx)
					}
				}
				
				// check if unused files are left and remove them
				for(; oldChildPointer < oldChildren.length; oldChildPointer++) {
					let idx = oldChildren[oldChildPointer].value
					this.propagateRemoveItem(idx)
					wmaster.removeFileInfo(idx)
				}
					
				
				tree.children = output
			}
			
			if(!this.tree)
				this.tree = new LinkedTree("root")
			
			rec(this.tree, files, this.path, -1)
			
			if(changes.changed && false) {
				log(changes.count + " changes detected")
				log(changes.changeset)
			}
			
			callback(this.tree)
		})
	}
	
	/**
		Loops through all WorkspaceViews and invokes addItem()
		with the given parameters
		@param {LinkedTree} tree - LinkedTree holding FileInfo index as value
		@param {number} parent - Index of the parent FileInfo
	*/
	propagateAddItem(tree, parent, idxPreviousSibling) {
		for(let view of this.views)
			view.addItem(tree, parent, idxPreviousSibling)
	}
	
	/**
		Loops through all WorkspaceViews and invokes removeItem()
		with the given parameter
		@param {number} idx - Index of the removed FileInfo
	*/
	propagateRemoveItem(idx) {
		for(let view of this.views)
			view.removeItem(idx)
	}
	
	propagateSetItemDirState(idx, isDir) {
		for(let view of this.views)
			view.setItemDirState(idx, isDir)
	}
	
	
	isStatToIgnore(stat, fname) {
		return !stat || !(stat.isDirectory() || Workspace.isAcceptedFileType(path.extname(fname)))
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
		Returns the name of the workspace.
		@return {string} Name of the workspace, otherwise the basename of its path
	*/
	getName() {
		return this.name
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
	
	sortFNames(fa) {
		if(!fa)
			return null
		
		// copy input to not corrupt things outside this function
		fa = fa.slice()
		let a = []
		
		for(let q = 0; q < fa.length; q++) {
			let lowest
			let value = 0
			for(let i = 0; i < fa.length; i++) {
				// ignore deleted entries
				if(fa[i] !== null) {
					let val = Workspace.getExtSortValue(fa[i])
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
		Checks weather the given extension is editable and
		can therefore be opened in the editor frame
		@param {string} ext - Extension to check. Requires preceding "."
	*/
	static isAcceptedFileType(ext) {
		
		if(config.get("hideNonOcFiles") === false)
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
		
		// store this info to allow detecting changes
		this._isDir = stat.isDirectory()
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
		@param {function} callback - the callback to invoke on sync complete
	*/
	update(callback) {
		fs.stat(this.path, (err, stat) => {
			if(err) {
				if(callback)
					return callback(this, true)
				else
					return
			}
			
			this.stat = stat
			
			if(callback)
				callback(this)
		})
	}
	
	getName() {
		return this.name
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
	
	addItem(tree, parIdx, prevIdx) {
		// ignore root element
		if(tree.value === "root") {
			for(let i = 0; i < tree.children.length; i++)
				this.addItem(tree.children[i], parIdx)
			return
		}
		
		let idx = tree.value
		let finfo = wmaster.finfo[idx]
		let root = this.createViewItem(idx, finfo, finfo.stat.isDirectory())
		
		if(parIdx === -1)
			root.setParent(this.rootItem, this.items[prevIdx])
		else
			root.setParent(this.items[parIdx], this.items[prevIdx])
		
		this.items[idx] = root
		
		let rec = (children, par) => {
			for(let i = 0; i < children.length; i++) {
				let child = children[i]
				let idx = child.value
				let finfo = wmaster.getFileInfo(idx)
				
				let item = this.createViewItem(idx, finfo, finfo.stat.isDirectory())
				item.setParent(par)
				
				this.items[idx] = item
				
				if(child.children)
					rec(child.children, item)
			}
		}
		
		if(tree.children)
			rec(tree.children, root)
	}
	
	setItemDirState(idx, isDir) {
		let item = this.items[idx]
		if(!item)
			throw new Error("Trying to remove unknown WorkspaceView entry")
		
		item.setDirState(isDir)
	}
	
	createViewItem(idx, finfo, isDir) {
		let item = new WorkspaceViewItem(idx, finfo, isDir)
		item.bindEventHandlers(this)
		
		return item
	}
	
	selectItem(item, multiSelect) {
		if(!multiSelect)
			this.deselectItems(item)
		
		if(!this.isSelectedItem(item)) {
			this.selected.push(item)
			item.onSelect()
		}
		
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
	
	getSelectedItems() {
		return this.selected
	}
	
	isSelectedItem(item) {
		for(let i = 0; i < this.selected.length; i++)
			if(this.selected[i] === item)
				return true
		
		return false
	}
	
	selectionToClipboard(fCut = false) {
		if(!this.selected)
			return
		
		let a = []
		
		for(let i = 0; i < this.selected.length; i++)
			a.push(this.selected[i].idx)
		
		wmaster.setClipboardData(a, fCut)
	}
	
	selectionToDragCache() {
		if(!this.selected)
			return
		
		let a = []
		
		for(let i = 0; i < this.selected.length; i++)
			a.push(this.selected[i].idx)
		
		wmaster.setDragCache(a)
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
		if(!item) {
			throw new Error("Trying to remove unknown WorkspaceView entry")
		}
		this.items[idx] = undefined
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
		let finfo = wmaster.finfo[item.idx]
		
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
				let dirEl = this.getNextValidDirectoryElement(item.el)
				
				let idx, tpath
				if(!dirEl) {
					idx = -1
					tpath = this.wspace.path
				}
				else {
					idx = dirEl.dataset.value
					tpath = wmaster.finfo[idx].path
				}
				
				this.newFileDialog(tpath, idx || -1)
			}
		})
		
		// add unpack/pack commands
		if(Workspace.isOcPackable(finfo.ext)) {
			props.push({
				label: "Pack",
				icon: "icon-pack",
				onclick: _ => { wmaster.packFile(item.idx) },
				onvalidate: _ => hasC4group() && finfo.stat.isDirectory()
			})
			props.push({
				label: "Unpack",
				icon: "icon-unpack",
				onclick: () => { wmaster.unpackFile(item.idx) },
				onvalidate: _ => hasC4group() && !finfo.stat.isDirectory()
			})
		}
		
		props.push({
			label: "Paste",
			icon: "",
			onclick: () => {
				let dirEl = this.getNextValidDirectoryElement(item.el)
				
				let idx, tpath
				if(!dirEl) {
					idx = -1
					tpath = this.wspace.path
				}
				else {
					idx = dirEl.dataset.value
					tpath = wmaster.finfo[idx].path
				}
				
				wmaster.performClipboardPaste(tpath)
			},
			onvalidate: _ => wmaster.hasClipboardData()
		})
		
		props.push({
			label: "Copy",
			icon: "",
			onclick: () => {
				this.selectionToClipboard()
			}
		})
		
		props.push({
			label: "Cut",
			icon: "",
			onclick: () => {
				this.selectionToClipboard(true)
			}
		})
		
		// Rename file commands
		props.push({
			label: "Rename",
			icon: "icon-pencil",
			onclick: () => {				
				let fn = require(path.join(__rootdir, "js", "dialogs", "rename.js"))
				fn(finfo.name, (newName) => {
					// check for valid file name
					if(newName && typeof newName === "string" && newName !== finfo.name)
						wmaster.renameFile(item.idx, newName)
				})
			}
		})
		
		// Delete file command
		props.push({
			label: "Delete",
			icon: "icon-trashbin",
			onclick: _ => {
				let selected = this.selected
				this.deselectItems()
				for(let i = 0; i < selected.length; i++)
					wmaster.removeFile(selected[i].idx)
			}
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
		new Dialog_NewFile(500, 300, tpath)
	}
	
	getWorkspace() {
		return this.wspace
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
		this.el = el
		this.el.dataset.value = idx
		
		this.setDirState(isDir)
		
		this.childrenEl = el.lastChild
	}
	
	setDirState(isDir) {
		if(isDir) {
			this.el.className += " tree-parent tree-collapsed"
			this.el.firstChild.addEventListener('dblclick', this.toggleCollapsedClass.bind(this))
		}
		else {
			Elem.removeClass(this.el, "tree-parent")
			Elem.removeClass(this.el, "tree-collapsed")
			this.el.firstChild.removeEventListener('dblclick', this.toggleCollapsedClass.bind(this))
		}
		
		this.isDir = isDir
	}
	
	toggleCollapsedClass(e) {
		Elem.toggleClass(this.el, 'tree-collapsed')
	}
	
	update(idx, finfo) {
		this.idx = idx
		this.finfo = finfo
	}
	
	getParent() {
		return this._par
	}
	
	setParent(newPar, previousItem) {
		if(newPar === this._par)
			return
		
		if(previousItem)
			Elem.insertAfter(newPar.childrenEl, this.el, previousItem.el)
		else
			newPar.childrenEl.appendChild(this.el)
		
		this._par = newPar
	}
	
	parseLabelName(fname) {
		return fname.replace(/(\.[^.]+?$)/, `<span class="clr-subtle">$1</span>`)
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
		
		// select on single, left click
		label.addEventListener("mousedown", (e) => {
			// focus on left click
			if(e.which === 1) {
				// select everything from last
				if(e.shiftKey) {
					if(!wview.activeItem || wview.activeItem.getParent() !== this.getParent())
						wview.selectItem(this, e.ctrlKey)
					else {
						let idxStart = Elem.getChildIndex(wview.activeItem.el),
							idxEnd = Elem.getChildIndex(this.el)
						
						let parent = this.getParent()
						let children = parent.childrenEl.children
						
						if(idxStart > idxEnd) {
							idxStart ^= idxEnd
							idxEnd ^= idxStart
							idxStart ^= idxEnd
						}
						
						for(let i = idxStart; i < idxEnd; i++) {
							let idx = children[i].dataset.value
							let item = wview.items[idx]
							wview.selectItem(item, true)
						}
						
						// ensure element last clicked has focus
						wview.selectItem(this, true)
					}
				}
				else {
					if(Elem.hasClass(this.el, "tree-selected") && e.ctrlKey)
						wview.deselectItem(this)
					else
						wview.selectItem(this, e.ctrlKey)
				}
			}
		})
		
		// open editable files; expand/collapse directories on dblclick
		label.addEventListener("dblclick", (e) => {
			let finfo = wmaster.finfo[this.idx]
			
			if(Elem.hasClass(this.el, "tree-parent"))
				return
			
			// open file
			if(WorkspaceMaster.isEditableExt(finfo.ext))
				wmaster.openFile(finfo)
		})
		
		// attach contextmenu on right click
		label.addEventListener("contextmenu", (e) =>  {
			// perform selectItem(), even is its already selected
			// to properly track item focus
			wview.selectItem(this, e.ctrlKey || wview.isSelectedItem(this))
			
			new Contextmenu(e.pageX, e.pageY, wview.getTreeMenuProps(this))
		})
		
		// dragging elements
		label.draggable = true
		
		let draglevel = 0
		
		label.addEventListener("dragstart", e => {
			isDragging = true
			
			wview.selectionToDragCache()
		})
		
		label.addEventListener("dragend", e => {
			isDragging = false
		})
		
		label.addEventListener("drop", e => {
			
			let tEl = document.getElementsByClassName("droptarget")[0]
			if(tEl)
				Elem.removeClass(tEl, "droptarget")
			
			// don't react on non workspace drag events
			if(!isDragging)
				return
			
			if(wmaster.isInDragCache(this.idx)) {
				wmaster.setDragCache(null)
			}
			else
				wmaster.performDrag(this.idx)
			
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
			if(currentDropTarget !== par) {
				currentDropTarget = par
				Elem.addClass(par, "droptarget")
				
				draglevel = 0
			}			
			draglevel++
		})
		
		label.addEventListener("dragleave", e => {
			if(!isDragging)
				return
			
			let par = wview.getNextValidDirectoryElement(this.el)
			if(!par)
				par = wview.root
			
			// check if anything has changed
			draglevel--
			if(draglevel >= 0 && currentDropTarget === par)
				return
			
			Elem.removeClass(par, "droptarget")
			currentDropTarget = null
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