const controller = new AbortController();

type Resolver = () => void;
export abstract class SteppedRunner {
  waitForStep: Promise<void>;
  resolver?: Resolver;

  constructor() {
    this.waitForStep = new Promise((res) => {
      this.resolver = res;
    });
  }

  // This function doesn't actually do anything particularly async it self, but you need to await it to use it, or it won't work, so it's asnyc to prevent users from being yelled at.
  async step() {
    this.waitForStep = new Promise((res) => {
      const oldResolver = this.resolver;
      this.resolver = res;
      if (oldResolver) {
        oldResolver();
      }
    });
  }

  cleanUp() {
    controller.abort(this.waitForStep);
    controller.abort(this.run);
  }

  abstract run(): Promise<void>;
}
