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
        borderRadius="full"
        className="bg-white/20 p-1"
        onChange={(index) => setMode(index)}
      >
        <TabList>
          <Tab
            _hover={{ bg: "whiteAlpha.400" }}
            _selected={{ bg: "white", textColor: "#6B39AB" }}
            textColor="white"
            className="w-36"
          >
            Basic
          </Tab>
          <Tab
            _hover={{ bg: "whiteAlpha.400" }}
            _selected={{ bg: "white", textColor: "#6B39AB" }}
            textColor="white"
            className="w-36"
          >
            Pro
          </Tab>
        </TabList>
      </Tabs>
    </Flex>
  );
}
