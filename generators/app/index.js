'use strict';
const Generator = require('yeoman-generator');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.argument('name', {
      type: String,
      required: true
    });
  }

  prompting() {
    const prompts = [
      {
        type: 'input',
        name: 'rubyVersion',
        message: 'What Ruby version should the service use?',
        default: '2.5.1'
      },
      {
        type: 'confirm',
        name: 'useDatabase',
        message: 'Would you like to include PostgreSQL support?',
        default: true
      },
      {
        type: 'confirm',
        name: 'useSidekiq',
        message: 'Would you like to include support for background jobs?',
        default: true
      }
    ];

    return this.prompt(prompts).then(props => {
      // To access props later use this.props.someAnswer;
      this.props = props;
    });
  }

  default() {
    const appName = `courier-${this.options.name}`;
    this.log(`Generating service ${appName}!`);
    this.destinationRoot(this.destinationPath(appName));
  }

  writing() {
    const files = [
      '.gitignore',
      '.rspec',
      '.rubocop.yml',
      'app.rb',
      'app/controllers/index_controller.rb',
      'app/views/index.md',
      'config.ru',
      'spec/.rubocop.yml'
    ];
    files.forEach(file => {
      this.fs.copy(this.templatePath(file), this.destinationPath(file));
    });

    this.fs.copyTpl(
      this.templatePath('.travis.yml'),
      this.destinationPath('.travis.yml'),
      {
        useDatabase: this.props.useDatabase,
        appName: this.options.name
      }
    );
    this.fs.copyTpl(
      this.templatePath('config/environment.rb'),
      this.destinationPath('config/environment.rb'),
      {
        useDatabase: this.props.useDatabase,
        useSidekiq: this.props.useSidekiq
      }
    );
    this.fs.copyTpl(this.templatePath('Gemfile'), this.destinationPath('Gemfile'), {
      useDatabase: this.props.useDatabase,
      useSidekiq: this.props.useSidekiq,
      rubyVersion: this.props.rubyVersion
    });
    this.fs.copyTpl(this.templatePath('Procfile'), this.destinationPath('Procfile'), {
      useSidekiq: this.props.useSidekiq
    });
    this.fs.copyTpl(this.templatePath('Rakefile'), this.destinationPath('Rakefile'), {
      useDatabase: this.props.useDatabase
    });
    this.fs.copyTpl(
      this.templatePath('spec/spec_helper.rb'),
      this.destinationPath('spec/spec_helper.rb'),
      {
        useDatabase: this.props.useDatabase,
        appName: this.options.name
      }
    );

    this.fs.write(this.destinationPath('.ruby-version'), this.props.rubyVersion);

    const emptyFiles = ['lib/.keep', 'spec/controllers/.keep'];
    if (this.props.useDatabase) {
      emptyFiles.push('app/models/.keep');
      emptyFiles.push('db/migrations/.keep');
      emptyFiles.push('spec/models/.keep');
    }
    if (this.props.useSidekiq) {
      emptyFiles.push('app/workers/.keep');
      emptyFiles.push('spec/workers/.keep');
    }
    emptyFiles.forEach(file => {
      this.fs.write(file, '');
    });

    this.spawnCommand('git', ['init', '-q']);
  }

  install() {
    this.spawnCommand('bundle', ['install']);
  }
};
