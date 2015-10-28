function what() { console.log(arguments); }
function firedUp() { console.log('WRAAAR!'); }

var WIKIPEDIA_ENDPOINT = 'https://en.wikipedia.org/w/api.php';

var J = {
    throttle: function throttle(fn, delay) {
        var callCount=0;
        return function() {
            if( callCount===0 ) {
                fn.apply(this, arguments);
                setTimeout(function() {
                    if( callCount>1 ) fn.apply(this, arguments);
                    callCount = 0;
                }, delay);
            }
            callCount++;
        };
    }
};

angular.module('wiki-searcher', [])

    .service('wikiService', ['$http', function($http) {
        this.opensearch = function(searchTerm, limit) {
            limit = limit || 10;
            return $http.jsonp(WIKIPEDIA_ENDPOINT, {
                params: {
                    callback:'JSON_CALLBACK',
                    action: 'opensearch',
                    format: 'json',
                    namespace: 0,
                    suggest: '',
                    limit: limit,
                    search: searchTerm
                }
            });
        };

        this.fullsearch = function(searchTerm, limit, offset) {
            //?format=json&action=query&list=search&srsearch=design+pat&srnamespace=0&srlimit=10
            limit = limit || 10;
            offset = offset || '';

            return $http.jsonp(WIKIPEDIA_ENDPOINT, {
                params: {
                    callback:'JSON_CALLBACK',
                    action: 'query',
                    format: 'json',
                    namespace: 0,
                    suggest: '',
                    srlimit: limit,
                    srsearch: searchTerm,
                    list: 'search',
                    continue: offset
                }
            });
        };

        this.gsrsearch = function(searchTerm, limit, offset) {
            //format=json&action=query&generator=search&gsrnamespace=0&gsrlimit=10&prop=pageimages|extracts&pilimit=max&exintro&explaintext&exsentences=1&exlimit=max&gsrsearch=dfa
            limit = limit || 10;
            offset = offset || '';

            return $http.jsonp(WIKIPEDIA_ENDPOINT, {
                params: {
                    callback:'JSON_CALLBACK',
                    format: 'json',
                    action: 'query',
                    generator: 'search',
                    gsrnamespace: 0,
                    gsrlimit: limit,
                    prop: 'pageimages|extracts',
                    pilimit: 'max',
                    exintro: '',
                    explaintext: '',
                    exsentences: 1,
                    exlimit: 'max',
                    gsrsearch: searchTerm
                }
            });
        };

        this.redirectTo = function(url, options) {
            var defaults = {
                withHistory: true
            };
            options = angular.extend({}, defaults, options);

            if( options.withHistory ) {
                window.location.href = url;
            } else {
                window.location.replace(url);
            }
        };
        var WIKIPEDIA_PAGE_URL = 'http://en.wikipedia.org/?curid=';
        this.redirectToPageId = function(pageId, options) {
            var url = WIKIPEDIA_PAGE_URL + pageId;
            this.redirectTo(url, options);

        };
    }])

    .directive('autoComplete', function() {
        function openSearchTransform(data) {
            return data[1].map(function(v, n) {
                return {
                    title: data[1][n],
                    description: data[2][n],
                    url: data[3][n]
                };
            });
        }
        var template = '<div class="wv-search-box"> <input class="wv-search" ng-model="c.searchTerm" ng-change="c.doAutoComplete()" ng-keyup="c.keypress($event)" type="text" placeholder=""/><button ng-click="c.doSearch()" class="wv-search-btn"><i class="fa fa-search"></i></button></div><div ng-show="c.results.length>0" class="wv-results"> <div class="wv-results-item" ng-class="{active: c.selection==$index}" ng-click="c.redirectToSelected($index)" ng-repeat="result in c.results">{{result.title}}</div></div>',
        
            controller =  ['wikiService', '$log', function(wikiService, $log) {
                var CHAR_COUNT_TO_SEARCH=2;
                this.searchTerm = '';
                this.results = [];
                this.selection = -1;
                this.typedSearchTerm = '';

                this.moveSelection = function(offset) {               
                    var newSelection = this.selection + offset;
                    if( this.selection===-1 ) this.typedSearchTerm = this.searchTerm;

                    if( newSelection<this.results.length && newSelection>=-1 ){
                        this.selection = newSelection;
                        this.searchTerm = newSelection===-1
                            ? this.typedSearchTerm
                            : this.results[newSelection].title;
                    }
                };

                this.resetSelection = function() {
                    this.selection = -1;
                };

                this.doRedirect = function(url) {
                    $log.debug('redirecting to: ', url);
                    wikiService.redirectTo(url);
                };

                this.redirectToSelected = function(index) {
                    this.doRedirect(this.results[index].url);
                };

                this.clearInput = function() {
                    this.searchTerm = '';
                };

                this.keypress = function($event) {

                    switch( $event.keyCode ) {
                    case 13: //ENTER
                        if( this.selection>-1 ) {
                            this.doRedirect(this.results[this.selection].url);
                        } else {
                            this.doSearch(this.searchTerm);
                        }
                        break;
                    case 27: //ESC
                        this.clearInput();
                        break;
                    case 38: //UP
                        this.moveSelection(-1);
                        break;
                        
                    case 40: //DOWN
                        this.moveSelection(1);
                        break;
                        
                    default:
                        $log.debug($event.keyCode);
                    }
                }.bind(this);

                this.doAutoComplete = function($event) {
                    $log.info(this.searchTerm, $event);

                    if(this.searchTerm===undefined) return; 

                    this.resetSelection();
                    var searchTerm = this.searchTerm.trim();
                    if ( searchTerm.length<=CHAR_COUNT_TO_SEARCH ) {
                        this.resetResults();
                    } else if ( searchTerm.length>CHAR_COUNT_TO_SEARCH ) {
                        wikiService.opensearch(this.searchTerm)
                            .success(function(data) {
                                $log.debug(data);
                                data = openSearchTransform(data);
                                $log.debug(data);

                                this.results = data;
                            }.bind(this));
                    }
                };

                this.resetResults = function() {
                    this.results = [];
                };

                this.doSearch = function() {
                    this.resetResults();
                    $log.debug('doSearch');
                    var searchTerm = this.searchTerm.trim();
                    if ( searchTerm.length>0 ) this.fireOnSearch({ searchTerm: searchTerm });
                };
            }],

            bindings = { 
                fireOnSearch: '&onSearch',
                test: '&'
            };


        return {
            restrict: 'E',
            scope: {},
            template: template,
            //templateUrl: '/auto-complete.html',
            controller: controller,
            controllerAs: 'c',
            bindToController: bindings
        };
    })
    .controller('MainController', ['wikiService', function(wikiService) {
        this.results = [];
        this.search = function(st) {
            console.log('full search for:', st);
            wikiService
                .gsrsearch(st)
                .success(function(data) {
                    console.log(data);
                    this.results = data.query.pages;
                }.bind(this));
        };
    }]);
