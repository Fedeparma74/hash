import { DbOrg, DbPage, DbUnknownEntity, DbUser } from "src/types/dbTypes";
import { Visibility } from "../graphql/autoGeneratedTypes";
import { namespaces } from "./namespaces";
import { pages } from "./pages";
import { randomTimes } from "./util";
import { tableMockData } from "../mockData/tableMockData";

export const entities: (DbUnknownEntity | DbPage | DbUser | DbOrg)[] = (() => {
  const entityData = [
    ...pages,
    ...namespaces,
    ...tableMockData,
    {
      id: "text1",
      type: "Text",
      namespaceId: "2",
      createdById: "2",
      ...randomTimes(),
      properties: {
        text: "Ciaran's Header Text",
        bold: true,
      },
      visibility: Visibility.Public,
    },
    {
      id: "text2",
      type: "Text",
      namespaceId: "2",
      createdById: "2",
      ...randomTimes(),
      properties: {
        text: "A paragraph of regular text",
      },
      visibility: Visibility.Public,
    },
    {
      id: "text3",
      type: "Text",
      namespaceId: "2",
      createdById: "2",
      ...randomTimes(),
      properties: {
        text: "A paragraph of italic text",
        italic: true,
      },
      visibility: Visibility.Public,
    },
    {
      id: "text4",
      type: "Text",
      namespaceId: "2",
      createdById: "2",
      ...randomTimes(),
      properties: {
        text: "A paragraph of underline text",
        underline: true,
      },
      visibility: Visibility.Public,
    },
    {
      id: "text5",
      type: "Text",
      namespaceId: "6",
      createdById: "2",
      ...randomTimes(),
      properties: {
        text: "HASH's Header Text",
        bold: true,
      },
      visibility: Visibility.Public,
    },
  ];

  return entityData;
})();
