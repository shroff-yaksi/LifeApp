const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Android 12+ (API 31+). Empty cloud-backup/device-transfer = back up ALL eligible
// app data — including the AsyncStorage `RKStorage` DB that holds the whole life-log —
// and restore it on reinstall / new-device transfer. No exclusions: we want everything.
const DATA_EXTRACTION_RULES = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup />
    <device-transfer />
</data-extraction-rules>
`;

// API <31 fallback. Empty = back up all eligible app data (incl. AsyncStorage).
const FULL_BACKUP_CONTENT = `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content />
`;

function withBackupRuleFiles(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const xmlDir = path.join(cfg.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, 'lifeos_data_extraction_rules.xml'), DATA_EXTRACTION_RULES);
      fs.writeFileSync(path.join(xmlDir, 'lifeos_backup_rules.xml'), FULL_BACKUP_CONTENT);
      return cfg;
    },
  ]);
}

function withBackupManifestAttributes(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    // allowBackup is owned by app.json (expo.android.allowBackup); here we only point
    // the two rule attributes at the XML files written above.
    app.$['android:dataExtractionRules'] = '@xml/lifeos_data_extraction_rules';
    app.$['android:fullBackupContent'] = '@xml/lifeos_backup_rules';
    return cfg;
  });
}

// Enables Android Auto Backup for the life-log so a reinstall / new device restores
// AsyncStorage automatically — the free, zero-UI analog of iOS iCloud backup.
module.exports = function withAndroidAutoBackup(config) {
  config = withBackupManifestAttributes(config);
  config = withBackupRuleFiles(config);
  return config;
};
