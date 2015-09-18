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
