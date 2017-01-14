  (function () {

  'use strict';
  var howMany = 3,
      tried = 0,
      replacedCount = 0,
      dbug = false;
  
  var fontUrl = "url('chrome-extension://" + chrome.runtime.id + "/web/fonts/BenchNine.ttf')";
  var BenchFontFace = new FontFace('custom', fontUrl);
  document.fonts.add(BenchFontFace);
  BenchFontFace.load();
    //Wait for fonts to load
  BenchFontFace.loaded.then(function(){
    // dbug && logFontInfo();
    checkNodes();
  })

function checkNodes(){
     chrome.runtime.sendMessage({
     what: "getSelectors"
    }, function (obj) {
      // console.log(obj);
    var selectors = obj.selectors;
    var host = window.location.hostname;
    var skips = [];
    
    if (host) {
      var whitelist = obj.whitelist;
      var domain = host.replace('www.','');

      for (var i = 0; i < whitelist.length-1; ++i) {
          if (whitelist[i][0].indexOf(domain) >= 0) skips.push(whitelist[i][1])
      }
     
    }
    
    ;(function checkIFrames() {
       dbug && console.log("[TRIED]" + tried);
       var myNodeList = document.querySelectorAll(selectors.join(','));

          for (var i = 0; i < myNodeList.length; ++i) {

              var item = myNodeList[i];
              if (skips.length == 0 || !item.matches(skips.join(',')))
                  processAdNode(item);

          }

          if (++tried < howMany) {
              setTimeout(checkIFrames, 3000)
          }
 

    })()
  })
}

function processAdNode(elem){
  
      var goodBye = false;
      var reason = "";
      var tagType = ["IFRAME", "IMG", "DIV","LI"];  //A,INS?

      dbug && console.log("[Process Node]", elem);
      
      
      
      //Step1: Check the tag
      if (tagType.indexOf(elem.tagName) < 0) {
        reason = "Type not match";
        goodBye = true;
      }

      //Step2: Ignore tiny tracking images
      if (elem.tagName === "IMG" && (elem.offsetWidth < 2 || elem.offsetHeight < 2)) {
        reason = "Size is too small" + elem.offsetWidth + " " + elem.offsetHeight;
        goodBye = true;
      }

      //Step3: Check if the element has already been replaced with AdLiPo wrapper
      
      if (elem.classList.value.indexOf("AdLiPo") >= 0) {
          reason = "Duplicate";
          goodBye = true;
      }
      
      //Ignore elements that doesn't match the requirements
      if (dbug && goodBye) console.log("[Ignore] " + reason);
      if (goodBye) return;
      
      if (elem.tagName == 'IFRAME' || elem.tagName == 'IMG' ) {
        addWrapper(elem, "append");
      }
      else {
        //DIV & LI is only for TEXT ADS
        //only when if there is no img/iframe inside
        // if( checkImagesAndIframes(elem)){
        //   dbug && console.log("[Text Ad]");
          addWrapper(elem, "cover");
        // }
      
      }
      return true;
}

function checkImagesAndIframes(elem) {
    //dealing with conditions when small icons are added to the Text ad Element
    var imgs = elem.getElementsByTagName('img');
    var iframes = elem.getElementsByTagName("iframe");
    //|| $(elem).find("div[class~='iframe']") || $(elem).find("div[id~='iframe']");
    dbug && console.log("[Check Image & Iframes]", elem);

    if (imgs.length === 0 && iframes.length === 0)
        return true;
    else if (iframes.length != 0) {
        dbug && console.log("[Ignore] Iframe Inside", elem);
        return false;
    } else if (imgs.length != 0) {

        for (var i = 0; i < imgs.length; i++) {

            if (imgs[i].offsetWidth > 15 || imgs[i].offsetHeight > 15) {
                dbug && console.log("[Ignore] Image Inside", elem);
                return false;
            }

        }
        //no image larger than 15*15px
        return true;

    }

}

function addWrapper(elem, style) {

   //add AdLiPo Wrapper 

   var origW = elem.offsetWidth;
   var origH = elem.offsetHeight;
   var margin = 5; //tmp

   dbug && console.log("Width: " + origW + " Height: " + origH + " Margin " + margin);

   //minHeight = 18 + 5*2;
   if (origH < 28 || origW < 50) {
       dbug && console.log("Ignore! DIV too small!");
       return;
   }

   replacedCount++;

   var wrapper = document.createElement('div');
   wrapper.className = 'AdLiPoWrapper';
   wrapper.id = 'Poem' + replacedCount;
   wrapper.style.width = origW + 'px';
   wrapper.style.height = origH + 'px';
   wrapper.style.backgroundColor = getColor();

   //if the parentElement is a tag -- avoid any a tag css from the site

   if (elem.parentElement.tagName === "A") {
       elem = elem.parentElement;
   }

   if (style == "append") {

       wrapper.style.position = 'relative';

       dbug && console.log("Append Wrapper To Parent:", elem.parentElement);
       elem.parentElement.appendChild(wrapper);

       elem.style.display = 'none';

   }

   if (style == "cover") {
       wrapper.style.position = 'absolute';
       wrapper.style.top = '0px';
       wrapper.style.left = '0px';

       elem.style.position = 'relative';

       dbug && console.log("Append Wrapper to Element:", elem);
       elem.appendChild(wrapper);
   }

   elem.className += ' AdLiPo';

   dbug && console.log("[AdLiPo Wrapper]", wrapper);

   // Add Text
   // console.log("CompatMode:" + document.compatMode);
   injectAd("#" + wrapper.id, origW, origH, margin);

}

function getColor() {
    var palette = ['#4484A4', '#A2B6C0', '#889D59', '#CF8D2F', '#C55532'];
    return palette[Math.floor(Math.random() * palette.length)];
  }

function logFontInfo() {
    console.log('There are', document.fonts.size, 'FontFaces loaded.\n');
    for (var fontFace of document.fonts.values()) {
        console.log('FontFace:');
        for (var property in fontFace) {
            console.log('  ' + property + ': ' + fontFace[property]);
        }

    }
}

})();