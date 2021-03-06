//
// bling.js but using qS and qSA
//
window.$ = document.querySelector.bind(document);
window.$$ = document.querySelectorAll.bind(document);

Node.prototype.on = window.on = function (name, fn) {
  this.addEventListener(name, fn);
}

NodeList.prototype.__proto__ = Array.prototype;

NodeList.prototype.on = NodeList.prototype.addEventListener = function (name, fn) {
  this.forEach(function (elem, i) {
    elem.on(name, fn);
  });
}

//
// requestAnimationFrame polyfill
//
var reqAnimationFrame = (function () {
  return window[Hammer.prefixed(window, 'requestAnimationFrame')] || function (callback) {
    window.setTimeout(callback, 1000 / 60);
  };
})();

//
// Blur all form fields
//
// @see http://stackoverflow.com/a/29237391/175551
//
function blurAll(){
  var tmp = document.createElement("input");
  document.body.appendChild(tmp);
  tmp.focus();
  document.body.removeChild(tmp);
}

//
// unFocus
//
// In the new UI, the add buttons are no longer form elements. "blurring" is not
// a matter of focusing on an invisible form item. It is done stylistically.
//
function unFocus() {
  $$('.proto').forEach(function unFocusProto(el) {
    el.classList.remove('active');
  });
}

//
// Coerce things (mostly strings) to numbers.
//
function n(x) {
  return Number(x);
}


//
// Math stuff
//
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};


//
// Debug functions
//
function debugCanvas(scene_transform) {
  var debug = 't:' + scene_transform.x +','+ scene_transform.y +' s:'+ scene_transform.scale;
  $('.debug--canvas').innerText = debug;
}

function debugShape(shape) {
  var debug = 't:' + shape.translation +' s:'+ shape.scale +' r:'+ shape.rotation;
  $('.debug--shape').innerText = debug;
}
