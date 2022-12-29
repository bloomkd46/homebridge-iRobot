/* eslint-disable no-console */

import type { IHomebridgePluginUi } from '@homebridge/plugin-ui-utils/dist/ui.interface';
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
      menuDevices.classList.add('btn-elegant');
      menuDevices.classList.remove('btn-primary');
      menuSettings.classList.remove('btn-elegant');
      menuSettings.classList.add('btn-primary');
      pageDevices.style.display = 'block';
      homebridge.hideSchemaForm();
      settingsHelp.style.display = 'none';
      exitAddDevice.style.display = 'none';
      homebridge.hideSpinner();
    };
    const showSettings = () => {
      homebridge.showSpinner();
      menuDevices.classList.remove('btn-elegant');
      menuDevices.classList.add('btn-primary');
      menuSettings.classList.add('btn-elegant');
      menuSettings.classList.remove('btn-primary');
      pageDevices.style.display = 'none';
      homebridge.showSchemaForm();
      settingsHelp.style.display = 'block';
      exitAddDevice.style.display = 'none';
      homebridge.hideSpinner();
    };
    const showAddDevices = () => {
      homebridge.showSpinner();
      menuWrapper.style.display = 'none';
      homebridge.hideSchemaForm();
      settingsHelp.style.display = 'none';
      pageDevices.style.display = 'none';
      exitAddDevice.style.display = 'block';
      homebridge.hideSpinner();
      // create the form
      const myForm = homebridge.createForm(
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
      myForm.onSubmit((form) => {
        console.log(form);
        myForm.end();
        menuWrapper.style.display = 'inline-flex';
        showDevices();
      });
      // watch for cancel button click events
      myForm.onCancel(() => {
        homebridge.showSpinner();
        myForm.end();
        const myForm2 = homebridge.createForm(
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
        myForm2.onSubmit((form) => {
          console.log(form);
          myForm2.end();
          menuWrapper.style.display = 'inline-flex';
          showDevices();
        });
        // watch for cancel button click events
        myForm2.onCancel(() => {
          myForm.end();
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
      menuWrapper.style.display = 'inline-flex';
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