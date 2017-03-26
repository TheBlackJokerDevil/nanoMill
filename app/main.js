const {app, BrowserWindow, dialog} = require('electron')
const fs = require('fs')
const __appdata = app.getPath('userData')

let output = fs.createWriteStream(`${__appdata}/error.log`, {flags: "w", })

output.write(`Detected platform: ${process.platform}\n`)

process.on('uncaughtException', function (err) {
    output.write(`ERR: ${err}\n`)
	dialog.showErrorBox("Failed to launch app", `Error: ${err}`)
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let windata = {}

function createWindow () {
	
	communicator = {
		__appdata,
		printLog: (str) => {
			output.write(`${str}\n`)
		},
		dialog
	}
	
	let winops
	try {
		// load window data
		let str = fs.readFileSync(`${__appdata}/window.json`)

		if(!str)
			throw "No window.json given"
		
		windata = JSON.parse(str)

		if(!windata)
			throw "Failed to parse window.json"
		
		winopts = {
			width: windata.width,
			height: windata.height,
			x: windata.x,
			y: windata.y,
			maximized: windata.maximized
		}
		
		communicator.devmode = windata.devmode
	}
	catch(e) {
		output.write("ERR: Loading window.json:\n" + e + "\n")
		// default values
		winopts = {
			width: 800,
			height: 600
		}
	}
	
	winopts.icon = `${__dirname}/the-mill.ico`
	winopts.show = false
	winopts.backgroundColor = "#26282b"
	winopts.frame = false
	
	global.communicator = communicator
	
	// Create the browser window.
	win = new BrowserWindow(winopts)
	
	win.webContents.on('did-finish-load', _ => {
		win.show()
	})
	
	if(!windata.devmode)
		win.setMenu(null)
	
	if(windata.maximized)
		win.maximize()

	// and load the index.html of the app.
	win.loadURL(`file://${__dirname}/index.html`)

	// Open the DevTools.
	if(windata.devmode)
		win.webContents.openDevTools()

	// Emitted when the window is closed.
  
	win.on("close", () => {
		let bounds = win.getBounds()
		windata.width = bounds.width
		windata.height = bounds.height
		windata.x = bounds.x
		windata.y = bounds.y
		windata.maximized = win.isMaximized()
	})
  
	win.on('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		win = null
	})
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin')
		app.quit()
})

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (win === null)
		createWindow()
})

app.on('before-quit', () => {
	fs.writeFileSync(`${__appdata}/window.json`, JSON.stringify(windata))
	output.end()
})