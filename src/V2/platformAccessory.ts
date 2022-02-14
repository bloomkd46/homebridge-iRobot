import { Service, PlatformAccessory } from 'homebridge';
import { iRobotPlatform } from './platform';
import { RoombaV1, RoombaV2, MissionV1, MissionV2, MissionV3, RoombaV3 } from './RoombaController';
import { EventEmitter } from 'events';

const events = new EventEmitter();
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class iRobotPlatformAccessoryV1 {
  private service: Service;
  private battery: Service;
  private logPrefix = '[' + this.accessory.displayName + ']';
  private roomba = new RoombaV1(this.accessory.context.device.blid,
    this.accessory.context.device.password, this.accessory.context.device.ip);

  private state: MissionV1 = {
    ok: {
      cycle: 'none',
      phase: 'charge',
      batPct: 99,
      idle: true,
      binFull: false,
      binPresent: true,
    },
  };

  constructor(
    private readonly platform: iRobotPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'iRobot')
      .setCharacteristic(this.platform.Characteristic.Model, this.accessory.context.device.sku || 'N/A')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.context.device.serialNum || this.accessory.UUID || 'N/A')
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, '1')
      .getCharacteristic(this.platform.Characteristic.Identify).on('set', () => {
        this.platform.log.error(this.logPrefix, 'Identification not supported');
      });


    this.service = this.accessory.getService(this.accessory.context.device.name) ||
      this.accessory.addService(this.platform.Service.Fan, this.accessory.context.device.name, 'Main-Service');
    this.service.setPrimaryService(true);

    this.battery = this.accessory.getService(this.accessory.displayName + ' battery') ||
      this.accessory.addService(this.platform.Service.Battery, this.accessory.displayName + ' battery', 'Battery');


    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet((value) => {
        const stopActions = this.platform.config.offAction !== undefined ? this.platform.config.offAction.split(':') : ['pause', 'dock'];
        if (value as boolean) {
          this.roomba.start();
          this.roomba.resume();
        } else {
          this.roomba[stopActions[0]];
          setTimeout(() => {
            if (stopActions[1] !== 'none' && stopActions[1] !== 'find') {
              this.roomba[stopActions[1]];
            }
          }, 5000);
        }
      }).onGet(() => {
        const status = this.platform.config.status !== undefined ? this.platform.config.status.split(':') : ['phase', 'run'];
        return new Promise((resolve, reject) => {
          this.roomba.getMission().then(mission => {
            this.state = mission;
            events.emit('update', mission);
            resolve(status[0] === 'inverted' ? mission.ok[status[1]] !== status[2] : mission.ok[status[0]] === status[1]);
          }).catch(err => {
            this.platform.log.error('Failed To Fetch Robot Status\n', err); reject(this.platform.api.hap.HapStatusError);
          });
        });
      });
    this.battery.getCharacteristic(this.platform.Characteristic.BatteryLevel)
      .onGet(() => {
        return this.state.ok.batPct;
      });
    this.battery.getCharacteristic(this.platform.Characteristic.ChargingState)
      .onGet(() => {
        return this.state.ok.phase === 'charge' ? 1 : 0;
      });
    this.battery.getCharacteristic(this.platform.Characteristic.StatusLowBattery)
      .onGet(() => {
        return this.state.ok.phase === 'charge' ? 0 : this.state.ok.batPct < this.platform.config.lowBattery ? 1 : 0;
      });
    events.on('update', (mission) => {
      const status = this.platform.config.status !== undefined ? this.platform.config.status.split(':') : ['phase', 'run'];
      this.service.updateCharacteristic(this.platform.Characteristic.On,
        status[0] === 'inverted' ? mission.ok[status[1]] !== status[2] : mission.ok[status[0]] === status[1]);
      this.battery.updateCharacteristic(this.platform.Characteristic.BatteryLevel, mission.ok.batPct);
      this.battery.updateCharacteristic(this.platform.Characteristic.ChargingState, mission.ok.phase === 'charge' ? 1 : 0);
      this.battery.updateCharacteristic(this.platform.Characteristic.StatusLowBattery,
        mission.phase === 'charge' ? 0 : mission.batPct < this.platform.config.lowBattery ? 1 : 0);
    });
    if (this.platform.config.sensors !== undefined && this.platform.config.sensors !== []) {
      for (const sensor of this.platform.config.sensors) {
        const sensorType: 'contact' | 'motion' | 'filter' = sensor.type;
        const value = (mission: MissionV1) => {
          const conditions = sensor.condition.split(':');
          conditions[1] = conditions[1] === 'true' ? true : conditions[1] === 'false' ? false : conditions[1];
          if (conditions[0] === 'inverted') {
            return mission.ok[conditions[1]] !== conditions[2];
          } else {
            return mission.ok[conditions[0]] === conditions[1];
          }
        };
        if (sensorType === 'contact') {
          const contact = this.accessory.getService(this.accessory.displayName + ' ' + sensor.condition) ||
            this.accessory.addService(this.platform.Service.ContactSensor, this.accessory.displayName + ' ' + sensor.condition,
              'Contact-' + sensor.condition);
          contact.getCharacteristic(this.platform.Characteristic.ContactSensorState)
            .onGet(() => {
              return value(this.state) ? 1 : 0;
            });
          events.on('update', (mission) => {
            contact.updateCharacteristic(this.platform.Characteristic.ContactSensorState, value(mission) ? 1 : 0);
          });

        } else if (sensorType === 'motion') {
          const motion = this.accessory.getService(this.accessory.displayName + ' ' + sensor.condition) ||
            this.accessory.addService(this.platform.Service.MotionSensor, this.accessory.displayName + ' ' + sensor.condition,
              'Motion-' + sensor.condition);
          motion.getCharacteristic(this.platform.Characteristic.MotionDetected)
            .onGet(() => {
              return value(this.state);
            });
          events.on('update', (mission) => {
            motion.updateCharacteristic(this.platform.Characteristic.ContactSensorState, value(mission));
          });

        } else if (sensorType === 'filter') {
          const filter = this.accessory.getService(this.accessory.displayName + ' ' + sensor.condition) ||
            this.accessory.addService(this.platform.Service.FilterMaintenance, this.accessory.displayName + ' ' + sensor.condition,
              'Filter-' + sensor.condition);
          filter.getCharacteristic(this.platform.Characteristic.FilterChangeIndication)
            .onGet(() => {
              return value(this.state) ? 1 : 0;
            });
          events.on('update', (mission) => {
            filter.updateCharacteristic(this.platform.Characteristic.ContactSensorState, value(mission) ? 1 : 0);
          });
        }
      }
    }
    const interval = setInterval(() => {
      this.roomba.getMission()
        .then(mission => events.emit('update', mission))
        .catch(err => this.platform.log.error(this.logPrefix, 'Failed To Auto Update State:\n', err));
    }, this.platform.config.interval || 5000);
    this.platform.api.on('shutdown', () => {
      clearInterval(interval);
    });
  }
}

