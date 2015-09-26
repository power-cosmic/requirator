(function() {

  var modules = {},
    ajax = null,
    configuration = {
      baseUrl: '',
      plugins: {},
      paths: {}
    },
    foundModuleOrDefinition,
    dependencyListeners = {},
    dependenciesFor = {},
    loadStack = [],

    toDirectory = function(url) {
      if (url[url.length - 1] !== '/') {
        url += '/';
      }
      return url;
    },

    runModule = function(dependencies, fn) {
      return fn.apply(fn, moduleArray(dependencies));
    },

    register = function(mod, name) {
      //var mod = fn.apply(fn, moduleArray(dependencies));
      if (name) {
        modules[name] = mod;

        // notify dependent modules
        if (dependencyListeners[name]) {
          notifyListeners(dependencyListeners[name]);
        }

      }
      return mod;
    },

    createModule = function(dependencies, fn, name) {
      if (typeof dependencies === 'function') {
        fn = dependencies;
        dependencies = [];
      }

      foundModuleOrDefinition = true;
      if (areLoaded(dependencies)) {
        var mod = runModule(dependencies, fn);
        register(mod, name);
      } else {
        /*
         * Store data on module so it can be run
         * once dependencies load
         */
        var waitingModule = {
          dependencies: dependencies,
          fn: fn,
          name: name
        }

        dependenciesFor[name] = dependencies;

        for (var i = dependencies.length - 1; i >= 0; i--) {
          var dependency = dependencies[i];

          // Map dependency name to array of dependents
          if (!modules[dependency]) {
            if (dependencyListeners[dependency]) {
              /*
               * Another module requested this dependency.
               * Add module to listeners
               */
              dependencyListeners[dependency].push(waitingModule);
            } else {
              dependencyListeners[dependency] = [waitingModule];
              loadDependency(dependency);
            }
          }
        }
        if (hasCircularDependency(dependencies, name)) {
          // reset data and throw error
          removeReferences(name);
          throw new Error('Circular dependency identified for ' + name
              + '; unable to load dependents');
        }
      }
    },

    loadDependency = function(dependency) {
      var location = dependency;
      var bangIndex = location.indexOf('!');

      if (bangIndex > 0) {
        var pluginName = dependency.substring(0, bangIndex);
        var resource = dependency.substring(bangIndex + 1);
        var pluginLocation = configuration.plugins[pluginName];

        if (pluginLocation) {
          define([pluginLocation], function(plugin) {
            // loadFile('GET', resource, function(response) {
            //   var mod = plugin.processFile(response.content);
            //   register(mod, location);
            // }, plugin.mimeType);
            var requestFormat = plugin.getFormat?
                plugin.getFormat(resource) : null;

            ajax.get(buildUrl(resource), null, function(response) {
              var mod = plugin.processFile(response);
              register(mod, location);
            }, requestFormat);
          });
        } else {
          throw new Error('unknown plugin: ' + plugin);
        }
      } else {
        location += '.js';
        // loadFile('GET', location, function(response) {
        //   moduleLoaded(dependency, response.content);
        // }, 'application/x-javascript');
        ajax.get(buildUrl(location), '', function(response) {
          moduleLoaded(dependency, response);
        });
      }
    }

    removeReferences = function(name) {
      modules[name] = null;
      var dependencies = dependencyListeners[name];
      for (var i = dependencies.length - 1; i >= 0; i--) {
        for (var j = dependencies[i].dependencies.length - 1; j >= 0; j--) {
          if (dependencies[i].dependencies[j] === name) {
            dependencies[i].dependencies.splice(j, 1);
          }
        }
      }

      delete dependenciesFor[name];
    },

    notifyListeners = function(listeners) {
      for (var i = listeners.length - 1; i >= 0; i--) {
        if (areLoaded(listeners[i].dependencies)) {
          var mod = runModule(
            listeners[i].dependencies,
            listeners[i].fn
          );

          register(mod, listeners[i].name);
          listeners.splice(i, 1);
        }
      }
    },

    moduleArray = function(dependencies) {
      var output = [];
      for (var i = 0; i < dependencies.length; i++) {
        var path = dependencies[i];
        output.push(modules[path]);
      }
      return output;
    },

    areLoaded = function(dependencies) {
      for (var i = 0; i < dependencies.length; i++) {
        if (modules[dependencies[i]] === undefined) {
          return false;
        }
      }
      return true;
    },

    hasCircularDependency = function(dependencies, name) {
      dependencies = dependencies || [];

      for (var i = 0; i < dependencies.length; i++) {

        if (dependencies[i] === name) {
          return true;
        }
        if (hasCircularDependency(dependenciesFor[dependencies[i]], name)) {
          return true;
        }
      }

      return false;
    },

    buildUrl = function(url) {

      if (url[0] === '/' || url[0] == '.') {
        return url;
      } else {
        var pathStart = configuration.baseUrl;

        // url begins with a path
        for (path in configuration.paths) {
          if (url.indexOf(path) === 0) {
            var output = url.replace(path, configuration.paths[path]);
            return output;
          }
        }
        return pathStart + url;
      }
    },

    moduleLoaded = function(path, content) {

      // data to be picked up if the file is actually a module
      loadStack.push(path);
      foundModuleOrDefinition = false;

      // run the module code
      eval(content);
      loadStack.pop();

      if (!foundModuleOrDefinition) {
        console.warn(path + ' isn\'t a module');
        modules[path] = null;
        if (dependencyListeners[path]) {
          notifyListeners(dependencyListeners[path]);
        }
      }
    };

  /**
   * Create an anonymous module.
   * @param {Array} dependencies Array of dependency paths
   * @param {Function} fn Function to be called when dependencies
   *      are loaded.
   */
  require = function(dependencies, fn) {
    loadStack.pop();
    createModule(dependencies, fn);
  };

  /**
   * Create a module that is cached. This may be a dependency
   * of other modules.
   * @param {Array} dependencies Array of dependency paths
   * @param {Function} fn Function to be called when dependencies
   *      are loaded.
   */
  define = function(dependencies, fn) {
    var name = loadStack[loadStack.length - 1];
    createModule(dependencies, fn, name);
  };

  /**
   * Set the configuration for requirator.
   */
  config = function(configObject) {
    for (var property in configObject) {
      configuration[property] = configObject[property];
    }
    ajax = configObject.ajax;

    // add slash to the end of the baseUrl if needed
    if (configuration.baseUrl) {
      configuration.baseUrl = toDirectory(configuration.baseUrl);
    }

    // make sure paths are legit
    for (path in configuration.paths) {
      configuration.paths[path] = toDirectory(configuration.paths[path]);
    }

    // load plugins
    for (var pluginName in configuration.plugins) {
      require([configuration.plugins[pluginName]], function(plugin){});
    }

  };

})();
