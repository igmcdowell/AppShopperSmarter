// ==UserScript==
// @name           AppShopperSmarter
// @description    Extends AppShopper to display images from browse pages, plus automatically filter out apps based on minimum number ratings and minimum average ratings. Also loads five pages at a time, supports hiding apps indefinitely.
// @version        1.3.1
// @match http://appshopper.com/*
// @exclude http://appshopper.com/search/*
// ==/UserScript==


function exec(fn) {
    var script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    script.textContent = '(' + fn + ')();';
    document.body.appendChild(script); // run the script
    document.body.removeChild(script); // clean up
}

function thescript() {
        
    // Recursively get pages and add them to the list of apps until reaching the desired number
    function getNextPage(currpage, end) {
        $.ajax({
          url: currpage,
          success: function(data){
            var page = $(data);
            var apps = page.find('ul.appdetails li');
            apps.trimFat(); 
            apps.makeMuters();
            $('ul.appdetails').append(apps);
            if ( currpage < end ) {
                currpage++;
                getNextPage(currpage, end);
            }
          }
        });
    }

    function makeControls() {
        $('head').append('<style type="text/css">#enhanced_filter h3{font-size:.9em; color:#fff; margin: 0 0 0 10px} #enhanced_filter{background:url("http://appshopper.com/images/style/toolbar.png") left 378px; padding:2px;} #enhanced_filter label{margin-left:20px; margin-right:10px; font-size:.8em; font-weight:bold; color:#fff;text-shadow:1px 1px 1px #888 }#enhanced_filter input, label, select, h3 {display:inline-block} #enhanced_filter input {width:2em} .muter{ position: absolute; top: -8px; right: -2px; background: url(http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/base/images/ui-icons_222222_256x240.png) NO-REPEAT -80px -128px #fff; border-radius: 9px; -moz-border-radius: 9px; -webkit-box-shadow: 1px 1px 0px 1px #ccc; -moz-box-shadow: 1px 1px 0px 1px #ccc; cursor: pointer; width: 18px; height: 18px; border: 1px solid #666;} .muter:hover{background-color:#ccc} .content ul.appdetails li{overflow:visible} .imagebox {display:none; margin:0 0 15px 10px; border:1px solid #b3dcfe;} .content ul.appdetails li .imagebox img{width:100px; display:inline-block; position:relative; margin:10px 10px 10px 0; cursor:pointer} .imagebox h4 {margin:5px 10px} #lightbox {position:relative; width:100%; height:100%; display:none; z-index:20;} #blind {background-color:#fff; opacity:.9; width:100%; height:100%;} #pictureholder {position:relative; z-index:101; display:inline-block;} #lightboxdismisser{z-index:102; position:absolute; top:-25px;right:0px; cursor:pointer; background-color: #CCC; padding: 1px 4px; border: 1px solid #AAA;} #pictureholder img {border:15px solid white; outline:2px solid #888;} .imageexpander {font-size:80%; margin:-10px 0 0 10px; padding-left:10px;cursor:pointer; height:1.2em;background:url("http://appshopper.com/images/style/toolbar.png")  left 240px; padding:2px 10px}.imageexpander a {text-decoration: none; color: #1E455E;} .imageexpander a:hover{text-decoration:underline} .spinner{height: 16px; width: 16px !important; display: block !important; margin: 10px auto !important;}</style>'); 
        
        
        $('.toolbar').after('<div id="enhanced_filter"><h3>AppShopperSmarter Settings: </h3><label for="min_reviews">Minimum # Reviews:</label><input type="text" id="min_reviews" value="'+localStorage.getItem('minreviews')+'" /><label for="min_rating">Minimum Rating:</label><select id="min_rating"><option value="5">5 Stars</option><option value="4.5">4.5 Stars</option><option value="4">4 Stars</option><option value="3.5">3.5 Stars</option><option value="3">3 Stars</option><option value="2.5">2.5 Stars</option><option value="2">2 Stars</option><option value="1.5">1.5 Stars</option><option value="1">1 Stars</option><option value="0">None</option></select><button type="submit" id="changefilter">Filter</button></div>');
        $('#enhanced_filter option[value="'+localStorage.getItem('minrating')+'"]').attr("selected", "selected");
        $('#changefilter').click(function(){
            localStorage.setItem("minrating", $('#min_rating').attr('value'));
            localStorage.setItem("minreviews", $('#min_reviews').attr('value'));
            window.location.reload();
        });
        $('body').append('<div id="lightbox"><div id="blind"></div><div id="pictureholder"><span id="lightboxdismisser">X</span><img src="" /></div></div>');
    }
    
    function buildImages(imgurls, extension, el) {
        for (var i=0; i<imgurls.length; i++) {
            var s = imgurls[i];
            if (s.substring(s.length-16)=='1024x1024-65.jpg'){
                var url = s.substring(0,s.length-16) + extension;
            }
                
            else {
                var url = s.substring(0,s.length-3) + extension;
            }
            el.append('<img src="'+url+'" />');
        }
        return el;
    }
    
    function toggleImages(toggle) {
        el = toggle.parent();
        if( !el.children('.imagebox').length ) {
            var imgbox = $('<div class="imagebox"><img class="spinner" alt="" src="data:image/gif;base64,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" /></div>');
            el.append(imgbox);
            var l = $('<div></div>');
            var id = el.attr('id').substring(4);
            $.getJSON('http://itunes.apple.com/lookup?id='+id+'&callback=?', function(data){
                var ssurls = (data['results'][0]['screenshotUrls']);
                var ipadurls = (data['results'][0]['iPadScreenshotUrls']);
                var ipadonlyurls = (data['results'][0]['ipadScreenshotUrls']);
                console.log(ssurls);
                console.log(ipadurls);
                if(ssurls && ssurls.length){
                     l.append('<h4>iPhone Screenshots</h4>');
                     l = buildImages(ssurls, '320x480-75.jpg', l);
                }
                if(ipadurls && ipadurls.length) {
                    l.append('<h4>iPad Screenshots</h4>');  
                    l = buildImages(ipadurls, '320x480-75.jpg', l); 
                } 
                if(ipadonlyurls && ipadonlyurls.length) {
                    l.append('<h4>iPad Screenshots</h4>')
                    l = buildImages(ipadonlyurls, '480x480-75.jpg', l)
                }              
                imgbox.html(l.html());
            });
            
        }
        el.children('.imagebox').slideToggle('fast');
    }
    
    function lightbox(img) {
        var sibs = img.siblings('img');
        var height = $(window).height();
        var width = $(window).width();
        var focalimg = img.clone();

        var wtop = $(window).scrollTop();
        $('#pictureholder img').attr("src",focalimg.attr("src"));
        $('#lightbox').fadeIn();
        $('#lightbox').offset({ top: wtop, left:0});
        focalimg.load(function(){
            var imgwidth = $('#pictureholder img').width();
            var imgheight = $('#pictureholder img').height();
            var leftoffset = (width - imgwidth)/2;
            var topoffset = (height - imgheight)/2;
            $('#pictureholder').offset({top: topoffset + wtop, left:leftoffset});
        });
 
    }
    
    function main() {
        (function( $ ) {
          $.fn.trimFat = function() {
              var minrating = localStorage.getItem('minrating');
              var minreviews = localStorage.getItem('minreviews');
              for(var i=0; i<this.length; i++) {
                  var item = $(this[i]);
                  var ratingInfo = $(item.children('dl').children('dt')[1]).next().text();
                  var score=ratingInfo.substring(0,4);
                  var ratingCount = ratingInfo.substring(6, ratingInfo.length-1);
                  if (  localStorage.getItem('mute' + item.attr('id')) || (parseFloat(score) < minrating)  || (!parseFloat(score)) || (ratingCount<parseFloat(minreviews)) ) {
                    item.hide();
                  }
                  else {
                      var appid=item.attr('id').substring(4);
                  }
              }
          };
          $.fn.makeMuters = function() {
              this.find('h3.hovertip').after('<button class="muter" title="Don\'t show this app again"></button>');
              $(this).append('<div class="imageexpander"><a href="">Show/Hide Images</a></div>');
          }
        })( jQuery );
        
        $('ul.appdetails').delegate('.muter','click',function(e){
            var app = $(this).closest('li');
            localStorage.setItem('mute' + app.attr('id'), 'true');
            app.fadeOut();
        });
        $('ul.appdetails').delegate('.imageexpander','click', function(e){e.preventDefault(); toggleImages($(this));})
        $('ul.appdetails').delegate('.imagebox img', 'click', function(){
           lightbox($(this)); 
        });
         $('body').delegate('#lightboxdismisser','click', function(){
             $('#lightbox').fadeOut('fast')
        })
        
        
        localStorage.setItem('minrating',localStorage.getItem("minrating") ? localStorage.getItem("minrating") : 4);
        localStorage.setItem('minreviews',localStorage.getItem("minreviews") ? localStorage.getItem("minreviews") : 8);
        makeControls();
        var pagelength = window.location.href.split("").reverse().join("").indexOf('/');
        var pagenum = window.location.href.substring(window.location.href.length-pagelength);
        pagenum = parseFloat(pagenum);
        if (!pagelength) {
            pagenum = 1
        }
        $('ul.appdetails li').trimFat();
        $('ul.appdetails li').makeMuters();
        getNextPage(pagenum+1,pagenum+4);
        var navs = $('div.pages a');
        if (navs.length > 1) {
            var prev = $(navs[0]);
            var next = $(navs[1]);
        }
        else var next = $(navs[0]);
        next.attr('href', pagenum+5);
        if (pagenum > 5) prev.attr('href', pagenum-5);
    }  
    main();
}

(function(){
    exec(thescript);
})();  

 
 