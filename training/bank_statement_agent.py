# Bank Statement Analysis Agent for Agent Lightning Training
import asyncio
import json
from typing import Any, Dict
from openai import AsyncOpenAI
import agentlightning as agl


# Load the system prompt
with open("../bank-statement-agent-lightning-training-system-prompt.txt", "r") as f:
    SYSTEM_PROMPT_TEMPLATE = f.read()


class BankStatementTask:
    """Task definition for bank statement analysis"""
    def __init__(self, statement_text: str, borrower_info: Dict[str, str], expected_output: Dict[str, Any]):
        self.statement_text = statement_text
        self.borrower_info = borrower_info
        self.expected_output = expected_output
        self.task_id = f"task_{hash(statement_text[:100])}"


async def bank_statement_agent(task: BankStatementTask, prompt_template: str) -> Dict[str, Any]:
    """
    The bank statement analysis agent that will be optimized by Agent Lightning.

    Args:
        task: The bank statement analysis task
        prompt_template: The system prompt template (will be optimized)

    Returns:
        Analysis result as JSON
    """
    # Get the prompt template from resources
    system_prompt = agl.get_resource("prompt_template", default=prompt_template)

    # Construct the borrower context
    borrower_context = f"""
--- BORROWER AND BUSINESS CONTEXT ---
Client Name: {task.borrower_info.get('clientName', '')}
Business Name: {task.borrower_info.get('businessName', '')}
Ownership %: {task.borrower_info.get('ownershipPercentage', 'Not Provided')}
Type of Business: {task.borrower_info.get('businessType', '')}
Number of Full Time Employees: {task.borrower_info.get('numEmployees', 'Not Provided')}
Business Description/Notes: {task.borrower_info.get('businessDescription', 'Not Provided')}
--- END OF CONTEXT ---
"""

    # Construct the full prompt
    full_prompt = f"{borrower_context}\n\n{system_prompt}\n\nHere is the text extracted from the bank statements:\n\n{task.statement_text}"

    # Create OpenAI client
    client = AsyncOpenAI()

    # Call the API with tracing
    with agl.begin_span(
        "bank_statement_analysis",
        span_type="agent",
        inputs={"statement_text": task.statement_text[:500], "borrower_info": task.borrower_info}
    ) as span:
        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a financial analysis assistant specializing in bank statement analysis."},
                    {"role": "user", "content": full_prompt}
                ],
                temperature=0.1,
            )

            result_text = response.choices[0].message.content

            # Try to parse as JSON
            try:
                result = json.loads(result_text)
            except json.JSONDecodeError:
                # If not valid JSON, wrap it
                result = {"raw_output": result_text, "error": "Failed to parse as JSON"}

            # Calculate reward based on expected output
            reward = calculate_reward(result, task.expected_output)

            # Emit reward for Agent Lightning
            span.set_reward(reward)
            span.set_output(result)

            return result

        except Exception as e:
            span.set_reward(-1.0)  # Penalize errors
            span.set_output({"error": str(e)})
            raise


def calculate_reward(result: Dict[str, Any], expected: Dict[str, Any]) -> float:
    """
    Calculate reward score by comparing result with expected output.

    This is a simplified reward function - you should customize it based on your specific needs.
    """
    if "error" in result:
        return -1.0

    reward = 0.0
    max_reward = 5.0

    # Check if key fields are present
    required_fields = ["analysisSummary", "qualifiedIncomeCalculation", "deposits", "timePeriodAggregates", "risk"]
    for field in required_fields:
        if field in result:
            reward += 0.5

    # Check if deposits array is populated
    if "deposits" in result and isinstance(result["deposits"], list) and len(result["deposits"]) > 0:
        reward += 1.0

    # Check if qualified income calculation is present
    if "qualifiedIncomeCalculation" in result and "monthlyAverageNetDeposits" in result["qualifiedIncomeCalculation"]:
        reward += 1.0

    # Normalize to 0-1 range
    return min(reward / max_reward, 1.0)


def prompt_template_baseline() -> str:
    """Return the baseline prompt template"""
    return SYSTEM_PROMPT_TEMPLATE


def load_bank_statement_tasks(jsonl_path: str = "training_data.jsonl"):
    """Load training tasks from JSONL file"""
    tasks = []
    try:
        with open(jsonl_path, 'r') as f:
            for line in f:
                data = json.loads(line)
                task = BankStatementTask(
                    statement_text=data['statement_text'],
                    borrower_info=data['borrower_info'],
                    expected_output=data['expected_output']
                )
                tasks.append(task)
    except FileNotFoundError:
        print(f"Training data file not found: {jsonl_path}")
        print("Please create a training_data.jsonl file with your training examples")

    return tasks


if __name__ == "__main__":
    # Test the agent
    async def test():
        task = BankStatementTask(
            statement_text="Sample bank statement text...",
            borrower_info={
                "clientName": "John Doe",
                "businessName": "Test LLC",
                "ownershipPercentage": "100",
                "businessType": "Retail",
                "numEmployees": "5",
                "businessDescription": "Test business"
            },
            expected_output={}
        )
        result = await bank_statement_agent(task, prompt_template_baseline())
        print(json.dumps(result, indent=2))

    asyncio.run(test())
