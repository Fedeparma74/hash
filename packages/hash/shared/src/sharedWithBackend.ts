import { ReactNode } from "react";
import { Schema as JSONSchema } from "jsonschema";
import { EditorState, Transaction } from "prosemirror-state";
import { createRemoteBlock, defineRemoteBlock } from "./sharedWithBackendJs";

// @todo move this
// @ts-ignore
// @todo allow overwriting this again
import blockPaths from "../blockPaths.sample.json";
import {
  BlockMetadata,
  BlockProtocolUpdatePayload,
} from "@hashintel/block-protocol";
import { Node as ProsemirrorNode, Schema } from "prosemirror-model";
import {
  PageFieldsFragment,
  SystemTypeName,
} from "@hashintel/hash-frontend/src/graphql/apiTypes.gen";

export { blockPaths };

const fetch = (globalThis as any).fetch ?? require("node-fetch");

type BlockConfig = BlockMetadata & { url: string } & (
    | { type?: undefined }
    | {
        type: "prosemirror";
        // @todo type this
        spec: any;
      }
  );

// @todo this type properly exists already somewhere
export type Block = {
  entityId: string;
  accountId: string;
  entity: Record<any, any>;
  componentId: string;
  componentMetadata: BlockConfig;
  componentSchema: JSONSchema;
};

export type BlockMeta = Pick<Block, "componentMetadata" | "componentSchema">;

/**
 * The cache is designed to store promises, not resolved values, in order to ensure multiple requests for the same
 * block in rapid succession don't cause multiple web requests
 *
 * @deprecated in favor of react context "blockMeta" (which is not the final solution either)
 */
export const blockCache = new Map<string, Promise<BlockMeta>>();

export const builtInBlocks: Record<string, BlockMeta> = {
  // @todo maybe this should be a nodeview too
  "https://block.blockprotocol.org/paragraph": {
    componentSchema: {},
    // should adhere to output of `toBlockConfig`
    componentMetadata: {
      url: "https://block.blockprotocol.org/paragraph",
      name: "paragraph",
      type: "prosemirror",
      spec: {
        content: "text*",
        domTag: "p",
        marks: "_",
      },
      // @todo add missing metadata to the paragraph's default variant
      variants: [
        {
          name: "paragraph",
          description: "",
          icon: "path/to/icon/svg",
          properties: {},
        },
      ],
    },
  },
};

function toBlockName(packageName: string = "Unnamed") {
  return packageName.split("/").pop()!;
}

/**
 * transform mere options into a useable block configuration
 */
function toBlockConfig(options: BlockMetadata, url: string): BlockConfig {
  const defaultVariant = {
    name: toBlockName(options.name),
    description: options.description,
    icon: "path/to/icon.svg", // @todo: introduce icons to blocks
    properties: {},
  };

  const variants = options.variants?.map((variant) => ({
    ...defaultVariant,
    ...variant,
  })) ?? [defaultVariant];

  return { ...options, url, variants };
}

// @todo deal with errors, loading, abort etc.
export const fetchBlockMeta = async (url: string): Promise<BlockMeta> => {
  const mappedUrl = ((blockPaths as any)[url] ?? url) as string;
  if (builtInBlocks[mappedUrl]) {
    return builtInBlocks[mappedUrl];
  }

  if (blockCache.has(mappedUrl)) {
    return blockCache.get(mappedUrl)!;
  }

  const promise = (async () => {
    const metadata: BlockMetadata = await (
      await fetch(`${mappedUrl}/metadata.json`)
    ).json();

    const schema = await (
      await fetch(`${mappedUrl}/${metadata.schema}`)
    ).json();

    const result: BlockMeta = {
      componentMetadata: toBlockConfig(metadata, mappedUrl),
      componentSchema: schema,
    };

    return result;
  })();

  // @ts-ignore
  if (typeof window !== "undefined") {
    blockCache.set(mappedUrl, promise);
  }

  return await promise;
};

export type BlockWithoutMeta = Omit<
  Block,
  "componentMetadata" | "componentSchema"
>;

