/* eslint-disable no-console */

import { LocalV1, LocalV2, LocalV3 } from '@bloomkd46/dorita980';


import type { IHomebridgePluginUi, IHomebridgeUiFormHelper } from '@homebridge/plugin-ui-utils/dist/ui.interface';
declare const homebridge: IHomebridgePluginUi;

// Intro Elements
const pageIntro = document.getElementById('pageIntro') as HTMLDivElement;
//const introContinue = document.getElementById('introContinue') as HTMLButtonElement;
// Settings Elements
const menuSettings = document.getElementById('menuSettings') as HTMLButtonElement;
const settingsHelp = document.getElementById('settingsHelp') as HTMLParagraphElement;
// Devices Elements
const menuDevices = document.getElementById('menuDevices') as HTMLButtonElement;
const pageDevices = document.getElementById('pageDevices') as HTMLDivElement;
//const deviceAdd = document.getElementById('deviceAdd') as HTMLButtonElement;
const deviceButtons = document.getElementsByClassName('deviceButton') as HTMLCollectionOf<HTMLButtonElement>;
const deviceSelect = document.getElementById('deviceSelect') as HTMLSelectElement;
const logZone = document.getElementById('logZone') as HTMLPreElement;
const deviceStatus = document.getElementById('deviceStatus') as HTMLSpanElement;
//const deviceZone = document.getElementById('deviceZone') as HTMLDivElement;
const exitAddDevice = document.getElementById('exitAddDevice') as HTMLButtonElement;
const pleaseWait = document.getElementById('pleaseWait') as HTMLDivElement;
/*const warningModal = $('#deleteDevicesModal');
window['warningModal'] = warningModal;*/

// Miscellaneous Elements
const menuWrapper = document.getElementById('menuWrapper') as HTMLDivElement;

class iRobotPlugin {
  private currentForm: IHomebridgeUiFormHelper;
  resetView(activeButton: 'none' | 'settings' | 'devices') {
    //Reset Menu
    switch (activeButton) {
      case 'none':
        menuWrapper.style.display = 'none';
        exitAddDevice.style.display = 'inline';
        break;
      case 'settings':
        exitAddDevice.style.display = 'none';
        menuWrapper.style.display = 'inline-flex';
        menuDevices.classList.remove('btn-elegant');
        menuDevices.classList.add('btn-primary');
        menuSettings.classList.remove('btn-primary');
        menuSettings.classList.add('btn-elegant');
        break;
      case 'devices':
        exitAddDevice.style.display = 'none';
        menuWrapper.style.display = 'inline-flex';
        menuDevices.classList.add('btn-elegant');
        menuDevices.classList.remove('btn-primary');
        menuSettings.classList.add('btn-primary');
        menuSettings.classList.remove('btn-elegant');
        break;
    }
    //Reset pages
    pageDevices.style.display = 'none';
    homebridge.hideSchemaForm();
    settingsHelp.style.display = 'none';
    this.currentForm?.end();
    pleaseWait.style.display = 'none';
    pageIntro.style.display = 'none';
    //Hide modal
    //warningModal.modal('hide');
  }

  setDeviceButtonEnabled(disabled: boolean) {
    for (let i = 0; i < deviceButtons.length; i++) {
      deviceButtons[i].disabled = disabled;
    }
  }

  //(async () => {
  /*showIntro() {
    introContinue.addEventListener('click', () => {
      homebridge.showSpinner();
      this.showSettings();
    });
    pageIntro.style.display = 'block';
  }*/

  async showDeviceLogs(blid?: string) {
    homebridge.showSpinner();
    blid = blid ?? deviceSelect.value;
    logZone.innerHTML = await homebridge.request('/getLogs', blid);
    logZone.scrollTo(0, logZone.scrollHeight);
    const accessoryCache: Context = await homebridge.request('/getCache', blid);
    deviceStatus.innerHTML = accessoryCache.offline ? '<i class="fas fa-circle mr-1 red-text"></i> Offline' :
      accessoryCache.connected ? '<i class="fas fa-circle mr-1 green-text"></i> Connected' :
        '<i class="fas fa-circle mr-1 grey-text"></i> Disconnected';
    homebridge.hideSpinner();
  }

