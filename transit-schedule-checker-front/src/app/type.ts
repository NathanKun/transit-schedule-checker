export class Type {
  static readonly RER = new Type('RERS', 'rers', true);
  static readonly METRO = new Type('METRO', 'metros', true);
  static readonly BUS = new Type('BUS', 'bus', false);
  static readonly TRAMWAY = new Type('TRAMWAY', 'tramways', true);
  static readonly NOCTILIEN = new Type('NOCTILIEN', 'noctiliens', false);

  constructor(private key: string, public readonly name: string, public readonly hasTrafic: boolean) {
  }

  toString() {
    return this.key;
  }
}
