import gql from "graphql-tag";
import { linkFieldsFragment } from "./link.queries";

export const getEntity = gql`
  query getEntity($accountId: ID!, $entityId: ID!) {
    entity(accountId: $accountId, entityId: $entityId) {
      __typename
      createdByAccountId
      createdAt
      entityId
      entityVersionId
      entityTypeId
      entityTypeVersionId
      entityTypeName
      linkGroups {
        links {
          ...LinkFields
        }
        sourceEntityId
        sourceEntityVersionId
        path
      }
      linkedEntities {
        accountId
        entityId
        entityTypeId
        properties
      }
      updatedAt
      accountId
      ... on UnknownEntity {
        properties
      }
      entityType {
        entityId
        properties
      }
      visibility
    }
  }
  ${linkFieldsFragment}
`;

export const createEntity = gql`
  mutation createEntity(
    $accountId: ID!
    $properties: JSONObject!
    $entityTypeId: ID
    $entityTypeVersionId: ID
    $systemTypeName: SystemTypeName
    $versioned: Boolean! = true
  ) {
    createEntity(
      accountId: $accountId
      properties: $properties
      entityTypeId: $entityTypeId
      entityTypeVersionId: $entityTypeVersionId
      systemTypeName: $systemTypeName
      versioned: $versioned
    ) {
      __typename
      id
      createdByAccountId
      createdAt
      entityId
      entityTypeId
      entityTypeVersionId
      entityTypeName
      updatedAt
      accountId
      ... on UnknownEntity {
        properties
      }
      visibility
    }
  }
`;

export const updateEntity = gql`
  mutation updateEntity(
    $accountId: ID!
    $entityId: ID!
    $properties: JSONObject!
  ) {
    updateEntity(
      accountId: $accountId
      entityId: $entityId
      properties: $properties
    ) {
      __typename
      id
      entityId
      entityTypeId
      entityTypeVersionId
      entityTypeName
      updatedAt
      ... on UnknownEntity {
        properties
      }
    }
  }
`;

export const aggregateEntity = gql`
  query aggregateEntity($accountId: ID!, $operation: AggregateOperationInput!) {
    aggregateEntity(accountId: $accountId, operation: $operation) {
      __typename
      results {
        __typename
        id
        accountId
        entityId
        entityTypeId
        entityTypeVersionId
        entityTypeName
        properties
      }
      operation {
        pageNumber
        pageCount
        itemsPerPage
        multiSort {
          field
          desc
        }
        multiFilter {
          operator
          filters {
            field
            value
            operator
          }
        }
      }
    }
  }
`;