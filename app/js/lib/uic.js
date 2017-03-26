/**
	This module provides reusable templates of smaller ui components
*/

class Uic {
	static openDialog(txt, callback, fdir) {
		if(!txt || txt.length === 0)
			txt = "..."
		
		let el = Elem.fromString(`<div class="flex-row"><p class="url flex-fill">${txt}</p><div class="url-browse">Browse</div></div>`)
		
		el.getElementsByClassName("url-browse")[0].addEventListener("click", _ => {
			let p = remote.dialog.showOpenDialog({
				properties: fdir ? ['openDirectory'] : null,
			})
			
			if(!p)
				return
			
			el.getElementsByClassName("url")[0].innerHTML = p[0]
			
			if(callback)
				callback(p[0])
		})
		
		return el
	}
	
	static desc(txt) {
		let el = document.createElement("div")
		el.className = "desc"
		el.innerHTML = txt
		
		return el
	}
	
	static insertArray(par, ary) {
		for(let i = 0; i < ary.length; i++) {
			let args = ary[i]
			let el = Uic[args[0]](...args.slice(1))
			
			par.appendChild(el)
		}
	}
}

module.exports = Uic