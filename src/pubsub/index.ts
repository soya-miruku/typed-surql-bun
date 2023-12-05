import { EventEmitter } from 'events';
import { PubSubEngine } from './engine';

export interface PubSubOptions {
  eventEmitter?: EventEmitter;
}

export class PubSub extends PubSubEngine {
  private subscriptions: { [key: string]: [string, (...args: any[]) => void] };
  private subIdCounter: number;

  constructor(options: PubSubOptions = {}) {
    super();
    this.subscriptions = {};
    this.subIdCounter = 0;
  }

  public publish(triggerName: string, payload: any): Promise<void> {
    this.emit(triggerName, payload);
    return Promise.resolve();
  }

  public subscribe(triggerName: string, onMessage: (...args: any[]) => void): Promise<number> {
    this.addListener(triggerName, onMessage);
    this.subIdCounter = this.subIdCounter + 1;
    this.subscriptions[this.subIdCounter] = [triggerName, onMessage];

    return Promise.resolve(this.subIdCounter);
  }

  public unsubscribe(subId: number) {
    const [triggerName, onMessage] = this.subscriptions[subId];
    delete this.subscriptions[subId];
    this.removeListener(triggerName, onMessage);
  }
}