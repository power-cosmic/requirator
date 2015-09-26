var require = require || null;
var chai = chai || null;
var _require = require;

var test = function(configuration) {

  var expect = chai.expect;

  config(configuration);

  describe('requirator', function() {
    it('should load a module with no dependencies provided', function(done) {

      require(['modules/noDependencies'], function(module) {
        expect(module).to.be.an('object');
        done();
      });
    });

    it('should work when A requires B', function(done) {

      require(['modules/a'], function(a) {
        expect(a).to.equal('success');
        done();
      });

    });

    it('should use paths', function(done) {
      require(['scripts/basicModule'], function(basicModule) {
        expect(basicModule).to.be.a('string');
        done();
      });
    });

  });
};

if (require) {

    // running in node

   chai = require('chai');
   fsAjaxer = require('ajaxer-fs');

   var fs = require('fs');
   var req = fs.readFileSync('./lib/requirator.js').toString();
   eval(req);

   test({
     baseUrl: './tests/',
     ajax: fsAjaxer,
     paths: {
       'img/': './tests/modules/img',
       'scripts/': './examples/modules'
     }
   });
} else {

  // running in test_runner.html

   ajaxer.get('../lib/requirator.js', '', function(data) {
     eval(data);
     test({
       baseUrl: './',
       ajax: ajaxer,
       paths: {
         'img/': './modules/img',
         'scripts/': '../examples/modules'
       }
     });
     mocha.run();
   });

}
