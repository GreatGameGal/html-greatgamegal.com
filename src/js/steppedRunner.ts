type Resolver = (code: number) => void;
export abstract class SteppedRunner {
  waitForStep: Promise<number>;
  resolver?: Resolver;

  constructor() {
    this.waitForStep = new Promise((res) => {
      this.resolver = res;
    });
  }

  // This function doesn't actually do anything particularly async awaity itself, but you need to await it to use it, or it won't work, so it's asnyc to prevent users from being yelled at by their editor for awaiting it.
  async step() {
    const { promise, resolve } = Promise.withResolvers();
    const oldResolver = this.resolver;
    this.waitForStep = promise as Promise<number>;
    this.resolver = resolve;
    oldResolver?.(0);
  }

  async cleanUp() {
    const { promise, resolve } = Promise.withResolvers();
    this.resolver?.(1);
    this.waitForStep = promise as Promise<number>;
    this.resolver = resolve;
  }

  abstract run(): Promise<void>;
}
