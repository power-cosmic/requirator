(function() {

  /*************************************************
   * Variables and functions hidden by the closure *
   ************************************************/

  var modules = {},
    configuration = {
      baseUrl: ''
    },
    foundModuleOrDefinition,
    dependencyListeners = {},
    dependentListeners = {},
    loadStack = [],

    register = function(dependencies, fn, name) {
      var mod = fn.apply(fn, moduleArray(dependencies));
      if (name) {
        modules[name] = mod;

        // notify dependent modules
        if (dependencyListeners[name]) {
          notifyListeners(dependencyListeners[name]);
        }

      }
      return mod;
    },

    moduleDefine = function(dependencies, fn, name) {
      if (typeof dependencies === 'function') {
        fn = dependencies;
        dependencies = [];
      }

      foundModuleOrDefinition = true;
      if (areLoaded(dependencies)) {
        register(dependencies, fn, name);
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

        dependentListeners[name] = dependencies;

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

              /*
               * Load file and set listener action for when it loads.
               * Rocking a closure here because dependency will
               * change before the file is loaded.
               */
              (function() {
                var dependencyCopy = dependency;
                loadFile('GET', dependency, function(response) {
                  moduleLoaded(dependencyCopy, response.content);
                });
              })();

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

      delete dependentListeners[name];
    },

    notifyListeners = function(listeners) {
      for (var i = listeners.length - 1; i >= 0; i--) {
        if (areLoaded(listeners[i].dependencies)) {
          var mod = register(
            listeners[i].dependencies,
            listeners[i].fn,
            listeners[i].name
          );
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
        if (hasCircularDependency(dependentListeners[dependencies[i]], name)) {
          return true;
        }
      }

      return false;
    },

    loadFile = function(method, url, callback) {
      var xmlhttp = new XMLHttpRequest();

      url = configuration.baseUrl + url;

      xmlhttp.open(method, url, true);
      xmlhttp.onreadystatechange = function() {
        if (xmlhttp.status == 0 || xmlhttp.readyState === 4) {
          callback({
            status: xmlhttp.status,
            content: xmlhttp.responseText
          });
        }
      };
      xmlhttp.send();
    },
    load = function(path) {
      loadFile('GET', path, function(response) {
        if (response.status === 200) {
          eval(response.content);
        }
      });
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


  /*************************
   * Global functions      *
   ************************/

  /**
   * Create an anonymous module.
   * @param {Array} dependencies Array of dependency paths
   * @param {Function} fn Function to be called when dependencies
   *      are loaded.
   */
  require = function(dependencies, fn) {
    loadStack.pop();
    moduleDefine(dependencies, fn);
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
    moduleDefine(dependencies, fn, name);
  };

  /**
   * Set the configuration for requirator.
   */
  config = function(configObject) {
    for (var property in configObject) {
      configuration[property] = configObject[property];
    }

    // add slash to the end of the baseUrl if needed
    if (configuration.baseUrl &&
        configuration.baseUrl[configuration.baseUrl.length - 1] != '/') {
      configuration.baseUrl += '/';
    }
  };


})();