/**
 * For some reason, I wanted to strip special characters from component URLs when generating their prosemirror node id,
 * which in hindsight seems unnecessary
 *
 * @todo remove this
 */
export const componentUrlToProsemirrorId = (componentId: string) => {
  return componentId;
  // const stripped = componentId.replace(/[^a-zA-Z0-9]/g, "");
  // return stripped.slice(0, 1).toUpperCase() + stripped.slice(1);
};

/**
 * @todo this API could possibly be simpler
 */
export type ReplacePortals = (
  existingNode: HTMLElement | null,
  nextNode: HTMLElement | null,
  reactNode: ReactNode | null
) => void;

type ViewConfig = {
  view: any;
  replacePortal: ReplacePortals;
  createNodeView: Function;
} | null;

export const ensureBlockLoaded = async (
  schema: Schema,
  blockJson: { [key: string]: any },
  viewConfig: ViewConfig
) => {
  const url = blockJson.type;

  if (!url.startsWith("http")) {
    return;
  }

  await defineRemoteBlock(
    schema,
    viewConfig,
    url,
    componentUrlToProsemirrorId(url)
  );
};

export const ensureDocBlocksLoaded = async (
  schema: Schema,
  docJson: {
    [key: string]: any;
  },
  viewConfig: ViewConfig
) => {
  await Promise.all(
    (docJson.content as any[]).map(async (block) => {
      const content = block.type === "block" ? block.content?.[0] : block;

      await ensureBlockLoaded(schema, content, viewConfig);
    })
  );
};

export const replaceStateContent = (
  state: EditorState,
  newNodes: Parameters<Transaction["replaceWith"]>[2]
) => {
  const { tr } = state;

  // This creations a transaction to replace the entire content of the document
  tr.replaceWith(0, state.doc.content.size, newNodes);

  return tr;
};

export const transformBlockForProsemirror = (block: BlockWithoutMeta) => {
  const {
    children,
    childEntityId = null,
    childEntityAccountId = null,
    childEntityTypeId = null,
    childEntityVersionId = null,
    ...props
  } = block.entity;

  const attrs = {
    entityId: block.entityId,
    accountId: block.accountId,
    childEntityId,
    childEntityAccountId,
    childEntityTypeId,
    childEntityVersionId,
  };

  return { children, props, attrs };
};

/**
 * @todo replace this with a prosemirror command
 * @todo take a signal
 * @todo i think we need to put placeholders for the not-yet-fetched blocks immediately, and then have the actual
 *       blocks pop in – it being delayed too much will mess with collab
 */
export const createBlockUpdateTransaction = async (
  state: EditorState,
  contents: (Block | BlockWithoutMeta)[],
  viewConfig: ViewConfig
) => {
  const schema = state.schema;

  const newNodes = await Promise.all(
    contents?.map(async (block, index) => {
      const { children, props, attrs } = transformBlockForProsemirror(block);

      const id = componentUrlToProsemirrorId(block.componentId);

      if (cachedPropertiesByPosition[index]) {
        cachedPropertiesByEntity[block.entityId] =
          cachedPropertiesByPosition[index];
        delete cachedPropertiesByPosition[index];
      }

      // @todo pass signal through somehow
      return await createRemoteBlock(
        schema,
        viewConfig,
        block.componentId,
        id,
        {
          properties: {
            ...(cachedPropertiesByEntity[block.entityId] ?? {}),
            ...props,
          },
          ...attrs,
        },
        children?.map((child: any) => {
          if (child.type === "text") {
            return schema.text(
              child.text,
              child.marks.map((mark: string) => schema.mark(mark))
            );
          }

          // @todo recursive nodes
          throw new Error("unrecognised child");
        }) ?? [],
        undefined
      );
    }) ?? []
  );

  return replaceStateContent(state, newNodes);
};

