import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import { iRobotPlatform } from './V2/platform';

/**
 * This method registers the platform with Homebridge
 */
export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, iRobotPlatform);
};
