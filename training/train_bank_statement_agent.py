# Agent Lightning Training Script for Bank Statement Analysis
# This script uses APO (Automatic Prompt Optimization) to optimize the system prompt

import logging
from typing import Tuple, cast
from openai import AsyncOpenAI

from bank_statement_agent import (
    BankStatementTask,
    bank_statement_agent,
    load_bank_statement_tasks,
    prompt_template_baseline
)

from agentlightning import Trainer, configure_logger
from agentlightning.adapter import TraceToMessages
from agentlightning.algorithm.apo import APO
from agentlightning.types import Dataset


def load_train_val_dataset() -> Tuple[Dataset[BankStatementTask], Dataset[BankStatementTask]]:
    """Load and split the dataset into training and validation sets"""
    dataset_full = load_bank_statement_tasks("training_data.jsonl")

    if len(dataset_full) == 0:
        print("ERROR: No training data found!")
        print("Please create a training_data.jsonl file with your training examples.")
        print("\nExample format:")
        print("""
{
  "statement_text": "Bank: ABC Bank\\nAccount ending in 1234\\nDate: 01/15/2024, Description: Deposit, Amount: $5,000.00\\n...",
  "borrower_info": {
    "clientName": "John Doe",
    "businessName": "Doe Enterprises LLC",
    "ownershipPercentage": "75",
    "businessType": "Professional Services",
    "numEmployees": "3",
    "businessDescription": "Consulting services"
  },
  "expected_output": {
    "analysisSummary": {...},
    "qualifiedIncomeCalculation": {...},
    "deposits": [...],
    "timePeriodAggregates": {...},
    "risk": [...]
  }
}
""")
        exit(1)

    # Split dataset (80% train, 20% validation)
    train_split = int(len(dataset_full) * 0.8)
    dataset_train = [dataset_full[i] for i in range(train_split)]
    dataset_val = [dataset_full[i] for i in range(train_split, len(dataset_full))]

    print(f"Loaded {len(dataset_train)} training examples and {len(dataset_val)} validation examples")

    return cast(Dataset[BankStatementTask], dataset_train), cast(Dataset[BankStatementTask], dataset_val)


def setup_training_logger(file_path: str = "training.log") -> None:
    """Set up logging to file for training process"""
    file_handler = logging.FileHandler(file_path)
    file_handler.setLevel(logging.INFO)
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s - %(message)s")
    file_handler.setFormatter(formatter)

    # Add handler to both APO and root logger
    logging.getLogger("agentlightning.algorithm.apo").addHandler(file_handler)
    logging.getLogger("agentlightning.trainer").addHandler(file_handler)


def main() -> None:
    """Main training function"""
    print("="*80)
    print("Bank Statement Analysis Agent - Agent Lightning Training")
    print("="*80)
    print("\nInitializing training environment...")

    # Configure logging
    configure_logger()
    setup_training_logger()

    # Create OpenAI client
    openai_client = AsyncOpenAI()

    print("\nConfiguring APO (Automatic Prompt Optimization) algorithm...")
    print("  - Beam width: 3 (number of prompt variants to maintain)")
    print("  - Branch factor: 2 (new variants per beam)")
    print("  - Beam rounds: 3 (optimization iterations)")
    print("  - Validation batch size: 5")
    print("  - Gradient batch size: 3")

    # Configure APO algorithm
    algo = APO[BankStatementTask](
        openai_client,
        val_batch_size=5,          # Number of validation samples per evaluation
        gradient_batch_size=3,     # Number of samples for computing gradient
        beam_width=3,              # Number of prompt variants to keep
        branch_factor=2,           # Number of new variants to generate per round
        beam_rounds=3,             # Number of optimization rounds
        _poml_trace=True,          # Enable detailed tracing
    )

    print("\nConfiguring trainer...")
    print("  - Runners: 4 (parallel rollouts)")
    print("  - Using baseline prompt from system prompt file")

    # Configure trainer
    trainer = Trainer(
        algorithm=algo,
        n_runners=4,  # Number of parallel runners
        initial_resources={
            "prompt_template": prompt_template_baseline()
        },
        adapter=TraceToMessages(),  # Convert traces to messages for APO
    )

    print("\nLoading datasets...")
    dataset_train, dataset_val = load_train_val_dataset()

    if len(dataset_train) == 0:
        print("ERROR: No training data available. Exiting...")
        return

    print("\n" + "="*80)
    print("STARTING TRAINING")
    print("="*80)
    print("\nThis will:")
    print("  1. Run the agent on training examples with different prompt variations")
    print("  2. Calculate rewards based on output quality")
    print("  3. Optimize the system prompt to maximize rewards")
    print("  4. Validate on held-out examples")
    print("\nTraining progress will be logged to 'training.log'")
    print("Press Ctrl+C to stop training early\n")

    try:
        # Start training
        trainer.fit(
            agent=bank_statement_agent,
            train_dataset=dataset_train,
            val_dataset=dataset_val
        )

        print("\n" + "="*80)
        print("TRAINING COMPLETED SUCCESSFULLY")
        print("="*80)
        print("\nOptimized prompts have been saved.")
        print("Check the training.log file for detailed results.")
        print("\nNext steps:")
        print("  1. Review the optimized prompts in the output")
        print("  2. Test the optimized prompts with real data")
        print("  3. Integrate the best prompt back into your application")

    except KeyboardInterrupt:
        print("\n\nTraining interrupted by user.")
        print("Partial results may be available in training.log")

    except Exception as e:
        print(f"\n\nERROR during training: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
