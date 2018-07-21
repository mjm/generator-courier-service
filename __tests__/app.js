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
      .withPrompts({ useDatabase: false, useSidekiq: false })
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
      '.rubocop.yml',
      '.ruby-version',
      '.travis.yml',
      'app.rb',
      'app/controllers/index_controller.rb',
      'app/views/index.md',
      'config.ru',
      'config/environment.rb',
      'Gemfile',
      'lib/.keep',
      'Rakefile',
      'Procfile',
      'spec/.rubocop.yml',
      'spec/controllers/.keep',
      'spec/spec_helper.rb'
    ]);
  });

  it('sets the ruby version', () => {
    assert.fileContent('.ruby-version', '2.5.1');
    assert.fileContent('Gemfile', /ruby '2.5.1'/);
  });

  it('runs `bundle install`', () => {
    sinon.assert.calledWith(spawnCommand, 'bundle', ['install']);
  });

  it('runs `git init`', () => {
    sinon.assert.calledWith(spawnCommand, 'git', ['init', '-q']);
  });

  describe('when the service does not want a database', () => {
    it('does not include a models directory', () => {
      assert.noFile(['app/models/.keep', 'spec/models/.keep', 'db/migrations/.keep']);
    });

    it('does not include database gems', () => {
      assert.noFileContent('Gemfile', /gem 'pg'/);
      assert.noFileContent('Gemfile', /gem 'sequel'/);
    });

    it('does not initialize the database in environment.rb', () => {
      assert.noFileContent(
        'config/environment.rb',
        /DB = Sequel.connect\(ENV\['DATABASE_URL'\]\)/
      );
      assert.noFileContent('config/environment.rb', /require_app :models/);
    });

    it('does not set up the database when testing', () => {
      assert.noFileContent('spec/spec_helper.rb', /ENV\['DATABASE_URL'\]/);
      assert.noFileContent('spec/spec_helper.rb', /DB.transaction/);
    });

    it('does not include a Rake task for running migrations', () => {
      assert.noFileContent('Rakefile', /task :migrate/);
    });

    it('does not set up the database for Travis', () => {
      assert.noFileContent('.travis.yml', /postgresql/);
      assert.noFileContent('.travis.yml', /DATABASE_URL/);
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

    it('includes a models directory', () => {
      assert.file(['app/models/.keep', 'spec/models/.keep', 'db/migrations/.keep']);
    });

    it('includes database gems', () => {
      assert.fileContent('Gemfile', /gem 'pg'/);
      assert.fileContent('Gemfile', /gem 'sequel'/);
    });

    it('initializes the database in environment.rb', () => {
      assert.fileContent(
        'config/environment.rb',
        /DB = Sequel.connect\(ENV\['DATABASE_URL'\]\)/
      );
      assert.fileContent('config/environment.rb', /require_app :models/);
    });

    it('sets up the database when testing', () => {
      assert.fileContent(
        'spec/spec_helper.rb',
        /ENV\['DATABASE_URL'\] = 'postgres:\/\/\/courier_foo_test'/
      );
      assert.fileContent('spec/spec_helper.rb', /DB.transaction/);
    });

    it('include a Rake task for running migrations', () => {
      assert.fileContent('Rakefile', /task :migrate/);
    });

    it('sets up the database for Travis', () => {
      assert.fileContent('.travis.yml', /create database courier_foo_test;/);
      assert.fileContent('.travis.yml', /DATABASE_URL="postgres:\/\/\/courier_foo_test"/);
      assert.fileContent('.travis.yml', /bundle exec rake db:migrate/);
      assert.fileContent('.travis.yml', /services:\n- postgresql/);
      assert.fileContent('.travis.yml', /addons:\n {2}postgresql: '9.6'/);
    });
  });

  describe('when the service does not want background job support', () => {
    beforeAll(done => {
      helpers
        .run(path.join(__dirname, '../generators/app'))
        .withPrompts({ useSidekiq: false })
        .withArguments(['foo'])
        .on('ready', generator => {
          generator.spawnCommand = sinon.fake();
        })
        .on('end', done);
    });

    it('does not include a workers directory', () => {
      assert.noFile(['app/workers/.keep', 'spec/workers/.keep']);
    });

    it('does not include Sidekiq gems in the Gemfile', () => {
      assert.noFileContent('Gemfile', /gem 'sidekiq'/);
      assert.noFileContent('Gemfile', /gem 'rspec-sidekiq'/);
    });

    it('does not include a worker process in the Procfile', () => {
      assert.noFileContent('Procfile', /worker:/);
    });

    it('does not include Sidekiq setup in the environment setup', () => {
      assert.noFileContent('config/environment.rb', /Sidekiq.configure/);
      assert.noFileContent('config/environment.rb', /require_app :workers/);
    });
  });

  describe('when the service wants background job support', () => {
    beforeAll(done => {
      helpers
        .run(path.join(__dirname, '../generators/app'))
        .withPrompts({ useSidekiq: true })
        .withArguments(['foo'])
        .on('ready', generator => {
          generator.spawnCommand = sinon.fake();
        })
        .on('end', done);
    });

    it('includes a workers directory', () => {
      assert.file(['app/workers/.keep', 'spec/workers/.keep']);
    });

    it('includes Sidekiq gems in the Gemfile', () => {
      assert.fileContent('Gemfile', /gem 'sidekiq'/);
      assert.fileContent('Gemfile', /gem 'rspec-sidekiq'/);
    });

    it('includes a worker process in the Procfile', () => {
      assert.fileContent('Procfile', /\nworker:/);
    });

    it('includes Sidekiq setup in the environment setup', () => {
      assert.fileContent('config/environment.rb', /Sidekiq.configure_client/);
      assert.fileContent('config/environment.rb', /Sidekiq.configure_server/);
      assert.fileContent('config/environment.rb', /require_app :workers/);
    });
  });
});