//------------------------------------------------------------------------------------------------------------------------------------------

export class iRobotPlatformAccessoryV2 {
  private service: Service;
  private battery: Service;
  private logPrefix = '[' + this.accessory.displayName + ']';
  private roomba = new RoombaV2(this.accessory.context.device.blid,
    this.accessory.context.device.password, this.accessory.context.device.ip);

  private state: MissionV2 = {
    cycle: 'none',
    phase: 'charge',
    batPct: 99,
    binPresent: true,
    binFull: false,
  };

  constructor(
    private readonly platform: iRobotPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'iRobot')
      .setCharacteristic(this.platform.Characteristic.Model, this.accessory.context.device.sku || 'N/A')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.context.device.serialNum || this.accessory.UUID || 'N/A')
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, '2')
      .getCharacteristic(this.platform.Characteristic.Identify).on('set', () => {
        this.platform.log.info(this.logPrefix, 'Identifying... (Might not work if device is docked)');
        this.roomba.find();
      });


    this.service = this.accessory.getService(this.accessory.context.device.name) ||
      this.accessory.addService(this.platform.Service.Fan, this.accessory.context.device.name, 'Main-Service');
    this.service.setPrimaryService(true);

    this.battery = this.accessory.getService(this.accessory.displayName + ' battery') ||
      this.accessory.addService(this.platform.Service.Battery, this.accessory.displayName + ' battery', 'Battery');


    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet((value) => {
        const stopActions = this.platform.config.offAction !== undefined ? this.platform.config.offAction.split(':') : ['pause', 'dock'];
        if (value as boolean) {
          this.roomba.clean();
          this.roomba.resume();
        } else {
          this.roomba[stopActions[0]];
          setTimeout(() => {
            if (stopActions[1] !== 'none') {
              this.roomba[stopActions[1]];
            }
          }, 5000);
        }
      }).onGet(() => {
        const status = this.platform.config.status !== undefined ? this.platform.config.status.split(':') : ['phase', 'run'];
        return new Promise((resolve, reject) => {
          this.roomba.getMission().then(mission => {
            this.state = mission;
            events.emit('update', mission);
            resolve(status[0] === 'inverted' ? mission[status[1]] !== status[2] : mission[status[0]] === status[1]);
          }).catch(err => reject(err));
        });
      });
    this.battery.getCharacteristic(this.platform.Characteristic.BatteryLevel)
      .onGet(() => {
        return this.state.batPct;
      });
    this.battery.getCharacteristic(this.platform.Characteristic.ChargingState)
      .onGet(() => {
        return this.state.phase === 'charge' ? 1 : 0;
      });
    this.battery.getCharacteristic(this.platform.Characteristic.StatusLowBattery)
      .onGet(() => {
        return this.state.phase === 'charge' ? 0 : this.state.batPct < this.platform.config.lowBattery ? 1 : 0;
      });
    events.on('update', (mission) => {
      const status = this.platform.config.status !== undefined ? this.platform.config.status.split(':') : ['phase', 'run'];
      this.service.updateCharacteristic(this.platform.Characteristic.On,
        status[0] === 'inverted' ? mission.ok[status[1]] !== status[2] : mission.ok[status[0]] === status[1]);
      this.battery.updateCharacteristic(this.platform.Characteristic.BatteryLevel, mission.batPct);
      this.battery.updateCharacteristic(this.platform.Characteristic.ChargingState, mission.phase === 'charge' ? 1 : 0);
      this.battery.updateCharacteristic(this.platform.Characteristic.StatusLowBattery,
        mission.phase === 'charge' ? 0 : mission.batPct < this.platform.config.lowBattery ? 1 : 0);
    });
    if (this.platform.config.sensors !== undefined && this.platform.config.sensors !== []) {
      for (const sensor of this.platform.config.sensors) {
        const sensorType: 'contact' | 'motion' | 'filter' = sensor.type;
        const value = (mission: MissionV2) => {
          const conditions = sensor.condition.split(':');
          conditions[1] = conditions[1] === 'true' ? true : conditions[1] === 'false' ? false : conditions[1];
          if (conditions[0] === 'inverted') {
            return mission[conditions[1]] !== conditions[2];
          } else {
            return mission[conditions[0]] === conditions[1];
          }
        };
        if (sensorType === 'contact') {
          const contact = this.accessory.getService(this.accessory.displayName + ' ' + sensor.condition) ||
            this.accessory.addService(this.platform.Service.ContactSensor, this.accessory.displayName + ' ' + sensor.condition,
              'Contact-' + sensor.condition);
          contact.getCharacteristic(this.platform.Characteristic.ContactSensorState)
            .onGet(() => {
              return value(this.state) ? 1 : 0;
            });
          events.on('update', (mission) => {
            contact.updateCharacteristic(this.platform.Characteristic.ContactSensorState, value(mission) ? 1 : 0);
          });

        } else if (sensorType === 'motion') {
          const motion = this.accessory.getService(this.accessory.displayName + ' ' + sensor.condition) ||
            this.accessory.addService(this.platform.Service.MotionSensor, this.accessory.displayName + ' ' + sensor.condition,
              'Motion-' + sensor.condition);
          motion.getCharacteristic(this.platform.Characteristic.MotionDetected)
            .onGet(() => {
              return value(this.state);
            });
          events.on('update', (mission) => {
            motion.updateCharacteristic(this.platform.Characteristic.ContactSensorState, value(mission));
          });

        } else if (sensorType === 'filter') {
          const filter = this.accessory.getService(this.accessory.displayName + ' ' + sensor.condition) ||
            this.accessory.addService(this.platform.Service.FilterMaintenance, this.accessory.displayName + ' ' + sensor.condition,
              'Filter-' + sensor.condition);
          filter.getCharacteristic(this.platform.Characteristic.FilterChangeIndication)
            .onGet(() => {
              return value(this.state) ? 1 : 0;
            });
          events.on('update', (mission) => {
            filter.updateCharacteristic(this.platform.Characteristic.ContactSensorState, value(mission) ? 1 : 0);
          });
        }
      }
    }
    const interval = setInterval(() => {
      this.roomba.getMission()
        .then(mission => events.emit('update', mission))
        .catch(err => this.platform.log.error(this.logPrefix, 'Failed To Update State:\n', err));
    }, this.platform.config.interval || 5000);
    this.platform.api.on('shutdown', () => {
      clearInterval(interval);
    });
  }
}

