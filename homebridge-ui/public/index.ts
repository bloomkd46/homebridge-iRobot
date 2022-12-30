/* eslint-disable no-console */

import type { IHomebridgePluginUi, IHomebridgeUiFormHelper } from '@homebridge/plugin-ui-utils/dist/ui.interface';
declare const homebridge: IHomebridgePluginUi;

//Intro Elements
const pageIntro = document.getElementById('pageIntro') as HTMLDivElement;
const introContinue = document.getElementById('introContinue') as HTMLButtonElement;
//Settings Elements
const menuSettings = document.getElementById('menuSettings') as HTMLButtonElement;
const settingsHelp = document.getElementById('settingsHelp') as HTMLParagraphElement;
//Devices Elements
const menuDevices = document.getElementById('menuDevices') as HTMLButtonElement;
const pageDevices = document.getElementById('pageDevices') as HTMLDivElement;
const deviceAdd = document.getElementById('deviceAdd') as HTMLButtonElement;
const exitAddDevice = document.getElementById('exitAddDevice') as HTMLButtonElement;
const pleaseWait = document.getElementById('pleaseWait') as HTMLDivElement;
let currentForm: IHomebridgeUiFormHelper;

//Miscellaneous Elements
const menuWrapper = document.getElementById('menuWrapper') as HTMLDivElement;
(async () => {
  try {
    const currentConfig = await homebridge.getPluginConfig();
    const showIntro = () => {
      introContinue.addEventListener('click', () => {
        homebridge.showSpinner();
        pageIntro.style.display = 'none';
        menuWrapper.style.display = 'inline-flex';
        showSettings();
        homebridge.hideSpinner();
      });
      pageIntro.style.display = 'block';
    };
    const showDevices = async () => {
      homebridge.showSpinner();
      menuWrapper.style.display = 'inline-flex';
      menuDevices.classList.add('btn-elegant');
      menuDevices.classList.remove('btn-primary');
      menuSettings.classList.remove('btn-elegant');
      menuSettings.classList.add('btn-primary');
      pageDevices.style.display = 'block';
      homebridge.hideSchemaForm();
      settingsHelp.style.display = 'none';
      currentForm?.end();
      exitAddDevice.style.display = 'none';
      pleaseWait.style.display = 'none';
      homebridge.hideSpinner();
    };
    const showSettings = () => {
      homebridge.showSpinner();
      menuWrapper.style.display = 'inline-flex';
      menuDevices.classList.remove('btn-elegant');
      menuDevices.classList.add('btn-primary');
      menuSettings.classList.add('btn-elegant');
      menuSettings.classList.remove('btn-primary');
      pageDevices.style.display = 'none';
      currentForm?.end();
      exitAddDevice.style.display = 'none';
      homebridge.showSchemaForm();
      settingsHelp.style.display = 'block';
      pleaseWait.style.display = 'none';
      homebridge.hideSpinner();
    };
    const showAddDevices = () => {
      homebridge.showSpinner();
      menuWrapper.style.display = 'none';
      homebridge.hideSchemaForm();
      settingsHelp.style.display = 'none';
      pageDevices.style.display = 'none';
      currentForm?.end();
      exitAddDevice.style.display = 'inline';
      pleaseWait.style.display = 'none';
      // create the form
      currentForm = homebridge.createForm(
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

      // watch for submit button click events
      currentForm.onSubmit((form) => {
        homebridge.showSpinner();
        pleaseWait.style.display = 'block';
        console.log(form);
        currentForm.end();
        homebridge.request('/configureDevices', form).then(async (devices: Device[]) => {
          homebridge.toast.success(`Successfully Configured ${devices.length} Devices`, 'Success!');
          const config = await homebridge.getPluginConfig() as Config[];
          for (const device of devices) {
            if (device.ipResolution === 'manual' && !device.ip) {
              homebridge.toast.warning('Please Configure An IP Address Under The Devices Tab', `Setup Incomplete (${device.name})`);
            }
            if (!config[0].accessories.find(accessory => accessory.blid === device.blid)) {
              config[0].accessories.push(device);
            }
          }
          await homebridge.updatePluginConfig(config);
          showDevices();
        }).catch(() => {
          homebridge.toast.error('See Your Homebridge Logs For More Info', 'Please Try Again');
          showAddDevices();
        });
      });
      // watch for cancel button click events
      currentForm.onCancel(() => {
        homebridge.showSpinner();
        currentForm.end();
        currentForm = homebridge.createForm(
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

        // watch for submit button click events
        currentForm.onSubmit((form) => {
          homebridge.showSpinner();
          pleaseWait.style.display = 'block';
          console.log(form);
          currentForm.end();
          homebridge.request('/configureDevices', form).then(async (devices: Device[]) => {
            homebridge.toast.success(`Successfully Configured ${devices.length} Devices`, 'Success!');
            const config = await homebridge.getPluginConfig() as Config[];
            for (const device of devices) {
              if (device.ipResolution === 'manual' && !device.ip) {
                homebridge.toast.warning('Please Configure An IP Address Under The Devices Tab', `Setup Incomplete (${device.name})`);
              }
              if (!config[0].accessories.find(accessory => accessory.blid === device.blid)) {
                config[0].accessories.push(device);
              }
            }
            homebridge.updatePluginConfig(config);
            showDevices();
          }).catch(() => {
            homebridge.toast.error('See Your Homebridge Logs For More Info', 'Please Try Again');
            showAddDevices();
          });
        });
        // watch for cancel button click events
        currentForm.onCancel(() => {
          showAddDevices();
        });
        homebridge.hideSpinner();
      });
      homebridge.hideSpinner();
    };
    menuDevices.addEventListener('click', () => showDevices());
    menuSettings.addEventListener('click', () => showSettings());
    deviceAdd.addEventListener('click', () => showAddDevices());
    exitAddDevice.addEventListener('click', () => showDevices());

    if (currentConfig.length) {
      showSettings();
    } else {
      currentConfig.push({ name: 'iRobot' });
      await homebridge.updatePluginConfig(currentConfig);
      showIntro();
    }
  } catch (err) {
    homebridge.toast.error(err, 'Error');
    console.error(err);
    homebridge.closeSettings();
  } finally {
    homebridge.hideSpinner();
  }
})();
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