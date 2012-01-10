// ==UserScript==
// @name           AppShopperSmarter
// @description    Extends AppShopper to automatically filter out apps with < 5 ratings or a < 4 cumulative rating. Also pulls in in-app purchases and loads five pages at a time.
// @version        1.1.0
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
    //add formatting for inapp purchases.
    $('head').append('<style>.inapp { border: 1px solid #FBC7C6; padding: 4px; margin-bottom: 2px; background: #FDDFDE; -webkit-border-radius: 4px; }</style>');
    
    //redefine ajax to use YQL as a proxy for cross domain urls
    //snippet from: https://github.com/jamespadolsey/jQuery-Plugins/tree/master/cross-domain-ajax/
    jQuery.ajax = (function(_ajax){

        var protocol = location.protocol,
            hostname = location.hostname,
            exRegex = RegExp(protocol + '//' + hostname),
            YQL = 'http' + (/^https/.test(protocol)?'s':'') + '://query.yahooapis.com/v1/public/yql?callback=?',
            query = 'select * from html where url="{URL}" and xpath="*"';

        function isExternal(url) {
            return !exRegex.test(url) && /:\/\//.test(url);
        }

        return function(o) {

            var url = o.url;

            if ( /get/i.test(o.type) && !/json/i.test(o.dataType) && isExternal(url) ) {

                // Manipulate options so that JSONP-x request is made to YQL

                o.url = YQL;
                o.dataType = 'json';

                o.data = {
                    q: query.replace(
                        '{URL}',
                        url + (o.data ?
                            (/\?/.test(url) ? '&' : '?') + jQuery.param(o.data)
                        : '')
                    ),
                    format: 'xml'
                };

                // Since it's a JSONP request
                // complete === success
                if (!o.success && o.complete) {
                    o.success = o.complete;
                    delete o.complete;
                }

                o.success = (function(_success){
                    return function(data) {

                        if (_success) {
                            // Fake XHR callback.
                            _success.call(this, {
                                responseText: data.results[0]
                                    // YQL screws with <script>s
                                    // Get rid of them
                                    .replace(/<script[^>]+?\/>|<script(.|\s)*?\/script>/gi, '')
                            }, 'success');
                        }

                    };
                })(o.success);

            }

            return _ajax.apply(this, arguments);

        };

    })(jQuery.ajax);
    
    // function to pull in any in-app purchases. Cross site request, so needs plugin above.
    function showpurchases(appid, header) {
        if(  !$(header).next('dl').children('.inapp').length  ) {
            var targetref = 'http://itunes.apple.com/us/app/id' + appid;
            jQuery.get(targetref, function(data) {
                   var page = $(data.responseText);
                   var purchases = page.find('.in-app-purchases').children('ol').children('li');
                   var purchaselist = '';
                   for(var i=0; i<purchases.length && i<3; i++) {
                       purchaselist += $(purchases[i]).html() + '<br />';
                   }
                   if(purchaselist.length) { $(header).next('dl').prepend('<div class="inapp"><strong>Purchases:</strong><br/ >'+purchaselist+'</div>') }
            });
        }   
    }
    
    // Recursively get pages and add them to the list of apps until reaching the desired number
    function getNextPage(currpage, end) {
        $.ajax({
          url: currpage,
          success: function(data){
            var page = $(data);
            var apps = page.find('ul.appdetails li');
            $('ul.appdetails').append(apps);
            if ( currpage < end ) {
                currpage++;
                getNextPage(currpage, end);
            }
            else {
                trimFat();
                $('h3.hovertip').after('<button class="muter"></button>');
            }
          }
        });
    }

    // Remove all apps that have < 5 ratings or < 4 overall rating. Pull in any in-app purchases.
    function trimFat() {
        var apps = $('ul.appdetails li');
        var minrating = localStorage.getItem('minrating');
        var minreviews = localStorage.getItem('minreviews');
        for(var i=0; i<apps.length; i++) {
            var item = $(apps[i]);
            var ratingInfo = $(item.children('dl').children('dt')[1]).next().text();
            var score=ratingInfo.substring(0,4);
            var ratingCount = ratingInfo.substring(6, ratingInfo.length-1);
            if (  localStorage.getItem('mute' + item.attr('id')) || (parseFloat(score) < minrating)  || (!parseFloat(score)) || (ratingCount<parseFloat(minreviews)) ) {
              item.hide();
            }
            else {
                var appid=item.attr('id').substring(4);
                showpurchases( appid, item.children('.hovertip')[0] );
            }
        }
    }

    function makeControls() {
        $('.toolbar').after('<div id="enhanced_filter"><h3>AppShopperSmarter Settings: </h3><label for="min_reviews">Minimum # Reviews:</label><input type="text" id="min_reviews" value="'+localStorage.getItem('minreviews')+'" /><label for="min_rating">Minimum Rating:</label><select id="min_rating"><option value="5">5 Stars</option><option value="4.5">4.5 Stars</option><option value="4">4 Stars</option><option value="3.5">3.5 Stars</option><option value="3">3 Stars</option><option value="2.5">2.5 Stars</option><option value="2">2 Stars</option><option value="1.5">1.5 Stars</option><option value="1">1 Stars</option><option value="0">None</option></select><button type="submit" id="changefilter">Filter</button></div>');
        $('#enhanced_filter option[value="'+localStorage.getItem('minrating')+'"]').attr("selected", "selected");
        $('#changefilter').click(function(){
            localStorage.setItem("minrating", $('#min_rating').attr('value'));
            localStorage.setItem("minreviews", $('#min_reviews').attr('value'));
            window.location.reload();
        });
        $('.muter').live('click',function(e){
            var app = $(this).closest('li');
            console.log(app);
            localStorage.setItem('mute' + app.attr('id'));
            app.fadeOut();
        });
        $('head').append('<style type="text/css">#enhanced_filter h3{font-size:.9em; color:#fff; margin: 0 0 0 10px} #enhanced_filter{background:url("http://appshopper.com/images/style/toolbar.png") left 378px; padding:2px;} #enhanced_filter label{margin-left:20px; margin-right:10px; font-size:.8em; font-weight:bold; color:#fff;text-shadow:1px 1px 1px #888 }#enhanced_filter input, label, select, h3 {display:inline-block} #enhanced_filter input {width:2em}.muter{ position: absolute; top: -8px; right: -2px; background: url(http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/base/images/ui-icons_222222_256x240.png) NO-REPEAT -80px -128px #ddd; border-radius: 9px; -moz-border-radius: 9px; -webkit-box-shadow: 1px 1px 0px 1px #ccc; -moz-box-shadow: 1px 1px 0px 1px #ccc; cursor: pointer; width: 18px; height: 18px; border: 1px solid #666;} .content ul.appdetails li{overflow:visible}'); 
    }
    
    function main() {
        localStorage.setItem('minrating',localStorage.getItem("minrating") ? localStorage.getItem("minrating") : 4);
        localStorage.setItem('minreviews',localStorage.getItem("minreviews") ? localStorage.getItem("minreviews") : 8);
        makeControls();
        var pagelength = window.location.href.split("").reverse().join("").indexOf('/');
        var pagenum = window.location.href.substring(window.location.href.length-pagelength);
        pagenum = parseFloat(pagenum);
        if (!pagelength) {
            pagenum = 1
        }
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

 
 