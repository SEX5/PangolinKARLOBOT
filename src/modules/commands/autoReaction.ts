import * as emoji from "node-emoji";
import { join } from "path";
import * as fs from "fs";

import {
  IPangolinHandleEvent,
  IPangolinRun,
} from "src/types/type.pangolin-handle";

export default class autoReaction {
  static config = {
    category: "GROUP",
    name: "autoReaction",
    version: "1.0.0",
    author: "Lợi",

    description: {
      vi: "Tự động thả reaction khi ai đó nhắn",
      en: "Auto reaction when someone send message",
    },
    guide: {
      vi: "[prefix]autoReaction @mention [emoji] ",
      en: "[prefix]autoReaction @mention [emoji] ",
    },
  };
  static message = {
    vi: {
      tagOne: "Vui lòng tag một người!",
      chooseEmoji: "Vui lòng chọn emoji",
      turnOffCommand: "Đã tắt auto-reaction người dùng $0",
      listEmojiSupport: "Chỉ hỗ trợ các emoji: $0",
      notFoundEmoji: "Không Tồn tại emoji $0",
      responseMain: "Từ giờ cứ khi $0 nhắn thì bot sẽ reaction $1",
    },
    en: {
      tagOne: "Please tag a person!",
      chooseEmoji: "Please choose emoji",
      turnOffCommand: "Disabled auto-reaction user $0",
      listEmojiSupport: "Only emojis are supported: $0",
      notFoundEmoji: "Not found emoji $0",
      responseMain:
        "From now on, every time $0 messages, the bot will react $1",
    },
  };
  constructor(private client) {}

  pathAutoReaction = join(process.cwd(), "/src/db/data/autoReaction.json");

  async handleEvent({ api, event, client }: IPangolinHandleEvent) {
    if (event.type == "message") {
      const dataAutoReaction = fs.readFileSync(this.pathAutoReaction, {
        encoding: "utf-8",
      });
      if (dataAutoReaction) {
        const dataAutoReactionArray = JSON.parse(dataAutoReaction);
        dataAutoReactionArray.forEach((item) => {
          if (
            item.threadID == event.threadID &&
            item.userID == event.senderID
          ) {
            api.setMessageReaction(item.emoji, event.messageID, (err) => {
              if (err) return console.log(err);
            });
          }
        });
      }
    }
  }
  async run({
    api,
    event,
    client,
    args,
    UserData,
    ThreadData,
    UserInThreadData,
    getLang,
  }: IPangolinRun) {
    if (!args[1] || !event.mentions)
      return api.sendMessage(
        getLang("tagOne"),
        event.threadID,
        () => {},
        event.messageID,
      );
    const e = (event.body as string)
      .split(Object.values(event.mentions)[0] as string)[1]
      .trim();
    if (!e) return api.sendMessage(getLang("chooseEmoji"), event.threadID);
    const mention = Object.keys(event.mentions)[0];
    const listEmojiSupport = ["😍", "😆", "😮", "😢", "😠", "👍", "👎"];
    // if turn off auto-reaction
    if (e == "off") {
      const dataAutoReaction = fs.readFileSync(this.pathAutoReaction, {
        encoding: "utf-8",
      });
      if (dataAutoReaction) {
        const dataAutoReactionArray = JSON.parse(dataAutoReaction);

        const newdataAutoReactionArray = dataAutoReactionArray.filter(
          (item) => {
            return item.threadID == event.threadID && item.userID != mention;
          },
        );
        fs.writeFileSync(
          this.pathAutoReaction,
          JSON.stringify(newdataAutoReactionArray),
          {
            encoding: "utf-8",
          },
        );
      }
      return api.sendMessage(
        {
          body: getLang("turnOffCommand", Object.values(event.mentions)[0]),
          mentions: [
            {
              tag: Object.values(event.mentions)[0],
              id: mention,
              fromIndex: 10,
            },
          ],
        },
        event.threadID,
      );
    }

    // if emoji is not exits
    if (!emoji.has(e))
      return api.sendMessage(getLang("notFoundEmoji", e), event.threadID);

    if (!listEmojiSupport.includes(e))
      return api.sendMessage(
        getLang("listEmojiSupport", listEmojiSupport.join(", ")),
        event.threadID,
      );
    let autoReactionUser = [
      {
        threadID: event.threadID,
        userID: mention,
        emoji: e,
      },
    ];
    const previousAutoReactionUser = fs.readFileSync(this.pathAutoReaction, {
      encoding: "utf-8",
    });
    if (previousAutoReactionUser) {
      const previousAutoReactionUserArray = JSON.parse(
        previousAutoReactionUser,
      );

      // if duplicate data
      const isDuplicate = previousAutoReactionUserArray.some((item) => {
        return (
          item.threadID == autoReactionUser[0].threadID &&
          item.userID == autoReactionUser[0].userID &&
          item.emoji == autoReactionUser[0].emoji
        );
      });

      if (!isDuplicate) {
        autoReactionUser = autoReactionUser.concat(
          previousAutoReactionUserArray,
        );
        fs.writeFileSync(
          this.pathAutoReaction,
          JSON.stringify(autoReactionUser),
          {
            encoding: "utf-8",
          },
        );
      }
      // if change emoji
      const isChangeEmoji = previousAutoReactionUserArray.some((item) => {
        return (
          item.threadID == autoReactionUser[0].threadID &&
          item.userID == autoReactionUser[0].userID &&
          item.emoji != autoReactionUser[0].emoji
        );
      });
      if (isChangeEmoji) {
        const newAutoReactionUserArray = previousAutoReactionUserArray.map(
          (item) => {
            if (
              item.threadID == autoReactionUser[0].threadID &&
              item.userID == autoReactionUser[0].userID &&
              item.emoji != autoReactionUser[0].emoji
            ) {
              item.emoji = e;
            }
            return item;
          },
        );
        fs.writeFileSync(
          this.pathAutoReaction,
          JSON.stringify(newAutoReactionUserArray),
          {
            encoding: "utf-8",
          },
        );
      }
    }
    api.sendMessage(
      {
        body: getLang("responseMain", Object.values(event.mentions)[0], e),
        mentions: [
          {
            tag: Object.values(event.mentions)[0],
            id: mention,
            fromIndex: 10,
          },
        ],
      },
      event.threadID,
    );
  }
}
