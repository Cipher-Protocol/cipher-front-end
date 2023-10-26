import { ApolloClient, InMemoryCache } from '@apollo/client';
import NewCommitmentsQuery from './new-commitments-query.gql';

export function initializeGqlClient(clientUrl: string) {
  return new ApolloClient({
    uri: clientUrl,
    cache: new InMemoryCache(),
  });
}

export class CipherSubgraph {
  client!: ApolloClient<any>;
  constructor(
    public readonly clientUrl: string,
  ) {
    this.client = initializeGqlClient(clientUrl);
  }

  fetchNewCommitmentsEvents({
    tokenAddress,
    startBlock = 0
  }: {
    tokenAddress: string;
    startBlock?: number;
  }) {
    return this.client.query<{
      newCommitments: Array<{
        blockNumber: string,
        leafIndex: string,
        commitment: string,
        newRoot?: string,
      }>
    }>({
      query: NewCommitmentsQuery,
      variables: {
        tokenAddress: tokenAddress,
        startBlock: startBlock
      }
    });
  }
}
