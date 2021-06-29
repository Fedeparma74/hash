import React, { useMemo, VoidFunctionComponent } from "react";
import {  TableOptions, useTable } from "react-table";
import { EditableCell } from "./components/EditableCell";
import { makeColumns } from "./lib/columns";
import { getSchemaPropertyDefinition } from "./lib/getSchemaProperty";
import { identityEntityAndProperty } from "./lib/identifyEntity";

import "./styles.scss";
import { BlockProtocolUpdateFn, JSONObject } from "./types/blockProtocol";

type AppProps = {
  data: Record<string, any>[];
  initialState?: TableOptions<{}>["initialState"];
  schemas?: Record<string, JSONObject>;
  update?: BlockProtocolUpdateFn;
};

export const App: VoidFunctionComponent<AppProps> = ({
  data,
  initialState,
  schemas,
  update,
}) => {
  const columns = useMemo(() => makeColumns(data[0]), [data[0]]);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({
      columns,
      initialState,
      data,
      defaultColumn: {
        Cell: EditableCell,
      },
      updateData: update,
    });

  // Render the UI for your table
  return (
    <table {...getTableProps()}>
      <thead>
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <th {...column.getHeaderProps()}>{column.render("Header")}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row) => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map((cell) => {
                const { column, row } = cell;
                const { entity, property } = identityEntityAndProperty(
                  row.original,
                  column.id
                );
                const propertyDef = getSchemaPropertyDefinition(
                  (schemas ?? {})[entity.type],
                  property
                );
                const readOnly = propertyDef?.readOnly;
                return (
                  <td {...cell.getCellProps()}>
                    {cell.render("Cell", { readOnly })}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
