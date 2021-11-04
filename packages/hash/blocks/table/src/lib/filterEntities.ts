import { BlockProtocolMultiFilter } from "@hashintel/block-protocol";
import { get } from "lodash";

export const filterEntities = (
  data: any[],
  multiFilter?: BlockProtocolMultiFilter,
) => {
  if (!multiFilter) return data;

  return data.filter((entity) => {
    const results = multiFilter.filters
      .map((filterItem) => {
        const item = get(entity, filterItem.field);

        if (typeof item !== "string") return null;

        switch (filterItem.operator) {
          case "CONTAINS":
            return item.toLowerCase().includes(filterItem.value.toLowerCase());
          case "DOES_NOT_CONTAIN":
            return !item.toLowerCase().includes(filterItem.value.toLowerCase());
          case "STARTS_WITH":
            return item
              .toLowerCase()
              .startsWith(filterItem.value.toLowerCase());
          case "ENDS_WITH":
            return item.toLowerCase().endsWith(filterItem.value.toLowerCase());
          case "IS_EMPTY":
            return !item;
          case "IS_NOT_EMPTY":
            return !!item;
          case "IS":
            return item === filterItem.value;
          case "IS_NOT":
            return item !== filterItem.value;
          default:
            return null;
        }
      })
      .filter((val) => val !== null);

    return multiFilter.operator === "OR"
      ? results.some(Boolean)
      : results.every(Boolean);
  });
};
