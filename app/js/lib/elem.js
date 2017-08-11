/**
	The static class Elem provides the most common html operations,
	replacing jquery, while still keeping things short-handed and intutive
*/
class Elem {
	/**
		toggles a given class of an element
		@param el the element to change
		@param cl the class to toggle
	*/
	static toggleClass(el, cl) {
		let cname = el.className
		let i = cname.indexOf(cl)
		
		if(i === -1)
			el.className += ' ' + cl
		else
			el.className = el.className.replace(new RegExp(`(?:^|\\s*)${cl}(?!\\S)(?:$|\\s*)`, "g"), " ").trim()
	}
	
	/**
		Remove an element from its parent elementFromPoint
		@param {Element} el - the element to remove
	*/
	static remove(el) {
		if(el.parentNode)
			el.parentNode.removeChild(el)
	}
	
	/**
		Creates an element from a string in html notation
		@param {string} str - the element string
		@return {Element} the newly created Element
	*/
	static fromString(str) {
		let div = document.createElement("div")
		div.innerHTML = str
		
		return div.firstChild
	}
	
	/**
		Checks if an element has the given class
		@param {Element} el - the element to check
		@return {boolean} - true if the element matches the class
	*/
	static hasClass(el, cl) {
		return el.className.indexOf(cl) !== -1
	}
	
	/**
		Adds a class to an element
		@param {Element} el - the target element
		@param {string} cl - the class to add
	*/
	static addClass(el, cl) {
		if(!Elem.hasClass(el, cl))
			el.className += " " + cl
	}
	
	/**
		Removes a class from an element
		@param {Element} el - the target element
		@param {string} cl - the class to remove
	*/
	static removeClass(el, cl) {
		el.className = el.className.replace(new RegExp(`(?:^|\\s*)${cl}(?!\\S)(?:$|\\s*)`, "g"), " ").trim()
	}
	
	/**
		Inserts an element as child of a parent before a reference child element
		@param {Element} par - the parent element
		@param {Element} el - the target element to insert
		@param {Element} ref - the reference element
	*/
	static insertBefore(par, el, ref = null) {
		par.insertBefore(el, ref)
	}
	
	/**
		Inserts an element as child of a parent after a reference child element
		@param {Element} par - the parent element
		@param {Element} el - the target element to insert
		@param {Element} ref - the reference element
	*/
	static insertAfter(par, el, ref = null) {
		if(ref === null || ref === par.lastChild)
			par.appendChild(el)
		else
			par.insertBefore(el, ref.nextElementSibling)
	}
	
	/**
		Inserts an element before a given reference element
		@param {Element} el - the target element to insert
		@param {Element} ref - the reference element
	*/
	static before(el, prev) {
		Elem.insertBefore(el.parentNode, prev, el)
	}
	
	/**
		Inserts an element after a given reference element
		@param {Element} el - the target element to insert
		@param {Element} ref - the reference element
	*/
	static after(el, next) {
		Elem.insertAfter(el.parentNode, next, el)
	}
	
	/**
		Inserts an element as the first child of a parent element
		@param {Element} par - the parent element
		@param {Element} ref - the target element
	*/
	static prepend(par, el) {
		par.insertBefore(el, null)
	}
	/**
		Inserts an element as the last child of a parent element
		@param {Element} par - the parent element
		@param {Element} ref - the target element
	*/
	static append(par, el) {
		par.appendChild(el)
	}
	
	/**
		Returns the nth child of a parent element
		@param {Element} par - the parent element
		@param {number} n - the index of the element to look for
	*/
	static nthChild(par, n) {
		let el = par.firstElementChild
		
		let i = 0
		while(el) {
			if(i === n)
				return el
			
			i++
			el = el.nextElementSibling
		}
		
		return el
	}
	
	/**
		Returns the index a child has in its parent element
		@param {Element} child - the child element
		@return {number} the child's index
	*/
	static getChildIndex(child) {
		let idx = 0
		
		while((child = child.previousSibling) != null) 
			idx++
		
		return idx
	}
}