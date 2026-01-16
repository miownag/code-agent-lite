import { Messages } from '@langchain/langgraph';
import { createDeepAgent, DeepAgent } from 'deepagents';

class CodeAgent {
  private agent: DeepAgent;

  constructor() {
    this.agent = createDeepAgent({
      tools: [],
    });
  }

  async run(messages: Messages) {
    return this.agent.invoke({
      messages,
    });
  }
}

export default new CodeAgent();
