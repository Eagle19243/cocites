$(document).ready((e) => {
  console.log('open content');
  var currentUrl = window.location.href;
  var arrURLFragments = currentUrl.split("/");
  //Differentiate either we are on the current site or legacy site. We need to do that to spot the correct location to place the button
  var currentDomain = arrURLFragments[2];
  var regDomainGoogle = /google/g;
  var regDomainScholar = /scholar/g;
  //We are on the legacy site or on an university site which contains the "/pubmed" path
  if (typeof currentDomain != "undefined") {
    if (currentDomain.toLowerCase() == 'www.ncbi.nlm.nih.gov') {
      //Split the url to pull its last fragment to detect if we are on the "results" page or an "article" page

      var lastURLFragment = arrURLFragments[arrURLFragments.length - 1];

      //Check if the last URL's fragment is an integer. If so, then we are on an "article" page
      var lastURLFragmentAttemptToBeConvertedToInteger = parseInt(lastURLFragment, 10);

      if (isNaN(lastURLFragmentAttemptToBeConvertedToInteger)) {//we are on the "results" page
        //Find all divs with "aux" class and loop through them
        var date = new Date();
        var timestampstart = date.getTime();
        $("div.aux").each(function () {
          var PMID = $.trim($(this).find("dd").text());
          var $thisDiv = $(this);
          var $elementAfterWichToPlaceTheButton = $thisDiv;
          var floatStyle = '';
          if ($thisDiv.next('[data-kopernio-id]').length == 1) {
            $elementAfterWichToPlaceTheButton = $thisDiv.next('[data-kopernio-id]');
          }
          placeButton(PMID, $elementAfterWichToPlaceTheButton);
        });

      }
      else {//We are on an "article" page
        var PMID = lastURLFragmentAttemptToBeConvertedToInteger;

        //IMPORTANT!!!! Always Make sure that the code for displaying the button on the left side always goes before the button to display on the right
        var $elementAfterWichToPlaceTheButtonOnTheSide = $("div.twelve_col");
        placeButton(PMID, $elementAfterWichToPlaceTheButtonOnTheSide);

        var $elementAfterWichToPlaceTheButton = $("div.icons.portlet").find("div:last");
        placeButton(PMID, $elementAfterWichToPlaceTheButton, 1);
      }

    } else if (regDomainGoogle.test(currentDomain.toLowerCase()) && regDomainScholar.test(currentDomain.toLowerCase())) {//We are on the google scholar

      var weAreOnSearchPage = $("#gs_bdy");
      //document.getElementById('gs_top').removeChild(document.getElementById('gs_bdy'));
      if (weAreOnSearchPage) {
        //Find all link and loop through these
        $("h3.gs_rt a").each(function () {
          var tittle = $(this).text();
          var r1 = / /g;
          var titleArticle = tittle.replace(r1, '%20');
          var $elementAfterWichToPlaceTheButton = $(this).parents("div.gs_r.gs_or.gs_scl");
          var PMID = getPMID(titleArticle).then(function (PMID) {
            placeButton(PMID, $elementAfterWichToPlaceTheButton);
          }).catch(function (titleArticle) {
            console.log('error1:' + titleArticle);
            setTimeout(function () {
              var PMID2 = getPMID(titleArticle).then(function (PMID) {
                placeButton(PMID, $elementAfterWichToPlaceTheButton);
              })
                .catch(function (titleArticle) {
                  console.log('error2:' + titleArticle);
                  setTimeout(function () {
                    var PMID3 = getPMID(titleArticle).then(function (PMID) {
                      placeButton(PMID, $elementAfterWichToPlaceTheButton);
                    })
                      .catch(function (titleArticle) {
                        console.log('error3:' + titleArticle);
                        setTimeout(function () {
                          var PMID3 = getPMID(titleArticle).then(function (PMID) {
                            placeButton(PMID, $elementAfterWichToPlaceTheButton);
                          })
                            .catch(function (titleArticle) {
                              console.log('error4:' + titleArticle);
                            });
                        }, 9000);
                      });
                  }, 9000);
                });
            }, 9000);
          });
          //placeButton(PMID, $elementAfterWichToPlaceTheButton);
        });
      }
    } else {//We are on the Live site
      //Check if we are on an Article page
      //if we find this element #full-view-identifiers, then we are on an Article page
        console.log('Live site');
        var weAreOnArticlePage = $("#full-view-identifiers").length;

      if (weAreOnArticlePage > 0) {//Article Page
        var logoURL = chrome.runtime.getURL("images/CoCitesLogoLong.png");
        var PMID = $.trim($("#full-view-identifiers").find("span.id-label").next("strong.current-id").text());
        var $elementAfterWichToPlaceTheButton = $("aside.page-sidebar").find("div.full-text-links").find("div.full-text-links-list");
        placeButton(PMID, $elementAfterWichToPlaceTheButton);

        var $elementAfterWichToPlaceTheButtonOnTheSide = $("div#article-page")
        placeButton(PMID, $elementAfterWichToPlaceTheButtonOnTheSide);
        /*var sideButton = '<a href="" class="btn btn-primaryy" style="position:fixed!important;left:-28px!important;bottom:100px!important;height:100px"><img src="' + logoURL + '" /></a>';
        $("div#article-page").after(sideButton);*/

      }
      else {//Result Page
        $("article.full-docsum").each(function () {
          var $this = $(this);
          var $linkTitle = $this.find("a.docsum-title");
          var PMID = $.trim($linkTitle.attr("data-ga-label"));
          var $elementAfterWichToPlaceTheButton = $this.find("div.docsum-content");

          placeButton(PMID, $elementAfterWichToPlaceTheButton);
        });

        $("button.next-page,button.prev-page").bind('DOMSubtreeModified', DOMModificationHandler);
      }
    }
  }
});

