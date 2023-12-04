import { Type, TProperties, Static, TObject } from "@sinclair/typebox";

export type ScopeType = "DATABASE" | "NAMESPACE" | "SCOPE";
export type AlgoType = "HS512" | "HS256" | "HS384" | "RS256" | "RS384" | "RS512" | "ES256" | "ES384" | "ES512" | "PS256" | "PS384" | "PS512";

export const defaultTokenAuthProps = Type.Object({
  id: Type.String(),
  exp: Type.Number(),
  iat: Type.Optional(Type.Number()),
  tk: Type.String(),
  db: Type.String(),
})

export const extendedTokenAuth = <T extends TProperties>(props: T) => Type.Intersect([defaultTokenAuthProps, Type.Object(props)]);
export type DefaultTokenAuthProps = Static<typeof defaultTokenAuthProps>;
export type AsType<T extends TProperties | undefined> = Static<TObject<T extends undefined ? {} : T>>
export type ExtendedTokenAuth<T extends TProperties | undefined> = AsType<T> & DefaultTokenAuthProps;
export type TokenAuthType<T extends Record<string, unknown> | undefined> = DefaultTokenAuthProps & T;