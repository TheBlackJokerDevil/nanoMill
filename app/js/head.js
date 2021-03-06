const cprocess = require("child_process")
const __rootdir = __dirname
const fs = require('fs-extra')
const path = require('path')
const {remote, clipboard} = require('electron')
const dialog = remote.dialog

// get constants and functions from main process
const {__appdata, printLog, devmode} = remote.getGlobal("communicator")

const layout = require(path.join(__rootdir, "js", "modules", "layout.js"))
const hook = require(path.join(__rootdir, "js", "hook.js"))
const config = require(path.join(__rootdir, "js", "config.js"))
const KeyMapper = require(path.join(__rootdir, "js", "keybinding.js"))
const kb = new KeyMapper()

const MOUSE_LEFT = 1

var log, warn, error

function writeConsoleOutputToFile() {
	log = printLog
	warn = s => printLog("WARN: " + s)
	error = s => printLog("ERR: " + s)
	window.onerror = (msg, file, line) => error(msg + "\n" + file + " in line: " + line)
}

if(devmode) {
	log = console.log.bind(console)
	warn = console.warn.bind(console)
	error = console.error.bind(console)
}
else
	writeConsoleOutputToFile()


/**
	Remove the first matched value found in the array.
	Starts at the end of the array.
	@param {ary} The Array to iterate over
	@param {val} The value to delete
*/
function removeArrayItem(ary, val) {
	for(let i = ary.length - 1; i >= 0; i--) {
		if(ary[i] === val) {
			ary.splice(i, 1)
			return
		}
	}
}

/**
	Removes all matched values found in the array.
	@param {ary} The Array to iterate over
	@param {val} The value to delete
*/
function removeArrayItems(ary, val) {
	for(let i = ary.length - 1; i >= 0; i--) {
		if(ary[i] === val) {
			ary.splice(i, 1)
			break
		}
	}
}

/**
	Checks if a file/or directory of the given path already
	exists; if so it checks for alternative with a " - n" suffix.
	Otherwise it returns the given path
	@param {p} path of file
	@param {callback} Callback executing when finding a valid name.
			Has the resulting path as argument
*/
function validateFilename(p, callback) {
	let i = 1
	let ext = path.extname(p)
	let basep = p.substr(0, p.length - ext.length)
	
	// check for already trailing "- xy" enumeration
	let match = basep.match(/\s-\s\d+$/i)
	if(match) {
		i = parseInt(match[0].substring(2, match[0].length))
		basep = basep.substr(0, basep.length - match[0].length)
	}
	
	let fn = (base, ext, i) => {
		let p = base + " - " + i + ext
		
		fs.stat(p, (err) => {
			// an error means, that the file does not exists
			if(err)
				callback(p)
			else {
				fn(base, ext, ++i)
			}
		})
	}
	
	fn(basep, ext, i)
}

/**
	Checks if a file/or directory of the given path already
	exists; if so it checks for alternative with a " - n" suffix.
	Otherwise it returns the given path
	@param {p} path of file
*/
function validateFilenameSync(p) {
	let stat
	
	try {
		stat = fs.statSync(p)
	}
	catch(e) {
		return p
	}
	
	let ext = path.extname(p)
	let basep = p = p.substr(0, p.length - ext.length)
	let altp
	let i = 1
	
	// check for already trailing "- xy" enumeration
	let match = basep.match(/\s-\s\d+$/i)
	if(match) {
		basep = basep.substr(0, basep.length - match[0].length)
	}
	
	while(stat) {
		altp = basep + " - " + i + ext
		try {
			stat = fs.statSync(altp)
		}
		catch(e) {
			return altp
		}
		
		i++
	}
	
	return altp
}

function isChildPathOf(child, parent) {
	return (child !== parent) && parent.split(path.sep).every((t, i) => child.split(path.sep)[i] === t)
}