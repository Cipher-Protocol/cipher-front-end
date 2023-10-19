import { ApolloClient, InMemoryCache } from '@apollo/client';
import NewCommitmentsQuery from './new-commitments-query.gql';
export const CIPHER_SUBGRAPH_URL = process.env.NEXT_PUBLIC_CIPHER_SUBGRAPH_URL as string;


export const gqlClient = new ApolloClient({
  uri: CIPHER_SUBGRAPH_URL,
  cache: new InMemoryCache(),
})

export function fetchNewCommitmentsEvents({
  tokenAddress,
  startBlock = 0
}: {
  tokenAddress: string;
  startBlock?: number;
}) {
  return gqlClient.query<{
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