/**
 * @param {github.Client} githubAPI
 * @param {String[]} repoList
 */
module.exports = function(githubAPI, repoList) {
  //TODO how to show that this worked for tests?
  // - how CronJob can be notified of Error here? Check
  // - generate some dummy file?
  // - somehow use a callback to CronJob?
  console.log('githubAPI', githubAPI);
  console.log('repoList', repoList);
};