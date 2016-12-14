var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');
var GitHubApi = require('github');
var CronJob = require('cron').CronJob;

/**
 * @param {Object} options
 * @param {String} options.tasksDir
 * @param {String} options.githubToken
 * @constructor
 */
function Bot(options) {
  this._validateOptions(options);
  this._options = options;
  this._tasks = {};
  this._githubApi = new GitHubApi({
    version: '3.0.0',
    protocol: 'https',
    headers: {'user-agent': 'github-bot'}
  });
}

Bot.prototype.start = function() {
  var tasksDirs = fs.readdirSync(this._options.tasksDir);
  tasksDirs.forEach(function(taskDir) {
    if (fs.lstatSync(taskDir).isDirectory()) {
      this.readTask(taskDir);
    }
  }.bind(this));
};

Bot.prototype.readTask = function(taskDir) {
  var configPath = taskDir + '/conf.yml';
  fs.readFile(configPath, {encoding: 'utf8'}, function(err, content) {
    if (!err) {
      try {
        var taskConfig = yaml.safeLoad(content);
        if (!taskConfig.disable) {
          var taskPath = taskDir + '/task.js';
          fs.accessSync(taskPath);
          this.addTask(taskConfig, taskPath);
        }
      } catch (error) {
        console.error(error);
      }
    }
  }.bind(this));
};

/**
 * @param {Object} taskConfig
 * @param {String} taskPath
 */
Bot.prototype.addTask = function(taskConfig, taskPath) {
  var repoList = this._buildRepoList(taskConfig.where);
  var task = new CronJob({
    cronTime: taskConfig.when,
    start: true,
    onTick: function() {
      this._githubApi.authenticate({
        type: 'oauth',
        token: this._options.githubToken
      });
      task.call(null, this._githubApi, repoList);
    }.bind(this)
  });
  var taskName = path.dirname(taskPath);
  this._tasks[taskName] = task;
};

/**
 * @param {Object} configWhere
 * @returns {String[]}
 */
Bot.prototype._buildRepoList = function(configWhere) {
  var repoList = [];
  configWhere.forEach(function(whereItem) {
    whereItem.repos.forEach(function(repoItem) {
      repoList.push(whereItem.org + '/' + repoItem);
    });
  });
  return repoList;
};

/**
 * @param {Object} options
 */
Bot.prototype._validateOptions = function(options) {
  if (!options.tasksDir) {
    throw new Error('Empty tasksDir');
  }
  if (!options.githubToken) {
    throw new Error('Empty githubToken');
  }
  if (!fs.existsSync(options.tasksDir)) {
    throw new Error('Invalid tasksDir');
  }
  //TODO check somehow `githubToken` immediately.
};

module.exports = Bot;