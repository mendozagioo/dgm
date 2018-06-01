'use strict';

define(function() {
  return function($rootScope, $resource, events) {
    var Service = {
      _error: false,

      _pageSize: 10,

      _querying: '',

      _request: null,

      _timeout: 5000,

      _total: 0,

      _resource: $resource('https://datos.gob.mx/ckan-admin/api/3/action/:action', null, {
        dataset: {
          method: 'GET',
          isArray: false,
          transformResponse: function(data) {
            var response = angular.fromJson(data);

            return response && response.result || [];
          }
        },
        datasets: {
          method: 'GET',
          isArray: true,
          transformResponse: function(data) {
            var response = angular.fromJson(data);

            Service._total = response.result.count;

            return response && response.result.results || [];
          }
        }
      }),

      _setTimeout: function() {
        var that = this;

        this._error = false;
        return setTimeout(function() {
          that._error = true;

          if (that._request !== null) {
            that._request.$cancelRequest();
          }

          $rootScope.$broadcast(events.SERVICE_TIMEOUT);
        }, this._timeout);
      },

      getEvent: function(event) {
        /* istanbul ignore next */
        switch (event) {
          case 'ERROR':
            return events.DATASETS_ERROR;
            break;
          case 'QUERY':
            return events.DATASETS_QUERY;
            break;
          case 'QUERYING':
            return events.DATASETS_QUERYING;
            break;
          default:
            return null;
        }
      },

      getPageSize: function() {
        return this._pageSize;
      },

      getTotal: function() {
        return this._total;
      },

      dataset: function(id) {
        $rootScope.$broadcast(events.DATASETS_RETRIEVING);
        return this._resource.dataset({
            action: 'package_show',
            id: id
          },
          function(data) {
            while (!data.$resolved) {
              // Resolving
            }

            $rootScope.$broadcast(events.DATASETS_RETRIEVED, data);
          });
      },

      datasets: function(q, size, order, skip) {
        $rootScope.$broadcast(events.DATASETS_QUERYING);

        if (size) {
          this._pageSize = size;
        }

        var that = this,
          timeout = this._setTimeout();

        this._request = this._resource.datasets({
            action: 'package_search',
            q: q,
            rows: this._pageSize,
            start: skip,
            sort: order
          },
          function(data) {
            while (!data.$resolved) {
              // Empty statement
            }
            clearTimeout(timeout);

            that._request = null;
            $rootScope.$broadcast(events.DATASETS_QUERY, data);
          });

        return this._request;
      }
    };

    return Service;
  };
});
