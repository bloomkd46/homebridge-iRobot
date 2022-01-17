<p align="center">
 <a href="https://github.com/bloomkd46/homebridge-iRobot"><img alt="Homebridge iRobot" src="https://user-images.githubusercontent.com/75853497/143301930-e2f3bc9a-9f0d-4e03-95f8-c69769712ca5.png" width="600px"></a>
</p>
<span align="center">

# homebridge-iRobot

Homebridge plugin to integrate iRobot roombas into HomeKit
 
(Wiki Links Don't Work Yet)
 
 [![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![npm](https://img.shields.io/npm/dt/homebridge-irobot)](https://npmcharts.com/compare/homebridge-irobot?minimal=true)

[![npm](https://img.shields.io/npm/v/homebridge-irobot/latest?label=latest)](https://www.npmjs.com/package/homebridge-irobot)
[![npm](https://img.shields.io/npm/v/homebridge-irobot/beta?label=beta)](../../wiki/Beta-Version)  
 
[![build workflow](https://github.com/bloomkd46/homebridge-iRobot/actions/workflows/build.yml/badge.svg)](../../actions/workflows/build.yml)
[![license](https://badgen.net/github/license/bloomkd46/homebridge-irobot)](https://github.com/bloomkd46/homebridge-irobot/blob/master/LICENSE.md)


</span>

### Plugin Information

- This plugin allows you to view and control your iRobot roombas within HomeKit. The plugin:
  - downloads a device list if your iRobot credentials are supplied
  - controls your devices locally
  - listens for real-time device updates when controlled externally

## Supported Devices
> Don't See Your Device Below?
> Let Me Know If It Worked By Filling Out [This Template](https://github.com/bloomkd46/homebridge-iRobot/issues/new?assignees=bloomkd46&labels=enchancment&template=add-supported-device.yml&title=Supported+Device%3A+)

| Model | Supported |
|-|-|
| test | No | @bloomkd46 |
| 980 | Yes |
| 965 | Yes |
| i8 | Yes |
| i7 | Yes |
| j7 | No |


## Features:
  * On/Off Control
  * Room-By-Room Control On Models That Support It (Only Tested When Using One Map)
  * Auto-Dicovery Of All Devices On Your Acount
  * Battery Percent/Charging ifo
  * Binfull Detection In The Form Of Filter/Contact/Motion Sensor
  * Stuck Sensor
  
## TODO: 
  * Get Approved By Homebridge
  * Add Custom UI For Viewing Devices

### Prerequisites

- To use this plugin, you will need to already have [Homebridge](https://homebridge.io) (at least v1.3.5) or [HOOBS](https://hoobs.org) (at least v4) installed. Refer to the links for more information and installation instructions.


### Setup

- [Installation](../../wiki/Installation)
- [Configuration](../../wiki/Configuration)
- [Beta Version](../../wiki/Beta-Version)
- [Node Version](../../wiki/Node-Version)
- [Uninstallation](../../wiki/Uninstallation)

### Help/About

- [Common Errors](../../wiki/Common-Errors)
- [Support Request](../../issues/new/choose)
- [Changelog](/CHANGELOG.md)

### Credits

- To the creators/contributors of [Homebridge](https://homebridge.io) who make this plugin possible.
- To [homebridge-Meross](https://github.com/bwp91/homebridge-meross) of which I based this readme, wiki, and homebridge-ui off of
- To [Dorita980](https://github.com/koalazak/dorita980) Who cracked the iRobot API

### Disclaimer

- I am in no way affiliated with iRobot and this plugin is a personal project that I maintain in my free time.
- Use this plugin entirely at your own risk - please see licence for more information.
