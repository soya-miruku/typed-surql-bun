import { Constructor } from "type-fest";
import { Value } from "@sinclair/typebox/value";
import { Type, Static, TProperties } from '@sinclair/typebox'
import { FnBody, Instance, SQL, fx } from "./utils/query.ts";
import { TokenAuthType, defaultTokenAuthProps } from "./token.ts";
import { IModel } from "./types/types.ts";
import { qlFn } from "./functions/index.ts";
import TypedSurQL from "./client.ts";

export type TSurrealPermissionOperation = 'CREATE' | 'UPDATE' | 'DELETE' | 'SELECT';
export type TPermissionMultiple = [TSurrealPermissionOperation | TSurrealPermissionOperation[], | "NONE" | "FULL" | SQL];

export const defaultAuthProps = Type.Object({
	id: Type.String(),
	admin: Type.Boolean(),
});

export type DefaultAuthProps = Static<typeof defaultAuthProps>;
export const extendedAuth = <T extends TProperties>(props: T) => Type.Intersect([defaultAuthProps, Type.Object(props)]);

// export function Define<SubModel extends IModel,
// 	TokenType extends Record<string, unknown>,
// 	ScopeName extends string, AuthType extends Record<string, unknown>>(model: Constructor<SubModel>, opts?: { token?: TokenAuthType<TokenType>, scope?: { name: ScopeName }, auth?: DefaultAuthProps & AuthType }, query?: string[]) {
// 	return {
// 		Permissions: (type: TSurrealPermissionOperation | TSurrealPermissionOperation[], perm: "NONE" | "ALL" | ((fn: FnBody<Instance<Constructor<SubModel>>> & { $token: TokenType, $scope: ScopeName, $auth: AuthType }) => SQL)) => {
// 			const xer = Permissions.Of(model, opts ?? {}).for(type, perm);
// 			return Define(model, opts, [...(query ?? []), xer.toString()]);
// 		}
// 	}
// }

export class Permissions<SubModel extends IModel, TokenType extends TokenAuthType<Record<string, unknown>> = TokenAuthType<Record<string, unknown>>, ScopeName extends string = string, AuthType extends DefaultAuthProps & Record<string, unknown> = DefaultAuthProps & Record<string, unknown>>{
	private query: SQL[] = [];
	constructor(public readonly model: Constructor<SubModel>, public readonly tokenType?: TokenType, public readonly scope?: ScopeName, public readonly auth?: AuthType) {
		this.query.push(SQL.Create(["", "PERMISSIONS"]))
	}

	public static Of<SubModel extends IModel,
		TokenType extends Record<string, unknown>,
		ScopeName extends string, AuthType extends Record<string, unknown>>(model: Constructor<SubModel>, opts: { token?: TokenAuthType<TokenType>, scope?: { name: ScopeName }, auth?: DefaultAuthProps & AuthType }) {
		return new Permissions(model, opts.token, opts.scope?.name, opts.auth);
	}

	public for<Ins = Instance<Constructor<SubModel>>>(type: TSurrealPermissionOperation | TSurrealPermissionOperation[], perm: "NONE" | "ALL" | ((fn: FnBody<Ins> & { $token: TokenType, $scope: ScopeName, $auth: AuthType }) => SQL)) {
		const fnBody = TypedSurQL.createFnBody(this.model);
		const tokenObj = Object.entries(this.tokenType ?? Value.Create(defaultTokenAuthProps as any)).reduce((acc, [k, v]) => {
			acc[k] = fx.val(`$token.${k}`);
			return acc;
		}, {} as Record<string, qlFn>);

		const authObj = Object.entries(this.auth ?? Value.Create(defaultAuthProps)).reduce((acc, [k, v]) => {
			acc[k] = fx.val(`$auth.${k}`);
			return acc;
		}, {} as Record<string, qlFn>);

		const extendedFnBody = Object.assign(fnBody, { $token: tokenObj, $scope: fx.val("$scope" ?? ""), $auth: authObj }) as any;
		let condition: string | SQL = "";
		if (typeof perm === "string") {
			condition = perm;
		} else {
			condition = perm(extendedFnBody);
			condition = condition.toString().includes("WHERE") ? condition : `WHERE ${condition}`;
		}
		const query = SQL.Create(["", `FOR ${Array.isArray(type) ? type.join(", ") : type} ${condition}`]);
		this.query.push(query);
		return this;
	}

	public toString() {
		return this.query.join("\n");
	}
}
