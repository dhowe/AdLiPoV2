var dbug = false;
var listURLs = [
  'https://easylist-downloads.adblockplus.org/easylist.txt',
  'https://raw.githubusercontent.com/dhowe/uAssets/master/filters/adnauseam.txt'
];
var lists = [
   'lists/adnauseam.txt',
   'lists/easylist.txt'
];

(function() {

  'use strict';

/******************************************************************************/

//Delete the artAdder wrapper?
  var artAdder = {
    // abstract storage for different browsers
    localSet : function (obj) {
      var d = new Promise(
          function(resolve, reject) {
              if (typeof chrome !== 'undefined') {
                var key, thing, save = {};
                if(obj){
                  key = obj[0];
                  thing = obj[1];
                }
                artAdder.localGet('selectors').then(function (obj) {
                  dbug && console.log("Add selectors to local Storage");
                  if(obj.selectors != undefined){
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

    localGet : function (key) {
      var d = new Promise(

          function (resolve, reject) {
              if (typeof chrome !== 'undefined')
                  chrome.storage.local.get(key, resolve);
          });

      return d;
    },

    fetchSelectorLists: function(urls, callback) {
      for(var i = 0; i < urls.length; i++)
        artAdder.fetchSelectorList(urls[i]);
    },

    fetchSelectorList: function(url) {
      var d = new Promise(function(resolve, reject) {

          var request = new XMLHttpRequest();
          request.open('GET', url , true);
          request.onload = function() {
              if (request.status >= 200 && request.status < 400) {
                  // Success!
                  resolve(request.responseText);
                  // console.log("Successfully fetch the list from" + url);
                  
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

    loadListsFromLocal: function(urls) {
      for(var i = 0; i < urls.length; i++){
         artAdder.loadListFromLocal(urls[i])
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
                   dbug && console.log("Load list from Local: " + url);
                   resolve(data);
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

    processSelectors: function (data){
    //Todo: a better Selectors processor
    //The current one is very robust, it ignores all the site specific rules
       var d = new Promise(function(resolve, reject) {

        var txt = data;
        dbug && console.log("Process Selectors");
        var txtArr = txt.split("\n").reverse();
        var selectors = [], whitelist = [];

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
        
        var result = ['selectors', {
                  selectors: selectors,
                  whitelist: whitelist
              }]

        resolve(result);

      });

      return d;
    },

    prepareSelectors: function() {
      dbug && console.log("Prepare Selectors");
      
      artAdder.localGet('selectors').then(function (obj) {
        dbug && console.log(obj.selectors);
        if(obj.selectors === undefined){
          dbug && console.log("No selectors in storage");
          artAdder.loadListsFromLocal(lists);
        }
      });
        

    }

  }//End of Art Adder

  window.artAdder = artAdder;
})();


//////////////////////////////////////////////////////////////////////////////////////////



