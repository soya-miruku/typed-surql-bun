import { Constructor } from "type-fest";
import { LiveQueryResponse } from "../types/surreal-types";
import EventEmitter from "events";
import { Model } from "../model";
import { Static } from "../exports";
import { sleep } from "./helper";

export class SubscriptionAsyncIterator<SubModel extends Model> implements AsyncIterator<LiveQueryResponse<Static<SubModel>> | undefined> {
  private readonly emitter;
  public isSubscribed = false;
  private current: LiveQueryResponse<Static<SubModel>> | undefined;
  private uuid: string | undefined;
  private initilised = false;
  constructor(private readonly model: Constructor<SubModel>, private readonly _opts?: { filter?: LiveQueryResponse['action'], diff?: boolean }) {
    this.emitter = new EventEmitter();
  }

  async waitForData() {
    return new Promise((resolve) => {
      this.emitter.once('dataAvailable', resolve);
    });
  }

  public async next(): Promise<IteratorResult<LiveQueryResponse<Static<SubModel>> | undefined, any>> {
    if (!this.isSubscribed && this.initilised) return { value: undefined, done: true };
    await this.waitForData();
    return { value: this.current, done: false };
  }

  public async return(): Promise<IteratorResult<LiveQueryResponse<Static<SubModel>>, any>> {
    console.log(`Unsubscribed from ${(this.model as unknown as typeof Model).name} @ ${this.uuid}`);
    if (this.uuid)
      await (this.model as unknown as typeof Model).kill(this.uuid);
    this.isSubscribed = false;
    return { value: undefined, done: true };
  }

  public throw(e: Error): Promise<IteratorResult<LiveQueryResponse<Static<SubModel>>, any>> {
    console.error(e);
    this.return();
    return Promise.resolve({ value: undefined, done: true });
  }

  public [Symbol.asyncIterator]() {
    (this.model as unknown as typeof Model).live((data) => {
      if (this._opts?.filter && data.action !== this._opts.filter) return;

      this.current = data as LiveQueryResponse<Static<SubModel>>;
      this.emitter.emit('dataAvailable');

    }, this._opts?.diff).then((uuid) => {
      this.uuid = uuid;
      this.isSubscribed = true;
      this.initilised = true;
      console.log(`Subscribed to ${(this.model as unknown as typeof Model).name} @ ${this.uuid}`);
    });
    return this;
  }

}

export class Subscriber<SubModel extends Model> extends EventEmitter {
  constructor(private readonly model: SubModel) {
    super();
  }
  private current: LiveQueryResponse<Static<SubModel>> | undefined;
  private uuid: string | undefined;
  public isSubscribed = false;

  async *subscriber() {
    this.uuid = await (this.model as unknown as typeof Model).live((data) => {
      this.current = data as LiveQueryResponse<Static<SubModel>>;
      this.emit('dataAvailable');
    });

    console.log(`Subscribed to ${(this.model as unknown as typeof Model).name} @ ${this.uuid}`)
    while (this.isSubscribed) {
      await this.waitForData();
      yield this.current;
      this.current = undefined;
      await sleep(48);
    }
  }

  async waitForData() {
    return new Promise((resolve) => {
      this.once('dataAvailable', resolve);
    });
  }

  subscribe() {
    this.isSubscribed = true;
    return this.subscriber();
  }

  unsubscribe() {
    this.isSubscribed = false;
    if (this.uuid)
      (this.model as unknown as typeof Model).kill(this.uuid);
  }

  [Symbol.asyncIterator]() {
    return new SubscriptionAsyncIterator(this.model as unknown as typeof Model);
  }
}