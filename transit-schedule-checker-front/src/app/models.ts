export class Destination {
  name: string;
  way: string;
}

export class Station {
  slug: string;
  name: string;
}

export class Transport {
  type: Type;
  id: string;
  code: string;
  name: string;
  directions: string;
}

export class Schedule {
  message: string;
  destination: string;
}

export class Record {
  type: Type;
  line: Transport;
  station: Station;
  destination: Destination;
  schedules: Schedule[];

  isValid(): boolean {
    if (!!this.type && !!this.line && !!this.station && !!this.destination) {
      return true;
    }

    return false;
  }
}

export class Type {
  static readonly RER = new Type('RERS', 'rers', true, 'RER');
  static readonly METRO = new Type('METRO', 'metros', true, 'Metro');
  static readonly BUS = new Type('BUS', 'bus', false, 'Bus');
  static readonly TRAMWAY = new Type('TRAMWAY', 'tramways', true, 'Tramway');
  static readonly NOCTILIEN = new Type('NOCTILIEN', 'noctiliens', false, 'Noctilien');

  static readonly types: Type[] = [Type.METRO, Type.BUS, Type.RER, Type.TRAMWAY, Type.NOCTILIEN];

  static getTypeByName(name: string) {
    for (const type of Type.types) {
      if (type.name === name) {
        return type;
      }
    }

    throw new Error('given name "' + name + '" is not a Type');
  }

  constructor(private key: string, public readonly name: string, public readonly hasTrafic: boolean, public readonly prettyName: string) {
  }

  toString() {
    return this.key;
  }

}
