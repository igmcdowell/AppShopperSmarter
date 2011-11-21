// ==UserScript==
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
    
    //redefine ajax to use YQL as a proxy for cross site
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
            }
          }
        });
    }

    function trimFat() {
        var apps = $('ul.appdetails li');
        for(var i=0; i<apps.length; i++) {
        	var item = $(apps[i]);
        	var ratingInfo = $(item.children('dl').children('dt')[1]).next().text();
        	var score=ratingInfo.substring(0,4);
        	var ratingCount = ratingInfo.substring(6, ratingInfo.length-1);
        	if (  (parseFloat(score) < 4)  || (!parseFloat(score)) || (ratingCount<5) ) {
        	  item.detach();
        	}
        	else {
        	    var appid=item.attr('id').substring(4);
                showpurchases( appid, item.children('.hovertip')[0] );
        	}
        }
    }
    
    function main() {
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

 
 