
var omnibox = chrome.omnibox;
var topMatch;


function _log(text) {
  //////// comment/uncommment if you need to debug   //////////
  console.log(text);
}


function escape(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeRegexp(text) {
  var specialChars = [
    '\\',
    '[',
    ']',
    '(',
    ')',
    '|',
    '.',
    '+',
    '?',
    '{',
    '}',
    '-'
  ];

  return text.split('').map(function(char) {
    if (specialChars.indexOf(char) > -1)
      return '\\' + char;
    else
      return char;
  }).join('');
}

function parseMatches(text, search) {
  //console.log("parseMatches search=" + search + " text=" + text);
  var terms = escapeRegexp(search).split(/\s+/g);
  var termMatchCounts = [];
  terms.forEach(function() { termMatchCounts.push(0); });
  var re = new RegExp("(" + terms.join(")|(") + ")", "ig");
  var result = [];
  var lastIndex = 0;
  var match;
  while (match = re.exec(text)) {
    result.push({
      match: false,
      text: escape(text.substring(lastIndex, match.index))
    });

    lastIndex = match.index + match[0].length;
    result.push({
      match: true,
      text: escape(text.substring(match.index, lastIndex))
    });

    for (var i = 1; i < match.length; i++) {
      if (match[i])
        termMatchCounts[i - 1]++;
    }
  }

  // If any term found no matches, then we don't have a match.
  if (termMatchCounts.indexOf(0) > -1) {
    return [
      {
        match: false,
        text: escape(text)
      }
    ];
  }

  result.push({
    match: false,
    text: escape(text.substring(lastIndex))
  });

  return result;
}

function formatMatches(parsed) {
  //_log("formatMatches parsed.match=" + parsed.match + " parsed.text=" + parsed.text);
  return parsed.reduce(function(s, piece) {
    if (piece.match)
      return s + "<match>" + piece.text + "</match>";
    else
      return s + piece.text;
  }, "");
}

export function tabtabsearch_onInputChanged(text, suggest) {
  _log("tabtabsearch_onInputChanged text=" + text );

  text = text.toLowerCase().replace(/\W+/g, ' ').trim();
  if (!text)
    return; //FIXME : jump to last tab

  chrome.windows.getAll({populate: true}, function(windows) {
    topMatch = -1;

    var tabs = windows.reduce(function(arr, win) {
      return arr.concat(win.tabs);
    }, []);

    var suggestions = tabs.map(function(tab) {
      return {
        tab: tab,
        title: parseMatches(tab.title, text),
        url: parseMatches(tab.url, text)
      };
    }).filter(function(item) {
      if (item.title.length > 1 || item.url.length > 1) {
        if (topMatch == -1)
          topMatch = item.tab.id;
        return true;
      } else {
        return false;
      }
    }).map(function(item) {
      return {
        content: item.tab.title + ' - ' + item.tab.url + '#' + item.tab.id,
        description: formatMatches(item.title) + ' - ' +
                     '<url>' + formatMatches(item.url) + '</url>'
      };
    });

    _log("onInputChanged suggestions: length=" + suggestions.length + " first=" + suggestions[0].content);
    if (suggestions && suggestions.length == 1 && text.length >= 4 && (""+localStorage["autoswitch"] == "true")) {
        tabsearch_onInputEntered(suggestions[0].content);
        return;
    }

    suggest(suggestions);
  });
}




export function tabtabsearch_onInputCanceled() {
  _log("tabtabsearch_onInputCanceled");
  topMatch = -1;
}

export function tabtabsearch_onInputEntered(url){
  _log("tabtabsearch_onInputEntered url=" + url + " topMatch=" + topMatch);

  var tabId = url.match(/#(\d+)$/);
  if (tabId) {
    tabId = parseInt(tabId[1]);
    _log("Jump to tabId=" + tabId );
  } else if (topMatch != -1) {
    _log("Jump to topMatch=" + topMatch );
    tabId = topMatch;
  } else {
    _log("Nothing found for url=" + url);
    return;
  }

  chrome.tabs.getSelected(null, function(selected) {
    // if the selected tab was the new tab page,
    // assume that it was blank, and close it!
    if (selected.url == 'chrome://newtab/')
      chrome.tabs.remove(selected.id);
  });

  chrome.tabs.get(tabId, function(tab) {
    if (tab) {
      chrome.windows.get(tab.windowId, function (window) {
        if (!(window.focused && tab.selected)) {
          chrome.tabs.update(tabId, { active: true }, function() {
            chrome.windows.update(tab.windowId, { focused: true });
          });
        }
      });
    }
  });

};
