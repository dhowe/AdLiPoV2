var debug = false;

(function() {

  'use strict';

  /******************************************************************************/

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function getColor() {
    var palette = ['#4484A4', '#A2B6C0', '#889D59', '#CF8D2F', '#C55532'];
    return palette[Math.floor(Math.random() * palette.length)];
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
      
      if (elem.classList.value.indexOf("AdLiPo") >= 0) {
          reason = "Duplicate";
          goodBye = true;
      }
      else{
         elem.className += ' AdLiPo';
      }
     
      
      //Ignore elements that doesn't match the requirements
      if (debug && goodBye) console.log("[Ignore] " + reason);
      if (goodBye) return;
      
      if (elem.tagName == 'IFRAME' || elem.tagName == 'IMG' ) {
        this.addWrapper(elem, "cover");
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
      var margin = 5; //tmp

      debug && console.log("Width: " + origW + " Height: " + origH + " Margin " + margin);
      this.replacedCount++;

      var wrapper = document.createElement('div');
      wrapper.className = 'AdLiPoWrapper';
      wrapper.id = 'Poem'+ this.replacedCount;
      wrapper.style.width = origW + 'px';
      wrapper.style.height = origH + 'px';
      wrapper.style.backgroundColor = getColor();

      if (style == "append") {

        wrapper.style.position = 'relative';

        debug && console.log("Append Wrapper To Parent:",elem.parentElement);
        elem.parentElement.appendChild(wrapper);

        elem.style.display = 'none'; 

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
    var imgs =  elem.getElementsByTagName('img');
      var iframes = elem.getElementsByTagName("iframe");
      //|| $(elem).find("div[class~='iframe']") || $(elem).find("div[id~='iframe']");
      debug && console.log("[Check Image & Iframes]", elem);

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
      var d = new Promise(
          function(resolve, reject) {
              if (typeof chrome !== 'undefined') {
                  var save = {};
                  save[key] = thing;
                  chrome.storage.local.set(save, resolve);
              }
          });
      return d;
    },

    localGet : function (key) {
      var d = new Promise(
          function(resolve, reject) {
              if (typeof chrome !== 'undefined') {
                  chrome.storage.local.get(key, resolve);
              }
          });
      return d;
    },

    fetchSelectorList: function() {
      debug && console.log("Fetching easyList");
      var request = new XMLHttpRequest();
      //request.open('GET', 'https://easylist-downloads.adblockplus.org/easylist.txt', true);
      request.open('GET', 'https://raw.githubusercontent.com/dhowe/uAssets/master/thirdparties/easylist-downloads.adblockplus.org/easylist.txt', true);
      request.onload = function() {
          if (request.status >= 200 && request.status < 400) {
              // Success!
              var txt = request.responseText;
              debug && console.log("Seccessfully get the list!");
              var txtArr = txt.split("\n").reverse();
              var selectors = [], whitelist = [];

              for (var i = 0; i < txtArr.length; i ++) {
                  if (txtArr[i].indexOf("##") == 0) 
                  selectors.push(txtArr[i].slice(2));
                  else if(txtArr[i].indexOf("#@#") > 0){
                    var pair = txtArr[i].split('#@#');
                  whitelist.push(pair);  
                  }
                  
              }

              artAdder.localSet('selectors', {
                  selectors: selectors,
                  whitelist: whitelist
              })

          } else {
               console.log("Server reached. Failed to get the list");
          }
      };

      request.onerror = function() {
          console.log("Failed to get the list");
      };

      request.send();
  },

    getSelectors : function () {

      return artAdder.localGet('selectors').then(function (obj) {
        return obj.selectors;
      })
    }

  }//End of Art Adder

  window.artAdder = artAdder;
})();


