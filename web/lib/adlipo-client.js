
var dbug = 1, test = 0;   // PROBLEM: Processing JS gives different ascent/descent than Font.js !!! TODO: make issue (for ReadersJS?)s
var used = [], rm, historySz = 30, node = 0;
var fontSizes = [18,21,24,28,32,40,48,56,64,72,80];
var palette = ['#4484A4','#A2B6C0','#889D59','#CF8D2F','#C55532']; 
var cIdx = Math.floor(Math.random()*palette.length);

function injectAd(sel, w, h, m) {
     console.log("send request", sel, w, h, m);
	 chrome.runtime.sendMessage({
     what: "getPoem",
     width:w,
     height:h,
     margin:m
    }, function (res) {
    
    //recalculate width & height according to padding
	w = w - 2 * m;
	h = h - 2 * m;

    var html = '', poem = dynamicLayout(res,w,h,m,fontSizes);
    dbug && console.log(poem);

	// var html = '', poem = makeAd(w, h, m);
	for (var i = 0, j = poem.length; i < j; i++) {
		
		html += poem[i];
		if (i < poem.length - 1) 
			html += '<br/>';
	}
	
	html = html.replace(/^ */,"");
	// dbug && console.log(html);
	//$.fn.textWidth

	// var marginX = ((w-m*2) - poem.maxWidth)/2;
	var marginX = 0;

	//console.log('(w-m*2): '+(w-m*2)+' poem.maxWidth: '+poem.maxWidth+' marginX: '+marginX);
	
	if (uDom(sel).parent().hasClass("adlipo.a")) {
		
		uDom(sel).parent().css({  // anchor css
			
			'text-decoration': 'none'
		});
		
		if (uDom(sel).parent().parent().hasClass("adlipo.div")) {
			
			// var currentMarginX = parseInt($(sel).parent().parent().css('marginLeft'));
			// console.log('currentMarginX: '+currentMarginX);
			// marginX += currentMarginX;
			

			uDom(sel).parent().parent().css({ // div css
			 	//'margin': 			'0px 0px 0px '+marginX+'px',		
				'display': 			'block', 
				'width': 			w+'px', 
				'height': 			h+'px', 	
				'overflow': 		'visible',
				'background-color': palette[cIdx++]
			});
			
			(cIdx === palette.length) && (cIdx = 0); // next-color
		}
	}
 
	var divStyle = {
		'font-family': 		'custom', 
	 	'text-align': 		'left', 
		'overflow': 		'visible',
		'white-space': 		'nowrap',
		'letter-spacing': 	'0px',
		'margin': 			'0px',  
		'width': 			w+'px', 
	    'height': 			h+'px', 
		// 'line-height':  	(poem.leading/100 * poem.fontSize) + 'px', 
		// 'font-Size':  		poem.fontSize + 'px', 
	 // 	'padding': 			poem.padding + 'px',
		'color': 			'#fff',
	};
	
	uDom(sel).css(divStyle);
	uDom(sel).html(html);
	
	//var tw = parseInt( $(sel).outerWidth());//+(poem.margin * 2);
	//if (sel==='#poem1')console.log(sel+".width: "+tw);	
	
	return poem;
    });
	
	//console.log('injectAd: '+sel);


}


/* selects the largest font that fits all the content, or null if none fits */
function dynamicLayout(txt, w, h, m, fsizes, returnRiTexts) 
{	
	m = m || 5;

	var szIdx=0, rts, lines = [], tmp = [], dbug = 0,
		font = fonts['size'+fsizes[szIdx++]], 
		actualW = w-m*2,actualH = h-m*2; 
	
    if (!font) throw Error('dynamicLayout(): no font!');

//console.log('1:'+ RiText.instances.length);

	fits = layout(tmp, txt, w-m*2, h-m*2, font);

//console.log('2:'+ RiText.instances.length);

	if (dbug)log('dynamicLayout: 0,0,'+w+","+h+","+m+"\nfont-size="+tmp[0].font().size+" fits="+fits+' '+tmp[0].text());
	
	if (!fits) return null; // text is too long for all fonts
	
	while (fits) {    // remove this 'fits' crap!
		
		rts = tmp;
		
		if (szIdx == fsizes.length) break;

		RiText.dispose(tmp);
//console.log('3:'+ RiText.instances.length);

		fits = layout(tmp=[], txt, w-m*2, h-m*2, fonts['size'+fsizes[szIdx]]);
		
//console.log('4:'+ RiText.instances.length);

		
		if (dbug) log("font-size="+(tmp && tmp.length ? tmp[0].font().size : fsizes[szIdx-1])+" fits="+fits);
		
		++szIdx;			
	}

	for (var i = 0, j = rts.length; i < j; i++) {
		
		if (dbug) log(Math.floor(rts[i].y)+") "+rts[i].text());
		lines.push(rts[i].text());
	}
	
	var bb = RiText.boundingBox(rts);
	//console.log(rts[0]);
	//console.log(bb);
	
	// tmp
	/*var otxt = rts[0].text();
	rts[0].text(' ');
	var spaceW = rts[0].textWidth();
	rts[0].text(otxt);*/
	 
	var poem = {
		
		type: 'simple',
		align: 'left', 
		font:  rts[0].font().name,
		fontSize: rts[0].font().size,
		leading: RiText.defaults.leadingFactor * 100.0,
		padding: m,
		maxWidth: bb[2],
		maxHeight: bb[3],
		//spaceWidth: spaceW, // tmp
		lines: lines
	};
	
	RiText.dispose(tmp);
	
	if (returnRiTexts) {
		
		// re-add to instances list (??)
		for (var i = 0, j = rts.length; i < j; i++) 
			RiText.instances.push(rts[i]);
			
		return rts;	
	}
	
	return poem; 	
}