function placeButton(PMID, $elementAfterWichToPlaceTheButton, placeBefore) {
  var logoURL = chrome.runtime.getURL("images/CoCitesLogoLong.png");
  var logoInactive = chrome.runtime.getURL("images/CocitesLogoGrey.png");
  $.ajax({
    dataType: "json",
    url: "https://icite.od.nih.gov/api/pubs/" + PMID,
    crossDomain: true,
    beforeSend: function (request) {
      //request.setRequestHeader("Authority", "token");
      if (placeBefore === undefined)
        $elementAfterWichToPlaceTheButton.after('<div id="cocitationsButton_' + PMID + '"><div class="spinner-border spinner-border-sm text-primary" role="status"><span class="sr-only">Loading...</span></div><span class="text-primary"> Counting Citations...</span></div>');
      else
        $elementAfterWichToPlaceTheButton.before('<div id="cocitationsButton_' + PMID + '"><div class="spinner-border spinner-border-sm text-primary" role="status"><span class="sr-only">Loading...</span></div><span class="text-primary"> Counting Citations...</span></div>');
    },
    success: function (data) {
      if (typeof data.citation_count != 'undefined') {
        var citation_count = parseInt(data.citation_count, 10);
        var disabledClass = '';

        var citation_count_to_display = citation_count.toLocaleString('en-US', { currency: 'USD', style: 'currency', currencyDisplay: 'code', minimumFractionDigits: 0, maximumFractionDigits: 0 });
        var USDRegExWithSpace = new RegExp('USD[^0-9]*', 'i');
        citation_count_to_display = citation_count_to_display.replace(USDRegExWithSpace, '');

        if (citation_count >= 1000)
          citation_count_to_display = '>1K';

        if (citation_count == 0) {
          var $buttonNotClickable = $('<img src="' + logoURL + '" class="btn-small" /><span style="margin-left:-163px;color:rgb(25, 107, 207);font-weight: 500;"> ' + citation_count + '</span>');
          $("#cocitationsButton_" + PMID).replaceWith($buttonNotClickable);
          return false;
        }

        var $buttonToClick = $('<a href="http://cocites.com/coCitedArticles.cfm?pmid=' + PMID + '" target="_blank" class="' + disabledClass + ' btn-to-cocites"><img src="' + logoURL + '" class="btn-small" /><span class="count_citation"> ' + citation_count_to_display + '</span></a>');

        var count_citation_css = { "font-size": "1em!important", "margin-left": "-195px", "top": "-16px" };//195

        var weAreOnGoogleScholarsearchPage = $elementAfterWichToPlaceTheButton.is("div.gs_r.gs_or.gs_scl");
        if (weAreOnGoogleScholarsearchPage > 0) {
          if (citation_count == 0) {
            var $buttonNotClickable = $('<img src="' + logoURL + '" class="btn-small" /><span style="margin-left:-163px;color:rgb(25, 107, 207);font-weight: bold;"> ' + citation_count + '</span>');
            $("#cocitationsButton_" + PMID).replaceWith($buttonNotClickable);
            return false;
          }
          $buttonToClick = $('<a href="http://cocites.com/coCitedArticles.cfm?pmid=' + PMID + '" target="_blank" class="' + disabledClass + ' btn-to-cocites"><img src="' + logoURL + '" class="btn-small" /><span class="count_citation" > ' + citation_count_to_display + '</span></a>');
          count_citation_css = { "top": "-16px" };
        }

        var weAreOnLiveResultPage = $elementAfterWichToPlaceTheButton.is("div.docsum-content");
        if (weAreOnLiveResultPage) {
          if (citation_count == 0) {
            var $buttonNotClickable = $('<div style="display:inline-flex"><span><img src="' + logoURL + '" class="btn-small" /></span> <span style="margin: 13px -158px;color:rgb(25, 107, 207);font-weight: bold;">' + citation_count + '</span></div>');
            $("#cocitationsButton_" + PMID).replaceWith($buttonNotClickable);
            return false;
          }
          $buttonToClick = $('<a href="http://cocites.com/coCitedArticles.cfm?pmid=' + PMID + '" target="_blank" class="' + disabledClass + ' btn-to-cocites"><img src="' + logoURL + '" class="btn-small" /><span class="count_citation "> ' + citation_count_to_display + '</span></a>');
          count_citation_css = { "top": "-12.5px" };
        }

        var weAreOnLiveArticlePage = $elementAfterWichToPlaceTheButton.is("div.full-text-links-list");
        if (weAreOnLiveArticlePage) {
          count_citation_css = { "font-size": "0.75em!important", "margin-left": "-150px" };
        }

        var weAreOnLegacyListPage = $elementAfterWichToPlaceTheButton.is("div.aux");
        if (weAreOnLegacyListPage) {
          count_citation_css["padding-bottom"] = "5px";
        }

        var weAreOnLegacyArticlePage = $elementAfterWichToPlaceTheButton.parents("div.icons.portlet").length;
        if (weAreOnLegacyArticlePage > 0) {
          count_citation_css["padding-bottom"] = "10px";
        }

        var weWantToPlaceTheButtonOnTheSideOfLegacyArticlePage = $elementAfterWichToPlaceTheButton.is("div.twelve_col");
        if (weWantToPlaceTheButtonOnTheSideOfLegacyArticlePage) {
          $buttonToClick = $('<a href="http://cocites.com/coCitedArticles.cfm?pmid=' + PMID + '" target="_blank" class="' + disabledClass + ' btn-to-cocites" style="position:fixed!important;left:0px!important;top:475px!important;z-index:1000;"><img src="' + logoURL + '" class="btn-big" /> <span class="count_citation_bigBtn"> ' + citation_count_to_display + '</span></a>');
        }

        var weWantToPlaceTheButtonOnTheSide = $elementAfterWichToPlaceTheButton.is("div#article-page");
        if (weWantToPlaceTheButtonOnTheSide) {
          $buttonToClick = $('<a href="http://cocites.com/coCitedArticles.cfm?pmid=' + PMID + '" target="_blank" class="' + disabledClass + ' btn-to-cocites" style="position:fixed!important;left:0px!important;top:475px!important;z-index:1000;"><img src="' + logoURL + '" class="btn-big" /> <span class="count_citation_bigBtn"> ' + citation_count_to_display + '</span></a>');
        }

        $buttonToClick.find(".count_citation").css(count_citation_css);

        $("#cocitationsButton_" + PMID).replaceWith($buttonToClick);
      }
      else {
        $("#cocitationsButton_" + PMID).html('');
      }

    },
    error: function (jqXHR, textStatus, errorThrown) {
      var $buttonNotClickable = $('<img src="' + logoURL + '" class="btn-small" />');
      $("#cocitationsButton_" + PMID).replaceWith($buttonNotClickable);
    }
  })
}

function getPMID(titleArticle) {
  return new Promise(function (resolve, reject) {
    $.ajax({
      //beforeSend: function (request) {
      //request.setRequestHeader("Authority", "eutils");
      //},
      crossDomain: true,
      dataType: "json",
      url: "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=" + titleArticle + "&field=title&retmode=json",
      success: function (data) {
        var PMID = data.esearchresult.idlist[0];
        resolve(PMID);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        reject(titleArticle);
      }
    });
  });
}


function DOMModificationHandler() {
  $(this).unbind('DOMSubtreeModified');
  setTimeout(function () {

    $("article.labs-full-docsum:not(:has(a.btn-to-cocites))").each(function () {
      var $this = $(this);
      var $linkTitle = $this.find("a.labs-docsum-title");
      var PMID = $.trim($linkTitle.attr("data-ga-label"));
      var $elementAfterWichToPlaceTheButton = $this.find("div.docsum-content");

      placeButton(PMID, $elementAfterWichToPlaceTheButton);
    });

    $('button.next-page,button.prev-page').bind('DOMSubtreeModified', DOMModificationHandler);
  }, 1000);
}

