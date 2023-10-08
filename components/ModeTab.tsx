import { Mode } from "../type";
import { Flex, Spacer, Tab, TabList, Tabs } from "@chakra-ui/react";
import React, { Dispatch, SetStateAction } from "react";

type Props = {
  setMode: Dispatch<SetStateAction<Mode>>;
};

export default function ModeTab(props: Props) {
  const { setMode } = props;

  return (
    <Flex className="">
      <Spacer />
      <Tabs
        variant="soft-rounded"
        colorScheme="green"
        borderRadius="full"
        className="border-2 border-green-500"
        onChange={(index) => setMode(index)}
      >
        <TabList>
          <Tab className="w-24">Simple</Tab>
          <Tab className="w-24">Pro</Tab>
        </TabList>
      </Tabs>
    </Flex>
  );
}