  async showDevices() {
    homebridge.showSpinner();
    this.resetView('devices');
    pageDevices.style.display = 'block';

    const accessories = ((await homebridge.getPluginConfig())[0].accessories as Config['accessories'] ?? [])
      .sort((a, b) =>
        a.name.toLowerCase() > b.name.toLowerCase() ? 1 : b.name.toLowerCase() > a.name.toLowerCase() ? -1 : 0);
    deviceSelect.innerHTML = '';

    if (accessories.length) {
      accessories.forEach(accessory => {
        const option = document.createElement('option');
        option.text = accessory.name;
        option.value = accessory.blid;
        deviceSelect.add(option);
      });
      this.setDeviceButtonEnabled(false);
      this.showDeviceLogs(deviceSelect.options[0].value);
    } else {
      const option = document.createElement('option');
      option.text = 'No Devices';
      deviceSelect.add(option);
      deviceSelect.disabled = true;
      this.setDeviceButtonEnabled(true);
      homebridge.hideSpinner();
    }
    //deviceSelect.addEventListener('change', () => this.showDeviceLogs(deviceSelect.value));
    //homebridge.hideSpinner();
  }

  showSettings() {
    homebridge.showSpinner();
    this.resetView('settings');
    homebridge.showSchemaForm();
    settingsHelp.style.display = 'block';
    homebridge.hideSpinner();
  }

