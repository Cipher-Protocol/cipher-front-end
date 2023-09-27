import { Mode } from "@/type";
import { Flex, Spacer, Tab, TabList, Tabs } from "@chakra-ui/react";
import React, { Dispatch, SetStateAction } from "react";

type Props = {
  setMode: Dispatch<SetStateAction<Mode>>;
};

export default function ModeTab(props: Props) {
  const { setMode } = props;

  return (
    <Flex w="full" align="center" gap="2" py="2" pr="8">
      <Spacer />
      <Tabs
        variant="soft-rounded"
        colorScheme="green"
        borderRadius="full"
        border={"3px solid #38A169"}
        onChange={(index) => setMode(index)}
      >
        <TabList>
          <Tab w={"8rem"}>Simple</Tab>
          <Tab w={"8rem"}>Pro</Tab>
        </TabList>
      </Tabs>
    </Flex>
  );
}
