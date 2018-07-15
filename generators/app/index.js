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
      '.travis.yml',
      'app.rb',
      'config.ru',
      'config/environment.rb',
      'Gemfile',
      'Rakefile',
      'spec/spec_helper.rb'
    ];
    files.forEach(file => {
      this.fs.copy(this.templatePath(file), this.destinationPath(file));
    });

    this.fs.copyTpl(this.templatePath('app.yaml'), this.destinationPath('app.yaml'), {
      bucketName: this.options.name
    });

    this.fs.write(this.destinationPath('.ruby-version'), this.props.rubyVersion);

    const emptyFiles = ['app/controllers/.keep', 'spec/controllers/.keep'];
    emptyFiles.forEach(file => {
      this.fs.write(file, '');
    });
  }

  install() {
    this.spawnCommand('bundle', ['install']);
  }
};
