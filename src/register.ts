import { CyberAdmin } from "@dad1909/cybersoda";
import dotenv from "dotenv";
dotenv.config();

const userPassword = process.env.PASSWORD;

if (!userPassword) {
  throw new Error("PASSWORD must be set");
}

const cyber = new CyberAdmin(userPassword);

async function main() {
  const userName = "dathuynh"

  if (!userName) {
    console.error("Please provide a user name.");
    process.exit(1);
  }

  const userTopic = `${userName}_AI`;

  try {
    const topicsResponse = await cyber.listAllTopics();

    if (!topicsResponse.success) {
      console.error("Failed to retrieve topics:", topicsResponse.error || topicsResponse.details);
      process.exit(1);
    }

    const topics = topicsResponse.topics || [];

    if (topics.includes(userTopic)) {
      console.error("User already exists.");
      process.exit(1);
    } else {
      const createTopicResponse = await cyber.createTopics([userTopic]);
      console.log("User created successfully:", createTopicResponse);
    }
  } catch (error) {
    console.error({ error: "Operation failed", details: error });
    process.exit(1);
  }
}

main().catch((error) => {
  console.error({ error: "Main function failed", details: error });
  process.exit(1);
});