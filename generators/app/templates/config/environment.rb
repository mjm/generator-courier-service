require 'pathname'

RACK_ENV = (ENV['RACK_ENV'] || 'development').to_sym
Bundler.require(:default, RACK_ENV)

$LOAD_PATH.unshift File.expand_path(File.join(__dir__, '..', 'lib'))

<% if (useDatabase) { -%>
DB = Sequel.connect(ENV['DATABASE_URL'])
Sequel::Model.plugin :json_serializer
<% } -%>

<% if (useSidekiq) { -%>
Sidekiq.configure_client do |config|
  config.redis = { size: 1 }
end
Sidekiq.configure_server do |config|
  config.redis = { size: 7 }
end
<% } -%>

def require_app(dir)
  Pathname
    .new(__dir__)
    .join('..', 'app', dir.to_s)
    .glob('*.rb')
    .each { |file| require file }
end

<% if (useDatabase) { -%>
require_app :models
<% } -%>
require_app :middlewares
require_app :helpers
<% if (useSidekiq) { -%>
require_app :workers
<% } -%>
