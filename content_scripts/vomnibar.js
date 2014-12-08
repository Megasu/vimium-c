// Generated by CoffeeScript 1.8.0
(function() {
  var BackgroundCompleter, Vomnibar, VomnibarUI, root;

  Vomnibar = {
    vomnibarUI: null,
    defaultRefreshInterval: 500,
    completers: {},
    getCompleter: function(name) {
      if (!(name in this.completers)) {
        this.completers[name] = new BackgroundCompleter(name);
      }
      return this.completers[name];
    },
    activateWithCompleter: function(completerName, refreshInterval, initialQueryValue, selectFirstResult, forceNewTab) {
      var completer = this.getCompleter(completerName), vomnibarUI = this.vomnibarUI;
      if (!vomnibarUI) {
        vomnibarUI = this.vomnibarUI = new VomnibarUI();
        vomnibarUI.initDom();
      }
      vomnibarUI.setInitialSelectionValue(selectFirstResult ? 0 : -1);
      vomnibarUI.setCompleter(completer);
      vomnibarUI.setRefreshInterval(refreshInterval || this.defaultRefreshInterval);
      vomnibarUI.setForceNewTab(forceNewTab);
      vomnibarUI.reset(initialQueryValue);
    },
    activate: function() {
      this.activateWithCompleter("omni");
    },
    activateInNewTab: function() {
      this.activateWithCompleter("omni", 0, null, false, true);
    },
    activateTabSelection: function() {
      this.activateWithCompleter("tabs", 0, null, true);
    },
    activateBookmarks: function() {
      this.activateWithCompleter("bookmarks", 0, null, true);
    },
    activateBookmarksInNewTab: function() {
      this.activateWithCompleter("bookmarks", 0, null, true, true);
    },
    activateHistory: function() {
      this.activateWithCompleter("history", 0, null, true);
    },
    activateHistoryInNewTab: function() {
      this.activateWithCompleter("history", 0, null, true, true);
    },
    activateEditUrl: function() {
      this.activateWithCompleter("omni", 0, window.location.href);
    },
    activateEditUrlInNewTab: function() {
      this.activateWithCompleter("omni", 0, window.location.href, false, true);
    },
    getUI: function() {
      return this.vomnibarUI;
    }
  };

  VomnibarUI = (function() {
    function VomnibarUI() {
      this.box = null;
      this.completer = null;
      this.completionInput = {
        url: "",
        action: "navigateToUrl",
        performAction: BackgroundCompleter.performAction
      };
      this.completionList = null;
      this.completions = null;
      this.eventHandlers = null;
      this.forceNewTab = false;
      this.handlerId = 0;
      this.initialSelectionValue = -1;
      this.input = null;
      this.isSelectionChanged = false;
      this.onUpdate = null;
      this.openInNewTab = false;
      this.refreshInterval = 0;
      this.selection = -1;
      this.timer = 0;
    }

    VomnibarUI.prototype.setQuery = function(query) {
      this.input.value = query;
    };

    VomnibarUI.prototype.setInitialSelectionValue = function(initialSelectionValue) {
      this.initialSelectionValue = initialSelectionValue;
    };

    VomnibarUI.prototype.setCompleter = function(completer) {
      this.completer = completer;
    };

    VomnibarUI.prototype.setRefreshInterval = function(refreshInterval) {
      this.refreshInterval = refreshInterval;
    };

    VomnibarUI.prototype.setForceNewTab = function(forceNewTab) {
      this.forceNewTab = forceNewTab;
    };

    VomnibarUI.prototype.show = function() {
      this.box.style.display = "block";
      this.input.focus();
      this.input.addEventListener("input", this.eventHandlers.input);
      this.completionList.addEventListener("click", this.eventHandlers.click);
      this.box.addEventListener("mousewheel", DomUtils.suppressPropagation);
      this.box.addEventListener("keyup", this.eventHandlers.keyEvent);
      this.handlerId = handlerStack.push({
        keydown: this.eventHandlers.keydown
      });
    };

    VomnibarUI.prototype.hide = function() {
      this.box.style.display = "none";
      this.input.blur();
      handlerStack.remove(this.handlerId);
      this.input.removeEventListener("input", this.eventHandlers.input);
      this.completionList.removeEventListener("click", this.eventHandlers.click);
      this.box.removeEventListener("mousewheel", DomUtils.suppressPropagation);
      this.box.removeEventListener("keyup", this.eventHandlers.keyEvent);
    };

    VomnibarUI.prototype.reset = function(input) {
      this.completionInput.url = this.input.value = input || "";
      this.update(0, this.show);
    };
    
    VomnibarUI.prototype.update = function(updateDelay, callback) {
      this.onUpdate = callback;
      if (typeof updateDelay === "number") {
        if (this.timer) {
          window.clearTimeout(this.timer);
          this.timer = 0;
        }
        if (updateDelay <= 0) {
          this.eventHandlers.timer();
          return;
        }
      } else if (this.timer) {
        return;
      } else {
        updateDelay = this.refreshInterval;
      }
      this.timer = setTimeout(this.eventHandlers.timer, updateDelay);
    };

    VomnibarUI.prototype.populateUI = function() {
      this.completionList.innerHTML = "\n  <li class=\"vimium0 vimium2 vomnibarCompletion\">\n    " + this.completions.map(function(completion) {
        return completion.text;
      }).join("\n  </li>\n  <li class=\"vimium0 vimium2 vomnibarCompletion\">\n    ") + "\n  </li>\n";
      if (this.completions.length > 0) {
        this.completionList.style.display = "block";
        this.selection = (this.completions[0].type === "search") ? 0 : this.initialSelectionValue;
      } else {
        this.completionList.style.display = "none";
        this.selection = -1;
      }
      this.updateSelection();
      this.isSelectionChanged = false;
    };

    VomnibarUI.prototype.updateSelection = function() {
      for (var _i = 0, _ref = this.completionList.children, selected = this.selection; _i < _ref.length; ++_i) {
        (_i != selected) && _ref[_i].classList.remove("vomnibarSelected");
      }
      if (selected >= 0 && selected < _ref.length) {
        _ref = _ref[selected];
        _ref.classList.add("vomnibarSelected");
        _ref.scrollIntoViewIfNeeded();
      }
    };

    VomnibarUI.prototype.actionFromKeyEvent = function(event) {
      if (KeyboardUtils.isEscape(event)) {
        return "dismiss";
      } else if (event.keyCode === keyCodes.enter) {
        return "enter";
      }
      var key = KeyboardUtils.getKeyChar(event);
      if (key === "up" || (event.shiftKey && event.keyCode === keyCodes.tab) || (event.ctrlKey && (key === "k" || key === "p"))) {
        return "up";
      } else if (key === "down" || (event.keyCode === keyCodes.tab && !event.shiftKey) || (event.ctrlKey && (key === "j" || key === "n"))) {
        return "down";
      }
    };

    VomnibarUI.prototype.onKeydown = function(event) {
      var action = this.actionFromKeyEvent(event);
      while (!action) {
        action = KeyboardUtils.getKeyChar(event);
        if (event.shiftKey || event.ctrlKey || event.altKey) {
        }
        else if (this.selection == 0 && this.completions.length == 1 && action == ' ' && this.input.value.slice(-2) === "  ") {
          action = "enter";
          break;
        }
        else if (this.selection >= 0 && this.isSelectionChanged || document.activeElement !== this.input) {
          action = parseInt(action);
          if (action === 0) { action = 10; }
          if (action <= this.completions.length) {
            this.selection = action - 1;
            action = "enter";
            break;
          }
        }
        return true;
      }
      this.openInNewTab = this.forceNewTab || (event.shiftKey || event.ctrlKey || event.metaKey);
      this.onAction(action);
      DomUtils.suppressEvent(event);
      return false;
    }

    VomnibarUI.prototype.onAction = function(action) {
      switch(action) {
      case "dismiss": this.hide(); break;
      case "up":
        this.isSelectionChanged = true;
        if (this.selection <= -1) this.selection = this.completions.length;
        this.selection -= 1;
        if (this.selection == -1) this.input.focus();
        this.input.value = this.completions[this.selection].url;
        this.updateSelection();
        break;
      case "down":
        this.isSelectionChanged = true;
        this.selection += 1;
        if (this.selection >= this.completions.length) {
          this.selection = -1;
          this.input.focus();
        }
        this.input.value = this.completions[this.selection].url;
        this.updateSelection();
        break;
      case "enter":
        action = function() {
          this.completions[this.selection].performAction(this);
          this.hide();
        };
        if (this.timer) {
          this.update(0, action);
        } else if (this.selection >= 0 || this.input.value.trim().length > 0) {
          action.call(this);
        }
        break;
      default: break;
      }
    };

    VomnibarUI.prototype.onClick = function(event) {
      var el = event.target, ulist = this.completionList;
      while(el && el.parentElement != ulist) { el = el.parentElement; }
      for (var _i = 0, _ref = ulist.children; _i < _ref.length; ++_i) {
        if (_ref[_i] == el) {
          el = _i;
          break;
        }
      }
      if (typeof el === "number") {
        this.selection = el;
        this.openInNewTab = this.forceNewTab || (event.shiftKey || event.ctrlKey || event.metaKey);
        this.onAction("enter");
      }
      DomUtils.suppressEvent(event);
    };

    VomnibarUI.prototype.onInput = function() {
      if (this.completions[this.selection].url.trimRight() != this.input.value.trim()) {
        this.update();
      }
      this.completionInput.url = this.input.value.trimLeft();
      return false;
    };

    VomnibarUI.prototype.onTimer = function() {
      this.timer = 0;
      this.completer.filter(this.input.value, this.eventHandlers.completions);
    };

    VomnibarUI.prototype.onCompletions = function(completions) {
      completions[-1] = this.completionInput;
      this.completions = completions;
      this.populateUI();
      if (this.onUpdate) {
        var onUpdate = this.onUpdate;
        this.onUpdate = null;
        onUpdate.call(this);
      }
    };

    VomnibarUI.prototype.onKeyEvent = function(event) {
      if((event.keyCode > KeyboardUtils.keyCodes.f1 && event.keyCode <= KeyboardUtils.keyCodes.f12)
        || event.altKey || event.shiftKey || event.ctrlKey || event.metaKey) {
        return;
      }
      DomUtils.suppressEvent(event);
    };
    
    VomnibarUI.prototype.template = "\
<div class=\"vimium0 vimium1\" id=\"vomnibar\">\n\
  <div class=\"vimium0 vimium1\" id=\"vomnibarSearchArea\">\n\
    <input type=\"text\" class=\"vimium0 vimium1\" id=\"vomnibarInput\" />\n\
  </div>\n\
  <ul class=\"vimium0 vimium1 vimiumScroll\" id=\"vomnibarList\"></ul>\n\
</div>";
    VomnibarUI.prototype.initDom = function() {
      this.box = Utils.createElementFromHtml(this.template);
      this.box.style.display = "none";
      document.body.appendChild(this.box);
      this.input = this.box.children[0].children[0];
      this.completionList = this.box.children[1];
      this.eventHandlers = {
        keydown: this.onKeydown.bind(this)
        , input: this.onInput.bind(this)
        , click: this.onClick.bind(this)
        , timer: this.onTimer.bind(this)
        , completions: this.onCompletions.bind(this)
        , keyEvent: this.onKeyEvent.bind(this)
      }
    };

    return VomnibarUI;

  })();

  BackgroundCompleter = (function() {
    function BackgroundCompleter(name) {
      this.name = name;
      this.refresh();
      this.getPort();
    }

    BackgroundCompleter.prototype.getPort = function() {
      if (!this.port) {
        try {
          BackgroundCompleter.prototype.port = chrome.runtime.connect({ name: "filterCompleter" });
          this.port.onDisconnect.addListener(this._clearPort);
          this.port.onMessage.addListener(this.onFilter);
        } catch (e) {
          BackgroundCompleter.prototype.port = null;
          return mainPort.fakePort;
        }
      }
      return this.port;
    };

    BackgroundCompleter.prototype._clearPort = function() {
      BackgroundCompleter.prototype.port = null;
    };
    
    BackgroundCompleter.prototype.refresh = function() {
      mainPort.postMessage({
        handler: "refreshCompleter",
        name: this.name
      });
    };

    BackgroundCompleter.prototype.onFilter = function(msg) {
      if (BackgroundCompleter.id != msg.id) { return; }
      BackgroundCompleter.maxCharNum = parseInt((window.innerWidth * 0.8 - 70) / 7.72);
      var results = msg.results.map(function(result) {
        BackgroundCompleter.makeShortenUrl.call(result);
        result.action = (result.type === "tab") ? "switchToTab"
          : ("sessionId" in result) ? "restoreSession"
          : "navigateToUrl";
        result.performAction = BackgroundCompleter.performAction;
        return result;
      });
      var callback = BackgroundCompleter.callback;
      BackgroundCompleter.callback = null;
      if (callback) {
        callback(results);
      }
    };
    
    BackgroundCompleter.prototype.filter = function(query, callback) {
      BackgroundCompleter.id = Utils.createUniqueId();
      BackgroundCompleter.callback = callback;
      this.getPort().postMessage({
        name: this.name,
        id: BackgroundCompleter.id,
        query: query.replace(/\s+/g, ' ').trim()
      });
    };

    return BackgroundCompleter;
  })();

  extend(BackgroundCompleter, {
    showRelevancy: false,
    maxCharNum: 160,
    showFavIcon: window.location.protocol.startsWith("chrome"),
    cutUrl: function(string, ranges, strCoded) {
      if (ranges.length == 0 || string.startsWith("javascript:")) {
        if (string.length <= BackgroundCompleter.maxCharNum) {
          return Utils.escapeHtml(string);
        } else {
          return Utils.escapeHtml(string.substring(0, BackgroundCompleter.maxCharNum - 3)) + "...";
        }
      }
      var out = [], cutStart = -1, temp, lenCut, i, end, start;
      if (! (string.length <= BackgroundCompleter.maxCharNum)) {
        cutStart = strCoded.indexOf("://");
        if (cutStart >= 0) {
          cutStart = strCoded.indexOf("/", cutStart + 4);
          if (cutStart >= 0) {
            temp = string.indexOf("://");
            cutStart = string.indexOf("/", (temp < 0 || temp > cutStart) ? 0 : (temp + 4));
          }
        }
      }
      cutStart = (cutStart < 0) ? string.length : (cutStart + 1);
      for(i = 0, lenCut = 0, end = 0; i < ranges.length; i += 2) {
        start = ranges[i];
        temp = (end >= cutStart) ? end : cutStart;
        if (temp + 20 > start) {
          out.push(Utils.escapeHtml(string.substring(end, start)));
        } else {
          out.push(Utils.escapeHtml(string.substring(end, temp + 10)));
          out.push("...");
          out.push(Utils.escapeHtml(string.substring(start - 6, start)));
          lenCut += start - temp - 19;
        }
        end = ranges[i + 1];
        out.push("<span class=\"vimium0 vimium2 vomnibarMatch\">");
        out.push(Utils.escapeHtml(string.substring(start, end)));
        out.push("</span>");
      }
      temp = BackgroundCompleter.maxCharNum + lenCut;
      if (! (string.length > temp)) {
        out.push(Utils.escapeHtml(string.substring(end)));
      } else {
        out.push(Utils.escapeHtml(string.substring(end,
          (temp - 3 > end) ? (temp - 3) : (end + 10))));
        out.push("...");
      }
      return out.join("");
    },
    makeShortenUrl: function() {
      this.text = BackgroundCompleter.cutUrl(this.text, this.textSplit, this.url);
      this.text = [
        "<div class=\"vimium0 vimium2 vomnibarTopHalf\">\n      <span class=\"vimium0 vimium2 vomnibarSource\">"
        , this.type, "</span>\n      <span class=\"vimium0 vimium2 vomnibarTitle\">", this.title
        , "</span>\n    </div>\n    <div class=\"vimium0 vimium2 vomnibarBottomHalf vomnibarIcon\""
        , ">\n      <span class=\"vimium0 vimium2 vomnibarUrl\">", this.text
        , (BackgroundCompleter.showRelevancy ? ("</span>\n      <span class='relevancy'>" + this.relevancy) : "")
        , "</span>\n    </div>"
      ];
      if (BackgroundCompleter.showFavIcon) {
        this.favIconUrl || (this.favIconUrl = "chrome://favicon/size/16/" + this.url);
        this.text.splice(5, 0, " style=\"background-image: url(", this.favIconUrl, ");\"");
      }
      this.text = this.text.join("");
    },
    performAction: function() {
      var action = BackgroundCompleter.completionActions[this.action] || this.action;
      if (typeof action !== "function") return;
      return action.apply(this, arguments);
    },
    completionActions: {
      navigateToUrl: function(data) {
        if (this.url.startsWith("javascript:")) {
          var script = document.createElement('script');
          script.textContent = decodeURIComponent(this.url.slice("javascript:".length));
          (document.documentElement || document.body || document.head).appendChild(script);
        } else {
          mainPort.postMessage({
            handler: data.openInNewTab ? "openUrlInNewTab" : "openUrlInCurrentTab",
            url: this.url.trimRight(),
            selected: data.openInNewTab
          });
        }
      },
      switchToTab: function() {
        mainPort.postMessage({
          handler: "selectSpecificTab",
          sessionId: this.sessionId
        });
      },
      restoreSession: function() {
        mainPort.postMessage({
          handler: "restoreSession",
          sessionId: this.sessionId,
        });
      }
    }
  });

  root = typeof exports !== "undefined" && exports !== null ? exports : window;

  root.Vomnibar = Vomnibar;

})();
