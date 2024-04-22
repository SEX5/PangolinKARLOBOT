import { IPangolinRun } from "src/types/type.pangolin-handle";

export default class UidCommand {
  static config = {
    category: "GROUP",
    name: "uid",
    version: "1.0.0",
    author: "Lợi",
    description: {
      vi: "Lấy uid của mình hoặc của người khác",
      en: "Get your own or someone else's uid",
    },
    guide: {
      vi: "[prefix]uid or [prefix]uid @mentions",
      en: "[prefix]uid or [prefix]uid @mentions",
    },
  };

  constructor(private client) {}
  async run({ api, event, client, args }: IPangolinRun) {
    if (!args[1]) return api.sendMessage(event.senderID, event.threadID);
    const propertyValues = Object.keys(event.mentions);
    propertyValues.forEach((item) => {
      api.sendMessage(item, event.threadID);
    });
  }
}
