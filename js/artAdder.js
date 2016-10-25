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
    replacedCount : 0,

    processAdNode : function (elem) {

      var goodBye = false;
      var reason = "";
      var tagType = ["IFRAME", "IMG", "DIV","LI"];  //A,INS?

      debug && console.log("[Process Node]", elem);
      
      //Step1: Ignore tiny tracking elements
      if (elem.offsetWidth < 2 || elem.offsetHeight < 2) {
        reason = "Size is too small";
        goodBye = true;
      }
      
      //Step2: Check the tag
      if (tagType.indexOf(elem.tagName) < 0) {
        reason = "Type not match";
        goodBye = true;
      }

      //Step3: Check if the element has already been replaced with AdLiPo wrapper

      // if( elem.tagName == 'DIV' && elem.find('.AdLiPoWrapper').length>0) 
      // console.log("child",elem.find(img))
      if ($(elem).data('replaced')) {
        reason = "Duplicate";
        goodBye = true;
      } 
      $(elem).data('replaced', true);

      //Ignore elements that doesn't match the requirements
      if (debug && goodBye) console.log("[Ignore] " + reason);
      if (goodBye) return;
      
      if (elem.tagName == 'IFRAME' || elem.tagName == 'IMG' ) {
        this.addWrapper(elem, "append");
      }
      else {
        //DIV & LI is only for TEXT ADS
        //only when if there is no img/iframe inside
        if( this.checkImagesAndIframes(elem)){
          debug && console.log("[Text Ad]");
          this.addWrapper(elem, "cover");
        }
      
      }
      return true;
    },
    
    addWrapper : function(elem, style) {

      //add AdLiPo Wrapper 

      var origW = elem.offsetWidth;
      var origH = elem.offsetHeight;
      var margin = 0; //tmp

      debug && console.log("Width: " + origW + " Height: " + origH + " Margin " + margin);
      this.replacedCount++;
      console.log(this.replacedCount);

      var wrapper = document.createElement('div');
      wrapper.className = 'AdLiPoWrapper';
      wrapper.id = 'Poem'+ this.replacedCount;
      wrapper.style.width = origW + 'px';
      wrapper.style.height = origH + 'px';
      wrapper.style.backgroundColor = get_random_color();

      if (style == "append") {

        wrapper.style.position = 'relative';

        debug && console.log("Append Wrapper To Parent:",elem.parentElement);
        elem.parentElement.appendChild(wrapper);

        $(elem).hide();

      }

      if (style == "cover") {
        wrapper.style.position = 'absolute';
        wrapper.style.top = '0px';
        wrapper.style.left = '0px';

        elem.style.position = 'relative';

        debug && console.log("Append Wrapper to Element:",elem);
        elem.appendChild(wrapper);
      }

      debug && console.log("[AdLiPo Wrapper]", wrapper);

      // Add Text
      injectAd("#" + wrapper.id, origW, origH, margin);
    
    },

    checkImagesAndIframes : function(elem) {
    //dealing with conditions when small icons are added to the Text ad Element
      var imgs = $(elem).find("img");
      var iframes = $(elem).find("iframe") || $(elem).find("div[class~='iframe']") || $(elem).find("div[id~='iframe']");
      console.log("[IFRAME]",iframes);
      debug && console.log("[CheckImage]", elem);

      if(imgs.length === 0 && iframes.length === 0) 
        return true;
      else if(iframes.length != 0) {
        debug && console.log("[Ignore] Iframe Inside", elem);
        return false;
      }
      else if(imgs.length != 0){
        
        for(var i = 0; i < imgs.length; i++) {

          if(imgs[i].offsetWidth > 15 || imgs[i].offsetHeight > 15) {
            debug && console.log("[Ignore] Image Inside", elem);
            return false;
          }
            
        }
        //no image larger than 15*15px
        return true;
       
      }
       
    },

    // abstract storage for different browsers
    localSet : function (key, thing) {
      var d = Q.defer();
      if (typeof chrome !== 'undefined') {
        var save = {};
        save[key] = thing;
        chrome.storage.local.set(save, d.resolve);
      }
      return d.promise;
    },

    localGet : function (key) {
      var d = Q.defer();
      if (typeof chrome !== 'undefined') {
        chrome.storage.local.get(key, d.resolve);
      }
      return d.promise;
    },

    fetchSelectorList : function () {
      debug && console.log("fetching easyList");
      $.ajax({
        url : 'https://easylist-downloads.adblockplus.org/easylist.txt',
        type : 'get',
        success : function (txt){
          debug && console.log("seccessfully get the list!");
          var txtArr = txt.split("\n").reverse() ;
          var selectors = txtArr.filter(function (line) {
            return /^##/.test(line);
          })
          .map(function (line) {
            return line.replace(/^##/, '');
          })

          var whitelist = txtArr.filter(function (line){
            return /^[a-z0-9]/.test(line) && !/##/.test(line);
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
      return artAdder.localGet('selectors').then(function (obj) {
        return obj.selectors;
      })
    }

  }//End of Art Adder

  window.artAdder = artAdder;
})();


