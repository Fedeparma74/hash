import { MutationCreateOrgArgs, Resolver } from "../../apiTypes.gen";
import { Account, UnresolvedGQLEntity, Org } from "../../../model";
import { LoggedInGraphQLContext } from "../../context";

export const createOrg: Resolver<
  Promise<UnresolvedGQLEntity>,
  {},
  LoggedInGraphQLContext,
  MutationCreateOrgArgs
> = async (_, { org: orgInput, responsibility }, { dataSources, user }) =>
  dataSources.db.transaction(async (client) => {
    const { graphApi } = dataSources;
    const { shortname, name, orgSize } = orgInput;

    /** @todo: potentially deprecate these method calls depending on Graph API transaction implementation */
    await (user as any)
      .acquireLock(client)
      .then(() => (user as any).refetchLatestVersion(client));

    await Account.validateShortname(client, shortname);

    const org = await Org.createOrg(client, {
      properties: {
        shortname,
        name,
        infoProvidedAtCreation: {
          orgSize,
        },
      },
      createdByAccountId: user.entityId,
    });

    await org.acquireLock(client).then(() => org.refetchLatestVersion(client));

    await user.joinOrg(graphApi, {
      updatedByAccountId: user.accountId,
      org,
      responsibility,
    });

    return org.toGQLUnknownEntity();
  });
