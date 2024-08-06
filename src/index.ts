import { CyberCloud, CyberAdmin } from "@dad1909/cybersoda";
import dotenv from "dotenv";
import readline from "readline";
import { AIMessage } from "./types";
dotenv.config();

const userPassword = process.env.PASSWORD;
if (!userPassword) {
  throw new Error("PASSWORD must be set");
}

const cyber = new CyberAdmin(userPassword);

const login = async (): Promise<CyberCloud> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question("Enter your username: ", async (inputName: string) => {
      const userTopic = `${inputName}_AI`;
      try {
        const topicsResponse = await cyber.listAllTopics();

        if (!topicsResponse.success) {
          console.error("Failed to retrieve topics:", topicsResponse.error || topicsResponse.details);
          rl.close();
          reject(new Error("Failed to retrieve topics"));
        }

        const topics = topicsResponse.topics || [];
        
        if (!topics.includes(userTopic)) {
          console.error("User does not exist.");
          rl.close();
          reject(new Error("User does not exist"));
        } else {
          const cloud = new CyberCloud(userPassword, inputName);
          rl.close();
          resolve(cloud);
        }
      } catch (error) {
        console.error({ error: "Operation failed", details: error });
        rl.close();
        reject(error);
      }
    });
  });
};

const produceMessage = async (
  cloud: CyberCloud,
  data: any
): Promise<{
  error?: string;
  success?: boolean;
  message?: string;
  details?: any;
}> => {
  const transaction = await cloud.producer.transaction();
  try {
    const produceResponse = await cloud.sendMessage(transaction, 1, data);
    if (produceResponse.error) {
      await transaction.abort();
      return {
        error: `Failed to send message to topic`,
        details: produceResponse.details,
      };
    }
    await transaction.commit();
    return { success: true, message: `Message sent to topic` };
  } catch (error) {
    await transaction.abort();
    return { error: `Failed to send message to topic`, details: error };
  }
};

const consumeMessages = async (
  cloud: CyberCloud
): Promise<{
  error?: string;
  success?: boolean;
  message?: string;
  details?: any;
}> => {
  try {
    await cloud.getMessage((message) => {
      console.log(message);
    });
    return { success: true, message: "Consumer started successfully" };
  } catch (error) {
    return { error: `Failed to consume message`, details: error };
  }
};

const startCLI = (cloud: CyberCloud) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "Enter to send message",
  });
  rl.prompt();
  rl.on("line", async (line) => {
    try {
      const messageSend: AIMessage = {
        username: "dathuynh",
        message: '"io.on(\"connection\", (socket) => { socket.on(\"error\", () => { // ... }); });"',
        modelType: "Message",
        type: "vulnerable",
        lendata: 1024,
      };
      const produceResponse = await produceMessage(cloud, messageSend);
      if (produceResponse.error) {
        console.error(produceResponse);
      } else {
        console.log(produceResponse);
      }
    } catch (error) {
      console.error({
        error: "Invalid input. Please enter to send message.",
        details: error,
      });
    }
    rl.prompt();
  }).on("close", () => {
    console.log("Exiting...");
    process.exit(0);
  });
};

(async () => {
  try {
    const cloud = await login();
    await cloud.startProducer();
    const consumeResponse = await consumeMessages(cloud);
    if (consumeResponse.error) {
      console.error(consumeResponse);
    } else {
      startCLI(cloud);
    }
  } catch (error) {
    console.error("Login failed:");
    process.exit(1);
  }
})();