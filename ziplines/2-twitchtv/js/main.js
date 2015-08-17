function what() {
    console.log(arguments);
}

var TwitchTv = {
    makeCall: function(where) {
        if ( typeof where!=="string" ) where = '';
        var TWITCHTV_API_URL = "https://api.twitch.tv/kraken";
        return $.getJSON(TWITCHTV_API_URL + where + '?callback=?')
            .then(this.responseHandler);
    },
    responseHandler: function(response, xhrStatus, xhr) {
        if( xhrStatus==='success' ){
            if( response.error===undefined ) {
                return $.Deferred().resolve(response);
            }
        }
        return $.Deferred().reject(response, xhrStatus, xhr);
    },
    getStreams: function(user) {
        return this.makeCall('/streams/' + user);
    },
    getUserInfo: function(user) {
        return this.makeCall('/users/' + user);
    }
};


function isOnline(streams) {
    return streams.stream!==null;
}

var listItemRenderer = _.template($('#tva-tmpl-channel-item').html());
function renderListItem(userStreams, userInfo, $target) {
    var online = isOnline(userStreams);
    var html = listItemRenderer({
        icon_url: userInfo.logo===null ? Defaults.userLogo : userInfo.logo,
        status: online ? 'online' : 'offline',
        statusClass: online ? 'tva-online' : 'tva-offline',
        streamText: online ? userStreams.stream.game : '',
        pageUrl: 'http://twitch.tv/' + userInfo.name, 
        name: userInfo.display_name
    });

    //console.log(html);
    $target.append(html);
}

function renderList(users) {
    var $list = $('.tva-channel-list');
    $list.empty();
    function helper(users, $list) {
        if ( users.length<1 ) return;
        var user;
        user = users.shift();
        $.when(
            TwitchTv.getStreams(user),
            TwitchTv.getUserInfo(user)
        )
            .then(function(streams, info) {
                renderListItem(streams, info, $list);
                helper(users, $list);
            }, function() {
                console.log('TVA: an error occured in a call.', arguments);
                helper(users, $list);
            });
    }
    helper(users, $list);
}

var TabBar = {
    setup: function(selector, target) {
        var $e = this._$e = $(selector);
        $e.on('click', this.onTabEvent.bind(this));

        this._target = target;
    },
    onTabEvent: function(ev) {
        ev.preventDefault();
        this._$e.removeClass('tva-active');
        var type = $(ev.currentTarget)
                .addClass('tva-active')
                .data('tva-type');
        var $target = $(this._target);

        $target.removeClass('tva-online tva-offline');
        if ( type==='' ) {
        } else {
            $target.addClass('tva-' + type);
        }
        console.log('click', ev);
    }
};

var FuzzySearchBar = {
    setup: function(selector, listSelector) {
        this._$e = $(selector).on('keyup', this.onKeyUp.bind(this));
        this._items = listSelector;
        this._search = "";
    },
    setList: function(listSelector) {
        this._items = listSelector;
    },
    doSearch: function() {
        var $list = $(this._items);
        if ( this._search==='' ) {
            $list.addClass('tva-match');
            return;
        }
        var list = $list.map(function(i, element) {
            return $(element).data('tva-search');
        });

        $list.removeClass('tva-match');
        var found = easyFuzzySearch(this._search, list);
        for( var i=found.length-1; i>=0; i-- ) {
            $($list[found[i]]).addClass('tva-match');
        }
    },
    onKeyUp: function(ev) {
        this._search = ev.currentTarget.value;
        this.doSearch();
    }
};

function setupEvents() {
    // Tab bar
    TabBar.setup('.tva-tab-bar .tva-tab a', '.tva-channel-list');
    FuzzySearchBar.setup('.tva-search', '.tva-channel-list .tva-channel-item');
}

function easyFuzzySearch(term, list) {
    var matcher = new RegExp(term.split('').join('.*'), 'i');
    var i=list.length-1, found=[];
    while(i>=0) {
        if( matcher.test(list[i]) ) {
            found.push(i);
        }
        i--;
    }
    return found;
}

function runApp() {
    setupEvents();

    var defaultUsers = ["comster404","freecodecamp", "storbeck", "terakilobyte", "habathcx","RobotCaleb","brunofin","thomasballinger","noobs2ninjas","beohoff","medrybw"];
  //  var defaultUsers = ["freecodecamp", "medrybw"];

    renderList(defaultUsers);

}
$(runApp);

var Defaults = {
    userLogo: 'data:image/png;base64,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'
};
