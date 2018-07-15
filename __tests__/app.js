'use strict';
const path = require('path');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');

describe('generator-courier-service:app', () => {
  beforeAll(() => {
    return helpers
      .run(path.join(__dirname, '../generators/app'))
      .withPrompts({ someAnswer: true })
      .withArguments(['foo']);
  });

  it('creates the service in a named directory', () => {
    assert.equal(path.basename(process.cwd()), 'courier-foo');
  });

  it('creates files', () => {
    assert.file([
      '.gitignore',
      '.ruby-version',
      '.travis.yml',
      'app.rb',
      'app.yaml',
      'app/controllers/.keep',
      'config.ru',
      'config/environment.rb',
      'Gemfile',
      'Rakefile',
      'spec/controllers/.keep',
      'spec/spec_helper.rb'
    ]);
  });

  it('sets the bucket name in the App Engine configuration', () => {
    assert.fileContent(
      'app.yaml',
      /GOOGLE_CLOUD_STORAGE_BUCKET: foo-stable-reactor-209402/
    );
  });

  it('sets the ruby version', () => {
    assert.fileContent('.ruby-version', '2.5.1');
  });
});
