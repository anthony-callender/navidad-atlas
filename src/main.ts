import Phaser from 'phaser';
import { PhaserConfig } from './game/GameConfig';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { CabinScene } from './scenes/CabinScene';
import { OverworldScene } from './scenes/OverworldScene';
import { NorthForestScene } from './scenes/NorthForestScene';
import { SouthForestScene } from './scenes/SouthForestScene';
import { EastForestScene } from './scenes/EastForestScene';
import { WestForestScene } from './scenes/WestForestScene';
import { LibraryScene } from './scenes/LibraryScene';
import { TunnelScene } from './scenes/TunnelScene';
import { TunnelRunScene } from './scenes/TunnelRunScene';
import { GymScene } from './scenes/GymScene';
import { AnimalRescueScene } from './scenes/AnimalRescueScene';
import { PlatformTrialScene } from './scenes/PlatformTrialScene';
import { PlatformBonusScene } from './scenes/PlatformBonusScene';
import { BearChaseScene } from './scenes/BearChaseScene';
import { RescueTonyRunScene } from './scenes/RescueTonyRunScene';
import { TonyCageScene } from './scenes/TonyCageScene';
import { BearBossScene } from './scenes/BearBossScene';
import { FinalCaptureScene } from './scenes/FinalCaptureScene';
import { RescueJuneRunScene } from './scenes/RescueJuneRunScene';
import { FinalInsideScene } from './scenes/FinalInsideScene';
import { FinalBossScene } from './scenes/FinalBossScene';
import { ShadowHealingScene } from './scenes/ShadowHealingScene';
import { VillageCelebrationScene } from './scenes/VillageCelebrationScene';
import { BossArenaScene } from './scenes/BossArenaScene';
import { UIScene } from './scenes/UIScene';

const config: Phaser.Types.Core.GameConfig = {
  ...PhaserConfig,
  scene: [
    BootScene, 
    TitleScene, 
    CabinScene, 
    OverworldScene, 
    NorthForestScene,
    SouthForestScene,
    EastForestScene,
    WestForestScene,
    LibraryScene,
    TunnelScene,
    TunnelRunScene,
    PlatformTrialScene,
    PlatformBonusScene,
    BearChaseScene,
    RescueTonyRunScene,
    TonyCageScene,
    BearBossScene,
    FinalCaptureScene,
    RescueJuneRunScene,
    FinalInsideScene,
    FinalBossScene,
    ShadowHealingScene,
    VillageCelebrationScene,
    GymScene,
    AnimalRescueScene,
    BossArenaScene, 
    UIScene
  ]
};

new Phaser.Game(config);

