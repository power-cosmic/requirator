var require = require || null;

if (require) {
  /*
   * running in node;
   * load dependencies
   */
   var chai = require('chai');
   require('../lib/requirator.js');
  test();
} else {
  /*
   * running from test_runner.html;
   * only need to load requirator.js
   */

   // ugh
   document.write('<script src="../lib/requirator.js"></script>');
}

(function() {

  var expect = chai.expect;

  describe('requirator', function() {

    it('should load a module with no dependencies provided', function(done) {
      require(['modules/noDependencies.js'], function(module) {
        expect(module).to.be.ok;
        done();
      });
    });

    it('should work when A requires B', function(done) {
      require(['modules/a.js'], function(a) {
        expect(a).to.equal('success');
        done();
      });
    });

  });
})();
