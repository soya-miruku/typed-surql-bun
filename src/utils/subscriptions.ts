import { Constructor } from "type-fest";
import { LiveQueryResponse } from "../types/surreal-types";
import EventEmitter from "events";
import { Model } from "../model";
import { Static } from "../exports";
import { sleep } from "./helper";
import { FunctionType, KeyofRecs, ModelKeysDot, TransformFetches } from "../types";
import { LiveOptions } from "../types/model-types";

export type ExtractModelClass<T extends Model> = T extends Constructor<Model> ? T : never;

export class SubscriptionAsyncIterator<SubModel extends Model,
  Fetch extends ModelKeysDot<Pick<SubModel, ModelKeys> & Model>,
  ModelKeys extends KeyofRecs<SubModel> = KeyofRecs<SubModel>,
  ResultType = LiveQueryResponse<TransformFetches<SubModel, Fetch>>
> implements AsyncIterator<ResultType | undefined> {
  private readonly emitter;
  public isSubscribed = false;
  private current: ResultType | undefined;
  private uuid: string | undefined;
  private initilised = false;
  constructor(private readonly model: Constructor<SubModel>, private readonly _opts?: LiveOptions<SubModel, ModelKeys, Fetch>) {
    this.emitter = new EventEmitter();
  }

  async waitForData() {
    return new Promise((resolve) => {
      this.emitter.once('dataAvailable', resolve);
    });
  }

  public async next(): Promise<IteratorResult<ResultType | undefined, any>> {
    if (!this.isSubscribed && this.initilised) return { value: undefined, done: true };
    await this.waitForData();
    return { value: this.current, done: false };
  }

  public async return(): Promise<IteratorResult<ResultType, any>> {
    if (this.uuid)
      await (this.model as unknown as typeof Model).kill(this.uuid);
    this.isSubscribed = false;
    return { value: undefined, done: true };
  }

  public throw(e: Error): Promise<IteratorResult<ResultType, any>> {
    console.error(e);
    this.return();
    return Promise.resolve({ value: undefined, done: true });
  }

  public [Symbol.asyncIterator]() {
    // @ts-ignore
    (this.model as unknown as typeof Model).live<SubModel, Fetch, ModelKeys>((data) => {
      if ((this._opts?.methods && this._opts.methods !== "*") && !this._opts.methods.includes(data.action)) return;
      this.current = data as ResultType;
      this.emitter.emit('dataAvailable');
    }, this?._opts).then((uuid) => {
      this.uuid = uuid;
      this.isSubscribed = true;
      this.initilised = true;
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