/**
 * Sets up a custom, cross-browser compatible Event which can be manually triggered
 * @param {String} eventName Name of the custom event
 */
var customEvents = (function () {
  function createNewEvent(eventName) {
    var event;
    if (typeof (Event) === 'function') {
      event = new Event(eventName);
    } else {
      event = document.createEvent('Event');
      event.initEvent(eventName, true, true);
    }
    return event;
  }

  return {
    create: createNewEvent
  };
})();

/**
 * Device functionality detection
 */
var device = (function () {
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

  function isMobile() {
    return window.matchMedia('(max-width: 1100px)').matches;
  }

  function passiveSupported() {
    try {
      window.addEventListener('test', null, Object.defineProperty({}, 'passive', {
        get: function () {
          return true;
        }
      }));
    } catch (err) {}
  }

  return {
    _isTouch: isTouch,
    _isMobile: isMobile,
    _passiveSupported: passiveSupported,
  }
})();

var animations = (function () {
  var passiveIfSupported = false;
  var _translZone;

  // Get elements that haven't yet been animated
  var animationEls = document.querySelectorAll('.js-animate:not(.shown)');

  function initAnimations(movingTarget, horizonalScroll) {
    passiveIfSupported = device._passiveSupported();
    _translZone = movingTarget;

    if (animationEls.length && horizonalScroll) {
      runCheckHorizontal();
      _translZone.addEventListener('translate', runCheckHorizontal, passiveIfSupported);
    } else if (animationEls.length && !horizonalScroll) {
      runCheckVertical();
      _translZone.addEventListener('scroll', runCheckVertical, passiveIfSupported);
    }
  }

  function runCheckHorizontal() {
    for (var i = 0; i < animationEls.length; i++) {
      checkChildrenForStagger(animationEls[i]);
      checkForTransitionHorizontal(animationEls[i]);
    }

    // Get elements again so we're not doing unnecessary itterations
    animationEls = document.querySelectorAll('.js-animate:not(.shown)');
  }

  function runCheckVertical() {
    for (var i = 0; i < animationEls.length; i++) {
      checkChildrenForStagger(animationEls[i]);
      checkForTransitionVertical(animationEls[i]);
    }

    // Get elements again so we're not doing unnecessary itterations
    animationEls = document.querySelectorAll('.js-animate:not(.shown)');
  }

  function checkChildrenForStagger(el) {
    if (el.classList.contains('stagger-children')) {
      var childEls = el.querySelectorAll('.js-animate');

      for (var c = 0; c < childEls.length; c++) {
        childEls[c].setAttribute('style', 'transition-delay: ' + 500 * c + 'ms;');
      }
    }
  }

  // If element is within the viewport add 'shown' class to start animation
  function checkForTransitionHorizontal(el) {
    if (window.innerWidth / 1.5 >= el.getBoundingClientRect().left) {
      el.classList.add('shown');
    } else {
      el.classList.remove('shown');
    }
  }

  // If element is within the viewport add 'shown' class to start animation
  function checkForTransitionVertical(el) {
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
  }

  return {
    _init: initAnimations,
    _reset: resetAnimations,
    _checkX: runCheckHorizontal,
    _checkY: runCheckVertical,
  }
})();

var invertscroll = (function () {
  var defaults = {
    width: 'auto',
    height: 'auto',
    onScroll: function (percent) {
      animations._checkX();
    }
  };

  var longest = 0,
    totalHeight,
    winHeight,
    winWidth,
    config,
    _elements,
    _options;

  function init(elements, options) {
    if (elements === undefined) {
      return;
    }

    _elements = elements;

    if (options) {
      _options = options;
      config = extend(defaults, _options);
    } else {
      config = defaults;
    }

    for (var i = 0; i < _elements.length; i++) {
      var w = _elements[i].offsetWidth;
      if (longest < w) {
        longest = w;
      }
    }

    if (config.width === 'auto') {
      config.width = longest;
    }

    if (config.height === 'auto') {
      config.height = longest;
    }

    document.body.setAttribute('style', 'height: ' + config.height + 'px;');
  }

  function calc() {
    totalHeight = document.documentElement.scrollHeight;
    winHeight = document.documentElement.clientHeight;
    winWidth = document.documentElement.clientWidth;
  }

  function onScroll(e) {
    var currY = window.scrollY;

    // Make calculations
    calc();

    var diff = totalHeight - winHeight;
    var scrollPercent = 0;

    if (diff != 0) {
      // Current percentual position
      scrollPercent = (currY / diff).toFixed(4);
    }

    // Call the onScroll callback
    if (typeof config.onScroll === 'function') {
      config.onScroll.call(this, scrollPercent);
    }

    for (var i = 0; i < _elements.length; i++) {
      var deltaW = _elements[i].offsetWidth - winWidth;
      if (deltaW <= 0) {
        deltaW = _elements[i].offsetWidth;
      }
      var pos = Math.floor(deltaW * scrollPercent) * -1;
      _elements[i].setAttribute('style', 'transform: translate3d(' + pos + 'px, 0, 0);');
    }
  }

  function setlisteners() {
    // Listen for the actual scroll event
    window.addEventListener('scroll', onScroll, false);
    window.addEventListener('resize', onScroll, false);
    document.addEventListener('ready', calc, false);
  }


  function extend(obj1, obj2) {
    var keys = Object.keys(obj2);
    for (var i = 0; i < keys.length; i += 1) {
      var val = obj2[keys[i]];
      obj1[keys[i]] = ['string', 'number', 'array', 'boolean'].indexOf(typeof val) === -1 ? extend(obj1[keys[i]] || {}, val) : val;
    }
    return obj1;
  }

  // Init actions
  init();
  setlisteners();

  return {
    init: init,
    reinitialize: function () {
      init();
      setlisteners();
    },
    destroy: function () {
      // Remove previously added inline styles
      document.body.setAttribute('style', '');
      window.removeEventListener('scroll', onScroll, false);
      window.removeEventListener('resize', onScroll, false);
      document.removeEventListener('ready', calc, false);
    }
  };
})();

var parallaxPosition = (function () {
  var elements = document.querySelectorAll('*[data-attach]');
  console.log(elements);
  var targets = [];

  for (var i = 0; i < elements.length; i++) {
    var target = document.getElementById(elements[i].getAttribute('data-attach'));
    var position = elements[i].getAttribute('data-position');

    if (target) {
      targets.push(target);
    }

    // if position === null then set to right by default
    if (position === undefined) {
      position = 'right';
    }

    // positionElement(target, elements[i], position);
  }

  function positionElement(target, el, position) {
    var top = target.offsetTop + (target.offsetHeight / 2);

    switch (position) {
      case 'right':
        var right = (target.offsetLeft + target.offsetWidth);
        el.setAttribute('style', 'left: ' + right + 'px; top: ' + top + 'px; transform: translate(0, -50%);');
        break;
      case 'left':
        var left = target.offsetLeft - el.offsetWidth;
        el.setAttribute('style', 'left: ' + left + 'px; top: ' + top + 'px; transform: translate(0, -50%);');
    }
  }
})();

invertscroll.init(document.querySelectorAll('.scroll'));
animations._init(document.querySelector('.wrapper'), true);