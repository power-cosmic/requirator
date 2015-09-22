var require = require || null;
var chai = chai || null;
var _require = require;

var test = function(path, ajaxer) {

  var expect = chai.expect;

  config({
    baseUrl: path,
    ajax: ajaxer
  });

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

  });
};

if (require) {

    // running in node

   chai = require('chai');
   fsAjaxer = require('ajaxer-fs');

   var fs = require('fs');
   var req = fs.readFileSync('./lib/requirator.js').toString();
   eval(req);

   test('./tests/', fsAjaxer);
} else {

  // running in test_runner.html

   ajaxer.get('../lib/requirator.js', '', function(data) {
     eval(data);
     test('./', ajaxer);
     mocha.run();
   });

}
