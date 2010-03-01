if(Object.defineProperty == undefined){
	Object.defineProperty = function( obj, prop, desc ){
		if(obj[prop] != undefined){
			delete obj[prop]
		}
		if(desc.get == undefined && desc.value == undefined){
			throw new TypeException("No getter or value provided in property description")
		}
		if(desc.get != undefined){
			obj.__defineGetter__(prop, desc.get)
			if(desc.set != undefined){
				obj.__defineSetter__(prop, desc.set)
			}

		} else {
			obj[prop] = desc.value
		}
	}
}

if(Object.defineProperties == undefined){
	Object.defineProperties = function( obj, props ){
		for(var prop in props){
			Object.defineProperty(obj, prop, props[prop])
		}
	}
}
