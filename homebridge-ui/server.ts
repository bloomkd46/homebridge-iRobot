/* eslint-disable no-console */

import { HomebridgePluginUiServer } from '@homebridge/plugin-ui-utils';


class PluginUiServer extends HomebridgePluginUiServer {
  constructor() {
    super();

    this.onRequest('/configureDevices',
      async (payload: { email: string; password: string; } | { ip: string, blid?: string, password?: string; }[]) => {
        if (Array.isArray(payload)) {
          payload;
        } else {
          const email = payload.email;
          const password = payload.password;
        }
        return { response: true };
      });

    this.ready();
  }
}

(() => new PluginUiServer())();