/**
	a class to create complex forms from a declaration
	and handle validation of inputs
*/
let EventEmitter = require("./../lib/event.js")

class Form extends EventEmitter {
	constructor(decl, name) {
		super()
		this.el = document.createElement("div")
		this.el.className = "form"
		this.data = {}
		this.name = name
		
		// information to detect weather
		// the form fullfills what is requested
		// by the "required" option of single components
		this.ridx = 0
		this.reqMask = 0
		this.reqs = 0
		
		if(decl) {
			for(let i = 0; i < decl.length; i++) {
				let comp = this.createComponent(decl[i])
				
				if(comp)
					this.el.appendChild(comp.getElement())
			}
		}
	}
	
	getName() {
		return this.name || "Page"
	}
	
	createComponent(item) {
		let comp, cb
		
		// wrap callback in form data collector
		if(item.key) {
			let ridx = this.getRequirementIndex()
			
			// save initial data
			if(this.isValidValue(item.type, item.value)) {
				this.data[item.key] = item.value
				
				this.setRequirement(ridx, true)
			}
			
			cb = v => {
				if(v !== undefined)
					this.setRequirement(ridx, true)
				else
					this.setRequirement(ridx, false)
				
				this.data[item.key] = v
				if(item.onchange)
					item.onchange(v)
			}
		}
		else
			cb = item.onchange
		
		switch(item.type) {
			case "url":
				comp = new Component_Url(item.value, cb, item.directory)
			break
			
			case "desc":
				comp = new Component_Desc(item.text)
			break
			
			case "number":
				comp = new Component_Number(item.label, cb, item.unit, item.value, item.min, item.max)
			break
			
			case "switch":
				comp = new Component_Switch(item.label, item.value, cb)
			break
			
			case "shorttext":
				comp = new Component_ShortText(item.label, item.value, cb, item.align)
			break
			
			case "select":
				comp = new Component_Select(item.label, item.options, item.value, cb)
			break
			
			case "keybinding":
				comp = new Component_KeyBinding(item.label, item.value, cb)
			break
			
			default:
			return null
		}
		
		return comp
	}
	
	getRoot() {
		return this.el
	}
	
	setRequirement(ridx, b) {
		if(b === true)
			this.reqs |= 1 << ridx
		else {
			let mask = 1 << ridx
			this.reqs &= ~mask
		}
	}
	
	getRequirementIndex() {
		this.reqMask <<= 1
		this.reqMask |= 1
		
		return this.ridx++
	}
	
	hasRequired() {
		return this.reqs === this.reqMask
	}
	
	getData() {
		return this.data
	}
	
	setData(data) {
		for(let key in this.data)
			data[key] = this.data[key]
		
		this.data = data
	}
	
	isValidValue(type, value) {
		switch(type) {
			case "url":
				return typeof value === "string" && value.length
			break
			
			case "desc":
				return typeof value === "string"
			break
			
			case "number":
				return typeof value === "number"
			break
			
			case "switch":
				return typeof value === "boolean"
			break
			
			case "shorttext":
				return typeof value === "string" && value.length
			break
			
			case "select":
				return typeof value === "number" && value !== -1
			break
			
			case "keybinding":
				// TODO
				return true
			break
		}
		
		return false
	}
	
	onReqChange() {}
}

class Component_Desc {
	constructor(text) {
		this.el = document.createElement("div")
		this.el.className = "desc"
		this.el.innerHTML = text
	}
	
	setText(text) {
		this.el.innerHTML = text
	}
	
	getElement() {
		return this.el
	}
}

class Component_Url {
	constructor(value, callback, fdir) {
		let el = Elem.fromString(`<div class="flex-row"><p class="url flex-fill">${value}</p><div class="url-browse">Browse</div></div>`)
		
		el.lastChild.addEventListener("click", _ => {
			let p = remote.dialog.showOpenDialog({
				properties: fdir ? ['openDirectory'] : null,
			})
			
			if(!p)
				return
			
			el.getElementsByClassName("url")[0].innerHTML = p[0]
			
			if(callback)
				callback(p[0])
		})
		
		this.el = el
	}
	
	getElement() {
		return this.el
	}
}

class Component_ShortText {
	constructor(label, value, callback, align = "left") {
		let el = document.createElement("div")
		el.className = "flex-row"
		
		if(label)
			el.innerHTML = `${label}<input type="text" />`
		else {
			el.innerHTML = `<input type="text" />`
			el.style.justifyContent = "center"
		}
		let inp = el.lastElementChild
		inp.addEventListener("change", e => {
			if(this.cb)
				this.cb(e.target.value)
		})
		
		// set css property
		inp.style.textAlign = align
		
		// set attributes
		if(value)
			inp.setAttribute("value", value)
		
		this.cb = callback
		this.el = el
	}
	
	getElement() {
		return this.el
	}
}

