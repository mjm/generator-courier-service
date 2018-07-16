'use strict';
const path = require('path');
const sinon = require('sinon');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');

describe('generator-courier-service:app', () => {
  let spawnCommand = sinon.fake();
  beforeAll(done => {
    helpers
      .run(path.join(__dirname, '../generators/app'))
      .withPrompts({ useDatabase: false })
      .withArguments(['foo'])
      .on('ready', generator => {
        generator.spawnCommand = spawnCommand;
      })
      .on('end', done);
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

  it('sets the service name in the App Engine configuration', () => {
    assert.fileContent('app.yaml', /service: foo/);
  });

  it('sets the ruby version', () => {
    assert.fileContent('.ruby-version', '2.5.1');
  });

  it('runs `bundle install`', () => {
    sinon.assert.calledWith(spawnCommand, 'bundle', ['install']);
  });

  it('runs `git init`', () => {
    sinon.assert.calledWith(spawnCommand, 'git', ['init', '-q']);
  });

  describe('when the service does not want a database', () => {
    it('does not include database gems', () => {
      assert.noFileContent('Gemfile', /gem 'pg'/);
      assert.noFileContent('Gemfile', /gem 'sequel'/);
    });

    it('does not initialize the database in environment.rb', () => {
      assert.noFileContent(
        'config/environment.rb',
        /DB = Sequel.connect\(ENV\['DB_URL'\]\)/
      );
      assert.noFileContent('config/environment.rb', /require 'sequel'/);
    });

    it('does not include App Engine SQL configuration', () => {
      assert.noFileContent('app.yaml', /beta_settings/);
      assert.noFileContent('app.yaml', /cloud_sql_instances/);
    });
  });

  describe('when the service wants database support', () => {
    beforeAll(done => {
      helpers
        .run(path.join(__dirname, '../generators/app'))
        .withPrompts({ useDatabase: true })
        .withArguments(['foo'])
        .on('ready', generator => {
          generator.spawnCommand = sinon.fake();
        })
        .on('end', done);
    });

    it('includes database gems', () => {
      assert.fileContent('Gemfile', /gem 'pg'/);
      assert.fileContent('Gemfile', /gem 'sequel'/);
    });

    it('initializes the database in environment.rb', () => {
      assert.fileContent(
        'config/environment.rb',
        /DB = Sequel.connect\(ENV\['DB_URL'\]\)/
      );
      assert.fileContent('config/environment.rb', /require 'sequel'/);
    });

    it('includes App Engine SQL configuration', () => {
      assert.fileContent('app.yaml', /beta_settings/);
      assert.fileContent(
        'app.yaml',
        /cloud_sql_instances: stable-reactor-209402:us-central1:courier-foo/
      );
    });
  });
});
