if (typeof chrome !== 'undefined') {
  chrome.runtime.onInstalled.addListener(function(event) {
    init(event);
  });

  chrome.runtime.onStartup.addListener(function(event) {
    init(event);
  });

  chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
       
      if (request.what === 'getSelectors') {
        chrome.storage.local.get(Object.keys(lists),function (data) {
    
          var selectors = [], whitelist = [];
         
          for(key in data){
            selectors = selectors.concat(data[key].selectors);
            whitelist = whitelist.concat(data[key].whitelist);
          }

          // console.log(selectors,whitelist);
           sendResponse({
                  selectors: selectors,
                  whitelist: whitelist
              });
        });
      }

      return true;
  });

  // chrome.runtime.onMessage.addListener(function (msg) {
  //   var key = msg.msg.what
  //   if (artAdder[key] && typeof artAdder[key] === 'function') {
  //     artAdder[key](msg.msg[key])
  //   }
  // })
  
}

function init(event) {
  artAdder.prepareSelectors();
  artAdder.updateCheck();
}