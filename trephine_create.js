// From the trephine.org blog, after googling around a bit, I liked it most

Object.beget = (function(){                    // closure to create scope
  var anonymous = function(){};                 // anonymous function to create objects
  return function beget(prototype, opt) {      // define and return the "create" func
    anonymous.prototype = prototype;            // establish prototypal inheritance
    var object = new anonymous();               // create the new object
    if (typeof opt!=="object") return object;   // short-circuit if no options
    var has = Object.prototype.hasOwnProperty;  // reference to canonical property test
    for (var k in opt) {                        // loop over option keys
      if (has.call(opt, k)) {                   // if the key belongs to the object
        object[k] = opt[k];                     // duplicate the property
      }
    }
    return object;                              // return the new object
 };
})();                                           // end scoping closure

