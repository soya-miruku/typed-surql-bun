import EventEmitter from 'events';
import { FunctionType } from '..';
import { PubSubAsyncIterator } from './async-iterator';

export abstract class PubSubEngine extends EventEmitter {
  public abstract publish(triggerName: string, payload: any): Promise<void>;
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  public abstract subscribe(triggerName: string, onMessage: Function, options: object): Promise<number>;
  public abstract unsubscribe(subId: number): void;
  public asyncIterator<T>(triggers: string | string[]): AsyncIterator<T> {
    return new PubSubAsyncIterator<T>(this, triggers);
  }
}