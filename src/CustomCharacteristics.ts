import { Formats, Perms } from 'homebridge';


import type { HAP } from 'homebridge';

export default function CustomCharacteristics(hap: HAP): { EnergyUsage; PanelStatus; } {
  const Characteristic = hap.Characteristic;
  class EnergyUsage extends Characteristic {
    static readonly UUID: string = '00000101-0000-0000-0000-000000000000';
    constructor() {
      super('Energy Usage', EnergyUsage.UUID, {
        format: Formats.FLOAT,
        maxValue: 15,
        minValue: 0,
        minStep: 0.1,
        unit: 'Amps',
        perms: [Perms.PAIRED_READ, Perms.NOTIFY],
      });
      this.value = this.getDefaultValue();
    }
  }
  class PanelStatus extends Characteristic {
    static readonly UUID: string = '00000102-0000-0000-0000-000000000000';
    constructor() {
      super('Status', PanelStatus.UUID, {
        format: Formats.STRING,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY],
      });
      this.value = this.getDefaultValue();
    }
  }
  return { EnergyUsage, PanelStatus };
}