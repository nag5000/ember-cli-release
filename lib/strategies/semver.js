/* jshint node:true */

var semver    = require('semver');
var tagPrefix = require('../utils/tag-prefix');

var initialVersion = '0.1.0';

var semverStrategy = {
  availableOptions: [
    {
      name: 'major',
      type: Boolean,
      aliases: [ 'j' ],
      default: false,
      description: "specifies that the major version number should be incremented",
      validInConfig: true
    },
    {
      name: 'minor',
      type: Boolean,
      aliases: [ 'i' ],
      default: false,
      description: "specifies that the minor version number should be incremented, ignored if '--major' option is true",
      validInConfig: true
    },
    {
      name: 'premajor ',
      type: String,
      default: '',
      description: "specifies that the major version number should be incremented with the given pre-release identifier added",
      validInConfig: true
    },
    {
      name: 'preminor',
      type: String,
      default: '',
      description: "specifies that the minor version number should be incremented with the given pre-release identifier added",
      validInConfig: true
    },
    {
      name: 'prerelease',
      type: [ String, Boolean ],
      aliases: [ 'e' ],
      default: false,
      description: "specifies that the named pre-release version number should be incremented",
      validInConfig: true
    },
  ],

  getLatestTag: function semverStrategyLatestTag(project, tags) {
    var versions = tags
      .map(function(tagName) {
        return tagPrefix.strip(tagName);
      })
      .filter(function(tagName) {
        return semver.valid(tagName);
      })
      .sort(semver.compare)
      .reverse();

    var latestVersion = versions[0];
    var hasPrefix = tags.indexOf(tagPrefix.prepend(latestVersion)) !== -1;

    // If tags use a prefix, prepend it to the tag
    return hasPrefix ? tagPrefix.prepend(latestVersion): latestVersion;
  },

  getNextTag: function semverStrategyNextTag(project, tags, options) {
    var latestVersion, nextVersion, hasPrefix, releaseType, preId;
    var latestTag = semverStrategy.getLatestTag(project, tags);

    if (tags.length && !latestTag) {
      throw "The repository has no tags that are SemVer compliant, you must specify a tag name with the --tag option.";
    }

    if (latestTag) {
      if (options.major) {
        releaseType = 'major';
      } else if (options.minor) {
        releaseType = 'minor';
      } else if (options.premajor != null) {
        releaseType = 'premajor';
        preId = options.premajor;
      } else if (options.preminor != null) {
        releaseType = 'preminor';
        preId = options.preminor;
      } else if (options.prerelease) {
        releaseType = 'prerelease';
        // Option parsing doesn't distinguish between string/boolean when no value is given
        preId = options.prerelease !== 'true' ? options.prerelease : undefined;
      } else {
        releaseType = 'patch';
      }

      latestVersion = tagPrefix.strip(latestTag);

      if (!preId && releaseType.indexOf('pre') === 0 && !isPrerelease(latestVersion)) {
        throw "A prerelese identifier must be specified when using the --" + releaseType + " option";
      }

      nextVersion = semver.inc(latestVersion, releaseType, preId);
      hasPrefix = tags.indexOf(tagPrefix.prepend(latestVersion)) !== -1;
    } else {
      nextVersion = initialVersion;
      hasPrefix = true;
    }

    // If tags use a prefix, prepend it to the tag
    return hasPrefix ? tagPrefix.prepend(nextVersion): nextVersion;
  }
};

function isPrerelease(version) {
  var parsed = semver.parse(version);
  return parsed && parsed.prerelease && parsed.prerelease.length;
}

module.exports = semverStrategy;
