chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    chrome.tabs.query({active:true,currentWindow:true}, function (tabs) {
        //tabs.forEach(tab => chrome.tabs.update(tab.id,{active:false}));
    });
    //chrome.tabs.update(tab.id,{active:false});
});

