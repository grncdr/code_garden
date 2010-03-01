"use strict";

Garden = {
	width: function() { return 800 }, 
	height: function() { return 400 },
	repo: undefined,
	drawables: [],
	b_counts: [],
	f_counts: [],
	s_counts: [],
	splitRadius: 8,

	grow: function(){
		jQuery.getJSON('http://github.com/api/v2/json/repos/show/'+this.url+'/branches?callback=?', Garden.setRefs)
	},
	
	setRefs: function(refs, blah){
		this.current_ref == 'boogers'
		if(refs.branches.master != undefined) {
			Garden.current_ref = refs.branches.master
		} else { 
			for(var branch in refs.branches){
				Garden.current_ref = refs.branches[branch] 
				break // Just return the first branch
			}
		}
		Garden.getBlobs()
	},

	getBlobs: function(){
		jQuery.getJSON('http://github.com/api/v2/json/blob/all/'+this.url+'/'+this.current_ref+'?callback=?', function(d){
			for(blob in d.blobs){
				var pathname = blob.split('/')
				if(pathname.length > 1){
					var current_root = Garden.Ground.addOrGetDir(pathname[0])
					for(var i=1; i<pathname.length-1; i++){
						current_root = current_root.addOrGetDir(pathname[i])
					}
				} else {
					current_root = Garden.Ground
				}
				current_root.addBlob(blob)
			}
			Garden.sk.loop()
		})
	},

	hasItem: function(sha, level){
		if(typeof level != 'undefined'){
			return this.drawables[level].filter(function(item){return item.sha == sha}).length > 0
		}
		for(var level=0; level<this.drawables.length; level++){
			if(this.drawables[level].filter(function(item){return item.sha == sha}).length > 0){
				return true;
			}
		}
		return false;
	},

	addItem: function(item){
		if(this.drawables[item.level] == undefined){
			this.drawables[item.level] = [item]
		} else {
			this.drawables[item.level].push(item)
		}
		if(item.sha == undefined){
			this.increment(this.b_counts, item.level)
		} else {
			this.increment(this.f_counts, item.level)
			this.increment(this.s_counts, item.level, item.size)
		}
	},

	increment: function(arr, level, amount){
		if(amount == undefined){
			amount = 1
		}
		if(arr[level] == undefined){
			arr[level] = amount
		} else {
			arr[level] = arr[level] + amount
		}
	},

	intersecting: function(){
		var x = p.mouseX
		var y = p.mouseY
		return null
	},

	getX: function(item){
		/* Short-circuit for base roots */
		if( item.level == 0 ){
			var xstep = this.width() / this.drawables[0].length
			return xstep * 0.5 + xstep * (this.drawables[0].indexOf(item) / this.drawables[0].length)
		}
		var xpos = this.width() - this.getRadius(item)
		var index = this.drawables[item.level].indexOf(item)
		for(var i=index-1; i>=0; i--){
			xpos -= this.getRadius(this.drawables[item.level][i]) * 2
		}
		return xpos
	},

	getY: function(item){
		if(item.level == 0){
			return this.height()-1
		}
		return this.height() - (this.height() / this.drawables.length) * item.level
	},

	getRadius: function(item){
		var level = item.level
		if(item.sha == undefined){
			return this.splitRadius
		} else {
			var avgSize = this.s_counts[level]/ this.f_counts[level]
			var avgRadius = (0.5 * this.flowerSpace(level))/this.f_counts[level]
			var avgArea = Math.PI * Math.pow(avgRadius, 2.)
			var thisArea = avgArea * item.size / avgSize
			var thisRadius = avgRadius * item.size / avgSize
			return thisRadius
		}
	},

	flowerSpace: function(level){
		var b_count = this.b_counts[level]
		b_count = isNaN(b_count) ? 0 : b_count
		return this.width() - this.splitRadius * 2 * b_count
	},
}
  
/* Sub objects */

Garden.Point = function (x, y){
	this.x = x
	this.y = y
}

Garden.Point.prototype = {
	toString: function(){
		return "("+this.x+", "+this.y+")"
	},

	equals: function(p){
		return p.x == this.x && p.y == this.y
	},

	distance: function(ix, iy){
		var rise = this.y - iy
		var run = this.x - ix
		return sqrt(rise*rise + run*run)
	},

	copy: function(){
		return new Garden.Point(this.x, this.y)
	},
}

Garden.Stem = function(root, destination){
	this.root = root
	this.start = root.center.copy()
	this.end = this.start.copy()
	this.destination = destination
	this.done = false
}

