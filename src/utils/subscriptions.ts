import { Constructor } from "type-fest";
import { LiveQueryResponse } from "../types/surreal-types";
import EventEmitter from "events";
import { Model } from "../model";
import { KeyofRecs, ModelKeysDot, TransformFetches } from "../types";
import { LiveOptions } from "../types/model-types";
import { $$asyncIterator } from 'iterall';

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

  public [$$asyncIterator]() {
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
