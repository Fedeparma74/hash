import { getRequiredEnv } from "@hashintel/hash-backend-utils/environment";
import {
  createGraphClient,
  ensureSystemGraphIsInitialized,
} from "@hashintel/hash-api/src/graph";
import { Logger } from "@hashintel/hash-backend-utils/logger";

import { DataType, TypeSystemInitializer } from "@blockprotocol/type-system";
import { UserModel } from "@hashintel/hash-api/src/model";
import {
  createDataType,
  getDataTypeById,
  updateDataType,
} from "@hashintel/hash-api/src/graph/ontology/primitive/data-type";
import { DataTypeWithMetadata } from "@hashintel/hash-subgraph";
import { AccountId, OwnedById } from "@hashintel/hash-shared/types";

import { createTestUser } from "../../../util";

jest.setTimeout(60000);

const logger = new Logger({
  mode: "dev",
  level: "debug",
  serviceName: "integration-tests",
});

const graphApiHost = getRequiredEnv("HASH_GRAPH_API_HOST");
const graphApiPort = parseInt(getRequiredEnv("HASH_GRAPH_API_PORT"), 10);

const graphApi = createGraphClient(logger, {
  host: graphApiHost,
  port: graphApiPort,
});

let testUser: UserModel;
let testUser2: UserModel;

// we have to manually specify this type because of 'intended' limitations of `Omit` with extended Record types:
//  https://github.com/microsoft/TypeScript/issues/50638
//  this is needed for as long as DataType extends Record
const dataTypeSchema: Pick<
  DataType,
  "kind" | "title" | "description" | "type"
> &
  Record<string, any> = {
  kind: "dataType",
  title: "Text",
  type: "string",
};

beforeAll(async () => {
  await TypeSystemInitializer.initialize();
  await ensureSystemGraphIsInitialized({ graphApi, logger });

  testUser = await createTestUser(graphApi, "data-type-test-1", logger);
  testUser2 = await createTestUser(graphApi, "data-type-test-2", logger);
});

describe("Data type CRU", () => {
  let createdDataType: DataTypeWithMetadata;

  it("can create a data type", async () => {
    createdDataType = await createDataType(
      { graphApi },
      {
        ownedById: testUser.getEntityUuid() as OwnedById,
        schema: dataTypeSchema,
        actorId: testUser.getEntityUuid() as AccountId,
      },
    );
  });

  it("can read a data type", async () => {
    const fetchedDataType = await getDataTypeById(
      { graphApi },
      {
        dataTypeId: createdDataType.schema.$id,
      },
    );

    expect(fetchedDataType.schema).toEqual(createdDataType.schema);
  });

  const updatedTitle = "New text!";
  it("can update a data type", async () => {
    expect(createdDataType.metadata.provenance.updatedById).toBe(
      testUser.getEntityUuid(),
    );

    createdDataType = await updateDataType(
      { graphApi },
      {
        dataTypeId: createdDataType.schema.$id,
        schema: { ...dataTypeSchema, title: updatedTitle },
        actorId: testUser2.getEntityUuid() as AccountId,
      },
    ).catch((err) => Promise.reject(err.data));

    expect(createdDataType.metadata.provenance.updatedById).toBe(
      testUser2.getEntityUuid(),
    );
  });
});
