import GraphQLJSON from "graphql-type-json";

import { Entity } from "../apiTypes.gen";
// import { entityAccountName } from "./shared/account";
import {
  aggregateEntity,
  createEntity,
  entity,
  entityFields,
  updateEntity,
} from "./entity";
import { blockFields } from "./block";
import {
  createPage,
  insertBlockIntoPage,
  insertBlocksIntoPage,
  accountPages,
  page,
  pageFields,
  updatePage,
} from "./pages";
import { accounts } from "./account/accounts";
import { createUser } from "./shared/createUser";
import { updateUser } from "./user/updateUser";
import { createOrg } from "./shared/createOrg";
import { verifyEmail } from "./user/verifyEmail";
import { sendLoginCode } from "./user/sendLoginCode";
import { loginWithLoginCode } from "./user/loginWithLoginCode";
import { embedCode } from "./embed";

import { GraphQLContext, LoggedInGraphQLContext } from "../context";
import { ForbiddenError } from "apollo-server-express";
import { logout } from "./user/logout";
import { me } from "./user/me";
import { createEntityType } from "./entity/createEntityType";

const KNOWN_ENTITIES = ["Page", "Text", "User"];

const loggedIn =
  (next: any) => (obj: any, args: any, ctx: GraphQLContext, info: any) => {
    if (!ctx.user) {
      throw new ForbiddenError("You must be logged in to perform this action.");
    }
    return next(obj, args, ctx, info);
  };

const signedUp =
  (next: any) =>
  (obj: any, args: any, ctx: LoggedInGraphQLContext, info: any) => {
    if (!ctx.user.isAccountSignupComplete())
      throw new ForbiddenError(
        "You must complete the sign-up process to perform this action."
      );
    return next(obj, args, ctx, info);
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const loggedInAndSignedUp =
  (next: any) => (obj: any, args: any, ctx: GraphQLContext, info: any) =>
    loggedIn(signedUp(next))(obj, args, ctx, info);

export const resolvers = {
  Query: {
    accountPages,
    accounts,
    aggregateEntity,
    entity,
    page,
    me: loggedIn(me),
    embedCode,
  },

  Mutation: {
    createEntity,
    createEntityType,
    createPage,
    insertBlockIntoPage,
    insertBlocksIntoPage,
    updateEntity,
    updatePage,
    createUser,
    createOrg,
    updateUser: loggedIn(updateUser),
    verifyEmail,
    sendLoginCode,
    loginWithLoginCode,
    logout: loggedIn(logout),
  },

  JSONObject: GraphQLJSON,

  BlockProperties: {
    entity: blockFields.entity,
  },

  PageProperties: {
    contents: pageFields.contents,
  },

  UnknownEntity: {
    properties: entityFields.properties,
  },

  Entity: {
    __resolveType(entity: Entity) {
      if (KNOWN_ENTITIES.includes(entity.entityTypeName)) {
        return entity.entityTypeName;
      }
      return "UnknownEntity";
    },
    history: entityFields.history,
  },

  Account: {
    __resolveType(entity: Entity) {
      return entity.entityTypeName;
    },
  },
};
