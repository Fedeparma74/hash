import { VersionedUri } from "@blockprotocol/type-system";

export type EntityTypeEditorPropertyData = {
  $id: VersionedUri;
  required: boolean;
  array: boolean;
  minValue: number | string;
  maxValue: number | string;
  infinity: boolean;
};

export type EntityTypeEditorForm = {
  properties: EntityTypeEditorPropertyData[];
};