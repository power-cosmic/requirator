# requirator

[![Build Status](https://travis-ci.org/power-cosmic/requirator.svg?branch=master)](https://travis-ci.org/power-cosmic/requirator)

## Overview

A library to mimic much of the functionality of jrburke's [requirejs](https://github.com/jrburke/requirejs). This was written for a graduate class in which we were encouraged to use only code we developed.

## API

### require([*dependencies*,] callback)

Defines code to be executed once a given array of `dependencies` have been loaded. Once all `dependencies` have been loaded, `callback` will be called, with the loaded dependencies passed as its arguments. If the callback returns a value, it will not be kept permanently by requirator. In general, this is preferred when the module will not be a dependency of another module.

### define([*dependencies*,] callback)

Define a module that may be used as a dependency to other modules defined with `define` or `require`. `dependencies` is an array of dependency paths. Once all modules are loaded, they will be passed as arguments to `callback`. Callback is expected to return a module which will be stored by `requirator`.

## Examples

```javascript
// define a basic module (located in basicModule.js)
define([], function() {
  return {
    name: 'tyler',
    favoriteManaColor: 'black'
  };
});
```
```javacript
// log the module defined by basicModule.js
require(['basicModule.js'], function(basicModule) {
  console.log(basicModule.name);
});
```

## Licence

`requirator` is published under the MIT license.
