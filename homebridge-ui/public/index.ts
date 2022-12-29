/* eslint-disable no-console */

import type { IHomebridgePluginUi } from '@homebridge/plugin-ui-utils/dist/ui.interface';
declare const homebridge: IHomebridgePluginUi;

//Intro Elements
const pageIntro = document.getElementById('pageIntro') as HTMLDivElement;
const introContinue = document.getElementById('introContinue') as HTMLButtonElement;
//Settings Elements
const menuSettings = document.getElementById('menuSettings') as HTMLButtonElement;
const pageSettings = document.getElementById('pageSettings') as HTMLDivElement;
//Devices Elements
const menuDevices = document.getElementById('menuDevices') as HTMLButtonElement;
const pageDevices = document.getElementById('pageDevices') as HTMLDivElement;
const deviceAdd = document.getElementById('deviceAdd') as HTMLButtonElement;

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
      pageSettings.style.display = 'none';
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
      pageSettings.style.display = 'block';
      homebridge.hideSpinner();
    };
    const showAddDevices = () => {
      homebridge.showSpinner();
      menuWrapper.style.display = 'none';
      homebridge.hideSchemaForm();
      pageSettings.style.display = 'none';
      pageDevices.style.display = 'none';
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
                condition: {
                  functionBody: 'return !model.manual',
                },
              },
              password: {
                title: 'Password',
                type: 'string',
                required: true,
                condition: {
                  functionBody: 'return !model.manual',
                },
              },
              manual: {
                title: 'Configure Manually',
                type: 'boolean',
                required: false,
              },
              ip: {
                title: 'Ip Address',
                type: 'string',
                required: true,
                condition: {
                  functionBody: 'return model.manual',
                },
              },
            },
          },
          layout: null,
          form: null,
        },
        {}, 'Get Devices', 'Cancel',
      );

      // watch for submit button click events
      myForm.onSubmit((form) => {
        console.log(form);
        myForm.end();
        showDevices();
      });

      // watch for cancel button click events
      myForm.onCancel(() => {
        myForm.end();
        showDevices();
      });
      homebridge.hideSpinner();
    };
    menuDevices.addEventListener('click', () => showDevices());
    menuSettings.addEventListener('click', () => showSettings());
    deviceAdd.addEventListener('click', () => showAddDevices());

    if (currentConfig.length) {
      menuWrapper.style.display = 'inline-flex';
      showSettings();
    } else {
      currentConfig.push({ name: 'iRobot' });
      await homebridge.updatePluginConfig(currentConfig);
      showIntro();
    }
  } catch (err) {
    homebridge.toast.error(err.message, 'Error');
  } finally {
    homebridge.hideSpinner();
  }
})();