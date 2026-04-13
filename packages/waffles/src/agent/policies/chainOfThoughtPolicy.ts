import { generateText } from "ai"
import { combinePromptAndMessages } from "../text"
import type {
  AnyExpert,
  ExpertDecideInput,
  ExpertDecision,
  PromptTemplate,
} from "../types"
import { convertToXml } from "../utils"
import { toolPolicy } from "./toolPolicy"

const chainOfThoughtPromptTemplate: PromptTemplate<any> = ({
  stateValue,
  context,
  goal,
}) => {
  return `${convertToXml({ stateValue, context, goal })}

How would you achieve the goal? Think step-by-step.`
}

export async function chainOfThoughtPolicy<T extends AnyExpert>(
  expert: T,
  input: ExpertDecideInput<any>,
): Promise<ExpertDecision<any> | undefined> {
  const prompt = chainOfThoughtPromptTemplate({
    stateValue: input.state.value,
    context: input.context ?? input.state.context,
    goal: input.goal,
  })

  const messages = combinePromptAndMessages(prompt, input.messages)

  const model = input.model ? expert.wrap(input.model) : expert.model

  const result = await generateText({
    model,
    system: input.system ?? expert.description,
    messages,
  })

  const decision = await toolPolicy(expert, {
    ...input,
    messages: messages.concat(result.response.messages),
  })

  return decision
}
