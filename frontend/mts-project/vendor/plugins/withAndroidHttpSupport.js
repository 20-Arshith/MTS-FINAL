const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const NETWORK_SECURITY_CONFIG = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true" />
</network-security-config>
`;

const SETTINGS_MAVEN_MIRROR_URL = 'https://maven-central.storage-download.googleapis.com/maven2/';
const ASYNC_STORAGE_REPO_MARKER =
  '@react-native-async-storage/async-storage/android/local_repo';

const ensureGradleMirror = (content) => {
  if (!content || content.includes(SETTINGS_MAVEN_MIRROR_URL)) {
    return content;
  }

  return content.replace(
    'pluginManagement {\n',
    `pluginManagement {\n  repositories {\n    maven { url "${SETTINGS_MAVEN_MIRROR_URL}" }\n    google()\n    mavenCentral()\n    gradlePluginPortal()\n  }\n`
  );
};

const ensureAsyncStorageRepo = (content) => {
  if (!content || content.includes(ASYNC_STORAGE_REPO_MARKER)) {
    return content;
  }

  return content.replace(
    'allprojects {\n  repositories {\n',
    `allprojects {\n  repositories {\n    def asyncStorageRepoCandidates = [\n      new File(rootDir, "../node_modules/@react-native-async-storage/async-storage/android/local_repo"),\n      new File(rootDir, "../../node_modules/@react-native-async-storage/async-storage/android/local_repo"),\n      new File(rootDir, "../../../node_modules/@react-native-async-storage/async-storage/android/local_repo"),\n      new File(rootDir, "../../../../node_modules/@react-native-async-storage/async-storage/android/local_repo")\n    ]\n    asyncStorageRepoCandidates.findAll { it.exists() }.each { repoDir ->\n      maven { url repoDir.toURI() }\n    }\n`
  );
};

module.exports = function withAndroidHttpSupport(config) {
  config = withAndroidManifest(config, (modConfig) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(modConfig.modResults);

    application.$['android:usesCleartextTraffic'] = 'true';
    application.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    return modConfig;
  });

  config = withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const xmlDir = path.join(modConfig.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');

      await fs.promises.mkdir(xmlDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(xmlDir, 'network_security_config.xml'),
        NETWORK_SECURITY_CONFIG,
        'utf8'
      );

      const settingsGradlePath = path.join(modConfig.modRequest.platformProjectRoot, 'settings.gradle');
      const settingsGradle = await fs.promises.readFile(settingsGradlePath, 'utf8');
      const buildGradlePath = path.join(modConfig.modRequest.platformProjectRoot, 'build.gradle');
      const buildGradle = await fs.promises.readFile(buildGradlePath, 'utf8');

      await fs.promises.writeFile(settingsGradlePath, ensureGradleMirror(settingsGradle), 'utf8');
      await fs.promises.writeFile(buildGradlePath, ensureAsyncStorageRepo(buildGradle), 'utf8');

      return modConfig;
    },
  ]);

  return config;
};