Garden.Stem.prototype = {
	update: function(){
		var dest = this.destination.center
		var diff = this.end.x - dest.x
		if(Math.abs(diff) < 5){
			this.end.x = dest.x
		} else {
			this.end.x = this.end.x - (diff / 4)
		}
		diff = this.end.y - dest.y
		if(Math.abs(diff) < 5){
			this.end.y = dest.y
		} else {
			this.end.y = this.end.y - (diff / 4)
		}
		if(this.end.equals(dest)){
			this.done = true
		}
	},

	draw: function(){
		/* Lengthen curve */
		if(!this.done){
			this.update()
		}
		var ydiff = this.start.y-this.end.y
		Garden.sk.noFill()
		Garden.sk.strokeWeight(2)
		Garden.sk.stroke(10, 100, 10)
		Garden.sk.bezier( this.start.x, this.start.y, 
											this.start.x, this.start.y-ydiff*0.4, 
											this.end.x, this.end.y+ydiff*0.7, 
											this.end.x, this.end.y)
		if(this.done){
			this.destination.draw()
		}
	},
}

Object.defineProperty(Garden.Stem, 'start', {get: function(){ return this.root.center }})


// Base for anything that can have a blob or subdir added to it
Garden.Root = Object.create(new Object(), {
	hoverText: { get: function(){
			return "Directory '"+this.dirname+"'"
		},
	},

	center: { 
		get: function(){
				this._center = new Garden.Point(Garden.getX(this), Garden.getY(this))
			return this._center
		},
	},

	addOrGetDir: { value: function(dirname, create){
			var substems = this.stems.filter(function(stem){
				return stem.destination.sha == undefined && stem.destination.name == dirname
			})
			if(substems.length > 0){
				return substems[0]
			}
			if(create != undefined && !create){
				return null;
			}
			// subdirectory has not been added yet, create it and return it
			var newDir = Object.create(Garden.Root, {
				stems: {value: [], writable: false},
				dirname: {value: dirname, writable: false},
			})
			this.addItem(newDir)
			return newDir
		},
		writable: false,
	},

	addBlob: { value: function(filepath){
			var R = this
			jQuery.getJSON('http://github.com/api/v2/json/blob/show/'+Garden.url+'/'+Garden.current_ref+'/'+filepath+'?callback=?', function(d){
				newFlower = new Garden.Flower(d.blob.name)
				newFlower.size = d.blob.size,
				newFlower.sha = d.blob.sha,
				newFlower.rawdata = d.blob.data,
				R.addItem(newFlower)
			})
		},
		writable: false,
	},

	addItem: { value: function(onStem){
			onStem.level = this.level + 1
			Garden.addItem(onStem)
			var newStem = new Garden.Stem(this, onStem)
			this.stems.push(newStem)
		},
		writable: false,
	},
	
	intersecting: { value: function(x, y){
			if(this.center.distance(x, y) < Garden.splitRadius){
				return this
			}
			return null
		},
		writable: false,
	},

	draw: { value: function(){
			for(var i=0; i<this.stems.length; i++){
				this.stems[i].draw()
			}
			Garden.sk.fill(10, 100, 10)
			Garden.sk.noStroke()
			Garden.sk.ellipse(this.center.x, this.center.y, Garden.splitRadius*2, Garden.splitRadius*2)
		},
		writable: false,
	},
})

Garden.Ground = Object.create(Garden.Root, {
	level: {value: 0, writable: false},
	roots: {value: []},
	stems: {get: function(){
		return this.roots.map(function(root){ return root.stems[0] })
	}},
	addItem: {
		value: function(onStem){
			var newRoot = Object.create(Garden.Root, { 
				stems: {value: []},
				level: {value: 0},
			})
			Garden.addItem(newRoot)
			newRoot.addItem(onStem)
			this.roots.push(newRoot)
		},
		writable: false,
	},
	draw: {
		value: function(){
			for(var i=0; i<this.roots.length; i++){
				this.roots[i].draw()
			}
		},
		writable: false,
	},
})

// Property definitions for items containing lines
Garden.LineBase = { 
	lineCount: {
		get: function(){
			count = this.children.length
			for(var i=0; i<this.children.length; i++){
				count += this.children[i].lineCount
				console.log("Called lineCount recursive like")
			}
			return count
		}
	},

	addLine: { value: function(line){
			line.owner = this
			this.children.push(line)
		},
		writable: false,
	},
}

Garden.Flower = function(name){
	this.filename = name
	this.children = []
}

Garden.Flower.prototype = {
	draw: function() {
		for(var i=0; i<this.children.length; i++){
			this.children[i].draw()
		}
		Garden.flower_layer.strokeWeight(2)
		Garden.flower_layer.fill(220, 220, 0)
		Garden.flower_layer.stroke(180, 180, 0)
		Garden.flower_layer.ellipse(this._center.x,	this._center.y, this.radius*2, this.radius*2)
		Garden.sk.noFill()
		Garden.sk.stroke(255,200,200)
		Garden.sk.ellipse(this._center.x,	this._center.y, this.maxRadius*2, this.maxRadius*2)
	},

	intersecting: function(x, y){
		if(this.center.distance(x, y) < this.radius){
			return this
		}
		for(var i=0; i<this.children.length; i++){
			rv = children[i].intersecting(x, y)
			if(rv != null){
				return rv
			}
		}
		return null
	},
}

