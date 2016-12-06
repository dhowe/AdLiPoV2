  var howMany = 3
  var tried = 0
  
  //add css for font
  var css = document.createElement("style");
  css.type = "text/css";
  css.innerHTML = "@font-face { font-family: custom; src: url('chrome-extension://geimeffhpddnekhhligdoihaeacdjohg/web/fonts/BenchNine.ttf'); }";
  document.body.appendChild(css);
  

  Promise.resolve(artAdder.getSelectors())
  .then(function (obj){
    var selectors = obj.selectors
    var host = R.path(['location', 'host'],parent)
    var skips = []
    if (host) {
      skips = obj.whitelist
        .filter(R.pipe(R.nth(0), R.split(','), R.contains(host.replace('www.', ''))))
        .map(R.nth(1))
    }
    ;(function checkIFrames() {

       var myNodeList = document.querySelectorAll(selectors.join(','));

       for (var i = 0; i < myNodeList.length; ++i) {

           var item = myNodeList[i];
           if (!item.matches(skips.join(','))) 
             artAdder.processAdNode(item);

       }

      if (++tried < howMany) {
        setTimeout(checkIFrames, 3000)
      }
    })()
  })
