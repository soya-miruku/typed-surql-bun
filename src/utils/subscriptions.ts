import { Constructor } from "type-fest";
import { LiveQueryResponse } from "../types/surreal-types";
import EventEmitter from "events";
import { Model } from "../model";
import { KeyofRecs, ModelKeysDot, TransformFetches } from "../types";
import { LiveOptions } from "../types/model-types";
import { $$asyncIterator } from 'iterall';
import { sleep } from "./helper";

export type ExtractModelClass<T extends Model> = T extends Constructor<Model> ? T : never;

export class SurrealAsyncIterator<SubModel extends Model, Fetch extends ModelKeysDot<Pick<SubModel, ModelKeys> & Model>, ModelKeys extends KeyofRecs<SubModel> = KeyofRecs<SubModel>, ResultType = LiveQueryResponse<TransformFetches<SubModel, Fetch>>,
  TReturn = any,
  TNext = undefined
> implements AsyncIterator<ResultType | undefined> {
  private readonly emitter;
  public isSubscribed = false;
  private current: ResultType | undefined;
  private uuid: string | undefined;
  private initilised = false;
  constructor(private readonly model: Constructor<SubModel>, private readonly _opts?: LiveOptions<SubModel, ModelKeys, Fetch>) {
    this.emitter = new EventEmitter();
  }

  public newData(data: ResultType) {
    this.current = data;
    this.emitter.emit('dataAvailable');
  }

  public init(uuid: string) {
    if (!uuid) throw new Error("uuid is undefined");
    this.uuid = uuid;
    this.isSubscribed = true;
    this.initilised = true;
  }

  async waitForData() {
    return new Promise((resolve) => {
      this.emitter.once("end", resolve);
      this.emitter.once('dataAvailable', resolve);
    });
  }

  public async next() {
    if (!this.isSubscribed && this.initilised) return this.return();
    await this.waitForData();
    return { value: this.current, done: false };
  }

  public async return(value?: TReturn | PromiseLike<TReturn>) {
    console.log("returning", this.uuid);
    if (this.uuid && this.isSubscribed) {
      await (this.model as unknown as typeof Model).kill(this.uuid);
      this.emitter.emit('end');
      await sleep(50);
      this.emitter.removeAllListeners();
    }

    this.isSubscribed = false;
    return { value: undefined, done: true };
  }

  public throw(e: Error) {
    console.error(e);
    this.return();
    return Promise.resolve({ value: undefined, done: true });
  }

  public [$$asyncIterator]() {
    return this;
  }
}

export class SubscriptionAsyncIterable<SubModel extends Model,
  Fetch extends ModelKeysDot<Pick<SubModel, ModelKeys> & Model>,
  ModelKeys extends KeyofRecs<SubModel> = KeyofRecs<SubModel>, ResultType = LiveQueryResponse<TransformFetches<SubModel, Fetch>>> implements AsyncIterable<ResultType | undefined>{
  private readonly sub: SurrealAsyncIterator<SubModel, Fetch, ModelKeys, ResultType>;
  constructor(private readonly model: Constructor<SubModel>, private readonly _opts?: LiveOptions<SubModel, ModelKeys, Fetch>) {
    this.sub = new SurrealAsyncIterator<SubModel, Fetch, ModelKeys, ResultType>(model, _opts);
  }

  public get isSubscribed() {
    return this.sub.isSubscribed;
  }

  public async stop() {
    return await this.sub.return();
  }

  [Symbol.asyncIterator](): SurrealAsyncIterator<SubModel, Fetch, ModelKeys, ResultType> {
    const model = this.model as unknown as typeof Model & Constructor<SubModel>;
    console.log("subscribing", model);

    (model).live<SubModel, Fetch, ModelKeys>((data) => {
      if ((this._opts?.methods && this._opts.methods !== "*") && !this._opts.methods.includes(data.action)) return;
      this.sub.newData(data as ResultType);
    }, this?._opts).then((uuid) => {
      this.sub.init(uuid);
    });

    return this.sub;
  }
}
