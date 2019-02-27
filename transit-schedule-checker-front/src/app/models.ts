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
  type: Type;
  line: Transport;
  station: Station;
  destination: Destination;
}

export class Type {
  static readonly RER = new Type('RERS', 'rers', true);
  static readonly METRO = new Type('METRO', 'metros', true);
  static readonly BUS = new Type('BUS', 'bus', false);
  static readonly TRAMWAY = new Type('TRAMWAY', 'tramways', true);
  static readonly NOCTILIEN = new Type('NOCTILIEN', 'noctiliens', false);

  static readonly types: Type[] = [Type.METRO, Type.BUS, Type.RER, Type.TRAMWAY, Type.NOCTILIEN];

  static getTypeByName(name: string) {
    for (const type of Type.types) {
      if (type.name === name) {
        return type;
      }
    }

    throw new Error('given name "' + name + '" is not a Type');
  }

  constructor(private key: string, public readonly name: string, public readonly hasTrafic: boolean) {
  }

  toString() {
    return this.key;
  }

}
