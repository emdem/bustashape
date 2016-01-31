var client = new client();
var me = {};

// Initialize two.js
var canvas = document.getElementById('canvas');
var params = { width: '100%', height: '100%' };
var two = new Two(params).appendTo(canvas);

// // debug
// console.info('💥 two.js initialized using ' + two.type + ' renderer.')

// Define some constants for two.js
var START_WIDTH = 200; // start width
var START_HEIGHT = 200; // start height
var START_RADIUS = 100; // start size radius
var START_X = 100; // start position X
var START_Y = 100; // start position Y
var START_SCALE = 1;
var START_ANGLE = 0;

/**
 * Add a new shape.
 */
$('#add').on('click', function(ev) {
  // Send to ALL clients including self. It doesn't immediately add a shape to
  // your DOM, the 'add' listener below handles that part.
  socket.emit('add', {
    id: 'shape-' + Math.floor(Math.random() * 1000000000),
    class: $('#shape').value,
    opacity: $('#opacity').value,
    color: $('#color').value,
    borderColor: $('#color').value,
    mixBlendMode: $('#mix-blend').value
  });
  ev.preventDefault();
});

/**
 * Listen for new shapes and add them to DOM.
 */
socket.on('add', function(props) {
  // console.info(props);

  // Create new shape
  if (props.class === 'circle') {
    var shape = two.makeCircle(START_X, START_Y, START_RADIUS);
  } else if (props.class === 'ellipse') {
    var shape = two.makeEllipse(START_X, START_Y, START_WIDTH/1.5, START_HEIGHT);
  } else if (props.class === 'triangle') {
    var shape = two.makePolygon(START_X, START_Y, START_WIDTH/1.5, 3);
  } else {
    var shape = two.makeRectangle(START_X, START_Y, START_WIDTH, START_HEIGHT);
  }

  // Fill out common props
  shape.id = props.id;
  shape.fill = props.color;
  shape.opacity = props.opacity;
  shape.noStroke();

  // Draw shape for first time.
  two.update();

  // Reference DOM element to allow direct manipulation for a few things.
  var el = document.getElementById(shape.id);
  el.style.mixBlendMode = props.mixBlendMode;

  // Set up Hammer. Also uses direct DOM node.
  var mc = new Hammer.Manager(el);
  var initX;
  var initY;
  var initAngle = START_ANGLE;
  var initScale = START_SCALE;
  var timer;
  var ticking = false;
  var transform = {
    x: 0,
    y: 0,
    scale: initScale,
    angle: initAngle,
  };


  //----------------------------------------------------------------------------
  // Touch gestures
  //----------------------------------------------------------------------------

  // Set up the main gesture, multi-touch dragging/rotating
  mc.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
  mc.add(new Hammer.Rotate({ threshold: 0 })).recognizeWith(mc.get('pan'));
  mc.add(new Hammer.Pinch({ threshold: 0 })).recognizeWith([mc.get('pan'), mc.get('rotate')]);
  mc.on("panstart panmove", onPan);
  mc.on("rotatestart rotatemove", onRotate);
  mc.on("pinchstart pinchmove", onPinch);

  // Tapping gesture
  // mc.add(new Hammer.Tap());
  // mc.on("tap", onTap);

  // Double tapping gesture
  // mc.add(new Hammer.Tap({ event: 'doubletap', taps: 2 }));
  // mc.on("doubletap", onDoubleTap);

  // Clean up all gestures by doing a final render/broadcast.
  mc.on("hammer.input", function(ev) {
    if(ev.isFinal) {
      requestElementUpdate();
      el.classList.remove('grabbing');
    }
  });


  /**
   * Hammer: listen for pan
   */
  function onPan(ev) {
    if (ev.type === 'panstart') {
      // The first time any shape moves, it needs this class removed.
      el.classList.remove('unchanged');
      // Change cursor on screens that have one.
      el.classList.add('grabbing');

      // Get the starting position for this gesture
      initX = transform.x || START_X;
      initY = transform.y || START_Y;
    }

    // We're already moving, use the values we stored during 'panstart'
    if (ev.type === 'panmove') {
      transform.x = parseInt(initX, 10) + parseInt(ev.deltaX, 10);
      transform.y = parseInt(initY, 10) + parseInt(ev.deltaY, 10);
    }

    requestElementUpdate();
  }

  /**
   * Hammer: listen for pinch
   */
  function onPinch(ev) {
    if (ev.type === 'pinchstart') {
      initScale = transform.scale || 1;

      // Change cursor on screens that have one.
      el.classList.add('grabbing');
    }

    transform.scale = initScale * ev.scale;

    requestElementUpdate();
  }

  /**
   * Hammer: listen for rotate
   */
  function onRotate(ev) {
    if (ev.type === 'rotatestart') {
      initAngle = transform.angle || START_T_RZ;

      // Change cursor on screens that have one.
      el.classList.add('grabbing');
    }

    transform.rz = 1;
    transform.angle = parseInt(initAngle, 10) + parseInt(ev.rotation, 10);

    requestElementUpdate();
  }

  /**
   * Hammer: listen for tap
   */
  // function onTap(ev) {
  //   clearTimeout(timer);

  //   timer = setTimeout(function () {
  //     requestElementUpdate();
  //   }, 200);

  //   requestElementUpdate();
  // }

  /**
   * Hammer: listen for double tap
   */
  // function onDoubleTap(ev) {
  //   transform.rx = 1;
  //   transform.angle = 80;

  //   clearTimeout(timer);
  //   timer = setTimeout(function () {
  //     requestElementUpdate();
  //   }, 500);
  //   requestElementUpdate();
  // }

  //----------------------------------------------------------------------------
  // Rendering functions
  //----------------------------------------------------------------------------

  /**
   * Ask for a render and broadcast the shape's current properties.
   */
  function requestElementUpdate(broadcast) {
    if (!ticking) {
      reqAnimationFrame(redrawElement);
      ticking = true;

      if (broadcast !== false) {
        client.send('change', {
          me: socket.id,
          id: props.id,
          transform: transform
        });
      }
    }
  }

  /**
   * Talks to two.js and redraws elements.
   */
  function redrawElement() {
    // Tell two.js to update shape
    shape.translation.set(transform.x, transform.y);
    shape.scale = transform.scale;
    shape.rotation = Math.radians(transform.angle);

    // Redraw
    two.update();
    ticking = false;
  }

  //----------------------------------------------------------------------------
  // Socket listeners
  //----------------------------------------------------------------------------

  /**
   * Listen for this shape to change.
   */
  socket.on('change', function(props) {
    if (props.id === el.id) {
      // In case this is the first time the shape has moved, remove this class.
      el.classList.remove('unchanged');

      // Transform and animate the shape.
      transform = props.transform;
      requestElementUpdate(false);
    }
  });
});

// Converts from degrees to radians.
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};