// @todo remove the need for this
export const mapEntitiesToBlocks = (
  contents: PageFieldsFragment["properties"]["contents"]
): BlockWithoutMeta[] =>
  contents.map((content): BlockWithoutMeta => {
    const { componentId, entity } = content.properties;

    const props =
      entity.__typename === "Text"
        ? {
            /**
             * These are here to help reconstruct the database objects from the prosemirror document.
             */
            childEntityId: entity.metadataId,
            childEntityVersionId: entity.id,
            childEntityAccountId: entity.accountId,
            childEntityTypeId: entity.entityTypeId,

            children: entity.textProperties.texts.map((text) => ({
              type: "text",
              text: text.text,
              entityId: entity.metadataId,
              versionId: entity.id,
              accountId: entity.accountId,

              // This maps the boolean properties on the entity into an array of mark names
              marks: [
                ["strong", text.bold],
                ["underlined", text.underline],
                ["em", text.italics],
              ]
                .filter(([, include]) => include)
                .map(([mark]) => mark),
            })),
          }
        : entity.__typename === "UnknownEntity"
        ? {
            childEntityId: entity.metadataId,
            childEntityTypeId: entity.entityTypeId,
            childEntityVersionId: entity.id,
            ...entity.unknownProperties,
          }
        : {};

    return {
      componentId,
      entityId: content.metadataId,
      entity: props,
      accountId: content.accountId,
    };
  });

const invertedBlockPaths = Object.fromEntries(
  Object.entries(blockPaths).map(([key, value]) => [value, key])
);

export const cachedPropertiesByEntity: Record<string, Record<any, any>> = {};
const cachedPropertiesByPosition: Record<string, Record<any, any>> = {};

/**
 * @todo only need doc
 *
 * There's a bug here where when we add a new block, we think we need to update the page entity but
 * that is handled by the insert block operation, so this update here is a noop
 *
 * @todo fix this
 */
