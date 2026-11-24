import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { computeContentFingerprint } from './contentVersion.mjs';
import { verifyJointRelease } from './verify-joint-release.mjs';
import { buildAudioPack } from '../mobile/build-audio-pack.mjs';

function parseArgs(argv) {
  const opts = {
    audioMode: 'bundled', // 'bundled' | 'external'
    withAudioPack: false,
    simulateApkFailure: false,
    skipWebBuild: false,
  };
  for (const arg of argv) {
    if (arg === '--audio-mode=external') opts.audioMode = 'external';
    else if (arg === '--audio-mode=bundled') opts.audioMode = 'bundled';
    else if (arg === '--with-audio-pack') opts.withAudioPack = true;
    else if (arg === '--simulate-apk-failure') opts.simulateApkFailure = true;
    else if (arg === '--skip-web-build') opts.skipWebBuild = true;
  }
  return opts;
}

function run(cmd, args, { cwd, env }) {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const res = spawnSync(cmd, args, { cwd, env, stdio: 'inherit' });
  if (res.status !== 0) {
    throw new Error(`Command failed (${res.status}): ${cmd} ${args.join(' ')}`);
  }
}

function resolveAndroidEnv(baseEnv) {
  const home = os.homedir();
  const javaHome = baseEnv.JAVA_HOME || path.join(home, '.local/android-toolchain/jdk-17');
  const androidHome = baseEnv.ANDROID_HOME || baseEnv.ANDROID_SDK_ROOT || path.join(home, 'Android/Sdk');
  const extraPath = [
    path.join(javaHome, 'bin'),
    path.join(androidHome, 'platform-tools'),
    path.join(androidHome, 'build-tools/35.0.0'),
    path.join(androidHome, 'build-tools/34.0.0'),
  ]
    .filter((p) => fs.existsSync(p))
    .join(path.delimiter);

  return {
    ...baseEnv,
    JAVA_HOME: javaHome,
    ANDROID_HOME: androidHome,
    ANDROID_SDK_ROOT: androidHome,
    PATH: extraPath ? `${extraPath}${path.delimiter}${baseEnv.PATH || ''}` : baseEnv.PATH,
  };
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(filePath, 'r');
  const buf = Buffer.allocUnsafe(1024 * 1024);
  try {
    let bytesRead = 0;
    while ((bytesRead = fs.readSync(fd, buf, 0, buf.length, null)) > 0) {
      hash.update(buf.subarray(0, bytesRead));
    }
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest('hex');
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const rootDir = process.cwd();
  const releasesDir = path.join(rootDir, 'releases');
  const versionStatePath = path.join(releasesDir, 'version-state.json');
  fs.mkdirSync(releasesDir, { recursive: true });

  const prevState = fs.existsSync(versionStatePath)
    ? JSON.parse(fs.readFileSync(versionStatePath, 'utf8'))
    : { lastVersionCode: 0, currentRelease: null };

  const fingerprint = computeContentFingerprint(rootDir);
  const nextVersionCode = (prevState.lastVersionCode || 0) + 1;
  const contentVersion = fingerprint.version;
  const versionName = `${contentVersion}-v${nextVersionCode}`;
  const stagingDir = path.join(releasesDir, `.staging-${versionName}`);
  const finalReleaseDir = path.join(releasesDir, versionName);

  const env = resolveAndroidEnv({
    ...process.env,
    TRILHA_CONTENT_VERSION: contentVersion,
    TRILHA_VERSION_CODE: String(nextVersionCode),
    TRILHA_VERSION_NAME: versionName,
    TRILHA_AUDIO_MODE: opts.audioMode,
  });

  console.log(`=== Joint Release: ${versionName} (versionCode=${nextVersionCode}, audioMode=${opts.audioMode}) ===`);
  fs.rmSync(stagingDir, { recursive: true, force: true });
  fs.mkdirSync(stagingDir, { recursive: true });

  try {
    // 1. Typecheck once
    run('npm', ['run', 'check'], { cwd: rootDir, env });

    // 2. Build Web (dist/)
    if (!opts.skipWebBuild) {
      run('npx', ['vite', 'build'], { cwd: rootDir, env: { ...env, VITE_APP_TARGET: 'web' } });
    }

    // 3. Build Android Offline Web Bundle (dist-android/)
    run('npx', ['vite', 'build'], { cwd: rootDir, env: { ...env, VITE_APP_TARGET: 'android' } });

    if (opts.audioMode === 'external') {
      fs.rmSync(path.join(rootDir, 'dist-android/narration'), { recursive: true, force: true });
    }

    // 4. Verify Web + Android parity and offline security BEFORE compiling APK
    const parity = verifyJointRelease({
      webDir: path.join(rootDir, 'dist'),
      androidWebDir: path.join(rootDir, 'dist-android'),
      expectedContentVersion: contentVersion,
      audioMode: opts.audioMode,
    });
    if (!parity.ok) {
      throw new Error(`Parity/security verification failed:\n- ${parity.errors.join('\n- ')}`);
    }
    console.log('Parity & offline security verified:', JSON.stringify(parity.summary));

    // 5. Optional external audio pack (.zip)
    let audioPackInfo = null;
    if (opts.audioMode === 'external' || opts.withAudioPack) {
      audioPackInfo = buildAudioPack({
        rootDir,
        outPath: path.join(stagingDir, `trilha-audio-pack-${contentVersion}.zip`),
        contentVersion,
      });
    }

    // 6. Sync Capacitor Android assets & compile signed release APK
    if (opts.simulateApkFailure) {
      throw new Error('Simulated APK build failure (--simulate-apk-failure). Previous release preserved.');
    }

    // Ensure local.properties points to ANDROID_HOME
    fs.writeFileSync(
      path.join(rootDir, 'android/local.properties'),
      `sdk.dir=${env.ANDROID_HOME}\n`,
      'utf8',
    );

    run('npx', ['cap', 'sync', 'android'], { cwd: rootDir, env });
    run(
      './gradlew',
      [
        'assembleRelease',
        `-PtrilhaVersionCode=${nextVersionCode}`,
        `-PtrilhaVersionName=${versionName}`,
      ],
      { cwd: path.join(rootDir, 'android'), env },
    );

    const builtApk = path.join(rootDir, 'android/app/build/outputs/apk/release/app-release.apk');
    if (!fs.existsSync(builtApk)) {
      throw new Error(`Expected signed release APK not found at ${builtApk}`);
    }

    // 7. Verify APK signature and dump permissions
    const apksigner = path.join(env.ANDROID_HOME, 'build-tools/35.0.0/apksigner');
    const aapt2 = path.join(env.ANDROID_HOME, 'build-tools/35.0.0/aapt2');
    const sigVerifyOut = execFileSync(apksigner, ['verify', '--verbose', '--print-certs', builtApk], {
      env,
      encoding: 'utf8',
    });
    const permsOut = execFileSync(aapt2, ['dump', 'permissions', builtApk], {
      env,
      encoding: 'utf8',
    });

    const stagedApk = path.join(stagingDir, `trilha-mod-${versionName}.apk`);
    fs.copyFileSync(builtApk, stagedApk);

    const apkStat = fs.statSync(stagedApk);
    const apkSha256 = sha256File(stagedApk);

    const manifest = {
      appId: 'br.dev.trilhamod.offline',
      contentVersion,
      versionCode: nextVersionCode,
      versionName,
      audioMode: opts.audioMode,
      builtAt: new Date().toISOString(),
      webDir: 'dist',
      apk: {
        filename: path.basename(stagedApk),
        bytes: apkStat.size,
        megabytes: Number((apkStat.size / (1024 * 1024)).toFixed(2)),
        sha256: apkSha256,
        permissions: permsOut.trim().split('\n'),
        signatureVerified: sigVerifyOut.includes('Verifies'),
      },
      audioPack: audioPackInfo,
      parity: parity.summary,
    };

    fs.writeFileSync(
      path.join(stagingDir, 'release-manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf8',
    );

    // 8. Atomic promotion: only update releases/current and version-state AFTER everything passed
    fs.rmSync(finalReleaseDir, { recursive: true, force: true });
    fs.renameSync(stagingDir, finalReleaseDir);

    const currentLink = path.join(releasesDir, 'current');
    fs.rmSync(currentLink, { recursive: true, force: true });
    fs.symlinkSync(versionName, currentLink, 'dir');

    fs.writeFileSync(
      versionStatePath,
      JSON.stringify(
        {
          lastVersionCode: nextVersionCode,
          currentRelease: versionName,
          updatedAt: manifest.builtAt,
        },
        null,
        2,
      ),
      'utf8',
    );

    console.log('\n=== JOINT RELEASE PUBLISHED LOCALLY ===');
    console.log(JSON.stringify(manifest, null, 2));
  } catch (err) {
    fs.rmSync(stagingDir, { recursive: true, force: true });
    console.error('\n=== JOINT RELEASE ABORTED (previous release untouched) ===');
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
