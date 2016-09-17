var debug = true;

(function() {

  'use strict';

  /******************************************************************************/

function rand(min, max) {
    return min + Math.random() * (max - min);
}

function get_random_color() {
    var h = rand(1, 360);
    var s = rand(0, 100);
    var l = rand(0, 100);
    return 'hsl(' + h + ',' + s + '%,' + l + '%)';
}
  var artAdder = {
    replacedCount : '',
    processAdNode : function (elem) {

       var goodBye = false
      if (elem.offsetWidth < 2) goodBye = true
      if (elem.offsetHeight < 2) goodBye = true
      if (elem.tagName !== 'IFRAME'
          && elem.tagName !== 'IMG'
          // && elem.tagName !== 'DIV'
          // && elem.tagName !== 'OBJECT'
          // && elem.tagName !== 'A'
          // && elem.tagName !== 'INS'
          ) goodBye = true

      if ($(elem).data('replaced')) goodBye = true
      $(elem).data('replaced', true)
      if (goodBye) return

      debug && console.log("Find Ad:",elem);
      debug && console.log("Parent:",elem.parentElement);

        var origW = elem.offsetWidth
        var origH = elem.offsetHeight
        debug && console.log(origW,origH);

        var wrapper = document.createElement('div')
        wrapper.className = 'AdLiPoWrapper'
        wrapper.style.width = origW + 'px'
        wrapper.style.height = origH + 'px'
        wrapper.style.position = 'relative'
        wrapper.style.backgroundColor = get_random_color()
        console.log(wrapper);
        elem.parentElement.appendChild(wrapper);

        $(elem).hide();

      return true
    },

    // abstract storage for different browsers
    localSet : function (key, thing) {
      var d = Q.defer()
      if (typeof chrome !== 'undefined') {
        var save = {}
        save[key] = thing
        chrome.storage.local.set(save, d.resolve)
      }
      return d.promise
    },
    localGet : function (key) {
      var d = Q.defer()
      if (typeof chrome !== 'undefined') {
        chrome.storage.local.get(key, d.resolve)
      }
      return d.promise
    },

    fetchSelectorList : function () {
      debug && console.log("fetching easyList");
      $.ajax({
        url : 'https://easylist-downloads.adblockplus.org/easylist.txt',
        type : 'get',
        success : function (txt){
          debug && console.log("seccessfully get the list!");
          var txtArr = txt.split("\n").reverse() 
          var selectors = txtArr 
                .filter(function (line) {
                  return /^##/.test(line)
                })
                .map(function (line) {
                  return line.replace(/^##/, '')
                })

          var whitelist = txtArr
                .filter(function (line){
                  return /^[a-z0-9]/.test(line) && !/##/.test(line)
                })
                .map(R.split('#@#'))
          artAdder.localSet('selectors', {
            selectors : selectors,
            whitelist : whitelist
          })
        }
      })
    },
    getSelectors : function () {
      return artAdder.localGet('selectors')
      .then(function (obj) {
        return obj.selectors
      })
    }

  }//End of Art Adder

  window.artAdder = artAdder
})();