/* returns true if all lines fit inside the rect */
function layout(rlines, txt, w, h, pfont, leading) 
{	    
	//console.log("FONT: "+pfont.size+"\n========================================");
	
    if (!pfont) throw Error('no pfont!');

    RiText.defaultFont(pfont);
    
 	leading = Math.round(leading || (pfont.size * RiText.defaults.leadingFactor));

    var g = RiText.renderer, ascent, descent, leading, startX=0, SP=' ', E='', 
    	currentX=0,  yPos, currentY, sb=E, maxW=w, maxH=h, words=[], next, 
    	firstLine = true, rt, spaceW;
	
    // for ascent/descent in node renderer
    rt = RiText(SP, 0, 0, pfont); 
    spaceW = rt.textWidth();
    RiText.dispose(rt);
    
	// remove line breaks & add spaces around html
	txt = txt.replace(/&gt;/g, '>').replace(/&lt;/g, '<');
	txt = txt.replace(/ ?(<[^>]+>) ?/g, " $1 ").replace(/[\r\n]/g, SP);
	
	// split into reversed array of words
	RiText._addToStack(txt, words);
 	
    g._textFont(pfont); // for ascent & descent
    
    ascent = Math.round(g._textAscent(rt,true)); 
    descent = Math.round(g._textDescent(rt,true));
    
    currentY = ascent;

    if (RiText.defaults.indentFirstParagraph) 
    	startX += RiText.defaults.paragraphIndent;

    while (words.length > 0)
    {
      	next = select(words.pop()); // added select: 

      	if (!next.length) continue;

     	 // re-calculate our X position
      	currentX = startX + g._textWidth(pfont, sb + next);

		// check it against the line-width
		if (currentX <= maxW) {
			
			sb += next + SP; // add-word
		} 
		else {
			
			// check yPosition for line break
			if (!RiText._withinBoundsY(currentY, leading, maxH, descent, firstLine))  {
				
				if (dbug) log("return1:"+sb); 
				return !(sb.length || words.length);
			}

			yPos = firstLine ? currentY : currentY + leading;
			rt = RiText._newRiTextLine(sb, pfont, startX, yPos);
			
			if(dbug) log("adding: '"+rt.text()+ "' rt.y="+rt.y+" yPos="+yPos);
			
			rlines.push(rt);

			currentY = rt.y;
			startX = 0;
			
			if (g._textWidth(pfont, next) > maxW)  { // single-word is too wide for this font-size
				if (dbug) log("REJECT(WORD-TOO-WIDE): "+next+ "    fontSize="+rt.font().size);
				return false; // TODO: ADD TO RITA
			}
			
			sb = next + SP;
		
			// reset with next word
			firstLine = false;
		}
    }
    
    // check if leftover words can make a new line 
	if (RiText._withinBoundsY(currentY, leading, maxH, descent, firstLine)) {

		yPos = firstLine ? currentY : currentY + leading;

		rt = RiText._newRiTextLine(sb, pfont, 0, yPos);
		if (dbug) console.log("last: "+rt.text() + " y="+rt.y);
		rlines.push(rt);
				
		sb = E;
    }
    
    //if (dbug) log("return2: "+sb+" "+words.length);
    
	for (var i=0; i < rlines.length; i++) {
		
		// do extra horizontal check
		if (rlines[i].textWidth() > maxW) { // plus some slop
	 		log("TOO-WIDE: "+rlines[i].text()+ "   "+rlines[i].font().size);
	 		//return false;
	 	}
	}
	
	//console.log(rlines[0].text());
    
    return !(sb.length || words.length);
}

function withinBoundsY(currentY, leading, maxY, descent, firstLine) {
	
	if (!firstLine) 
		return currentY + leading <= maxY - descent;
	return currentY <= maxY - descent;
}



function log(m) { 
	if(dbug) console.log(m); 
}

var failure = {
	
	type: 'simple',
	align: 'left', 
	font:  'arial',
	fontSize: 0,
	leading: RiText.defaults.leadingFactor * 100.0,
	lines: []
};


RiText.defaults.leadingFactor = 1.1;