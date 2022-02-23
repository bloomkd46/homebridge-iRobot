import { PlatformAccessory, Service } from 'homebridge';
import { on } from 'process';
import { iRobotPlatform } from './platform';
import { RoombaV3 } from './RoombaController';

class RoomManager {
  private logPrefix = '[' + this.accessory.displayName + ']';
  constructor(
    private readonly accessory: PlatformAccessory,
    private readonly platform: iRobotPlatform,
    private readonly roomba: RoombaV3,
  ) {
    //
  }

  updateMap(lastCommandFull: LastCommand) {
    if (lastCommandFull.pmap_id && lastCommandFull.regions && lastCommandFull.user_pmapv_id) {
      const lastCommand: LastCommandMap = {
        'pmap_id': lastCommandFull.pmap_id,
        'regions': lastCommandFull.regions,
        'user_pmapv_id': lastCommandFull.user_pmapv_id,
      };
      if (this.accessory.context.maps) {
        let mapIndex: number | undefined = undefined;
        this.accessory.context.maps.find((map: LastCommandMap, index: number) => {
          if (map.pmap_id === lastCommand.pmap_id) {
            mapIndex = index;
            return true;
          } else {
            return false;
          }
        });
        if (mapIndex) {
          for (const region of lastCommand.regions) {
            if (!this.accessory.context.maps[mapIndex].contains(region)) {
              this.platform.log.info(this.logPrefix, 'Adding new region:', region);
              this.accessory.context.maps[mapIndex].push(region);
            }
          }
        } else {
          this.platform.log.info(this.logPrefix, 'Adding new map:', lastCommand);
          this.accessory.context.maps.push(lastCommand);
        }
      } else {
        this.platform.log.info(this.logPrefix, 'Initiating Room-By-Room Support with map:', lastCommand);
        this.accessory.context.maps = [lastCommand];
      }
    }
  }

  StartRoomba(map: LastCommandMap) {
    this.roomba.cleanRoom(map);
  }

  GetName(region: { region_id: string; type: 'zid' | 'rid' }, map: number): string {
    return `map ${map} ${region.type === 'zid' ? 'Zone' : 'Room'} ${region.region_id}`;
  }
}
export class switches extends RoomManager {
  constructor(
    accessory: PlatformAccessory,
    platform: iRobotPlatform,
    roomba: RoombaV3,
    private readonly service: Service,
  ) {
    super(accessory, platform, roomba);
    for (const map of accessory.context.maps) {
      const index = accessory.context.maps.indexOf(map);
      for (const region of map.regions) {
        const service = accessory.getService(this.GetName(region, index)) ||
          accessory.addService(platform.Service.Switch, this.GetName(region, index), this.GetName(region, index));
      }
    }
  }
}
interface LastCommand {
  pmap_id?: string;
  regions?: [
    { region_id: string; type: 'zid' | 'rid' }
  ];
  user_pmapv_id?: string;
}
interface LastCommandMap {
  pmap_id: string;
  regions: [
    { region_id: string; type: 'zid' | 'rid' }
  ];
  user_pmapv_id: string;
}