  showAddDevices() {
    homebridge.showSpinner();
    this.resetView('none');
    // create the form
    this.currentForm = homebridge.createForm(
      {
        schema: {
          type: 'object',
          properties: {
            email: {
              title: 'Email',
              type: 'string',
              required: true,
              format: 'email',
            },
            password: {
              title: 'Password',
              type: 'string',
              required: true,
              'x-schema-form': {
                type: 'password',
              },
            },
          },
        },
        layout: null,
        form: null,
      },
      {}, 'Get Devices', 'Configure Manually',
    );

    this.currentForm.onChange(change => console.debug(change));

    // watch for submit button click events
    this.currentForm.onSubmit((form) => {
      homebridge.showSpinner();
      pleaseWait.style.display = 'block';
      console.log(form);
      this.currentForm.end();
      homebridge.request('/configureDevices', form).then(async (devices: Device[]) => {
        console.log(devices);
        homebridge.toast.success(`Successfully Downloaded ${devices.length} Devices`, 'Success!');
        const config = await homebridge.getPluginConfig() as Config[];
        config[0].accessories = config[0].accessories || [];
        console.debug(config);
        for (const device of devices) {
          if (device.ipResolution === 'manual' && !device.ip) {
            homebridge.toast.warning('Please Configure An IP Address Under The Devices Tab', `Setup Incomplete (${device.name})`);
          }
          if (!config[0].accessories.find(accessory => accessory.blid === device.blid)) {
            homebridge.toast.success(`Adding ${device.name} To Config`, 'Adding Accessory');
            config[0].accessories.push(device);
          }
          await homebridge.updatePluginConfig(config);
        }
        homebridge.toast.warning('Make Sure You Hit Save Below When You\'re Done To Save The Devices', 'Notice:');
        this.showDevices();
      }).catch(err => {
        console.error(err);
        homebridge.toast.error('See Your Homebridge Logs For More Info', 'Please Try Again');
        this.showAddDevices();
      });
    });
    // watch for cancel button click events
    this.currentForm.onCancel(() => {
      homebridge.showSpinner();
      this.currentForm.end();
      this.currentForm = homebridge.createForm(
        {
          schema: {
            type: 'object',
            properties: {
              devices: {
                title: 'Devices',
                type: 'array',
                buttonText: 'Add Device',
                items: {
                  type: 'object',
                  properties: {
                    ip: {
                      title: 'IP Address',
                      type: 'string',
                      format: 'ipv4',
                      required: true,
                    },
                    allInfo: {
                      title: 'I have my device\'s blid and password',
                      type: 'boolean',
                      default: false,
                    },
                    blid: {
                      title: 'Blid',
                      type: 'string',
                      description: 'Your devices blid, if you don\'t know, leave blank.',
                      condition: {
                        functionBody: 'return ("devices" in model && model.devices[arrayIndices].allInfo)',
                      },
                    },
                    password: {
                      title: 'Password',
                      type: 'string',
                      description: 'Your devices blid, if you don\'t know, leave blank.',
                      minLength: 7,
                      condition: {
                        functionBody: 'return ("devices" in model && model.devices[arrayIndices].allInfo)',
                      },
                    },
                    ready: {
                      title: 'I have pressed and held the HOME button on my robot until it played a series of tones (about 2 seconds).',
                      description: 'Required to get your device\'s password',
                      type: 'boolean',
                      condition: {
                        functionBody: 'return ("devices" in model && !model.devices[arrayIndices].allInfo)',
                      },
                    },
                  },
                },
              },
            },
          },
          layout: null,
          form: null,
        },
        {}, 'Get Devices', 'Configure From Cloud',
      );

      this.currentForm.onChange(change => console.debug(change));
      // watch for submit button click events
      this.currentForm.onSubmit((form) => {
        homebridge.showSpinner();
        pleaseWait.style.display = 'block';
        console.log(form);
        this.currentForm.end();
        homebridge.request('/configureDevices', form).then(async (devices: Device[]) => {
          console.log(devices);
          homebridge.toast.success(`Successfully Found ${devices.length} Devices`, 'Success!');
          const config = await homebridge.getPluginConfig() as Config[];
          config[0].accessories = config[0].accessories || [];
          console.debug(config);
          for (const device of devices) {
            if (device.ipResolution === 'manual' && !device.ip) {
              homebridge.toast.warning('Please Configure An IP Address Under The Devices Tab', `Setup Incomplete (${device.name})`);
            }
            if (!config[0].accessories.find(accessory => accessory.blid === device.blid)) {
              homebridge.toast.success(`Adding ${device.name} To Config`, 'Adding Accessory');
              config[0].accessories.push(device);
            }
            await homebridge.updatePluginConfig(config);
          }
          homebridge.toast.warning('Make Sure You Hit Save Below When Your Done To Save The Devices', 'Notice:');
          this.showDevices();
        }).catch(err => {
          console.error(err);
          homebridge.toast.error('See Your Homebridge Logs For More Info', 'Please Try Again');
          this.showAddDevices();
        });
      });
      // watch for cancel button click events
      this.currentForm.onCancel(() => {
        this.showAddDevices();
      });
      homebridge.hideSpinner();
    });
    homebridge.hideSpinner();
  }

  async deleteDevice() {
    homebridge.showSpinner();
    const configs = await homebridge.getPluginConfig();
    const accessories = (configs[0].accessories as Config['accessories'] ?? []);
    const currentDeviceIndex = accessories.findIndex(accessory => accessory.blid === deviceSelect.value);
    const currentDevice = accessories.find(accessory => accessory.blid === deviceSelect.value);
    await homebridge.request('/deleteDevice', currentDevice.blid);
    configs[0].accessories.splice(currentDeviceIndex, 1);
    homebridge.updatePluginConfig(configs);
    homebridge.savePluginConfig();
    this.showDevices();
  }

