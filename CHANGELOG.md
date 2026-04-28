# Changelog

This changelog tracks application releases managed by Release Please.

## [0.2.1](https://github.com/Dreyzab/grenzwanderer/compare/app-v0.2.0...app-v0.2.1) (2026-04-28)


### Features

* add psychogeography module and freiburg location cast data ([15968e8](https://github.com/Dreyzab/grenzwanderer/commit/15968e85c16c335e079edeb837f1071185e79b58))
* add sandbox agency briefing scenario and update project dependencies ([7f6f6f4](https://github.com/Dreyzab/grenzwanderer/commit/7f6f6f4d24987bb3e00d8b95aba4c4787d9e8421))
* **ci:** add narrative content sync to production deployment ([4bef1e8](https://github.com/Dreyzab/grenzwanderer/commit/4bef1e894c7784931d1fbcfb55f0a29455a5d8e3))
* **content:** update narrative snapshots and assets for Case 01 ([f15a538](https://github.com/Dreyzab/grenzwanderer/commit/f15a538a5641240c4c511a34e7b0ae02caabf1b1))
* **gameplay:** expand runtime systems and release workflow ([b9fcd43](https://github.com/Dreyzab/grenzwanderer/commit/b9fcd4328c637d969821b45817b349cf5f909d56))
* **i18n:** implemented lazy-loaded narrative localization and localized immersive UI ([0bef789](https://github.com/Dreyzab/grenzwanderer/commit/0bef789f7edbba24a8641292e5ed7428d67b28da))
* Obsidian hub scene, Clara sheet; transcript stack and Pretext helpers ([cb25481](https://github.com/Dreyzab/grenzwanderer/commit/cb25481776303b8bf84f94727b815b72e1e3ded9))
* spacetime bindings refactor, mindpalace, voice registry, smoke tests ([e192c28](https://github.com/Dreyzab/grenzwanderer/commit/e192c28fb392faa75efe9f92a978da62f4cf419f))
* **ui:** location cast presentation and admin views ([bfa3195](https://github.com/Dreyzab/grenzwanderer/commit/bfa3195f9dca75815c6e393f696d96e2adce2340))
* unify faction contract across UI, reducers, snapshot, and lore (v7) ([4953fce](https://github.com/Dreyzab/grenzwanderer/commit/4953fce3e2930fc9f6e6ec7ebaf48c5a632e04fc))
* **vn:** implement narrative localization and remove telemetry blockers ([e3f4aff](https://github.com/Dreyzab/grenzwanderer/commit/e3f4aff592ea016497587129d92131612b0fae5f))
* **vn:** journalist origin awakening and passive check banner implementation ([fb2a111](https://github.com/Dreyzab/grenzwanderer/commit/fb2a111142e06c98bacdc1208fef946456fb76bd))


### Fixes

* add missing voiceCanonicalization module ([8b875ea](https://github.com/Dreyzab/grenzwanderer/commit/8b875ea047227f1a7d107171687559c4ee358481))
* **ci:** add -y flag to spacetime:publish to avoid interactive prompts on maincloud ([5591b03](https://github.com/Dreyzab/grenzwanderer/commit/5591b0301994ac20118defddbdd47d3c7208b09c))
* **ci:** combine backend and frontend into single job for robust secret access ([a172523](https://github.com/Dreyzab/grenzwanderer/commit/a172523b8ea4158e4982be51a44c00fa22afe905))
* **ci:** fix docker tag format and add fallback project id ([78c08f8](https://github.com/Dreyzab/grenzwanderer/commit/78c08f8703e61c280560139441c3e328818dc59a))
* **ci:** fix env interpolation in deploy-cloudrun action ([2f3efff](https://github.com/Dreyzab/grenzwanderer/commit/2f3efff4b5f8e8caf766aee0c5e3c18c72156964))
* **ci:** fix environment variable mismatch for STDB_OPERATOR_TOKEN ([f8edbdb](https://github.com/Dreyzab/grenzwanderer/commit/f8edbdb753909a45ed5ebefceb9f3ac23561098b))
* **ci:** fix interpolation syntax for project_id in deploy actions ([b98428f](https://github.com/Dreyzab/grenzwanderer/commit/b98428ffcf2b150981c190950b05c015fac28adc))
* **ci:** fix spacetime installation across all workflows ([7509823](https://github.com/Dreyzab/grenzwanderer/commit/7509823627605a8e955b754de154f80a0c208a0a))
* **ci:** fix spacetime installation path in ci.yml ([e01c282](https://github.com/Dreyzab/grenzwanderer/commit/e01c2825eed59003ced7ea050c32748e5bd54f2b))
* **ci:** inject production spacetimedb host into release config ([1dc289a](https://github.com/Dreyzab/grenzwanderer/commit/1dc289aa52bc0e2376614fcf870ff3ee358eb059))
* **ci:** install spacetime cli and update node runtime ([b9de2ca](https://github.com/Dreyzab/grenzwanderer/commit/b9de2cae9d5958de520f4d46249050d684d0c2f8))
* **ci:** install spacetimedb cli on runner ([258e17d](https://github.com/Dreyzab/grenzwanderer/commit/258e17d25ecc03a4d9d5d1450348b4bbf6930e44))
* **ci:** remove incompatible server-issued-login flag from spacetime login ([af721d0](https://github.com/Dreyzab/grenzwanderer/commit/af721d0b5289fa6db58a9830dc0384187096eda9))
* **ci:** rename install step and force non-interactive ([c6a2448](https://github.com/Dreyzab/grenzwanderer/commit/c6a2448e45c9979483c956f1737cdfcc0276f4fe))
* **ci:** switch to manual firebase deploy via cli for robustness ([31b01c6](https://github.com/Dreyzab/grenzwanderer/commit/31b01c6c9ef3fcf6a28d6e290cf7394e3401f2ba))
* **ci:** update deploy workflow with Node 24 support and secret validation ([bb61c33](https://github.com/Dreyzab/grenzwanderer/commit/bb61c33dde7bd8210f5081933f74ab496d7fac0a))
* **ci:** use non-interactive mode for spacetime installer ([e961647](https://github.com/Dreyzab/grenzwanderer/commit/e96164745afc43381295abeabc5b59889ace9f63))
* **ci:** use non-interactive mode for spacetimedb installer ([810cb89](https://github.com/Dreyzab/grenzwanderer/commit/810cb890edf9df3c8d8cec444c0ca2bce74e8fc2))
* **ci:** use production spacetimedb host url ([a4ba238](https://github.com/Dreyzab/grenzwanderer/commit/a4ba2386b34e559d852a5651cdcc9f255d2530e6))
* **content:** parse social catalog snapshot ([0ccfd5d](https://github.com/Dreyzab/grenzwanderer/commit/0ccfd5d24da2c5ae143eb038e39a55130766ef55))
* **content:** validate social map conditions ([5100ec8](https://github.com/Dreyzab/grenzwanderer/commit/5100ec857220c491dc8e90d1f8690cf8cd3c376b))
* correctly handle GCP credentials for Firebase deployment ([1f4e380](https://github.com/Dreyzab/grenzwanderer/commit/1f4e380276d6f3374afa7c6938f68257a3e74428))
* correctly use Identity class in governance script ([17d0b51](https://github.com/Dreyzab/grenzwanderer/commit/17d0b518b9083a31658d63160e67621d3ee9b87c))
* integrate freiburg_detective into release profile config to resolve test and runtime crash ([eb645c5](https://github.com/Dreyzab/grenzwanderer/commit/eb645c5559ca31ecac893c4bc0dfaa7920666966))
* journalist wakeup routing, track selection, and hypothesis lens ([2921295](https://github.com/Dreyzab/grenzwanderer/commit/2921295eb2c52f2088d52f37bd338a33c2b872b8))
* resolve eslint warnings and interface errors for ci passing ([dc58755](https://github.com/Dreyzab/grenzwanderer/commit/dc5875521a0d4d9d3ca84211a85b5b28eee88cd3))
* **runtime:** align social catalog actions and types ([e73e869](https://github.com/Dreyzab/grenzwanderer/commit/e73e86980d43bc559ec746edd1402f45feb1175f))
* **spacetimedb:** dedupe relationship helper ([de3c191](https://github.com/Dreyzab/grenzwanderer/commit/de3c19187ea7468a0828c7834061a89483cc877c))
* **spacetimedb:** restore map action conversion ([74589bb](https://github.com/Dreyzab/grenzwanderer/commit/74589bbf34af63665d3c023f756061e560580de6))
* **ui:** surface social catalog presentation ([eb53446](https://github.com/Dreyzab/grenzwanderer/commit/eb5344666cd57a07cef9ef1dff68952036b729b3))
* update spacetime cli auth flow for modern spacetimedb clients ([2e91467](https://github.com/Dreyzab/grenzwanderer/commit/2e91467a0f62fac1d6ab937692d574f1c7e0a534))
* use official google-auth action and non-interactive flag for firebase deploy ([cc050bf](https://github.com/Dreyzab/grenzwanderer/commit/cc050bfee23388d648db04c59b90cd6a953c195b))
* **vn:** add missing prop destructuring for letterOverlayRevealDelayMs ([2692b6b](https://github.com/Dreyzab/grenzwanderer/commit/2692b6b597d201d5552789c4eeeaf91a2e33ca05))
* **vn:** optimize Freiburg narrative launch, add collapsable navbar, and improve diagnostic logging ([728c880](https://github.com/Dreyzab/grenzwanderer/commit/728c880352ab22aab373998868ba12b90d426dd6))
* **vn:** resolve test regressions and document i18n architecture ([32aee33](https://github.com/Dreyzab/grenzwanderer/commit/32aee3349f8b5dc734d9e91d61a392fbf1ec6180))


### Chores

* add diagnostics and use npx for firebase deploy ([12a5849](https://github.com/Dreyzab/grenzwanderer/commit/12a58496da85aa71cf1f17af7a5b7d12acf9e1a2))
* add identity logging to CI ([980a644](https://github.com/Dreyzab/grenzwanderer/commit/980a6441bfc6f16639e4d4798036ab164d7e39b4))
* bootstrap repository and governance baseline ([2af2734](https://github.com/Dreyzab/grenzwanderer/commit/2af2734d10ce8c0d17909b34392a9e397782497a))
* content drift script and final pilot update ([a63b66f](https://github.com/Dreyzab/grenzwanderer/commit/a63b66f7f17c7553d59d9e9fb31292c85118bc68))
* content format and map baseline parity ([b6c17df](https://github.com/Dreyzab/grenzwanderer/commit/b6c17df25cccd99e14767d4eb9ba0e1e9e83d5b9))
* **dx:** improve local development workflow with profile shortcuts ([fb6086a](https://github.com/Dreyzab/grenzwanderer/commit/fb6086a10c152e4f2679a56b1408ef68678786a2))
* ensure release config is generated before vitest run in CI ([c4be967](https://github.com/Dreyzab/grenzwanderer/commit/c4be967d3d6508942efdab4a32b815d97e5532ec))
* final deployment fixes for Karlsruhe release ([8f0a9e0](https://github.com/Dreyzab/grenzwanderer/commit/8f0a9e020621999cd0085452bd67e0992f54a3f9))
* force trigger ci rebuild ([fec2e92](https://github.com/Dreyzab/grenzwanderer/commit/fec2e925bb145f863c4d6c1b5adf1ad8613ec5d5))
* infrastructure and spacetime module bindings ([c15bc1a](https://github.com/Dreyzab/grenzwanderer/commit/c15bc1aa6fa082b3281dba7ed554bc300cc9289b))
* log identity in content-release for easier admin granting ([018d5cf](https://github.com/Dreyzab/grenzwanderer/commit/018d5cf22ff34623c2d2487c27d086ac5395ff14))
* merge production infrastructure into main ([b2cf018](https://github.com/Dreyzab/grenzwanderer/commit/b2cf018ca1d64afe7fb7b7c03afd0cfaa99e55c1))
* production deployment merge and git sanitation ([36ab8a0](https://github.com/Dreyzab/grenzwanderer/commit/36ab8a04272ac380a9bec3568d169fa48b8df39d))
* production deployment pipeline and environmental hardening ([9aa136e](https://github.com/Dreyzab/grenzwanderer/commit/9aa136e3230bd2382ff6aae382f5e5f39d925fdd))
* production deployment scripts and workflow ([a6cb9cb](https://github.com/Dreyzab/grenzwanderer/commit/a6cb9cb3d233cdefdf92248814cedcc804f0ca5f))
* production release for Karlsruhe event automation ([cea7033](https://github.com/Dreyzab/grenzwanderer/commit/cea70334e4d7ceb10043a76f00eee0ac57af4ee3))
* production sync ([0a1d7b2](https://github.com/Dreyzab/grenzwanderer/commit/0a1d7b2758d7609f3aba87489f2fe48e4257d7eb))
* **release:** record content-v0.2.3 release in manifest ([4fabfb9](https://github.com/Dreyzab/grenzwanderer/commit/4fabfb94ea944d0e53ce00108f3283e5141a603e))
* remove failing identity print step and update content snapshot ([326c29a](https://github.com/Dreyzab/grenzwanderer/commit/326c29a59d39643874c3afa49e2aeefa697309cd))
* remove sensitive .env.local and add to gitignore ([b6712fe](https://github.com/Dreyzab/grenzwanderer/commit/b6712fe0562de347b8d9d854d78c60cbd29ab011))
* remove tracked generated config from index ([1615aa0](https://github.com/Dreyzab/grenzwanderer/commit/1615aa0526d0d0bbec0fd9bf1f24544c97a9ebbc))
* update content and metrics snapshots ([3132f0a](https://github.com/Dreyzab/grenzwanderer/commit/3132f0aa12f70fd52a66ddfd8539e3564319ba35))

## 0.2.0 - 2026-03-05

- Established the governed app-release baseline for Grenzwanderer.
- Moved runtime version metadata to `package.json` and build-time injection.
- Added CI, semantic PR, preview artifact, and automated app release workflows.
