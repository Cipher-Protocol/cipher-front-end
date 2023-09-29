import { Mode } from "../type";
import { Flex, Spacer, Tab, TabList, Tabs } from "@chakra-ui/react";
import React, { Dispatch, SetStateAction } from "react";

type Props = {
  setMode: Dispatch<SetStateAction<Mode>>;
};

export default function ModeTab(props: Props) {
  const { setMode } = props;

  return (
    <Flex className="w-full flex flex-row items-center py-2 px-8">
      <Spacer />
      <Tabs
        variant="soft-rounded"
        colorScheme="green"
        borderRadius="full"
        className="rounded-full border-2 border-green-500"
        onChange={(index) => setMode(index)}
      >
        <TabList>
          <Tab className="w-32">Simple</Tab>
          <Tab className="w-32">Pro</Tab>
        </TabList>
      </Tabs>
    </Flex>
  );
}
