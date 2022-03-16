### 3.0.0 Beta 16 
* Added 3 second timeout when requesting robot state


### 3.0.0 Beta 15 
* Fixed offline status


### 3.0.0 Beta 14 
* Hopefully fixed offline status for On characteristic


### 3.0.0 Beta 13 
* Fixed offline status
* Fixed Motion and Filter Status Updates


### 3.0.0 Beta 12 
* Better logging
* Numerous upgrades and improvements 
* Expect 3.0.0 soon


### 3.0.0 Beta 11 
* Fully Stable
* Fixed version identification 

### TODO:
* Add room-by-room support


### 3.0.0 Beta 10 
* Fixed conflicting states error


### 3.0.0 Beta 9 
* Fixed error when updating switch state


### 3.0.0 Beta 8 
* Simplified state parse
* Fixed update event


### 3.0.0 Beta 7 
* Hopefully fixed undefined object error


### 3.0.0 Beta 6 
* Fixed get mission function on v3 Roomba's
* Fixed update event


### 3.0.0 Beta 5 
* Hopefully fixed configuration error


### 3.0.0 Beta 4 
* Hopefully fixed connection and disconnection process
* Fixed version identification


### 3.0.0 Beta 3 
* Fixed custom ui


### 3.0.0 Beta 2 
* Fixed crash if sensors aren't added to config


### 3.0.0 Beta 1 
Lots of bug fixes 
## TODO:
* add multi-room support
* Add keep alive option
* Better logging

# WARNING!
Updating to version 3.0.0 will reset your Roomba’s in HomeKit due to new setup


### 2.1.17 Beta 1 
* Whitelisted Bravva jets


### 2.1.16 
* This release represents releases 2.1.14 and 2.1.15


### 2.1.15 
* Set program to resume robot if job is already active
* Set program to stop Roomba if room-by-room request received
* Added j7 support (hopefully 🤞)


### 2.1.14 
* Added the ability to manually configure Roomba's instead of using your iRobot credentials


### 2.1.14 Beta 4 
* Improved logging when using manual configuration
* Fixed logic when determining if device supports room-by-room cleaning


### 2.1.14 Beta 3 
* Fixed homebridge crash due to logic error when configuring Roomba's


### 2.1.14 Beta 2 
* Fixed homebridge crash when reading variable ver


### 2.1.14 Beta 1 
* Added support for manually configuring Roomba's instead of entering your Roomba credentials


### 2.1.13 
* Fixed how getRoombas.ts handles unconfigured Roombas to address issues #23 and #34 


### 2.1.12 
* Added software version to custom ui


### 2.1.11 
* Fixed Stuck Sensor, Thanks @Ghost108
* Changed on/off logs from debug to info


### 2.1.10 
* Fixed crash when starting second IP sweep
* Removed devices if it fails to find IP


### 2.1.9 
* Fixed homebridge crash on offline


### 2.1.8 
* Fixed typo during Roomba IP discovery. Thanks @rcoletti116 


### 2.1.7 
* Set Accessory to not responding in HomeKit when Roomba disconnects
* Added Log for when Roomba is stuck
* Made IP search run again after 5 seconds for up to 5 attempts
* Prevented plugin from adding m6's


### 2.1.6 
* Removed Log Spam When Reconnecting After Connection Drop
* Made Low Battery Warnings Not Appear If Roomba Is Charging


### 2.1.5 
* Removed Broken Status From Device Table In Custom UI


### 2.1.4
* Removed Status From Table Since It Always Says Online

### 2.1.3
* Changed Logic For Identifying If Region Is Already Saved
* Added 5 Second Delay Before Reconnecting If The Connection Drops

### 2.1.2
* Added Support Page In Custom UI
* (Wiki Links Don't Work Yet)

### 2.1.1
* Re-arranged table
* fixed rooms section in table

### 2.1.0
* Added custom UI

### 2.1.0-beta.3
* Removed Mac Address from devices table

### 2.1.0-beta.2
* hid spinner while looking for devices in custom UI

### 2.1.0-beta.1
* Fixed menuHome custom UI error

### 2.1.0-beta.0
* Started To Work On Custom UI

### 2.0.5
* Set log added in version [2.0.2](#202) to debug 
* Set on/off logs to info
* Added log for when roomba is stuck

### 2.0.4
* fixed typo in room sync functions when adding new room to existing map

### 2.0.3
* Fixed error where it wouldn't add new regions

### 2.0.2
* Added Log When Updating Homekit Rooms

### 2.0.1
* Made disableMultiRoom default to false in config

### 2.0.0
* Became A Homebridge Vertified Plugin
* Set Password format to password in Schema

### 1.3.2
* Made Roomba execute off action 2 after 5 seconds if state dosent change

### 1.3.1
* Prevented plugin from initilizing if it dosent have an email/password

### 1.3.0
* Added support for Multiple Rooms
* Made Roomba wait 1 second for scenes when it is turned on

### 1.2.0
* Added Room-By-Room Abilities On Models That Support It

### 1.1.0
* Added More Configuation options
