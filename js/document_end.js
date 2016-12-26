  var howMany = 3
  var tried = 0
  
  //add css for font
  var css = document.createElement("style");
  css.type = "text/css";
  css.innerHTML = "@font-face { font-family: custom; src: url('chrome-extension://geimeffhpddnekhhligdoihaeacdjohg/web/fonts/BenchNine.ttf'); }";
  document.body.appendChild(css);
  

  Promise.resolve(artAdder.getSelectors())
  .then(function (obj){
    var selectors = obj.selectors;
    var host = window.location.hostname;
    var skips = [];
    
    if (host) {
      var whitelist = obj.whitelist;
      var domain = host.replace('www.','');

      for (var i = 0; i < whitelist.length; ++i) {
          if (whitelist[i][0].indexOf(domain) >= 0) skips.push(whitelist[i][1])
      }
     
    }
    
    ;(function checkIFrames() {
       // console.log("checkIframes");
       var myNodeList = document.querySelectorAll(selectors.join(','));

       for (var i = 0; i < myNodeList.length; ++i) {

           var item = myNodeList[i];
           if (skips.length == 0 || !item.matches(skips.join(','))) 
             artAdder.processAdNode(item);

       }

      if (++tried < howMany) {
        setTimeout(checkIFrames, 3000)
      }
    })()
  })