class Component_Number {
	constructor(label, callback, unit, value, min, max) {
		let el = document.createElement("div")
		el.className = "flex-row"
		
		let inp
		if(label) {
			let lbl = document.createElement("label")
			lbl.className = "inp-number"
			
			lbl.innerHTML = label + `<input type="number"/>`
			inp = lbl.lastChild
			el.appendChild(lbl)
			
			if(unit)
				lbl.insertAdjacentHTML("beforeend", `<span>${unit}</span>`)
		}
		else {
			inp = document.createElement("input")
			inp.type = "number"
			inp.className = "inp-number"
			el.appendChild(inp)
			
			if(unit)
				el.insertAdjacentHTML("beforeend", `<span>${unit}</span>`)
		}
		
		// set attributes
		if(value !== undefined)
			inp.setAttribute("value", value)
		
		if(min !== undefined)
			inp.setAttribute("min", min)
		
		if(max !== undefined)
			inp.setAttribute("max", max)
		
		if(callback)
			inp.addEventListener("change", _ => callback(parseInt(inp.value)))
		
		this.el = el
	}
	
	getElement() {
		return this.el
	}
}

class Component_Switch {
	constructor(label, value = false, cb) {
		let el = document.createElement("label")
		el.className = "flex-row"
		
		el.innerHTML = label + `
						<div class="flex-fill"></div>
						<div class="switch${value?" on":""}">
							<div class="switch-left"></div>
							<div class="switch-thumb"></div>
							<div class="switch-right"></div>
						</div>`
		
		this.state = value
		
		el.addEventListener("click", e => {
			// ignore filler
			if(Elem.hasClass(e.target, "flex-fill"))
				return
			
			this.toggleState()
		})
		
		this.el = el
		
		this.cb = cb
	}
	
	setState(newState) {
		if(this.state === newState)
			return
		
		if(newState === true) {
			Elem.addClass(this.el.lastChild, "on")
			this.state = true
		}
		else {
			this.state = false
			Elem.removeClass(this.el.lastChild, "on")
		}
		
		// emit callback
		if(this.cb)
			this.cb(this.state)
	}
	
	toggleState() {
		if(this.state === true)
			this.setState(false)
		else
			this.setState(true)
	}
	
	getElement() {
		return this.el
	}
}

class Component_Select {
	constructor(label, options = [], value, cb) {
		let el = document.createElement("label")
		
		// create list
		let sel = document.createElement("select")
		
		// add options
		for(let i = 0; i < options.length; i++) {
			let opt = document.createElement("option")
			opt.innerHTML = options[i]
			opt.setAttribute("value", options[i])
			sel.appendChild(opt)
			
			if(options[i] === value)
				opt.setAttribute("selected", true)
		}
		
		// compose wrapping label
		el.innerHTML = label
		el.appendChild(sel)
		
		if(cb)
			sel.addEventListener("change", e => cb(e.target.value))
		
		this.el = el
	}
	
	getElement() {
		return this.el
	}
}

/**
	value must be something like
	{
		key: 23,
		ctrl: true,
		alt: true,
		shift: true
	}
*/
class Component_KeyBinding {
	constructor(label, keyData = {key: -1}, cb) {
		this.el = document.createElement("div")
		this.el.className = "keyb flex-row"
		
		this.el.innerHTML = label + `<div class="flex-fill" style="align-self: stretch"></div><div class="keyb-symbols" tabindex="-1"></div>`
		this.setKeyData(keyData)
		
		// declare callback after setting the value the first time
		this.onchange = cb
		
		let symb = this.el.lastElementChild
		
		// focusing the element
		this.el.addEventListener("click", e => {
			// ignore space in between label and symbol display
			if(Elem.hasClass(e.target, "flex-fill"))
				return
			
			symb.focus()
		})
		
		let currentKey
		
		// keyboard listener
		let onkey = e => {
			currentKey.shift = e.shiftKey
			currentKey.alt = e.altKey
			currentKey.ctrl = e.ctrlKey
			
			if(KeyMapper.isValidKey(e.which)) {
				currentKey.key = e.which
				this.setKeyData(currentKey)
				symb.blur()
			}
			
			this.updateSymbol(currentKey)
			
			e.stopImmediatePropagation()
			e.preventDefault()
		}
		
		let onkeyup = e => {
			currentKey.shift = e.shiftKey
			currentKey.alt = e.altKey
			currentKey.ctrl = e.ctrlKey
			
			if(KeyMapper.isValidKey(e.which))
				currentKey.key = 0
			
			this.updateSymbol(currentKey)
			
			e.stopImmediatePropagation()
			e.preventDefault()
		}
		
		// changing the value
		symb.addEventListener("focus", e => {
			currentKey = {key: 0}
			symb.addEventListener("keydown", onkey, true)
			symb.addEventListener("keyup", onkeyup, true)
		})
		
		// update value
		symb.addEventListener("blur", e => {
			symb.removeEventListener("keydown", onkey, true)
			symb.removeEventListener("keyup", onkeyup, true)
		})
	}
	
	setKeyData(keyData) {
		this.keyData = keyData
		
		this.updateSymbol(this.keyData)
		
		if(this.onchange)
			this.onchange(keyData)
	}
	
	updateSymbol(keyData) {
		let symb = this.el.lastElementChild
		
		// keyData is uninitialized
		if(keyData.key === -1) {
			symb.innerHTML = "..."
			return
		}
		
		let keyString = KeyMapper.keyDataToKeyString(keyData)
		
		if(keyData.key !== 0)
			Elem.removeClass(this.el.lastElementChild, "invalid")
		else
			Elem.addClass(this.el.lastElementChild, "invalid")
		
		symb.innerHTML = keyString
		
		if(this.onchange)
			this.onchange(keyData)
	}
	
	getElement() {
		return this.el
	}
}

module.exports = Form