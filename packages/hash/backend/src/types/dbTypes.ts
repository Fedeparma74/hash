import {
  Block,
  BlockProperties,
  Org,
  Page,
  UnknownEntity,
  User,
} from "../graphql/autoGeneratedTypes";

// These are mock types for quick prototyping
// The real types will need to be synced with the db schema
// Not based on the GraphQL schema types

export type DbEntity = DbBlock | DbPage | DbUnknownEntity | DbUser | DbOrg;

export type DbBlock = Omit<Block, "createdBy" | "entity" | "namespace" | "properties"> & {
  createdById: string;
  properties: Omit<BlockProperties, "entity">;
};

export type DbPage = Omit<
  Page,
  "properties" | "namespace" | "createdBy" | "type"
> & {
  properties: Omit<Page["properties"], "contents"> & { contents: DbBlock[] };
  createdById: string;
  type: "Page";
};

export type DbUnknownEntity = Omit<
  UnknownEntity,
  "namespace" | "createdBy" | "type" | "__typename"
> & {
  createdById: string;
  type: string;
  __typename?: string;
};

export type DbUser = Omit<User, "type"> & { type: "User" };

export type DbOrg = Omit<Org, "type"> & { type: "Org" };
