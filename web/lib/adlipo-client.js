
var dbug = 0, test = 0;   // PROBLEM: Processing JS gives different ascent/descent than Font.js !!! TODO: make issue (for ReadersJS?)s
var used = [], rm, historySz = 30, node = 0;
var fontSizes = [18,21,24,28,32,40,48,56,64,72,80];
var palette = ['#4484A4','#A2B6C0','#889D59','#CF8D2F','#C55532']; 
var cIdx = Math.floor(Math.random()*palette.length);
var maxTries = 100, tries = 0;
var lineHeightRatio = 1.1;

var fonts;
loadFonts();

function injectAd(sel, w, h, m, tries) {
	 chrome.runtime.sendMessage({
     what: "getPoem",
     sel: sel,
     width:w,
     height:h,
     margin:m
    }, function (res) {
    

	if(tries == undefined) tries = 0;
    
    var poem = dynamicLayout(res.poem, w, h, m, fontSizes);

    //if poem === null, regenerate a poem
    if(poem === null && tries < maxTries){
    	dbug && console.log("Text is too long, regenerate!" + (++tries));
    	injectAd(sel, w, h, 0, tries);
    }
    if(poem != null)
      makeAd(sel, w, h, m, poem);  
    });
	
	//console.log('injectAd: '+sel);


}

function makeAd(sel, w, h, m, poem){
   
    var innerW = w - 2*m;
        innerH = h - 2*m;

	var html = '<div class="adlipo.p" style="width:' + innerW + ';height:' + innerH + ';padding:' + m + 'px" >' +poem.lines + '</div>';
    html = '<a class="adlipo.a" title="AdLiPo" target="new" href="http://rednoise.org/adlipo/" style="text-decoration: none;color:white;">' + html + '</a>';
	// html = html.replace(/^ */,""); //?

	var marginX = 0;

	//console.log('(w-m*2): '+(w-m*2)+' poem.maxWidth: '+poem.maxWidth+' marginX: '+marginX);
	
	var divStyle = {
		'font-family': 		'custom', 
	 	'text-align': 		'left', 
		'overflow': 		'visible',
		// 'white-space': 		'nowrap',
		'letter-spacing': 	'0px',
		// 'margin': 			'0px',
		'padding':          '0px',
		'width': 			w+'px', 
	    'height': 			h+'px', 
		'line-height':  	parseInt(lineHeightRatio * poem.fontSize) + 'px', 
		'font-Size':  		poem.fontSize + 'px', 
		'color': 			'#fff',
	};
	
	dbug && console.log(divStyle);
	dbug && console.log(html);
	dbug && console.log(sel);
	uDom(sel).css(divStyle);
	uDom(sel).html(html);
	
	//var tw = parseInt( $(sel).outerWidth());//+(poem.margin * 2);
	//if (sel==='#poem1')console.log(sel+".width: "+tw);	
	
	return poem;
}

/* selects the largest font that fits all the content, or null if none fits */
function dynamicLayout(txt, w, h, m, fsizes, returnRiTexts) 
{	
	m = m || 5;

	var szIdx=0, rts, lines = [], tmp = [], dbug = 0,
		actualW = w-m*2, actualH = h-m*2; 
	
    if (!fonts) throw Error('dynamicLayout(): no font!');

    fits = domLayout(txt, actualW , actualH, fsizes[szIdx]);

	if (!fits) return null; 
	
	while (fits && szIdx < fsizes.length - 1) {
		szIdx++;
		dbug && console.log("dynamicLayout", txt, w, h, fsizes[szIdx]);
	
		fits = domLayout(txt, actualW, actualH, fsizes[szIdx]);
		dbug && console.log(fsizes[szIdx]+ " " + fits);
		if(!fits) szIdx--;
	}
	 
	var poem = {
		type: 'simple',
		align: 'left', 
		font:  fonts,
		fontSize: fsizes[szIdx],
		padding: m,
		lines: txt
	};

	return poem; 	
}

function domLayout(txt, w, h, fontSize){
    
	//Step 1: Create a div/ or get the test div if already created
	
	var div, testDiv = document.getElementById("AdLiPoTestDiv");
	if (testDiv === null) {
		div = document.createElement("div");
		div.setAttribute('id', 'AdLiPoTestDiv');
		// div.style.visibility = ('hidden');
		document.getElementsByTagName("BODY")[0].appendChild(div);
	}
	else  div = testDiv;
    
    var lineHeight = parseInt(lineHeightRatio * fontSize),
        styleString = "letter-spacing: 0px; margin: 0px; padding:0px; position:absolute; top:0; font-family:custom; ";
        styleString += "line-height:"+ lineHeight +"px; height:" + h + "px; width:" + w + "px; font-size:" + fontSize + "px";
	
	div.setAttribute("style", styleString);
	div.innerHTML = "<span id='box' style='background-color:rgba(200,200,200,.3);color:black; font-size:" + fontSize + "px'>" + txt + "</span>";
	
	
   var textBox = document.getElementById("box"),
       currentW = textBox.offsetWidth,
       currentH = textBox.offsetHeight;
     
    if (currentW <= w && currentH <= h) {
    	dbug && console.log("[Dom Layout]:FontSize"+ fontSize + " " + currentW + "," +  w + "," + currentH  + "," + h);
    	return true;
    }
	else{
		dbug && console.log("Font Too big"+ fontSize + " " + currentW + "," +  w + "," + currentH  + "," + h);
		return false;
	}
}

function log(m) { 
	if(dbug) console.log(m); 
}

function loadFonts() {
	if (typeof module != 'undefined' && module.exports){
	    fonts = require('./fonts/BenchNineAll');
	}
	else{
	    fonts = BenchNine;
	}
}
