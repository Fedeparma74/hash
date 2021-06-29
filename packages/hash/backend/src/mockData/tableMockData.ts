import { Visibility } from "../graphql/autoGeneratedTypes";
import { DbUnknownEntity } from "../types/dbTypes";
import { randomTimes } from "./util";

const london: DbUnknownEntity = {
  id: "place1",
  type: "Location",
  properties: {
    country: "UK",
    name: "London",
  },
  namespaceId: "2",
  createdById: "2",
  visibility: Visibility.Public,
  ...randomTimes(),
};

const HASH: DbUnknownEntity = {
  properties: {
    name: "HASH",
    url: "https://hash.ai",
    location: {
      __linkedData: {
        entityType: "Location",
        entityId: "place1",
      },
    },
    website: {
      url: "https://hash.ai",
    },
  },
  id: "c1",
  type: "Company",
  namespaceId: "2",
  createdById: "2",
  visibility: Visibility.Public,
  ...randomTimes(),
};

const people: DbUnknownEntity[] = [
  {
    id: "p1",
    type: "Person",
    properties: {
      email: "aj@hash.ai",
      employer: {
        __linkedData: {
          entityType: "Company",
          entityId: "c1",
        },
      },
    },
    namespaceId: "2",
    createdById: "2",
    visibility: Visibility.Public,
    ...randomTimes(),
  },
  {
    properties: {
      email: "c@hash.ai",
      employer: {
        __linkedData: {
          entityType: "Company",
          entityId: "c1",
        },
      },
    },
    id: "p2",
    type: "Person",
    namespaceId: "2",
    createdById: "2",
    visibility: Visibility.Public,
    ...randomTimes(),
  },
  {
    properties: {
      email: "d@hash.ai",
      employer: {
        __linkedData: {
          entityType: "Company",
          entityId: "c1",
        },
      },
    },
    namespaceId: "2",
    createdById: "2",
    visibility: Visibility.Public,
    ...randomTimes(),
    id: "p3",
    type: "Person",
  },
  {
    properties: {
      email: "ef@hash.ai",
      employer: {
        __linkedData: {
          entityType: "Company",
          entityId: "c1",
        },
      },
    },
    id: "p4",
    type: "Person",
    namespaceId: "2",
    createdById: "2",
    visibility: Visibility.Public,
    ...randomTimes(),
  },
  {
    properties: {
      email: "nh@hash.ai",
      employer: {
        __linkedData: {
          entityType: "Company",
          entityId: "c1",
        },
      },
    },
    id: "p5",
    type: "Person",
    namespaceId: "2",
    createdById: "2",
    visibility: Visibility.Public,
    ...randomTimes(),
  },
];

const tableData: DbUnknownEntity = {
  id: "t1",
  type: "Table",
  namespaceId: "2",
  createdById: "2",
  visibility: Visibility.Public,
  ...randomTimes(),
  properties: {
    initialState: {
      hiddenColumns: [
        "id",
        "employerId",
        "employer.locationId",
        "employer.id",
        "employer.location.id",
      ],
    },
    data: {
      __linkedData: {
        entityType: "Person",
        aggregate: {
          perPage: 5,
          sort: "createdAt",
        },
      },
    },
  },
};

export const tableMockData = [...people, HASH, london, tableData];
