var dbug = false;
var updateInterval = threeDays = 1000 * 60 * 60 * 24 * 3;

var lists = {
  easylist: {
    local: 'lists/easylist.txt',
    url: "https://easylist-downloads.adblockplus.org/easylist.txt"
  },
  adnauseam: {
    local: 'lists/adnauseam.txt',
    url: "https://raw.githubusercontent.com/dhowe/uAssets/master/filters/adnauseam.txt"
  }
};

(function() {

  'use strict';

/******************************************************************************/

//Delete the artAdder wrapper?
  var artAdder = {
    // abstract storage for different browsers
    localSet : function (obj) {
      var d = new Promise(
          function(resolve, reject) {
              if (typeof chrome !== 'undefined' && obj != undefined) {
                  var save = {};
                  save[obj[0]] = obj[1];
                  dbug && console.log("Save " + obj[0] + " to local storage.");
                  chrome.storage.local.set(save, resolve);
              }
          });
      return d;
    },

    addSelectors : function (obj) {
      var d = new Promise(
          function(resolve, reject) {
              if (typeof chrome !== 'undefined') {
                var key, thing, save = {};
                if (obj) {
                  key = obj[0];
                  thing = obj[1];
                }
                chrome.storage.local.get('selectors').then(function (obj) {
                  dbug && console.log("Add selectors to local Storage");
                  if (obj.selectors != undefined) {
                    //merge array
                    var currentSelectors = obj.selectors.selectors,
                        currentWhitelist = obj.selectors.whitelist;
                    // console.log(thing.selectors.length, thing.whitelist.length, currentSelectors.length,currentWhitelist.length);
                     thing.selectors = thing.selectors.concat(currentSelectors);
                     thing.whitelist = thing.whitelist.concat(currentWhitelist);
                  }

                  console.log(thing.selectors.length, thing.whitelist.length)
                  save[key] = thing;
                  chrome.storage.local.set(save, resolve);
                    
                });
                  
              }
          });
      return d;
    },

    fetchSelectorLists: function(urls) {
      for (var list in lists){
         artAdder.fetchSelectorList(lists[list].url)
              .then(artAdder.processSelectors)
              .then(artAdder.localSet);
      }
    },

    fetchSelectorList: function(url) {
      var d = new Promise(function(resolve, reject) {

          var request = new XMLHttpRequest();

          request.open('GET', url , true);

          request.onload = function() {
              if (request.status >= 200 && request.status < 400) {
                  // Success!
                  if (request.responseText != "") {
                    var obj = {
                      key:getKeyFromUrl(url),
                      data:request.responseText
                    }
                    resolve(obj);
                    dbug && console.log("Successfully fetch the list from" + url);
                 } else {
                    reject("Successful request, but no content is fetched.");
                 }
                  
              } else {
                  reject(request.statusText);
              }
          };

          request.onerror = function() {
              reject(request.statusText);
          };
          
          request.send();

      });
      return d;
    },

    loadListsFromLocal: function(lists) {
      for(var list in lists){
         artAdder.loadListFromLocal(lists[list].local)
              .then(artAdder.processSelectors)
              .then(artAdder.localSet);
      }
    },

    loadListFromLocal: function(url){
       var d = new Promise(function(resolve, reject) {
           $.ajax({
               url: chrome.runtime.getURL(url),
               type: 'get',
               success: function(data) {
                   var key = getKeyFromUrl(url);
                   dbug && console.log("Load list from Local: " + key);
                   resolve({key: key,data: data});
               },
               error: function(e) {

                   resolve({
                       status: 'error',
                       fails: -1
                   });
                   console.warn(e);
               }
           });
       });
       return d;

    },

    processSelectors: function (obj){
    //Todo: a better Selectors processor
    //The current one is very robust, it ignores all the site specific rules
    
       var d = new Promise(function(resolve, reject) {
       
        var txt = obj.data, key = obj.key, txtArr,
            selectors = [], whitelist = [];
        
        if (txt === undefined){
            console.log("Error! No Selectors to be processed!", obj);
            return;
        }
            
         txtArr = txt.split("\n").reverse();
         dbug && console.log("Process Selectors: " + key + " " + txt.length);

        for (var i = 0; i < txtArr.length; i ++) {
            //Temp, doesn't allow rules with '/' from adnauseam.txt, causing troubles when joining all the selectors
            if (txtArr[i].indexOf("##") == 0 &&  txtArr[i].indexOf("/") < 0){
               selectors.push(txtArr[i].slice(2));
            }
            else if(txtArr[i].indexOf("#@#") > 0){
              var pair = txtArr[i].split('#@#');
            whitelist.push(pair);  
            }   
        }
        
        var result = [key, {
                  selectors: selectors,
                  whitelist: whitelist
              }];
        resolve(result);

      });

      return d;
    },

     updateCheck: function () {

        var lastCheckTime = chrome.storage.local.get('lastCheckTime', function (data) {

          dbug && console.log("lastCheckTime", data.lastCheckTime);
          if (data.lastCheckTime)
          lastCheckTime = Date.parse(data.lastCheckTime);
          else lastCheckTime = 0;

          var currentTime = Date.now();
          // console.log(currentTime, lastCheckTime, updateInterval);
          if (currentTime - lastCheckTime < updateInterval) {

            dbug && console.log("No need to update");

            return;

          } else {
            var time = new Date().toLocaleString();
            artAdder.fetchSelectorLists(lists);
            chrome.storage.local.set({lastCheckTime: time});
          }
      });

    },

    prepareSelectors: function() {
      dbug && console.log("Prepare Selectors");
      
          chrome.storage.local.get(Object.keys(lists), function(obj) {
              dbug && console.log(obj);
              if (Object.keys(obj).length === 0) {
                  artAdder.loadListsFromLocal(lists);
              }
          });

    }

  }//End of Art Adder

  window.artAdder = artAdder;

})();

//////////////////////////////////////////////////////////////////////////////////////////

function getKeyFromUrl(url) {
  var sections = url.split('/');
  var key = sections[sections.length-1];
  key = key.slice(0,key.length-4);
  return key;
}




