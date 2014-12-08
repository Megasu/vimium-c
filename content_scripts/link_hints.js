// Generated by CoffeeScript 1.8.0
(function() {
  var COPY_LINK_URL, COPY_LINK_TEXT, DOWNLOAD_LINK_URL, LinkHints, OPEN_INCOGNITO
    , OPEN_IN_CURRENT_TAB, OPEN_IN_NEW_BG_TAB, OPEN_IN_NEW_FG_TAB, OPEN_WITH_QUEUE
    , alphabetHints, filterHints, numberToHintString, root, spanWrap;

  OPEN_IN_CURRENT_TAB = {};

  OPEN_IN_NEW_BG_TAB = {};

  OPEN_IN_NEW_FG_TAB = {};

  OPEN_WITH_QUEUE = {};

  COPY_LINK_URL = {};

  COPY_LINK_TEXT = {};

  OPEN_INCOGNITO = {};

  DOWNLOAD_LINK_URL = {};

  LinkHints = {
    hintMarkerContainingDiv: null,
    mode: undefined,
    linkActivator: undefined,
    delayMode: false,
    getMarkerMatcher: function() {
      return settings.values.filterLinkHints ? filterHints : alphabetHints;
    },
    isActive: false,
    clickableElementsXPath: DomUtils.makeXPath(["a", "area[@href]", "textarea",
      "button", "select", "input[not(@type='hidden' or @disabled or @readonly)]",
      "*[@onclick or @tabindex or @role='link' or @role='button' or contains(@class, 'button') or @contenteditable='' or translate(@contenteditable, 'TRUE', 'true')='true']"
      ]),
    activateModeToOpenInNewTab: function() {
      return this.activateMode(OPEN_IN_NEW_BG_TAB);
    },
    activateModeToOpenInNewForegroundTab: function() {
      return this.activateMode(OPEN_IN_NEW_FG_TAB);
    },
    activateModeToCopyLinkUrl: function() {
      return this.activateMode(COPY_LINK_URL);
    },
    activateModeToCopyLinkText: function() {
      return this.activateMode(COPY_LINK_TEXT);
    },
    activateModeWithQueue: function() {
      return this.activateMode(OPEN_WITH_QUEUE);
    },
    activateModeToOpenIncognito: function() {
      return this.activateMode(OPEN_INCOGNITO);
    },
    activateModeToDownloadLink: function() {
      return this.activateMode(DOWNLOAD_LINK_URL);
    },
    activateMode: function(mode) {
      var el, hintMarkers;
      if (mode == null) {
        mode = OPEN_IN_CURRENT_TAB;
      }
      if (!document.documentElement) {
        return;
      }
      if (this.isActive) {
        return;
      }
      this.setOpenLinkMode(mode);
      hintMarkers = this.getVisibleClickableElements().map(this.createMarkerFor);
      this.getMarkerMatcher().fillInMarkers(hintMarkers);
      this.isActive = true;
      this.initScrollX = window.scrollX;
      this.initScrollY = window.scrollY;
      this.hintMarkerContainingDiv = DomUtils.addElementList(hintMarkers, {
        id: "vimiumHintMarkerContainer",
        className: "vimium0 vimium1"
      });
      return this.handlerId = handlerStack.push({
        keydown: this.onKeyDownInMode.bind(this, hintMarkers),
        keypress: function() {
          return false;
        },
        keyup: function() {
          return false;
        }
      });
    },
    setOpenLinkMode: function(mode) {
      this.mode = mode;
      if (this.mode === OPEN_IN_NEW_BG_TAB || this.mode === OPEN_IN_NEW_FG_TAB || this.mode === OPEN_WITH_QUEUE) {
        if (this.mode === OPEN_IN_NEW_BG_TAB) {
          HUD.show("Open link in new tab");
        } else if (this.mode === OPEN_IN_NEW_FG_TAB) {
          HUD.show("Open link in new tab and switch to it");
        } else {
          HUD.show("Open multiple links in a new tab");
        }
        this.linkActivator = function(link) {
          DomUtils.simulateClick(link, {
            shiftKey: this.mode === OPEN_IN_NEW_FG_TAB,
            metaKey: KeyboardUtils.platform === "Mac",
            ctrlKey: KeyboardUtils.platform !== "Mac",
            altKey: false
          });
        };
      } else if (this.mode === COPY_LINK_URL) {
        HUD.show("Copy link URL to Clipboard");
        this.linkActivator = function(link) {
          mainPort.postMessage({
            handler: "copyToClipboard",
            data: link.href
          });
        };
      } else if (this.mode === COPY_LINK_TEXT) {
        HUD.show("Copy link text to Clipboard");
        this.linkActivator = function(link) {
          mainPort.postMessage({
            handler: "copyToClipboard",
            data: (link.innerText.trim() || link.title.trim()).replace(/\xa0/g, ' ')
          });
        };
      } else if (this.mode === OPEN_INCOGNITO) {
        HUD.show("Open link in incognito window");
        this.linkActivator = function(link) {
          mainPort.postMessage({
            handler: 'openUrlInIncognito',
            url: link.href
          });
        };
      } else if (this.mode === DOWNLOAD_LINK_URL) {
        HUD.show("Download link URL");
        this.linkActivator = function(link) {
          DomUtils.simulateClick(link, {
            altKey: true,
            ctrlKey: false,
            metaKey: false
          });
        };
      } else {
        HUD.show("Open link in current tab");
        this.linkActivator = function(link) {
          DomUtils.simulateClick(link);
        };
      }
    },
    createMarkerFor: function(link) {
      var clientRect, marker;
      marker = document.createElement("div");
      marker.className = "vimium0 vimium2 internalVimiumHintMarker vimiumHintMarker";
      marker.clickableItem = link.element;
      clientRect = link.rect;
      marker.style.left = clientRect.left + window.scrollX + "px";
      marker.style.top = clientRect.top + window.scrollY + "px";
      marker.rect = link.rect;
      return marker;
    },
    getVisibleClickableElements: function() {
      var c, clientRect, coords, element, i, img, imgClientRects, map, rect, resultSet, visibleElements, _i, _ref;
      resultSet = DomUtils.evaluateXPath(this.clickableElementsXPath, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
      visibleElements = [];
      for (i = _i = 0, _ref = resultSet.snapshotLength; _i < _ref; i = _i += 1) {
        element = resultSet.snapshotItem(i);
        clientRect = DomUtils.getVisibleClientRect(element, clientRect);
        if (clientRect !== null) {
          visibleElements.push({
            element: element,
            rect: clientRect
          });
        }
        if (element.localName === "area") {
          map = element.parentElement;
          if (!map) {
            continue;
          }
          img = document.querySelector("img[usemap='#" + map.getAttribute("name") + "']");
          if (!img) {
            continue;
          }
          imgClientRects = img.getClientRects();
          if (imgClientRects.length === 0) {
            continue;
          }
          c = element.coords.split(",");
          coords = [parseInt(c[0], 10), parseInt(c[1], 10), parseInt(c[2], 10), parseInt(c[3], 10)];
          rect = {
            top: imgClientRects[0].top + coords[1],
            left: imgClientRects[0].left + coords[0],
            right: imgClientRects[0].left + coords[2],
            bottom: imgClientRects[0].top + coords[3],
            width: coords[2] - coords[0],
            height: coords[3] - coords[1]
          };
          visibleElements.push({
            element: element,
            rect: rect
          });
        }
      }
      return visibleElements;
    },
    onKeyDownInMode: function(hintMarkers, event) {
      var delay, keyResult, linksMatched, marker, matched, prev_mode, _i, _j, _len, _len1, _ref;
      if (this.delayMode) {
        return;
      }
      if ((event.keyCode === keyCodes.shiftKey || event.keyCode === keyCodes.ctrlKey) && (this.mode === OPEN_IN_CURRENT_TAB || this.mode === OPEN_IN_NEW_BG_TAB || this.mode === OPEN_IN_NEW_FG_TAB)) {
        prev_mode = this.mode;
        if (event.keyCode === keyCodes.shiftKey) {
          this.setOpenLinkMode(this.mode === OPEN_IN_CURRENT_TAB ? OPEN_IN_NEW_BG_TAB : OPEN_IN_CURRENT_TAB);
        } else {
          this.setOpenLinkMode(this.mode === OPEN_IN_NEW_FG_TAB ? OPEN_IN_NEW_BG_TAB : OPEN_IN_NEW_FG_TAB);
        }
      }
      if (KeyboardUtils.isEscape(event)) {
        this.deactivateMode();
      } else {
        keyResult = this.getMarkerMatcher().matchHintsByKey(hintMarkers, event);
        linksMatched = keyResult.linksMatched;
        delay = (_ref = keyResult.delay) != null ? _ref : 0;
        if (linksMatched.length === 0) {
          this.deactivateMode();
        } else if (linksMatched.length === 1) {
          this.activateLink(linksMatched[0], delay);
        } else {
          for (_i = 0, _len = hintMarkers.length; _i < _len; _i++) {
            marker = hintMarkers[_i];
            this.hideMarker(marker);
          }
          for (_j = 0, _len1 = linksMatched.length; _j < _len1; _j++) {
            matched = linksMatched[_j];
            this.showMarker(matched, this.getMarkerMatcher().hintKeystrokeQueue.length);
          }
        }
      }
      return false;
    },
    activateLink: function(matchedLink, delay) {
      var clickEl;
      this.delayMode = true;
      clickEl = matchedLink.clickableItem;
      if (DomUtils.isSelectable(clickEl)) {
        DomUtils.simulateSelect(clickEl);
        return this.deactivateMode(delay, function() {
          return LinkHints.delayMode = false;
        });
      } else {
        if (clickEl.nodeName.toLowerCase() === "input" && clickEl.type !== "button") {
          clickEl.focus();
        }
        // TODO:
        matchedLink.rect.left -= window.scrollX - this.initScrollX;
        matchedLink.rect.right -= window.scrollX - this.initScrollX;
        matchedLink.rect.top -= window.scrollY - this.initScrollY;
        matchedLink.rect.bottom -= window.scrollY - this.initScrollY;
        DomUtils.flashRect(matchedLink.rect);
        this.linkActivator(clickEl);
        if (this.mode === OPEN_WITH_QUEUE) {
          return this.deactivateMode(delay, function() {
            LinkHints.delayMode = false;
            return LinkHints.activateModeWithQueue();
          });
        } else {
          return this.deactivateMode(delay, function() {
            return LinkHints.delayMode = false;
          });
        }
      }
    },
    showMarker: function(linkMarker, matchingCharCount) {
      var j, _ref;
      linkMarker.style.display = "";
      for (j = 0, _ref = linkMarker.childNodes; j < _ref.length; ++j) {
        if (j < matchingCharCount) {
          _ref[j].classList.add("matchingCharacter");
        } else {
          _ref[j].classList.remove("matchingCharacter");
        }
      }
    },
    hideMarker: function(linkMarker) {
      return linkMarker.style.display = "none";
    },
    deactivateMode: function(delay, callback) {
      var _this = this, deactivate = function() {
        if (LinkHints.getMarkerMatcher().deactivate) {
          LinkHints.getMarkerMatcher().deactivate();
        }
        if (LinkHints.hintMarkerContainingDiv) {
          DomUtils.removeElement(LinkHints.hintMarkerContainingDiv);
        }
        LinkHints.hintMarkerContainingDiv = null;
        handlerStack.remove(_this.handlerId);
        HUD.hide();
        _this.isActive = false;
      };
      if (delay) {
        setTimeout(callback ? function() {
          deactivate();
          callback();
        } : deactivate, delay);
      } else {
        deactivate();
        if (callback) {
          callback();
        }
      }
    }
  };

  alphabetHints = {
    hintKeystrokeQueue: [],
    logXOfBase: function(x, base) {
      return Math.log(x) / Math.log(base);
    },
    fillInMarkers: function(hintMarkers) {
      var hintStrings, idx, marker, _len;
      hintStrings = this.hintStrings(hintMarkers.length);
      for (idx = 0, _len = hintMarkers.length; idx < _len; ++idx) {
        marker = hintMarkers[idx];
        marker.hintString = hintStrings[idx];
        marker.innerHTML = spanWrap(marker.hintString.toUpperCase());
      }
      return hintMarkers;
    },
    hintStrings: function(linkCount) {
      var digitsNeeded, hintStrings, i, linkHintCharacters, longHintCount, shortHintCount, start, _ref;
      linkHintCharacters = settings.values.linkHintCharacters || "";
      digitsNeeded = Math.ceil(this.logXOfBase(linkCount, linkHintCharacters.length));
      shortHintCount = Math.floor((Math.pow(linkHintCharacters.length, digitsNeeded) - linkCount) / linkHintCharacters.length);
      longHintCount = linkCount - shortHintCount;
      hintStrings = [];
      if (digitsNeeded > 1) {
        for (i = 0; i < shortHintCount; ++i) {
          hintStrings.push(numberToHintString(i, linkHintCharacters, digitsNeeded - 1));
        }
      }
      start = shortHintCount * linkHintCharacters.length;
      for (i = start, _ref = start + longHintCount; i < _ref; ++i) {
        hintStrings.push(numberToHintString(i, linkHintCharacters, digitsNeeded));
      }
      return this.shuffleHints(hintStrings, linkHintCharacters.length);
    },
    shuffleHints: function(hints, characterSetLength) {
      var buckets, result, i, _len;
      buckets = new Array(characterSetLength);
      for (i = 0, _len = characterSetLength; i < _len; ++i) {
        buckets[i] = [];
      }
      for (i = 0, _len = hints.length; i < _len; ++i) {
        buckets[i % characterSetLength].push(hints[i]);
      }
      result = [];
      for (i = 0, _len = characterSetLength; i < _len; ++i) {
        result = result.concat(buckets[i]);
      }
      return result;
    },
    matchHintsByKey: function(hintMarkers, event) {
      var keyChar, linksMatched, matchString;
      keyChar = KeyboardUtils.getKeyChar(event).toLowerCase();
      if (event.keyCode === keyCodes.backspace || event.keyCode === keyCodes.deleteKey) {
        if (!this.hintKeystrokeQueue.pop()) {
          return {
            linksMatched: []
          };
        }
      } else if (keyChar) {
        this.hintKeystrokeQueue.push(keyChar);
      }
      matchString = this.hintKeystrokeQueue.join("");
      linksMatched = hintMarkers.filter(function(linkMarker) {
        return linkMarker.hintString.indexOf(matchString) === 0;
      });
      return {
        linksMatched: linksMatched
      };
    },
    deactivate: function() {
      return this.hintKeystrokeQueue = [];
    }
  };

  filterHints = {
    hintKeystrokeQueue: [],
    linkTextKeystrokeQueue: [],
    labelMap: {},
    generateLabelMap: function() {
      var forElement, label, labelText, labels, _i, _len;
      labels = document.querySelectorAll("label");
      for (_i = 0, _len = labels.length; _i < _len; _i++) {
        label = labels[_i];
        forElement = label.getAttribute("for");
        if (forElement) {
          labelText = label.textContent.trim();
          if (labelText[labelText.length - 1] === ":") {
            labelText = labelText.substring(0, labelText.length - 1);
          }
          this.labelMap[forElement] = labelText;
        }
      }
    },
    generateHintString: function(linkHintNumber) {
      return (numberToHintString(linkHintNumber + 1
        , settings.values.linkHintNumbers || "")).toUpperCase();
    },
    generateLinkText: function(element) {
      var linkText, nodeName, showLinkText;
      linkText = "";
      showLinkText = false;
      nodeName = element.nodeName.toLowerCase();
      if (nodeName === "input") {
        if (this.labelMap[element.id]) {
          linkText = this.labelMap[element.id];
          showLinkText = true;
        } else if (element.type !== "password") {
          linkText = element.value;
          if (!linkText && 'placeholder' in element) {
            linkText = element.placeholder;
          }
        }
      } else if (nodeName === "a" && !element.textContent.trim() && element.firstElementChild && element.firstElementChild.nodeName.toLowerCase() === "img") {
        linkText = element.firstElementChild.alt || element.firstElementChild.title;
        if (linkText) {
          showLinkText = true;
        }
      } else {
        linkText = element.textContent || element.innerHTML;
      }
      return {
        text: linkText,
        show: showLinkText
      };
    },
    renderMarker: function(marker) {
      return marker.innerHTML = spanWrap(marker.hintString + (marker.showLinkText ? ": " + marker.linkText : ""));
    },
    fillInMarkers: function(hintMarkers) {
      var idx, linkTextObject, marker, _i, _len;
      this.generateLabelMap();
      for (idx = _i = 0, _len = hintMarkers.length; _i < _len; idx = ++_i) {
        marker = hintMarkers[idx];
        marker.hintString = this.generateHintString(idx);
        linkTextObject = this.generateLinkText(marker.clickableItem);
        marker.linkText = linkTextObject.text;
        marker.showLinkText = linkTextObject.show;
        this.renderMarker(marker);
      }
      return hintMarkers;
    },
    matchHintsByKey: function(hintMarkers, event) {
      var delay, keyChar, linksMatched, marker, matchString, userIsTypingLinkText, _i, _len;
      keyChar = KeyboardUtils.getKeyChar(event);
      delay = 0;
      userIsTypingLinkText = false;
      if (event.keyCode === keyCodes.enter) {
        for (_i = 0, _len = hintMarkers.length; _i < _len; _i++) {
          marker = hintMarkers[_i];
          if (marker.style.display !== "none") {
            return {
              linksMatched: [marker]
            };
          }
        }
      } else if (event.keyCode === keyCodes.backspace || event.keyCode === keyCodes.deleteKey) {
        if (!this.hintKeystrokeQueue.pop() && !this.linkTextKeystrokeQueue.pop()) {
          return {
            linksMatched: []
          };
        }
      } else if (keyChar) {
        if ((settings.values.linkHintNumbers || "").indexOf(keyChar) >= 0) {
          this.hintKeystrokeQueue.push(keyChar);
        } else {
          this.hintKeystrokeQueue = [];
          this.linkTextKeystrokeQueue.push(keyChar);
          userIsTypingLinkText = true;
        }
      }
      linksMatched = this.filterLinkHints(hintMarkers);
      matchString = this.hintKeystrokeQueue.join("");
      linksMatched = linksMatched.filter(function(linkMarker) {
        return !linkMarker.filtered && linkMarker.hintString.indexOf(matchString) === 0;
      });
      if (linksMatched.length === 1 && userIsTypingLinkText) {
        delay = 200;
      }
      return {
        linksMatched: linksMatched,
        delay: delay
      };
    },
    filterLinkHints: function(hintMarkers) {
      var linkMarker, linkSearchString, linksMatched, matchedLink, oldHintString, _i, _len;
      linksMatched = [];
      linkSearchString = this.linkTextKeystrokeQueue.join("");
      for (_i = 0, _len = hintMarkers.length; _i < _len; _i++) {
        linkMarker = hintMarkers[_i];
        matchedLink = linkMarker.linkText.toLowerCase().indexOf(linkSearchString.toLowerCase()) >= 0;
        if (!matchedLink) {
          linkMarker.filtered = true;
        } else {
          linkMarker.filtered = false;
          oldHintString = linkMarker.hintString;
          linkMarker.hintString = this.generateHintString(linksMatched.length);
          if (linkMarker.hintString !== oldHintString) {
            this.renderMarker(linkMarker);
          }
          linksMatched.push(linkMarker);
        }
      }
      return linksMatched;
    },
    deactivate: function(delay, callback) {
      this.hintKeystrokeQueue = [];
      this.linkTextKeystrokeQueue = [];
      return this.labelMap = {};
    }
  };

  spanWrap = function(hintString) {
    for (var ch, innerHTML = [], _i = 0, _len = hintString.length; _i < _len; _i++) {
      innerHTML.push("<span class='vimium0 vimium2'>" + hintString[_i] + "</span>");
    }
    return innerHTML.join("");
  };

  numberToHintString = function(number, characterSet, numHintDigits) {
    var base, hintString, hintStringLength, i, remainder, _i, _ref;
    if (numHintDigits == null) {
      numHintDigits = 0;
    }
    base = characterSet.length;
    hintString = [];
    remainder = 0;
    while (true) {
      remainder = number % base;
      hintString.unshift(characterSet[remainder]);
      number -= remainder;
      number /= Math.floor(base);
      if (!(number > 0)) {
        break;
      }
    }
    hintStringLength = hintString.length;
    for (i = _i = 0, _ref = numHintDigits - hintStringLength; _i < _ref; i = _i += 1) {
      hintString.unshift(characterSet[0]);
    }
    return hintString.join("");
  };

  root = typeof exports !== "undefined" && exports !== null ? exports : window;

  root.LinkHints = LinkHints;

})();