//------------------------------------------------------------------------------------------------------------------------------------------

export class iRobotPlatformAccessoryV3 {
  private service: Service;
  private battery: Service;
  private logPrefix = '[' + this.accessory.displayName + ']';
  private roomba = new RoombaV3(this.accessory.context.device.blid,
    this.accessory.context.device.password, this.accessory.context.device.ip, this.accessory.context.device.sku);

  private state: MissionV3 = {
    cycle: 'none',
    phase: 'charge',
    batPct: 99,
    binPresent: true,
    binFull: false,
    pmap_id: null,
    regions: null,
    user_pmapv_id: null,
  };

  constructor(
    private readonly platform: iRobotPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'iRobot')
      .setCharacteristic(this.platform.Characteristic.Model, this.accessory.context.device.sku || 'N/A')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.context.device.serialNum || this.accessory.UUID || 'N/A')
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, '3')
      .getCharacteristic(this.platform.Characteristic.Identify).on('set', () => {
        this.platform.log.info(this.logPrefix, 'Identifying...');
        this.roomba.find();
      });


    this.service = this.accessory.getService(this.accessory.context.device.name) ||
      this.accessory.addService(this.platform.Service.Fan, this.accessory.context.device.name, 'Main-Service');
    this.service.setPrimaryService(true);

    this.battery = this.accessory.getService(this.accessory.displayName + ' battery') ||
      this.accessory.addService(this.platform.Service.Battery, this.accessory.displayName + ' battery', 'Battery');

    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet((value) => {
        const stopActions = this.platform.config.offAction !== undefined ? this.platform.config.offAction.split(':') : ['pause', 'dock'];
        if (value as boolean) {
          this.roomba.clean();
          this.roomba.resume();
        } else {
          this.roomba[stopActions[0]];
          setTimeout(() => {
            if (stopActions[1] !== 'none') {
              this.roomba[stopActions[1]];
            }
          }, 5000);
        }
      }).onGet(() => {
        const status = this.platform.config.status !== undefined ? this.platform.config.status.split(':') : ['phase', 'run'];
        return new Promise((resolve, reject) => {
          this.roomba.getMission().then(mission => {
            this.state = mission;
            events.emit('update', mission);
            resolve(status[0] === 'inverted' ? mission[status[1]] !== status[2] : mission[status[0]] === status[1]);
          }).catch(err => reject(err));
        });
      });
    this.battery.getCharacteristic(this.platform.Characteristic.BatteryLevel)
      .onGet(() => {
        return this.state.batPct;
      });
    this.battery.getCharacteristic(this.platform.Characteristic.ChargingState)
      .onGet(() => {
        return this.state.phase === 'charge' ? 1 : 0;
      });
    this.battery.getCharacteristic(this.platform.Characteristic.StatusLowBattery)
      .onGet(() => {
        return this.state.phase === 'charge' ? 0 : this.state.batPct < this.platform.config.lowBattery ? 1 : 0;
      });
    events.on('update', (mission) => {
      const status = this.platform.config.status !== undefined ? this.platform.config.status.split(':') : ['phase', 'run'];
      this.service.updateCharacteristic(this.platform.Characteristic.On,
        status[0] === 'inverted' ? mission.ok[status[1]] !== status[2] : mission.ok[status[0]] === status[1]);
      this.battery.updateCharacteristic(this.platform.Characteristic.BatteryLevel, mission.batPct);
      this.battery.updateCharacteristic(this.platform.Characteristic.ChargingState, mission.phase === 'charge' ? 1 : 0);
      this.battery.updateCharacteristic(this.platform.Characteristic.StatusLowBattery,
        mission.phase === 'charge' ? 0 : mission.batPct < this.platform.config.lowBattery ? 1 : 0);
    });
    if (this.platform.config.sensors !== undefined && this.platform.config.sensors !== []) {
      for (const sensor of this.platform.config.sensors) {
        const sensorType: 'contact' | 'motion' | 'filter' = sensor.type;
        const value = (mission: MissionV3) => {
          const conditions = sensor.condition.split(':');
          conditions[1] = conditions[1] === 'true' ? true : conditions[1] === 'false' ? false : conditions[1];
          if (conditions[0] === 'inverted') {
            return mission[conditions[1]] !== conditions[2];
          } else {
            return mission[conditions[0]] === conditions[1];
          }
        };
        if (sensorType === 'contact') {
          const contact = this.accessory.getService(this.accessory.displayName + ' ' + sensor.condition) ||
            this.accessory.addService(this.platform.Service.ContactSensor, this.accessory.displayName + ' ' + sensor.condition,
              'Contact-' + sensor.condition);
          contact.getCharacteristic(this.platform.Characteristic.ContactSensorState)
            .onGet(() => {
              return value(this.state) ? 1 : 0;
            });
          events.on('update', (mission) => {
            contact.updateCharacteristic(this.platform.Characteristic.ContactSensorState, value(mission) ? 1 : 0);
          });

        } else if (sensorType === 'motion') {
          const motion = this.accessory.getService(this.accessory.displayName + ' ' + sensor.condition) ||
            this.accessory.addService(this.platform.Service.MotionSensor, this.accessory.displayName + ' ' + sensor.condition,
              'Motion-' + sensor.condition);
          motion.getCharacteristic(this.platform.Characteristic.MotionDetected)
            .onGet(() => {
              return value(this.state);
            });
          events.on('update', (mission) => {
            motion.updateCharacteristic(this.platform.Characteristic.ContactSensorState, value(mission));
          });

        } else if (sensorType === 'filter') {
          const filter = this.accessory.getService(this.accessory.displayName + ' ' + sensor.condition) ||
            this.accessory.addService(this.platform.Service.FilterMaintenance, this.accessory.displayName + ' ' + sensor.condition,
              'Filter-' + sensor.condition);
          filter.getCharacteristic(this.platform.Characteristic.FilterChangeIndication)
            .onGet(() => {
              return value(this.state) ? 1 : 0;
            });
          events.on('update', (mission) => {
            filter.updateCharacteristic(this.platform.Characteristic.ContactSensorState, value(mission) ? 1 : 0);
          });
        }
      }
    }
    const interval = setInterval(() => {
      this.roomba.getMission()
        .then(mission => events.emit('update', mission))
        .catch(err => this.platform.log.error(this.logPrefix, 'Failed To Update State:\n', err));
    }, this.platform.config.interval || 5000);
    this.platform.api.on('shutdown', () => {
      clearInterval(interval);
    });
  }
}