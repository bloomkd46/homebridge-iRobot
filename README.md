<p align="center">
 <a href="https://github.com/bloomkd46/homebridge-iRobot"><img alt="Homebridge iRobot" src="https://user-images.githubusercontent.com/75853497/143301930-e2f3bc9a-9f0d-4e03-95f8-c69769712ca5.png" width="600px"></a>
</p>
<span align="center">

# homebridge-iRobot

Homebridge plugin to integrate iRobot roombas into HomeKit
 
 [![build workflow](https://github.com/bloomkd46/homebridge-iRobot/actions/workflows/build.yml/badge.svg)](../../actions/workflows/build.yml)
 [![lint workflow](https://github.com/bloomkd46/homebridge-iRobot/actions/workflows/lint.yml/badge.svg)](../../actions/workflows/lint.yml)

[![npm](https://img.shields.io/npm/v/homebridge-irobot/latest?label=latest)](https://www.npmjs.com/package/homebridge-irobot)
[![npm](https://img.shields.io/npm/v/homebridge-irobot/beta?label=beta)](https://github.com/bwp91/homebridge-irobot/wiki/Beta-Version)  
[![npm](https://img.shields.io/npm/dt/homebridge-irobot)](https://www.npmjs.com/package/homebridge-irobot)


</span>

### Plugin Information

- This plugin allows you to view and control your iRobot roombas within HomeKit. The plugin:
  - downloads a device list if your iRobot credentials are supplied
  - attempts to control your devices locally, reverting to cloud control if necessary
  - listens for real-time device updates when controlled externally
  - can ignore any roombas you have using the configuration

### Prerequisites

- To use this plugin, you will need to already have [Homebridge](https://homebridge.io) (at least v1.3.5) or [HOOBS](https://hoobs.org) (at least v4) installed. Refer to the links for more information and installation instructions.
- Whilst it is recommended to use [Node](https://nodejs.org/en/) v16, the plugin supports v12 and v14 as per the [Homebridge guidelines](https://github.com/homebridge/homebridge/wiki/How-To-Update-Node.js).

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
