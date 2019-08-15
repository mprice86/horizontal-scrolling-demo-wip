import anime from './libs/anime.es.js';

anime({
  targets: '.pow-stage',
  translateY: ['0', '-100', '0'],
  delay: function (el, index) {
    return index * 100;
  },
  ease: 'ease',
  loop: true,
});

// Device functionality detection
var device = (function() {
  function isTouch() {
    var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
    var mq = function (query) {
      return window.matchMedia(query).matches;
    }
  
    if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
      return true;
    }
  
    var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
    return mq(query);
  }

  function passiveSupported() {
    try {
      window.addEventListener('test', null, Object.defineProperty({}, 'passive', { get: function() { 
        return true; 
      }}));
    } catch(err) {}
  }

  return {
    _isTouch: isTouch,
    _passiveSupported: passiveSupported,
  }
})();

// Set up horizontal scroll 
var scrollConversion = (function () {
  var _scrollZone, _translZone;

  function init(scrollZone, translZone) {
    _scrollZone = scrollZone;
    _translZone = translZone;

    try {
      _scrollZone.addEventListener('wheel', convertScrollToTranslate, false);
    } catch (e) {
      console.log(e);
    }
  }

  function convertScrollToTranslate(ev) {
    // If scroll has moved on vertical axis
    if (ev.deltaY != 0) {
      var delta = ev.deltaY;

      // Invert value: negative => positive || positive => negative
      if (delta < 0) {
        delta = delta * -1;
      } else {
        delta = -Math.abs(delta);
      }

      // Get x-val attribute if set
      var xVal = (_translZone.getAttribute('x-val') * 1 + delta);

      // Don't allow scrolling past the start of end of the content
      // TODO: add screen edge flash animation here
      if (xVal > 0 || xVal * -1 >= _translZone.offsetWidth) return;

      // Update x-val, translate content horizonally
      _translZone.setAttribute('x-val', xVal);
      _translZone.setAttribute('style', 'transform: translateX(' + xVal + 'px);');
    }
  }

  return {
    init: init,
  }
})();

var animations = (function() {
  var passiveIfSupported = false;
  passiveIfSupported = device._passiveSupported();

  // Get elements that haven't yet been animated
  var animationEls = document.querySelectorAll('.js-animate:not(.shown)');

  if (animationEls.length) {
    initAnimations();
    window.addEventListener('scroll', initAnimations, passiveIfSupported);
  }

  function initAnimations() {
    // Get elements again so we're not doing unnecessary itterations
    animationEls = document.querySelectorAll('.js-animate:not(.shown)');

    for (var i = 0; i < animationEls.length; i++) {
      checkForTransition(animationEls[i]);
    }
  }

  // If element is within the viewport add 'shown' class to start animation
  function checkForTransition(el) {
    if (window.innerHeight >= el.getBoundingClientRect().top) {
      el.classList.add('shown');
    } else {
      el.classList.remove('shown');
    }
  }

  // Reset functionality for demonstration purposes only
  function resetAnimations() {
    animationEls = document.querySelectorAll('.js-animate.shown');
    for (var i = 0; i < animationEls.length; i++) {
      animationEls[i].classList.remove('shown');
    }

    setTimeout(function() {
      window.scrollTo(0,0);
    }, 1000);
  }
  
  return {
    _reset: resetAnimations,
    _check: checkForTransition
  }

})();



















// Trigger set up of ... everything
// setup animations


// setup scroll conversion or touch controls
if (device._isTouch() === false) {
  scrollConversion.init(document.body, document.querySelector('.wrapper'));
} else {
  console.log('touch device detected');
  // set up touch controls
}
