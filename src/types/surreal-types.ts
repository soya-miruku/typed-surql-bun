import { Constructor } from "./types.ts";

export type Result<T = unknown> = ResultOk<T> | ResultErr;
export type ResultOk<T> = {
    result: T;
    error?: never;
};
export type ResultErr = {
    result?: never;
    error: {
        code: number;
        message: string;
    };
};
export type QueryResult<T = unknown> = QueryResultOk<T> | QueryResultErr;
export type QueryResultOk<T> = {
    status: "OK";
    time: string;
    result: T;
    detail?: never;
};
export type QueryResultErr = {
    status: "ERR";
    time: string;
    result?: never;
    detail: string;
};
export type MapQueryResult<T> = {
    [K in keyof T]: QueryResult<T[K]>;
};
export type RawQueryResult = string | number | boolean | symbol | null | RawQueryResult[] | Record<string | number | symbol, unknown>;
export type LiveQueryClosureReason = "SOCKET_CLOSED" | "QUERY_KILLED";
export type LiveQueryResponse<T extends Record<string, unknown> = Record<string, unknown>> = {
    action: "CLOSE";
    result?: never;
    detail: LiveQueryClosureReason;
} | {
    action: "CREATE" | "UPDATE" | "DELETE";
    result: T;
    detail?: never;
};
export type UnprocessedLiveQueryResponse<T extends Record<string, unknown> = Record<string, unknown>> = LiveQueryResponse<T> & {
    id: string;
};
type BasePatch<T = string> = {
    path: T;
};
export type AddPatch<T = string, U = unknown> = BasePatch<T> & {
    op: "add";
    value: U;
};
export type RemovePatch<T = string> = BasePatch<T> & {
    op: "remove";
};
export type ReplacePatch<T = string, U = unknown> = BasePatch<T> & {
    op: "replace";
    value: U;
};
export type ChangePatch<T = string, U = string> = BasePatch<T> & {
    op: "change";
    value: U;
};
export type CopyPatch<T = string, U = string> = BasePatch<T> & {
    op: "copy";
    from: U;
};
export type MovePatch<T = string, U = string> = BasePatch<T> & {
    op: "move";
    from: U;
};
export type TestPatch<T = string, U = unknown> = BasePatch<T> & {
    op: "test";
    value: U;
};
export type Patch = AddPatch | RemovePatch | ReplacePatch | ChangePatch | CopyPatch | MovePatch | TestPatch;
export declare enum WebsocketStatus {
    OPEN = 0,
    CLOSED = 1,
    RECONNECTING = 2
}
export type InvalidSQL = {
    code: 400;
    details: "Request problems detected";
    description: "There is a problem with your request. Refer to the documentation for further information.";
    information: string;
};

type MaybePromise<T> = T | Promise<T>;
export type RawSocketMessageResponse = (Result & {
    id: number;
}) | RawSocketLiveQueryNotification;
export type RawSocketLiveQueryNotification = {
    result: UnprocessedLiveQueryResponse;
};

export type StatusHooks = {
    onConnect?: () => unknown;
    onClose?: () => unknown;
    onError?: () => unknown;
};

export type UseOptions = {
    namespace: string;
    database: string;
}

export type ActionResult<T extends Record<string, unknown>, U extends Record<string, unknown> = T> = T & U & {
    id: string;
};

export type SuperUserAuth = {
    username: string;
    password: string;
    namespace?: undefined;
    database?: undefined;
    scope?: undefined;
}

export type NamespaceAuth = {
    namespace: string;
    username: string;
    password: string;
    database?: undefined;
    scope?: undefined;
}
export type DatabaseAuth = {
    namespace: string;
    database: string;
    username: string;
    password: string;
    scope?: undefined;
}
export type ScopeAuth = {
    scope: string;
    namespace?: string | undefined;
    database?: string | undefined;
} & {
    [k: string]: unknown;
}

export type AnyAuth = {
    username: string;
    password: string;
    namespace?: undefined;
    database?: undefined;
    scope?: undefined;
} | {
    namespace: string;
    username: string;
    password: string;
    database?: undefined;
    scope?: undefined;
} | {
    namespace: string;
    database: string;
    username: string;
    password: string;
    scope?: undefined;
}
export type Token = string;

export type HTTPAuthenticationResponse = {
    code: 200;
    details: string;
    token: string;
} | {
    code: 403;
    details: string;
    description: string;
    information: string;
}

export interface Connection {
    constructor: Constructor<(hooks: StatusHooks) => void>;
    strategy: "ws" | "http";
    connect: (url: string, options?: ConnectionOptions) => void;
    ping: () => Promise<void>;
    use: (opt: {
        namespace: string;
        database: string;
    }) => MaybePromise<void>;
    info?: <T extends Record<string, unknown> = Record<string, unknown>>() => Promise<T | undefined>;
    signup: (vars: ScopeAuth) => Promise<Token>;
    // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
    signin: (vars: AnyAuth) => Promise<Token | void>;
    authenticate: (token: Token) => MaybePromise<boolean>;
    invalidate: () => MaybePromise<void>;
    let?: (variable: string, value: unknown) => Promise<void>;
    unset?: (variable: string) => Promise<void>;
    live?: <T extends Record<string, unknown>>(table: string, callback?: (data: LiveQueryResponse<T>) => unknown, diff?: boolean) => Promise<string>;
    listenLive?: <T extends Record<string, unknown>>(queryUuid: string, callback: (data: LiveQueryResponse<T>) => unknown) => Promise<void>;
    kill?: (queryUuid: string) => Promise<void>;
    query: <T extends RawQueryResult[]>(query: string | PreparedQuery, bindings?: Record<string, unknown>) => Promise<T>;
    query_raw: <T extends RawQueryResult[]>(query: string | PreparedQuery, bindings?: Record<string, unknown>) => Promise<MapQueryResult<T>>;
    select: <T extends Record<string, unknown>>(thing: string) => Promise<ActionResult<T>[]>;
    create: <T extends Record<string, unknown>, U extends Record<string, unknown> = T>(thing: string, data?: U) => Promise<ActionResult<T, U>[]>;
    insert?: <T extends Record<string, unknown>, U extends Record<string, unknown> = T>(thing: string, data?: U | U[]) => Promise<ActionResult<T, U>[]>;
    update: <T extends Record<string, unknown>, U extends Record<string, unknown> = T>(thing: string, data?: U) => Promise<ActionResult<T, U>[]>;
    merge: <T extends Record<string, unknown>, U extends Record<string, unknown> = Partial<T>>(thing: string, data?: U) => Promise<ActionResult<T, U>[]>;
    patch?: (thing: string, data?: Patch[]) => Promise<Patch[]>;
    delete: <T extends Record<string, unknown>>(thing: string) => Promise<ActionResult<T>[]>;
}

export type ConnectionOptions = {
    prepare?: (connection: Connection) => unknown;
    auth?: AnyAuth | Token;
} & (UseOptions | {
    namespace?: never;
    database?: never;
});

export declare class PreparedQuery {
    readonly query: string;
    readonly bindings: Record<string, unknown>;
    constructor(query: string, bindings?: Record<string, unknown>);
}