export const calculateSavePayloads = (
  accountId: string,
  pageId: string,
  metadataId: string,
  schema: Schema,
  doc: ProsemirrorNode,
  savedContents: (Block | BlockWithoutMeta)[]
) => {
  const blocks = doc
    .toJSON()
    .content.filter((block: any) => block.type === "block")
    .flatMap((block: any) => block.content) as any[];

  const mappedBlocks = blocks.map((node: any, position) => {
    const nodeType = schema.nodes[node.type];
    // @todo type this properly
    const meta = (nodeType as any).defaultAttrs
      .meta as Block["componentMetadata"];

    if (node.attrs.entityId) {
      cachedPropertiesByEntity[node.attrs.entityId] = node.attrs.properties;
    } else {
      cachedPropertiesByPosition[position] = node.attrs.properties;
    }

    const componentId = invertedBlockPaths[meta.url] ?? meta.url;

    let entity;
    if (schema.nodes[node.type].isTextblock) {
      entity = {
        type: "Text",
        id: node.attrs.childEntityId,
        versionId: node.attrs.childEntityVersionId,
        accountId: node.attrs.childEntityAccountId,
        properties: {
          texts:
            node.content
              ?.filter((child: any) => child.type === "text")
              .map((child: any) => ({
                text: child.text,
                bold:
                  child.marks?.some((mark: any) => mark.type === "strong") ??
                  false,
                italics:
                  child.marks?.some((mark: any) => mark.type === "em") ?? false,
                underline:
                  child.marks?.some(
                    (mark: any) => mark.type === "underlined"
                  ) ?? false,
              })) ?? [],
        },
      };
    } else {
      // @todo do we need to remove other props here
      const {
        childEntityId,
        childEntityAccountId,
        childEntityVersionId,
        ...props
      } = node.attrs;
      entity = {
        type: "UnknownEntity",
        id: childEntityId,
        versionId: childEntityVersionId,
        accountId: childEntityAccountId,
        properties: props,
      };
    }

    return {
      entityId: node.attrs.entityId,
      accountId: node.attrs.accountId ?? accountId,
      type: "Block",
      position,
      properties: {
        componentId,
        entity,
      },
    };
  });

  /**
   * Once we have a list of blocks, we need to divide the list of blocks into new ones and
   * updated ones, as they require different queries to handle
   */
  const existingBlockIds = savedContents.map((block) => block.entityId);
  const newBlocks = mappedBlocks.filter(
    (block) => !existingBlockIds.includes(block.entityId)
  );

  const existingBlocks = mappedBlocks.filter((block) =>
    existingBlockIds.includes(block.entityId)
  );

  const seenEntityIds = new Set<string>();

  /**
   * An updated block also contains an updated entity, so we need to create a list of
   * entities that we need to post updates to via GraphQL
   */
  const updatedEntities = existingBlocks.flatMap((node) => {
    const block = {
      type: "Block",
      id: node.entityId,
      accountId: node.accountId,
      properties: {
        componentId: node.properties.componentId,
        entityId: node.properties.entity.versionId,
        accountId: node.properties.entity.accountId,
      },
    };

    const contentNode = savedContents.find(
      (existingBlock) => existingBlock.entityId === block.id
    );

    const blocks = [];

    if (block.properties.componentId !== contentNode?.componentId) {
      blocks.push(block);
    }

    if (node.properties.entity.type === "Text") {
      if (
        !contentNode ||
        contentNode.entity.childEntityId !== node.properties.entity.id ||
        node.properties.entity.properties.texts.length !==
          contentNode.entity.children.length ||
        (node.properties.entity.properties.texts as any[]).some(
          (text: any, idx: number) => {
            const contentText = contentNode.entity.children[idx];

            /**
             * Really crude way of working out if any properties we care about have changed – we need a better way
             * of working out which text entities need an update
             */
            return (
              !contentText ||
              text.text !== contentText.text ||
              text.bold !== contentText.marks?.includes("strong") ||
              text.underline !== contentText.marks?.includes("underlined") ||
              text.italics !== contentText.marks?.includes("em")
            );
          }
        )
      ) {
        blocks.push(node.properties.entity);
      }
    }

    /**
     * Currently when the same block exists on the page in multiple locations, we prioritise the content of the
     * first one that has changed when it comes to working out if an un update is required. We need a better way of
     * handling this (i.e, take the *last* one that changed, and also more immediately sync updates between changed
     * blocks to prevent work being lost)
     *
     * @todo improve this
     */
    return blocks.filter((block) => {
      if (seenEntityIds.has(block.id)) {
        return false;
      }

      seenEntityIds.add(block.id);

      return true;
    });
  });

  /**
   * Building a promise here that updates the page block with the list of block ids it contains (if necessary, i.e,
   * when you delete or re-order blocks, and then calls insert for each new block, before updating blocks that need
   * to be updated. Ideally we would handle all of this in one query
   *
   * @todo improve this
   */
  const updatedEntitiesPayload = updatedEntities
    /**
     * Not entirely sure what I was going for with this filter
     *
     * @todo figure this out
     */
    .filter(
      (entity) =>
        (entity.properties.entityTypeName !== "Text" ||
          entity.properties.entityId) &&
        entity.id
    )
    .map(
      (entity): BlockProtocolUpdatePayload<any> => ({
        entityId: entity.id,
        data: entity.properties,
        accountId: entity.accountId,
      })
    );

  /**
   * This is a real crude way of working out if order of blocks (or if blocks have been added/removed) have changed
   * within a page, in order to work out if an update operation is needed on this list
   *
   * @todo come up with something better
   */
  const pageUpdatedPayload =
    JSON.stringify(savedContents.map((content) => content.entityId)) !==
    JSON.stringify(mappedBlocks.map((block) => block.entityId))
      ? {
          entityTypeId: "Page",
          entityId: metadataId,
          accountId,
          data: {
            contents: existingBlocks.map((node) => ({
              entityId: node.entityId,
              accountId: node.accountId,
              type: "Block",
            })),
          },
        }
      : null;

  const insertPayloads = newBlocks.map((newBlock) => ({
    // @todo this should take the user id of whoever creates it
    pageId,
    pageMetadataId: metadataId,
    position: newBlock.position,
    componentId: newBlock.properties.componentId,
    entityProperties: newBlock.properties.entity.properties,
    /** @todo handle inserting non-text blocks */
    systemTypeName: SystemTypeName.Text,
    accountId,
    versioned: true,
  }));

  return { updatedEntitiesPayload, pageUpdatedPayload, insertPayloads };
};
