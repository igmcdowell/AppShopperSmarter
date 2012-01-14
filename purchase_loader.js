old image fetcher

// function to pull in any in-app purchases. Cross site request, so needs plugin above.
function showpurchases(appid, header) {
    if(  !$(header).next('dl').children('.inapp').length  ) {
        var targetref = 'http://itunes.apple.com/us/app/id' + appid;
        jQuery.rajax(targetref, function(data) {
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