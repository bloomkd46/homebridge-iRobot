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