Object.defineProperties(Garden.Flower.prototype, Garden.LineBase)

// Read-only properties
Object.defineProperties(Garden.Flower.prototype, {
	center: { 
		get: function(){
				this._center = new Garden.Point(Garden.getX(this), Garden.getY(this))
			return this._center
		},
	},

	hoverText: {
		get: function(){ 
			rv = filename + "\n" + this.lineCount + " lines\n"
			for(var i=0; i<this.children.length; i++){
				rv = rv + "\n" + this.children[i].text
				if(this.children[i].children.length > 0){
					rv = rv + "...\n    "+this.children[i].children.length+" lines"
				}
			}
			return rv
		}
	},

	radius: { 
		get: function(){
				//this._radius = sqrt(pow(this.maxRadius,2.) * (children.length/this.lineCount))
				this._radius = this.maxRadius
			return this._radius
		}
	},

	maxRadius: { get: function(){
			this._maxRadius = Math.min(Garden.getRadius(this), Math.min(Garden.width(), Garden.height()) / 4)
		return this._maxRadius
		},
	},
})


/*
Garden.Line = Object.beget(Garden.LineBase, { // implements Drawable, Petal, Hoverable
	pos: 0,
	indent: 0,
	_angle: -1,
	text: "",
	raw: "",
	//owner: null,
	//flower: null,

	hoverText: function(){
		if(this.text.length > 23){
			return this.text.substring(0,20)+"..."
		}
		return this.text
	},

	fullText: function(leading){
		rv = leading + this.text
		for(var i=0; i<this.children.length; i++){
			rv = rv + "\n" + this.children[i].fullText(leading + "    ")
		}
		return rv
	},
	
	countIndent: function(){
		c = 0
		while(c < raw.length && raw.charAt(c) == ' '){
			c++
		}
		this.indent = c-1
	},

	isComment: function(){
		if(text.length == 0){
			return true
		}
		return text[0] == '#'
	},

	getFlower: function(){
		p = owner
		return p.getFlower()
	},

	radius: function(){
		if (this._radius < 0){
			proportion = this.lineCount / owner.lineCount
			this._radius = sqrt(proportion * pow( owner.radius ,2. ))
		}
		return this._radius
	},

	angle: function(){
		if(this._angle < 0){
			index = owner.children.indexOf(this)
			this._angle = 2 * Math.PI * (index / owner.children.length)
		}
		return this._angle
	},

	center: function(){
		if(this._center.x == undefined){
			p = this.owner.center
			distance = this.owner.radius + 0.9 * (4./3.) * this.radius
			x = p.x + (sin(angle()) * distance)
			y = p.y + (cos(angle()) * distance)
			this._center.x = x
			this._center.y = y
		}
		return this._center
	},

	draw: function() {
		if( this.children.length > 0 ){
			for(var i=0; i < this.children.length; i++){
				line = this.children[i]
				line.draw()
			}
		}
		Garden.flower_layer.stroke(200, 200, 0)
		Garden.flower_layer.strokeWeight(1)
		Garden.flower_layer.fill(230, 230, 210)
		Garden.flower_layer.pushMatrix()
		Garden.flower_layer.translate(this.center.x, this.center.y)
		Garden.flower_layer.rotate(-1*angle())
		Garden.flower_layer.ellipse(0, 0, this.radius*1.5, this.radius*(8./3.))
		Garden.flower_layer.line(0,radius*(4./-3.), 0, this.radius*.75)
		Garden.flower_layer.popMatrix()
	},

	intersecting: function(x, y){
		if(this.center.distance(x, y) < this.radius){
			return this
		}
		for(var i=0; i<this.children.length; i++){
			rv = this.children[i].intersecting(x, y)
			if(rv != null){
				return rv
			}
		}
		return null
	},
})
*/

jQuery(function(){
	Garden.sk = Processing($('canvas#garden')[0])
 	Garden.flower_layer = Garden.sk.createGraphics(Garden.width(), Garden.height(), Garden.sk.JAVA2D);

	// This was setup()
 	Garden.sk.size(Garden.width(), Garden.height());
 	Garden.sk.stroke(125);
 	Garden.sk.fill(253, 162, 110);  
	Garden.sk.frameRate(30);

	Garden.sk.draw = function() {
		this.background(200, 200, 255);
		this.smooth();
		Garden.flower_layer.beginDraw();
		Garden.flower_layer.smooth();
		Garden.Ground.draw();
		Garden.flower_layer.endDraw();
		Garden.sk.image(Garden.flower_layer, 0, 0);
	}

	Garden.url = 'grncdr/rtorrent-client'
	Garden.grow() // This eventually calls Garden.sk.loop()
})