  async showEditDevice() {
    homebridge.showSpinner();
    const configs = await homebridge.getPluginConfig();
    const accessories = (configs[0].accessories as Config['accessories'] ?? []);
    const currentDevice = accessories.findIndex(accessory => accessory.blid === deviceSelect.value);
    this.resetView('devices');
    this.currentForm = homebridge.createForm(
      {
        schema: {
          type: 'object',
          properties: {
            name: {
              title: 'Name',
              type: 'string',
              required: true,
            },
            blid: {
              title: 'Blid',
              type: 'string',
              required: true,
            },
            password: {
              password: 'Password',
              type: 'string',
              required: true,
            },
            sw: {
              title: 'Software Version',
              type: 'string',
              required: true,
            },
            sku: {
              title: 'SKU',
              type: 'string',
              required: true,
            },
            ipResolution: {
              title: 'IP Address Resolution Method',
              type: 'string',
              oneOf: [
                { title: 'UDP Lookup', enum: ['lookup'] },
                { title: 'UDP Broadcast', enum: ['broadcast'] },
                { title: 'Manual', enum: ['manual'] },
              ],
              required: true,
            },
            hostname: {
              title: 'Hostname',
              type: 'string',
              format: 'hostname',
              placeholder: 'iRobot-${blid}.local',
              condition: {
                functionBody: 'return model.ipResolution === "lookup"',
              },
            },
            ip: {
              title: 'IP Address',
              type: 'string',
              format: 'ipv4',
              condition: {
                functionBody: 'return model.ipResolution === "manual"',
              },
            },
          },
        },
        layout: null,
        form: null,
      },
      accessories[currentDevice], 'Save Changes', 'Cancel',
    );

    this.currentForm.onChange(change => console.debug(change));
    // watch for submit button click events
    this.currentForm.onSubmit((form) => {
      homebridge.showSpinner();
      console.log(form);
      configs[0].accessories[currentDevice] = form;
      homebridge.updatePluginConfig(configs);
      homebridge.savePluginConfig();
      this.showDevices();
    });
    // watch for cancel button click events
    this.currentForm.onCancel(() => {
      homebridge.showSpinner();
      this.showDevices();
    });
    homebridge.hideSpinner();
  }
}
window['plugin'] = new iRobotPlugin();
/*menuDevices.addEventListener('click', () => showDevices());
menuSettings.addEventListener('click', () => showSettings());
deviceAdd.addEventListener('click', () => showAddDevices());
exitAddDevice.addEventListener('click', () => showDevices());*/
//})();
export type Config = {
  name: string;
  accessories: Device[];
  logLevel: 0 | 1 | 2 | 3 | 4;
  platform: 'iRobotPlatform';
  autoConnect?: boolean;
  alwaysShowModes?: boolean;
};
export type Device = {
  name: string;
  blid: string;
  password: string;
  sw: string;
  sku: string;
  //publicInfo: PublicInfo;
} & ipInfo;
type ipInfo = {
  ipResolution: 'manual';
  ip: string;
} | {
  ipResolution: 'lookup';
  hostname: string;
} | {
  ipResolution: 'broadcast';
};
export type Context = {
  device: Device;
  connected?: boolean;
  offline?: boolean;
  logPath?: string;
  refreshToken?: string;
  pluginVersion?: 4;
  ip?: string;
  overrides: string[];
  //emptyCapable?: boolean;
  regions?: {
    name: string;
    id: string;
    type: 'rid' | 'zid';
    pmap_id: string;
    user_pmapv_id: string;
  }[];
  lastMode: ActiveIdentifier;
} & (V1 | V2 | V3);
export type V1Mission = Awaited<ReturnType<LocalV1.Local['getMission']>>['ok'];
type V1 = {
  lastState: Partial<V1Mission>;
  version: 1;
};
type V2 = {
  lastState: Partial<LocalV2.RobotState>;
  version: 2;
};
type V3 = {
  lastState: Partial<LocalV3.RobotState>;
  version: 3;
};
export const ActiveIdentifierPretty =
  [undefined, 'Locating', 'Stuck', undefined, 'Emptying Bin', 'Ready', 'Recharging', undefined, 'Stopped', undefined, 'Docking', undefined,
    'Paused', 'Resuming', undefined, 'Cleaning Everywhere'] as const;
export enum ActiveIdentifier {
  Locate = 1,
  Stuck,
  Empty_Bin,
  Emptying_Bin,
  Ready,
  Recharging,
  Stop,
  Stopped,
  Go_Home,
  Docking,
  Pause,
  Paused,
  Resume,
  Clean_Everywhere,
  Cleaning_Everywhere,
}