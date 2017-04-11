/**
	A class to make a simple event interface
*/

class EventEmitter {
	on(ev, cb) {
		// ensure object
		if(!this._events)
			this._events = {}
		
		// ensure array
		if(!this._events[ev])
			this._events = [cb]
		else
			this._events.push(cb)
	}
	
	emit(ev, ...args) {
		let cbs = this._events[ev]
		if(!cbs)
			return
		
		for(let i = 0; i < cbs.length; i++)
			cbs(...args)
	}
}

module.exports = EventEmitter