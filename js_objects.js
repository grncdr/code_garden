Garden = {
	'width': function() { return 500 }, 
	'height': function() { return 600 },
	'drawables': [],
	'b_counts': [],
	'f_counts': [],
	'l_counts': [],
	'splitRadius': function() { return 8 },
	'Gardener': { 
		'addItem': function(item, level){
			var drawables = this.drawables[level]
			drawables.push(item)
			if(item instanceof Flower){
				drawab
			}
		},
		'increment': function(arr, level, amount){
			if(typeof amount == 'undefined'){
				amount = 1;
			}
			while( arr.length <= level + 1){
				arr.push(0)
			}
			arr[level] = arr[level] + amount
		},
		'intersecting': function(){
			var x = p.mouseX
			var y = p.mouseY
			return null
		},
		'getX': function(item){
			var xpos = 0;
			var level = 0;
			for(var level=0; level < this.drawables.length; level++){
				var i = this.drawables[level].indexOf(item)
				if( i < 0 ) { continue; }
				xpos = getRadius(item)
				for(var i=i-1; i>=0; i--){
					xpos += getRadius(this.drawables[level][i]) * 2
				}
				break;
			}
		},
		'getY': function(level){
			if(level == 0){
				return this.height()-1;
			}
			return this.height() - (this.height() / this.drawables.length) * level;
		},
		'getRadius': function(item, level){
			if(item instanceof Root){
				return this.splitRadius
			} else {
				var avgLines = this.lineCount(level)/ this.f_counts[level]
				var avgRadius = (0.5 * this.flowerSpace(level))/this.f_counts[level]
				var avgArea = PI * Math.pow(avgRadius, 2.)
				var thisArea = avgArea * item.lineCount() / avgLines
				var thisRadius = Math.sqrt(thisArea / PI)
				return thisRadius;
			}
		},
		'flowerSpace': function(level){
			return this.width() - this.splitRadius * 2 * this.b_counts[level]
		},
	},

	'Point': {
		'x': -1,
		'y': -1,

		'toString': function(){
			return "("+this.x+", "+this.y+")";
		},

		'equals': function(p){
			return p.x == this.x && p.y == this.y;
		},

		'distance': function(ix, iy){
			int rise = this.y - iy;
			int run = this.x - ix;
			return sqrt(rise*rise + run*run);
		},
	},

	'Stem': { // implements Drawable
		'root': null, //Point?
		'destination': null, // OnStem
		'end': null, //Point
		'done': false,

		'center': function(){
			return end;
		},

		'update': function(){
			dest = this.destination.center();
			diff = this.end.x - this.dest.x;
			if(abs(diff) < 5){
				this.end.x = this.dest.x;
			} else {
				this.end.x = this.end.x - (diff / 4);
			}
			diff = this.end.y - dest.y;
			if(abs(diff) < 5){
				this.end.y = dest.y;
			} else {
				this.end.y = this.end.y - (diff / 4);
			}
			if(this.end.equals(dest)){
				done = true;
			}
		},

		'draw': function(){
			/* Lengthen curve */
			if(!done){
				this.update();
			}
			start = this.root.center();
			ydiff = start.y-end.y;
			noFill();
			strokeWeight(2);
			stroke(10, 100, 10);
			bezier( start.x, start.y, 
							start.x, start.y-ydiff*0.4, 
							end.x,   end.y+ydiff*0.7, 
							end.x,   end.y);
			if(done){
				destination.draw();
			}
		},
	},

	'Root': { // implements Drawable
		'stems': [],
		'_center': null, // Point
		'level': 0,

		'addItem': function(OnStem s){
			s.setRoot(this);
			Gardener.addItem(s, level+1);
			stems.push( Object.create(Stem, {'root':this, 'destination':s}) );
		},

		'center': function(){
			if(_center.x < 0){
				this._center.x = Gardener.getX(this);
			}
			if(_center.y < 0){
				this._center.y = Gardener.getY(this.level);
			}
			return this._center;
		},

		'draw': function(){
			// draw each item
			for(int i=0; i<stems.length; i++){
				Stem stem = (Stem) stems.get(i);
				stem.draw();
			}
		},
	},

	'Ground': Object.create(this.Root, {
		'roots': [],

		'addItem': function(flower){
			root = Object.create(Root);
			Gardener.addItem(root, 0);
			root.addItem(flower);
			roots.push(root);
		},

		'draw': function(){
			for(int i=0; i<roots.length; i++){
				this.roots[i].draw();
			}
		}
	},

	'StemSplit': Object.create(Root, { // implements OnStem, Hoverable 
		'base': null,
		'dirname': "",
		'setRoot': function(Root p){
			this.base = p;
			this.level = base.level + 1;
		},

		'getRoot': function(){
			return this.base;
		},

		'intersecting': function(int x, int y){
			if(this.center().distance(x, y) < Gardener.splitRadius){
				return this;
			}
			return null;
		},
		
		'hoverText': function(){
			return "Directory '"+this.dirname+"'";
		},

		'draw': function(){
			super.draw();
			fill(10, 100, 10);
			noStroke();
			ellipse(this._center.x, this._center.y, Gardener.splitRadius*2, Garden.splitRadius*2);
		},
	},


	'LineBase': Object.create(Object, { //implements Lines 

		'children': [],
		'_center': null, // Point
		'_radius': -1,
		'_maxRadius': -1,

		'getChildren': function(){
			return this.children;
		},

		'lineCount': function(){
			int count = this.children.length;
			for(int i=0; i<children.length; i++){
				Line current = (Line) children.get(i);
				count += current.lineCount();
			}
			return count;
		},

		'addLine': function(Line line){
			line.parent = this;
			this.children.push(line);
		},

	},

	'Flower': Object.create(LineBase, { // implements OnStem, Drawable, Petal, Hoverable
		'filename': null,
		'level,
		'line_count': 0,
		'base': null,

		// Deprecated
		'getRoot': function(){
			return base;
		},

		// Deprecated
		'setRoot': function(Root p){
			base = p;
			level = base.level+1;
		},

		// Deprecated
		'getFlower': function(){
			return this;
		},

		'hoverText': function(){ 
			String rv = filename + "\n" + lineCount() + " lines\n";
			for(int i=0; i<children.length; i++){
				Line child = (Line) children.get(i);
				rv = rv + "\n" + child.text;
				if(child.children.length > 0){
					rv = rv + "...\n    "+child.children.length+" lines";
				}
			}
			return rv;
		}

		'radius': function(){
			if(_radius < 0){
				_radius = (int) sqrt(pow(maxRadius(),2.) * (children.length/lineCount()));
			}
			return _radius;
		}

		'maxRadius': function(){
			if(_maxRadius < 0){
				_maxRadius= Gardener.getRadius(this, level);
			}
			return _maxRadius;
		}

		'center': function(){
			if(_center.x == -1 && _center.y == -1){
				_center.x = Gardener.getX(this);
				_center.y = Gardener.getY(this.level);
			}
			return _center;
		}

		'draw': function() {
			for(int i=0; i<children.length; i++){
				line = (Line) children.get(i);
				line.draw();
			}
			flower_layer.strokeWeight(2);
			flower_layer.fill(220, 220, 0);
			flower_layer.stroke(180, 180, 0);
			flower_layer.ellipse(_center.x, _center.y, radius()*2, radius()*2);
			noFill();
			stroke(255,200,200);
			ellipse(_center.x, _center.y, maxRadius()*2, maxRadius()*2);
		}

		'intersecting': function(int x, int y){
			if(this.center().distance(x, y) < this.radius()){
				return this;
			}
			for(int i=0; i<children.length; i++){
				rv = children[i].intersecting(x, y);
				if(rv != null){
					return rv;
				}
			}
			return null;
		}
	},

	'Line': Object.create(LineBase, { // implements Drawable, Petal, Hoverable
		'pos': 0,
		'indent': 0,
		'_angle': -1;
		'text': '',
		'raw': '',
		'owner': null,
		'flower': null,
		/* deprecated constructor 
		Line(String r, int at){
			raw = r;
			pos = at;
			text = raw.trim();
			this.countIndent();
		}*/

		'hoverText': function(){
			if(this.text.length > 23){
				return this.text.substring(0,20)+"...";
			}
			return this.text
		},


		'fullText': function(leading){
			rv = leading + this.text;
			for(i=0; i<children.length; i++){
				Line child = (Line) children.get(i);
				rv = rv + "\n" + child.fullText(leading + "    ");
			}
			return rv;
		},
		
		'countIndent': function(){
			c = 0;
			while(c < raw.length && raw.charAt(c) == ' '){
				c++;
			}
			this.indent = c-1
		}

		'isComment': function(){
			if(text.length == 0){
				return true;
			}
			return text[0] == '#'
		}

		'getFlower': function(){
			Petal p = (Petal) parent;
			return p.getFlower();
		}

		'radius': function(){
			if (_radius < 0){
				Petal pp = (Petal) parent;
				float proportion = lineCount() / pp.lineCount();
				_radius = (int)sqrt(proportion * pow(pp.radius(),2.));
			}
			return _radius;
		},

		'angle': function(){
			if(_angle < 0){
				ArrayList siblings = parent.getChildren();
				int index = siblings.indexOf(this);
				_angle = 2 * PI * (index / siblings.length);
			}
			return _angle;
		},

		'center': function(){
			if(_center.x < 0){
				Petal pp = (Petal) parent;
				Point p = pp.center();
				float distance = pp.radius() + 0.9 * (4./3.) * radius();
				int x = (int)(p.x + (sin(angle()) * distance));
				int y = (int)(p.y + (cos(angle()) * distance));
				_center.x = x;
				_center.y = y;
			}
			return _center;
		},

		'draw': function() {
			Point pos = center();
			if( children.length > 0 ){
				for(int i=0; i<children.length; i++){
					Line line = (Line) children.get(i);
					line.draw();
				}
			}
			flower_layer.stroke(200, 200, 0);  
			flower_layer.strokeWeight(1);
			flower_layer.fill(230, 230, 210);
			flower_layer.pushMatrix();
			flower_layer.translate(pos.x, pos.y);
			flower_layer.rotate(-1*angle());
			flower_layer.ellipse(0, 0, radius()*1.5, radius()*(8./3.));
			flower_layer.line(0,radius()*(4./-3.), 0, radius()*.75);
			flower_layer.popMatrix();
		},

		'intersecting': function(int x, int y){
			if(center().distance(x, y) < radius()){
				return this;
			}
			Hoverable rv = null;
			for(int i=0; i<children.length; i++){
				Hoverable container = (Hoverable) children.get(i);
				rv = container.intersecting(x, y);
				if(rv != null){
					return rv;
				}
			}
			return rv;
		}
	}
}
