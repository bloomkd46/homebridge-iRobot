<p align="center">
 <a href="https://github.com/bloomkd46/homebridge-iRobot"><img alt="Homebridge iRobot" src="https://user-images.githubusercontent.com/75853497/143301930-e2f3bc9a-9f0d-4e03-95f8-c69769712ca5.png" width="600px"></a>
</p>
<span align="center">

# homebridge-iRobot

Homebridge plugin to integrate iRobot roombas into HomeKit
  
 [![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![downloads](https://img.shields.io/npm/dt/homebridge-irobot)](https://npmcharts.com/compare/homebridge-irobot?log=true&interval=1&minimal=true)

[![npm](https://img.shields.io/npm/v/homebridge-irobot/latest?label=latest)](https://www.npmjs.com/package/homebridge-irobot)
[![npm](https://img.shields.io/npm/v/homebridge-irobot/beta?label=beta)](https://github.com/bloomkd46/homebridge-iRobot/wiki/Beta-Version)  
 
[![build workflow](https://github.com/bloomkd46/homebridge-iRobot/actions/workflows/build.yml/badge.svg)](https://github.com/bloomkd46/homebridge-iRobot/actions/workflows/build.yml)
[![license](https://badgen.net/github/license/bloomkd46/homebridge-irobot)](/LICENSE)


</span>

### Plugin Information

- This plugin allows you to view and control your iRobot roombas within HomeKit. The plugin:
  - downloads a device list if your iRobot credentials are supplied
  - controls your devices locally
  - listens for real-time device updates when controlled externally

## Supported Devices
> Don't See Your Device Below?
> Let Me Know If It Worked By Filling Out [This Template](https://github.com/bloomkd46/homebridge-iRobot/issues/new?assignees=bloomkd46&labels=enchancment&template=add-supported-device.yml&title=Supported+Device%3A+)

| Model | Supported | Reported By |
|-|-|-|
| i3 | Yes | [nilsstreedain](https://github.com/nilsstreedain) |
| e6 | Yes | [Dav97480](https://github.com/Dav97480) |
| e5 | Yes | [mylover21](https://github.com/mylover21) |
| 690 | No | [Theplaze](https://github.com/Theplaze) |
| Coombo | No | [morasounds](https://github.com/morasounds) |
| Combo J9+ | Yes | [AcrtlBot](https://github.com/AcrtlBot) |
| J5+ | Yes | [camsky209](https://github.com/camsky209) |
| Braava m6 | No | [camsky209](https://github.com/camsky209) |
| 971 | No | [iamgottem](https://github.com/iamgottem) |
| 691 | No | [Firemanjoe](https://github.com/Firemanjoe) |
| j9+ | Yes | [LakshmyPulickalRajukumar](https://github.com/LakshmyPulickalRajukumar) |
| j9+ | No | [LakshmyPulickalRajukumar](https://github.com/LakshmyPulickalRajukumar) |
| j7 | No | [Belg0](https://github.com/Belg0) |
| i7 | Yes | [sreenath87](https://github.com/sreenath87) |
| 676 | No | [mrath1201](https://github.com/mrath1201) |
| J7 | Yes | [Libar19](https://github.com/Libar19) |
| i6 plus | Yes | [AlSmyth81](https://github.com/AlSmyth81) |
| 980 | No | [ivansemenovv](https://github.com/ivansemenovv) |
| I5+ | Yes | [Ju17091](https://github.com/Ju17091) |
| i5 | Yes | [YiffyC](https://github.com/YiffyC) |
| J7+ | No | [danielepenguin](https://github.com/danielepenguin) |
| Braava jet m6 (6012) | No | [Vaxter](https://github.com/Vaxter) |
| J7 | No | [Viper0580](https://github.com/Viper0580) |
| 989 | No | [czarnyolek](https://github.com/czarnyolek) |
| j8 plus | Yes | [pgorrindo](https://github.com/pgorrindo) |
| 971 | No | [luigicrafter](https://github.com/luigicrafter) |
| 692 | Yes | [Quesabyte](https://github.com/Quesabyte) |
| 900 | No | [meteora1986](https://github.com/meteora1986) |
| 900 | No | [markuzkuz](https://github.com/markuzkuz) |
| i7 Plus | Yes | [tohmc](https://github.com/tohmc) |
| S9 | No | [johnsills1](https://github.com/johnsills1) |
| s9 | Yes | [douginoz](https://github.com/douginoz) |
| i6 | Yes | [webcleef](https://github.com/webcleef) |
| 697 | No | [Funskes](https://github.com/Funskes) |
| 900 | Yes | [WuTangKillaBee](https://github.com/WuTangKillaBee) |
| i6 | No | [webcleef](https://github.com/webcleef) |
| j7 plus | No | [danzika](https://github.com/danzika) |
| 675 | Yes | [djmurray20](https://github.com/djmurray20) |
| 675 | Yes | [janpreet](https://github.com/janpreet) |
| i7 Plus | No | [MEGALITH2022](https://github.com/MEGALITH2022) |
| 527 | Yes | [TonyYuta](https://github.com/TonyYuta) |
| e5 | No | [metalshark](https://github.com/metalshark) |
| i4 | Yes | [BrauCadena](https://github.com/BrauCadena) |
| i4+ | Yes | [SergioBraulioCadenaJuarez](https://github.com/SergioBraulioCadenaJuarez) |
| m6 | No | [zaki-hanafiah](https://github.com/zaki-hanafiah) |
| i3 | Yes | [zaki-hanafiah](https://github.com/zaki-hanafiah) |
| 980 | Yes | [adamengineering](https://github.com/adamengineering) |
| i7 | Yes | [marchein](https://github.com/marchein) |
| s9 | No | [Maximilian2022](https://github.com/Maximilian2022) |
| combo | No | [ExoBiTe](https://github.com/ExoBiTe) |
| 966 | Yes | [Jansne](https://github.com/Jansne) |
| 675 | No | [EddieDSuza](https://github.com/EddieDSuza) |
| Braava jet m6 | No | [JiningLiu](https://github.com/JiningLiu) |
| j7 | Yes | [JiningLiu](https://github.com/JiningLiu) |
| 966 | No | [fheise](https://github.com/fheise) |
| 891 | Yes | [lambert0725](https://github.com/lambert0725) |
| j7 | Yes | [wja731](https://github.com/wja731) |
| 694 | No | [aclerok](https://github.com/aclerok) |
| m6 | No | [waltermarbel](https://github.com/waltermarbel) |
| 976 | Yes | [benov84](https://github.com/benov84) |
| 976 | No | [mbnn](https://github.com/mbnn) |
| 690 | No | [tiger-git-hub](https://github.com/tiger-git-hub) |
| i4 (4150) | Yes | [the1maximus](https://github.com/the1maximus) |
| 890 | No | [GitPuffy](https://github.com/GitPuffy) |
| i7 | Yes | [rtdevnet](https://github.com/rtdevnet) |
| i7 | No | [rtdevnet](https://github.com/rtdevnet) |
| S9 | No | [kip1539](https://github.com/kip1539) |
| 671 | Yes | [Geek-MD](https://github.com/Geek-MD) |
| 980 | Yes | [Drewbacca2](https://github.com/Drewbacca2) |
| e5 | No | [TomF79](https://github.com/TomF79) |
| e5 | Yes | [TomF79](https://github.com/TomF79) |
| 675 | No | [Mkrtichmikem](https://github.com/Mkrtichmikem) |
| j7 | Yes | [jonad2002](https://github.com/jonad2002) |
| i7 | Yes | [Clouder59](https://github.com/Clouder59) |
| 606 | No | [PvdGulik](https://github.com/PvdGulik) |
| m6 | Yes | [ginoledesma](https://github.com/ginoledesma) |
| i3 | No | [rminear68](https://github.com/rminear68) |
| 980 | No | [jeanchrijaz](https://github.com/jeanchrijaz) |
| i9 | Yes | [douginoz](https://github.com/douginoz) |
| 960 | Yes | [NateUT99](https://github.com/NateUT99) |
| 965 | Yes | [bloomkd46](https://github.com/bloomkd46) |
| i8 | Yes | [bloomkd46](https://github.com/bloomkd46) |


## Features:
  - [x] Approved By Homebridge
  - [x] Custom UI For Viewing Devices
  - [x] On/Off Control
  - [x] Room-By-Room Control On Models That Support It (Only Tested When Using One Map)
  - [x] Auto-Dicovery Of All Devices On Your Acount
  - [x] Battery Percent/Charging ifo
  - [x] Binfull Detection In The Form Of Filter/Contact/Motion Sensor
  - [x] Stuck Sensor

### Prerequisites

- To use this plugin, you will need to already have [Homebridge](https://homebridge.io) (at least v1.3.5) or [HOOBS](https://hoobs.org) (at least v4) installed. Refer to the links for more information and installation instructions.


### Setup

- [Installation](https://github.com/bloomkd46/homebridge-iRobot/wiki/Installation)
- [Configuration](https://github.com/bloomkd46/homebridge-iRobot/wiki/Configuration)
- [Beta Version](https://github.com/bloomkd46/homebridge-iRobot/wiki/Beta-Version)
- [Node Version](https://github.com/bloomkd46/homebridge-iRobot/wiki/Node-Version)
- [Uninstallation](https://github.com/bloomkd46/homebridge-iRobot/wiki/Uninstallation)
- [Room By Room](https://github.com/bloomkd46/homebridge-iRobot/wiki/Room-By-Room)

### Help/About

- [Common Errors](https://github.com/bloomkd46/homebridge-iRobot/wiki/Common-Errors)
- [Support Request](https://github.com/bloomkd46/homebridge-iRobot/issues/new/choose)
- [Changelog](/CHANGELOG.md)

### Credits

- To the creators/contributors of [Homebridge](https://homebridge.io) who make this plugin possible.
- To [homebridge-Meross](https://github.com/bwp91/homebridge-meross) of which I based this readme, wiki, and homebridge-ui off of
- To [Dorita980](https://github.com/koalazak/dorita980) Who cracked the iRobot API

### Disclaimer

- I am in no way affiliated with iRobot and this plugin is a personal project that I maintain in my free time.
- Use this plugin entirely at your own risk - please see licence for more information.
